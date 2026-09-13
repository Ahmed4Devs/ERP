<?php

namespace App\Modules\Governance\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Governance\Models\ApprovalRequest;
use App\Modules\Governance\Models\ApprovalRule;
use App\Modules\Governance\Services\ApprovalEngineService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalWorkflowController extends Controller
{
    public function __construct(
        protected ApprovalEngineService $workflowEngine
    ) {}

    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $requests = ApprovalRequest::where('company_id', $companyId)
            ->with(['requester:id,name,email', 'rule.levels'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->document_type, fn ($q) => $q->where('document_type', $request->document_type))
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('document_number', 'ilike', "%{$search}%")
                        ->orWhereHas('requester', fn ($uq) => $uq->where('name', 'ilike', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $metrics = [
            'pending_count' => ApprovalRequest::where('company_id', $companyId)->where('status', 'pending')->count(),
            'approved_count' => ApprovalRequest::where('company_id', $companyId)->where('status', 'approved')->count(),
            'rejected_count' => ApprovalRequest::where('company_id', $companyId)->where('status', 'rejected')->count(),
            'pending_total_amount' => (float) ApprovalRequest::where('company_id', $companyId)->where('status', 'pending')->sum('amount'),
        ];

        return Inertia::render('Governance/Approvals/Index', [
            'requests' => $requests,
            'metrics' => $metrics,
            'filters' => [
                'status' => $request->status,
                'document_type' => $request->document_type,
                'search' => $request->search,
            ],
        ]);
    }

    public function show(string $id): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $request = ApprovalRequest::where('company_id', $companyId)
            ->with([
                'requester:id,name,email',
                'rule.levels.approverUser:id,name,email',
                'actions.actor:id,name,email',
            ])
            ->findOrFail($id);

        return Inertia::render('Governance/Approvals/Show', [
            'approvalRequest' => $request,
        ]);
    }

    public function approve(Request $request, string $id): RedirectResponse
    {
        $request->validate([
            'comments' => 'nullable|string|max:500',
        ]);

        $this->workflowEngine->approve($id, auth()->id(), $request->comments);

        return back()->with('success', 'تم تسجيل الموافقة بنجاح / Approval registered successfully');
    }

    public function reject(Request $request, string $id): RedirectResponse
    {
        $request->validate([
            'reason' => 'required|string|min:3|max:500',
        ]);

        $this->workflowEngine->reject($id, auth()->id(), $request->reason);

        return back()->with('warning', 'تم رفض الطلب وإيقاف مسار الاعتماد / Request rejected successfully');
    }

    public function rules(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $rules = ApprovalRule::where('company_id', $companyId)
            ->with(['levels.approverUser:id,name,email'])
            ->withCount('requests')
            ->orderBy('module')
            ->orderBy('min_amount')
            ->get();

        $tenantId = app(CurrentTenant::class)->id();
        $users = User::whereHas('memberships', fn ($q) => $q->where('tenant_id', $tenantId))
            ->get(['id', 'name', 'email']);

        return Inertia::render('Governance/Rules/Index', [
            'rules' => $rules,
            'users' => $users,
        ]);
    }

    public function storeRule(Request $request): RedirectResponse
    {
        $request->validate([
            'module' => 'required|string|max:60',
            'name' => 'required|string|max:150',
            'min_amount' => 'required|numeric|min:0',
            'max_amount' => 'nullable|numeric|gt:min_amount',
            'description' => 'nullable|string',
            'levels' => 'required|array|min:1',
            'levels.*.level_name' => 'required|string|max:150',
            'levels.*.approver_role' => 'nullable|string|max:60',
            'levels.*.approver_user_id' => 'nullable|exists:users,id',
        ]);

        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $this->workflowEngine->createRuleWithLevels([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'module' => $request->module,
            'name' => $request->name,
            'min_amount' => $request->min_amount,
            'max_amount' => $request->max_amount,
            'description' => $request->description,
            'is_active' => true,
        ], $request->levels);

        return redirect()->route('governance.rules.index')
            ->with('success', 'تم حفظ قاعدة الحوكمة ومصفوفة الاعتمادات بنجاح / Approval rule created successfully');
    }
}
