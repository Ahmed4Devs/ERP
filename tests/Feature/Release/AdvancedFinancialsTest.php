<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\FiscalPeriod;
use App\Modules\Accounting\Models\FiscalYearClosing;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Queries\CashFlowStatementQuery;
use App\Modules\Accounting\Services\FiscalYearClosingService;
use App\Modules\Accounting\Services\PostingEngine;
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

    $this->postingEngine = app(PostingEngine::class);
    $this->cashFlowQuery = app(CashFlowStatementQuery::class);
    $this->closingService = app(FiscalYearClosingService::class);

    $this->withoutVite();
});

test('it calculates IAS 7 Cash Flow Statement accurately with operating, investing, and financing reconciliation', function () {
    // 1. Post a cash sale entry in 2026: Cash 1010 DR 50,000, Revenue 4100 CR 50,000
    $cashAccount = Account::where('company_id', $this->company->id)->where('code', '1010')->first();
    $revenueAccount = Account::where('company_id', $this->company->id)->where('code', '4100')->first();

    $this->postingEngine->post([
        'date' => '2026-06-01',
        'entry_type' => 'manual',
        'description' => 'Cash sale',
        'lines' => [
            ['account_id' => $cashAccount->id, 'debit' => 50000.00, 'credit' => 0.0],
            ['account_id' => $revenueAccount->id, 'debit' => 0.0, 'credit' => 50000.00],
        ],
    ]);

    // 2. Post an operating expense paid in cash: Rent Expense 5100 DR 10,000, Cash 1010 CR 10,000
    $expenseAccount = Account::where('company_id', $this->company->id)->where('code', '5100')->first();

    $this->postingEngine->post([
        'date' => '2026-06-15',
        'entry_type' => 'manual',
        'description' => 'Rent expense',
        'lines' => [
            ['account_id' => $expenseAccount->id, 'debit' => 10000.00, 'credit' => 0.0],
            ['account_id' => $cashAccount->id, 'debit' => 0.0, 'credit' => 10000.00],
        ],
    ]);

    // 3. Post a CapEx Fixed Asset purchase: Equipment 1500 DR 15,000, Cash 1010 CR 15,000
    $equipmentAccount = Account::where('company_id', $this->company->id)->where('code', '1500')->first();

    $this->postingEngine->post([
        'date' => '2026-07-01',
        'entry_type' => 'manual',
        'description' => 'Equipment purchase',
        'lines' => [
            ['account_id' => $equipmentAccount->id, 'debit' => 15000.00, 'credit' => 0.0],
            ['account_id' => $cashAccount->id, 'debit' => 0.0, 'credit' => 15000.00],
        ],
    ]);

    // Execute Cash Flow Statement for 2026
    $cf = $this->cashFlowQuery->execute('2026-01-01', '2026-12-31');

    // Net income = 50,000 - 10,000 = 40,000
    expect((float) $cf['operating_activities']['net_income'])->toBe(40000.00);

    // Investing activities = -15,000 (Purchase of Equipment)
    expect((float) $cf['investing_activities']['total_investing'])->toBe(-15000.00);

    // Net change in cash = 40,000 (Operating) - 15,000 (Investing) = 25,000
    expect((float) $cf['net_change_in_cash'])->toBe(25000.00);

    // Ending cash must equal beginning cash + net change
    expect((float) $cf['ending_cash'])->toBe((float) ($cf['beginning_cash'] + $cf['net_change_in_cash']));
});

test('it executes fiscal year-end closing, zeros P&L accounts, and posts to Retained Earnings 3200', function () {
    $revenueAccount = Account::where('company_id', $this->company->id)->where('code', '4100')->first();
    $expenseAccount = Account::where('company_id', $this->company->id)->where('code', '5100')->first();
    $cashAccount = Account::where('company_id', $this->company->id)->where('code', '1010')->first();

    // Create 2025 revenue: 100,000 and expense: 40,000 -> Net profit = 60,000
    $this->postingEngine->post([
        'date' => '2025-05-10',
        'entry_type' => 'manual',
        'description' => '2025 Revenue',
        'lines' => [
            ['account_id' => $cashAccount->id, 'debit' => 100000.00, 'credit' => 0.0],
            ['account_id' => $revenueAccount->id, 'debit' => 0.0, 'credit' => 100000.00],
        ],
    ]);

    $this->postingEngine->post([
        'date' => '2025-08-20',
        'entry_type' => 'manual',
        'description' => '2025 Expenses',
        'lines' => [
            ['account_id' => $expenseAccount->id, 'debit' => 40000.00, 'credit' => 0.0],
            ['account_id' => $cashAccount->id, 'debit' => 0.0, 'credit' => 40000.00],
        ],
    ]);

    // Ensure 2025 fiscal period exists
    $period = FiscalPeriod::firstOrCreate(
        ['company_id' => $this->company->id, 'name' => 'December 2025'],
        [
            'tenant_id' => $this->tenant->id,
            'start_date' => '2025-12-01',
            'end_date' => '2025-12-31',
            'is_locked' => false,
        ]
    );

    // 1. Preview Closing
    $preview = $this->closingService->previewClosing(2025);
    expect($preview['total_revenue'])->toBe(100000.00)
        ->and($preview['total_expenses'])->toBe(40000.00)
        ->and($preview['net_profit_loss'])->toBe(60000.00);

    // 2. Execute Year-End Closing
    $closing = $this->closingService->closeYear(2025, 'Audited annual closing 2025');

    expect($closing)->toBeInstanceOf(FiscalYearClosing::class)
        ->and($closing->status)->toBe('closed')
        ->and($closing->fiscal_year)->toBe(2025)
        ->and($closing->journal_entry_id)->not->toBeNull()
        ->and((float) $closing->net_profit_loss)->toBe(60000.00);

    // 3. Inspect the Closing Journal Entry
    $entry = JournalEntry::with('lines.account')->find($closing->journal_entry_id);
    expect($entry)->not->toBeNull();

    // Must debit Revenue 4100 by 100,000 (to zero it out)
    $revLine = $entry->lines->firstWhere('account_id', $revenueAccount->id);
    expect((float) $revLine->debit)->toBe(100000.00)
        ->and((float) $revLine->credit)->toBe(0.00);

    // Must credit Expense 5100 by 40,000 (to zero it out)
    $expLine = $entry->lines->firstWhere('account_id', $expenseAccount->id);
    expect((float) $expLine->debit)->toBe(0.00)
        ->and((float) $expLine->credit)->toBe(40000.00);

    // Must credit Retained Earnings 3200 by 60,000
    $retainedLine = $entry->lines->firstWhere('account_id', $closing->retained_earnings_account_id);
    expect((float) $retainedLine->credit)->toBe(60000.00)
        ->and($retainedLine->account->code)->toBe('3200');

    // 4. Verify fiscal period is now locked
    $period->refresh();
    expect($period->is_locked)->toBeTrue();

    // 5. Test Reopen
    $reopened = $this->closingService->reopenYear($closing);
    expect($reopened->status)->toBe('reopened');

    $period->refresh();
    expect($period->is_locked)->toBeFalse();
});

test('it verifies HTTP endpoints for cash flow and year-end closing', function () {
    $this->actingAs($this->user);

    // Cash flow report view
    $response = $this->get('/reports/cash-flow');
    $response->assertOk();

    // Cash flow report CSV export
    $response = $this->get('/reports/cash-flow/export');
    $response->assertOk();

    // Year-end closing index
    $response = $this->get('/accounting/year-end-closing');
    $response->assertOk();

    // Year-end closing create preview
    $response = $this->get('/accounting/year-end-closing/create?year=2025');
    $response->assertOk();
});
