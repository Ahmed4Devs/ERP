<?php

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Inventory\Actions\DispatchStockTransferAction;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\StockTransfer;
use App\Modules\Inventory\Models\StockTransferLine;
use App\Modules\Inventory\Models\UnitOfMeasure;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();

    $this->tenant = Tenant::where('slug', 'al-amal')->firstOrFail();
    $this->company = Company::where('tenant_id', $this->tenant->id)->firstOrFail();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $this->unit = UnitOfMeasure::where('tenant_id', $this->tenant->id)->first() ?? UnitOfMeasure::firstOrFail();

    // Setup 2 Warehouses: Riyadh Central (Source) & Jeddah Branch (Destination)
    $this->warehouseSource = Warehouse::where('company_id', $this->company->id)->firstOrFail();
    $this->warehouseDest = Warehouse::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'code' => 'WH-JED-01',
        'name' => 'Jeddah Distribution Center',
        'is_active' => true,
    ]);

    // Product for transfer
    $this->product = Product::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'unit_id' => $this->unit->id,
        'sku' => 'PROD-TRF-01',
        'name' => 'Industrial Generator Motor',
        'name_ar' => 'محرك مولد صناعي',
        'type' => 'storable',
        'list_price' => '250.00',
        'standard_cost' => '150.00',
        'moving_average_cost' => '150.00',
        'is_active' => true,
    ]);

    // Seed stock at Source Warehouse: 50 units @ 150.00 SAR
    $invSource = InventoryLevel::firstOrCreate(
        [
            'warehouse_id' => $this->warehouseSource->id,
            'product_id' => $this->product->id,
        ],
        [
            'tenant_id' => $this->tenant->id,
            'company_id' => $this->company->id,
            'quantity_on_hand' => 50,
            'moving_average_cost' => 150.0,
        ]
    );
    $invSource->quantity_on_hand = 50;
    $invSource->moving_average_cost = 150.0;
    $invSource->save();
});

test('it dispatches an inter-branch transfer, relieves source stock, and posts in-transit GL entry', function () {
    // 1. Create a draft transfer of 20 units
    $transfer = StockTransfer::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'from_warehouse_id' => $this->warehouseSource->id,
        'to_warehouse_id' => $this->warehouseDest->id,
        'transfer_number' => 'TRF-TEST-001',
        'date' => now()->toDateString(),
        'status' => 'draft',
        'total_value' => '3000.00',
    ]);

    StockTransferLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'stock_transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity' => 20,
        'unit_cost' => '150.00',
        'line_total' => '3000.00',
    ]);

    // 2. Dispatch via HTTP endpoint
    $response = $this->actingAs($this->user)->post(route('inventory.transfers.dispatch', $transfer->id), [
        'driver_name' => 'Ahmed Al-Ghamdi',
        'vehicle_plate' => 'KSA 4567',
        'tracking_number' => 'TRK-998877',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $transfer->refresh();
    expect($transfer->status)->toBe('in_transit');
    expect($transfer->driver_name)->toBe('Ahmed Al-Ghamdi');
    expect($transfer->vehicle_plate)->toBe('KSA 4567');
    expect($transfer->in_transit_journal_id)->not->toBeNull();

    // Verify source inventory deducted (50 - 20 = 30)
    $invSource = InventoryLevel::where('warehouse_id', $this->warehouseSource->id)
        ->where('product_id', $this->product->id)
        ->first();
    expect((float) $invSource->quantity_on_hand)->toBe(30.0);

    // Verify In-Transit GL Journal:
    // DR 1350 (Goods In-Transit) 3,000.00 SAR
    // CR 1300 (Inventory Asset) 3,000.00 SAR
    $journal = JournalEntry::with('lines.account')->findOrFail($transfer->in_transit_journal_id);
    expect($journal->status)->toBe('posted');

    $drLine = $journal->lines->firstWhere('debit', '>', 0);
    $crLine = $journal->lines->firstWhere('credit', '>', 0);

    expect($drLine->account->code)->toBe('1350');
    expect((float) $drLine->debit)->toBe(3000.0);

    expect($crLine->account->code)->toBe('1300');
    expect((float) $crLine->credit)->toBe(3000.0);
});

test('it receives in-transit transfer with transit shortage and reconciles GL loss automatically', function () {
    // 1. Create transfer and dispatch 10 units @ 150.00 SAR (Total: 1,500.00 SAR)
    $transfer = StockTransfer::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'from_warehouse_id' => $this->warehouseSource->id,
        'to_warehouse_id' => $this->warehouseDest->id,
        'transfer_number' => 'TRF-SHORTAGE-001',
        'date' => now()->toDateString(),
        'status' => 'draft',
        'total_value' => '1500.00',
    ]);

    $line = StockTransferLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'stock_transfer_id' => $transfer->id,
        'product_id' => $this->product->id,
        'quantity' => 10,
        'unit_cost' => '150.00',
        'line_total' => '1500.00',
    ]);

    // Dispatch
    $dispatchAction = app(DispatchStockTransferAction::class);
    $dispatchAction->execute([
        'transfer_id' => $transfer->id,
        'driver_name' => 'Fast Logistics Carrier',
    ]);

    // 2. Receive: Destination only receives 8 units! (2 units damaged in accident)
    // Dispatched: 10 units * 150 = 1,500.00 SAR
    // Received: 8 units * 150 = 1,200.00 SAR
    // Shortage: 2 units * 150 = 300.00 SAR
    $response = $this->actingAs($this->user)->post(route('inventory.transfers.receive', $transfer->id), [
        'lines' => [
            [
                'line_id' => $line->id,
                'received_quantity' => 8,
                'shortage_reason' => 'كسر وتلف صندوقين أثناء النقل البري',
            ],
        ],
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $transfer->refresh();
    expect($transfer->status)->toBe('completed');
    expect((float) $transfer->shortage_value)->toBe(300.0);
    expect($transfer->receipt_journal_id)->not->toBeNull();

    // Verify Destination warehouse received 8 units
    $invDest = InventoryLevel::where('warehouse_id', $this->warehouseDest->id)
        ->where('product_id', $this->product->id)
        ->first();
    expect((float) $invDest->quantity_on_hand)->toBe(8.0);

    // Verify Balanced GL Receipt & Shortage Journal:
    // DR 1300 (Destination Inventory Asset) 1,200.00 SAR
    // DR 5260 (Loss on Transit & Shipping Damage) 300.00 SAR
    // CR 1350 (Goods In-Transit) 1,500.00 SAR
    $receiptJournal = JournalEntry::with('lines.account')->findOrFail($transfer->receipt_journal_id);
    expect($receiptJournal->status)->toBe('posted');

    $drLines = $receiptJournal->lines->where('debit', '>', 0);
    $crLines = $receiptJournal->lines->where('credit', '>', 0);

    expect($drLines)->toHaveCount(2);
    expect($crLines)->toHaveCount(1);

    $invDr = $drLines->firstWhere('account.code', '1300');
    $shortageDr = $drLines->firstWhere('account.code', '5260');
    $inTransitCr = $crLines->firstWhere('account.code', '1350');

    expect($invDr)->not->toBeNull();
    expect((float) $invDr->debit)->toBe(1200.0);

    expect($shortageDr)->not->toBeNull();
    expect((float) $shortageDr->debit)->toBe(300.0);

    expect($inTransitCr)->not->toBeNull();
    expect((float) $inTransitCr->credit)->toBe(1500.0);
});
