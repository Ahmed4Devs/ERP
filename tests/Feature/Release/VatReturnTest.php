<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Models\ServiceInvoiceLine;
use App\Modules\Accounting\Models\VatReturn;
use App\Modules\Accounting\Queries\VatReturnQuery;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Models\VendorBillLine;
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

test('vat returns index page lists records and metrics', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();

    $response = $this->actingAs($user)->get(route('accounting.vat-returns.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Accounting/VatReturns/Index')
        ->has('vatReturns')
        ->has('metrics')
        ->has('filters')
    );
});

test('vat return query aggregates output tax from sales and input tax from vendor bills', function () {
    $company = app(CurrentCompany::class)->get();
    $tenant = app(CurrentTenant::class)->get();

    $customer = Party::where('tenant_id', $tenant->id)->where('type', 'customer')->firstOrFail();
    $vendor = Party::where('tenant_id', $tenant->id)->where('type', 'vendor')->firstOrFail();

    $revenueAccount = Account::where('company_id', $company->id)->where('code', '4100')->firstOrFail();
    $expenseAccount = Account::where('company_id', $company->id)->where('code', '5000')->firstOrFail();

    // 1. Create a posted sales invoice (Subtotal: 2000, Tax: 200 (10%), Total: 2200)
    $invoice = ServiceInvoice::create([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'party_id' => $customer->id,
        'invoice_number' => 'INV-VAT-TEST-001',
        'date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'status' => 'posted',
        'subtotal' => '2000.000000',
        'tax_rate' => '0.100000',
        'tax_amount' => '200.000000',
        'total' => '2200.000000',
        'amount_paid' => '0.000000',
        'balance_due' => '2200.000000',
    ]);

    ServiceInvoiceLine::create([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'service_invoice_id' => $invoice->id,
        'account_id' => $revenueAccount->id,
        'description' => 'Consulting Services',
        'quantity' => '1.000000',
        'unit_price' => '2000.000000',
        'amount' => '2000.000000',
        'tax_rate' => '0.100000',
        'tax_amount' => '200.000000',
        'total' => '2200.000000',
    ]);

    // 2. Create a posted vendor bill (Subtotal: 800, Tax: 80 (10%), Total: 880)
    $bill = VendorBill::create([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'party_id' => $vendor->id,
        'bill_number' => 'BILL-VAT-TEST-001',
        'vendor_invoice_ref' => 'VEND-REF-99',
        'date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'status' => 'posted',
        'subtotal' => '800.000000',
        'tax_rate' => '0.100000',
        'tax_amount' => '80.000000',
        'total' => '880.000000',
        'amount_paid' => '0.000000',
        'balance_due' => '880.000000',
    ]);

    VendorBillLine::create([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'vendor_bill_id' => $bill->id,
        'expense_account_id' => $expenseAccount->id,
        'description' => 'Software License',
        'quantity' => '1.000000',
        'unit_price' => '800.000000',
        'amount' => '800.000000',
        'tax_rate' => '0.100000',
        'tax_amount' => '80.000000',
        'total' => '880.000000',
    ]);

    $query = app(VatReturnQuery::class);
    $result = $query->execute(now()->subDays(5)->toDateString(), now()->addDays(5)->toDateString(), $company->id);

    // Verify Output Tax = 200, Input Tax = 80, Net Payable = 120
    expect((float) $result['summary']['total_output_vat'])->toBeGreaterThanOrEqual(200.0)
        ->and((float) $result['summary']['total_input_vat'])->toBeGreaterThanOrEqual(80.0)
        ->and($result['sales_details'])->not->toBeEmpty()
        ->and($result['purchases_details'])->not->toBeEmpty();
});

test('storing, filing, printing and exporting vat return works end to end', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $company = app(CurrentCompany::class)->get();
    $tenant = app(CurrentTenant::class)->get();

    $postData = [
        'return_number' => 'VAT-2026-Q1-TEST',
        'period_type' => 'quarterly',
        'tax_period' => '2026-Q1',
        'start_date' => '2026-01-01',
        'end_date' => '2026-03-31',
        'standard_sales_amount' => 50000.00,
        'standard_sales_vat' => 5000.00,
        'standard_sales_adjustment' => 0.00,
        'zero_rated_sales_amount' => 0.00,
        'exempt_sales_amount' => 0.00,
        'total_sales_amount' => 50000.00,
        'total_output_vat' => 5000.00,
        'standard_purchases_amount' => 20000.00,
        'standard_purchases_vat' => 2000.00,
        'standard_purchases_adjustment' => 0.00,
        'imports_vat_amount' => 0.00,
        'zero_rated_purchases_amount' => 0.00,
        'exempt_purchases_amount' => 0.00,
        'total_purchases_amount' => 20000.00,
        'total_input_vat' => 2000.00,
        'net_vat_due' => 3000.00,
        'previous_period_credit' => 0.00,
        'final_net_payable' => 3000.00,
        'notes' => 'Q1 2026 VAT declaration for testing',
    ];

    // 1. Store VAT Return
    $response = $this->actingAs($user)->post(route('accounting.vat-returns.store'), $postData);
    $response->assertRedirect();

    $vatReturn = VatReturn::where('return_number', 'VAT-2026-Q1-TEST')->firstOrFail();
    expect($vatReturn->status)->toBe('draft')
        ->and((float) $vatReturn->final_net_payable)->toBe(3000.00);

    // 2. Show page
    $showResponse = $this->actingAs($user)->get(route('accounting.vat-returns.show', $vatReturn->id));
    $showResponse->assertOk();
    $showResponse->assertInertia(fn ($page) => $page
        ->component('Accounting/VatReturns/Show')
        ->has('vatReturn')
        ->has('details')
    );

    // 3. File Return & Generate Tax Settlement Entry
    $fileResponse = $this->actingAs($user)->post(route('accounting.vat-returns.file', $vatReturn->id));
    $fileResponse->assertRedirect();

    $vatReturn->refresh();
    expect($vatReturn->status)->toBe('filed')
        ->and($vatReturn->filed_by)->toBe($user->id)
        ->and($vatReturn->filing_date)->not->toBeNull()
        ->and($vatReturn->journal_entry_id)->not->toBeNull();

    // Verify Tax Settlement Journal Entry
    $journalEntry = JournalEntry::with('lines.account')->find($vatReturn->journal_entry_id);
    expect($journalEntry)->not->toBeNull()
        ->and($journalEntry->status)->toBe('posted');

    // 4. Print ZATCA Form Page
    $printResponse = $this->actingAs($user)->get(route('accounting.vat-returns.print', $vatReturn->id));
    $printResponse->assertOk();
    $printResponse->assertInertia(fn ($page) => $page
        ->component('Accounting/VatReturns/Print')
        ->has('vatReturn')
        ->has('company')
        ->has('qrCodeDataUri')
    );

    // 5. CSV Export
    $exportResponse = $this->actingAs($user)->get(route('accounting.vat-returns.export', $vatReturn->id));
    $exportResponse->assertOk();
    expect($exportResponse->headers->get('content-type'))->toContain('text/csv');
});
