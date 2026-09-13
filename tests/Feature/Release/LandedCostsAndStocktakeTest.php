<?php

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Inventory\Models\GoodsReceipt;
use App\Modules\Inventory\Models\GoodsReceiptLine;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\LandedCost;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\StocktakeSession;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\LandedCostService;
use App\Modules\Inventory\Services\StocktakeService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
    $this->tenant = Tenant::where('slug', 'al-amal')->first();
    $this->company = Company::where('tenant_id', $this->tenant->id)->first();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $this->warehouse = Warehouse::where('company_id', $this->company->id)->first();

    $this->landedCostService = app(LandedCostService::class);
    $this->stocktakeService = app(StocktakeService::class);

    $this->withoutVite();
});

test('it creates and posts landed cost voucher with accurate allocations and GL entries', function () {
    $vendor = Party::where('tenant_id', $this->tenant->id)->first();
    $product1 = Product::where('company_id', $this->company->id)->first();
    $product2 = Product::where('company_id', $this->company->id)->skip(1)->first();

    // Set initial product cost
    $product1->update(['moving_average_cost' => 100.00]);
    $product2->update(['moving_average_cost' => 200.00]);

    // Create a mock goods receipt
    $grn = GoodsReceipt::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'warehouse_id' => $this->warehouse->id,
        'party_id' => $vendor->id,
        'receipt_number' => 'GRN-TEST-001',
        'date' => '2026-09-12',
        'status' => 'posted',
        'total_cost' => 5000.00,
    ]);

    $line1 = GoodsReceiptLine::create([
        'goods_receipt_id' => $grn->id,
        'product_id' => $product1->id,
        'description' => 'Product 1 imported',
        'quantity' => 10,
        'unit_cost' => 100.00,
        'total_cost' => 1000.00,
    ]);

    $line2 = GoodsReceiptLine::create([
        'goods_receipt_id' => $grn->id,
        'product_id' => $product2->id,
        'description' => 'Product 2 imported',
        'quantity' => 20,
        'unit_cost' => 200.00,
        'total_cost' => 4000.00,
    ]);

    // Ensure inventory levels exist
    InventoryLevel::updateOrCreate(
        ['warehouse_id' => $this->warehouse->id, 'product_id' => $product1->id],
        ['quantity_on_hand' => 10, 'quantity_reserved' => 0]
    );
    InventoryLevel::updateOrCreate(
        ['warehouse_id' => $this->warehouse->id, 'product_id' => $product2->id],
        ['quantity_on_hand' => 20, 'quantity_reserved' => 0]
    );

    // Create Landed Cost Voucher
    $voucher = LandedCost::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'voucher_number' => 'LCV-2026-0001',
        'date' => '2026-09-13',
        'status' => 'draft',
        'allocation_method' => 'by_value',
        'total_charges' => 1000.00,
        'created_by_id' => $this->user->id,
    ]);

    $voucher->receipts()->attach([$grn->id]);

    // Add charges: 600 customs, 400 freight
    $voucher->charges()->create([
        'cost_type' => 'customs',
        'description' => 'Customs Duty',
        'amount' => 600.00,
    ]);
    $voucher->charges()->create([
        'cost_type' => 'freight',
        'description' => 'Ocean Freight',
        'amount' => 400.00,
    ]);

    // Compute allocations
    $this->landedCostService->computeAllocations($voucher);

    $voucher->load('allocations');
    expect($voucher->allocations)->toHaveCount(2);

    // By value: total goods value = 1000 + 4000 = 5000
    // Line 1 is 20% (1000/5000) -> 200 allocated, per unit extra = 200/10 = 20 -> new cost 120
    // Line 2 is 80% (4000/5000) -> 800 allocated, per unit extra = 800/20 = 40 -> new cost 240
    $alloc1 = $voucher->allocations->firstWhere('product_id', $product1->id);
    $alloc2 = $voucher->allocations->firstWhere('product_id', $product2->id);

    expect((float) $alloc1->allocated_amount)->toBe(200.00)
        ->and((float) $alloc1->new_unit_cost)->toBe(120.00)
        ->and((float) $alloc2->allocated_amount)->toBe(800.00)
        ->and((float) $alloc2->new_unit_cost)->toBe(240.00);

    // Post the voucher
    $postedVoucher = $this->landedCostService->post($voucher);

    expect($postedVoucher->status)->toBe('posted')
        ->and($postedVoucher->journal_entry_id)->not->toBeNull();

    // Verify GL entries: Debit Inventory 1300 (1000), Credit Clearing 2020 (1000)
    $entry = JournalEntry::with('lines.account')->find($postedVoucher->journal_entry_id);
    expect($entry)->not->toBeNull();

    $invDebit = $entry->lines->firstWhere('debit', '>', 0);
    expect((float) $invDebit->debit)->toBe(1000.00)
        ->and($invDebit->account->code)->toBe('1300');

    // Verify product unit cost updated
    $product1->refresh();
    $product2->refresh();
    expect((float) $product1->moving_average_cost)->toBe(120.00)
        ->and((float) $product2->moving_average_cost)->toBe(240.00);
});

test('it executes physical stocktake session and generates auto stock adjustment', function () {
    $product = Product::where('company_id', $this->company->id)->first();
    $product->update(['moving_average_cost' => 50.00]);

    // Set initial book quantity = 100 in warehouse
    InventoryLevel::updateOrCreate(
        ['warehouse_id' => $this->warehouse->id, 'product_id' => $product->id],
        ['quantity_on_hand' => 100, 'quantity_reserved' => 0]
    );

    // 1. Create Stocktake Session
    $session = $this->stocktakeService->createSession([
        'warehouse_id' => $this->warehouse->id,
        'date' => '2026-09-13',
        'count_type' => 'full',
    ]);

    expect($session)->toBeInstanceOf(StocktakeSession::class)
        ->and($session->status)->toBe('draft')
        ->and($session->lines)->not->toBeEmpty();

    $targetLine = $session->lines->firstWhere('product_id', $product->id);
    expect($targetLine)->not->toBeNull()
        ->and((float) $targetLine->book_quantity)->toBe(100.00);

    // 2. Count physical items: Actual count is 95 (variance = -5 items deficit)
    $updatedSession = $this->stocktakeService->recordCounts($session, [
        [
            'line_id' => $targetLine->id,
            'counted_quantity' => 95,
        ],
    ]);

    expect($updatedSession->status)->toBe('in_progress');
    $updatedLine = $updatedSession->lines->firstWhere('id', $targetLine->id);
    expect((float) $updatedLine->counted_quantity)->toBe(95.00)
        ->and((float) $updatedLine->variance_quantity)->toBe(-5.00)
        ->and((float) $updatedLine->variance_amount)->toBe(-250.00); // -5 * 50 = -250

    // 3. Finalize and adjust
    $finalized = $this->stocktakeService->finalizeAndAdjust($updatedSession);

    expect($finalized->status)->toBe('completed')
        ->and($finalized->stock_adjustment_id)->not->toBeNull();

    // Verify stock level adjusted to 95
    $invLevel = InventoryLevel::where('warehouse_id', $this->warehouse->id)
        ->where('product_id', $product->id)
        ->first();
    expect((float) $invLevel->quantity_on_hand)->toBe(95.00);
});

test('it verifies HTTP endpoints for landed costs and stocktakes', function () {
    $this->actingAs($this->user);

    // Landed costs index
    $response = $this->get('/inventory/landed-costs');
    $response->assertOk();

    // Landed costs create
    $response = $this->get('/inventory/landed-costs/create');
    $response->assertOk();

    // Stocktakes index
    $response = $this->get('/inventory/stocktakes');
    $response->assertOk();

    // Stocktakes create
    $response = $this->get('/inventory/stocktakes/create');
    $response->assertOk();
});
