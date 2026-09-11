<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Inventory\Exceptions\InsufficientStockException;
use App\Modules\Inventory\Models\GoodsReceipt;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Queries\InventoryValuationQuery;
use App\Modules\Inventory\Services\InventoryCostingEngine;
use App\Modules\Inventory\Services\PostGoodsReceiptAction;
use App\Modules\Inventory\Services\PostStockAdjustmentAction;
use App\Modules\Inventory\Services\PostStockTransferAction;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Purchasing\Models\VendorProfile;
use App\Modules\Purchasing\Services\PostVendorBillAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
});

test('perpetual moving weighted-average recalculates unit cost on receipt and preserves unit cost on issue', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $warehouse = Warehouse::where('company_id', $companyA->id)->firstOrFail();
    $product = Product::where('company_id', $companyA->id)->where('sku', 'PRD-LAP-001')->firstOrFail();

    // Set tenancy context
    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $engine = app(InventoryCostingEngine::class);

    // 1. First Inbound Receipt: 10 units @ 100.00 SAR
    // Expected: Qty = 10, Total Value = 1,000, Avg Cost = 100.00
    $result1 = $engine->receiveStock([
        'company_id' => $companyA->id,
        'tenant_id' => $tenantA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'unit_cost' => 100.00,
        'date' => '2026-03-01',
    ]);

    expect((float) $result1['inventory_level']->quantity_on_hand)->toBe(10.0)
        ->and((float) $result1['inventory_level']->moving_average_cost)->toBe(100.0)
        ->and((float) $result1['inventory_level']->total_value)->toBe(1000.0);

    // 2. Second Inbound Receipt: 20 units @ 130.00 SAR
    // Formula: (1,000 + 20 * 130) / (10 + 20) = 3,600 / 30 = 120.00 SAR
    $result2 = $engine->receiveStock([
        'company_id' => $companyA->id,
        'tenant_id' => $tenantA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $product->id,
        'quantity' => 20,
        'unit_cost' => 130.00,
        'date' => '2026-03-05',
    ]);

    expect((float) $result2['inventory_level']->quantity_on_hand)->toBe(30.0)
        ->and((float) $result2['inventory_level']->moving_average_cost)->toBe(120.0)
        ->and((float) $result2['inventory_level']->total_value)->toBe(3600.0);

    // 3. Outbound Issue: 15 units
    // Expected: Issue cost = 120.00 SAR, remaining Qty = 15, remaining Total Value = 1,800.00, Avg Cost remains 120.00 SAR
    $result3 = $engine->issueStock([
        'company_id' => $companyA->id,
        'tenant_id' => $tenantA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $product->id,
        'quantity' => 15,
        'date' => '2026-03-10',
    ]);

    expect((float) $result3['inventory_level']->quantity_on_hand)->toBe(15.0)
        ->and((float) $result3['inventory_level']->moving_average_cost)->toBe(120.0)
        ->and((float) $result3['inventory_level']->total_value)->toBe(1800.0)
        ->and($result3['stock_movement']->direction)->toBe('out')
        ->and((float) $result3['stock_movement']->unit_cost)->toBe(120.0)
        ->and((float) $result3['stock_movement']->total_cost)->toBe(1800.0);
});

test('insufficient stock prevents negative inventory at application level', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $warehouse = Warehouse::where('company_id', $companyA->id)->firstOrFail();
    $product = Product::where('company_id', $companyA->id)->where('sku', 'PRD-MON-001')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $engine = app(InventoryCostingEngine::class);

    // Receive 5 units
    $engine->receiveStock([
        'company_id' => $companyA->id,
        'tenant_id' => $tenantA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $product->id,
        'quantity' => 5,
        'unit_cost' => 1000.00,
    ]);

    // Attempting to issue 6 units must throw InsufficientStockException
    expect(function () use ($engine, $companyA, $tenantA, $warehouse, $product) {
        $engine->issueStock([
            'company_id' => $companyA->id,
            'tenant_id' => $tenantA->id,
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity' => 6,
        ]);
    })->toThrow(InsufficientStockException::class);

    $level = InventoryLevel::where('warehouse_id', $warehouse->id)->where('product_id', $product->id)->first();
    expect((float) $level->quantity_on_hand)->toBe(5.0);
});

test('goods receipt posts atomically with balanced GL: Debit 1300 Inventory vs Credit 2020 GRNI Clearing', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $warehouse = Warehouse::where('company_id', $companyA->id)->firstOrFail();
    $vendor = VendorProfile::where('company_id', $companyA->id)->firstOrFail();
    $product = Product::where('company_id', $companyA->id)->where('sku', 'PRD-LAP-001')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // Post Goods Receipt for 10 units @ 3,500.00 SAR = 35,000.00 SAR
    $response = $this->actingAs($userA)->post(route('inventory.receipts.store'), [
        'warehouse_id' => $warehouse->id,
        'party_id' => $vendor->party_id,
        'date' => '2026-03-12',
        'notes' => 'Bulk shipment of laptops received at Riyadh Central',
        'lines' => [
            [
                'product_id' => $product->id,
                'description' => 'Dell Latitude 5540 Business Laptops',
                'quantity' => 10,
                'unit_cost' => 3500.00,
            ],
        ],
    ]);

    $response->assertRedirect();

    $receipt = GoodsReceipt::where('party_id', $vendor->party_id)->latest('created_at')->first();
    expect($receipt)->not->toBeNull()
        ->and($receipt->status)->toBe('posted')
        ->and((float) $receipt->total_cost)->toBe(35000.00)
        ->and($receipt->journal_entry_id)->not->toBeNull();

    // Verify GL Double-Entry Posting
    $journalEntry = JournalEntry::with('lines.account')->findOrFail($receipt->journal_entry_id);
    expect($journalEntry->status)->toBe('posted')
        ->and((float) $journalEntry->lines->sum('debit'))->toBe((float) $journalEntry->lines->sum('credit'));

    $invLine = $journalEntry->lines->first(fn ($l) => $l->account->code === '1300');
    $grniLine = $journalEntry->lines->first(fn ($l) => $l->account->code === '2020');

    expect($invLine)->not->toBeNull()
        ->and((float) $invLine->debit)->toBe(35000.00)
        ->and((float) $invLine->credit)->toBe(0.00)
        ->and($grniLine)->not->toBeNull()
        ->and((float) $grniLine->debit)->toBe(0.00)
        ->and((float) $grniLine->credit)->toBe(35000.00);

    // Verify Stock Movement
    $movement = StockMovement::where('reference_type', GoodsReceipt::class)
        ->where('reference_id', $receipt->id)
        ->first();

    expect($movement)->not->toBeNull()
        ->and($movement->direction)->toBe('in')
        ->and((float) $movement->quantity)->toBe(10.0)
        ->and((float) $movement->unit_cost)->toBe(3500.00)
        ->and((float) $movement->total_cost)->toBe(35000.00);

    // Verify Account Balances in Chart of Accounts
    $acc1300 = Account::where('company_id', $companyA->id)->where('code', '1300')->first();
    $acc2020 = Account::where('company_id', $companyA->id)->where('code', '2020')->first();

    expect((float) $acc1300->current_balance)->toBe(35000.00)
        ->and((float) $acc2020->current_balance)->toBe(35000.00); // Normal credit balance is stored positive
});

test('vendor bill clears 2020 GRNI account in full procure-to-pay 3-way matching', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $warehouse = Warehouse::where('company_id', $companyA->id)->firstOrFail();
    $vendor = VendorProfile::where('company_id', $companyA->id)->firstOrFail();
    $product = Product::where('company_id', $companyA->id)->where('sku', 'PRD-MON-001')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // 1. Receive goods: 10 monitors @ 1,200.00 SAR = 12,000.00 SAR
    $grnAction = app(PostGoodsReceiptAction::class);
    $receipt = $grnAction->execute([
        'warehouse_id' => $warehouse->id,
        'party_id' => $vendor->party_id,
        'date' => '2026-03-15',
        'lines' => [
            [
                'product_id' => $product->id,
                'quantity' => 10,
                'unit_cost' => 1200.00,
            ],
        ],
    ]);

    $grniAccount = Account::where('company_id', $companyA->id)->where('code', '2020')->firstOrFail();
    // After receipt: GRNI has a credit balance of 12,000 SAR (stored positive for liability)
    expect((float) $grniAccount->current_balance)->toBe(12000.00);

    // 2. Vendor Bill arrives: Bill for the 10 monitors against GRNI clearing account
    $billAction = app(PostVendorBillAction::class);
    $bill = $billAction->execute([
        'party_id' => $vendor->party_id,
        'date' => '2026-03-18',
        'due_date' => '2026-04-18',
        'vendor_invoice_ref' => 'INV-DELTA-9876',
        'lines' => [
            [
                'description' => 'Dell 27" UltraSharp 4K Monitors (GRN Matched)',
                'quantity' => 10,
                'unit_price' => 1200.00,
                'expense_account_id' => $grniAccount->id, // Debits GRNI instead of standard expense!
            ],
        ],
    ]);

    // Verify Bill Posting:
    // Subtotal = 12,000 SAR (DR 2020 GRNI)
    // 10% Test Tax = 1,200 SAR (DR 1150 Input Tax)
    // AP Total = 13,200 SAR (CR 2010 AP)
    expect((float) $bill->subtotal)->toBe(12000.00)
        ->and((float) $bill->tax_amount)->toBe(1200.00)
        ->and((float) $bill->total)->toBe(13200.00);

    // 3. Verify GRNI Clearing Account has settled back to 0.00!
    $grniAccount->refresh();
    expect((float) $grniAccount->current_balance)->toBe(0.00);

    // Verify AP Control account increased by full bill total
    $apAccount = Account::where('company_id', $companyA->id)->where('code', '2010')->firstOrFail();
    expect((float) $apAccount->current_balance)->toBe(13200.00);
});

test('stock transfer moves inventory between warehouses without altering total company valuation', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $whRuh = Warehouse::where('company_id', $companyA->id)->where('code', 'WH-RUH-01')->firstOrFail();
    $whDmm = Warehouse::where('company_id', $companyA->id)->where('code', 'WH-DMM-01')->firstOrFail();
    $vendor = VendorProfile::where('company_id', $companyA->id)->firstOrFail();
    $product = Product::where('company_id', $companyA->id)->where('sku', 'PRD-CHAIR-001')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // Initial receipt in Riyadh: 20 chairs @ 600.00 = 12,000.00 SAR
    $grnAction = app(PostGoodsReceiptAction::class);
    $grnAction->execute([
        'warehouse_id' => $whRuh->id,
        'party_id' => $vendor->party_id,
        'date' => '2026-03-20',
        'lines' => [
            ['product_id' => $product->id, 'quantity' => 20, 'unit_cost' => 600.00],
        ],
    ]);

    // Transfer 8 chairs from Riyadh to Dammam
    $transferAction = app(PostStockTransferAction::class);
    $transfer = $transferAction->execute([
        'from_warehouse_id' => $whRuh->id,
        'to_warehouse_id' => $whDmm->id,
        'date' => '2026-03-22',
        'notes' => 'Showroom display chairs transfer',
        'lines' => [
            ['product_id' => $product->id, 'quantity' => 8],
        ],
    ]);

    expect($transfer->status)->toBe('posted')
        ->and((float) $transfer->total_value)->toBe(4800.00);

    // Check levels in both warehouses
    $lvlRuh = InventoryLevel::where('warehouse_id', $whRuh->id)->where('product_id', $product->id)->firstOrFail();
    $lvlDmm = InventoryLevel::where('warehouse_id', $whDmm->id)->where('product_id', $product->id)->firstOrFail();

    expect((float) $lvlRuh->quantity_on_hand)->toBe(12.0)
        ->and((float) $lvlRuh->moving_average_cost)->toBe(600.00)
        ->and((float) $lvlRuh->total_value)->toBe(7200.00)
        ->and((float) $lvlDmm->quantity_on_hand)->toBe(8.0)
        ->and((float) $lvlDmm->moving_average_cost)->toBe(600.00)
        ->and((float) $lvlDmm->total_value)->toBe(4800.00);

    // Verify company GL 1300 balance is unchanged (still 12,000 SAR)
    $invAccount = Account::where('company_id', $companyA->id)->where('code', '1300')->firstOrFail();
    expect((float) $invAccount->current_balance)->toBe(12000.00);
});

test('stock adjustment records physical variance and balances with GL 5900 Inventory Variance', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $wh = Warehouse::where('company_id', $companyA->id)->firstOrFail();
    $vendor = VendorProfile::where('company_id', $companyA->id)->firstOrFail();
    $product = Product::where('company_id', $companyA->id)->where('sku', 'PRD-MON-001')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // Initial receipt: 10 units @ 1,200.00 SAR
    app(PostGoodsReceiptAction::class)->execute([
        'warehouse_id' => $wh->id,
        'party_id' => $vendor->party_id,
        'date' => '2026-03-24',
        'lines' => [
            ['product_id' => $product->id, 'quantity' => 10, 'unit_cost' => 1200.00],
        ],
    ]);

    // Physical count finds: 1 unit damaged (shrinkage / decrease of 1 unit @ 1,200 SAR)
    $adjAction = app(PostStockAdjustmentAction::class);
    $adj = $adjAction->execute([
        'warehouse_id' => $wh->id,
        'date' => '2026-03-25',
        'reason' => 'damage',
        'notes' => 'One monitor cracked during unloading',
        'lines' => [
            [
                'product_id' => $product->id,
                'type' => 'decrease',
                'quantity' => 1,
            ],
        ],
    ]);

    expect($adj->status)->toBe('posted')
        ->and((float) $adj->total_cost_impact)->toBe(-1200.00);

    // Verify GL posting: DR 5900 (1,200) vs CR 1300 (1,200)
    $entry = JournalEntry::with('lines.account')->findOrFail($adj->journal_entry_id);
    expect($entry->status)->toBe('posted')
        ->and((float) $entry->lines->sum('debit'))->toBe((float) $entry->lines->sum('credit'));

    $varLine = $entry->lines->first(fn ($l) => $l->account->code === '5900');
    $invLine = $entry->lines->first(fn ($l) => $l->account->code === '1300');

    expect((float) $varLine->debit)->toBe(1200.00)
        ->and((float) $invLine->credit)->toBe(1200.00);

    // Remaining stock = 9 units @ 1,200.00 = 10,800.00 SAR
    $level = InventoryLevel::where('warehouse_id', $wh->id)->where('product_id', $product->id)->firstOrFail();
    expect((float) $level->quantity_on_hand)->toBe(9.0)
        ->and((float) $level->total_value)->toBe(10800.00);
});

test('inventory valuation query returns exact subledger total and reconciles with GL Account 1300', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $wh = Warehouse::where('company_id', $companyA->id)->firstOrFail();
    $vendor = VendorProfile::where('company_id', $companyA->id)->firstOrFail();
    $prod1 = Product::where('company_id', $companyA->id)->where('sku', 'PRD-LAP-001')->firstOrFail();
    $prod2 = Product::where('company_id', $companyA->id)->where('sku', 'PRD-CHAIR-001')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // Receive 5 laptops @ 3,500 = 17,500 SAR and 10 chairs @ 600 = 6,000 SAR
    // Total Inventory Value = 23,500 SAR
    app(PostGoodsReceiptAction::class)->execute([
        'warehouse_id' => $wh->id,
        'party_id' => $vendor->party_id,
        'date' => '2026-03-26',
        'lines' => [
            ['product_id' => $prod1->id, 'quantity' => 5, 'unit_cost' => 3500.00],
            ['product_id' => $prod2->id, 'quantity' => 10, 'unit_cost' => 600.00],
        ],
    ]);

    $query = app(InventoryValuationQuery::class);
    $report = $query->execute();

    expect((float) $report['total_valuation'])->toBe(23500.00)
        ->and((float) $report['gl_inventory_balance'])->toBe(23500.00)
        ->and((float) $report['valuation_variance'])->toBe(0.00)
        ->and($report['total_items_count'])->toBe(2);
});
