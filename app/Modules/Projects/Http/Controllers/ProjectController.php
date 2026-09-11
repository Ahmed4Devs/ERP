<?php

namespace App\Modules\Projects\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\Employee;
use App\Modules\MasterData\Models\Party;
use App\Modules\Projects\Models\Project;
use App\Modules\Projects\Models\ProjectTask;
use App\Modules\Projects\Models\ProjectTimesheet;
use App\Modules\Projects\Queries\ProjectProfitabilityQuery;
use App\Modules\Sales\Models\SalesOrder;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $projects = Project::where('company_id', $companyId)
            ->with(['customer', 'manager'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('project_number', 'ilike', "%{$search}%")
                        ->orWhere('name', 'ilike', "%{$search}%")
                        ->orWhere('name_ar', 'ilike', "%{$search}%")
                        ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('start_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $customers = Party::where(function ($q) use ($companyId): void {
            $q->whereHas('customerProfiles', fn ($cq) => $cq->where('company_id', $companyId))
                ->orWhereIn('type', ['customer', 'both']);
        })
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_ar']);

        $salesOrders = SalesOrder::where('company_id', $companyId)
            ->whereIn('status', ['confirmed', 'delivering'])
            ->orderBy('order_number', 'desc')
            ->get(['id', 'order_number', 'total_amount', 'customer_id']);

        $employees = Employee::where('company_id', $companyId)
            ->where('status', 'active')
            ->orderBy('first_name', 'asc')
            ->get(['id', 'first_name', 'last_name', 'first_name_ar', 'last_name_ar']);

        return Inertia::render('Projects/Create', [
            'customers' => $customers,
            'salesOrders' => $salesOrders,
            'employees' => $employees,
            'defaultStartDate' => now()->toDateString(),
            'defaultEndDate' => now()->addMonths(3)->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'name_ar' => 'nullable|string|max:150',
            'customer_id' => 'required|uuid|exists:parties,id',
            'sales_order_id' => 'nullable|uuid|exists:sales_orders,id',
            'manager_id' => 'nullable|uuid|exists:employees,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'budget_cost' => 'nullable|numeric|min:0',
            'budget_revenue' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:planning,in_progress,on_hold,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $projectNumber = 'PRJ-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4));

        $project = Project::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'project_number' => $projectNumber,
            'name' => $validated['name'],
            'name_ar' => $validated['name_ar'] ?? null,
            'customer_id' => $validated['customer_id'],
            'sales_order_id' => $validated['sales_order_id'] ?? null,
            'manager_id' => $validated['manager_id'] ?? null,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? null,
            'budget_cost' => $validated['budget_cost'] ?? '0.000000',
            'budget_revenue' => $validated['budget_revenue'] ?? '0.000000',
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('projects.show', $project->id)
            ->with('success', 'Project created successfully.');
    }

    public function show(Project $project, ProjectProfitabilityQuery $profitabilityQuery): Response
    {
        $project->load(['customer', 'manager', 'salesOrder', 'tasks', 'timesheets.employee', 'timesheets.task']);

        $profitability = $profitabilityQuery->execute($project);

        $employees = Employee::where('company_id', $project->company_id)
            ->where('status', 'active')
            ->orderBy('first_name', 'asc')
            ->get(['id', 'first_name', 'last_name', 'first_name_ar', 'last_name_ar', 'basic_salary']);

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'profitability' => $profitability,
            'employees' => $employees,
        ]);
    }

    public function storeTask(Request $request, Project $project): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'estimated_hours' => 'required|numeric|min:0',
            'status' => 'required|string|in:todo,in_progress,review,done',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'due_date' => 'nullable|date',
        ]);

        ProjectTask::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'project_id' => $project->id,
            'title' => $validated['title'],
            'estimated_hours' => $validated['estimated_hours'],
            'actual_hours' => 0,
            'status' => $validated['status'],
            'priority' => $validated['priority'],
            'due_date' => $validated['due_date'] ?? null,
        ]);

        return redirect()->route('projects.show', $project->id)
            ->with('success', 'Task added successfully.');
    }

    public function storeTimesheet(Request $request, Project $project): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $validated = $request->validate([
            'employee_id' => 'required|uuid|exists:employees,id',
            'task_id' => 'nullable|uuid|exists:project_tasks,id',
            'date' => 'required|date',
            'hours' => 'required|numeric|min:0.25|max:24',
            'hourly_billing_rate' => 'nullable|numeric|min:0',
            'is_billable' => 'boolean',
            'notes' => 'nullable|string',
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);

        // Hourly labor cost: basic_salary / 240
        $hourlyCost = bccomp((string) $employee->basic_salary, '0.000000', 6) > 0
            ? bcdiv((string) $employee->basic_salary, '240', 6)
            : '0.000000';

        $hours = number_format((float) $validated['hours'], 2, '.', '');
        $billingRate = number_format((float) ($validated['hourly_billing_rate'] ?? 200), 6, '.', '');

        $totalCost = bcmul($hourlyCost, $hours, 6);
        $isBillable = $validated['is_billable'] ?? true;
        $totalBillable = $isBillable ? bcmul($billingRate, $hours, 6) : '0.000000';

        ProjectTimesheet::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'project_id' => $project->id,
            'task_id' => $validated['task_id'] ?? null,
            'employee_id' => $employee->id,
            'date' => $validated['date'],
            'hours' => $hours,
            'hourly_cost' => $hourlyCost,
            'hourly_billing_rate' => $billingRate,
            'total_cost' => $totalCost,
            'total_billable' => $totalBillable,
            'is_billable' => $isBillable,
            'is_billed' => false,
            'notes' => $validated['notes'] ?? null,
        ]);

        // If linked to task, update actual_hours on task
        if (! empty($validated['task_id'])) {
            $task = ProjectTask::find($validated['task_id']);
            if ($task) {
                $task->actual_hours = bcadd((string) $task->actual_hours, $hours, 2);
                $task->save();
            }
        }

        return redirect()->route('projects.show', $project->id)
            ->with('success', 'Timesheet logged successfully.');
    }
}
