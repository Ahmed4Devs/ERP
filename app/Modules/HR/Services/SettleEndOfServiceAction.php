<?php

namespace App\Modules\HR\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\FiscalPeriod;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\HR\Models\EndOfServiceSettlement;
use App\Modules\Platform\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SettleEndOfServiceAction
{
    /**
     * Settle an End of Service record, generate balanced GL settlement entry, and update employee status.
     */
    public function execute(EndOfServiceSettlement $settlement, ?int $userId = null): EndOfServiceSettlement
    {
        if ($settlement->status === 'settled') {
            throw new InvalidArgumentException('Settlement is already settled.');
        }

        return DB::transaction(function () use ($settlement, $userId): EndOfServiceSettlement {
            $companyId = $settlement->company_id;
            $tenantId = $settlement->tenant_id;
            $employee = $settlement->employee;

            // 1. Locate Fiscal Period
            $settleDate = now()->toDateString();
            $fiscalPeriod = FiscalPeriod::where('company_id', $companyId)
                ->where('start_date', '<=', $settleDate)
                ->where('end_date', '>=', $settleDate)
                ->where('is_locked', false)
                ->first();

            if (! $fiscalPeriod) {
                $fiscalPeriod = FiscalPeriod::where('company_id', $companyId)
                    ->where('is_locked', false)
                    ->first();
            }

            // 2. Ensure / Find Required Accounts
            // Provision Account (2160 - Liability)
            $provisionAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '2160'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'End of Service Indemnity Provision',
                    'name_ar' => 'مخصص مكافأة نهاية الخدمة',
                    'type' => 'liability',
                    'subtype' => 'payroll_payable',
                    'is_system' => true,
                ]
            );

            // Leave / General Compensation Expense (5120 or 5110)
            $expenseAccount = Account::where('company_id', $companyId)
                ->whereIn('code', ['5120', '5110', '5100'])
                ->first() ?? $provisionAccount;

            // Employee Loans & Advances (1140 - Asset)
            $advancesAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '1140'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Employee Advances & Loans',
                    'name_ar' => 'سلف وقروض الموظفين',
                    'type' => 'asset',
                    'subtype' => 'receivable',
                    'is_system' => true,
                ]
            );

            // Disbursement Account (1020 - Bank or 2030 - Accrued Payroll)
            $disburseAccount = Account::where('company_id', $companyId)
                ->whereIn('code', ['1020', '1010', '2030'])
                ->first();

            // 3. Build Journal Entry Lines
            $lines = [];
            $gratuity = (string) $settlement->gratuity_amount;
            $leaveComp = (string) $settlement->leave_compensation_amount;
            $otherEnt = (string) $settlement->other_entitlements;
            $deductions = (string) $settlement->deductions_amount;
            $netAmount = (string) $settlement->net_settlement_amount;

            // Debit: Gratuity from Provision Account
            if (bccomp($gratuity, '0.000000', 6) > 0) {
                $lines[] = [
                    'account_id' => $provisionAccount->id,
                    'debit' => $gratuity,
                    'credit' => '0.000000',
                    'description' => "EOSG Gratuity Settlement - {$employee->full_name}",
                ];
            }

            // Debit: Leave Compensation & Other Entitlements from Expense Account
            $totalAdditionalEntitlements = bcadd($leaveComp, $otherEnt, 6);
            if (bccomp($totalAdditionalEntitlements, '0.000000', 6) > 0) {
                $lines[] = [
                    'account_id' => $expenseAccount->id,
                    'debit' => $totalAdditionalEntitlements,
                    'credit' => '0.000000',
                    'description' => "Unused Leave & Entitlements Payout - {$employee->full_name}",
                ];
            }

            // Credit: Outstanding Loans/Deductions
            if (bccomp($deductions, '0.000000', 6) > 0) {
                $lines[] = [
                    'account_id' => $advancesAccount->id,
                    'debit' => '0.000000',
                    'credit' => $deductions,
                    'description' => "Loan/Deduction Clearance - {$employee->full_name}",
                ];
            }

            // Credit: Net Settlement Payout from Bank / Payroll Payable
            if (bccomp($netAmount, '0.000000', 6) > 0 && $disburseAccount) {
                $lines[] = [
                    'account_id' => $disburseAccount->id,
                    'debit' => '0.000000',
                    'credit' => $netAmount,
                    'description' => "Net End of Service Payout - {$employee->full_name}",
                ];
            }

            // Validate Debit == Credit before creating entry
            $totalDebit = '0.000000';
            $totalCredit = '0.000000';
            foreach ($lines as $line) {
                $totalDebit = bcadd($totalDebit, $line['debit'], 6);
                $totalCredit = bcadd($totalCredit, $line['credit'], 6);
            }

            $journalEntry = null;
            if (bccomp($totalDebit, '0.000000', 6) > 0 && bccomp($totalDebit, $totalCredit, 6) === 0) {
                $entryNumber = 'EOS-JV-'.str_replace('-', '', $settleDate).'-'.rand(1000, 9999);

                $journalEntry = JournalEntry::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'entry_number' => $entryNumber,
                    'date' => $settleDate,
                    'status' => 'posted',
                    'source_type' => 'end_of_service',
                    'source_id' => $settlement->id,
                    'description' => "End of Service Settlement for {$employee->full_name} ({$settlement->settlement_number})",
                ]);

                foreach ($lines as $line) {
                    JournalEntryLine::create([
                        'tenant_id' => $tenantId,
                        'company_id' => $companyId,
                        'journal_entry_id' => $journalEntry->id,
                        'account_id' => $line['account_id'],
                        'debit' => $line['debit'],
                        'credit' => $line['credit'],
                        'description' => $line['description'],
                    ]);
                }
            }

            // 4. Update Settlement status
            $settlement->update([
                'status' => 'settled',
                'journal_entry_id' => $journalEntry?->id,
                'settled_at' => now(),
                'approved_by' => $userId ?? $settlement->approved_by,
            ]);

            // 5. Update Employee status
            $newStatus = $settlement->termination_type === 'resignation' ? 'resigned' : 'terminated';
            $employee->update(['status' => $newStatus]);

            // 6. Audit Log
            AuditLogger::log(
                action: 'end_of_service.settled',
                entityType: EndOfServiceSettlement::class,
                entityId: $settlement->id,
                newValues: [
                    'settlement_number' => $settlement->settlement_number,
                    'employee_id' => $employee->id,
                    'net_settlement_amount' => $settlement->net_settlement_amount,
                    'journal_entry_id' => $journalEntry?->id,
                    'employee_new_status' => $newStatus,
                ]
            );

            return $settlement->fresh(['employee', 'journalEntry']);
        });
    }
}
