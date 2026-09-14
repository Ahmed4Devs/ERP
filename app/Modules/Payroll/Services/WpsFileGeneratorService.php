<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Payroll\Models\PayrollRun;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WpsFileGeneratorService
{
    /**
     * SAMA Saudi Bank Routing Identifiers (mapped from 2-digit IBAN prefix to 4-character BIC/SAMA code).
     */
    public const SAMA_BANK_CODES = [
        '55' => 'RJHI', // Al Rajhi Bank (مصرف الراجحي)
        '80' => 'RJHI', // Al Rajhi Bank (مصرف الراجحي)
        '10' => 'NCBK', // Saudi National Bank / SNB (البنك الأهلي السعودي)
        '20' => 'RIBL', // Riyad Bank (بنك الرياض)
        '05' => 'INMA', // Alinma Bank (مصرف الإنماء)
        '15' => 'ALBI', // Bank AlBilad (بنك البلاد)
        '45' => 'SABB', // Saudi Awwal Bank / SAB (البنك السعودي الأول)
        '30' => 'BSFR', // Banque Saudi Fransi (البنك السعودي الفرنسي)
        '40' => 'ARNB', // Arab National Bank (البنك العربي الوطني)
        '60' => 'BJAZ', // Bank AlJazira (بنك الجزيرة)
        '65' => 'SIBC', // Saudi Investment Bank (البنك السعودي للاستثمار)
        '75' => 'GIBK', // Gulf International Bank (بنك الخليج الدولي)
    ];

    /**
     * Extract 4-character SAMA bank code from Saudi IBAN.
     */
    public function getBankCodeFromIban(?string $iban): string
    {
        if (! $iban) {
            return 'NCBK';
        }

        $clean = strtoupper(str_replace(' ', '', $iban));
        if (str_starts_with($clean, 'SA') && strlen($clean) >= 6) {
            $bankIdentifier = substr($clean, 4, 2);

            return self::SAMA_BANK_CODES[$bankIdentifier] ?? 'NCBK';
        }

        return 'NCBK';
    }

    /**
     * Pre-validate payroll run for Saudi Mudad / WPS regulatory compliance.
     *
     * @return array{
     *     is_compliant: bool,
     *     compliance_rate: float,
     *     total_employees: int,
     *     compliant_count: int,
     *     non_compliant_count: int,
     *     issues: array<int, array{
     *         employee_id: string,
     *         employee_number: string,
     *         employee_name: string,
     *         type: string,
     *         message: string
     *     }>,
     *     totals: array{
     *         total_basic: float,
     *         total_housing: float,
     *         total_other: float,
     *         total_deductions: float,
     *         total_net: float
     *     }
     * }
     */
    public function validatePayrollRun(PayrollRun $run): array
    {
        $run->loadMissing(['payslips.employee', 'company']);
        $issues = [];
        $compliantCount = 0;
        $totalEmployees = $run->payslips->count();

        $sumBasic = 0.0;
        $sumHousing = 0.0;
        $sumOther = 0.0;
        $sumDeductions = 0.0;
        $sumNet = 0.0;

        foreach ($run->payslips as $slip) {
            $emp = $slip->employee;
            $empIssues = [];

            $empName = $emp ? trim(($emp->first_name_ar ?: $emp->first_name).' '.($emp->last_name_ar ?: $emp->last_name)) : 'Unknown';
            $empNum = $emp?->employee_number ?: 'N/A';

            // 1. National ID / Iqama validation (Must be 10 numeric digits)
            $nationalId = $emp?->national_id ? trim($emp->national_id) : '';
            if (empty($nationalId) || ! preg_match('/^[12][0-9]{9}$/', $nationalId)) {
                $empIssues[] = [
                    'employee_id' => $emp?->id ?: $slip->id,
                    'employee_number' => $empNum,
                    'employee_name' => $empName,
                    'type' => 'invalid_national_id',
                    'message' => 'رقم الهوية الوطنية أو الإقامة غير صالح أو مفقود (يجب أن يتكون من 10 أرقام تبدأ بـ 1 أو 2).',
                ];
            }

            // 2. IBAN validation (Must be 24 alphanumeric characters starting with SA)
            $iban = $emp?->iban ? strtoupper(str_replace(' ', '', $emp->iban)) : '';
            if (empty($iban) || ! preg_match('/^SA[0-9]{22}$/', $iban)) {
                $empIssues[] = [
                    'employee_id' => $emp?->id ?: $slip->id,
                    'employee_number' => $empNum,
                    'employee_name' => $empName,
                    'type' => 'invalid_iban',
                    'message' => 'رقم الآيبان البنكي غير صالح (يجب أن يبدأ بـ SA ويتكون من 24 خانة).',
                ];
            }

            // 3. Net Salary validation (Must be positive)
            $netSalary = (float) $slip->net_salary;
            if ($netSalary <= 0) {
                $empIssues[] = [
                    'employee_id' => $emp?->id ?: $slip->id,
                    'employee_number' => $empNum,
                    'employee_name' => $empName,
                    'type' => 'zero_or_negative_salary',
                    'message' => 'صافي الراتب المستحق يجب أن يكون أكبر من الصفر.',
                ];
            }

            // 4. Mathematical integrity reconciliation
            $basic = (float) $slip->basic_salary;
            $housing = (float) $slip->housing_allowance;
            $other = (float) ($slip->transport_allowance + $slip->other_allowances + $slip->overtime_amount);
            $deductions = (float) $slip->total_deductions;

            $computedNet = round(($basic + $housing + $other) - $deductions, 2);
            if (abs($computedNet - round($netSalary, 2)) > 0.05) {
                $empIssues[] = [
                    'employee_id' => $emp?->id ?: $slip->id,
                    'employee_number' => $empNum,
                    'employee_name' => $empName,
                    'type' => 'arithmetic_mismatch',
                    'message' => "عدم تطابق في معادلة احتساب الراتب: المستحق المحسوب ({$computedNet}) لا يطابق صافي المسير ({$netSalary}).",
                ];
            }

            if (empty($empIssues)) {
                $compliantCount++;
            } else {
                foreach ($empIssues as $issue) {
                    $issues[] = $issue;
                }
            }

            $sumBasic += $basic;
            $sumHousing += $housing;
            $sumOther += $other;
            $sumDeductions += $deductions;
            $sumNet += $netSalary;
        }

        $complianceRate = $totalEmployees > 0 ? round(($compliantCount / $totalEmployees) * 100, 1) : 100.0;

        return [
            'is_compliant' => empty($issues),
            'compliance_rate' => $complianceRate,
            'total_employees' => $totalEmployees,
            'compliant_count' => $compliantCount,
            'non_compliant_count' => count($issues) > 0 ? ($totalEmployees - $compliantCount) : 0,
            'issues' => $issues,
            'totals' => [
                'total_basic' => round($sumBasic, 2),
                'total_housing' => round($sumHousing, 2),
                'total_other' => round($sumOther, 2),
                'total_deductions' => round($sumDeductions, 2),
                'total_net' => round($sumNet, 2),
            ],
        ];
    }

    /**
     * Generate Saudi Wages Protection System SIF (Salary Information File).
     */
    public function generateSif(PayrollRun $run, array $options = []): string
    {
        $run->loadMissing(['payslips.employee', 'company']);
        $company = $run->company;

        $employerId = $options['employer_id'] ?? ($company->settings['mol_establishment_id'] ?? ($company->settings['cr_number'] ?? ($company->tax_number ?: '7000000001')));
        $companyIban = $company->settings['iban'] ?? '';
        $bankCode = $options['bank_code'] ?? $this->getBankCodeFromIban($companyIban);

        $fileDate = now()->format('Ymd');
        $fileTime = now()->format('His');
        $salaryMonth = sprintf('%04d%02d', $run->period_year, $run->period_month);

        $totalRecords = $run->payslips->count();
        $totalNetSalary = number_format((float) $run->total_net, 2, '.', '');

        // Header line (SCR)
        $header = sprintf(
            'SCR,%s,%s,%s,%s,%s,%s,%d,SAR,%s',
            $employerId,
            $bankCode,
            $fileDate,
            $fileTime,
            $salaryMonth,
            $totalNetSalary,
            $totalRecords,
            $run->run_number
        );

        $lines = [$header];

        // Detail records (EDR)
        foreach ($run->payslips as $slip) {
            $emp = $slip->employee;
            $nationalId = $emp?->national_id ?: '1000000000';
            $empName = $emp ? ($emp->first_name.' '.$emp->last_name) : 'Employee';
            $empName = str_replace([',', '"', "\r", "\n"], ' ', $empName);

            $iban = $emp?->iban ? strtoupper(str_replace(' ', '', $emp->iban)) : 'SA0000000000000000000000';
            $empBank = $options['employee_bank_code'] ?? $this->getBankCodeFromIban($iban);

            $basic = number_format((float) $slip->basic_salary, 2, '.', '');
            $housing = number_format((float) $slip->housing_allowance, 2, '.', '');
            $other = number_format((float) ($slip->transport_allowance + $slip->other_allowances + $slip->overtime_amount), 2, '.', '');
            $deductions = number_format((float) $slip->total_deductions, 2, '.', '');
            $net = number_format((float) $slip->net_salary, 2, '.', '');

            $lines[] = sprintf(
                'EDR,%s,%s,%s,%s,%s,%s,%s,%s,%s',
                $nationalId,
                $empName,
                $empBank,
                $iban,
                $basic,
                $housing,
                $other,
                $deductions,
                $net
            );
        }

        return implode("\r\n", $lines);
    }

    /**
     * Generate Mudad CSV file for WPS compliance.
     */
    public function generateMudadCsv(PayrollRun $run): string
    {
        $run->loadMissing(['payslips.employee']);

        $csvRows = [];
        $csvRows[] = [
            'National ID / Iqama',
            'Employee Name',
            'Bank Code',
            'IBAN',
            'Basic Salary',
            'Housing Allowance',
            'Other Allowances',
            'Deductions',
            'Net Salary',
        ];

        foreach ($run->payslips as $slip) {
            $emp = $slip->employee;
            $iban = $emp?->iban ? strtoupper(str_replace(' ', '', $emp->iban)) : '';
            $bankCode = $this->getBankCodeFromIban($iban);

            $csvRows[] = [
                $emp?->national_id ?: '',
                $emp ? ($emp->first_name.' '.$emp->last_name) : '',
                $bankCode,
                $iban,
                number_format((float) $slip->basic_salary, 2, '.', ''),
                number_format((float) $slip->housing_allowance, 2, '.', ''),
                number_format((float) ($slip->transport_allowance + $slip->other_allowances + $slip->overtime_amount), 2, '.', ''),
                number_format((float) $slip->total_deductions, 2, '.', ''),
                number_format((float) $slip->net_salary, 2, '.', ''),
            ];
        }

        $output = fopen('php://temp', 'r+');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM

        foreach ($csvRows as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $content = stream_get_contents($output);
        fclose($output);

        return $content;
    }

    /**
     * Stream response for SIF download.
     */
    public function streamSif(PayrollRun $run): StreamedResponse
    {
        $content = $this->generateSif($run);
        $filename = "WPS-{$run->run_number}.sif";

        return response()->streamDownload(function () use ($content): void {
            echo $content;
        }, $filename, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Stream response for Mudad CSV download.
     */
    public function streamMudadCsv(PayrollRun $run): StreamedResponse
    {
        $content = $this->generateMudadCsv($run);
        $filename = "MUDAD-WPS-{$run->run_number}.csv";

        return response()->streamDownload(function () use ($content): void {
            echo $content;
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
