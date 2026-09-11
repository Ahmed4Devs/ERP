<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\StockAdjustment;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\PostStockAdjustmentAction;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockAdjustmentController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $adjustments = StockAdjustment::where('company_id', $companyId)
            ->with(['warehouse', 'lines.product.unit', 'journalEntry'])
            ->when($request->search, function ($q, $search): void {
                $q->where('adjustment_number', 'ilike', "%{$search}%");
            })
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/Adjustments/Index', [
            'adjustments' => $adjustments,
            'filters' => [
                'search' => $request->search,
            ],
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get(['id', 'code', 'name']);
        $products = Product::where('company_id', $companyId)
            ->where('is_active', true)
            ->where('type', 'storable')
            ->with(['unit', 'inventoryLevels'])
            ->get();

        return Inertia::render('Inventory/Adjustments/Create', [
            'warehouses' => $warehouses,
            'products' => $products,
        ]);
    }

    public function store(Request $request, PostStockAdjustmentAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|uuid|exists:warehouses,id',
            'date' => 'required|date',
            'reason' => 'required|string|in:count_variance,damage,expired,opening_balance,other',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|uuid|exists:products,id',
            'lines.*.type' => 'required|string|in:increase,decrease',
            'lines.*.quantity' => 'required|numeric|gt:0',
            'lines.*.unit_cost' => 'nullable|numeric|gte:0',
            'lines.*.notes' => 'nullable|string',
        ]);

        $adjustment = $action->execute($validated);

        return redirect()->route('inventory.adjustments.index')
            ->with('success', "Stock Adjustment {$adjustment->adjustment_number} posted successfully with GL variance.");
    }
}
