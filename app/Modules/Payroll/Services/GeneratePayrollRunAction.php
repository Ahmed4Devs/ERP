<?php

namespace App\Modules\Payroll\Services;

use App\Modules\HR\Models\Attendance;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\EmployeeLoanInstallment;
use App\Modules\Payroll\Models\PayrollRun;
use App\Modules\Payroll\Models\Payslip;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class GeneratePayrollRunAction
{
    /**
     * Generate a monthly payroll run with payslips for all active employees.
     */
    public function execute(string $companyId, string $tenantId, int $year, int $month, string $paymentDate, ?string $notes = null): PayrollRun
    {
        $existing = PayrollRun::where('company_id', $companyId)
            ->where('period_year', $year)
            ->where('period_month', $month)
            ->first();

        if ($existing) {
            throw new InvalidArgumentException("A payroll run for {$year}-".str_pad((string) $month, 2, '0', STR_PAD_LEFT).' already exists.');
        }

        $employees = Employee::where('company_id', $companyId)
            ->where('status', 'active')
            ->get();

        if ($employees->isEmpty()) {
            throw new InvalidArgumentException('No active employees found for payroll generation.');
        }

        return DB::transaction(function () use ($companyId, $tenantId, $year, $month, $paymentDate, $notes, $employees): PayrollRun {
            $runNumber = sprintf('PAY-%d-%02d', $year, $month);

            $run = PayrollRun::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'run_number' => $runNumber,
                'period_month' => $month,
                'period_year' => $year,
                'payment_date' => $paymentDate,
                'total_basic' => '0.000000',
                'total_allowances' => '0.000000',
                'total_deductions' => '0.000000',
                'total_net' => '0.000000',
                'status' => 'draft',
                'notes' => $notes,
            ]);

            $totalBasic = '0.000000';
            $totalAllowances = '0.000000';
            $totalDeductions = '0.000000';
            $totalNet = '0.000000';

            $periodStart = Carbon::create($year, $month, 1)->startOfMonth();
            $periodEnd = Carbon::create($year, $month, 1)->endOfMonth();

            foreach ($employees as $emp) {
                $basic = (string) $emp->basic_salary;
                $housing = (string) $emp->housing_allowance;
                $transport = (string) $emp->transport_allowance;
                $other = (string) $emp->other_allowances;

                // Check attendance overtime in this period
                $overtimeHours = Attendance::where('employee_id', $emp->id)
                    ->whereBetween('date', [$periodStart->toDateString(), $periodEnd->toDateString()])
                    ->sum('overtime_hours');

                $overtimeAmount = '0.000000';
                if ($overtimeHours > 0 && bccomp($basic, '0.000000', 6) > 0) {
                    // Standard hourly calculation (basic / 240 hrs * 1.5 multiplier)
                    $hourlyRate = bcdiv($basic, '240.000000', 6);
                    $otRate = bcmul($hourlyRate, '1.500000', 6);
                    $overtimeAmount = bcmul($otRate, (string) $overtimeHours, 6);
                }

                $allowancesSubtotal = bcadd(
                    bcadd($housing, $transport, 6),
                    bcadd($other, $overtimeAmount, 6),
                    6
                );

                $gross = bcadd($basic, $allowancesSubtotal, 6);

                // Calculate GOSI (Social Insurance) in compliance with Saudi law
                $gosiCalc = app(GosiCalculatorService::class)->calculateForEmployee($emp);
                $socialInsurance = $gosiCalc['employee_deduction'];
                $employerGosi = $gosiCalc['employer_contribution'];
                $contributoryWage = $gosiCalc['contributory_wage'];

                // Auto-deduct active employee loan installments for this period
                $loanInstallments = EmployeeLoanInstallment::where('employee_id', $emp->id)
                    ->where('period_year', $year)
                    ->where('period_month', $month)
                    ->where('status', 'pending')
                    ->get();

                $loanDeduction = '0.000000';
                foreach ($loanInstallments as $inst) {
                    $loanDeduction = bcadd($loanDeduction, (string) $inst->amount, 6);
                }

                $otherDeductions = $loanDeduction;
                $deductionsSubtotal = bcadd($socialInsurance, $otherDeductions, 6);

                $net = bcsub($gross, $deductionsSubtotal, 6);

                $payslip = Payslip::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'payroll_run_id' => $run->id,
                    'employee_id' => $emp->id,
                    'basic_salary' => $basic,
                    'housing_allowance' => $housing,
                    'transport_allowance' => $transport,
                    'other_allowances' => $other,
                    'overtime_amount' => $overtimeAmount,
                    'gross_salary' => $gross,
                    'gosi_contributory_wage' => $contributoryWage,
                    'social_insurance_deduction' => $socialInsurance,
                    'employer_gosi_contribution' => $employerGosi,
                    'other_deductions' => $otherDeductions,
                    'total_deductions' => $deductionsSubtotal,
                    'net_salary' => $net,
                    'status' => 'draft',
                ]);

                foreach ($loanInstallments as $inst) {
                    $inst->update(['payslip_id' => $payslip->id]);
                }

                $totalBasic = bcadd($totalBasic, $basic, 6);
                $totalAllowances = bcadd($totalAllowances, $allowancesSubtotal, 6);
                $totalDeductions = bcadd($totalDeductions, $deductionsSubtotal, 6);
                $totalNet = bcadd($totalNet, $net, 6);
            }

            $run->update([
                'total_basic' => $totalBasic,
                'total_allowances' => $totalAllowances,
                'total_deductions' => $totalDeductions,
                'total_net' => $totalNet,
            ]);

            return $run;
        });
    }
}
