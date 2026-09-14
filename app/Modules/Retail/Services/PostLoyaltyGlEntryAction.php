<?php

namespace App\Modules\Retail\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Retail\Models\LoyaltyTransaction;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PostLoyaltyGlEntryAction
{
    public function __construct(
        protected ?PostingEngine $postingEngine = null
    ) {
        $this->postingEngine = $postingEngine ?? app(PostingEngine::class);
    }

    /**
     * Post balanced General Ledger journal entry for a loyalty points transaction:
     * - 'earn': DR 5140 (Loyalty Program Expense) / CR 2050 (Loyalty Points Liability)
     * - 'redeem': DR 2050 (Loyalty Points Liability) / CR 1030 (Accounts Receivable / Discount Offset)
     */
    public function execute(LoyaltyTransaction $transaction): JournalEntry
    {
        if ($transaction->journal_entry_id) {
            return $transaction->journalEntry;
        }

        $amount = (float) $transaction->monetary_equivalent;
        if ($amount <= 0) {
            throw new InvalidArgumentException(__('Transaction has zero or negative monetary equivalent.'));
        }

        return DB::transaction(function () use ($transaction, $amount) {
            $companyId = $transaction->company_id;
            $tenantId = $transaction->tenant_id;
            $date = now()->toDateString();
            $amountStr = number_format($amount, 6, '.', '');

            // 1. Ensure Loyalty Expense Account (5140)
            $expenseAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '5140'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Customer Loyalty & Rewards Expense',
                    'name_ar' => 'مصروف برامج الولاء والمكافآت',
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

            // 2. Ensure Loyalty Liability Account (2050)
            $liabilityAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '2050'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Customer Loyalty Points Liability',
                    'name_ar' => 'التزام نقاط الولاء المؤجلة للعملاء',
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

            // 3. Ensure Receivable / Discount Settlement Account (1030)
            $arAccount = Account::where('company_id', $companyId)->where('code', '1030')->first()
                ?? Account::where('company_id', $companyId)->where('type', 'asset')->where('subtype', 'receivable')->first();
            if (! $arAccount) {
                $arAccount = Account::create([
                    'company_id' => $companyId,
                    'tenant_id' => $tenantId,
                    'code' => '1030',
                    'name' => 'Accounts Receivable',
                    'name_ar' => 'المدينون التجاريون والعملاء',
                    'type' => 'asset',
                    'subtype' => 'receivable',
                    'is_postable' => true,
                    'is_system' => true,
                    'current_balance' => '0.000000',
                ]);
            }
            if (! $arAccount->is_postable) {
                $arAccount->update(['is_postable' => true]);
            }

            $lines = [];
            $desc = '';

            if ($transaction->transaction_type === 'earn') {
                // DR 5140 (Expense) / CR 2050 (Liability)
                $desc = "Loyalty Points Accrual - Account {$transaction->account->card_number}";
                $lines = [
                    [
                        'account_id' => $expenseAccount->id,
                        'debit' => $amountStr,
                        'credit' => '0.000000',
                        'description' => "Loyalty points earned ({$transaction->points} pts)",
                    ],
                    [
                        'account_id' => $liabilityAccount->id,
                        'debit' => '0.000000',
                        'credit' => $amountStr,
                        'description' => 'Deferred loyalty liability provision',
                    ],
                ];
            } elseif ($transaction->transaction_type === 'redeem') {
                // DR 2050 (Liability) / CR 1030 (AR Offset)
                $desc = "Loyalty Points Redemption - Account {$transaction->account->card_number}";
                $lines = [
                    [
                        'account_id' => $liabilityAccount->id,
                        'debit' => $amountStr,
                        'credit' => '0.000000',
                        'description' => "Loyalty liability discharged ({$transaction->points} pts)",
                    ],
                    [
                        'account_id' => $arAccount->id,
                        'debit' => '0.000000',
                        'credit' => $amountStr,
                        'description' => 'Customer invoice / receipt loyalty discount offset',
                    ],
                ];
            } else {
                throw new InvalidArgumentException("Unsupported loyalty transaction type for GL posting: [{$transaction->transaction_type}]");
            }

            $journalEntry = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => $desc,
                'source_type' => 'loyalty_transaction',
                'source_id' => $transaction->id,
                'idempotency_key' => "loyalty_tx_{$transaction->id}",
                'lines' => $lines,
            ]);

            $transaction->journal_entry_id = $journalEntry->id;
            $transaction->save();

            return $journalEntry;
        });
    }
}
