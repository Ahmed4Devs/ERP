<?php

namespace App\Modules\HR\Actions;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\HR\Models\EmployeeCustody;
use App\Modules\HR\Models\EmployeeCustodySettlement;
use App\Modules\Platform\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PostEmployeeCustodySettlementAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Post an Employee Custody settlement voucher with:
     * - Itemized expense debit lines (5xxx)
     * - 15% ZATCA recoverable input VAT separation (1150)
     * - Cash refund returned to treasury (1010/1020)
     * - Credit to Employee Custody Asset account (1140)
     * - Amortization of employee custody balance and automated clearance when 0
     */
    public function execute(EmployeeCustodySettlement $settlement, ?int $userId = null): EmployeeCustodySettlement
    {
        if ($settlement->status === 'posted') {
            throw new InvalidArgumentException("Custody Settlement (#{$settlement->settlement_number}) is already posted.");
        }

        return DB::transaction(function () use ($settlement, $userId) {
            /** @var EmployeeCustody $custody */
            $custody = EmployeeCustody::lockForUpdate()->findOrFail($settlement->custody_id);

            $companyId = $settlement->company_id;
            $tenantId = $settlement->tenant_id;
            $date = $settlement->settlement_date->toDateString();

            $totalClaimed = (string) $settlement->total_claimed_amount;
            $totalTax = (string) $settlement->total_tax_amount;
            $refundAmount = (string) $settlement->refund_amount;
            $reimbursementAmount = (string) $settlement->reimbursement_amount;

            $custodyAccount = Account::find($custody->custody_account_id)
                ?? Account::where('company_id', $companyId)->where('code', '1140')->firstOrFail();

            $treasuryAccount = Account::find($custody->disbursement_account_id)
                ?? Account::where('company_id', $companyId)->whereIn('code', ['1010', '1020'])->first()
                ?? Account::where('company_id', $companyId)->where('type', 'asset')->firstOrFail();

            $glLines = [];

            // 1. DR Expense Accounts for each line
            foreach ($settlement->lines as $line) {
                if (bccomp((string) $line->subtotal, '0.000000', 6) > 0) {
                    $desc = "Custody Expense: {$line->description}".($line->invoice_number ? " [Inv: {$line->invoice_number}]" : '');
                    if ($line->vendor_name) {
                        $desc .= " - {$line->vendor_name}";
                    }

                    $glLines[] = [
                        'account_id' => $line->expense_account_id,
                        'debit' => (string) $line->subtotal,
                        'credit' => '0.000000',
                        'description' => $desc,
                    ];
                }
            }

            // 2. DR Input VAT Recoverable (Account 1150)
            if (bccomp($totalTax, '0.000000', 6) > 0) {
                $vatAccount = Account::where('company_id', $companyId)->where('code', '1150')->first()
                    ?? Account::where('company_id', $companyId)->where('code', '2150')->firstOrFail();

                $glLines[] = [
                    'account_id' => $vatAccount->id,
                    'debit' => $totalTax,
                    'credit' => '0.000000',
                    'description' => "15% Input VAT on Custody Settlement {$settlement->settlement_number} ({$custody->custody_number})",
                ];
            }

            // 3. DR Cash / Bank if employee returned unused funds (Refund)
            if (bccomp($refundAmount, '0.000000', 6) > 0) {
                $glLines[] = [
                    'account_id' => $treasuryAccount->id,
                    'debit' => $refundAmount,
                    'credit' => '0.000000',
                    'description' => "Cash Refund from Custody {$custody->custody_number} returned to treasury",
                ];
            }

            // 4. CR Custody Account (1140) & optional Reimbursement
            // The credit to custody is the portion amortized against the advance
            $custodyAmortization = bcadd($totalClaimed, $refundAmount, 6);
            if (bccomp($reimbursementAmount, '0.000000', 6) > 0) {
                // If company reimburses extra expenses above custody:
                // Custody balance is credited up to current balance, extra is credited to bank
                $custodyCredit = (string) $custody->current_balance;
                $glLines[] = [
                    'account_id' => $custodyAccount->id,
                    'debit' => '0.000000',
                    'credit' => $custodyCredit,
                    'description' => "Custody Settlement Clearance - {$custody->custody_number}",
                ];
                $glLines[] = [
                    'account_id' => $treasuryAccount->id,
                    'debit' => '0.000000',
                    'credit' => $reimbursementAmount,
                    'description' => "Excess Expense Reimbursement to Employee - {$custody->custody_number}",
                ];
            } else {
                $glLines[] = [
                    'account_id' => $custodyAccount->id,
                    'debit' => '0.000000',
                    'credit' => $custodyAmortization,
                    'description' => "Custody Expense Settlement & Clearance - {$custody->custody_number}",
                ];
            }

            $journal = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Custody Settlement {$settlement->settlement_number} - Advance {$custody->custody_number}",
                'source_type' => 'employee_custody_settlement',
                'source_id' => $settlement->id,
                'idempotency_key' => "custody_settle_{$settlement->id}",
                'lines' => $glLines,
            ]);

            // Update Settlement
            $settlement->status = 'posted';
            $settlement->posted_at = now();
            $settlement->posted_by = $userId ?? auth()->id();
            $settlement->journal_entry_id = $journal->id;
            $settlement->save();

            // Update Custody Balance and Status
            $newBalance = bcsub((string) $custody->current_balance, bcsub($custodyAmortization, $reimbursementAmount, 6), 6);
            if (bccomp($newBalance, '0.000000', 6) <= 0) {
                $custody->current_balance = '0.000000';
                $custody->status = 'closed';
            } else {
                $custody->current_balance = $newBalance;
                $custody->status = 'partially_settled';
            }
            $custody->save();

            AuditLogger::log(
                action: 'employee_custody_settlement.posted',
                entityType: EmployeeCustodySettlement::class,
                entityId: $settlement->id,
                newValues: [
                    'settlement_number' => $settlement->settlement_number,
                    'custody_id' => $custody->id,
                    'total_claimed' => $totalClaimed,
                    'total_tax' => $totalTax,
                    'refund_amount' => $refundAmount,
                    'new_custody_balance' => $custody->current_balance,
                    'custody_status' => $custody->status,
                    'journal_entry_id' => $journal->id,
                ]
            );

            return $settlement->fresh(['custody.employee', 'lines.expenseAccount', 'journalEntry.lines.account']);
        });
    }
}
