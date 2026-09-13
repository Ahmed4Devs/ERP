<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\Budget;
use App\Modules\Accounting\Models\BudgetLine;
use App\Modules\Accounting\Models\CostCenter;
use App\Modules\Accounting\Services\BudgetVarianceService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BudgetController extends Controller
{
    public function __construct(
        protected BudgetVarianceService $varianceService
    ) {}

    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $budgets = Budget::where('company_id', $companyId)
            ->with(['costCenter:id,code,name'])
            ->withCount('lines')
            ->when($request->fiscal_year, fn ($q) => $q->where('fiscal_year', $request->fiscal_year))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('name', 'ilike', "%{$search}%")
                        ->orWhereHas('costCenter', fn ($cq) => $cq->where('name', 'ilike', "%{$search}%")->orWhere('code', 'ilike', "%{$search}%"));
                });
            })
            ->latest('fiscal_year')
            ->paginate(15)
            ->withQueryString();

        $metrics = [
            'total_budgets' => Budget::where('company_id', $companyId)->count(),
            'approved_budgets' => Budget::where('company_id', $companyId)->where('status', 'approved')->count(),
            'draft_budgets' => Budget::where('company_id', $companyId)->where('status', 'draft')->count(),
            'total_planned' => (float) BudgetLine::where('company_id', $companyId)->sum('planned_amount'),
        ];

        return Inertia::render('Accounting/Budgets/Index', [
            'budgets' => $budgets,
            'metrics' => $metrics,
            'filters' => [
                'fiscal_year' => $request->fiscal_year,
                'status' => $request->status,
                'search' => $request->search,
            ],
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $accounts = Account::where('company_id', $companyId)
            ->whereIn('type', ['expense', 'revenue'])
            ->where('is_postable', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'name_ar', 'type']);

        $costCenters = CostCenter::where('company_id', $companyId)
            ->where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name']);

        return Inertia::render('Accounting/Budgets/Create', [
            'accounts' => $accounts,
            'costCenters' => $costCenters,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:150',
            'fiscal_year' => 'required|integer|min:2020|max:2050',
            'cost_center_id' => 'nullable|uuid|exists:cost_centers,id',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.account_id' => 'required|uuid|exists:accounts,id',
            'lines.*.cost_center_id' => 'nullable|uuid|exists:cost_centers,id',
            'lines.*.period_month' => 'required|integer|min:0|max:12',
            'lines.*.planned_amount' => 'required|numeric|min:0',
            'lines.*.notes' => 'nullable|string',
        ]);

        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $budget = DB::transaction(function () use ($request, $companyId, $tenantId) {
            $budget = Budget::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'cost_center_id' => $request->cost_center_id,
                'name' => $request->name,
                'fiscal_year' => $request->fiscal_year,
                'status' => 'draft',
                'notes' => $request->notes,
            ]);

            foreach ($request->lines as $l) {
                BudgetLine::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'budget_id' => $budget->id,
                    'account_id' => $l['account_id'],
                    'cost_center_id' => $l['cost_center_id'] ?? $request->cost_center_id,
                    'period_month' => $l['period_month'] ?? 0,
                    'planned_amount' => $l['planned_amount'],
                    'notes' => $l['notes'] ?? null,
                ]);
            }

            return $budget;
        });

        return redirect()->route('accounting.budgets.show', $budget->id)
            ->with('success', 'تم إنشاء الموازنة التقديرية بنجاح / Budget created successfully');
    }

    public function show(string $id): Response
    {
        $varianceData = $this->varianceService->calculateVariance($id);

        return Inertia::render('Accounting/Budgets/Show', [
            'budget' => $varianceData['budget'],
            'summary' => $varianceData['summary'],
            'lines' => $varianceData['lines'],
        ]);
    }

    public function approve(string $id): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $budget = Budget::where('company_id', $companyId)->findOrFail($id);

        $budget->status = 'approved';
        $budget->save();

        return back()->with('success', 'تم اعتماد الموازنة التقديرية بنجاح / Budget approved successfully');
    }
}
