<?php

namespace App\Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\Attendance;
use App\Modules\HR\Models\Employee;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();
        $date = $request->date ?? now()->toDateString();

        $attendances = Attendance::where('company_id', $companyId)
            ->where('date', $date)
            ->with('employee.department')
            ->get();

        $employees = Employee::where('company_id', $companyId)
            ->where('status', 'active')
            ->with('department')
            ->orderBy('employee_number')
            ->get();

        return Inertia::render('HR/Attendance/Index', [
            'attendances' => $attendances,
            'employees' => $employees,
            'selectedDate' => $date,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,late,leave,half_day'],
            'hours_worked' => ['required', 'numeric', 'min:0', 'max:24'],
            'overtime_hours' => ['nullable', 'numeric', 'min:0', 'max:24'],
            'notes' => ['nullable', 'string'],
        ]);

        Attendance::updateOrCreate(
            [
                'company_id' => $companyId,
                'employee_id' => $validated['employee_id'],
                'date' => $validated['date'],
            ],
            [
                'tenant_id' => $tenantId,
                'status' => $validated['status'],
                'hours_worked' => $validated['hours_worked'],
                'overtime_hours' => $validated['overtime_hours'] ?? 0,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return redirect()->back()->with('success', 'Attendance record saved.');
    }
}
