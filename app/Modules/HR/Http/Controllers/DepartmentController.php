<?php

namespace App\Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $departments = Department::where('company_id', $companyId)
            ->with('manager')
            ->withCount('employees')
            ->orderBy('code')
            ->get();

        $designations = Designation::where('company_id', $companyId)
            ->withCount('employees')
            ->orderBy('code')
            ->get();

        $employees = Employee::where('company_id', $companyId)
            ->where('status', 'active')
            ->get(['id', 'first_name', 'last_name', 'first_name_ar', 'last_name_ar']);

        return Inertia::render('HR/Departments/Index', [
            'departments' => $departments,
            'designations' => $designations,
            'employees' => $employees,
        ]);
    }

    public function storeDepartment(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:150'],
            'name_ar' => ['nullable', 'string', 'max:150'],
            'manager_id' => ['nullable', 'uuid', 'exists:employees,id'],
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['company_id'] = $companyId;

        Department::create($validated);

        return redirect()->back()->with('success', 'Department created successfully.');
    }

    public function storeDesignation(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50'],
            'title' => ['required', 'string', 'max:150'],
            'title_ar' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['company_id'] = $companyId;

        Designation::create($validated);

        return redirect()->back()->with('success', 'Designation created successfully.');
    }
}
