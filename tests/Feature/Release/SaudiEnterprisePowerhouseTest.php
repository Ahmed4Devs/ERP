<?php

use App\Models\User;
use App\Modules\Inventory\Models\GoodsReceipt;
use App\Modules\Inventory\Models\GoodsReceiptLine;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\LandedCost;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\UnitOfMeasure;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
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
    $this->branch = Branch::where('company_id', $this->company->id)->first();
});

test('it creates and posts landed cost with Saudi FASAH customs declaration and multi-factor weight allocation', function () {
    // 1. Setup warehouse, vendor, products, and a posted goods receipt
    $warehouse = Warehouse::first() ?? Warehouse::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Jeddah Port Warehouse',
        'code' => 'WH-JED',
    ]);

    $vendor = Party::firstOrCreate(
        ['tenant_id' => $this->tenant->id, 'name' => 'Global Shipping Co.'],
        ['type' => 'vendor', 'company_id' => $this->company->id]
    );

    $uom = UnitOfMeasure::first() ?? UnitOfMeasure::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Piece',
        'code' => 'PCS',
    ]);

    $productA = Product::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'unit_id' => $uom->id,
        'name' => 'Industrial Steel Pipe 10m',
        'sku' => 'STEEL-P10',
        'type' => 'storable',
        'standard_cost' => 100.00,
        'moving_average_cost' => 100.00,
        'is_active' => true,
    ]);

    $productB = Product::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'unit_id' => $uom->id,
        'name' => 'Precision Valve Heavy',
        'sku' => 'VALVE-H20',
        'type' => 'storable',
        'standard_cost' => 50.00,
        'moving_average_cost' => 50.00,
        'is_active' => true,
    ]);

    InventoryLevel::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $productA->id,
        'quantity_on_hand' => 100,
    ]);

    InventoryLevel::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $productB->id,
        'quantity_on_hand' => 200,
    ]);

    $goodsReceipt = GoodsReceipt::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'warehouse_id' => $warehouse->id,
        'party_id' => $vendor->id,
        'receipt_number' => 'GR-FASAH-'.uniqid(),
        'date' => now()->toDateString(),
        'status' => 'posted',
        'total_cost' => 20000.00,
    ]);

    $lineA = GoodsReceiptLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'goods_receipt_id' => $goodsReceipt->id,
        'product_id' => $productA->id,
        'description' => '100x Steel Pipe',
        'quantity' => 100,
        'unit_cost' => 100.00,
        'line_total' => 10000.00,
        'weight_kg' => 50.0, // 50 kg each = 5000 kg total
        'volume_cbm' => 0.5,
    ]);

    $lineB = GoodsReceiptLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'goods_receipt_id' => $goodsReceipt->id,
        'product_id' => $productB->id,
        'description' => '200x Precision Valve',
        'quantity' => 200,
        'unit_cost' => 50.00,
        'line_total' => 10000.00,
        'weight_kg' => 5.0, // 5 kg each = 1000 kg total
        'volume_cbm' => 0.1,
    ]);

    // 2. Submit Landed Cost voucher via POST with FASAH Customs Declaration
    $customsPayload = [
        'date' => now()->toDateString(),
        'allocation_method' => 'by_weight', // Multi-factor weight allocation
        'goods_receipt_ids' => [$goodsReceipt->id],
        'customs_declaration_number' => 'FASAH-2026-99881',
        'customs_declaration_date' => now()->toDateString(),
        'port_of_entry' => 'ميناء جدة الإسلامي',
        'bill_of_lading' => 'BL-MAERSK-876543',
        'customs_broker_id' => $vendor->id,
        'customs_broker_name' => 'مكتب الفهد للتخليص الجمركي',
        'customs_duty_amount' => 1200.00,
        'customs_vat_amount' => 1800.00, // 15% ZATCA Import VAT
        'freight_amount' => 3000.00,
        'port_handling_amount' => 600.00,
        'insurance_amount' => 400.00,
        'other_charges_amount' => 200.00,
        'notes' => 'شحنة أنابيب وصمامات عبر ميناء جدة الإسلامي',
    ];

    $response = $this->actingAs($this->user)
        ->post(route('inventory.landed-costs.store'), $customsPayload);

    $response->assertRedirect();

    $landedCost = LandedCost::where('customs_declaration_number', 'FASAH-2026-99881')->first();
    expect($landedCost)->not->toBeNull()
        ->and($landedCost->port_of_entry)->toBe('ميناء جدة الإسلامي')
        ->and($landedCost->bill_of_lading)->toBe('BL-MAERSK-876543')
        ->and((float) $landedCost->customs_duty_amount)->toBe(1200.0)
        ->and((float) $landedCost->customs_vat_amount)->toBe(1800.0)
        ->and((float) $landedCost->freight_amount)->toBe(3000.0)
        ->and($landedCost->status)->toBe('draft');

    // Charges should sum to duty + vat + freight + port + insurance + other = 1200 + 1800 + 3000 + 600 + 400 + 200 = 7200.00
    expect((float) $landedCost->total_charges)->toBe(7200.0);

    // Verify allocations: non-VAT capitalizable charges = 7200 - 1800 = 5400.00
    // Total weight = (100 * 50) + (200 * 5) = 5000 + 1000 = 6000 kg
    // Line A (5000 / 6000) = 5/6 of 5400 = 4500.00 SAR
    // Line B (1000 / 6000) = 1/6 of 5400 = 900.00 SAR
    $allocA = $landedCost->allocations()->where('product_id', $productA->id)->first();
    $allocB = $landedCost->allocations()->where('product_id', $productB->id)->first();

    expect($allocA)->not->toBeNull()
        ->and((float) $allocA->allocated_amount)->toBe(4500.0)
        ->and((float) $allocA->new_unit_cost)->toBe(145.0); // 100 + 4500/100 = 145.00

    expect($allocB)->not->toBeNull()
        ->and((float) $allocB->allocated_amount)->toBe(900.0)
        ->and((float) $allocB->new_unit_cost)->toBe(54.5); // 50 + 900/200 = 54.50

    // 3. Post the Landed Cost voucher
    $postResponse = $this->actingAs($this->user)
        ->post(route('inventory.landed-costs.post', $landedCost->id));

    $postResponse->assertRedirect();
    $landedCost->refresh();

    expect($landedCost->status)->toBe('posted')
        ->and($landedCost->journal_entry_id)->not->toBeNull();

    // Verify balanced GL entry:
    // DR Inventory (1300): 5400.00
    // DR VAT Input (2150): 1800.00 (ZATCA Box 8)
    // CR Clearing (2020) for each charge = 7200.00
    $journalEntry = $landedCost->journalEntry;
    expect($journalEntry)->not->toBeNull();

    $invLine = $journalEntry->lines()->whereHas('account', fn ($q) => $q->where('code', '1300'))->first();
    $vatLine = $journalEntry->lines()->whereHas('account', fn ($q) => $q->whereIn('code', ['1150', '2150']))->first();

    expect($invLine)->not->toBeNull()
        ->and((float) $invLine->debit)->toBe(5400.0);

    expect($vatLine)->not->toBeNull()
        ->and((float) $vatLine->debit)->toBe(1800.0);

    $totalDebit = (float) $journalEntry->lines()->sum('debit');
    $totalCredit = (float) $journalEntry->lines()->sum('credit');
    expect($totalDebit)->toBe(7200.0)
        ->and($totalCredit)->toBe(7200.0);

    // Check updated moving average costs on products
    $productA->refresh();
    $productB->refresh();
    expect((float) $productA->moving_average_cost)->toBe(145.0)
        ->and((float) $productB->moving_average_cost)->toBe(54.5);

    // 4. Verify Show Page renders properly
    $showResponse = $this->actingAs($this->user)
        ->get(route('inventory.landed-costs.show', $landedCost->id));

    $showResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Inventory/LandedCosts/Show')
            ->has('landedCost.customs_declaration_number')
            ->where('landedCost.customs_declaration_number', 'FASAH-2026-99881')
            ->where('landedCost.port_of_entry', 'ميناء جدة الإسلامي')
        );
});
