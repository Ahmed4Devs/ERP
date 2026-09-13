<?php

namespace App\Modules\Manufacturing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Manufacturing\Actions\CompleteProductionOrderAction;
use App\Modules\Manufacturing\Models\BillOfMaterial;
use App\Modules\Manufacturing\Models\ProductionOrder;
use App\Modules\Manufacturing\Models\ProductionOrderItem;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductionOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $orders = ProductionOrder::where('company_id', $companyId)
            ->with(['bom', 'finishedProduct', 'sourceWarehouse', 'destinationWarehouse'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->search, function ($q, $search) {
                $q->where('order_number', 'ilike', "%{$search}%")
                    ->orWhereHas('finishedProduct', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%")->orWhere('sku', 'ilike', "%{$search}%"));
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Manufacturing/ProductionOrders/Index', [
            'orders' => $orders,
            'filters' => [
                'status' => $request->status,
                'search' => $request->search,
            ],
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $boms = BillOfMaterial::where('company_id', $companyId)
            ->where('is_active', true)
            ->with(['product', 'items.product'])
            ->get();

        $warehouses = Warehouse::where('company_id', $companyId)
            ->where('is_active', true)
            ->get();

        return Inertia::render('Manufacturing/ProductionOrders/Create', [
            'boms' => $boms,
            'warehouses' => $warehouses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'order_number' => 'required|string|max:50',
            'bom_id' => 'required|uuid|exists:bills_of_materials,id',
            'source_warehouse_id' => 'required|uuid|exists:warehouses,id',
            'destination_warehouse_id' => 'required|uuid|exists:warehouses,id',
            'target_quantity' => 'required|numeric|min:0.0001',
            'start_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $bom = BillOfMaterial::with('items')->findOrFail($validated['bom_id']);

        DB::transaction(function () use ($companyId, $tenantId, $validated, $bom) {
            $order = ProductionOrder::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'order_number' => strtoupper($validated['order_number']),
                'bom_id' => $bom->id,
                'finished_product_id' => $bom->product_id,
                'source_warehouse_id' => $validated['source_warehouse_id'],
                'destination_warehouse_id' => $validated['destination_warehouse_id'],
                'target_quantity' => $validated['target_quantity'],
                'produced_quantity' => '0.000000',
                'total_material_cost' => '0.000000',
                'unit_material_cost' => '0.000000',
                'status' => 'in_progress',
                'start_date' => $validated['start_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            // Scale BOM items by (target_quantity / bom.yield_quantity)
            $yieldRatio = bccomp((string) $bom->yield_quantity, '0.000000', 6) > 0
                ? bcdiv((string) $validated['target_quantity'], (string) $bom->yield_quantity, 6)
                : '1.000000';

            foreach ($bom->items as $bomItem) {
                $plannedQty = bcmul((string) $bomItem->quantity, $yieldRatio, 6);

                ProductionOrderItem::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'production_order_id' => $order->id,
                    'product_id' => $bomItem->product_id,
                    'planned_quantity' => $plannedQty,
                    'consumed_quantity' => '0.000000',
                    'unit_cost' => '0.000000',
                    'total_cost' => '0.000000',
                ]);
            }
        });

        return redirect()->route('manufacturing.orders.index')
            ->with('success', 'Production Order created and launched into progress.');
    }

    public function show(ProductionOrder $order): Response
    {
        abort_if($order->tenant_id !== app(CurrentTenant::class)->id(), 403);

        $order->load(['bom', 'finishedProduct', 'sourceWarehouse', 'destinationWarehouse', 'items.product.unit']);

        return Inertia::render('Manufacturing/ProductionOrders/Show', [
            'order' => $order,
        ]);
    }

    public function complete(Request $request, ProductionOrder $order, CompleteProductionOrderAction $completeAction): RedirectResponse
    {
        abort_if($order->tenant_id !== app(CurrentTenant::class)->id(), 403);

        $validated = $request->validate([
            'produced_quantity' => 'nullable|numeric|min:0.0001',
            'completion_date' => 'nullable|date',
        ]);

        $completeAction->execute([
            'production_order_id' => $order->id,
            'produced_quantity' => $validated['produced_quantity'] ?? $order->target_quantity,
            'completion_date' => $validated['completion_date'] ?? now()->toDateString(),
        ]);

        return redirect()->route('manufacturing.orders.show', $order->id)
            ->with('success', "Production Order [{$order->order_number}] completed and finished goods receipted into warehouse.");
    }

    public function print(string $id, QrCodeSvgService $qrSvgService): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $order = ProductionOrder::where('company_id', $companyId)
            ->with([
                'bom.product',
                'finishedProduct.unit',
                'sourceWarehouse',
                'destinationWarehouse',
                'items.product.unit',
                'company',
            ])
            ->findOrFail($id);

        $company = $order->company ?: $currentCompany->get();
        $qrPayload = "Production Order / Job Card: {$order->order_number} | Product: {$order->finishedProduct?->name} | Target: {$order->target_quantity} | Status: {$order->status} | Start: {$order->start_date}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        return Inertia::render('Manufacturing/ProductionOrders/Print', [
            'order' => $order,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
        ]);
    }
}
