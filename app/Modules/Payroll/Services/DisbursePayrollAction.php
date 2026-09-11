<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Payroll\Models\PayrollRun;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class DisbursePayrollAction
{
    public function __construct(
        private PostingEngine $postingEngine
    ) {}

    /**
     * Settle net payroll liability from bank account.
     * DR 2030 Accrued Salaries & Payroll Payable
     * CR 1020 Bank Current Account
     */
    public function execute(PayrollRun $run, ?string $bankAccountId = null, ?string $disbursementDate = null): PayrollRun
    {
        if ($run->status !== 'posted') {
            throw new InvalidArgumentException("Payroll run must be in 'posted' status before disbursement.");
        }

        $companyId = $run->company_id;
        $date = $disbursementDate ?? now()->toDateString();

        $payrollPayableAcc = Account::where('company_id', $companyId)->where('code', '2030')->first();
        if (! $payrollPayableAcc) {
            throw new RuntimeException('Accrued Salaries account (2030) not found.');
        }

        $bankAccount = $bankAccountId
            ? Account::where('company_id', $companyId)->find($bankAccountId)
            : Account::where('company_id', $companyId)->where('code', '1020')->first();

        if (! $bankAccount) {
            throw new RuntimeException('Bank Current Account (1020) not found for company.');
        }

        return DB::transaction(function () use ($run, $payrollPayableAcc, $bankAccount, $date): PayrollRun {
            $amount = (string) $run->total_net;

            if (bccomp($amount, '0.000000', 6) > 0) {
                $lines = [
                    [
                        'account_id' => $payrollPayableAcc->id,
                        'debit' => $amount,
                        'credit' => '0.000000',
                        'description' => "Disbursement of Accrued Payroll - {$run->run_number}",
                    ],
                    [
                        'account_id' => $bankAccount->id,
                        'debit' => '0.000000',
                        'credit' => $amount,
                        'description' => "Bank Payroll Payout - {$run->run_number}",
                    ],
                ];

                $journal = $this->postingEngine->post([
                    'company_id' => $run->company_id,
                    'tenant_id' => $run->tenant_id,
                    'date' => $date,
                    'entry_type' => 'payroll_disbursement',
                    'description' => "Payroll Bank Disbursement for {$run->run_number}",
                    'reference' => $run->run_number,
                    'idempotency_key' => "payroll_disburse_{$run->id}",
                    'lines' => $lines,
                ]);

                $run->update([
                    'disbursement_journal_entry_id' => $journal->id,
                    'status' => 'paid',
                ]);
            } else {
                $run->update(['status' => 'paid']);
            }

            $run->payslips()->update(['status' => 'paid']);

            return $run->refresh();
        });
    }
}
