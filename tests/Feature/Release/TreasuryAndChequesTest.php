<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Treasury\Models\BankGuarantee;
use App\Modules\Treasury\Models\Cheque;
use App\Modules\Treasury\Services\BankGuaranteeService;
use App\Modules\Treasury\Services\ChequeService;
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

    $this->chequeService = app(ChequeService::class);
    $this->guaranteeService = app(BankGuaranteeService::class);
});

test('it registers received cheque and posts automated PDC journal entry', function () {
    $cheque = $this->chequeService->registerReceivedCheque([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'cheque_number' => 'CHQ-REC-001',
        'bank_name' => 'Al-Rajhi Bank',
        'drawer_name' => 'Al-Mada Trading Est.',
        'issue_date' => '2026-09-10',
        'due_date' => '2026-10-10',
        'amount' => 25000.00,
        'currency' => 'SAR',
    ]);

    expect($cheque)->toBeInstanceOf(Cheque::class)
        ->and($cheque->status)->toBe('in_safe')
        ->and($cheque->type)->toBe('received')
        ->and((float) $cheque->amount)->toBe(25000.00)
        ->and($cheque->journal_entry_id)->not->toBeNull();

    $entry = JournalEntry::with('lines.account')->find($cheque->journal_entry_id);
    expect($entry)->not->toBeNull()
        ->and($entry->lines)->toHaveCount(2);

    // PDC line (1030) DR 25000, Customer AR (1200) CR 25000
    $debitLine = $entry->lines->firstWhere('debit', '>', 0);
    $creditLine = $entry->lines->firstWhere('credit', '>', 0);

    expect((float) $debitLine->debit)->toBe(25000.00)
        ->and($debitLine->account->code)->toBe('1030')
        ->and((float) $creditLine->credit)->toBe(25000.00)
        ->and($creditLine->account->code)->toBe('1200');
});

test('it handles full PDC collection lifecycle with settlement journal entry', function () {
    $cheque = $this->chequeService->registerReceivedCheque([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'cheque_number' => 'CHQ-REC-002',
        'bank_name' => 'SNB Al-Ahli',
        'drawer_name' => 'Gulf Tech Co.',
        'issue_date' => '2026-09-01',
        'due_date' => '2026-09-15',
        'amount' => 15000.00,
    ]);

    // 1. Deposit to bank
    $bankAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '1020'],
        ['tenant_id' => $this->tenant->id, 'name' => 'Bank', 'name_ar' => 'البنك', 'type' => 'asset', 'subtype' => 'bank']
    );

    $deposited = $this->chequeService->depositReceivedCheque($cheque->id, $bankAccount->id);
    expect($deposited->status)->toBe('under_collection')
        ->and($deposited->bank_account_id)->toBe($bankAccount->id);

    // 2. Collect at bank
    $collected = $this->chequeService->collectReceivedCheque($cheque->id);
    expect($collected->status)->toBe('collected')
        ->and($collected->settlement_journal_entry_id)->not->toBeNull();

    $settlementEntry = JournalEntry::with('lines.account')->find($collected->settlement_journal_entry_id);
    expect($settlementEntry)->not->toBeNull();

    // DR Bank (1020) 15000, CR PDC (1030) 15000
    $debitLine = $settlementEntry->lines->firstWhere('debit', '>', 0);
    $creditLine = $settlementEntry->lines->firstWhere('credit', '>', 0);

    expect((float) $debitLine->debit)->toBe(15000.00)
        ->and($debitLine->account->code)->toBe('1020')
        ->and((float) $creditLine->credit)->toBe(15000.00)
        ->and($creditLine->account->code)->toBe('1030');
});

test('it handles bounced cheque with reversing journal entry back to accounts receivable', function () {
    $cheque = $this->chequeService->registerReceivedCheque([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'cheque_number' => 'CHQ-REC-003',
        'bank_name' => 'Riyad Bank',
        'drawer_name' => 'Eastern Logistics',
        'issue_date' => '2026-09-05',
        'due_date' => '2026-09-20',
        'amount' => 8000.00,
    ]);

    $bounced = $this->chequeService->bounceReceivedCheque($cheque->id, 'Insufficient funds in customer account');

    expect($bounced->status)->toBe('bounced')
        ->and($bounced->bounce_reason)->toBe('Insufficient funds in customer account')
        ->and($bounced->settlement_journal_entry_id)->not->toBeNull();

    $reversalEntry = JournalEntry::with('lines.account')->find($bounced->settlement_journal_entry_id);
    // DR Customer AR (1200) 8000, CR PDC (1030) 8000
    $debitLine = $reversalEntry->lines->firstWhere('debit', '>', 0);
    $creditLine = $reversalEntry->lines->firstWhere('credit', '>', 0);

    expect((float) $debitLine->debit)->toBe(8000.00)
        ->and($debitLine->account->code)->toBe('1200')
        ->and((float) $creditLine->credit)->toBe(8000.00)
        ->and($creditLine->account->code)->toBe('1030');
});

test('it registers issued cheque and clears it upon bank deduction', function () {
    // 1. Issue cheque to vendor
    $cheque = $this->chequeService->registerIssuedCheque([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'cheque_number' => 'CHQ-ISS-001',
        'bank_name' => 'Al-Rajhi Bank',
        'drawer_name' => 'Al-Amal Co.',
        'payee_name' => 'Modern Supplies Co.',
        'issue_date' => '2026-09-12',
        'due_date' => '2026-10-15',
        'amount' => 12000.00,
    ]);

    expect($cheque->type)->toBe('issued')
        ->and($cheque->status)->toBe('issued');

    $issueEntry = JournalEntry::with('lines.account')->find($cheque->journal_entry_id);
    // DR AP (2100) 12000, CR PDC Payable (2030) 12000
    $debitLine = $issueEntry->lines->firstWhere('debit', '>', 0);
    $creditLine = $issueEntry->lines->firstWhere('credit', '>', 0);

    expect((float) $debitLine->debit)->toBe(12000.00)
        ->and($debitLine->account->code)->toBe('2100')
        ->and((float) $creditLine->credit)->toBe(12000.00)
        ->and($creditLine->account->code)->toBe('2030');

    // 2. Clear cheque
    $cleared = $this->chequeService->clearIssuedCheque($cheque->id);
    expect($cleared->status)->toBe('cleared')
        ->and($cleared->settlement_journal_entry_id)->not->toBeNull();

    $clearEntry = JournalEntry::with('lines.account')->find($cleared->settlement_journal_entry_id);
    // DR PDC Payable (2030) 12000, CR Bank (1020) 12000
    $clrDebit = $clearEntry->lines->firstWhere('debit', '>', 0);
    $clrCredit = $clearEntry->lines->firstWhere('credit', '>', 0);

    expect((float) $clrDebit->debit)->toBe(12000.00)
        ->and($clrDebit->account->code)->toBe('2030')
        ->and((float) $clrCredit->credit)->toBe(12000.00)
        ->and($clrCredit->account->code)->toBe('1020');
});

test('it manages bank guarantees lifecycle with margin deduction and release', function () {
    // 1. Issue Bank Guarantee (Performance Bond 100,000 SAR with 10% cash margin and 500 SAR bank fee)
    $guarantee = $this->guaranteeService->issueGuarantee([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'guarantee_number' => 'LG-2026-001',
        'type' => 'performance_bond',
        'beneficiary_name' => 'Ministry of Transport',
        'issuing_bank' => 'Al-Rajhi Bank',
        'amount' => 100000.00,
        'margin_percentage' => 10.0,
        'margin_amount' => 10000.00,
        'commission_amount' => 500.00,
        'issue_date' => '2026-09-10',
        'expiry_date' => '2027-03-10',
    ]);

    expect($guarantee)->toBeInstanceOf(BankGuarantee::class)
        ->and($guarantee->status)->toBe('active')
        ->and((float) $guarantee->margin_amount)->toBe(10000.00)
        ->and($guarantee->journal_entry_id)->not->toBeNull();

    $issueEntry = JournalEntry::with('lines.account')->find($guarantee->journal_entry_id);
    // DR Margin (1040) 10000, DR Commission (5240) 500, CR Bank (1020) 10500
    expect($issueEntry->lines)->toHaveCount(3);
    $bankLine = $issueEntry->lines->firstWhere('credit', '>', 0);
    expect((float) $bankLine->credit)->toBe(10500.00);

    // 2. Renew Guarantee
    $renewed = $this->guaranteeService->renewGuarantee($guarantee->id, '2027-09-10', 250.00);
    expect($renewed->status)->toBe('renewed')
        ->and($renewed->expiry_date->toDateString())->toBe('2027-09-10');

    // 3. Release Guarantee (refund 10,000 cash margin back to bank account)
    $released = $this->guaranteeService->releaseGuarantee($guarantee->id);
    expect($released->status)->toBe('released');

    $releaseEntry = JournalEntry::where('description', 'like', '%إفراج عن خطاب ضمان%')
        ->with('lines.account')
        ->first();

    expect($releaseEntry)->not->toBeNull();
    // DR Bank 10000, CR Margin 10000
    $drBank = $releaseEntry->lines->firstWhere('account.code', '1020');
    $crMargin = $releaseEntry->lines->firstWhere('account.code', '1040');

    expect((float) $drBank->debit)->toBe(10000.00)
        ->and((float) $crMargin->credit)->toBe(10000.00);
});

test('it renders cheques and bank guarantees inertia pages and accepts web routes', function () {
    // 1. Cheques Index
    $this->actingAs($this->user)
        ->get('/treasury/cheques')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Treasury/Cheques/Index')
            ->has('cheques')
            ->has('metrics')
        );

    // 2. Create Cheque
    $this->actingAs($this->user)
        ->get('/treasury/cheques/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Treasury/Cheques/Create')
            ->has('bankAccounts')
        );

    // 3. Post new Cheque via web route
    $response = $this->actingAs($this->user)
        ->post('/treasury/cheques', [
            'type' => 'received',
            'cheque_number' => 'CHQ-WEB-001',
            'bank_name' => 'SNB',
            'drawer_name' => 'Al-Noor Co.',
            'issue_date' => '2026-09-12',
            'due_date' => '2026-10-12',
            'amount' => 5000.00,
            'currency' => 'SAR',
        ]);

    $response->assertRedirect();
    $cheque = Cheque::where('cheque_number', 'CHQ-WEB-001')->firstOrFail();

    // 4. View Cheque details
    $this->actingAs($this->user)
        ->get("/treasury/cheques/{$cheque->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Treasury/Cheques/Show')
            ->has('cheque')
        );

    // 5. Bank Guarantees Index
    $this->actingAs($this->user)
        ->get('/treasury/bank-guarantees')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Treasury/BankGuarantees/Index')
            ->has('guarantees')
            ->has('metrics')
        );

    // 6. Post new Guarantee via web route
    $bgResponse = $this->actingAs($this->user)
        ->post('/treasury/bank-guarantees', [
            'guarantee_number' => 'LG-WEB-001',
            'type' => 'bid_bond',
            'beneficiary_name' => 'Saudi Aramco',
            'issuing_bank' => 'Alinma Bank',
            'amount' => 50000.00,
            'margin_percentage' => 5,
            'margin_amount' => 2500.00,
            'commission_amount' => 300.00,
            'issue_date' => '2026-09-12',
            'expiry_date' => '2026-12-12',
        ]);

    $bgResponse->assertRedirect('/treasury/bank-guarantees');
    expect(BankGuarantee::where('guarantee_number', 'LG-WEB-001')->exists())->toBeTrue();
});
