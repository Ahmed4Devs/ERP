<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\ProductBatch;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\BatchTrackingService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductBatchController extends Controller
{
    public function __construct(
        protected BatchTrackingService $batchService
    ) {}

    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $batches = ProductBatch::where('company_id', $companyId)
            ->with(['product:id,sku,name,name_ar,shelf_life_days', 'warehouse:id,code,name'])
            ->withCount('serials')
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('batch_number', 'ilike', "%{$search}%")
                        ->orWhere('supplier_batch_number', 'ilike', "%{$search}%")
                        ->orWhereHas('product', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%")->orWhere('sku', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->warehouse_id, fn ($q) => $q->where('warehouse_id', $request->warehouse_id))
            ->when($request->product_id, fn ($q) => $q->where('product_id', $request->product_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->boolean('expiring_soon'), function ($q): void {
                $q->where('status', 'active')
                    ->where('current_qty', '>', 0)
                    ->whereNotNull('expiry_date')
                    ->where('expiry_date', '<=', now()->addDays(30))
                    ->where('expiry_date', '>=', now());
            })
            ->when($request->boolean('expired'), function ($q): void {
                $q->where('current_qty', '>', 0)
                    ->whereNotNull('expiry_date')
                    ->where('expiry_date', '<', now());
            })
            ->orderByRaw('expiry_date ASC NULLS LAST')
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        $metrics = [
            'total_batches' => ProductBatch::where('company_id', $companyId)->count(),
            'active_batches' => ProductBatch::where('company_id', $companyId)->where('status', 'active')->where('current_qty', '>', 0)->count(),
            'expiring_30_days' => ProductBatch::where('company_id', $companyId)
                ->where('status', 'active')
                ->where('current_qty', '>', 0)
                ->whereNotNull('expiry_date')
                ->where('expiry_date', '<=', now()->addDays(30))
                ->where('expiry_date', '>=', now())
                ->count(),
            'expired_batches' => ProductBatch::where('company_id', $companyId)
                ->where('current_qty', '>', 0)
                ->whereNotNull('expiry_date')
                ->where('expiry_date', '<', now())
                ->count(),
            'total_units_in_batches' => (float) ProductBatch::where('company_id', $companyId)->sum('current_qty'),
        ];

        $warehouses = Warehouse::where('company_id', $companyId)->where('is_active', true)->get(['id', 'code', 'name']);
        $products = Product::where('company_id', $companyId)->where('is_active', true)->get(['id', 'sku', 'name', 'name_ar']);

        return Inertia::render('Inventory/Batches/Index', [
            'batches' => $batches,
            'metrics' => $metrics,
            'warehouses' => $warehouses,
            'products' => $products,
            'filters' => [
                'search' => $request->search,
                'warehouse_id' => $request->warehouse_id,
                'product_id' => $request->product_id,
                'status' => $request->status,
                'expiring_soon' => $request->boolean('expiring_soon'),
                'expired' => $request->boolean('expired'),
            ],
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $products = Product::where('company_id', $companyId)
            ->where('is_active', true)
            ->get(['id', 'sku', 'name', 'name_ar', 'standard_cost', 'moving_average_cost', 'shelf_life_days', 'tracking_type']);

        $warehouses = Warehouse::where('company_id', $companyId)
            ->where('is_active', true)
            ->get(['id', 'code', 'name']);

        return Inertia::render('Inventory/Batches/Create', [
            'products' => $products,
            'warehouses' => $warehouses,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'warehouse_id' => 'required|uuid|exists:warehouses,id',
            'batch_number' => 'required|string|max:100',
            'supplier_batch_number' => 'nullable|string|max:100',
            'manufacture_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:manufacture_date',
            'quantity' => 'required|numeric|min:0.0001',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $batch = $this->batchService->registerBatch([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'product_id' => $request->product_id,
            'warehouse_id' => $request->warehouse_id,
            'batch_number' => $request->batch_number,
            'supplier_batch_number' => $request->supplier_batch_number,
            'manufacture_date' => $request->manufacture_date,
            'expiry_date' => $request->expiry_date,
            'quantity' => $request->quantity,
            'unit_cost' => $request->unit_cost,
            'notes' => $request->notes,
        ]);

        return redirect()->route('inventory.batches.show', $batch->id)
            ->with('success', 'تم تسجيل الدفعة بنجاح / Batch registered successfully');
    }

    public function show(string $id): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $batch = ProductBatch::where('company_id', $companyId)
            ->with([
                'product:id,sku,name,name_ar,shelf_life_days,warranty_months',
                'warehouse:id,code,name',
                'transactions' => fn ($q) => $q->latest()->limit(20),
                'serials' => fn ($q) => $q->latest()->limit(20),
            ])
            ->findOrFail($id);

        return Inertia::render('Inventory/Batches/Show', [
            'batch' => $batch,
        ]);
    }

    /**
     * FEFO Recommendation JSON Endpoint.
     */
    public function fefoRecommendation(Request $request): JsonResponse
    {
        $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'warehouse_id' => 'required|uuid|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0.0001',
        ]);

        $recommendation = $this->batchService->recommendBatchesForDispatch(
            $request->product_id,
            $request->warehouse_id,
            (float) $request->quantity
        );

        return response()->json($recommendation);
    }
}
