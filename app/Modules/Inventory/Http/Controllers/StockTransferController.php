<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\StockTransfer;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\PostStockTransferAction;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockTransferController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $transfers = StockTransfer::where('company_id', $companyId)
            ->with(['fromWarehouse', 'toWarehouse', 'lines.product.unit'])
            ->when($request->search, function ($q, $search): void {
                $q->where('transfer_number', 'ilike', "%{$search}%");
            })
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/Transfers/Index', [
            'transfers' => $transfers,
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

        return Inertia::render('Inventory/Transfers/Create', [
            'warehouses' => $warehouses,
            'products' => $products,
        ]);
    }

    public function store(Request $request, PostStockTransferAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'from_warehouse_id' => 'required|uuid|exists:warehouses,id',
            'to_warehouse_id' => 'required|uuid|different:from_warehouse_id|exists:warehouses,id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|uuid|exists:products,id',
            'lines.*.quantity' => 'required|numeric|gt:0',
        ]);

        $transfer = $action->execute($validated);

        return redirect()->route('inventory.transfers.index')
            ->with('success', "Stock Transfer {$transfer->transfer_number} posted successfully.");
    }
}
