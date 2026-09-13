<?php

namespace App\Modules\HR\Services;

use App\Modules\HR\Models\Employee;
use Carbon\Carbon;

class EndOfServiceCalculator
{
    /**
     * Calculate Saudi Labor Law End of Service Gratuity & Settlement Breakdown.
     *
     * @param  string  $terminationType  'resignation', 'contract_end', 'employer_termination', 'article_87'
     * @param  string  $lastWorkingDate  'YYYY-MM-DD'
     */
    public function calculate(
        Employee $employee,
        string $terminationType,
        string $lastWorkingDate,
        float|string $unusedLeaveDays = 0,
        float|string $otherEntitlements = 0,
        float|string $deductions = 0
    ): array {
        $hireDate = Carbon::parse($employee->hire_date);
        $lastDate = Carbon::parse($lastWorkingDate);

        // Calculate exact days and decimal service years
        $totalDays = max(0, $hireDate->diffInDays($lastDate));
        $yearsFloat = (float) $hireDate->floatDiffInYears($lastDate);
        $serviceYears = number_format($yearsFloat, 4, '.', '');

        // Base wage per Saudi Labor Law (Gross wage: basic + housing + transport + other fixed allowances)
        $grossSalary = $employee->getGrossSalary();
        $monthlyWage = $grossSalary;
        $dailyWage = bcdiv($monthlyWage, '30.000000', 6);

        // Article 84: Half month salary for first 5 years, full month for each following year
        $firstPeriodYears = min(5.0, $yearsFloat);
        $secondPeriodYears = max(0.0, $yearsFloat - 5.0);

        // First 5 years gratuity = 0.5 * monthlyWage * years
        $halfWage = bcdiv($monthlyWage, '2.000000', 6);
        $firstPeriodGratuity = bcmul($halfWage, (string) $firstPeriodYears, 6);

        // Remaining years gratuity = 1.0 * monthlyWage * remaining years
        $secondPeriodGratuity = bcmul($monthlyWage, (string) $secondPeriodYears, 6);

        $fullGratuity = bcadd($firstPeriodGratuity, $secondPeriodGratuity, 6);

        // Article 85 / 87: Determine entitlement factor
        $entitlementRate = '1.00';

        if ($terminationType === 'resignation') {
            if ($yearsFloat < 2.0) {
                // Less than 2 years: 0%
                $entitlementRate = '0.00';
            } elseif ($yearsFloat < 5.0) {
                // 2 to less than 5 years: 1/3 (0.33)
                $entitlementRate = '0.333333';
            } elseif ($yearsFloat < 10.0) {
                // 5 to less than 10 years: 2/3 (0.67)
                $entitlementRate = '0.666667';
            } else {
                // 10 years or more: 100%
                $entitlementRate = '1.00';
            }
        } else {
            // Contract End, Employer Termination (Art 77), Art 87: Full 100%
            $entitlementRate = '1.00';
        }

        $payableGratuity = bcmul($fullGratuity, $entitlementRate, 6);

        // Leave compensation: unused leave days * daily wage
        $leaveDaysStr = (string) $unusedLeaveDays;
        $leaveCompensation = bcmul($dailyWage, $leaveDaysStr, 6);

        // Net Settlement = Gratuity + Leave Comp + Other Entitlements - Deductions
        $totalEntitlements = bcadd(
            bcadd($payableGratuity, $leaveCompensation, 6),
            (string) $otherEntitlements,
            6
        );

        $netSettlement = bcsub($totalEntitlements, (string) $deductions, 6);
        if (bccomp($netSettlement, '0.000000', 6) < 0) {
            $netSettlement = '0.000000';
        }

        return [
            'hire_date' => $hireDate->toDateString(),
            'last_working_date' => $lastDate->toDateString(),
            'service_days' => $totalDays,
            'service_years' => $serviceYears,
            'monthly_wage' => $monthlyWage,
            'daily_wage' => $dailyWage,
            'full_gratuity' => $fullGratuity,
            'entitlement_rate' => $entitlementRate,
            'gratuity_amount' => $payableGratuity,
            'unused_leave_days' => $leaveDaysStr,
            'leave_compensation_amount' => $leaveCompensation,
            'other_entitlements' => (string) $otherEntitlements,
            'deductions_amount' => (string) $deductions,
            'net_settlement_amount' => $netSettlement,
        ];
    }
}
