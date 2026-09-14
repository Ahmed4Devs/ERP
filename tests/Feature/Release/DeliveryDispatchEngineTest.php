<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Trade\Models\DeliveryDriver;
use App\Modules\Trade\Models\DeliveryVehicle;
use App\Modules\Trade\Services\CreateDispatchTripService;
use App\Modules\Trade\Services\RecordTripStopPodAction;
use App\Modules\Trade\Services\SettleTripCodAction;
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
    $this->branch = Branch::where('company_id', $this->company->id)->firstOrFail();

    $this->warehouse = Warehouse::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'WH-MAIN'],
        [
            'tenant_id' => $this->tenant->id,
            'branch_id' => $this->branch->id,
            'name' => 'Main Distribution Warehouse',
            'is_active' => true,
        ]
    );

    // 1. Vehicle & Driver
    $this->vehicle = DeliveryVehicle::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'plate_number' => 'أ ب ج 4455',
        'model' => 'Isuzu Forward 2025',
        'vehicle_type' => 'truck_medium',
        'max_weight_capacity_kg' => '3500.00',
        'max_volume_capacity_cbm' => '25.00',
        'status' => 'active',
    ]);

    $this->driver = DeliveryDriver::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'code' => 'DRV-101',
        'name' => 'Tariq Al-Mansoor',
        'name_ar' => 'طارق المنصور',
        'phone' => '+966509988776',
        'license_type' => 'medium',
        'status' => 'available',
    ]);

    // 2. Two Customers
    $this->customer1 = Party::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Al-Safwa Supermarket',
        'name_ar' => 'أسواق الصفوة المركزية',
        'type' => 'customer',
        'phone' => '+966501234567',
        'status' => 'active',
    ]);

    $this->customer2 = Party::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Al-Noor Trading Est',
        'name_ar' => 'مؤسسة النور للتجارة',
        'type' => 'customer',
        'phone' => '+966507654321',
        'status' => 'active',
    ]);

    // 3. GL Accounts
    $this->cashAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '1010'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Main Cash Treasury',
            'name_ar' => 'صندوق الخزينة الرئيسية',
            'type' => 'asset',
            'subtype' => 'cash',
            'currency' => 'SAR',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '0.000000',
        ]
    );

    $this->arAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '1030'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Accounts Receivable',
            'name_ar' => 'المدينون التجاريون والعملاء',
            'type' => 'asset',
            'subtype' => 'receivable',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '0.000000',
        ]
    );
});

test('creates a scheduled dispatch trip with multiple customer delivery stops and expected COD', function () {
    $dispatchService = app(CreateDispatchTripService::class);

    $stops = [
        [
            'customer_id' => $this->customer1->id,
            'destination_address' => 'Riyadh, Olaya Dist, St 15',
            'recipient_contact_phone' => '+966501234567',
            'cod_amount_due' => '1500.000000',
        ],
        [
            'customer_id' => $this->customer2->id,
            'destination_address' => 'Riyadh, Al-Malaz Dist, St 40',
            'recipient_contact_phone' => '+966507654321',
            'cod_amount_due' => '850.000000',
        ],
    ];

    $trip = $dispatchService->execute(
        tenantId: $this->tenant->id,
        companyId: $this->company->id,
        branchId: $this->branch->id,
        driverId: $this->driver->id,
        vehicleId: $this->vehicle->id,
        warehouseId: $this->warehouse->id,
        scheduledDate: now()->toDateString(),
        stops: $stops,
        routeNotes: 'Deliver North Riyadh first'
    );

    expect($trip)->not->toBeNull();
    expect($trip->status)->toBe('scheduled');
    expect($trip->total_deliveries_count)->toBe(2);
    expect($trip->completed_deliveries_count)->toBe(0);
    expect(round((float) $trip->total_cod_expected, 2))->toBe(2350.00);
    expect($trip->stops)->toHaveCount(2);

    // Driver status changed to on_trip
    $this->driver->refresh();
    expect($this->driver->status)->toBe('on_trip');
});

test('trip transitions to in_transit when dispatched from warehouse', function () {
    $this->actingAs($this->user);

    $dispatchService = app(CreateDispatchTripService::class);
    $trip = $dispatchService->execute(
        tenantId: $this->tenant->id,
        companyId: $this->company->id,
        branchId: $this->branch->id,
        driverId: $this->driver->id,
        vehicleId: $this->vehicle->id,
        warehouseId: $this->warehouse->id,
        scheduledDate: now()->toDateString(),
        stops: [
            [
                'customer_id' => $this->customer1->id,
                'destination_address' => 'Riyadh, Sulaymaniyah',
                'cod_amount_due' => '500.000000',
            ],
        ]
    );

    $response = $this->post(route('trade.dispatch.dispatch', $trip->id));
    $response->assertRedirect();

    $trip->refresh();
    expect($trip->status)->toBe('in_transit');
    expect($trip->dispatched_at)->not->toBeNull();
});

test('records electronic proof of delivery with signature, coordinates, and COD collection', function () {
    $dispatchService = app(CreateDispatchTripService::class);
    $trip = $dispatchService->execute(
        tenantId: $this->tenant->id,
        companyId: $this->company->id,
        branchId: $this->branch->id,
        driverId: $this->driver->id,
        vehicleId: $this->vehicle->id,
        warehouseId: $this->warehouse->id,
        scheduledDate: now()->toDateString(),
        stops: [
            [
                'customer_id' => $this->customer1->id,
                'destination_address' => 'Riyadh, Olaya',
                'cod_amount_due' => '1200.000000',
            ],
            [
                'customer_id' => $this->customer2->id,
                'destination_address' => 'Riyadh, Malaz',
                'cod_amount_due' => '600.000000',
            ],
        ]
    );

    $podAction = app(RecordTripStopPodAction::class);
    $stop1 = $trip->stops->firstWhere('customer_id', $this->customer1->id);
    $stop2 = $trip->stops->firstWhere('customer_id', $this->customer2->id);

    // Stop 1: Delivered with signature and COD collection
    $updatedStop1 = $podAction->execute(
        stop: $stop1,
        success: true,
        recipientName: 'Saleh Al-Omari',
        recipientNationalId: '1098765432',
        signatureSvg: '<svg>signature</svg>',
        gpsLatitude: 24.7136,
        gpsLongitude: 46.6753,
        codAmountCollected: '1200.000000',
        codPaymentMethod: 'cash',
        podNotes: 'Delivered in good condition'
    );

    expect($updatedStop1->status)->toBe('delivered');
    expect($updatedStop1->recipient_name)->toBe('Saleh Al-Omari');
    expect($updatedStop1->delivered_at)->not->toBeNull();
    expect(round((float) $updatedStop1->cod_amount_collected, 2))->toBe(1200.00);

    // Stop 2: Delivered with COD collection
    $updatedStop2 = $podAction->execute(
        stop: $stop2,
        success: true,
        recipientName: 'Fahad Al-Harbi',
        codAmountCollected: '600.000000'
    );

    expect($updatedStop2->status)->toBe('delivered');

    // Trip progress updated automatically
    $trip->refresh();
    expect($trip->completed_deliveries_count)->toBe(2);
    expect(round((float) $trip->total_cod_collected, 2))->toBe(1800.00);
    expect($trip->status)->toBe('completed');
    expect($trip->completed_at)->not->toBeNull();
});

test('settles driver COD collections to treasury and posts balanced GL journal entry', function () {
    $dispatchService = app(CreateDispatchTripService::class);
    $podAction = app(RecordTripStopPodAction::class);
    $settleAction = app(SettleTripCodAction::class);

    $trip = $dispatchService->execute(
        tenantId: $this->tenant->id,
        companyId: $this->company->id,
        branchId: $this->branch->id,
        driverId: $this->driver->id,
        vehicleId: $this->vehicle->id,
        warehouseId: $this->warehouse->id,
        scheduledDate: now()->toDateString(),
        stops: [
            [
                'customer_id' => $this->customer1->id,
                'destination_address' => 'Riyadh, Diplomatic Quarter',
                'cod_amount_due' => '2500.000000',
            ],
        ]
    );

    $stop = $trip->stops->first();
    $podAction->execute(
        stop: $stop,
        success: true,
        recipientName: 'Turki Al-Saud',
        codAmountCollected: '2500.000000'
    );

    $trip->refresh();
    expect(round((float) $trip->total_cod_collected, 2))->toBe(2500.00);

    // Settle Driver COD to Treasury
    $settledTrip = $settleAction->execute($trip, $this->user->id);

    expect($settledTrip->cod_settlement_status)->toBe('settled');
    expect($settledTrip->settlement_journal_entry_id)->not->toBeNull();

    // Verify GL Double-Entry:
    // DR 1010 (Cash Treasury) 2,500.00
    // CR 1030 (Accounts Receivable) 2,500.00
    $journal = JournalEntry::with('lines')->find($settledTrip->settlement_journal_entry_id);
    expect($journal)->not->toBeNull();
    expect($journal->lines)->toHaveCount(2);

    $cashLine = $journal->lines->firstWhere('account_id', $this->cashAccount->id);
    $arLine = $journal->lines->firstWhere('account_id', $this->arAccount->id);

    expect(round((float) $cashLine->debit, 2))->toBe(2500.00);
    expect(round((float) $cashLine->credit, 2))->toBe(0.00);

    expect(round((float) $arLine->credit, 2))->toBe(2500.00);
    expect(round((float) $arLine->debit, 2))->toBe(0.00);

    // Driver released back to available
    $this->driver->refresh();
    expect($this->driver->status)->toBe('available');
});
