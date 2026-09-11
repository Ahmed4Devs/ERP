<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Models\WarehouseLocation;
use App\Modules\Organization\Models\Branch;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WarehouseController extends Controller
{
    public function index(): Response
    {
        $tenantId = app(CurrentTenant::class)->id();
        $companyId = app(CurrentCompany::class)->id();

        $warehouses = Warehouse::where('company_id', $companyId)
            ->with(['branch', 'locations'])
            ->withCount('locations')
            ->withSum('inventoryLevels as total_value', 'total_value')
            ->orderBy('code')
            ->get();

        $branches = Branch::where('company_id', $companyId)->where('status', 'active')->get(['id', 'code', 'name']);

        return Inertia::render('Inventory/Warehouses/Index', [
            'warehouses' => $warehouses,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = app(CurrentTenant::class)->id();
        $companyId = app(CurrentCompany::class)->id();

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:warehouses,code,NULL,id,company_id,'.$companyId,
            'name' => 'required|string|max:150',
            'name_ar' => 'nullable|string|max:150',
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'address' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['company_id'] = $companyId;
        $validated['is_default'] = $validated['is_default'] ?? false;
        $validated['is_active'] = $validated['is_active'] ?? true;

        if ($validated['is_default']) {
            Warehouse::where('company_id', $companyId)->update(['is_default' => false]);
        }

        $warehouse = Warehouse::create($validated);

        // Auto-create DEFAULT location
        WarehouseLocation::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'warehouse_id' => $warehouse->id,
            'code' => 'DEFAULT',
            'name' => 'Default Location',
            'name_ar' => 'الموقع الافتراضي',
            'is_active' => true,
        ]);

        return redirect()->route('inventory.warehouses.index')
            ->with('success', 'Warehouse created successfully.');
    }

    public function update(Request $request, Warehouse $warehouse): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:warehouses,code,'.$warehouse->id.',id,company_id,'.$companyId,
            'name' => 'required|string|max:150',
            'name_ar' => 'nullable|string|max:150',
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'address' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if (! empty($validated['is_default']) && $validated['is_default']) {
            Warehouse::where('company_id', $companyId)->where('id', '!=', $warehouse->id)->update(['is_default' => false]);
        }

        $warehouse->update($validated);

        return redirect()->route('inventory.warehouses.index')
            ->with('success', 'Warehouse updated successfully.');
    }
}
