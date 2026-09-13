<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\PettyCashSettlement;
use App\Modules\Platform\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PostPettyCashSettlementAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Post a Petty Cash Settlement Voucher, recording expense lines, recoverable VAT, and either
     * reimbursing via bank or reducing the custodian's petty cash fund balance.
     */
    public function execute(PettyCashSettlement $settlement, ?int $userId = null): PettyCashSettlement
    {
        if ($settlement->status === 'posted') {
            throw new InvalidArgumentException('Petty cash settlement is already posted.');
        }

        return DB::transaction(function () use ($settlement, $userId): PettyCashSettlement {
            $companyId = $settlement->company_id;
            $tenantId = $settlement->tenant_id;
            $fund = $settlement->fund;
            $date = $settlement->date->toDateString();

            $total = (string) $settlement->total;
            $taxAmount = (string) $settlement->tax_amount;

            $glLines = [];

            // 1. Debit Expense Accounts for each line
            foreach ($settlement->lines as $line) {
                if (bccomp((string) $line->subtotal, '0.000000', 6) > 0) {
                    $glLines[] = [
                        'account_id' => $line->expense_account_id,
                        'debit' => (string) $line->subtotal,
                        'credit' => '0.000000',
                        'description' => "Petty Cash Expense: {$line->description}".($line->receipt_ref ? " [Ref: {$line->receipt_ref}]" : ''),
                    ];
                }
            }

            // 2. Debit Input VAT Recoverable (Account 1150)
            if (bccomp($taxAmount, '0.000000', 6) > 0) {
                $vatAccount = Account::where('company_id', $companyId)->where('code', '1150')->first();
                if ($vatAccount) {
                    $glLines[] = [
                        'account_id' => $vatAccount->id,
                        'debit' => $taxAmount,
                        'credit' => '0.000000',
                        'description' => "Input VAT on Petty Cash Settlement - {$settlement->settlement_number}",
                    ];
                }
            }

            // 3. Credit Reimbursement source (Bank/Cash) OR Custody Account
            if ($settlement->reimbursement_type === 'replenish_bank') {
                $creditAccountId = $settlement->bank_account_id;
                if (! $creditAccountId) {
                    // Fallback to primary bank or cash account
                    $defaultBank = Account::where('company_id', $companyId)->whereIn('code', ['1020', '1010'])->firstOrFail();
                    $creditAccountId = $defaultBank->id;
                }

                $glLines[] = [
                    'account_id' => $creditAccountId,
                    'debit' => '0.000000',
                    'credit' => $total,
                    'description' => "Bank Replenishment for Petty Cash Fund {$fund->name} - {$settlement->settlement_number}",
                ];
            } else {
                // Deduct from Custody Account (1030)
                $glLines[] = [
                    'account_id' => $fund->account_id,
                    'debit' => '0.000000',
                    'credit' => $total,
                    'description' => "Custody Settlement Reduction for Fund {$fund->name} - {$settlement->settlement_number}",
                ];

                // Deduct from fund's current balance
                $newBalance = bcsub((string) $fund->current_balance, $total, 6);
                $fund->update(['current_balance' => $newBalance]);
            }

            $journal = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Petty Cash Settlement {$settlement->settlement_number} - Fund {$fund->name}",
                'source_type' => 'petty_cash_settlement',
                'source_id' => $settlement->id,
                'idempotency_key' => "pcs_{$settlement->id}",
                'lines' => $glLines,
            ]);

            $settlement->update([
                'status' => 'posted',
                'journal_entry_id' => $journal->id,
                'posted_at' => now(),
                'posted_by' => $userId,
            ]);

            AuditLogger::log(
                action: 'petty_cash_settlement.posted',
                entityType: PettyCashSettlement::class,
                entityId: $settlement->id,
                newValues: [
                    'settlement_number' => $settlement->settlement_number,
                    'fund_id' => $fund->id,
                    'total' => $settlement->total,
                    'journal_entry_id' => $journal->id,
                ]
            );

            return $settlement->fresh(['fund', 'lines.expenseAccount', 'journalEntry.lines.account']);
        });
    }
}
