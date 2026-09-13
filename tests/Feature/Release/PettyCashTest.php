<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\PettyCashFund;
use App\Modules\Accounting\Models\PettyCashSettlement;
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
    $this->branch = Branch::where('company_id', $this->company->id)->first() ?? Branch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Main Branch',
        'code' => 'MAIN-01',
    ]);

    // Ensure Petty Cash Custody Account 1030 exists
    $this->custodyAccount = Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '1030'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Petty Cash Custody', 'name_ar' => 'العهد النقدية', 'type' => 'asset', 'subtype' => 'cash',
    ]);

    // Ensure Bank Account 1020 exists
    $this->bankAccount = Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '1020'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Al-Rajhi Bank Main Account', 'name_ar' => 'حساب بنك الراجحي الرئيسي', 'type' => 'asset', 'subtype' => 'bank',
    ]);

    // Ensure Office Supplies Expense 5100 exists
    $this->expenseAccount1 = Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '5100'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Office Supplies & Hospitality', 'name_ar' => 'أدوات مكتبية ومصروفات ضيافة', 'type' => 'expense', 'subtype' => 'operating_expense',
    ]);

    // Ensure Maintenance Expense 5110 exists
    $this->expenseAccount2 = Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '5110'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Repairs & Maintenance', 'name_ar' => 'صيانة وإصلاحات نثرية', 'type' => 'expense', 'subtype' => 'operating_expense',
    ]);

    // Ensure Input VAT 1150 exists
    Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '1150'], [
        'tenant_id' => $this->tenant->id, 'name' => 'VAT Input Tax Recoverable', 'name_ar' => 'ضريبة القيمة المضافة المدخلات (مستردة)', 'type' => 'asset', 'subtype' => 'tax_recoverable',
    ]);
});

test('petty cash funds and settlements lifecycle with bank replenishment and custody deductions', function () {
    // 1. Visit Petty Cash Index page
    $indexResponse = $this->actingAs($this->user)->get('/accounting/petty-cash');
    $indexResponse->assertOk();
    $indexResponse->assertInertia(fn ($page) => $page->component('Accounting/PettyCash/Index'));

    // 2. Create a new Petty Cash Fund
    $fundData = [
        'name' => 'Administration Petty Cash Fund',
        'name_ar' => 'عهدة المصروفات النثرية - الإدارة العامة',
        'code' => 'PCF-HQ-01',
        'custodian_id' => $this->user->id,
        'account_id' => $this->custodyAccount->id,
        'branch_id' => $this->branch->id,
        'fund_limit' => 5000.0,
        'current_balance' => 5000.0,
        'notes' => 'Petty fund for urgent administrative expenses',
    ];

    $createFundResponse = $this->actingAs($this->user)->post('/accounting/petty-cash/funds', $fundData);
    $createFundResponse->assertRedirect('/accounting/petty-cash');

    $fund = PettyCashFund::where('code', 'PCF-HQ-01')->first();
    expect($fund)->not->toBeNull()
        ->and((float) $fund->fund_limit)->toBe(5000.0)
        ->and((float) $fund->current_balance)->toBe(5000.0);

    // 3. Visit Create Settlement page
    $createSettlementPageResponse = $this->actingAs($this->user)->get('/accounting/petty-cash/settlements/create');
    $createSettlementPageResponse->assertOk();
    $createSettlementPageResponse->assertInertia(fn ($page) => $page->component('Accounting/PettyCash/CreateSettlement'));

    // 4. Create a draft Settlement Voucher with Bank Replenishment
    $settlementData = [
        'fund_id' => $fund->id,
        'branch_id' => $this->branch->id,
        'date' => now()->toDateString(),
        'reimbursement_type' => 'replenish_bank',
        'bank_account_id' => $this->bankAccount->id,
        'notes' => 'Weekly petty cash settlement for cleaning and hospitality items',
        'lines' => [
            [
                'expense_account_id' => $this->expenseAccount1->id,
                'description' => 'Coffee, tea & guest hospitality supplies',
                'receipt_ref' => 'INV-SUP-8891',
                'receipt_date' => now()->toDateString(),
                'subtotal' => 200.0,
                'tax_rate' => 0.15,
            ],
            [
                'expense_account_id' => $this->expenseAccount2->id,
                'description' => 'Urgent lock repair and office keys duplicating',
                'receipt_ref' => 'INV-REP-102',
                'receipt_date' => now()->toDateString(),
                'subtotal' => 300.0,
                'tax_rate' => 0.15,
            ],
        ],
    ];

    $storeResponse = $this->actingAs($this->user)->post('/accounting/petty-cash/settlements', $settlementData);
    $settlement = PettyCashSettlement::where('fund_id', $fund->id)->latest()->first();
    expect($settlement)->not->toBeNull();
    $storeResponse->assertRedirect("/accounting/petty-cash/settlements/{$settlement->id}");

    // Subtotal = 500, Tax = 75, Total = 575
    expect((float) $settlement->subtotal)->toBe(500.0)
        ->and((float) $settlement->tax_amount)->toBe(75.0)
        ->and((float) $settlement->total)->toBe(575.0)
        ->and($settlement->status)->toBe('draft');

    // 5. View Settlement Show page
    $showResponse = $this->actingAs($this->user)->get("/accounting/petty-cash/settlements/{$settlement->id}");
    $showResponse->assertOk();
    $showResponse->assertInertia(fn ($page) => $page->component('Accounting/PettyCash/ShowSettlement'));

    // 6. Post the Settlement (Bank Replenishment)
    $postResponse = $this->actingAs($this->user)->post("/accounting/petty-cash/settlements/{$settlement->id}/post");
    $postResponse->assertRedirect("/accounting/petty-cash/settlements/{$settlement->id}");

    $settlement->refresh();
    expect($settlement->status)->toBe('posted')
        ->and($settlement->journal_entry_id)->not->toBeNull();

    // Verify GL Journal Entry: DR 5100 (200), DR 5110 (300), DR 1150 (75) / CR 1020 (575)
    $journal = $settlement->journalEntry;
    expect($journal)->not->toBeNull();

    $drExp1 = $journal->lines->where('account_id', $this->expenseAccount1->id)->first();
    $drExp2 = $journal->lines->where('account_id', $this->expenseAccount2->id)->first();
    $drTax = $journal->lines->where('account_id', Account::where('company_id', $this->company->id)->where('code', '1150')->first()->id)->first();
    $crBank = $journal->lines->where('account_id', $this->bankAccount->id)->first();

    expect((float) $drExp1->debit)->toBe(200.0)
        ->and((float) $drExp2->debit)->toBe(300.0)
        ->and((float) $drTax->debit)->toBe(75.0)
        ->and((float) $crBank->credit)->toBe(575.0);

    // Fund balance was replenished so remains at 5000
    $fund->refresh();
    expect((float) $fund->current_balance)->toBe(5000.0);

    // 7. Test Custody Deduction Mode (reducing fund balance)
    $deductSettlementData = [
        'fund_id' => $fund->id,
        'branch_id' => $this->branch->id,
        'date' => now()->toDateString(),
        'reimbursement_type' => 'deduct_custody',
        'notes' => 'Partial custody reduction settlement',
        'lines' => [
            [
                'expense_account_id' => $this->expenseAccount1->id,
                'description' => 'Office stationery packets',
                'receipt_ref' => 'INV-STAT-01',
                'receipt_date' => now()->toDateString(),
                'subtotal' => 1000.0,
                'tax_rate' => 0.15,
            ],
        ],
    ];

    $this->actingAs($this->user)->post('/accounting/petty-cash/settlements', $deductSettlementData);
    $deductSettlement = PettyCashSettlement::where('fund_id', $fund->id)->where('reimbursement_type', 'deduct_custody')->latest()->first();
    expect($deductSettlement)->not->toBeNull();

    $this->actingAs($this->user)->post("/accounting/petty-cash/settlements/{$deductSettlement->id}/post");

    // Total was 1150 (1000 + 150 VAT)
    // CR 1030 Custody Account (1150)
    $deductJournal = $deductSettlement->fresh()->journalEntry;
    $crCustody = $deductJournal->lines->where('account_id', $this->custodyAccount->id)->first();
    expect((float) $crCustody->credit)->toBe(1150.0);

    // Fund current_balance should now be 5000 - 1150 = 3850
    $fund->refresh();
    expect((float) $fund->current_balance)->toBe(3850.0);

    // 8. View Print Page
    $printResponse = $this->actingAs($this->user)->get("/accounting/petty-cash/settlements/{$settlement->id}/print");
    $printResponse->assertOk();
    $printResponse->assertInertia(fn ($page) => $page->component('Accounting/PettyCash/PrintSettlement')
        ->has('qrCodeDataUri')
        ->has('amountInWords')
    );
});
