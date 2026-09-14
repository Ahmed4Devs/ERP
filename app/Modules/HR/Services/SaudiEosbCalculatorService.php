<?php

namespace App\Modules\HR\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\HR\Models\Employee;
use Carbon\Carbon;

class SaudiEosbCalculatorService
{
    /**
     * Calculate Saudi Labor Law EOSB entitlement for an individual employee.
     *
     * @param  string  $terminationType  'contract_end', 'employer_termination', 'resignation', 'article_87'
     * @param  string|null  $asOfDate  Calculation cutoff date (defaults to today)
     * @return array{
     *     employee_id: string,
     *     employee_number: string,
     *     name: string,
     *     name_ar: string|null,
     *     nationality: string|null,
     *     hire_date: string,
     *     as_of_date: string,
     *     service_days: int,
     *     service_years: float,
     *     service_formatted: string,
     *     monthly_wage: float,
     *     statutory_accrued_liability: float,
     *     entitlement_percentage: float,
     *     payable_entitlement: float,
     *     termination_type: string
     * }
     */
    public function calculateForEmployee(
        Employee $employee,
        ?string $asOfDate = null,
        string $terminationType = 'contract_end'
    ): array {
        $hireDate = Carbon::parse($employee->hire_date)->startOfDay();
        $asOf = $asOfDate ? Carbon::parse($asOfDate)->startOfDay() : Carbon::today();

        $totalDays = max(0, $hireDate->diffInDays($asOf));
        $yearsFloat = max(0.0, (float) $hireDate->floatDiffInYears($asOf));

        $years = (int) $hireDate->diffInYears($asOf);
        $months = (int) $hireDate->copy()->addYears($years)->diffInMonths($asOf);
        $days = (int) $hireDate->copy()->addYears($years)->addMonths($months)->diffInDays($asOf);
        $serviceFormatted = "{$years}y {$months}m {$days}d";

        $monthlyWage = (float) $employee->getGrossSalary();
        if ($monthlyWage <= 0.0) {
            $monthlyWage = (float) $employee->basic_salary + (float) $employee->housing_allowance;
        }

        // Article 84: 0.5 month wage for each of first 5 years, 1.0 month for each subsequent year
        $firstPeriodYears = min(5.0, $yearsFloat);
        $secondPeriodYears = max(0.0, $yearsFloat - 5.0);

        $halfWage = $monthlyWage / 2.0;
        $firstPeriodGratuity = $firstPeriodYears * $halfWage;
        $secondPeriodGratuity = $secondPeriodYears * $monthlyWage;

        // Full statutory accrued entitlement (IFRS / IAS 19 liability)
        $statutoryAccrued = round($firstPeriodGratuity + $secondPeriodGratuity, 2);

        // Article 85: Entitlement reduction in case of resignation
        $entitlementRate = 1.0;
        if ($terminationType === 'resignation') {
            if ($yearsFloat < 2.0) {
                $entitlementRate = 0.0;
            } elseif ($yearsFloat < 5.0) {
                $entitlementRate = 1.0 / 3.0; // 33.333%
            } elseif ($yearsFloat < 10.0) {
                $entitlementRate = 2.0 / 3.0; // 66.667%
            } else {
                $entitlementRate = 1.0; // 100%
            }
        }

        $payableEntitlement = round($statutoryAccrued * $entitlementRate, 2);

        return [
            'employee_id' => $employee->id,
            'employee_number' => $employee->employee_number,
            'name' => $employee->full_name,
            'name_ar' => $employee->full_name_ar,
            'nationality' => $employee->nationality,
            'hire_date' => $hireDate->toDateString(),
            'as_of_date' => $asOf->toDateString(),
            'service_days' => $totalDays,
            'service_years' => round($yearsFloat, 2),
            'service_formatted' => $serviceFormatted,
            'monthly_wage' => round($monthlyWage, 2),
            'statutory_accrued_liability' => $statutoryAccrued,
            'entitlement_percentage' => round($entitlementRate * 100, 1),
            'payable_entitlement' => $payableEntitlement,
            'termination_type' => $terminationType,
        ];
    }

    /**
     * Compute company-wide End-of-Service liability schedule across all active employees.
     *
     * @return array{
     *     as_of_date: string,
     *     total_active_employees: int,
     *     total_monthly_wage_base: float,
     *     total_cumulative_ifrs_liability: float,
     *     total_resignation_liability: float,
     *     current_gl_provision_balance: float,
     *     recommended_adjustment: float,
     *     schedule: array<int, array>
     * }
     */
    public function getCompanyLiabilitySchedule(string $companyId, ?string $asOfDate = null): array
    {
        $asOfDate = $asOfDate ?: Carbon::now()->toDateString();

        $employees = Employee::where('company_id', $companyId)
            ->whereIn('status', ['active', 'on_leave'])
            ->where('hire_date', '<=', $asOfDate)
            ->with(['department', 'designation'])
            ->orderBy('hire_date', 'asc')
            ->get();

        $schedule = [];
        $totalWageBase = 0.0;
        $totalIfrsLiability = 0.0;
        $totalResignationLiability = 0.0;

        foreach ($employees as $employee) {
            $item = $this->calculateForEmployee($employee, $asOfDate, 'resignation');
            $item['department'] = $employee->department?->name;
            $item['designation'] = $employee->designation?->name;

            $totalWageBase += $item['monthly_wage'];
            $totalIfrsLiability += $item['statutory_accrued_liability'];
            $totalResignationLiability += $item['payable_entitlement'];

            $schedule[] = $item;
        }

        // Check current general ledger balance of Provision Account (2160)
        $provisionAcc = Account::where('company_id', $companyId)->where('code', '2160')->first();
        $currentGlBalance = $provisionAcc ? (float) $provisionAcc->current_balance : 0.0;
        $adjustment = round($totalIfrsLiability - $currentGlBalance, 2);

        return [
            'as_of_date' => $asOfDate,
            'total_active_employees' => count($employees),
            'total_monthly_wage_base' => round($totalWageBase, 2),
            'total_cumulative_ifrs_liability' => round($totalIfrsLiability, 2),
            'total_resignation_liability' => round($totalResignationLiability, 2),
            'current_gl_provision_balance' => round($currentGlBalance, 2),
            'recommended_adjustment' => $adjustment,
            'schedule' => $schedule,
        ];
    }

    /**
     * Generate CSV content for statutory audit and actuarial valuation.
     */
    public function generateScheduleCsv(string $companyId, ?string $asOfDate = null): string
    {
        $report = $this->getCompanyLiabilitySchedule($companyId, $asOfDate);
        $output = fopen('php://temp', 'r+');

        // Add UTF-8 BOM
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

        // Header metadata
        fputcsv($output, ['سجل مخصص والتزامات مكافأة نهاية الخدمة وفق نظام العمل السعودي (المادتين 84 و 85)']);
        fputcsv($output, ['تاريخ الاحتساب (As of Date)', $report['as_of_date']]);
        fputcsv($output, ['إجمالي الموظفين المشمولين', $report['total_active_employees']]);
        fputcsv($output, ['إجمالي الرصيد المتراكم IFRS (ريال)', number_format($report['total_cumulative_ifrs_liability'], 2)]);
        fputcsv($output, ['الرصيد المحاسبي بالدفتر العام حـ/ 2160', number_format($report['current_gl_provision_balance'], 2)]);
        fputcsv($output, ['فارق التسوية والتعديل المطلوب', number_format($report['recommended_adjustment'], 2)]);
        fputcsv($output, []);

        // Table Columns
        fputcsv($output, [
            'رقم الموظف / Employee No',
            'اسم الموظف / Name',
            'القسم / Department',
            'المسمى الوظيفي / Designation',
            'الجنسية / Nationality',
            'تاريخ التعيين / Hire Date',
            'مدة الخدمة (سنوات) / Service Years',
            'الأجر الشهري الأساسي والبدلات (ريال) / Monthly Wage',
            'مخصص نهاية الخدمة المتراكم 100% (مادة 84)',
            'نسبة استحقاق الاستقالة % (مادة 85)',
            'صافي الاستحقاق في حال الاستقالة (ريال)',
        ]);

        foreach ($report['schedule'] as $row) {
            fputcsv($output, [
                $row['employee_number'],
                $row['name_ar'] ?: $row['name'],
                $row['department'] ?? '-',
                $row['designation'] ?? '-',
                $row['nationality'] ?? 'Saudi',
                $row['hire_date'],
                $row['service_years'],
                number_format($row['monthly_wage'], 2, '.', ''),
                number_format($row['statutory_accrued_liability'], 2, '.', ''),
                $row['entitlement_percentage'].'%',
                number_format($row['payable_entitlement'], 2, '.', ''),
            ]);
        }

        rewind($output);
        $content = stream_get_contents($output);
        fclose($output);

        return $content ?: '';
    }
}
