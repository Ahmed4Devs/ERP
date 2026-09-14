<?php

namespace App\Modules\HR\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\HR\Models\EmployeeCustody;
use App\Modules\HR\Models\EmployeeLoan;
use App\Modules\HR\Models\EndOfServiceSettlement;
use App\Modules\Platform\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SettleEndOfServiceAction
{
    public function __construct(
        protected ?PostingEngine $postingEngine = null
    ) {
        $this->postingEngine = $postingEngine ?? app(PostingEngine::class);
    }

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

            $settleDate = now()->toDateString();

            // 1. Ensure Required Accounts Exist with is_postable = true
            // Provision Account (2160 - Liability)
            $provisionAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '2160'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'End of Service Indemnity Provision',
                    'name_ar' => 'مخصص مكافأة نهاية الخدمة',
                    'type' => 'liability',
                    'subtype' => 'payroll_payable',
                    'is_postable' => true,
                    'is_system' => true,
                ]
            );
            if (! $provisionAccount->is_postable) {
                $provisionAccount->update(['is_postable' => true]);
            }

            // Leave / General Compensation Expense (5120 or 5110 or 5100)
            $expenseAccount = Account::where('company_id', $companyId)
                ->whereIn('code', ['5120', '5110', '5100'])
                ->first();
            if (! $expenseAccount) {
                $expenseAccount = Account::create([
                    'company_id' => $companyId,
                    'tenant_id' => $tenantId,
                    'code' => '5120',
                    'name' => 'Leave Compensation & Termination Entitlements',
                    'name_ar' => 'تعويضات الإجازات ومستحقات نهاية الخدمة',
                    'type' => 'expense',
                    'subtype' => 'operating_expense',
                    'is_postable' => true,
                    'is_system' => true,
                ]);
            }
            if (! $expenseAccount->is_postable) {
                $expenseAccount->update(['is_postable' => true]);
            }

            // Employee Loans, Custodies & Advances (1140 - Asset)
            $advancesAccount = Account::firstOrCreate(
                ['company_id' => $companyId, 'code' => '1140'],
                [
                    'tenant_id' => $tenantId,
                    'name' => 'Employee Advances & Custodies',
                    'name_ar' => 'سلف وقروض وعهد الموظفين',
                    'type' => 'asset',
                    'subtype' => 'receivable',
                    'is_postable' => true,
                    'is_system' => true,
                ]
            );
            if (! $advancesAccount->is_postable) {
                $advancesAccount->update(['is_postable' => true]);
            }

            // Disbursement Account (1020 - Bank, 1010 - Cash, or 2030 - Accrued Payroll)
            $disburseAccount = Account::where('company_id', $companyId)->where('code', '1020')->first()
                ?? Account::where('company_id', $companyId)->whereIn('code', ['1010', '2030'])->first();
            if (! $disburseAccount) {
                $disburseAccount = Account::create([
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
            if (! $disburseAccount->is_postable) {
                $disburseAccount->update(['is_postable' => true]);
            }

            // 2. Build Balanced Journal Entry Lines
            $lines = [];
            $gratuity = number_format((float) $settlement->gratuity_amount, 6, '.', '');
            $leaveComp = number_format((float) $settlement->leave_compensation_amount, 6, '.', '');
            $otherEnt = number_format((float) $settlement->other_entitlements, 6, '.', '');
            $deductions = number_format((float) $settlement->deductions_amount, 6, '.', '');
            $netAmount = number_format((float) $settlement->net_settlement_amount, 6, '.', '');

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

            // Credit: Outstanding Custodies & Loan Deductions
            if (bccomp($deductions, '0.000000', 6) > 0) {
                $lines[] = [
                    'account_id' => $advancesAccount->id,
                    'debit' => '0.000000',
                    'credit' => $deductions,
                    'description' => "Custody & Loan Deduction Clearance - {$employee->full_name}",
                ];
            }

            // Credit: Net Settlement Payout from Bank
            if (bccomp($netAmount, '0.000000', 6) > 0) {
                $lines[] = [
                    'account_id' => $disburseAccount->id,
                    'debit' => '0.000000',
                    'credit' => $netAmount,
                    'description' => "Net End of Service Payout - {$employee->full_name}",
                ];
            }

            // 3. Post to General Ledger via PostingEngine
            $journalEntry = null;
            if (! empty($lines)) {
                $journalEntry = $this->postingEngine->post([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'date' => $settleDate,
                    'description' => "End of Service Settlement for {$employee->full_name} ({$settlement->settlement_number})",
                    'source_type' => 'end_of_service',
                    'source_id' => $settlement->id,
                    'idempotency_key' => "eos_settle_{$settlement->id}",
                    'lines' => $lines,
                ]);
            }

            // 4. Reconcile Employee Custodies and Loans if deductions were applied
            if (bccomp($deductions, '0.000000', 6) > 0) {
                $remainingDeduction = (float) $deductions;

                // Adjust active employee loans
                $loans = EmployeeLoan::where('employee_id', $employee->id)
                    ->whereIn('status', ['active', 'approved', 'disbursed'])
                    ->get();
                foreach ($loans as $loan) {
                    if ($remainingDeduction <= 0.0001) {
                        break;
                    }
                    $rem = (float) $loan->remaining_amount;
                    if ($rem > 0) {
                        $deductThis = min($rem, $remainingDeduction);
                        $loan->paid_amount = (float) $loan->paid_amount + $deductThis;
                        $loan->remaining_amount = (float) $loan->remaining_amount - $deductThis;
                        if ($loan->remaining_amount <= 0.001) {
                            $loan->status = 'fully_paid';
                        }
                        $loan->save();
                        $remainingDeduction -= $deductThis;
                    }
                }

                // Adjust active employee custodies
                $custodies = EmployeeCustody::where('employee_id', $employee->id)
                    ->whereIn('status', ['disbursed', 'active'])
                    ->get();
                foreach ($custodies as $custody) {
                    if ($remainingDeduction <= 0.0001) {
                        break;
                    }
                    $bal = (float) $custody->current_balance;
                    if ($bal > 0) {
                        $deductThis = min($bal, $remainingDeduction);
                        $custody->current_balance = (float) $custody->current_balance - $deductThis;
                        if ($custody->current_balance <= 0.001) {
                            $custody->status = 'settled';
                        }
                        $custody->save();
                        $remainingDeduction -= $deductThis;
                    }
                }
            }

            // 5. Update Settlement status
            $settlement->update([
                'status' => 'settled',
                'journal_entry_id' => $journalEntry?->id,
                'settled_at' => now(),
                'approved_by' => $userId ?? $settlement->approved_by,
            ]);

            // 6. Update Employee status
            $newStatus = $settlement->termination_type === 'resignation' ? 'resigned' : 'terminated';
            $employee->update(['status' => $newStatus]);

            // 7. Audit Log
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

            return $settlement->fresh(['employee', 'journalEntry.lines.account']);
        });
    }
}
