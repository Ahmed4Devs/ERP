<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\BankReconciliation;
use App\Modules\Accounting\Models\BankStatementLine;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
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

test('bank reconciliations index page lists existing statements and bank accounts', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();

    $response = $this->actingAs($user)->get(route('accounting.bank-reconciliation.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Accounting/BankReconciliations/Index')
        ->has('reconciliations')
        ->has('bankAccounts')
        ->has('filters')
    );
});

test('bank reconciliations create page renders postable bank accounts', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();

    $response = $this->actingAs($user)->get(route('accounting.bank-reconciliation.create'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Accounting/BankReconciliations/Create')
        ->has('bankAccounts')
    );
});

test('creating bank reconciliation and auto-matching with GL bank entries achieves zero difference and seals', function () {
    $user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $company = app(CurrentCompany::class)->get();
    $tenant = app(CurrentTenant::class)->get();

    $bankAccount = Account::where('company_id', $company->id)
        ->where(fn ($q) => $q->where('subtype', 'bank')->orWhere('code', '1020'))
        ->firstOrFail();

    $revenueAccount = Account::where('company_id', $company->id)->where('code', '4100')->firstOrFail();
    $expenseAccount = Account::where('company_id', $company->id)->where('code', '5000')->firstOrFail();

    $postingEngine = app(PostingEngine::class);

    // 1. Create a bank deposit in books (DR Bank 1500 / CR Revenue 1500)
    $depositEntry = $postingEngine->post([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'date' => now()->toDateString(),
        'description' => 'Customer Direct Wire Deposit',
        'lines' => [
            ['account_id' => $bankAccount->id, 'debit' => '1500.000000', 'credit' => '0.000000', 'description' => 'Wire deposit in'],
            ['account_id' => $revenueAccount->id, 'debit' => '0.000000', 'credit' => '1500.000000', 'description' => 'Service revenue'],
        ],
    ]);

    // 2. Create a bank withdrawal in books (DR Expense 400 / CR Bank 400)
    $withdrawalEntry = $postingEngine->post([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'date' => now()->toDateString(),
        'description' => 'Monthly Bank Maintenance Fee',
        'lines' => [
            ['account_id' => $expenseAccount->id, 'debit' => '400.000000', 'credit' => '0.000000', 'description' => 'Bank charges'],
            ['account_id' => $bankAccount->id, 'debit' => '0.000000', 'credit' => '400.000000', 'description' => 'Direct debit out'],
        ],
    ]);

    // 3. Create Bank Reconciliation:
    // Opening balance: 10000
    // Deposit: +1500, Withdrawal: -400
    // Expected closing balance = 10000 + 1500 - 400 = 11100
    $recon = BankReconciliation::create([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'bank_account_id' => $bankAccount->id,
        'statement_number' => 'STMT-2026-SEP-001',
        'statement_date' => now()->toDateString(),
        'start_date' => now()->subDays(10)->toDateString(),
        'end_date' => now()->toDateString(),
        'opening_balance' => '10000.000000',
        'closing_balance' => '11100.000000',
        'cleared_balance' => '10000.000000',
        'difference' => '1100.000000',
        'status' => 'draft',
    ]);

    // Create 2 statement lines
    $stmtLine1 = BankStatementLine::create([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'bank_reconciliation_id' => $recon->id,
        'line_date' => now()->toDateString(),
        'description' => 'Deposit Customer Wire',
        'reference_number' => $depositEntry->entry_number,
        'type' => 'deposit',
        'amount' => '1500.000000',
        'is_reconciled' => false,
    ]);

    $stmtLine2 = BankStatementLine::create([
        'tenant_id' => $tenant->id,
        'company_id' => $company->id,
        'bank_reconciliation_id' => $recon->id,
        'line_date' => now()->toDateString(),
        'description' => 'Bank Maintenance Charge',
        'reference_number' => $withdrawalEntry->entry_number,
        'type' => 'withdrawal',
        'amount' => '400.000000',
        'is_reconciled' => false,
    ]);

    // 4. Test workbench show page
    $showResponse = $this->actingAs($user)->get(route('accounting.bank-reconciliation.show', $recon->id));
    $showResponse->assertOk();
    $showResponse->assertInertia(fn ($page) => $page
        ->component('Accounting/BankReconciliations/Show')
        ->has('reconciliation')
        ->has('glTransactions')
    );

    // 5. Test auto-match
    $autoMatchResponse = $this->actingAs($user)->post(route('accounting.bank-reconciliation.auto-match', $recon->id));
    $autoMatchResponse->assertRedirect();

    $stmtLine1->refresh();
    $stmtLine2->refresh();
    $recon->refresh();

    expect($stmtLine1->is_reconciled)->toBeTrue()
        ->and($stmtLine2->is_reconciled)->toBeTrue()
        ->and((float) $recon->cleared_balance)->toBe(11100.0)
        ->and((float) $recon->difference)->toBe(0.0);

    // 6. Test finalize
    $finalizeResponse = $this->actingAs($user)->post(route('accounting.bank-reconciliation.finalize', $recon->id));
    $finalizeResponse->assertRedirect();

    $recon->refresh();
    expect($recon->status)->toBe('reconciled')
        ->and($recon->reconciled_at)->not->toBeNull();

    // 7. Test printable statement
    $printResponse = $this->actingAs($user)->get(route('accounting.bank-reconciliation.print', $recon->id));
    $printResponse->assertOk();
    $printResponse->assertInertia(fn ($page) => $page
        ->component('Accounting/BankReconciliations/Print')
        ->has('reconciliation')
        ->has('company')
        ->has('qrCodeDataUri')
    );
});
