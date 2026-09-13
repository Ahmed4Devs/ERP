<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Payroll\Models\PayrollRun;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WpsFileGeneratorService
{
    /**
     * Generate Saudi Wages Protection System SIF (Salary Information File).
     */
    public function generateSif(PayrollRun $run, array $options = []): string
    {
        $run->loadMissing(['payslips.employee', 'company']);
        $company = $run->company;

        $employerId = $options['employer_id'] ?? ($company->tax_number ?: '7000000001');
        $bankCode = $options['bank_code'] ?? 'NCBK'; // Standard Saudi bank code
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
            // Clean name from commas
            $empName = str_replace(',', ' ', $empName);

            $empBank = $options['employee_bank_code'] ?? 'NCBK';
            $iban = $emp?->iban ?: 'SA0000000000000000000000';

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
            $csvRows[] = [
                $emp?->national_id ?: '',
                $emp ? ($emp->first_name.' '.$emp->last_name) : '',
                'NCBK',
                $emp?->iban ?: '',
                number_format((float) $slip->basic_salary, 2, '.', ''),
                number_format((float) $slip->housing_allowance, 2, '.', ''),
                number_format((float) ($slip->transport_allowance + $slip->other_allowances + $slip->overtime_amount), 2, '.', ''),
                number_format((float) $slip->total_deductions, 2, '.', ''),
                number_format((float) $slip->net_salary, 2, '.', ''),
            ];
        }

        $output = fopen('php://temp', 'r+');
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
            'Content-Type' => 'text/plain',
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
