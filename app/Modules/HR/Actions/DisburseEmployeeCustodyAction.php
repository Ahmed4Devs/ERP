<?php

namespace App\Modules\HR\Actions;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\HR\Models\EmployeeCustody;
use App\Modules\Platform\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DisburseEmployeeCustodyAction
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Disburse an approved Employee Custody advance with double-entry GL posting:
     * DR 1140 (Employee Advances & Custodies)
     * CR 1020/1010 (Bank or Main Cash Account)
     */
    public function execute(EmployeeCustody $custody, ?int $userId = null): EmployeeCustody
    {
        if ($custody->status === 'disbursed' || $custody->status === 'closed') {
            throw new InvalidArgumentException("Custody (#{$custody->custody_number}) is already disbursed or closed.");
        }

        return DB::transaction(function () use ($custody, $userId) {
            $companyId = $custody->company_id;
            $tenantId = $custody->tenant_id;
            $amount = (string) $custody->amount;

            if (bccomp($amount, '0.000000', 6) <= 0) {
                throw new InvalidArgumentException('Custody amount must be greater than zero.');
            }

            // 1. Resolve or provision Employee Custody GL Account (1140)
            $custodyAccount = Account::find($custody->custody_account_id)
                ?? Account::where('company_id', $companyId)->where('code', '1140')->first();

            if (! $custodyAccount) {
                $custodyAccount = Account::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'code' => '1140',
                    'name' => 'Employee Advances & Custodies',
                    'name_ar' => 'سلف وعهد الموظفين المدينة',
                    'type' => 'asset',
                    'subtype' => 'current_asset',
                    'currency' => 'SAR',
                    'is_postable' => true,
                    'is_system' => false,
                    'current_balance' => '0.000000',
                ]);
            }

            // 2. Resolve Bank / Cash Disbursement Account (1020 / 1010)
            $disbursementAccount = Account::find($custody->disbursement_account_id);
            if (! $disbursementAccount) {
                $defaultCode = $custody->disbursement_method === 'cash' ? '1010' : '1020';
                $disbursementAccount = Account::where('company_id', $companyId)->where('code', $defaultCode)->first()
                    ?? Account::where('company_id', $companyId)->where('type', 'asset')->firstOrFail();
            }

            $date = now()->toDateString();
            $employeeName = $custody->employee?->first_name.' '.$custody->employee?->last_name;

            // 3. Post Double-Entry Journal Entry
            $glLines = [
                // DR Employee Custody Account
                [
                    'account_id' => $custodyAccount->id,
                    'debit' => $amount,
                    'credit' => '0.000000',
                    'description' => "Disbursement of Custody {$custody->custody_number} to {$employeeName} ({$custody->purpose})",
                ],
                // CR Bank/Cash
                [
                    'account_id' => $disbursementAccount->id,
                    'debit' => '0.000000',
                    'credit' => $amount,
                    'description' => "Custody Payment via {$custody->disbursement_method} - {$custody->custody_number}",
                ],
            ];

            $journal = $this->postingEngine->post([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'date' => $date,
                'description' => "Disbursement of Custody {$custody->custody_number} - {$employeeName}",
                'source_type' => 'employee_custody_disbursement',
                'source_id' => $custody->id,
                'idempotency_key' => "custody_disb_{$custody->id}",
                'lines' => $glLines,
            ]);

            $custody->status = 'disbursed';
            $custody->current_balance = $amount;
            $custody->disbursed_at = now();
            $custody->custody_account_id = $custodyAccount->id;
            $custody->disbursement_account_id = $disbursementAccount->id;
            $custody->journal_entry_id = $journal->id;
            if ($userId) {
                $custody->approved_by = $userId;
            }
            $custody->save();

            AuditLogger::log(
                action: 'employee_custody.disbursed',
                entityType: EmployeeCustody::class,
                entityId: $custody->id,
                newValues: [
                    'custody_number' => $custody->custody_number,
                    'employee_id' => $custody->employee_id,
                    'amount' => $amount,
                    'journal_entry_id' => $journal->id,
                ]
            );

            return $custody->fresh(['employee', 'custodyAccount', 'disbursementAccount', 'journalEntry']);
        });
    }
}
