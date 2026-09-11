<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Models\Warehouse;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $movements = StockMovement::where('stock_movements.company_id', $companyId)
            ->with(['product.unit', 'warehouse', 'journalEntry'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('movement_number', 'ilike', "%{$search}%")
                        ->orWhereHas('product', fn ($pq) => $pq->where('sku', 'ilike', "%{$search}%")->orWhere('name', 'ilike', "%{$search}%"))
                        ->orWhereHas('warehouse', fn ($wq) => $wq->where('code', 'ilike', "%{$search}%")->orWhere('name', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->product_id, fn ($q) => $q->where('product_id', $request->product_id))
            ->when($request->warehouse_id, fn ($q) => $q->where('warehouse_id', $request->warehouse_id))
            ->when($request->movement_type, fn ($q) => $q->where('movement_type', $request->movement_type))
            ->when($request->direction, fn ($q) => $q->where('direction', $request->direction))
            ->latest('date')
            ->latest('created_at')
            ->paginate(20)
            ->withQueryString();

        $warehouses = Warehouse::where('company_id', $companyId)->get(['id', 'code', 'name']);
        $products = Product::where('company_id', $companyId)->get(['id', 'sku', 'name']);

        return Inertia::render('Inventory/Movements/Index', [
            'movements' => $movements,
            'warehouses' => $warehouses,
            'products' => $products,
            'filters' => [
                'search' => $request->search,
                'product_id' => $request->product_id,
                'warehouse_id' => $request->warehouse_id,
                'movement_type' => $request->movement_type,
                'direction' => $request->direction,
            ],
        ]);
    }
}
