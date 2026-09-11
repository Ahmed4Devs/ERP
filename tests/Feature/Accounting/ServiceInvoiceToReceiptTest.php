<?php

use App\Models\User;
use App\Modules\Accounting\Exceptions\PostingConflictException;
use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\FiscalPeriod;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Queries\AccountsReceivableAgingQuery;
use App\Modules\Accounting\Queries\GeneralLedgerQuery;
use App\Modules\Accounting\Queries\TrialBalanceQuery;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Accounting\Services\ReverseJournalEntryAction;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
});

test('service invoice is posted atomically with 10% test tax and balanced double-entry GL', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    $customer = Party::where('tenant_id', $tenantA->id)->firstOrFail();
    $revenueAccount = Account::where('company_id', $companyA->id)->where('code', '4100')->firstOrFail();
    $arAccount = Account::where('company_id', $companyA->id)->where('code', '1200')->firstOrFail();
    $taxAccount = Account::where('company_id', $companyA->id)->where('code', '2150')->firstOrFail();

    $initialArBalance = $arAccount->current_balance;

    $response = $this->actingAs($userA)
        ->post(route('invoices.store'), [
            'party_id' => $customer->id,
            'date' => '2026-03-15',
            'due_date' => '2026-04-15',
            'notes' => 'IT Consulting Services for Q1',
            'lines' => [
                [
                    'description' => 'Enterprise Architecture Consultation',
                    'quantity' => 1,
                    'unit_price' => 1000.00,
                    'revenue_account_id' => $revenueAccount->id,
                ],
            ],
        ]);

    $response->assertRedirect();

    // Verify invoice created
    $invoice = ServiceInvoice::where('party_id', $customer->id)->latest('created_at')->first();
    expect($invoice)->not->toBeNull()
        ->and((float) $invoice->subtotal)->toBe(1000.00)
        ->and((float) $invoice->tax_rate)->toBe(0.10)
        ->and((float) $invoice->tax_amount)->toBe(100.00)
        ->and((float) $invoice->total)->toBe(1100.00)
        ->and((float) $invoice->balance_due)->toBe(1100.00)
        ->and((float) $invoice->amount_paid)->toBe(0.00)
        ->and($invoice->status)->toBe('posted');

    // Verify balanced journal entry
    $journal = $invoice->journalEntry;
    expect($journal)->not->toBeNull()
        ->and($journal->status)->toBe('posted')
        ->and($journal->lines)->toHaveCount(3);

    $totalDebit = $journal->lines->sum('debit');
    $totalCredit = $journal->lines->sum('credit');
    expect((float) $totalDebit)->toBe(1100.00)
        ->and((float) $totalCredit)->toBe(1100.00);

    // Verify AR account increased by 1,100.00
    $arAccount->refresh();
    expect((float) $arAccount->current_balance)->toBe((float) $initialArBalance + 1100.00);
});

test('partial customer receipt decrements invoice balance due and updates status to partially_paid then paid', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    $customer = Party::where('tenant_id', $tenantA->id)->firstOrFail();
    $revenueAccount = Account::where('company_id', $companyA->id)->where('code', '4100')->firstOrFail();
    $bankAccount = Account::where('company_id', $companyA->id)->where('code', '1020')->firstOrFail();
    $arAccount = Account::where('company_id', $companyA->id)->where('code', '1200')->firstOrFail();

    // 1. Create Invoice (1,000 + 100 tax = 1,100)
    $this->actingAs($userA)->post(route('invoices.store'), [
        'party_id' => $customer->id,
        'date' => '2026-03-15',
        'due_date' => '2026-04-15',
        'lines' => [
            [
                'description' => 'Cloud Migration Support',
                'quantity' => 1,
                'unit_price' => 1000.00,
                'revenue_account_id' => $revenueAccount->id,
            ],
        ],
    ]);

    $invoice = ServiceInvoice::where('party_id', $customer->id)->latest('created_at')->first();

    // 2. Partial receipt: 400.00 SAR allocated to invoice
    $responseReceipt1 = $this->actingAs($userA)->post(route('receipts.store'), [
        'party_id' => $customer->id,
        'deposit_account_id' => $bankAccount->id,
        'date' => '2026-03-20',
        'amount' => 400.00,
        'payment_method' => 'bank_transfer',
        'allocations' => [
            [
                'service_invoice_id' => $invoice->id,
                'amount' => 400.00,
            ],
        ],
    ]);

    $responseReceipt1->assertRedirect();

    $invoice->refresh();
    expect((float) $invoice->amount_paid)->toBe(400.00)
        ->and((float) $invoice->balance_due)->toBe(700.00)
        ->and($invoice->status)->toBe('partially_paid');

    // 3. Final receipt: 700.00 SAR paying remaining balance
    $responseReceipt2 = $this->actingAs($userA)->post(route('receipts.store'), [
        'party_id' => $customer->id,
        'deposit_account_id' => $bankAccount->id,
        'date' => '2026-03-25',
        'amount' => 700.00,
        'payment_method' => 'bank_transfer',
        'allocations' => [
            [
                'service_invoice_id' => $invoice->id,
                'amount' => 700.00,
            ],
        ],
    ]);

    $responseReceipt2->assertRedirect();

    $invoice->refresh();
    expect((float) $invoice->amount_paid)->toBe(1100.00)
        ->and((float) $invoice->balance_due)->toBe(0.00)
        ->and($invoice->status)->toBe('paid');
});

test('posting engine enforces double-entry invariant and rejects unbalanced transactions', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentCompany::class)->set($companyA);

    $arAccount = Account::where('company_id', $companyA->id)->where('code', '1200')->firstOrFail();
    $revenueAccount = Account::where('company_id', $companyA->id)->where('code', '4100')->firstOrFail();

    $engine = app(PostingEngine::class);

    // Deliberately unbalanced: Debit 1,000, Credit 950
    expect(function () use ($engine, $arAccount, $revenueAccount) {
        $engine->post([
            'date' => '2026-03-15',
            'description' => 'Unbalanced test entry',
            'lines' => [
                [
                    'account_id' => $arAccount->id,
                    'debit' => 1000.00,
                    'credit' => 0.00,
                    'description' => 'Debit AR',
                ],
                [
                    'account_id' => $revenueAccount->id,
                    'debit' => 0.00,
                    'credit' => 950.00,
                    'description' => 'Credit Revenue',
                ],
            ],
        ]);
    })->toThrow(PostingException::class, 'not balanced');
});

test('posting into a closed fiscal period is rejected', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // Create a closed fiscal period for 2025
    FiscalPeriod::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'name' => 'FY-2025',
        'start_date' => '2025-01-01',
        'end_date' => '2025-12-31',
        'is_locked' => true,
    ]);

    $arAccount = Account::where('company_id', $companyA->id)->where('code', '1200')->firstOrFail();
    $revenueAccount = Account::where('company_id', $companyA->id)->where('code', '4100')->firstOrFail();

    $engine = app(PostingEngine::class);

    expect(function () use ($engine, $arAccount, $revenueAccount) {
        $engine->post([
            'date' => '2025-06-15',
            'description' => 'Backdated entry in closed period',
            'lines' => [
                ['account_id' => $arAccount->id, 'debit' => 500.00, 'credit' => 0.00],
                ['account_id' => $revenueAccount->id, 'debit' => 0.00, 'credit' => 500.00],
            ],
        ]);
    })->toThrow(PostingException::class, 'locked');
});

test('posted journal entry lines cannot be modified or deleted directly', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $arAccount = Account::where('company_id', $companyA->id)->where('code', '1200')->firstOrFail();
    $revenueAccount = Account::where('company_id', $companyA->id)->where('code', '4100')->firstOrFail();

    $engine = app(PostingEngine::class);

    $journal = $engine->post([
        'date' => '2026-03-15',
        'description' => 'Immutability test',
        'lines' => [
            ['account_id' => $arAccount->id, 'debit' => 250.00, 'credit' => 0.00],
            ['account_id' => $revenueAccount->id, 'debit' => 0.00, 'credit' => 250.00],
        ],
    ]);

    $line = $journal->lines->first();

    // Attempting to modify line should throw runtime immutability exception
    expect(function () use ($line) {
        $line->debit = '300.00';
        $line->save();
    })->toThrow(Exception::class, 'Cannot update lines of a posted journal entry');

    // Attempting to delete line should throw runtime immutability exception
    expect(function () use ($line) {
        $line->delete();
    })->toThrow(Exception::class, 'Cannot delete lines of a posted journal entry');
});

test('idempotency key safely replays identical requests and rejects conflicts with 409', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $arAccount = Account::where('company_id', $companyA->id)->where('code', '1200')->firstOrFail();
    $revenueAccount = Account::where('company_id', $companyA->id)->where('code', '4100')->firstOrFail();

    $engine = app(PostingEngine::class);

    $payload = [
        'idempotency_key' => 'tx-invoice-req-9999',
        'date' => '2026-03-15',
        'description' => 'Idempotent billing transaction',
        'lines' => [
            ['account_id' => $arAccount->id, 'debit' => 800.00, 'credit' => 0.00],
            ['account_id' => $revenueAccount->id, 'debit' => 0.00, 'credit' => 800.00],
        ],
    ];

    // First call creates the journal
    $entry1 = $engine->post($payload);
    expect($entry1)->toBeInstanceOf(JournalEntry::class);

    // Second call with IDENTICAL key and payload returns existing journal without creating new lines
    $entry2 = $engine->post($payload);
    expect($entry2->id)->toBe($entry1->id);

    // Third call with SAME key but ALTERED amount must throw PostingConflictException (HTTP 409)
    $alteredPayload = $payload;
    $alteredPayload['lines'][0]['debit'] = 900.00;
    $alteredPayload['lines'][1]['credit'] = 900.00;

    expect(function () use ($engine, $alteredPayload) {
        $engine->post($alteredPayload);
    })->toThrow(PostingConflictException::class);
});

test('reversal action creates compensating entry with opposite debit and credit', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $arAccount = Account::where('company_id', $companyA->id)->where('code', '1200')->firstOrFail();
    $revenueAccount = Account::where('company_id', $companyA->id)->where('code', '4100')->firstOrFail();

    $engine = app(PostingEngine::class);
    $initialBalance = $arAccount->current_balance;

    $originalJournal = $engine->post([
        'date' => '2026-03-15',
        'description' => 'Original transaction to reverse',
        'lines' => [
            ['account_id' => $arAccount->id, 'debit' => 300.00, 'credit' => 0.00],
            ['account_id' => $revenueAccount->id, 'debit' => 0.00, 'credit' => 300.00],
        ],
    ]);

    $arAccount->refresh();
    expect((float) $arAccount->current_balance)->toBe((float) $initialBalance + 300.00);

    // Reverse the journal
    $reversalAction = app(ReverseJournalEntryAction::class);
    $reversalJournal = $reversalAction->execute($originalJournal, 'Customer requested cancellation');

    expect($reversalJournal->reversal_of_id)->toBe($originalJournal->id)
        ->and($reversalJournal->status)->toBe('posted');

    // Verify balance is restored back to initial
    $arAccount->refresh();
    expect((float) $arAccount->current_balance)->toBe((float) $initialBalance);
});

test('trial balance report query confirms mathematical equilibrium', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $tbQuery = app(TrialBalanceQuery::class);
    $result = $tbQuery->execute('2026-12-31');

    expect($result['is_balanced'])->toBeTrue()
        ->and($result['total_debit'])->toBe($result['total_credit']);
});

test('general ledger query returns accurate transaction sequence and running balances', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $arAccount = Account::where('company_id', $companyA->id)->where('code', '1200')->firstOrFail();
    $revenueAccount = Account::where('company_id', $companyA->id)->where('code', '4100')->firstOrFail();

    $engine = app(PostingEngine::class);

    $engine->post([
        'date' => '2026-03-01',
        'description' => 'Invoice 1',
        'lines' => [
            ['account_id' => $arAccount->id, 'debit' => 500.00, 'credit' => 0.00],
            ['account_id' => $revenueAccount->id, 'debit' => 0.00, 'credit' => 500.00],
        ],
    ]);

    $glQuery = app(GeneralLedgerQuery::class);
    $result = $glQuery->execute($arAccount->id, '2026-01-01', '2026-12-31');

    expect($result['lines'])->not->toBeEmpty();
    $lastLine = end($result['lines']);
    expect((float) $lastLine['running_balance'])->toBeGreaterThan(0);
});

test('ar aging query accurately categorizes overdue invoices', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    $customer = Party::where('tenant_id', $tenantA->id)->firstOrFail();
    $revenueAccount = Account::where('company_id', $companyA->id)->where('code', '4100')->firstOrFail();

    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();

    // Create an invoice due today
    $this->actingAs($userA)->post(route('invoices.store'), [
        'party_id' => $customer->id,
        'date' => now()->toDateString(),
        'due_date' => now()->toDateString(),
        'lines' => [
            [
                'description' => 'Immediate Service',
                'quantity' => 1,
                'unit_price' => 500.00,
                'revenue_account_id' => $revenueAccount->id,
            ],
        ],
    ]);

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $agingQuery = app(AccountsReceivableAgingQuery::class);
    $results = $agingQuery->execute(now()->toDateString());

    $customerRow = collect($results)->firstWhere('party_id', $customer->id);
    expect($customerRow)->not->toBeNull()
        ->and((float) $customerRow['total'])->toBe(550.00) // 500 + 10% tax = 550
        ->and((float) $customerRow['current'])->toBe(550.00);
});
