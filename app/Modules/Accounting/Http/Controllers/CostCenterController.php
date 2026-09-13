<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Accounting\Models\CostCenter;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CostCenterController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $costCenters = CostCenter::where('company_id', $companyId)
            ->with(['parent:id,code,name', 'manager:id,name', 'children:id,parent_id,code,name'])
            ->withCount('journalLines')
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('code', 'ilike', "%{$search}%")
                        ->orWhere('name', 'ilike', "%{$search}%")
                        ->orWhere('name_ar', 'ilike', "%{$search}%");
                });
            })
            ->when($request->type, fn ($q) => $q->where('type', $request->type))
            ->orderBy('code')
            ->get();

        $tenantId = app(CurrentTenant::class)->id();
        $users = User::whereHas('memberships', fn ($q) => $q->where('tenant_id', $tenantId))
            ->get(['id', 'name', 'email']);

        $metrics = [
            'total_centers' => $costCenters->count(),
            'active_centers' => $costCenters->where('is_active', true)->count(),
            'parent_centers' => $costCenters->whereNull('parent_id')->count(),
            'total_journal_lines' => (int) $costCenters->sum('journal_lines_count'),
        ];

        return Inertia::render('Accounting/CostCenters/Index', [
            'costCenters' => $costCenters,
            'users' => $users,
            'metrics' => $metrics,
            'filters' => [
                'search' => $request->search,
                'type' => $request->type,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:150',
            'name_ar' => 'nullable|string|max:150',
            'type' => 'required|string|max:50',
            'parent_id' => 'nullable|uuid|exists:cost_centers,id',
            'manager_id' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
        ]);

        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        CostCenter::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'parent_id' => $request->parent_id,
            'code' => strtoupper($request->code),
            'name' => $request->name,
            'name_ar' => $request->name_ar,
            'type' => $request->type,
            'manager_id' => $request->manager_id,
            'is_active' => true,
            'description' => $request->description,
        ]);

        return redirect()->route('accounting.cost-centers.index')
            ->with('success', 'تم إنشاء مركز التكلفة بنجاح / Cost center created successfully');
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $costCenter = CostCenter::where('company_id', $companyId)->findOrFail($id);

        $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:150',
            'name_ar' => 'nullable|string|max:150',
            'type' => 'required|string|max:50',
            'parent_id' => 'nullable|uuid|exists:cost_centers,id',
            'manager_id' => 'nullable|exists:users,id',
            'is_active' => 'boolean',
            'description' => 'nullable|string',
        ]);

        $costCenter->update([
            'parent_id' => $request->parent_id,
            'code' => strtoupper($request->code),
            'name' => $request->name,
            'name_ar' => $request->name_ar,
            'type' => $request->type,
            'manager_id' => $request->manager_id,
            'is_active' => $request->boolean('is_active', true),
            'description' => $request->description,
        ]);

        return redirect()->route('accounting.cost-centers.index')
            ->with('success', 'تم تحديث مركز التكلفة بنجاح / Cost center updated successfully');
    }

    public function destroy(string $id): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $costCenter = CostCenter::where('company_id', $companyId)->findOrFail($id);

        if ($costCenter->journalLines()->exists()) {
            return back()->with('error', 'لا يمكن حذف مركز التكلفة لوجود حركات وقيود يومية مرتبطة به');
        }

        $costCenter->delete();

        return redirect()->route('accounting.cost-centers.index')
            ->with('success', 'تم حذف مركز التكلفة بنجاح / Cost center deleted successfully');
    }
}
