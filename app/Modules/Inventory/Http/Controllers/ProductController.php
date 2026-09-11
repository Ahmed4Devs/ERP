<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\ProductCategory;
use App\Modules\Inventory\Models\UnitOfMeasure;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $products = Product::where('company_id', $companyId)
            ->with(['category', 'unit', 'inventoryLevels.warehouse'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('sku', 'ilike', "%{$search}%")
                        ->orWhere('name', 'ilike', "%{$search}%")
                        ->orWhere('name_ar', 'ilike', "%{$search}%")
                        ->orWhere('barcode', 'ilike', "%{$search}%");
                });
            })
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->type, fn ($q) => $q->where('type', $request->type))
            ->orderBy('sku', 'asc')
            ->paginate(15)
            ->withQueryString();

        $categories = ProductCategory::where(function ($q) use ($companyId): void {
            $q->where('company_id', $companyId)->orWhereNull('company_id');
        })->get(['id', 'code', 'name', 'name_ar']);

        return Inertia::render('Inventory/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => [
                'search' => $request->search,
                'category_id' => $request->category_id,
                'type' => $request->type,
            ],
        ]);
    }

    public function create(): Response
    {
        $tenantId = app(CurrentTenant::class)->id();
        $companyId = app(CurrentCompany::class)->id();

        $categories = ProductCategory::where(function ($q) use ($companyId): void {
            $q->where('company_id', $companyId)->orWhereNull('company_id');
        })->where('is_active', true)->get(['id', 'code', 'name', 'name_ar']);

        $units = UnitOfMeasure::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get(['id', 'code', 'name', 'name_ar', 'symbol']);

        $accounts = Account::where('company_id', $companyId)
            ->where('is_postable', true)
            ->get(['id', 'code', 'name', 'name_ar', 'type', 'subtype']);

        return Inertia::render('Inventory/Products/Create', [
            'categories' => $categories,
            'units' => $units,
            'accounts' => $accounts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $tenantId = app(CurrentTenant::class)->id();
        $companyId = app(CurrentCompany::class)->id();

        $validated = $request->validate([
            'sku' => 'required|string|max:100|unique:products,sku,NULL,id,company_id,'.$companyId,
            'barcode' => 'nullable|string|max:100',
            'name' => 'required|string|max:200',
            'name_ar' => 'nullable|string|max:200',
            'description' => 'nullable|string',
            'type' => 'required|string|in:storable,consumable,service',
            'category_id' => 'nullable|uuid|exists:product_categories,id',
            'unit_id' => 'required|uuid|exists:units_of_measure,id',
            'standard_cost' => 'nullable|numeric|min:0',
            'list_price' => 'nullable|numeric|min:0',
            'inventory_account_id' => 'nullable|uuid|exists:accounts,id',
            'cogs_account_id' => 'nullable|uuid|exists:accounts,id',
            'revenue_account_id' => 'nullable|uuid|exists:accounts,id',
            'grni_account_id' => 'nullable|uuid|exists:accounts,id',
            'tax_rate' => 'nullable|numeric|min:0|max:1',
            'is_active' => 'boolean',
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['company_id'] = $companyId;
        $validated['standard_cost'] = $validated['standard_cost'] ?? 0;
        $validated['moving_average_cost'] = 0;
        $validated['list_price'] = $validated['list_price'] ?? 0;
        $validated['tax_rate'] = $validated['tax_rate'] ?? 0.10;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $product = Product::create($validated);

        return redirect()->route('inventory.products.index')
            ->with('success', 'Product created successfully.');
    }

    public function edit(Product $product): Response
    {
        $tenantId = app(CurrentTenant::class)->id();
        $companyId = app(CurrentCompany::class)->id();

        $categories = ProductCategory::where(function ($q) use ($companyId): void {
            $q->where('company_id', $companyId)->orWhereNull('company_id');
        })->where('is_active', true)->get(['id', 'code', 'name', 'name_ar']);

        $units = UnitOfMeasure::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get(['id', 'code', 'name', 'name_ar', 'symbol']);

        $accounts = Account::where('company_id', $companyId)
            ->where('is_postable', true)
            ->get(['id', 'code', 'name', 'name_ar', 'type', 'subtype']);

        return Inertia::render('Inventory/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'units' => $units,
            'accounts' => $accounts,
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();

        $validated = $request->validate([
            'sku' => 'required|string|max:100|unique:products,sku,'.$product->id.',id,company_id,'.$companyId,
            'barcode' => 'nullable|string|max:100',
            'name' => 'required|string|max:200',
            'name_ar' => 'nullable|string|max:200',
            'description' => 'nullable|string',
            'type' => 'required|string|in:storable,consumable,service',
            'category_id' => 'nullable|uuid|exists:product_categories,id',
            'unit_id' => 'required|uuid|exists:units_of_measure,id',
            'standard_cost' => 'nullable|numeric|min:0',
            'list_price' => 'nullable|numeric|min:0',
            'inventory_account_id' => 'nullable|uuid|exists:accounts,id',
            'cogs_account_id' => 'nullable|uuid|exists:accounts,id',
            'revenue_account_id' => 'nullable|uuid|exists:accounts,id',
            'grni_account_id' => 'nullable|uuid|exists:accounts,id',
            'tax_rate' => 'nullable|numeric|min:0|max:1',
            'is_active' => 'boolean',
        ]);

        $product->update($validated);

        return redirect()->route('inventory.products.index')
            ->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('inventory.products.index')
            ->with('success', 'Product deleted successfully.');
    }
}
