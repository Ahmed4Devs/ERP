<?php

namespace App\Modules\Payroll\Services;

use App\Modules\HR\Models\Employee;
use App\Modules\Payroll\Models\PayrollRun;

class GosiCalculatorService
{
    public const GOSI_MAX_CONTRIBUTORY_WAGE = '45000.000000';

    // Saudi Employee: 9% Pension + 0.75% SANED = 9.75%
    public const SAUDI_EMPLOYEE_RATE = '0.097500';

    // Saudi Employer: 9% Pension + 0.75% SANED + 2.0% Hazards = 11.75%
    public const SAUDI_EMPLOYER_RATE = '0.117500';

    // Non-Saudi Employee: 0%
    public const NON_SAUDI_EMPLOYEE_RATE = '0.000000';

    // Non-Saudi Employer: 2.0% Occupational Hazards
    public const NON_SAUDI_EMPLOYER_RATE = '0.020000';

    /**
     * Determine whether employee is Saudi citizen under GOSI rules.
     */
    public function isSaudi(Employee $employee): bool
    {
        if ($employee->nationality) {
            $nat = strtolower(trim($employee->nationality));
            if (in_array($nat, ['saudi', 'saudi arabia', 'سعودي', 'سعودية', 'ksa'], true)) {
                return true;
            }
        }

        if ($employee->national_id) {
            // Saudi National IDs start with '1', Expats/Iqama start with '2'
            return str_starts_with(trim($employee->national_id), '1');
        }

        return true; // Default assumption in Saudi domain
    }

    /**
     * Calculate GOSI breakdown for a single employee.
     *
     * @return array{
     *     is_saudi: bool,
     *     contributory_wage: string,
     *     employee_rate: string,
     *     employer_rate: string,
     *     employee_deduction: string,
     *     employer_contribution: string,
     *     total_remittance: string
     * }
     */
    public function calculateForEmployee(Employee $employee): array
    {
        $basic = number_format((float) $employee->basic_salary, 6, '.', '');
        $housing = number_format((float) $employee->housing_allowance, 6, '.', '');

        // GOSI wage = Basic Salary + Housing Allowance
        $rawWage = bcadd($basic, $housing, 6);

        // Cap at statutory 45,000 SAR
        $contributoryWage = bccomp($rawWage, self::GOSI_MAX_CONTRIBUTORY_WAGE, 6) > 0
            ? self::GOSI_MAX_CONTRIBUTORY_WAGE
            : $rawWage;

        $isSaudi = $this->isSaudi($employee);
        $empRate = $isSaudi ? self::SAUDI_EMPLOYEE_RATE : self::NON_SAUDI_EMPLOYEE_RATE;
        $emplrRate = $isSaudi ? self::SAUDI_EMPLOYER_RATE : self::NON_SAUDI_EMPLOYER_RATE;

        $employeeDeduction = bcmul($contributoryWage, $empRate, 6);
        $employerContribution = bcmul($contributoryWage, $emplrRate, 6);
        $totalRemittance = bcadd($employeeDeduction, $employerContribution, 6);

        return [
            'is_saudi' => $isSaudi,
            'contributory_wage' => $contributoryWage,
            'employee_rate' => $empRate,
            'employer_rate' => $emplrRate,
            'employee_deduction' => $employeeDeduction,
            'employer_contribution' => $employerContribution,
            'total_remittance' => $totalRemittance,
        ];
    }

    /**
     * Aggregate GOSI summary for an entire payroll run.
     */
    public function calculateForPayrollRun(PayrollRun $run): array
    {
        $run->loadMissing(['payslips.employee', 'company']);

        $saudiCount = 0;
        $nonSaudiCount = 0;
        $totalWage = '0.000000';
        $totalEmpDeductions = '0.000000';
        $totalEmployerContrib = '0.000000';
        $details = [];

        foreach ($run->payslips as $slip) {
            $emp = $slip->employee;
            if (! $emp) {
                continue;
            }

            $calc = $this->calculateForEmployee($emp);

            if ($calc['is_saudi']) {
                $saudiCount++;
            } else {
                $nonSaudiCount++;
            }

            $totalWage = bcadd($totalWage, $calc['contributory_wage'], 6);
            $totalEmpDeductions = bcadd($totalEmpDeductions, $calc['employee_deduction'], 6);
            $totalEmployerContrib = bcadd($totalEmployerContrib, $calc['employer_contribution'], 6);

            $details[] = [
                'payslip_id' => $slip->id,
                'employee_id' => $emp->id,
                'employee_number' => $emp->employee_number,
                'employee_name' => $emp->first_name.' '.$emp->last_name,
                'national_id' => $emp->national_id,
                'gosi_number' => $emp->gosi_number,
                'is_saudi' => $calc['is_saudi'],
                'nationality' => $emp->nationality ?: ($calc['is_saudi'] ? 'Saudi' : 'Non-Saudi'),
                'basic_salary' => $slip->basic_salary,
                'housing_allowance' => $slip->housing_allowance,
                'contributory_wage' => $calc['contributory_wage'],
                'employee_rate_percent' => (float) bcmul($calc['employee_rate'], '100', 2),
                'employer_rate_percent' => (float) bcmul($calc['employer_rate'], '100', 2),
                'employee_deduction' => $calc['employee_deduction'],
                'employer_contribution' => $calc['employer_contribution'],
                'total_remittance' => $calc['total_remittance'],
            ];
        }

        $grandTotal = bcadd($totalEmpDeductions, $totalEmployerContrib, 6);

        return [
            'run_id' => $run->id,
            'run_number' => $run->run_number,
            'period_year' => $run->period_year,
            'period_month' => $run->period_month,
            'total_saudi_employees' => $saudiCount,
            'total_non_saudi_employees' => $nonSaudiCount,
            'total_employees' => $saudiCount + $nonSaudiCount,
            'total_contributory_wage' => $totalWage,
            'total_employee_deductions' => $totalEmpDeductions,
            'total_employer_contributions' => $totalEmployerContrib,
            'grand_total_payable' => $grandTotal,
            'details' => $details,
        ];
    }

    /**
     * Generate GOSI CSV return file for direct portal upload.
     */
    public function generateGosiCsv(PayrollRun $run): string
    {
        $summary = $this->calculateForPayrollRun($run);

        $output = fopen('php://temp', 'r+');

        // CSV Header
        fputcsv($output, [
            'National ID / Iqama',
            'Employee Name',
            'Nationality',
            'GOSI Number',
            'Contributory Wage (SAR)',
            'Employee Share (SAR)',
            'Employer Share (SAR)',
            'Total Remittance (SAR)',
        ]);

        foreach ($summary['details'] as $item) {
            fputcsv($output, [
                $item['national_id'] ?? '',
                $item['employee_name'],
                $item['nationality'],
                $item['gosi_number'] ?? '',
                number_format((float) $item['contributory_wage'], 2, '.', ''),
                number_format((float) $item['employee_deduction'], 2, '.', ''),
                number_format((float) $item['employer_contribution'], 2, '.', ''),
                number_format((float) $item['total_remittance'], 2, '.', ''),
            ]);
        }

        rewind($output);
        $content = stream_get_contents($output);
        fclose($output);

        return $content;
    }
}
