<?php

namespace App\Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\Organization\Models\Branch;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $employees = Employee::where('company_id', $companyId)
            ->with(['department', 'designation', 'branch'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('employee_number', 'ilike', "%{$search}%")
                        ->orWhere('first_name', 'ilike', "%{$search}%")
                        ->orWhere('last_name', 'ilike', "%{$search}%")
                        ->orWhere('first_name_ar', 'ilike', "%{$search}%")
                        ->orWhere('last_name_ar', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->when($request->department_id, fn ($q) => $q->where('department_id', $request->department_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderBy('employee_number', 'asc')
            ->paginate(15)
            ->withQueryString();

        $departments = Department::where('company_id', $companyId)->get(['id', 'code', 'name', 'name_ar']);

        return Inertia::render('HR/Employees/Index', [
            'employees' => $employees,
            'departments' => $departments,
            'filters' => [
                'search' => $request->search,
                'department_id' => $request->department_id,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $departments = Department::where('company_id', $companyId)->get(['id', 'code', 'name', 'name_ar']);
        $designations = Designation::where('company_id', $companyId)->get(['id', 'code', 'title', 'title_ar']);
        $branches = Branch::where('company_id', $companyId)->get(['id', 'code', 'name']);

        return Inertia::render('HR/Employees/Create', [
            'departments' => $departments,
            'designations' => $designations,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'employee_number' => ['required', 'string', 'max:50'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'first_name_ar' => ['nullable', 'string', 'max:100'],
            'last_name_ar' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'national_id' => ['nullable', 'string', 'max:50'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'designation_id' => ['nullable', 'uuid', 'exists:designations,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'hire_date' => ['required', 'date'],
            'status' => ['required', 'in:active,on_leave,terminated'],
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'housing_allowance' => ['nullable', 'numeric', 'min:0'],
            'transport_allowance' => ['nullable', 'numeric', 'min:0'],
            'other_allowances' => ['nullable', 'numeric', 'min:0'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'iban' => ['nullable', 'string', 'max:50'],
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['company_id'] = $companyId;
        $validated['housing_allowance'] = $validated['housing_allowance'] ?? 0;
        $validated['transport_allowance'] = $validated['transport_allowance'] ?? 0;
        $validated['other_allowances'] = $validated['other_allowances'] ?? 0;

        Employee::create($validated);

        return redirect()->route('hr.employees.index')->with('success', 'Employee profile created successfully.');
    }

    public function edit(Employee $employee): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $departments = Department::where('company_id', $companyId)->get(['id', 'code', 'name', 'name_ar']);
        $designations = Designation::where('company_id', $companyId)->get(['id', 'code', 'title', 'title_ar']);
        $branches = Branch::where('company_id', $companyId)->get(['id', 'code', 'name']);

        return Inertia::render('HR/Employees/Edit', [
            'employee' => $employee->load(['department', 'designation', 'branch']),
            'departments' => $departments,
            'designations' => $designations,
            'branches' => $branches,
        ]);
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'first_name_ar' => ['nullable', 'string', 'max:100'],
            'last_name_ar' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:50'],
            'national_id' => ['nullable', 'string', 'max:50'],
            'department_id' => ['nullable', 'uuid', 'exists:departments,id'],
            'designation_id' => ['nullable', 'uuid', 'exists:designations,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'hire_date' => ['required', 'date'],
            'status' => ['required', 'in:active,on_leave,terminated'],
            'basic_salary' => ['required', 'numeric', 'min:0'],
            'housing_allowance' => ['nullable', 'numeric', 'min:0'],
            'transport_allowance' => ['nullable', 'numeric', 'min:0'],
            'other_allowances' => ['nullable', 'numeric', 'min:0'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'iban' => ['nullable', 'string', 'max:50'],
        ]);

        $employee->update($validated);

        return redirect()->route('hr.employees.index')->with('success', 'Employee updated successfully.');
    }

    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->delete();

        return redirect()->route('hr.employees.index')->with('success', 'Employee archived successfully.');
    }
}
