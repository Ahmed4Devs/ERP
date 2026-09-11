<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\GoodsReceipt;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\PostGoodsReceiptAction;
use App\Modules\MasterData\Models\Party;
use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GoodsReceiptController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $receipts = GoodsReceipt::where('company_id', $companyId)
            ->with(['warehouse', 'party', 'purchaseOrder'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('receipt_number', 'ilike', "%{$search}%")
                        ->orWhereHas('party', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%"))
                        ->orWhereHas('warehouse', fn ($wq) => $wq->where('name', 'ilike', "%{$search}%")->orWhere('code', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->warehouse_id, fn ($q) => $q->where('warehouse_id', $request->warehouse_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get(['id', 'code', 'name']);

        return Inertia::render('Inventory/GoodsReceipts/Index', [
            'receipts' => $receipts,
            'warehouses' => $warehouses,
            'filters' => [
                'search' => $request->search,
                'warehouse_id' => $request->warehouse_id,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get(['id', 'code', 'name']);

        $vendors = Party::where('tenant_id', $tenantId)
            ->where(function ($q) use ($companyId): void {
                $q->whereHas('vendorProfiles', fn ($vq) => $vq->where('company_id', $companyId))
                    ->orWhereIn('type', ['vendor', 'both']);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'name_ar', 'tax_id']);

        $products = Product::where('company_id', $companyId)
            ->where('is_active', true)
            ->where('type', 'storable')
            ->with(['unit', 'category'])
            ->orderBy('name')
            ->get(['id', 'sku', 'name', 'name_ar', 'standard_cost', 'moving_average_cost', 'unit_id']);

        $purchaseOrders = PurchaseOrder::where('company_id', $companyId)
            ->whereIn('status', ['approved', 'ordered', 'partially_received'])
            ->with(['lines.product', 'party'])
            ->latest('date')
            ->get();

        return Inertia::render('Inventory/GoodsReceipts/Create', [
            'warehouses' => $warehouses,
            'vendors' => $vendors,
            'products' => $products,
            'purchaseOrders' => $purchaseOrders,
            'selectedPoId' => $request->purchase_order_id,
        ]);
    }

    public function store(Request $request, PostGoodsReceiptAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|uuid|exists:warehouses,id',
            'party_id' => 'required|uuid|exists:parties,id',
            'purchase_order_id' => 'nullable|uuid|exists:purchase_orders,id',
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|uuid|exists:products,id',
            'lines.*.purchase_order_line_id' => 'nullable|uuid|exists:purchase_order_lines,id',
            'lines.*.description' => 'nullable|string|max:255',
            'lines.*.quantity' => 'required|numeric|gt:0',
            'lines.*.unit_cost' => 'required|numeric|gte:0',
        ]);

        $receipt = $action->execute($validated);

        return redirect()->route('inventory.receipts.show', $receipt->id)
            ->with('success', "Goods Receipt {$receipt->receipt_number} posted successfully with moving-average valuation and GRNI clearing GL.");
    }

    public function show(GoodsReceipt $goodsReceipt): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($goodsReceipt->company_id !== $companyId) {
            abort(403);
        }

        $goodsReceipt->load([
            'warehouse',
            'party',
            'purchaseOrder',
            'lines.product.unit',
            'journalEntry.lines.account',
        ]);

        return Inertia::render('Inventory/GoodsReceipts/Show', [
            'receipt' => $goodsReceipt,
        ]);
    }
}
