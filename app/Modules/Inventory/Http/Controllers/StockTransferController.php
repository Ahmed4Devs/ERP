<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Actions\DispatchStockTransferAction;
use App\Modules\Inventory\Actions\ReceiveStockTransferAction;
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
                $q->where(function ($sub) use ($search): void {
                    $sub->where('transfer_number', 'ilike', "%{$search}%")
                        ->orWhere('driver_name', 'ilike', "%{$search}%")
                        ->orWhere('vehicle_plate', 'ilike', "%{$search}%")
                        ->orWhere('tracking_number', 'ilike', "%{$search}%");
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->warehouse_id, function ($q, $wId) {
                $q->where(fn ($sub) => $sub->where('from_warehouse_id', $wId)->orWhere('to_warehouse_id', $wId));
            })
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get(['id', 'code', 'name']);

        return Inertia::render('Inventory/Transfers/Index', [
            'transfers' => $transfers,
            'warehouses' => $warehouses,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'warehouse_id' => $request->warehouse_id,
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

        return redirect()->route('inventory.transfers.show', $transfer->id)
            ->with('success', "تم إنشاء أمر التحويل المخزني رقم ({$transfer->transfer_number}) بنجاح.");
    }

    public function show(string $id): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $transfer = StockTransfer::where('company_id', $companyId)
            ->with([
                'fromWarehouse',
                'toWarehouse',
                'lines.product.unit',
                'dispatchedByUser:id,name,email',
                'receivedByUser:id,name,email',
                'inTransitJournal.lines.account',
                'receiptJournal.lines.account',
            ])
            ->findOrFail($id);

        return Inertia::render('Inventory/Transfers/Show', [
            'transfer' => $transfer,
        ]);
    }

    public function dispatch(Request $request, string $id, DispatchStockTransferAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'driver_name' => 'nullable|string|max:150',
            'vehicle_plate' => 'nullable|string|max:50',
            'tracking_number' => 'nullable|string|max:100',
        ]);

        $transfer = $action->execute([
            'transfer_id' => $id,
            'driver_name' => $validated['driver_name'] ?? null,
            'vehicle_plate' => $validated['vehicle_plate'] ?? null,
            'tracking_number' => $validated['tracking_number'] ?? null,
            'user_id' => auth()->id(),
        ]);

        return redirect()->back()
            ->with('success', "تم اعتماد شحن البضاعة وترحيل قيد بضاعة بالطريق للتحويل رقم ({$transfer->transfer_number}) بنجاح.");
    }

    public function receive(Request $request, string $id, ReceiveStockTransferAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'lines' => 'required|array|min:1',
            'lines.*.line_id' => 'required|uuid|exists:stock_transfer_lines,id',
            'lines.*.received_quantity' => 'required|numeric|min:0',
            'lines.*.shortage_reason' => 'nullable|string|max:255',
        ]);

        $transfer = $action->execute([
            'transfer_id' => $id,
            'received_lines' => $validated['lines'],
            'user_id' => auth()->id(),
        ]);

        $shortageMsg = (float) $transfer->shortage_value > 0
            ? ' مع قيد عجز نقل بمبلغ ('.number_format((float) $transfer->shortage_value, 2).' ريال)'
            : '';

        return redirect()->back()
            ->with('success', "تم تأكيد استلام الشحنة في المستودع الهدف بنجاح{$shortageMsg}.");
    }

    public function printWaybill(string $id): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $transfer = StockTransfer::where('company_id', $companyId)
            ->with([
                'fromWarehouse',
                'toWarehouse',
                'lines.product.unit',
                'dispatchedByUser:id,name',
                'receivedByUser:id,name',
            ])
            ->findOrFail($id);

        return Inertia::render('Inventory/Transfers/PrintWaybill', [
            'transfer' => $transfer,
        ]);
    }
}
