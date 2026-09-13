<?php

namespace App\Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Inventory\Models\GoodsReceipt;
use App\Modules\Inventory\Models\LandedCost;
use App\Modules\Inventory\Models\LandedCostCharge;
use App\Modules\Inventory\Services\LandedCostService;
use App\Modules\MasterData\Models\Party;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LandedCostController extends Controller
{
    public function __construct(
        protected LandedCostService $landedCostService
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $landedCosts = LandedCost::where('company_id', $companyId)
            ->with(['receipts', 'journalEntry'])
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/LandedCosts/Index', [
            'landedCosts' => $landedCosts,
        ]);
    }

    public function create(): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $currentTenant = app(CurrentTenant::class);
        $companyId = $currentCompany->id();
        $tenantId = $currentTenant->id();

        // Fetch posted goods receipts that can have landed costs allocated
        $goodsReceipts = GoodsReceipt::where('company_id', $companyId)
            ->where('status', 'posted')
            ->with(['warehouse', 'party', 'lines.product'])
            ->latest('date')
            ->take(50)
            ->get();

        $accounts = Account::where('company_id', $companyId)
            ->where('is_postable', true)
            ->whereIn('type', ['liability', 'expense', 'asset'])
            ->orderBy('code')
            ->get();

        $vendors = Party::where('tenant_id', $tenantId)
            ->whereIn('type', ['vendor', 'supplier'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Inventory/LandedCosts/Create', [
            'goodsReceipts' => $goodsReceipts,
            'accounts' => $accounts,
            'vendors' => $vendors,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
            'allocation_method' => ['required', 'in:by_value,by_quantity'],
            'goods_receipt_ids' => ['required', 'array', 'min:1'],
            'goods_receipt_ids.*' => ['required', 'exists:goods_receipts,id'],
            'charges' => ['required', 'array', 'min:1'],
            'charges.*.cost_type' => ['required', 'string'],
            'charges.*.amount' => ['required', 'numeric', 'min:0.01'],
            'charges.*.description' => ['nullable', 'string'],
            'charges.*.vendor_party_id' => ['nullable', 'exists:parties,id'],
            'charges.*.expense_account_id' => ['nullable', 'exists:accounts,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $voucherNumber = 'LCV-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4));

        $landedCost = LandedCost::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'branch_id' => $request->user()->branch_id,
            'voucher_number' => $voucherNumber,
            'date' => $request->input('date'),
            'status' => 'draft',
            'allocation_method' => $request->input('allocation_method'),
            'total_charges' => 0,
            'notes' => $request->input('notes'),
            'created_by_id' => $request->user()->id,
        ]);

        $landedCost->receipts()->attach($request->input('goods_receipt_ids'));

        foreach ($request->input('charges') as $chargeData) {
            LandedCostCharge::create([
                'landed_cost_id' => $landedCost->id,
                'cost_type' => $chargeData['cost_type'],
                'description' => $chargeData['description'] ?? null,
                'amount' => $chargeData['amount'],
                'vendor_party_id' => $chargeData['vendor_party_id'] ?? null,
                'expense_account_id' => $chargeData['expense_account_id'] ?? null,
            ]);
        }

        $this->landedCostService->computeAllocations($landedCost);

        return redirect()->route('inventory.landed-costs.show', $landedCost->id)
            ->with('success', 'Landed cost voucher created successfully.');
    }

    public function show(LandedCost $landedCost): Response
    {
        $currentCompany = app(CurrentCompany::class);
        if ($landedCost->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $landedCost->load([
            'receipts.warehouse',
            'receipts.party',
            'charges.vendor',
            'charges.expenseAccount',
            'allocations.product',
            'allocations.goodsReceiptLine',
            'journalEntry.lines.account',
            'createdBy',
        ]);

        return Inertia::render('Inventory/LandedCosts/Show', [
            'landedCost' => $landedCost,
        ]);
    }

    public function post(LandedCost $landedCost): RedirectResponse
    {
        $currentCompany = app(CurrentCompany::class);
        if ($landedCost->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $this->landedCostService->post($landedCost);

        return redirect()->route('inventory.landed-costs.show', $landedCost->id)
            ->with('success', 'Landed cost voucher posted successfully.');
    }
}
