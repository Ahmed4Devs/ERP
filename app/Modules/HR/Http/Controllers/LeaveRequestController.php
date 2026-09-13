<?php

namespace App\Modules\HR\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\LeaveRequest;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $query = LeaveRequest::where('company_id', $companyId)
            ->with(['employee.department', 'employee.designation', 'approver'])
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('leave_type')) {
            $query->where('leave_type', $request->query('leave_type'));
        }

        $leaveRequests = $query->paginate(15)->withQueryString();

        $employees = Employee::where('company_id', $companyId)
            ->where('status', 'active')
            ->get(['id', 'first_name', 'last_name', 'employee_number']);

        $metrics = [
            'total_requests' => LeaveRequest::where('company_id', $companyId)->count(),
            'pending_count' => LeaveRequest::where('company_id', $companyId)->where('status', 'pending')->count(),
            'approved_days' => LeaveRequest::where('company_id', $companyId)->where('status', 'approved')->sum('days_count'),
        ];

        return Inertia::render('HR/Leaves/Index', [
            'leaveRequests' => $leaveRequests,
            'employees' => $employees,
            'metrics' => $metrics,
            'filters' => $request->only(['status', 'leave_type']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'employee_id' => ['required', 'string', 'uuid'],
            'leave_type' => ['required', 'string', 'in:annual,sick,unpaid,emergency,maternity'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $employee = Employee::where('company_id', $companyId)->findOrFail($validated['employee_id']);

        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);
        $daysCount = $start->diffInDays($end) + 1;

        LeaveRequest::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'branch_id' => $employee->branch_id,
            'employee_id' => $employee->id,
            'leave_type' => $validated['leave_type'],
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'days_count' => $daysCount,
            'status' => 'pending',
            'reason' => $validated['reason'] ?? null,
        ]);

        return redirect()->route('hr.leaves.index')->with('success', 'تم تقديم طلب الإجازة بنجاح.');
    }

    public function approve(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($leaveRequest->company_id !== $companyId) {
            abort(403);
        }

        $leaveRequest->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        return redirect()->route('hr.leaves.index')->with('success', 'تمت الموافقة على طلب الإجازة.');
    }

    public function reject(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($leaveRequest->company_id !== $companyId) {
            abort(403);
        }

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:500'],
        ]);

        $leaveRequest->update([
            'status' => 'rejected',
            'approved_by' => $request->user()?->id,
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        return redirect()->route('hr.leaves.index')->with('success', 'تم رفض طلب الإجازة.');
    }
}
