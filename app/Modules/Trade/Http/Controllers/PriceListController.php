<?php

namespace App\Modules\Trade\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use App\Modules\Trade\Models\PriceList;
use App\Modules\Trade\Models\PriceListItem;
use App\Modules\Trade\Services\PriceResolverService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PriceListController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $priceLists = PriceList::where('company_id', $companyId)
            ->withCount('items')
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('name_ar', 'ilike', "%{$search}%")
                    ->orWhere('code', 'ilike', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Trade/PriceLists/Index', [
            'priceLists' => $priceLists,
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
            ->select('id', 'name', 'name_ar', 'sku', 'list_price')
            ->orderBy('name')
            ->get();

        return Inertia::render('Trade/PriceLists/Create', [
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:100',
            'name_ar' => 'nullable|string|max:100',
            'currency' => 'required|string|max:10',
            'is_default' => 'nullable|boolean',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.min_quantity' => 'required|numeric|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        DB::transaction(function () use ($companyId, $tenantId, $validated) {
            if (! empty($validated['is_default'])) {
                PriceList::where('company_id', $companyId)->update(['is_default' => false]);
            }

            $priceList = PriceList::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'code' => strtoupper($validated['code']),
                'name' => $validated['name'],
                'name_ar' => $validated['name_ar'] ?? null,
                'currency' => $validated['currency'] ?? 'SAR',
                'is_default' => $validated['is_default'] ?? false,
                'is_active' => true,
            ]);

            foreach ($validated['items'] as $item) {
                PriceListItem::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'price_list_id' => $priceList->id,
                    'product_id' => $item['product_id'],
                    'min_quantity' => $item['min_quantity'],
                    'price' => $item['price'],
                    'discount_percentage' => $item['discount_percentage'] ?? 0,
                ]);
            }
        });

        return redirect()->route('trade.pricelists.index')
            ->with('success', 'Price list created successfully.');
    }

    public function show(PriceList $priceList): Response
    {
        abort_if($priceList->tenant_id !== app(CurrentTenant::class)->id(), 403);

        $priceList->load(['items.product.unit']);

        return Inertia::render('Trade/PriceLists/Show', [
            'priceList' => $priceList,
        ]);
    }

    public function resolvePrice(Request $request, PriceResolverService $resolver): JsonResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        $validated = $request->validate([
            'product_id' => 'required|uuid|exists:products,id',
            'quantity' => 'required|numeric|min:0.0001',
            'price_list_id' => 'nullable|uuid|exists:price_lists,id',
        ]);

        $resolved = $resolver->resolve(
            companyId: $companyId,
            productId: $validated['product_id'],
            quantity: $validated['quantity'],
            priceListId: $validated['price_list_id'] ?? null
        );

        return response()->json($resolved);
    }
}
