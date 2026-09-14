<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\CurrencyExchangeRate;
use App\Modules\Accounting\Models\FxRevaluation;
use App\Modules\Accounting\Models\FxRevaluationLine;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\JournalEntryLine;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class FxRevaluationService
{
    public function __construct(
        protected ?SamaExchangeRateService $samaService = null
    ) {
        $this->samaService = $this->samaService ?? app(SamaExchangeRateService::class);
    }

    /**
     * Default exchange rate fallbacks when no historical rate is seeded.
     */
    protected array $defaultRates = [
        'USD' => 3.750000,
        'EUR' => 4.050000,
        'GBP' => 4.850000,
        'AED' => 1.021000,
        'KWD' => 12.250000,
        'BHD' => 9.950000,
        'OMR' => 9.740000,
        'QAR' => 1.030000,
        'SAR' => 1.000000,
    ];

    /**
     * Save a currency spot exchange rate.
     */
    public function recordExchangeRate(
        string $companyId,
        string $tenantId,
        string $fromCurrency,
        float $rate,
        ?string $effectiveDate = null,
        string $source = 'manual'
    ): CurrencyExchangeRate {
        $date = $effectiveDate ?? now()->toDateString();

        return CurrencyExchangeRate::updateOrCreate(
            [
                'company_id' => $companyId,
                'from_currency' => strtoupper($fromCurrency),
                'to_currency' => 'SAR',
                'effective_date' => $date,
            ],
            [
                'tenant_id' => $tenantId,
                'rate' => $rate,
                'source' => $source,
            ]
        );
    }

    /**
     * Retrieve the closing spot rate as of a given date.
     */
    public function getClosingRate(string $companyId, string $currency, ?string $asOfDate = null): float
    {
        $currency = strtoupper($currency);
        if ($currency === 'SAR') {
            return 1.0;
        }

        $date = $asOfDate ?? now()->toDateString();

        $rateRecord = CurrencyExchangeRate::where('company_id', $companyId)
            ->where('from_currency', $currency)
            ->where('to_currency', 'SAR')
            ->where('effective_date', '<=', $date)
            ->latest('effective_date')
            ->first();

        if ($rateRecord) {
            return (float) $rateRecord->rate;
        }

        return $this->defaultRates[$currency] ?? $this->samaService->getOfficialRate($currency, $date);
    }

    /**
     * Calculate and preview unrealized FX gain/loss across monetary accounts.
     */
    public function calculateRevaluation(string $companyId, string $tenantId, ?string $closingDate = null): array
    {
        $date = $closingDate ?? now()->toDateString();

        // Find accounts with foreign currencies or foreign currency transactions
        $foreignAccounts = Account::where('company_id', $companyId)
            ->where(function ($q) {
                $q->where('currency', '!=', 'SAR')
                    ->whereNotNull('currency');
            })
            ->where('is_postable', true)
            ->get();

        $lines = [];
        $totalGain = 0.0;
        $totalLoss = 0.0;

        foreach ($foreignAccounts as $account) {
            $currency = $account->currency;
            $closingRate = $this->getClosingRate($companyId, $currency, $date);

            // Compute balance:
            // Foreign balance is either stored in account->current_balance or derived from journal lines
            $foreignBalance = (float) $account->current_balance;
            if ($foreignBalance == 0) {
                // Check if journal lines have foreign amount
                $sumDebit = (float) JournalEntryLine::where('account_id', $account->id)
                    ->where('currency', $currency)
                    ->sum('foreign_amount');
                $sumCredit = (float) JournalEntryLine::where('account_id', $account->id)
                    ->where('currency', $currency)
                    ->sum('credit'); // or foreign amount
                $foreignBalance = in_array($account->type, ['asset', 'expense']) ? ($sumDebit - $sumCredit) : ($sumCredit - $sumDebit);
            }

            if ($foreignBalance == 0) {
                continue;
            }

            // Historical/Book SAR value:
            // Book amount in SAR is current balance converted at historical average or historical JV lines
            $historicalSarSum = (float) JournalEntryLine::where('account_id', $account->id)
                ->select(DB::raw('SUM(debit) - SUM(credit) as net_sar'))
                ->value('net_sar');

            if ($account->type === 'liability') {
                $historicalSarSum = -$historicalSarSum;
            }

            if ($historicalSarSum == 0) {
                // Fallback: use default rate if no prior entries
                $bookRate = $this->defaultRates[$currency] ?? 3.75;
                $historicalSarSum = $foreignBalance * $bookRate;
            } else {
                $bookRate = abs($foreignBalance) > 0 ? abs($historicalSarSum / $foreignBalance) : $closingRate;
            }

            $revaluedAmountSar = round($foreignBalance * $closingRate, 4);
            $diffSar = round($revaluedAmountSar - $historicalSarSum, 4);

            $isAsset = in_array($account->type, ['asset']);
            $isLiability = in_array($account->type, ['liability']);

            if ($isAsset) {
                $gainLossType = $diffSar > 0 ? 'gain' : ($diffSar < 0 ? 'loss' : 'neutral');
                $adjustment = abs($diffSar);
            } else {
                // For liabilities, an increase in SAR is a LOSS; a decrease is a GAIN
                $gainLossType = $diffSar < 0 ? 'gain' : ($diffSar > 0 ? 'loss' : 'neutral');
                $adjustment = abs($diffSar);
            }

            if ($gainLossType === 'gain') {
                $totalGain += $adjustment;
            } elseif ($gainLossType === 'loss') {
                $totalLoss += $adjustment;
            }

            $lines[] = [
                'account_id' => $account->id,
                'account_code' => $account->code,
                'account_name' => $account->name_ar ?: $account->name,
                'account_type' => $account->type,
                'currency' => $currency,
                'foreign_balance' => $foreignBalance,
                'book_exchange_rate' => round($bookRate, 6),
                'closing_exchange_rate' => round($closingRate, 6),
                'book_amount_sar' => round($historicalSarSum, 4),
                'revalued_amount_sar' => $revaluedAmountSar,
                'adjustment_amount_sar' => round($diffSar, 4),
                'gain_loss_type' => $gainLossType,
            ];
        }

        $netAdjustment = round($totalGain - $totalLoss, 4);

        return [
            'date' => $date,
            'lines' => $lines,
            'total_gain' => round($totalGain, 4),
            'total_loss' => round($totalLoss, 4),
            'net_adjustment' => $netAdjustment,
        ];
    }

    /**
     * Generate, store and post an automated FX Revaluation Batch with Journal Entry.
     */
    public function createAndPostRevaluation(
        string $companyId,
        string $tenantId,
        ?string $closingDate = null,
        ?int $userId = null,
        ?string $notes = null
    ): FxRevaluation {
        return DB::transaction(function () use ($companyId, $tenantId, $closingDate, $userId, $notes) {
            $date = $closingDate ?? now()->toDateString();
            $calculation = $this->calculateRevaluation($companyId, $tenantId, $date);

            $revalNumber = 'FX-REV-'.date('Ym', strtotime($date)).'-'.strtoupper(substr(uniqid(), -4));

            // Accounts for Gain and Loss
            $gainAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '4400'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Unrealized FX Gains',
                    'name_ar' => 'أرباح فروقات أسعار صرف غير محققة',
                    'type' => 'revenue',
                    'subtype' => 'other_income',
                    'is_postable' => true,
                ]
            );

            $lossAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '5400'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Unrealized FX Losses',
                    'name_ar' => 'خسائر فروقات أسعار صرف غير محققة',
                    'type' => 'expense',
                    'subtype' => 'other_expense',
                    'is_postable' => true,
                ]
            );

            $revaluation = FxRevaluation::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'revaluation_number' => $revalNumber,
                'date' => $date,
                'status' => 'draft',
                'total_gain' => $calculation['total_gain'],
                'total_loss' => $calculation['total_loss'],
                'net_adjustment' => $calculation['net_adjustment'],
                'created_by_id' => $userId,
                'notes' => $notes ?: "إعادة تقييم أرصدة العملات الأجنبية في نهاية الفترة {$date}",
            ]);

            foreach ($calculation['lines'] as $line) {
                FxRevaluationLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'fx_revaluation_id' => $revaluation->id,
                    'account_id' => $line['account_id'],
                    'currency' => $line['currency'],
                    'foreign_balance' => $line['foreign_balance'],
                    'book_exchange_rate' => $line['book_exchange_rate'],
                    'closing_exchange_rate' => $line['closing_exchange_rate'],
                    'book_amount_sar' => $line['book_amount_sar'],
                    'revalued_amount_sar' => $line['revalued_amount_sar'],
                    'adjustment_amount_sar' => $line['adjustment_amount_sar'],
                    'gain_loss_type' => $line['gain_loss_type'],
                ]);
            }

            // Post Automated Journal Entry if there are adjustments
            if ($calculation['total_gain'] > 0 || $calculation['total_loss'] > 0) {
                $entry = JournalEntry::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'entry_number' => 'JV-FX-'.strtoupper(uniqid()),
                    'date' => $date,
                    'description' => "قيد تسوية فروقات أسعار صرف العملات الأجنبية غير المحققة لشهر {$date}",
                    'status' => 'posted',
                ]);

                foreach ($calculation['lines'] as $line) {
                    $absAmount = abs((float) $line['adjustment_amount_sar']);
                    if ($absAmount <= 0) {
                        continue;
                    }

                    $account = Account::find($line['account_id']);
                    $isAsset = in_array($account->type, ['asset']);

                    if ($line['gain_loss_type'] === 'gain') {
                        // GAIN:
                        // If Asset: DR Asset Account / CR Gain Account (4400)
                        // If Liability: DR Liability Account / CR Gain Account (4400)
                        JournalEntryLine::create([
                            'tenant_id' => $tenantId,
                            'company_id' => $companyId,
                            'journal_entry_id' => $entry->id,
                            'account_id' => $line['account_id'],
                            'debit' => $absAmount,
                            'credit' => 0,
                            'description' => "أرباح تقييم عملة ({$line['currency']}) - الحساب {$account->code}",
                        ]);

                        JournalEntryLine::create([
                            'tenant_id' => $tenantId,
                            'company_id' => $companyId,
                            'journal_entry_id' => $entry->id,
                            'account_id' => $gainAccount->id,
                            'debit' => 0,
                            'credit' => $absAmount,
                            'description' => "أرباح فروقات أسعار صرف غير محققة - تقييم {$date}",
                        ]);
                    } elseif ($line['gain_loss_type'] === 'loss') {
                        // LOSS:
                        // If Asset: DR Loss Account (5400) / CR Asset Account
                        // If Liability: DR Loss Account (5400) / CR Liability Account
                        JournalEntryLine::create([
                            'tenant_id' => $tenantId,
                            'company_id' => $companyId,
                            'journal_entry_id' => $entry->id,
                            'account_id' => $lossAccount->id,
                            'debit' => $absAmount,
                            'credit' => 0,
                            'description' => "خسائر فروقات أسعار صرف غير محققة - تقييم {$date}",
                        ]);

                        JournalEntryLine::create([
                            'tenant_id' => $tenantId,
                            'company_id' => $companyId,
                            'journal_entry_id' => $entry->id,
                            'account_id' => $line['account_id'],
                            'debit' => 0,
                            'credit' => $absAmount,
                            'description' => "خسائر تقييم عملة ({$line['currency']}) - الحساب {$account->code}",
                        ]);
                    }
                }

                $revaluation->journal_entry_id = $entry->id;
                $revaluation->status = 'posted';
                $revaluation->save();
            }

            return $revaluation->fresh(['lines.account', 'journalEntry.lines.account']);
        });
    }

    /**
     * Reverse an existing posted FX revaluation at the start of next period.
     */
    public function reverseRevaluation(string $revaluationId, ?string $reversalDate = null): FxRevaluation
    {
        return DB::transaction(function () use ($revaluationId, $reversalDate) {
            /** @var FxRevaluation $reval */
            $reval = FxRevaluation::with('journalEntry.lines')->findOrFail($revaluationId);

            if ($reval->status !== 'posted' || ! $reval->journalEntry) {
                throw new InvalidArgumentException('Revaluation must be in posted status with a journal entry.');
            }

            $date = $reversalDate ?? now()->toDateString();

            // Create Reversing Journal Entry
            $reversalEntry = JournalEntry::create([
                'tenant_id' => $reval->tenant_id,
                'company_id' => $reval->company_id,
                'entry_number' => 'JV-FX-REV-'.strtoupper(uniqid()),
                'date' => $date,
                'description' => "عكس قيد تسوية فروقات العملات للدفعة {$reval->revaluation_number}",
                'status' => 'posted',
            ]);

            // Invert debit and credit lines
            foreach ($reval->journalEntry->lines as $line) {
                JournalEntryLine::create([
                    'tenant_id' => $reval->tenant_id,
                    'company_id' => $reval->company_id,
                    'journal_entry_id' => $reversalEntry->id,
                    'account_id' => $line->account_id,
                    'debit' => $line->credit,
                    'credit' => $line->debit,
                    'description' => "عكس: {$line->description}",
                ]);
            }

            $reval->reversal_journal_entry_id = $reversalEntry->id;
            $reval->status = 'reversed';
            $reval->save();

            return $reval->fresh(['journalEntry', 'reversalJournalEntry']);
        });
    }
}
