<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Inventory\Models\DeliveryNote;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\StockMovement;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Models\SalesOrderLine;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
    $tenant = Tenant::where('slug', 'al-amal')->first();
    $company = Company::where('tenant_id', $tenant->id)->first();
    app(CurrentTenant::class)->set($tenant);
    app(CurrentCompany::class)->set($company);
});

test('delivery notes index page renders successfully with pagination and filters', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();

    $response = $this->actingAs($user)->get(route('inventory.delivery-notes.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Inventory/DeliveryNotes/Index')
        ->has('deliveryNotes')
        ->has('warehouses')
        ->has('filters')
    );
});

test('delivery notes create page renders with warehouses, customers, products and sales orders', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();

    $response = $this->actingAs($user)->get(route('inventory.delivery-notes.create'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Inventory/DeliveryNotes/Create')
        ->has('warehouses')
        ->has('customers')
        ->has('products')
        ->has('salesOrders')
    );
});

test('posting delivery note relieves warehouse stock, records movement and generates perpetual GL entry', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $company = app(CurrentCompany::class)->get();
    $tenant = app(CurrentTenant::class)->get();

    $warehouse = Warehouse::where('company_id', $company->id)->firstOrFail();
    $customer = Party::where('tenant_id', $tenant->id)->where('type', 'customer')->firstOrFail();
    $product = Product::where('company_id', $company->id)->where('type', 'storable')->firstOrFail();

    // Ensure inventory exists
    $invLevel = InventoryLevel::firstOrCreate(
        [
            'company_id' => $company->id,
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
        ],
        [
            'tenant_id' => $tenant->id,
            'quantity_on_hand' => '50.000000',
            'quantity_reserved' => '0.000000',
            'quantity_available' => '50.000000',
            'moving_average_cost' => '100.000000',
            'total_value' => '5000.000000',
        ]
    );

    if (bccomp((string) $invLevel->quantity_on_hand, '10.000000', 6) < 0) {
        $invLevel->quantity_on_hand = '50.000000';
        $invLevel->quantity_available = '50.000000';
        $invLevel->moving_average_cost = '100.000000';
        $invLevel->save();
    }

    $initialQty = (float) $invLevel->quantity_on_hand;

    // Create a confirmed sales order
    $salesOrder = SalesOrder::create([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'order_number' => 'SO-TEST-001',
        'customer_id' => $customer->id,
        'order_date' => now()->toDateString(),
        'subtotal' => '1000.000000',
        'tax_rate' => '0.100000',
        'tax_amount' => '100.000000',
        'discount_amount' => '0.000000',
        'total_amount' => '1100.000000',
        'status' => 'confirmed',
        'invoicing_status' => 'unbilled',
    ]);

    $soLine = SalesOrderLine::create([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'sales_order_id' => $salesOrder->id,
        'product_id' => $product->id,
        'description' => $product->name,
        'quantity' => '5.000000',
        'unit_price' => '200.000000',
        'tax_amount' => '100.000000',
        'line_total' => '1100.000000',
    ]);

    // Dispatch delivery note
    $postData = [
        'warehouse_id' => $warehouse->id,
        'customer_id' => $customer->id,
        'sales_order_id' => $salesOrder->id,
        'date' => now()->toDateString(),
        'driver_name' => 'Khalid Al-Ghamdi',
        'vehicle_plate' => 'ABC-9999',
        'recipient_name' => 'Fahad Customer',
        'shipping_address' => 'Riyadh, Olaya District',
        'lines' => [
            [
                'product_id' => $product->id,
                'sales_order_line_id' => $soLine->id,
                'description' => 'Delivery line for test product',
                'quantity' => 5,
            ],
        ],
    ];

    $response = $this->actingAs($user)->post(route('inventory.delivery-notes.store'), $postData);
    $response->assertRedirect();

    // Verify delivery note created
    $deliveryNote = DeliveryNote::where('sales_order_id', $salesOrder->id)->firstOrFail();
    expect($deliveryNote->status)->toBe('dispatched')
        ->and($deliveryNote->driver_name)->toBe('Khalid Al-Ghamdi')
        ->and($deliveryNote->lines)->toHaveCount(1)
        ->and((float) $deliveryNote->lines->first()->quantity)->toBe(5.0);

    // Verify inventory stock level deducted
    $invLevel->refresh();
    expect((float) $invLevel->quantity_on_hand)->toBe($initialQty - 5.0);

    // Verify stock movement recorded
    $movement = StockMovement::where('reference_type', DeliveryNote::class)
        ->where('reference_id', $deliveryNote->id)
        ->firstOrFail();
    expect($movement->direction)->toBe('out')
        ->and($movement->movement_type)->toBe('delivery')
        ->and((float) $movement->quantity)->toBe(5.0);

    // Verify GL journal entry created (DR COGS 5000 / CR Inventory 1300)
    expect($deliveryNote->journal_entry_id)->not->toBeNull();
    $journalEntry = JournalEntry::with('lines.account')->find($deliveryNote->journal_entry_id);
    expect($journalEntry)->not->toBeNull()
        ->and($journalEntry->status)->toBe('posted');

    $cogsAccount = Account::where('company_id', $company->id)->where(fn ($q) => $q->where('code', '5000')->orWhere('subtype', 'cost_of_goods_sold'))->firstOrFail();
    $invAccount = Account::where('company_id', $company->id)->where(fn ($q) => $q->where('code', '1300')->orWhere('subtype', 'inventory'))->firstOrFail();

    $debitLine = $journalEntry->lines->where('account_id', $cogsAccount->id)->first();
    $creditLine = $journalEntry->lines->where('account_id', $invAccount->id)->first();

    expect($debitLine)->not->toBeNull()
        ->and($creditLine)->not->toBeNull()
        ->and(bccomp((string) $debitLine->debit, (string) $creditLine->credit, 2))->toBe(0);

    // Verify Sales Order updated to delivering
    $salesOrder->refresh();
    expect($salesOrder->status)->toBe('delivering');

    // Verify Show and Print pages
    $showResponse = $this->actingAs($user)->get(route('inventory.delivery-notes.show', $deliveryNote->id));
    $showResponse->assertOk();
    $showResponse->assertInertia(fn ($page) => $page
        ->component('Inventory/DeliveryNotes/Show')
        ->has('deliveryNote')
    );

    $printResponse = $this->actingAs($user)->get(route('inventory.delivery-notes.print', $deliveryNote->id));
    $printResponse->assertOk();
    $printResponse->assertInertia(fn ($page) => $page
        ->component('Inventory/DeliveryNotes/Print')
        ->has('deliveryNote')
        ->has('qrCodeDataUri')
        ->has('totalItems')
    );
});
