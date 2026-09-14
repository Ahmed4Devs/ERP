<?php

namespace App\Modules\Trade\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Product;
use App\Modules\Trade\Models\Promotion;
use App\Modules\Trade\Services\EvaluatePromotionsService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    public function __construct(
        protected EvaluatePromotionsService $evaluatePromotionsService
    ) {}

    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $promotions = Promotion::where('company_id', $companyId)
            ->with(['buyProduct:id,sku,name,name_ar', 'getProduct:id,sku,name,name_ar'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'ilike', "%{$search}%")
                        ->orWhere('name_ar', 'ilike', "%{$search}%")
                        ->orWhere('code', 'ilike', "%{$search}%");
                });
            })
            ->when($request->type, fn ($q) => $q->where('type', $request->type))
            ->when($request->status !== null && $request->status !== '', function ($q) use ($request) {
                $q->where('is_active', $request->status === 'active' || $request->status === '1');
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Trade/Promotions/Index', [
            'promotions' => $promotions,
            'filters' => [
                'search' => $request->search,
                'type' => $request->type,
                'status' => $request->status,
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

        return Inertia::render('Trade/Promotions/Create', [
            'products' => $products,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'name_ar' => 'nullable|string|max:150',
            'code' => 'nullable|string|max:50',
            'type' => 'required|in:bogo,percentage,fixed_amount',
            'buy_product_id' => 'nullable|required_if:type,bogo|uuid|exists:products,id',
            'buy_quantity' => 'nullable|numeric|min:1',
            'get_product_id' => 'nullable|uuid|exists:products,id',
            'get_quantity' => 'nullable|numeric|min:1',
            'get_discount_percentage' => 'nullable|numeric|min:1|max:100',
            'min_order_amount' => 'nullable|numeric|min:0',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'fixed_discount_amount' => 'nullable|numeric|min:0',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'apply_automatically' => 'boolean',
            'is_active' => 'boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        Promotion::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'code' => ! empty($validated['code']) ? strtoupper(trim($validated['code'])) : null,
            'name' => $validated['name'],
            'name_ar' => $validated['name_ar'] ?? null,
            'type' => $validated['type'],
            'buy_product_id' => $validated['buy_product_id'] ?? null,
            'buy_quantity' => $validated['buy_quantity'] ?? 1,
            'get_product_id' => $validated['get_product_id'] ?? ($validated['buy_product_id'] ?? null),
            'get_quantity' => $validated['get_quantity'] ?? 1,
            'get_discount_percentage' => $validated['get_discount_percentage'] ?? 100,
            'min_order_amount' => $validated['min_order_amount'] ?? 0,
            'discount_rate' => $validated['discount_rate'] ?? 0,
            'fixed_discount_amount' => $validated['fixed_discount_amount'] ?? 0,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'apply_automatically' => $validated['apply_automatically'] ?? true,
            'is_active' => $validated['is_active'] ?? true,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('trade.promotions.index')
            ->with('success', 'تم إنشاء وتفعيل العرض الترويجي بنجاح.');
    }

    public function toggleStatus(string $id): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $promotion = Promotion::where('company_id', $companyId)->findOrFail($id);

        $promotion->is_active = ! $promotion->is_active;
        $promotion->save();

        $statusMsg = $promotion->is_active ? 'تفعيل' : 'تعطيل';

        return redirect()->back()
            ->with('success', "تم {$statusMsg} العرض الترويجي بنجاح.");
    }

    public function destroy(string $id): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $promotion = Promotion::where('company_id', $companyId)->findOrFail($id);
        $promotion->delete();

        return redirect()->route('trade.promotions.index')
            ->with('success', 'تم حذف العرض الترويجي بنجاح.');
    }

    /**
     * Real-time JSON calculation API for POS & Sales cart.
     */
    public function evaluate(Request $request): JsonResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'coupon_code' => 'nullable|string',
            'price_list_id' => 'nullable|uuid|exists:price_lists,id',
        ]);

        $result = $this->evaluatePromotionsService->evaluate(
            $companyId,
            $validated['items'],
            [
                'coupon_code' => $validated['coupon_code'] ?? null,
                'price_list_id' => $validated['price_list_id'] ?? null,
            ]
        );

        return response()->json($result);
    }
}
