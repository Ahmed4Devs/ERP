<?php

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Inventory\Models\BatchTransaction;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\ProductBatch;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();

    $this->tenant = Tenant::where('slug', 'al-amal')->firstOrFail();
    $this->company = Company::where('tenant_id', $this->tenant->id)->firstOrFail();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $this->warehouse = Warehouse::where('company_id', $this->company->id)->firstOrFail();
    $this->product = Product::where('company_id', $this->company->id)->firstOrFail();
});

test('it recommends batches according to FEFO (First-Expired, First-Out) dispatch priority', function () {
    // Create 3 batches with different expiry dates
    $batchFar = ProductBatch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-FAR-2027',
        'current_qty' => 50,
        'received_qty' => 50,
        'unit_cost' => '100.00',
        'expiry_date' => now()->addMonths(12)->toDateString(),
        'status' => 'active',
    ]);

    $batchNear = ProductBatch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-NEAR-2026',
        'current_qty' => 20,
        'received_qty' => 20,
        'unit_cost' => '100.00',
        'expiry_date' => now()->addDays(15)->toDateString(),
        'status' => 'active',
    ]);

    $batchMid = ProductBatch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-MID-2026',
        'current_qty' => 30,
        'received_qty' => 30,
        'unit_cost' => '100.00',
        'expiry_date' => now()->addDays(45)->toDateString(),
        'status' => 'active',
    ]);

    // Request 30 units - should recommend 20 from LOT-NEAR and 10 from LOT-MID
    $response = $this->actingAs($this->user)->getJson(route('inventory.batches.fefo', [
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'quantity' => 30,
    ]));

    $response->assertOk();
    $data = $response->json();

    expect($data['total_allocated'])->toEqual(30);
    expect($data['shortage_qty'])->toEqual(0);
    expect($data['allocations'])->toHaveCount(2);
    expect($data['allocations'][0]['batch_id'])->toBe($batchNear->id);
    expect((float) $data['allocations'][0]['allocated_qty'])->toBe(20.0);
    expect($data['allocations'][1]['batch_id'])->toBe($batchMid->id);
    expect((float) $data['allocations'][1]['allocated_qty'])->toBe(10.0);
});

test('it renders batch expiry risk dashboard with accurate financial exposure metrics', function () {
    // Clean existing batches to have controlled metrics
    ProductBatch::where('product_id', $this->product->id)->delete();

    // 1. Expired batch (10 units * 50 SAR = 500 SAR)
    ProductBatch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-EXPIRED',
        'current_qty' => 10,
        'received_qty' => 10,
        'unit_cost' => '50.00',
        'expiry_date' => now()->subDays(5)->toDateString(),
        'status' => 'expired',
    ]);

    // 2. Expiring in 20 days (5 units * 100 SAR = 500 SAR)
    ProductBatch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-EXP-20D',
        'current_qty' => 5,
        'received_qty' => 5,
        'unit_cost' => '100.00',
        'expiry_date' => now()->addDays(20)->toDateString(),
        'status' => 'active',
    ]);

    // 3. Safe batch in 90 days (20 units * 100 SAR = 2000 SAR)
    ProductBatch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-SAFE-90D',
        'current_qty' => 20,
        'received_qty' => 20,
        'unit_cost' => '100.00',
        'expiry_date' => now()->addDays(90)->toDateString(),
        'status' => 'active',
    ]);

    $response = $this->actingAs($this->user)->get(route('inventory.batches.expiry-dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Inventory/Batches/ExpiryDashboard')
        ->has('kpis', fn (Assert $kpis) => $kpis
            ->where('expired_count', 1)
            ->where('expired_value_sar', 500)
            ->where('expiring_30_count', 1)
            ->where('expiring_30_value_sar', 500)
            ->where('safe_count', 1)
            ->where('safe_value_sar', 2000)
            ->where('total_risk_sar', 1000)
            ->etc()
        )
        ->has('batches.data', 3)
    );
});

test('it writes off an expired batch, relieves stock, and posts double-entry GL journal', function () {
    // Ensure Inventory Level exists
    $inventoryLevel = InventoryLevel::firstOrCreate(
        [
            'warehouse_id' => $this->warehouse->id,
            'product_id' => $this->product->id,
        ],
        [
            'tenant_id' => $this->tenant->id,
            'company_id' => $this->company->id,
            'quantity_on_hand' => 50,
            'quantity_reserved' => 0,
            'reorder_point' => 10,
        ]
    );
    $inventoryLevel->quantity_on_hand = 50;
    $inventoryLevel->save();

    // Create an expired batch
    $batch = ProductBatch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-EXP-WRITE-OFF',
        'current_qty' => 15,
        'received_qty' => 15,
        'unit_cost' => '80.00',
        'expiry_date' => now()->subDays(10)->toDateString(),
        'status' => 'expired',
    ]);

    // Perform write-off via HTTP POST
    $response = $this->actingAs($this->user)->post(route('inventory.batches.write-off', $batch->id), [
        'quantity' => 15,
        'reason' => 'انتهاء فترة الصلاحية وتلف كلي للمنتج',
        'notes' => 'محضر إتلاف رقم 2026/SCRAP/001 معتمد من مدير المستودع',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Verify batch status & quantity
    $batch->refresh();
    expect((float) $batch->current_qty)->toBe(0.0);
    expect($batch->status)->toBe('scrapped');

    // Verify warehouse inventory level decremented
    $inventoryLevel->refresh();
    expect((float) $inventoryLevel->quantity_on_hand)->toBe(35.0); // 50 - 15

    // Verify BatchTransaction created
    $tx = BatchTransaction::where('batch_id', $batch->id)
        ->where('transaction_type', 'write_off')
        ->first();

    expect($tx)->not->toBeNull();
    expect($tx->direction)->toBe('out');
    expect((float) $tx->quantity)->toBe(15.0);

    // Verify Double-Entry General Ledger Journal Entry
    // Expected Loss: 15 * 80.00 = 1,200.00 SAR
    // DR 5250 (خسائر بضاعة تالفة ومنتهية الصلاحية) / CR 1300 (حساب بضاعة المخزون)
    $journal = JournalEntry::where('company_id', $this->company->id)
        ->where('source_type', 'batch_write_off')
        ->where('source_id', $batch->id)
        ->with('lines.account')
        ->first();

    expect($journal)->not->toBeNull();
    expect($journal->status)->toBe('posted');

    $drLine = $journal->lines->firstWhere('debit', '>', 0);
    $crLine = $journal->lines->firstWhere('credit', '>', 0);

    expect($drLine)->not->toBeNull();
    expect($crLine)->not->toBeNull();

    expect($drLine->account->code)->toBe('5250');
    expect((float) $drLine->debit)->toBe(1200.0);

    expect($crLine->account->code)->toBe('1300');
    expect((float) $crLine->credit)->toBe(1200.0);
});
