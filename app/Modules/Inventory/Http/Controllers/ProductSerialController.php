<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\ProductBatch;
use App\Modules\Inventory\Models\ProductSerial;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\BatchTrackingService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductSerialController extends Controller
{
    public function __construct(
        protected BatchTrackingService $batchService
    ) {}

    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $serials = ProductSerial::where('company_id', $companyId)
            ->with(['product:id,sku,name,name_ar', 'warehouse:id,code,name', 'batch:id,batch_number,expiry_date', 'customer:id,name'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('serial_number', 'ilike', "%{$search}%")
                        ->orWhereHas('product', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%")->orWhere('sku', 'ilike', "%{$search}%"))
                        ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->product_id, fn ($q) => $q->where('product_id', $request->product_id))
            ->when($request->warehouse_id, fn ($q) => $q->where('warehouse_id', $request->warehouse_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->warranty_status === 'active', function ($q): void {
                $q->whereNotNull('warranty_end_date')->where('warranty_end_date', '>=', now()->toDateString());
            })
            ->when($request->warranty_status === 'expired', function ($q): void {
                $q->whereNotNull('warranty_end_date')->where('warranty_end_date', '<', now()->toDateString());
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $metrics = [
            'total_serials' => ProductSerial::where('company_id', $companyId)->count(),
            'in_stock' => ProductSerial::where('company_id', $companyId)->where('status', 'in_stock')->count(),
            'sold' => ProductSerial::where('company_id', $companyId)->where('status', 'sold')->count(),
            'active_warranty' => ProductSerial::where('company_id', $companyId)
                ->whereNotNull('warranty_end_date')
                ->where('warranty_end_date', '>=', now()->toDateString())
                ->count(),
        ];

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get(['id', 'code', 'name']);
        $products = Product::where('company_id', $companyId)->where('is_active', true)->get(['id', 'sku', 'name', 'name_ar']);

        return Inertia::render('Inventory/Serials/Index', [
            'serials' => $serials,
            'metrics' => $metrics,
            'warehouses' => $warehouses,
            'products' => $products,
            'filters' => [
                'search' => $request->search,
                'product_id' => $request->product_id,
                'warehouse_id' => $request->warehouse_id,
                'status' => $request->status,
                'warranty_status' => $request->warranty_status,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $products = Product::where('company_id', $companyId)
            ->where('is_active', true)
            ->get(['id', 'sku', 'name', 'name_ar', 'standard_cost', 'moving_average_cost', 'warranty_months']);

        $warehouses = Warehouse::where('company_id', $companyId)
            ->where('is_active', true)
            ->get(['id', 'code', 'name']);

        $batches = ProductBatch::where('company_id', $companyId)
            ->where('status', 'active')
            ->get(['id', 'product_id', 'batch_number', 'expiry_date']);

        return Inertia::render('Inventory/Serials/Create', [
            'products' => $products,
            'warehouses' => $warehouses,
            'batches' => $batches,
            'selectedProductId' => $request->product_id,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'warehouse_id' => 'required|uuid|exists:warehouses,id',
            'batch_id' => 'nullable|uuid|exists:product_batches,id',
            'serial_numbers' => 'required|string',
            'warranty_start_date' => 'nullable|date',
            'warranty_end_date' => 'nullable|date|after_or_equal:warranty_start_date',
            'warranty_months' => 'nullable|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $serials = $this->batchService->registerSerials([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'product_id' => $request->product_id,
            'warehouse_id' => $request->warehouse_id,
            'batch_id' => $request->batch_id,
            'serial_numbers' => $request->serial_numbers,
            'warranty_start_date' => $request->warranty_start_date,
            'warranty_end_date' => $request->warranty_end_date,
            'warranty_months' => $request->warranty_months,
            'unit_cost' => $request->unit_cost,
            'notes' => $request->notes,
        ]);

        $count = count($serials);

        return redirect()->route('inventory.serials.index')
            ->with('success', "تم تسجيل {$count} رقم تسلسلي بنجاح / Successfully registered {$count} serial numbers");
    }

    public function show(string $id): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $serial = ProductSerial::where('company_id', $companyId)
            ->with([
                'product:id,sku,name,name_ar,warranty_months',
                'warehouse:id,code,name',
                'batch:id,batch_number,expiry_date',
                'customer:id,name,name_ar,email,phone',
                'transactions' => fn ($q) => $q->latest()->limit(20),
            ])
            ->findOrFail($id);

        $now = now()->startOfDay();
        $isUnderWarranty = false;
        $daysRemaining = null;

        if ($serial->warranty_end_date) {
            $endDate = $serial->warranty_end_date->startOfDay();
            $isUnderWarranty = ! $endDate->isPast();
            $daysRemaining = (int) $now->diffInDays($endDate, false);
        }

        return Inertia::render('Inventory/Serials/Show', [
            'serial' => $serial,
            'warrantyInfo' => [
                'is_under_warranty' => $isUnderWarranty,
                'days_remaining' => $daysRemaining,
            ],
        ]);
    }

    /**
     * Warranty verification JSON API.
     */
    public function verifyWarranty(Request $request): JsonResponse
    {
        $request->validate([
            'serial_number' => 'required|string',
        ]);

        $companyId = app(CurrentCompany::class)->id();
        $info = $this->batchService->verifyWarranty($request->serial_number, $companyId);

        if (! $info) {
            return response()->json([
                'found' => false,
                'message' => 'Serial number not found / الرقم التسلسلي غير موجود',
            ], 404);
        }

        return response()->json(array_merge(['found' => true], $info));
    }
}
