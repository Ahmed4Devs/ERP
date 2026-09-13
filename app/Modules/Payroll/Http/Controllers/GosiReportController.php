<?php

namespace App\Modules\Payroll\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Payroll\Models\PayrollRun;
use App\Modules\Payroll\Services\GosiCalculatorService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GosiReportController extends Controller
{
    public function index(Request $request, GosiCalculatorService $gosiService): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $runs = PayrollRun::where('company_id', $companyId)
            ->latest('period_year')
            ->latest('period_month')
            ->get(['id', 'run_number', 'period_year', 'period_month', 'status', 'total_net']);

        $selectedRunId = $request->query('run_id') ?? $runs->first()?->id;

        $selectedRun = $selectedRunId
            ? PayrollRun::where('company_id', $companyId)->find($selectedRunId)
            : null;

        $gosiData = null;
        if ($selectedRun) {
            $gosiData = $gosiService->calculateForPayrollRun($selectedRun);
        }

        return Inertia::render('Payroll/Gosi/Index', [
            'runs' => $runs,
            'selectedRunId' => $selectedRunId,
            'selectedRun' => $selectedRun,
            'gosiData' => $gosiData,
        ]);
    }

    public function export(Request $request, GosiCalculatorService $gosiService): StreamedResponse
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $runId = $request->query('run_id');
        $run = PayrollRun::where('company_id', $companyId)
            ->when($runId, fn ($q) => $q->where('id', $runId))
            ->latest('period_year')
            ->latest('period_month')
            ->firstOrFail();

        $content = $gosiService->generateGosiCsv($run);
        $filename = "GOSI_Return_{$run->period_year}_{$run->period_month}.csv";

        return response()->streamDownload(function () use ($content): void {
            echo $content;
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    public function postEmployerContribution(
        PayrollRun $payrollRun,
        PostingEngine $postingEngine,
        GosiCalculatorService $gosiService
    ): RedirectResponse {
        $currentCompany = app(CurrentCompany::class);
        $currentTenant = app(CurrentTenant::class);
        $companyId = $currentCompany->id();

        if ($payrollRun->company_id !== $companyId) {
            abort(403);
        }

        $summary = $gosiService->calculateForPayrollRun($payrollRun);
        $employerTotal = $summary['total_employer_contributions'];

        if (bccomp($employerTotal, '0.000000', 6) <= 0) {
            return back()->with('error', 'No employer GOSI contribution amount to post.');
        }

        $employerExpenseAcc = Account::firstOrCreate(
            ['company_id' => $companyId, 'code' => '5130'],
            [
                'tenant_id' => $currentTenant->id(),
                'name' => 'Employer Social Insurance / GOSI Expense',
                'name_ar' => 'مصروف التأمينات الاجتماعية - حصة صاحب العمل',
                'type' => 'expense',
                'subtype' => 'operating_expense',
                'is_postable' => true,
                'is_system' => true,
            ]
        );

        $gosiPayableAcc = Account::firstOrCreate(
            ['company_id' => $companyId, 'code' => '2040'],
            [
                'tenant_id' => $currentTenant->id(),
                'name' => 'Social Insurance / GOSI Payable',
                'name_ar' => 'مخصص التأمينات الاجتماعية المستحقة',
                'type' => 'liability',
                'subtype' => 'tax_payable',
                'is_postable' => true,
                'is_system' => true,
            ]
        );

        $lines = [
            [
                'account_id' => $employerExpenseAcc->id,
                'debit' => $employerTotal,
                'credit' => '0.000000',
                'description' => "Employer GOSI Contribution - {$payrollRun->run_number}",
            ],
            [
                'account_id' => $gosiPayableAcc->id,
                'debit' => '0.000000',
                'credit' => $employerTotal,
                'description' => "Employer GOSI Contribution Payable - {$payrollRun->run_number}",
            ],
        ];

        $postingEngine->post([
            'company_id' => $companyId,
            'tenant_id' => $currentTenant->id(),
            'date' => $payrollRun->payment_date ? $payrollRun->payment_date->toDateString() : now()->toDateString(),
            'entry_type' => 'payroll',
            'reference_type' => 'payroll_run',
            'reference_id' => $payrollRun->id,
            'description' => "Employer GOSI Contribution - {$payrollRun->run_number}",
            'currency' => 'SAR',
            'lines' => $lines,
        ]);

        return back()->with('success', 'Employer GOSI contribution posted to General Ledger successfully.');
    }
}
