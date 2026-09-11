<?php

namespace App\Modules\Payroll\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Payroll\Models\PayrollRun;
use App\Modules\Payroll\Services\DisbursePayrollAction;
use App\Modules\Payroll\Services\GeneratePayrollRunAction;
use App\Modules\Payroll\Services\PostPayrollRunAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayrollRunController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $runs = PayrollRun::where('company_id', $companyId)
            ->with(['journalEntry', 'disbursementJournalEntry'])
            ->orderBy('period_year', 'desc')
            ->orderBy('period_month', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Payroll/Runs/Index', [
            'runs' => $runs,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Payroll/Runs/Create');
    }

    public function store(Request $request, GeneratePayrollRunAction $action): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'period_year' => ['required', 'integer', 'min:2020', 'max:2050'],
            'period_month' => ['required', 'integer', 'min:1', 'max:12'],
            'payment_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $run = $action->execute(
            companyId: $companyId,
            tenantId: $tenantId,
            year: (int) $validated['period_year'],
            month: (int) $validated['period_month'],
            paymentDate: $validated['payment_date'],
            notes: $validated['notes'] ?? null,
        );

        return redirect()->route('payroll.runs.show', $run->id)->with('success', "Payroll run {$run->run_number} generated successfully.");
    }

    public function show(PayrollRun $payrollRun): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $payrollRun->load([
            'payslips.employee.department',
            'payslips.employee.designation',
            'journalEntry.lines.account',
            'disbursementJournalEntry.lines.account',
        ]);

        $bankAccounts = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('type', 'asset')->whereIn('subtype', ['bank', 'cash']);
            })
            ->get(['id', 'code', 'name', 'name_ar', 'current_balance']);

        return Inertia::render('Payroll/Runs/Show', [
            'payrollRun' => $payrollRun,
            'bankAccounts' => $bankAccounts,
        ]);
    }

    public function postRun(PayrollRun $payrollRun, PostPayrollRunAction $action): RedirectResponse
    {
        $action->execute($payrollRun);

        return redirect()->route('payroll.runs.show', $payrollRun->id)->with('success', "Payroll run {$payrollRun->run_number} posted to General Ledger.");
    }

    public function disburse(Request $request, PayrollRun $payrollRun, DisbursePayrollAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'bank_account_id' => ['nullable', 'uuid', 'exists:accounts,id'],
            'disbursement_date' => ['nullable', 'date'],
        ]);

        $action->execute(
            run: $payrollRun,
            bankAccountId: $validated['bank_account_id'] ?? null,
            disbursementDate: $validated['disbursement_date'] ?? null,
        );

        return redirect()->route('payroll.runs.show', $payrollRun->id)->with('success', "Payroll run {$payrollRun->run_number} disbursed and settled.");
    }
}
