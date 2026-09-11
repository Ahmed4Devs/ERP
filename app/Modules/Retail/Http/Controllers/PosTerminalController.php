<?php

namespace App\Modules\Retail\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Retail\Models\PosOrder;
use App\Modules\Retail\Models\PosTerminal;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosTerminalController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $terminals = PosTerminal::where('company_id', $companyId)
            ->with(['branch', 'warehouse', 'cashAccount', 'sessions' => fn ($q) => $q->latest()->limit(1)])
            ->when($request->search, fn ($q, $search) => $q->where('name', 'ilike', "%{$search}%")->orWhere('code', 'ilike', "%{$search}%"))
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $branches = Branch::where('company_id', $companyId)->get();
        $warehouses = Warehouse::where('company_id', $companyId)->get();
        $cashAccounts = Account::where('company_id', $companyId)->whereIn('subtype', ['cash', 'bank'])->get();

        return Inertia::render('Retail/Terminals/Index', [
            'terminals' => $terminals,
            'branches' => $branches,
            'warehouses' => $warehouses,
            'cashAccounts' => $cashAccounts,
            'filters' => [
                'search' => $request->search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'branch_id' => 'required|uuid|exists:branches,id',
            'warehouse_id' => 'required|uuid|exists:warehouses,id',
            'cash_account_id' => 'required|uuid|exists:accounts,id',
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:50',
            'status' => 'nullable|string|in:active,inactive',
        ]);

        PosTerminal::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'branch_id' => $validated['branch_id'],
            'warehouse_id' => $validated['warehouse_id'],
            'cash_account_id' => $validated['cash_account_id'],
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'status' => $validated['status'] ?? 'active',
        ]);

        return redirect()->route('retail.terminals.index')
            ->with('success', 'POS Terminal created successfully.');
    }

    public function terminal(PosTerminal $terminal): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $terminal->load(['branch', 'warehouse', 'cashAccount']);
        $activeSession = $terminal->activeSession();
        if ($activeSession) {
            $activeSession->load('user');
        }

        // Available products with warehouse inventory level
        $products = Product::where('company_id', $companyId)
            ->where('is_active', true)
            ->with(['category', 'unit', 'inventoryLevels' => fn ($q) => $q->where('warehouse_id', $terminal->warehouse_id)])
            ->orderBy('name')
            ->get()
            ->map(function ($product) {
                $level = $product->inventoryLevels->first();

                return [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'name' => $product->name,
                    'name_ar' => $product->name_ar,
                    'list_price' => (float) $product->list_price,
                    'tax_rate' => (float) ($product->tax_rate ?? 0.10),
                    'quantity_available' => $level ? (float) $level->quantity_available : 0.0,
                    'category_name' => $product->category?->name,
                ];
            });

        $customers = Party::where('type', 'customer')
            ->where('status', 'active')
            ->select('id', 'name', 'name_ar', 'tax_id', 'phone')
            ->get();

        $recentOrders = [];
        if ($activeSession) {
            $recentOrders = PosOrder::where('session_id', $activeSession->id)
                ->with(['lines.product', 'customer'])
                ->latest()
                ->limit(10)
                ->get();
        }

        return Inertia::render('Retail/POS/Terminal', [
            'terminal' => $terminal,
            'activeSession' => $activeSession,
            'products' => $products,
            'customers' => $customers,
            'recentOrders' => $recentOrders,
        ]);
    }
}
