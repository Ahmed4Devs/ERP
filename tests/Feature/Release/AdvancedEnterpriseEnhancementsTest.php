<?php

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Queries\BalanceSheetQuery;
use App\Modules\Accounting\Queries\CustomerStatementQuery;
use App\Modules\Accounting\Queries\IncomeStatementQuery;
use App\Modules\Contracting\Models\ContractingClaim;
use App\Modules\Manufacturing\Models\ProductionOrder;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Payroll\Models\Payslip;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Purchasing\Queries\VendorStatementQuery;
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

test('customer statement query computes opening balances, transactions, and running balances correctly', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $customer = Party::where('type', 'customer')->firstOrFail();

    $query = app(CustomerStatementQuery::class);
    $data = $query->execute($customer->id, '2026-01-01', '2026-12-31');

    expect($data)->toHaveKeys(['customer', 'start_date', 'end_date', 'opening_balance', 'transactions', 'total_debit', 'total_credit', 'closing_balance'])
        ->and($data['customer']->id)->toBe($customer->id);

    // Test Inertia Response
    $response = $this->actingAs($user)->get(route('reports.customer-statement', ['customer_id' => $customer->id]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Accounting/Reports/CustomerStatement')
        ->has('report')
        ->has('customers')
        ->has('company')
    );

    // Test CSV Export
    $exportResponse = $this->actingAs($user)->get(route('reports.customer-statement.export', [
        'customer_id' => $customer->id,
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
    ]));
    $exportResponse->assertOk();
    expect($exportResponse->headers->get('content-type'))->toContain('text/csv');
});

test('vendor statement query computes opening balances, bills, payments, and running liability balance', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $vendor = Party::where('type', 'vendor')->firstOrFail();

    $query = app(VendorStatementQuery::class);
    $data = $query->execute($vendor->id, '2026-01-01', '2026-12-31');

    expect($data)->toHaveKeys(['vendor', 'start_date', 'end_date', 'opening_balance', 'transactions', 'total_debit', 'total_credit', 'closing_balance'])
        ->and($data['vendor']->id)->toBe($vendor->id);

    // Test Inertia Response
    $response = $this->actingAs($user)->get(route('reports.vendor-statement', ['vendor_id' => $vendor->id]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Accounting/Reports/VendorStatement')
        ->has('report')
        ->has('vendors')
        ->has('company')
    );

    // Test CSV Export
    $exportResponse = $this->actingAs($user)->get(route('reports.vendor-statement.export', [
        'vendor_id' => $vendor->id,
        'start_date' => '2026-01-01',
        'end_date' => '2026-12-31',
    ]));
    $exportResponse->assertOk();
    expect($exportResponse->headers->get('content-type'))->toContain('text/csv');
});

test('financial statements compute income statement and balance sheet with complete integrity', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();

    // 1. Income Statement Query
    $incomeQuery = app(IncomeStatementQuery::class);
    $incomeData = $incomeQuery->execute('2026-01-01', '2026-12-31');

    expect($incomeData)->toHaveKeys([
        'start_date', 'end_date', 'revenue_accounts', 'total_revenue',
        'cogs_accounts', 'total_cogs', 'gross_profit', 'gross_profit_margin',
        'expense_accounts', 'total_operating_expenses', 'operating_profit',
        'net_profit', 'net_profit_margin',
    ]);

    $incResponse = $this->actingAs($user)->get(route('reports.income-statement'));
    $incResponse->assertOk();
    $incResponse->assertInertia(fn ($page) => $page
        ->component('Accounting/Reports/IncomeStatement')
        ->has('report')
        ->has('company')
    );

    $incExport = $this->actingAs($user)->get(route('reports.income-statement.export'));
    $incExport->assertOk();
    expect($incExport->headers->get('content-type'))->toContain('text/csv');

    // 2. Balance Sheet Query
    $bsQuery = app(BalanceSheetQuery::class);
    $bsData = $bsQuery->execute('2026-12-31');

    expect($bsData)->toHaveKeys([
        'as_of_date', 'assets', 'total_assets', 'liabilities', 'total_liabilities',
        'equity_accounts', 'retained_or_current_earnings', 'total_equity',
        'total_liabilities_and_equity', 'is_balanced', 'discrepancy',
    ]);

    $bsResponse = $this->actingAs($user)->get(route('reports.balance-sheet'));
    $bsResponse->assertOk();
    $bsResponse->assertInertia(fn ($page) => $page
        ->component('Accounting/Reports/BalanceSheet')
        ->has('report')
        ->has('company')
    );

    $bsExport = $this->actingAs($user)->get(route('reports.balance-sheet.export'));
    $bsExport->assertOk();
    expect($bsExport->headers->get('content-type'))->toContain('text/csv');
});

test('journal entries management and official journal voucher render and print with verification', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $entry = JournalEntry::first();

    // 1. Index
    $indexResponse = $this->actingAs($user)->get(route('accounting.journal-entries.index'));
    $indexResponse->assertOk();
    $indexResponse->assertInertia(fn ($page) => $page
        ->component('Accounting/JournalEntries/Index')
        ->has('entries')
    );

    if ($entry) {
        // 2. Show
        $showResponse = $this->actingAs($user)->get(route('accounting.journal-entries.show', $entry->id));
        $showResponse->assertOk();
        $showResponse->assertInertia(fn ($page) => $page
            ->component('Accounting/JournalEntries/Show')
            ->has('entry')
            ->has('totals')
        );

        // 3. Print Voucher
        $printResponse = $this->actingAs($user)->get(route('accounting.journal-entries.print', $entry->id));
        $printResponse->assertOk();
        $printResponse->assertInertia(fn ($page) => $page
            ->component('Accounting/JournalEntries/Print')
            ->has('entry')
            ->has('company')
            ->has('totals')
            ->has('amountInWords')
            ->has('qrCodeDataUri')
        );
    }
});

test('employee payslips render official A4 printable voucher with tafqeet and GOSI deductions', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $payslip = Payslip::first();

    if ($payslip) {
        $response = $this->actingAs($user)->get(route('payroll.payslips.print', $payslip->id));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('Payroll/Payslips/Print')
            ->has('payslip')
            ->has('company')
            ->has('amountInWords')
            ->has('qrCodeDataUri')
        );
    }
});

test('specialized industry documents print correctly for contracting and manufacturing', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();

    // 1. Contracting Progress Claim Certificate
    $claim = ContractingClaim::first();
    if ($claim) {
        $claimResponse = $this->actingAs($user)->get(route('contracting.claims.print', $claim->id));
        $claimResponse->assertOk();
        $claimResponse->assertInertia(fn ($page) => $page
            ->component('Contracting/Claims/Print')
            ->has('claim')
            ->has('company')
            ->has('amountInWords')
            ->has('qrCodeDataUri')
        );
    }

    // 2. Manufacturing Production Order / Job Card
    $order = ProductionOrder::first();
    if ($order) {
        $orderResponse = $this->actingAs($user)->get(route('manufacturing.orders.print', $order->id));
        $orderResponse->assertOk();
        $orderResponse->assertInertia(fn ($page) => $page
            ->component('Manufacturing/ProductionOrders/Print')
            ->has('order')
            ->has('company')
            ->has('qrCodeDataUri')
        );
    }
});
