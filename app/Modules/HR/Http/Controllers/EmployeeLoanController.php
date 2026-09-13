<?php

namespace App\Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\EmployeeLoan;
use App\Modules\HR\Models\EmployeeLoanInstallment;
use App\Modules\Organization\Models\Branch;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeLoanController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $query = EmployeeLoan::where('company_id', $companyId)
            ->with(['employee.department', 'employee.designation'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $loans = $query->paginate(15)->withQueryString();

        $metrics = [
            'total_loans' => EmployeeLoan::where('company_id', $companyId)->count(),
            'active_loans' => EmployeeLoan::where('company_id', $companyId)->where('status', 'active')->count(),
            'total_disbursed' => EmployeeLoan::where('company_id', $companyId)->sum('total_amount'),
            'total_repaid' => EmployeeLoan::where('company_id', $companyId)->sum('paid_amount'),
            'total_remaining' => EmployeeLoan::where('company_id', $companyId)->sum('remaining_amount'),
        ];

        return Inertia::render('HR/Loans/Index', [
            'loans' => $loans,
            'metrics' => $metrics,
            'filters' => $request->only(['status']),
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $employees = Employee::where('company_id', $companyId)
            ->where('status', 'active')
            ->with(['department', 'designation'])
            ->get()
            ->map(function ($emp) {
                return [
                    'id' => $emp->id,
                    'name' => $emp->full_name,
                    'name_ar' => $emp->full_name_ar,
                    'employee_number' => $emp->employee_number,
                    'basic_salary' => (string) $emp->basic_salary,
                    'gross_salary' => $emp->getGrossSalary(),
                ];
            });

        $branches = Branch::where('company_id', $companyId)->get(['id', 'name']);

        return Inertia::render('HR/Loans/Create', [
            'employees' => $employees,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'employee_id' => ['required', 'string', 'uuid'],
            'branch_id' => ['nullable', 'string', 'uuid'],
            'total_amount' => ['required', 'numeric', 'min:1'],
            'installments_count' => ['required', 'integer', 'min:1', 'max:60'],
            'start_date' => ['required', 'date'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $employee = Employee::where('company_id', $companyId)->findOrFail($validated['employee_id']);

        $totalAmount = (string) $validated['total_amount'];
        $count = (int) $validated['installments_count'];
        $monthlyInstallment = bcdiv($totalAmount, (string) $count, 6);

        $loanNumber = 'LN-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3)));

        DB::transaction(function () use ($tenantId, $companyId, $validated, $employee, $totalAmount, $monthlyInstallment, $count, $loanNumber): void {
            $loan = EmployeeLoan::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'branch_id' => $validated['branch_id'] ?? $employee->branch_id,
                'employee_id' => $employee->id,
                'loan_number' => $loanNumber,
                'total_amount' => $totalAmount,
                'monthly_installment' => $monthlyInstallment,
                'installments_count' => $count,
                'paid_amount' => '0.000000',
                'remaining_amount' => $totalAmount,
                'start_date' => $validated['start_date'],
                'disbursement_date' => $validated['start_date'],
                'status' => 'active',
                'reason' => $validated['reason'] ?? null,
            ]);

            // Generate monthly installment schedule
            $startDate = Carbon::parse($validated['start_date']);

            for ($i = 1; $i <= $count; $i++) {
                $installmentDate = $startDate->copy()->addMonthsNoOverflow($i - 1);

                EmployeeLoanInstallment::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'employee_loan_id' => $loan->id,
                    'employee_id' => $employee->id,
                    'installment_number' => $i,
                    'period_year' => $installmentDate->year,
                    'period_month' => $installmentDate->month,
                    'amount' => $monthlyInstallment,
                    'status' => 'pending',
                ]);
            }
        });

        return redirect()->route('hr.loans.index')->with('success', 'تم تسجيل السلفة وتوليد جدول الأقساط الشهرية بنجاح.');
    }

    public function show(EmployeeLoan $loan): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($loan->company_id !== $companyId) {
            abort(403);
        }

        $loan->load(['employee.department', 'employee.designation', 'branch', 'installments.payslip']);

        return Inertia::render('HR/Loans/Show', [
            'loan' => $loan,
        ]);
    }
}
