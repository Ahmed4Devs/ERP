<?php

namespace App\Modules\Trade\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Platform\Services\AuditLogger;
use App\Modules\Trade\Models\SalesCommissionRun;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SettleCommissionRunAction
{
    public function __construct(
        protected ?PostingEngine $postingEngine = null
    ) {
        $this->postingEngine = $postingEngine ?? app(PostingEngine::class);
    }

    /**
     * Settle a Sales Commission Run:
     * 1. Post Accrual Entry:
     *    DR 5130 (Sales Commissions Expense / مصروف عمولات البيع)
     *    CR 2040 (Accrued Sales Commissions / مستحقات عمولات البيع)
     * 2. Post Bank Disbursement Entry:
     *    DR 2040 (Accrued Sales Commissions)
     *    CR 1020 (Bank Account / الحساب البنكي)
     */
    public function execute(SalesCommissionRun $run, ?int $userId = null, bool $disburseFromBank = true): SalesCommissionRun
    {
        if ($run->status === 'settled') {
            throw new InvalidArgumentException("Commission Run [{$run->run_number}] is already settled.");
        }

        return DB::transaction(function () use ($run, $userId, $disburseFromBank) {
            $companyId = $run->company_id;
            $tenantId = $run->tenant_id;
            $date = now()->toDateString();
            $netPayable = (float) $run->total_net_payable;

            $netPayableStr = number_format($netPayable, 6, '.', '');

            // 1. Ensure Required General Ledger Accounts Exist with is_postable = true
            // Expense Account 5130
            $expenseAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '5130'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Sales Commissions & Distribution Expense',
                    'name_ar' => 'مصروف عمولات البيع والتوزيع',
                    'type' => 'expense',
                    'subtype' => 'operating_expense',
                    'is_postable' => true,
                    'is_system' => true,
                    'current_balance' => '0.000000',
                ]
            );
            if (! $expenseAccount->is_postable) {
                $expenseAccount->update(['is_postable' => true]);
            }

            // Liability Account 2040
            $liabilityAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '2040'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Accrued Sales Commissions Payable',
                    'name_ar' => 'مستحقات عمولات البيع والتسويق',
                    'type' => 'liability',
                    'subtype' => 'current_liability',
                    'is_postable' => true,
                    'is_system' => true,
                    'current_balance' => '0.000000',
                ]
            );
            if (! $liabilityAccount->is_postable) {
                $liabilityAccount->update(['is_postable' => true]);
            }

            // Bank Account 1020
            $bankAccount = Account::where('company_id', $companyId)->where('code', '1020')->first()
                ?? Account::where('company_id', $companyId)->whereIn('code', ['1010', '2030'])->first();
            if (! $bankAccount) {
                $bankAccount = Account::create([
                    'company_id' => $companyId,
                    'tenant_id' => $tenantId,
                    'code' => '1020',
                    'name' => 'Main Corporate Bank Account',
                    'name_ar' => 'الحساب البنكي الرئيسي',
                    'type' => 'asset',
                    'subtype' => 'bank',
                    'currency' => 'SAR',
                    'is_postable' => true,
                    'is_system' => true,
                    'current_balance' => '0.000000',
                ]);
            }
            if (! $bankAccount->is_postable) {
                $bankAccount->update(['is_postable' => true]);
            }

            $accrualJournal = null;
            $paymentJournal = null;

            if ($netPayable > 0) {
                // 1. Post Accrual Entry:
                // DR 5130 (Sales Commissions Expense)
                // CR 2040 (Accrued Sales Commissions)
                $accrualLines = [
                    [
                        'account_id' => $expenseAccount->id,
                        'debit' => $netPayableStr,
                        'credit' => '0.000000',
                        'description' => "Commission Accrual for Run {$run->run_number} ({$run->period_start} to {$run->period_end})",
                    ],
                    [
                        'account_id' => $liabilityAccount->id,
                        'debit' => '0.000000',
                        'credit' => $netPayableStr,
                        'description' => "Accrued Commission Payable - Run {$run->run_number}",
                    ],
                ];

                $accrualJournal = $this->postingEngine->post([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'date' => $date,
                    'description' => "Sales Commission Accrual - {$run->run_number}",
                    'source_type' => 'commission_accrual',
                    'source_id' => $run->id,
                    'idempotency_key' => "comm_accrual_{$run->id}",
                    'lines' => $accrualLines,
                ]);

                // 2. Post Bank Disbursement Entry if requested:
                // DR 2040 (Accrued Sales Commissions)
                // CR 1020 (Bank Account)
                if ($disburseFromBank) {
                    $paymentLines = [
                        [
                            'account_id' => $liabilityAccount->id,
                            'debit' => $netPayableStr,
                            'credit' => '0.000000',
                            'description' => "Clearance of Commission Payable - Run {$run->run_number}",
                        ],
                        [
                            'account_id' => $bankAccount->id,
                            'debit' => '0.000000',
                            'credit' => $netPayableStr,
                            'description' => "Bank Settlement for Commission Run {$run->run_number}",
                        ],
                    ];

                    $paymentJournal = $this->postingEngine->post([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'date' => $date,
                        'description' => "Sales Commission Bank Payout - {$run->run_number}",
                        'source_type' => 'commission_payment',
                        'source_id' => $run->id,
                        'idempotency_key' => "comm_payment_{$run->id}",
                        'lines' => $paymentLines,
                    ]);
                }
            }

            // 3. Update Run status
            $run->status = 'settled';
            $run->journal_entry_id = $accrualJournal?->id;
            $run->payment_journal_id = $paymentJournal?->id;
            $run->approved_by = $userId ?? auth()->id();
            $run->approved_at = now();
            $run->settled_at = now();
            $run->save();

            AuditLogger::log(
                action: 'trade.commissions.settled',
                entityType: SalesCommissionRun::class,
                entityId: $run->id,
                newValues: [
                    'run_number' => $run->run_number,
                    'total_net_payable' => $run->total_net_payable,
                    'accrual_journal_id' => $accrualJournal?->id,
                    'payment_journal_id' => $paymentJournal?->id,
                ]
            );

            return $run->fresh(['lines.representative.plan', 'journalEntry.lines.account', 'paymentJournal.lines.account']);
        });
    }
}
