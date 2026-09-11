<?php

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Contracting\Actions\ApproveAndBillProgressClaimAction;
use App\Modules\Contracting\Models\ContractingClaim;
use App\Modules\Inventory\Exceptions\InsufficientStockException;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\InventoryCostingEngine;
use App\Modules\Manufacturing\Actions\CompleteProductionOrderAction;
use App\Modules\Manufacturing\Models\BillOfMaterial;
use App\Modules\Manufacturing\Models\ProductionOrder;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Retail\Actions\ClosePosSessionAction;
use App\Modules\Retail\Actions\CompletePosSaleAction;
use App\Modules\Retail\Actions\OpenPosSessionAction;
use App\Modules\Retail\Models\PosSession;
use App\Modules\Retail\Models\PosTerminal;
use App\Modules\Trade\Models\PriceList;
use App\Modules\Trade\Services\PriceResolverService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
});

test('retail pos session lifecycle: opening, preventing duplicates, and reconciliation closing', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $terminal = PosTerminal::where('company_id', $companyA->id)->where('code', 'POS-RUH-01')->firstOrFail();

    // Close any open session from seeder first
    PosSession::where('terminal_id', $terminal->id)->update(['status' => 'closed', 'closed_at' => now()]);

    $openAction = app(OpenPosSessionAction::class);
    $session = $openAction->execute([
        'terminal_id' => $terminal->id,
        'opening_cash' => '1500.000000',
        'user_id' => $userA->id,
        'notes' => 'Test shift opening',
    ]);

    expect($session->status)->toBe('open')
        ->and((float) $session->opening_cash)->toBe(1500.0)
        ->and((float) $session->expected_cash)->toBe(1500.0);

    // Prevent duplicate concurrent open sessions
    expect(fn () => $openAction->execute([
        'terminal_id' => $terminal->id,
        'opening_cash' => '500.00',
    ]))->toThrow(InvalidArgumentException::class);

    // Reconcile and close session
    $closeAction = app(ClosePosSessionAction::class);
    $closedSession = $closeAction->execute([
        'session_id' => $session->id,
        'closing_cash' => '1550.000000',
        'notes' => 'Counted drawer cash with 50 SAR surplus',
    ]);

    expect($closedSession->status)->toBe('closed')
        ->and($closedSession->closed_at)->not->toBeNull()
        ->and((float) $closedSession->cash_difference)->toBe(50.0);
});

test('retail pos complete sale relieves perpetual moving-average inventory, posts balanced GL, and produces ZATCA QR', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $terminal = PosTerminal::where('company_id', $companyA->id)->where('code', 'POS-RUH-01')->firstOrFail();
    $warehouse = Warehouse::find($terminal->warehouse_id);
    $product = Product::where('company_id', $companyA->id)->where('sku', 'PRD-LAP-001')->firstOrFail();

    // Ensure session is open
    $session = PosSession::where('terminal_id', $terminal->id)->where('status', 'open')->first();
    if (! $session) {
        $session = app(OpenPosSessionAction::class)->execute([
            'terminal_id' => $terminal->id,
            'opening_cash' => '1000.000000',
            'user_id' => $userA->id,
        ]);
    }

    // Receive initial stock into terminal warehouse: 10 units at 3500.00 SAR
    $costingEngine = app(InventoryCostingEngine::class);
    $costingEngine->receiveStock([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $product->id,
        'quantity' => '10.000000',
        'unit_cost' => '3500.000000',
    ]);

    $initialLevel = InventoryLevel::where('warehouse_id', $warehouse->id)
        ->where('product_id', $product->id)
        ->first();
    expect((float) $initialLevel->quantity_available)->toBeGreaterThanOrEqual(10.0);

    // Complete POS sale: 2 units at list price 4500.00 SAR each
    $saleAction = app(CompletePosSaleAction::class);
    $order = $saleAction->execute([
        'session_id' => $session->id,
        'payment_method' => 'cash',
        'cash_tendered' => '10000.00',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => '2.000000',
                'unit_price' => '4500.000000',
                'description' => 'Dell Laptop',
            ],
        ],
    ]);

    // Financial calculations: Subtotal = 9000, Tax (10%) = 900, Total = 9900, Change = 100
    expect((float) $order->subtotal)->toBe(9000.0)
        ->and((float) $order->tax_amount)->toBe(900.0)
        ->and((float) $order->total_amount)->toBe(9900.0)
        ->and((float) $order->cash_tendered)->toBe(10000.0)
        ->and((float) $order->change_due)->toBe(100.0);

    // Inventory relief: available stock decreased by 2
    $postLevel = InventoryLevel::where('warehouse_id', $warehouse->id)
        ->where('product_id', $product->id)
        ->first();
    expect((float) $postLevel->quantity_on_hand)->toBe((float) $initialLevel->quantity_on_hand - 2.0);

    // Session expected cash incremented by total cash sale (1000 + 9900 = 10900)
    $session->refresh();
    expect((float) $session->expected_cash)->toBe(10900.0);

    // ZATCA Base64 TLV string verification
    expect($order->qr_payload)->not->toBeEmpty();
    $decodedTlv = base64_decode($order->qr_payload);
    expect($decodedTlv)->not->toBeFalse();
    // First byte is tag 1 (seller name), second byte is length
    expect(ord($decodedTlv[0]))->toBe(1);

    // Atomic Balanced GL Journal Entry
    $je = JournalEntry::with('lines.account')->findOrFail($order->journal_entry_id);
    expect($je->status)->toBe('posted');

    $totalDebit = '0.000000';
    $totalCredit = '0.000000';
    foreach ($je->lines as $line) {
        $totalDebit = bcadd($totalDebit, (string) $line->debit, 6);
        $totalCredit = bcadd($totalCredit, (string) $line->credit, 6);
    }
    expect(bccomp($totalDebit, $totalCredit, 6))->toBe(0);

    // Debits: Cash 9900.00 + COGS 7000.00 (2 * 3500) = 16900.00
    expect((float) $totalDebit)->toBe(16900.0);

    // Test Insufficient Stock exception
    expect(fn () => $saleAction->execute([
        'session_id' => $session->id,
        'payment_method' => 'cash',
        'cash_tendered' => '1000000.00',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => '500.000000',
                'unit_price' => '4500.000000',
            ],
        ],
    ]))->toThrow(InsufficientStockException::class);
});

test('manufacturing production order consumes raw materials and receipts finished goods at actual cost', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $warehouse = Warehouse::where('company_id', $companyA->id)->where('code', 'WH-RUH-01')->firstOrFail();
    $lap = Product::where('company_id', $companyA->id)->where('sku', 'PRD-LAP-001')->firstOrFail();
    $mon = Product::where('company_id', $companyA->id)->where('sku', 'PRD-MON-001')->firstOrFail();
    $chair = Product::where('company_id', $companyA->id)->where('sku', 'PRD-CHAIR-001')->firstOrFail();
    $bundle = Product::where('company_id', $companyA->id)->where('sku', 'PRD-BUNDLE-001')->firstOrFail();

    $costingEngine = app(InventoryCostingEngine::class);

    // Receive raw material components into warehouse:
    // 10x LAP at 3500, 10x MON at 1200, 10x CHAIR at 600
    $costingEngine->receiveStock([
        'company_id' => $companyA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $lap->id,
        'quantity' => '10.000000',
        'unit_cost' => '3500.000000',
    ]);
    $costingEngine->receiveStock([
        'company_id' => $companyA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $mon->id,
        'quantity' => '10.000000',
        'unit_cost' => '1200.000000',
    ]);
    $costingEngine->receiveStock([
        'company_id' => $companyA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $chair->id,
        'quantity' => '10.000000',
        'unit_cost' => '600.000000',
    ]);

    $bom = BillOfMaterial::where('company_id', $companyA->id)->where('bom_code', 'BOM-WS-001')->firstOrFail();
    $order = ProductionOrder::where('company_id', $companyA->id)->where('order_number', 'MO-2026-0001')->firstOrFail();

    $completeAction = app(CompleteProductionOrderAction::class);
    $completedOrder = $completeAction->execute([
        'production_order_id' => $order->id,
        'produced_quantity' => '5.000000',
    ]);

    expect($completedOrder->status)->toBe('completed')
        ->and((float) $completedOrder->produced_quantity)->toBe(5.0);

    // Material Cost: 5 * (3500 + 1200 + 600) = 5 * 5300 = 26500.00 SAR
    expect((float) $completedOrder->total_material_cost)->toBe(26500.0)
        ->and((float) $completedOrder->unit_material_cost)->toBe(5300.0);

    // Finished Goods stock receipted
    $finishedLevel = InventoryLevel::where('warehouse_id', $warehouse->id)
        ->where('product_id', $bundle->id)
        ->first();

    expect($finishedLevel)->not->toBeNull()
        ->and((float) $finishedLevel->quantity_on_hand)->toBe(5.0)
        ->and((float) $finishedLevel->moving_average_cost)->toBe(5300.0);
});

test('trade wholesale pricing resolver applies tier discounts based on quantity thresholds', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $lap = Product::where('company_id', $companyA->id)->where('sku', 'PRD-LAP-001')->firstOrFail();
    $resolver = app(PriceResolverService::class);

    // Qty 1: Base tier (min 1) -> 4200.00 SAR, discount 0%
    $price1 = $resolver->resolve($companyA->id, $lap->id, 1);
    expect((float) $price1['unit_price'])->toBe(4200.0)
        ->and((float) $price1['discount_percentage'])->toBe(0.0);

    // Qty 15: Reaches wholesale tier (min 10) -> 4200.00 with 5% discount = 3990.00 SAR
    $price15 = $resolver->resolve($companyA->id, $lap->id, 15);
    expect((float) $price15['unit_price'])->toBe(3990.0)
        ->and((float) $price15['discount_percentage'])->toBe(5.0);

    // Qty 60: Reaches bulk VIP tier (min 50) -> 4200.00 with 10% discount = 3780.00 SAR
    $price60 = $resolver->resolve($companyA->id, $lap->id, 60);
    expect((float) $price60['unit_price'])->toBe(3780.0)
        ->and((float) $price60['discount_percentage'])->toBe(10.0);
});

test('contracting progress claim certifies milestones, withholds 5% retention, and generates service invoice', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $claim = ContractingClaim::where('company_id', $companyA->id)->where('claim_number', 'CLM-2026-001')->firstOrFail();
    expect($claim->status)->toBe('draft');

    $billAction = app(ApproveAndBillProgressClaimAction::class);
    $billedClaim = $billAction->execute([
        'claim_id' => $claim->id,
    ]);

    expect($billedClaim->status)->toBe('billed')
        ->and($billedClaim->invoice_id)->not->toBeNull();

    // Financials: Work = 75000, Retention (5%) = 3750, Net = 71250, Tax (10%) = 7125, Total = 78375
    expect((float) $billedClaim->current_work_amount)->toBe(75000.0)
        ->and((float) $billedClaim->retention_amount)->toBe(3750.0)
        ->and((float) $billedClaim->net_claim_amount)->toBe(71250.0)
        ->and((float) $billedClaim->tax_amount)->toBe(7125.0)
        ->and((float) $billedClaim->total_amount)->toBe(78375.0);

    // Verified generated Service Invoice
    $invoice = ServiceInvoice::with('lines')->findOrFail($billedClaim->invoice_id);
    expect((float) $invoice->subtotal)->toBe(71250.0)
        ->and((float) $invoice->total)->toBe(78375.0)
        ->and($invoice->lines)->toHaveCount(1);
});

test('web routes for industry verticals render correctly for authenticated user', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $terminal = PosTerminal::where('code', 'POS-RUH-01')->firstOrFail();
    $session = PosSession::firstOrFail();
    $bom = BillOfMaterial::firstOrFail();
    $order = ProductionOrder::firstOrFail();
    $priceList = PriceList::firstOrFail();
    $claim = ContractingClaim::firstOrFail();

    $this->actingAs($userA);

    $this->get('/retail/terminals')->assertOk();
    $this->get("/retail/pos/{$terminal->id}")->assertOk();
    $this->get('/retail/sessions')->assertOk();
    $this->get("/retail/sessions/{$session->id}")->assertOk();
    $this->get('/manufacturing/boms')->assertOk();
    $this->get('/manufacturing/boms/create')->assertOk();
    $this->get("/manufacturing/boms/{$bom->id}")->assertOk();
    $this->get('/manufacturing/orders')->assertOk();
    $this->get('/manufacturing/orders/create')->assertOk();
    $this->get("/manufacturing/orders/{$order->id}")->assertOk();
    $this->get('/trade/pricelists')->assertOk();
    $this->get('/trade/pricelists/create')->assertOk();
    $this->get("/trade/pricelists/{$priceList->id}")->assertOk();
    $this->get('/contracting/claims')->assertOk();
    $this->get('/contracting/claims/create')->assertOk();
    $this->get("/contracting/claims/{$claim->id}")->assertOk();
});
