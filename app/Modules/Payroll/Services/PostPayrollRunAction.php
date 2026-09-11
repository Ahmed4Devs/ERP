<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Payroll\Models\PayrollRun;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use RuntimeException;

class PostPayrollRunAction
{
    public function __construct(
        private PostingEngine $postingEngine
    ) {}

    /**
     * Post a payroll run into General Ledger.
     * DR 5110 Salaries & Wages Expense
     * DR 5120 Employee Allowances & Benefits
     * CR 2030 Accrued Salaries & Payroll Payable
     * CR 2040 Social Insurance / GOSI Payable
     */
    public function execute(PayrollRun $run): PayrollRun
    {
        if (in_array($run->status, ['posted', 'paid'], true)) {
            throw new InvalidArgumentException("Payroll run {$run->run_number} is already posted.");
        }

        $companyId = $run->company_id;
        $tenantId = $run->tenant_id;

        $salariesAcc = Account::where('company_id', $companyId)->where('code', '5110')->first();
        $allowancesAcc = Account::where('company_id', $companyId)->where('code', '5120')->first();
        $payrollPayableAcc = Account::where('company_id', $companyId)->where('code', '2030')->first();
        $gosiPayableAcc = Account::where('company_id', $companyId)->where('code', '2040')->first();

        if (! $salariesAcc || ! $allowancesAcc || ! $payrollPayableAcc || ! $gosiPayableAcc) {
            throw new RuntimeException('Missing required payroll accounts (5110, 5120, 2030, or 2040) for company.');
        }

        return DB::transaction(function () use ($run, $salariesAcc, $allowancesAcc, $payrollPayableAcc, $gosiPayableAcc): PayrollRun {
            $lines = [];

            // Debit Salaries Expense
            if (bccomp((string) $run->total_basic, '0.000000', 6) > 0) {
                $lines[] = [
                    'account_id' => $salariesAcc->id,
                    'debit' => (string) $run->total_basic,
                    'credit' => '0.000000',
                    'description' => "Basic Salaries - {$run->run_number}",
                ];
            }

            // Debit Allowances Expense
            if (bccomp((string) $run->total_allowances, '0.000000', 6) > 0) {
                $lines[] = [
                    'account_id' => $allowancesAcc->id,
                    'debit' => (string) $run->total_allowances,
                    'credit' => '0.000000',
                    'description' => "Employee Allowances & Benefits - {$run->run_number}",
                ];
            }

            // Credit Net Payroll Payable
            if (bccomp((string) $run->total_net, '0.000000', 6) > 0) {
                $lines[] = [
                    'account_id' => $payrollPayableAcc->id,
                    'debit' => '0.000000',
                    'credit' => (string) $run->total_net,
                    'description' => "Net Payroll Payable - {$run->run_number}",
                ];
            }

            // Credit Social Insurance / GOSI Deductions Payable
            if (bccomp((string) $run->total_deductions, '0.000000', 6) > 0) {
                $lines[] = [
                    'account_id' => $gosiPayableAcc->id,
                    'debit' => '0.000000',
                    'credit' => (string) $run->total_deductions,
                    'description' => "Social Insurance / GOSI Deductions - {$run->run_number}",
                ];
            }

            $journal = $this->postingEngine->post([
                'company_id' => $run->company_id,
                'tenant_id' => $run->tenant_id,
                'date' => $run->payment_date->toDateString(),
                'entry_type' => 'payroll',
                'description' => "Payroll Posting for {$run->period_year}-{$run->period_month} ({$run->run_number})",
                'reference' => $run->run_number,
                'idempotency_key' => "payroll_post_{$run->id}",
                'lines' => $lines,
            ]);

            $run->update([
                'journal_entry_id' => $journal->id,
                'status' => 'posted',
            ]);

            $run->payslips()->update(['status' => 'posted']);

            return $run->refresh();
        });
    }
}
