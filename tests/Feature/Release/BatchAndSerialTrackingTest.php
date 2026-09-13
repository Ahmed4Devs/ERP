<?php

use App\Models\User;
use App\Modules\Inventory\Models\BatchTransaction;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\ProductBatch;
use App\Modules\Inventory\Models\ProductSerial;
use App\Modules\Inventory\Models\SerialTransaction;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\BatchTrackingService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
    $this->tenant = Tenant::where('slug', 'al-amal')->first();
    $this->company = Company::where('tenant_id', $this->tenant->id)->first();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();

    $this->warehouse = Warehouse::where('company_id', $this->company->id)->first() ?? Warehouse::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'code' => 'WH-MAIN',
        'name' => 'Main Warehouse',
        'is_active' => true,
    ]);

    $this->product = Product::where('company_id', $this->company->id)->first();
    $this->product->update([
        'tracking_type' => 'both',
        'shelf_life_days' => 180, // 6 months
        'warranty_months' => 24, // 2 years
    ]);

    $this->customer = Party::firstOrCreate(
        ['tenant_id' => $this->tenant->id, 'name' => 'Premium Client'],
        [
            'type' => 'customer',
            'email' => 'client@example.com',
            'phone' => '0501234567',
        ]
    );

    $this->batchService = app(BatchTrackingService::class);
});

test('batch registration calculates expiry date from shelf life and logs receipt transaction', function () {
    $batch = $this->batchService->registerBatch([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-2026-TEST-01',
        'manufacture_date' => now()->toDateString(),
        'quantity' => 100,
        'unit_cost' => 50,
        'notes' => 'Initial test batch receipt',
    ]);

    expect($batch)->toBeInstanceOf(ProductBatch::class)
        ->and($batch->batch_number)->toBe('LOT-2026-TEST-01')
        ->and((float) $batch->received_qty)->toBe(100.0)
        ->and((float) $batch->current_qty)->toBe(100.0)
        ->and($batch->status)->toBe('active')
        ->and($batch->expiry_date)->not->toBeNull()
        ->and($batch->expiry_date->toDateString())->toBe(now()->addDays(180)->toDateString());

    // Check transaction audit record
    $tx = BatchTransaction::where('batch_id', $batch->id)->first();
    expect($tx)->not->toBeNull()
        ->and($tx->transaction_type)->toBe('receipt')
        ->and($tx->direction)->toBe('in')
        ->and((float) $tx->quantity)->toBe(100.0);
});

test('FEFO engine recommends batches in order of earliest expiry date', function () {
    // Create 3 batches: Batch A (expires in 20 days), Batch B (expires in 60 days), Batch C (expires in 5 days)
    $batchA = $this->batchService->registerBatch([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-FEFO-A',
        'manufacture_date' => now()->subDays(10)->toDateString(),
        'expiry_date' => now()->addDays(20)->toDateString(),
        'quantity' => 40,
        'unit_cost' => 10,
    ]);

    $batchB = $this->batchService->registerBatch([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-FEFO-B',
        'manufacture_date' => now()->subDays(5)->toDateString(),
        'expiry_date' => now()->addDays(60)->toDateString(),
        'quantity' => 50,
        'unit_cost' => 12,
    ]);

    $batchC = $this->batchService->registerBatch([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-FEFO-C',
        'manufacture_date' => now()->subDays(20)->toDateString(),
        'expiry_date' => now()->addDays(5)->toDateString(),
        'quantity' => 25,
        'unit_cost' => 8,
    ]);

    // Request 50 units
    // Expected FEFO order:
    // 1. Batch C (expires in 5 days): takes all 25 units
    // 2. Batch A (expires in 20 days): takes remaining 25 units (out of 40)
    // 3. Batch B: 0 units allocated
    $result = $this->batchService->recommendBatchesForDispatch($this->product->id, $this->warehouse->id, 50);

    expect($result['requested_qty'])->toBe(50.0)
        ->and($result['total_allocated'])->toBe(50.0)
        ->and($result['shortage_qty'])->toBe(0.0)
        ->and(count($result['allocations']))->toBe(2);

    expect($result['allocations'][0]['batch_number'])->toBe('LOT-FEFO-C')
        ->and($result['allocations'][0]['allocated_qty'])->toBe(25.0);

    expect($result['allocations'][1]['batch_number'])->toBe('LOT-FEFO-A')
        ->and($result['allocations'][1]['allocated_qty'])->toBe(25.0);
});

test('dispatching batch quantity decrements stock and sets status to depleted when exhausted', function () {
    $batch = $this->batchService->registerBatch([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-DISPATCH-01',
        'quantity' => 30,
        'unit_cost' => 15,
    ]);

    // Partial dispatch of 10
    $this->batchService->dispatchBatch($batch->id, 10, 'DeliveryNote', null, 'Dispatched for test');
    $batch->refresh();
    expect((float) $batch->current_qty)->toBe(20.0)
        ->and($batch->status)->toBe('active');

    // Dispatch remaining 20
    $this->batchService->dispatchBatch($batch->id, 20, 'DeliveryNote', null, 'Final dispatch');
    $batch->refresh();
    expect((float) $batch->current_qty)->toBe(0.0)
        ->and($batch->status)->toBe('depleted');

    // Verify 2 issue transactions
    $outTxCount = BatchTransaction::where('batch_id', $batch->id)->where('direction', 'out')->count();
    expect($outTxCount)->toBe(2);
});

test('serial numbers bulk registration, warranty auto-calculation, and dispatch to customer', function () {
    $batch = $this->batchService->registerBatch([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-SERIALS-01',
        'quantity' => 3,
    ]);

    $serialsList = "SN-2026-0001\nSN-2026-0002\nSN-2026-0003";

    $registered = $this->batchService->registerSerials([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_id' => $batch->id,
        'serial_numbers' => $serialsList,
        'warranty_start_date' => now()->toDateString(),
        'warranty_months' => 24,
        'warranty_notes' => '2-year manufacturer warranty',
    ]);

    expect(count($registered))->toBe(3);

    $firstSerial = $registered[0];
    expect($firstSerial->status)->toBe('in_stock')
        ->and($firstSerial->isUnderWarranty())->toBeTrue()
        ->and($firstSerial->warranty_end_date->toDateString())->toBe(now()->addMonths(24)->toDateString());

    // Dispatch first serial to customer
    $dispatched = $this->batchService->dispatchSerial($firstSerial->id, $this->customer->id, 'DeliveryNote', null, 'Sold to customer');
    expect($dispatched->status)->toBe('sold')
        ->and($dispatched->customer_id)->toBe($this->customer->id)
        ->and($dispatched->warehouse_id)->toBeNull();

    // Verify serial transaction created
    $tx = SerialTransaction::where('serial_id', $firstSerial->id)->where('transaction_type', 'dispatch')->first();
    expect($tx)->not->toBeNull();

    // Verify warranty lookup API service
    $warrantyCheck = $this->batchService->verifyWarranty($firstSerial->serial_number, $this->company->id);
    expect($warrantyCheck)->not->toBeNull()
        ->and($warrantyCheck['is_under_warranty'])->toBeTrue()
        ->and($warrantyCheck['status'])->toBe('sold')
        ->and($warrantyCheck['customer_name'])->toBe($this->customer->name);
});

test('HTTP endpoints for batches and serials pages and APIs return successful responses', function () {
    // 1. Batches Index
    $this->actingAs($this->user)
        ->get(route('inventory.batches.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Inventory/Batches/Index')
            ->has('batches')
            ->has('metrics')
        );

    // 2. Batches Create
    $this->actingAs($this->user)
        ->get(route('inventory.batches.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Inventory/Batches/Create'));

    // 3. Batches Store
    $response = $this->actingAs($this->user)->post(route('inventory.batches.store'), [
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_number' => 'LOT-HTTP-01',
        'manufacture_date' => now()->toDateString(),
        'quantity' => 15,
        'unit_cost' => 45,
    ]);

    $batch = ProductBatch::where('batch_number', 'LOT-HTTP-01')->firstOrFail();
    $response->assertRedirect(route('inventory.batches.show', $batch->id));

    // 4. Batches Show
    $this->actingAs($this->user)
        ->get(route('inventory.batches.show', $batch->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Inventory/Batches/Show')
            ->where('batch.batch_number', 'LOT-HTTP-01')
        );

    // 5. FEFO recommendation JSON API
    $this->actingAs($this->user)
        ->getJson(route('inventory.batches.fefo', [
            'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouse->id,
            'quantity' => 5,
        ]))
        ->assertOk()
        ->assertJsonPath('requested_qty', 5)
        ->assertJsonPath('shortage_qty', 0);

    // 6. Serials Index
    $this->actingAs($this->user)
        ->get(route('inventory.serials.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Inventory/Serials/Index')
            ->has('serials')
            ->has('metrics')
        );

    // 7. Serials Create
    $this->actingAs($this->user)
        ->get(route('inventory.serials.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Inventory/Serials/Create'));

    // 8. Serials Store
    $this->actingAs($this->user)->post(route('inventory.serials.store'), [
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'batch_id' => $batch->id,
        'serial_numbers' => "SN-HTTP-100\nSN-HTTP-101",
        'warranty_start_date' => now()->toDateString(),
        'warranty_months' => 12,
    ])->assertRedirect(route('inventory.serials.index'));

    $serial = ProductSerial::where('serial_number', 'SN-HTTP-100')->firstOrFail();

    // 9. Serials Show
    $this->actingAs($this->user)
        ->get(route('inventory.serials.show', $serial->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Inventory/Serials/Show')
            ->where('serial.serial_number', 'SN-HTTP-100')
        );

    // 10. Warranty verification JSON API
    $this->actingAs($this->user)
        ->getJson(route('inventory.serials.verify-warranty', ['serial_number' => 'SN-HTTP-100']))
        ->assertOk()
        ->assertJsonPath('found', true)
        ->assertJsonPath('is_under_warranty', true);
});
