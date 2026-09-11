<?php

namespace App\Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\FixedAsset;
use App\Modules\Organization\Models\Branch;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FixedAssetController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $assets = FixedAsset::where('company_id', $companyId)
            ->with(['category', 'branch'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('asset_tag', 'ilike', "%{$search}%")
                        ->orWhere('name', 'ilike', "%{$search}%")
                        ->orWhere('name_ar', 'ilike', "%{$search}%")
                        ->orWhere('serial_number', 'ilike', "%{$search}%");
                });
            })
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->orderBy('asset_tag')
            ->paginate(15)
            ->withQueryString();

        $categories = AssetCategory::where('company_id', $companyId)->get(['id', 'code', 'name', 'name_ar']);

        return Inertia::render('Assets/Register/Index', [
            'assets' => $assets,
            'categories' => $categories,
            'filters' => [
                'search' => $request->search,
                'category_id' => $request->category_id,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $categories = AssetCategory::where('company_id', $companyId)->get(['id', 'code', 'name', 'name_ar', 'useful_life_months']);
        $branches = Branch::where('company_id', $companyId)->get(['id', 'code', 'name']);
        $accounts = Account::where('company_id', $companyId)
            ->whereIn('type', ['asset', 'expense'])
            ->get(['id', 'code', 'name', 'name_ar', 'type']);

        return Inertia::render('Assets/Register/Create', [
            'categories' => $categories,
            'branches' => $branches,
            'accounts' => $accounts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'asset_tag' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:150'],
            'name_ar' => ['nullable', 'string', 'max:150'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'category_id' => ['required', 'uuid', 'exists:asset_categories,id'],
            'branch_id' => ['nullable', 'uuid', 'exists:branches,id'],
            'purchase_date' => ['required', 'date'],
            'in_service_date' => ['required', 'date'],
            'acquisition_cost' => ['required', 'numeric', 'min:0'],
            'salvage_value' => ['nullable', 'numeric', 'min:0'],
            'useful_life_months' => ['required', 'integer', 'min:1'],
        ]);

        $cost = number_format((float) $validated['acquisition_cost'], 6, '.', '');
        $salvage = number_format((float) ($validated['salvage_value'] ?? 0), 6, '.', '');

        $category = AssetCategory::find($validated['category_id']);

        FixedAsset::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'asset_tag' => $validated['asset_tag'],
            'name' => $validated['name'],
            'name_ar' => $validated['name_ar'] ?? null,
            'serial_number' => $validated['serial_number'] ?? null,
            'category_id' => $validated['category_id'],
            'branch_id' => $validated['branch_id'] ?? null,
            'purchase_date' => $validated['purchase_date'],
            'in_service_date' => $validated['in_service_date'],
            'acquisition_cost' => $cost,
            'salvage_value' => $salvage,
            'useful_life_months' => $validated['useful_life_months'],
            'depreciation_method' => 'straight_line',
            'accumulated_depreciation' => '0.000000',
            'net_book_value' => $cost,
            'status' => 'active',
            'asset_account_id' => $category?->asset_account_id,
            'accumulated_depreciation_account_id' => $category?->accumulated_depreciation_account_id,
            'depreciation_expense_account_id' => $category?->depreciation_expense_account_id,
        ]);

        return redirect()->route('assets.register.index')->with('success', 'Asset registered successfully.');
    }

    public function show(FixedAsset $fixedAsset): Response
    {
        $fixedAsset->load([
            'category',
            'branch',
            'depreciationEntries.depreciationRun',
        ]);

        return Inertia::render('Assets/Register/Show', [
            'asset' => $fixedAsset,
        ]);
    }
}
