<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\DeliveryNote;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\PostDeliveryNoteAction;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Sales\Models\SalesOrder;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeliveryNoteController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $deliveryNotes = DeliveryNote::where('company_id', $companyId)
            ->with(['warehouse', 'customer', 'salesOrder'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('delivery_number', 'ilike', "%{$search}%")
                        ->orWhere('driver_name', 'ilike', "%{$search}%")
                        ->orWhere('vehicle_plate', 'ilike', "%{$search}%")
                        ->orWhere('recipient_name', 'ilike', "%{$search}%")
                        ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%"))
                        ->orWhereHas('warehouse', fn ($wq) => $wq->where('name', 'ilike', "%{$search}%")->orWhere('code', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->warehouse_id, fn ($q) => $q->where('warehouse_id', $request->warehouse_id))
            ->when($request->customer_id, fn ($q) => $q->where('customer_id', $request->customer_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get(['id', 'code', 'name']);

        return Inertia::render('Inventory/DeliveryNotes/Index', [
            'deliveryNotes' => $deliveryNotes,
            'warehouses' => $warehouses,
            'filters' => [
                'search' => $request->search,
                'warehouse_id' => $request->warehouse_id,
                'customer_id' => $request->customer_id,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get(['id', 'code', 'name']);

        $customers = Party::where('tenant_id', $tenantId)
            ->where(function ($q) use ($companyId): void {
                $q->whereHas('customerProfiles', fn ($cq) => $cq->where('company_id', $companyId))
                    ->orWhereIn('type', ['customer', 'both']);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'name_ar', 'tax_id', 'phone', 'address']);

        $products = Product::where('company_id', $companyId)
            ->where('is_active', true)
            ->where('type', 'storable')
            ->with(['unit', 'category'])
            ->orderBy('name')
            ->get(['id', 'sku', 'name', 'name_ar', 'unit_id']);

        $salesOrders = SalesOrder::where('company_id', $companyId)
            ->whereIn('status', ['confirmed', 'delivering'])
            ->with(['lines.product', 'customer'])
            ->latest('order_date')
            ->get();

        return Inertia::render('Inventory/DeliveryNotes/Create', [
            'warehouses' => $warehouses,
            'customers' => $customers,
            'products' => $products,
            'salesOrders' => $salesOrders,
            'selectedSalesOrderId' => $request->sales_order_id,
        ]);
    }

    public function store(Request $request, PostDeliveryNoteAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|uuid|exists:warehouses,id',
            'customer_id' => 'required|uuid|exists:parties,id',
            'sales_order_id' => 'nullable|uuid|exists:sales_orders,id',
            'branch_id' => 'nullable|uuid|exists:branches,id',
            'date' => 'required|date',
            'driver_name' => 'nullable|string|max:100',
            'vehicle_plate' => 'nullable|string|max:50',
            'tracking_number' => 'nullable|string|max:100',
            'recipient_name' => 'nullable|string|max:100',
            'recipient_phone' => 'nullable|string|max:50',
            'shipping_address' => 'nullable|string',
            'notes' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|uuid|exists:products,id',
            'lines.*.sales_order_line_id' => 'nullable|uuid|exists:sales_order_lines,id',
            'lines.*.description' => 'nullable|string|max:255',
            'lines.*.quantity' => 'required|numeric|gt:0',
        ]);

        $deliveryNote = $action->execute($validated);

        return redirect()->route('inventory.delivery-notes.show', $deliveryNote->id)
            ->with('success', "Delivery Note {$deliveryNote->delivery_number} dispatched successfully and stock relieved.");
    }

    public function show(DeliveryNote $deliveryNote): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($deliveryNote->company_id !== $companyId) {
            abort(403);
        }

        $deliveryNote->load([
            'warehouse',
            'customer',
            'salesOrder',
            'lines.product.unit',
            'journalEntry.lines.account',
            'stockMovements.product',
        ]);

        return Inertia::render('Inventory/DeliveryNotes/Show', [
            'deliveryNote' => $deliveryNote,
        ]);
    }

    public function print(DeliveryNote $deliveryNote, QrCodeSvgService $qrSvgService, TafqeetService $tafqeetService): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($deliveryNote->company_id !== $companyId) {
            abort(403);
        }

        $deliveryNote->load([
            'warehouse',
            'customer',
            'salesOrder',
            'lines.product.unit',
            'company',
        ]);

        $company = $deliveryNote->company ?: app(CurrentCompany::class)->get();
        $totalItems = $deliveryNote->lines->sum('quantity');

        $qrPayload = "DN: {$deliveryNote->delivery_number} | Wh: {$deliveryNote->warehouse?->name} | Cust: {$deliveryNote->customer?->name} | Date: {$deliveryNote->date}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        return Inertia::render('Inventory/DeliveryNotes/Print', [
            'deliveryNote' => $deliveryNote,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'totalItems' => $totalItems,
            'totalCost' => (float) $deliveryNote->total_cost,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic((float) $deliveryNote->total_cost),
                'en' => $tafqeetService->inEnglish((float) $deliveryNote->total_cost),
            ],
        ]);
    }
}
