<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\ProductCategory;
use App\Modules\Inventory\Models\StocktakeSession;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\StocktakeService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StocktakeController extends Controller
{
    public function __construct(
        protected StocktakeService $stocktakeService
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $sessions = StocktakeSession::where('company_id', $companyId)
            ->with(['warehouse', 'createdBy'])
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/Stocktakes/Index', [
            'sessions' => $sessions,
        ]);
    }

    public function create(): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $warehouses = Warehouse::where('company_id', $companyId)->get();
        $categories = ProductCategory::where('company_id', $companyId)->get();

        return Inertia::render('Inventory/Stocktakes/Create', [
            'warehouses' => $warehouses,
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'date' => ['required', 'date'],
            'count_type' => ['required', 'in:full,selective'],
            'category_ids' => ['nullable', 'array'],
            'notes' => ['nullable', 'string'],
        ]);

        $session = $this->stocktakeService->createSession([
            'warehouse_id' => $request->input('warehouse_id'),
            'date' => $request->input('date'),
            'count_type' => $request->input('count_type'),
            'category_ids' => $request->input('category_ids') ?? [],
            'notes' => $request->input('notes'),
        ]);

        return redirect()->route('inventory.stocktakes.show', $session->id)
            ->with('success', 'Stocktake session initialized successfully.');
    }

    public function show(StocktakeSession $stocktake): Response
    {
        $currentCompany = app(CurrentCompany::class);
        if ($stocktake->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $stocktake->load([
            'warehouse',
            'createdBy',
            'stockAdjustment.lines',
            'lines.product.category',
        ]);

        return Inertia::render('Inventory/Stocktakes/Show', [
            'session' => $stocktake,
        ]);
    }

    public function recordCounts(Request $request, StocktakeSession $stocktake): RedirectResponse
    {
        $currentCompany = app(CurrentCompany::class);
        if ($stocktake->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $request->validate([
            'counts' => ['required', 'array'],
            'counts.*.line_id' => ['required', 'exists:stocktake_session_lines,id'],
            'counts.*.counted_quantity' => ['required', 'numeric', 'min:0'],
            'counts.*.notes' => ['nullable', 'string'],
        ]);

        $this->stocktakeService->recordCounts($stocktake, $request->input('counts'));

        return redirect()->route('inventory.stocktakes.show', $stocktake->id)
            ->with('success', 'Stock counts recorded successfully.');
    }

    public function finalize(StocktakeSession $stocktake): RedirectResponse
    {
        $currentCompany = app(CurrentCompany::class);
        if ($stocktake->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $this->stocktakeService->finalizeAndAdjust($stocktake);

        return redirect()->route('inventory.stocktakes.show', $stocktake->id)
            ->with('success', 'Stocktake session finalized and inventory adjustments posted.');
    }
}
