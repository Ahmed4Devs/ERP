<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\InventoryCostingEngine;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Purchasing\Models\DebitNote;
use App\Modules\Sales\Models\CreditNote;
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
    $this->branch = Branch::where('company_id', $this->company->id)->first() ?? Branch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Main Branch',
        'code' => 'MAIN-01',
    ]);

    // Ensure Sales Return GL Account 4100 exists
    Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '4100'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Sales Returns & Allowances', 'name_ar' => 'مردودات ومسموحات المبيعات', 'type' => 'revenue', 'subtype' => 'operating_revenue',
    ]);

    // Ensure Accounts Receivable 1200 exists
    Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '1200'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Accounts Receivable', 'name_ar' => 'العملاء والذمم المدينة', 'type' => 'asset', 'subtype' => 'receivable',
    ]);

    // Ensure Accounts Payable 2010 exists
    Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '2010'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Accounts Payable', 'name_ar' => 'الموردين والذمم الدائنة', 'type' => 'liability', 'subtype' => 'payable',
    ]);

    // Ensure Output VAT 2150 exists
    Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '2150'], [
        'tenant_id' => $this->tenant->id, 'name' => 'VAT Output Tax Payable', 'name_ar' => 'ضريبة القيمة المضافة المستحقة (مخرجات)', 'type' => 'liability', 'subtype' => 'tax_payable',
    ]);

    // Ensure Input VAT 1150 exists
    Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '1150'], [
        'tenant_id' => $this->tenant->id, 'name' => 'VAT Input Tax Recoverable', 'name_ar' => 'ضريبة القيمة المضافة المدخلات (مستردة)', 'type' => 'asset', 'subtype' => 'tax_recoverable',
    ]);

    // Ensure Inventory Account 1300 exists
    Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '1300'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Merchandise Inventory', 'name_ar' => 'مخزون بضاعة بغرض البيع', 'type' => 'asset', 'subtype' => 'inventory',
    ]);

    // Ensure Cost of Goods Sold Account 5000 exists
    Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '5000'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Cost of Goods Sold', 'name_ar' => 'تكلفة البضاعة المباعة', 'type' => 'expense', 'subtype' => 'cogs',
    ]);

    $this->customer = Party::firstOrCreate([
        'tenant_id' => $this->tenant->id,
        'name' => 'Advanced Tech Client Ltd',
        'type' => 'customer',
    ]);

    $this->vendor = Party::firstOrCreate([
        'tenant_id' => $this->tenant->id,
        'name' => 'Global Machinery Supply',
        'type' => 'vendor',
    ]);

    $this->warehouse = Warehouse::where('company_id', $this->company->id)->first() ?? Warehouse::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Central Warehouse',
        'code' => 'WH-01',
    ]);

    $this->product = Product::where('company_id', $this->company->id)->first() ?? Product::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Commercial Industrial Drill',
        'sku' => 'PRD-IND-01',
        'list_price' => '500.000000',
        'standard_cost' => '300.000000',
    ]);
});

test('sales credit note lifecycle: create draft, view, post with GL and inventory reversal, and print voucher', function () {
    // 1. Visit Index page
    $response = $this->actingAs($this->user)->get('/sales/credit-notes');
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Sales/CreditNotes/Index'));

    // 2. Visit Create page
    $createResponse = $this->actingAs($this->user)->get('/sales/credit-notes/create');
    $createResponse->assertOk();
    $createResponse->assertInertia(fn ($page) => $page->component('Sales/CreditNotes/Create'));

    // 3. Store new Credit Note
    $postData = [
        'customer_id' => $this->customer->id,
        'branch_id' => $this->branch->id,
        'date' => now()->toDateString(),
        'reason' => 'Customer return due to specification mismatch',
        'notes' => 'Handled and inspected by quality control',
        'lines' => [
            [
                'product_id' => $this->product->id,
                'warehouse_id' => $this->warehouse->id,
                'description' => 'Industrial Drill return',
                'quantity' => 2,
                'unit_price' => 500.0,
                'tax_rate' => 0.15,
            ],
        ],
    ];

    $storeResponse = $this->actingAs($this->user)->post('/sales/credit-notes', $postData);
    $creditNote = CreditNote::where('customer_id', $this->customer->id)->latest()->first();
    expect($creditNote)->not->toBeNull();
    $storeResponse->assertRedirect("/sales/credit-notes/{$creditNote->id}");

    expect((float) $creditNote->subtotal)->toBe(1000.0)
        ->and((float) $creditNote->tax_amount)->toBe(150.0)
        ->and((float) $creditNote->total)->toBe(1150.0)
        ->and($creditNote->status)->toBe('draft');

    // 4. View Show page as draft
    $showResponse = $this->actingAs($this->user)->get("/sales/credit-notes/{$creditNote->id}");
    $showResponse->assertOk();
    $showResponse->assertInertia(fn ($page) => $page->component('Sales/CreditNotes/Show'));

    // 5. Post the Credit Note
    $postActionResponse = $this->actingAs($this->user)->post("/sales/credit-notes/{$creditNote->id}/post");
    $postActionResponse->assertRedirect("/sales/credit-notes/{$creditNote->id}");

    $creditNote->refresh();
    expect($creditNote->status)->toBe('posted')
        ->and($creditNote->journal_entry_id)->not->toBeNull();

    // Verify GL Revenue Reversal Journal Entry
    $journal = $creditNote->journalEntry;
    expect($journal)->not->toBeNull();
    $drSalesReturn = $journal->lines->where('account_id', Account::where('company_id', $this->company->id)->where('code', '4100')->first()->id)->first();
    $drTax = $journal->lines->where('account_id', Account::where('company_id', $this->company->id)->where('code', '2150')->first()->id)->first();
    $crAR = $journal->lines->where('account_id', Account::where('company_id', $this->company->id)->where('code', '1200')->first()->id)->first();

    expect((float) $drSalesReturn->debit)->toBe(1000.0)
        ->and((float) $drTax->debit)->toBe(150.0)
        ->and((float) $crAR->credit)->toBe(1150.0);

    // Verify Costing restock journal entry
    expect($creditNote->costing_journal_entry_id)->not->toBeNull();
    $costJournal = $creditNote->costingJournalEntry;
    expect($costJournal)->not->toBeNull();

    // 6. View Print Page
    $printResponse = $this->actingAs($this->user)->get("/sales/credit-notes/{$creditNote->id}/print");
    $printResponse->assertOk();
    $printResponse->assertInertia(fn ($page) => $page->component('Sales/CreditNotes/Print')
        ->has('qrCodeDataUri')
        ->has('amountInWords')
    );
});

test('purchasing debit note lifecycle: create draft, view, post with GL liability and stock issue, and print voucher', function () {
    // 1. Visit Index page
    $response = $this->actingAs($this->user)->get('/purchasing/debit-notes');
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Purchasing/DebitNotes/Index'));

    // 2. Visit Create page
    $createResponse = $this->actingAs($this->user)->get('/purchasing/debit-notes/create');
    $createResponse->assertOk();
    $createResponse->assertInertia(fn ($page) => $page->component('Purchasing/DebitNotes/Create'));

    // 3. Store new Debit Note
    $postData = [
        'vendor_id' => $this->vendor->id,
        'branch_id' => $this->branch->id,
        'date' => now()->toDateString(),
        'reason' => 'Vendor return due to damaged packaging',
        'notes' => 'Returned directly with courier receipt',
        'lines' => [
            [
                'product_id' => $this->product->id,
                'warehouse_id' => $this->warehouse->id,
                'description' => 'Drill returned to supplier',
                'quantity' => 3,
                'unit_price' => 300.0,
                'tax_rate' => 0.15,
            ],
        ],
    ];

    $storeResponse = $this->actingAs($this->user)->post('/purchasing/debit-notes', $postData);
    $debitNote = DebitNote::where('vendor_id', $this->vendor->id)->latest()->first();
    expect($debitNote)->not->toBeNull();
    $storeResponse->assertRedirect("/purchasing/debit-notes/{$debitNote->id}");

    expect((float) $debitNote->subtotal)->toBe(900.0)
        ->and((float) $debitNote->tax_amount)->toBe(135.0)
        ->and((float) $debitNote->total)->toBe(1035.0)
        ->and($debitNote->status)->toBe('draft');

    // 4. View Show page
    $showResponse = $this->actingAs($this->user)->get("/purchasing/debit-notes/{$debitNote->id}");
    $showResponse->assertOk();
    $showResponse->assertInertia(fn ($page) => $page->component('Purchasing/DebitNotes/Show'));

    // Receive initial stock into warehouse so it can be returned/issued
    app(InventoryCostingEngine::class)->receiveStock([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'product_id' => $this->product->id,
        'warehouse_id' => $this->warehouse->id,
        'quantity' => '10.000000',
        'unit_cost' => '300.000000',
        'movement_type' => 'opening',
    ]);

    // 5. Post the Debit Note
    $postActionResponse = $this->actingAs($this->user)->post("/purchasing/debit-notes/{$debitNote->id}/post");
    $postActionResponse->assertRedirect("/purchasing/debit-notes/{$debitNote->id}");

    $debitNote->refresh();
    expect($debitNote->status)->toBe('posted')
        ->and($debitNote->journal_entry_id)->not->toBeNull();

    // Verify GL Vendor Liability Reduction Journal Entry
    $journal = $debitNote->journalEntry;
    expect($journal)->not->toBeNull();
    $drAP = $journal->lines->where('account_id', Account::where('company_id', $this->company->id)->where('code', '2010')->first()->id)->first();
    $crTax = $journal->lines->where('account_id', Account::where('company_id', $this->company->id)->where('code', '1150')->first()->id)->first();
    $crInv = $journal->lines->where('account_id', Account::where('company_id', $this->company->id)->where('code', '1300')->first()->id)->first();

    expect((float) $drAP->debit)->toBe(1035.0)
        ->and((float) $crTax->credit)->toBe(135.0)
        ->and((float) $crInv->credit)->toBe(900.0);

    // 6. View Print Page
    $printResponse = $this->actingAs($this->user)->get("/purchasing/debit-notes/{$debitNote->id}/print");
    $printResponse->assertOk();
    $printResponse->assertInertia(fn ($page) => $page->component('Purchasing/DebitNotes/Print')
        ->has('qrCodeDataUri')
        ->has('amountInWords')
    );
});
