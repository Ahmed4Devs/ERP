<?php

namespace App\Modules\Manufacturing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use App\Modules\Manufacturing\Models\BillOfMaterial;
use App\Modules\Manufacturing\Models\BomItem;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BomController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $boms = BillOfMaterial::where('company_id', $companyId)
            ->with(['product', 'items.product'])
            ->when($request->search, function ($q, $search) {
                $q->where('bom_code', 'ilike', "%{$search}%")
                    ->orWhereHas('product', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%")->orWhere('sku', 'ilike', "%{$search}%"));
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Manufacturing/BOM/Index', [
            'boms' => $boms,
            'filters' => [
                'search' => $request->search,
            ],
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $products = Product::where('company_id', $companyId)
            ->where('is_active', true)
            ->select('id', 'name', 'name_ar', 'sku', 'standard_cost', 'list_price')
            ->orderBy('name')
            ->get();

        return Inertia::render('Manufacturing/BOM/Create', [
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'bom_code' => 'required|string|max:50',
            'product_id' => 'required|uuid|exists:products,id',
            'yield_quantity' => 'required|numeric|min:0.0001',
            'version' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.scrap_percentage' => 'nullable|numeric|min:0|max:100',
            'items.*.notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($companyId, $tenantId, $validated) {
            $bom = BillOfMaterial::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'bom_code' => strtoupper($validated['bom_code']),
                'product_id' => $validated['product_id'],
                'yield_quantity' => $validated['yield_quantity'],
                'version' => $validated['version'] ?? 'v1.0',
                'is_active' => true,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                BomItem::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'bom_id' => $bom->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'scrap_percentage' => $item['scrap_percentage'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
        });

        return redirect()->route('manufacturing.boms.index')
            ->with('success', 'Bill of Materials created successfully.');
    }

    public function show(BillOfMaterial $bom): Response
    {
        $bom->load(['product.unit', 'items.product.unit', 'productionOrders']);

        return Inertia::render('Manufacturing/BOM/Show', [
            'bom' => $bom,
        ]);
    }
}
