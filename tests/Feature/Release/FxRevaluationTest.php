<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\CurrencyExchangeRate;
use App\Modules\Accounting\Models\FxRevaluation;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\Accounting\Services\FxRevaluationService;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
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
    $this->fxService = app(FxRevaluationService::class);

    // Setup foreign currency bank account (USD)
    $this->usdBank = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '1025'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'USD Bank Account',
            'name_ar' => 'حساب بنكي بالدولار الأمريكي',
            'type' => 'asset',
            'subtype' => 'bank',
            'currency' => 'USD',
            'current_balance' => 10000.00,
            'is_postable' => true,
        ]
    );

    // Historical JV for USD Bank (10,000 USD at rate 3.75 = 37,500 SAR)
    $jv = JournalEntry::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'entry_number' => 'JV-INIT-USD-'.uniqid(),
        'date' => '2026-08-01',
        'description' => 'Initial USD Deposit',
        'status' => 'posted',
    ]);

    JournalEntryLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'journal_entry_id' => $jv->id,
        'account_id' => $this->usdBank->id,
        'debit' => 37500.00,
        'credit' => 0,
        'currency' => 'USD',
        'foreign_amount' => 10000.00,
        'exchange_rate' => 3.750000,
        'description' => 'Initial Deposit in USD',
    ]);

    // Offsetting capital line
    $capital = Account::where('company_id', $this->company->id)->where('code', '3000')->first() ?:
        Account::create([
            'tenant_id' => $this->tenant->id,
            'company_id' => $this->company->id,
            'code' => '3000',
            'name' => 'Capital',
            'type' => 'equity',
            'is_postable' => true,
        ]);

    JournalEntryLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'journal_entry_id' => $jv->id,
        'account_id' => $capital->id,
        'debit' => 0,
        'credit' => 37500.00,
        'description' => 'Capital equity offset',
    ]);
});

test('it records exchange rates and retrieves closing rates accurately', function () {
    $rateRecord = $this->fxService->recordExchangeRate(
        $this->company->id,
        $this->tenant->id,
        'USD',
        3.800000,
        '2026-09-30',
        'central_bank'
    );

    expect($rateRecord)->toBeInstanceOf(CurrencyExchangeRate::class)
        ->and((float) $rateRecord->rate)->toBe(3.800000)
        ->and($rateRecord->from_currency)->toBe('USD');

    $closingRate = $this->fxService->getClosingRate($this->company->id, 'USD', '2026-09-30');
    expect($closingRate)->toBe(3.800000);

    // Default fallback
    $fallbackEur = $this->fxService->getClosingRate($this->company->id, 'EUR', '2026-09-30');
    expect($fallbackEur)->toBe(4.050000);
});

test('it calculates IAS 21 unrealized FX gain when foreign currency asset appreciates', function () {
    // USD rate rises from 3.75 to 3.80
    $this->fxService->recordExchangeRate(
        $this->company->id,
        $this->tenant->id,
        'USD',
        3.800000,
        '2026-09-30'
    );

    $calc = $this->fxService->calculateRevaluation($this->company->id, $this->tenant->id, '2026-09-30');

    expect($calc['lines'])->toHaveCount(1);
    $line = $calc['lines'][0];

    // 10,000 USD * 3.80 = 38,000 SAR (Book was 37,500 SAR) => Gain = +500 SAR
    expect($line['currency'])->toBe('USD')
        ->and((float) $line['foreign_balance'])->toBe(10000.00)
        ->and((float) $line['book_amount_sar'])->toBe(37500.00)
        ->and((float) $line['revalued_amount_sar'])->toBe(38000.00)
        ->and((float) $line['adjustment_amount_sar'])->toBe(500.00)
        ->and($line['gain_loss_type'])->toBe('gain')
        ->and((float) $calc['total_gain'])->toBe(500.00)
        ->and((float) $calc['total_loss'])->toBe(0.00)
        ->and((float) $calc['net_adjustment'])->toBe(500.00);
});

test('it posts automated journal entry for unrealized FX gains/losses', function () {
    $this->fxService->recordExchangeRate(
        $this->company->id,
        $this->tenant->id,
        'USD',
        3.800000,
        '2026-09-30'
    );

    $revaluation = $this->fxService->createAndPostRevaluation(
        $this->company->id,
        $this->tenant->id,
        '2026-09-30',
        $this->user->id,
        'Q3 FX Revaluation'
    );

    expect($revaluation)->toBeInstanceOf(FxRevaluation::class)
        ->and($revaluation->status)->toBe('posted')
        ->and((float) $revaluation->total_gain)->toBe(500.00)
        ->and($revaluation->journal_entry_id)->not->toBeNull();

    $entry = JournalEntry::with('lines.account')->find($revaluation->journal_entry_id);
    expect($entry)->not->toBeNull()
        ->and($entry->lines)->toHaveCount(2);

    // DR Bank USD (1025) 500, CR Unrealized Gain (4400) 500
    $drLine = $entry->lines->firstWhere('debit', '>', 0);
    $crLine = $entry->lines->firstWhere('credit', '>', 0);

    expect((float) $drLine->debit)->toBe(500.00)
        ->and($drLine->account->code)->toBe('1025')
        ->and((float) $crLine->credit)->toBe(500.00)
        ->and($crLine->account->code)->toBe('4400');
});

test('it reverses an FX revaluation entry successfully', function () {
    $this->fxService->recordExchangeRate(
        $this->company->id,
        $this->tenant->id,
        'USD',
        3.800000,
        '2026-09-30'
    );

    $revaluation = $this->fxService->createAndPostRevaluation(
        $this->company->id,
        $this->tenant->id,
        '2026-09-30',
        $this->user->id
    );

    $reversed = $this->fxService->reverseRevaluation($revaluation->id, '2026-10-01');

    expect($reversed->status)->toBe('reversed')
        ->and($reversed->reversal_journal_entry_id)->not->toBeNull();

    $revEntry = JournalEntry::with('lines.account')->find($reversed->reversal_journal_entry_id);
    // Inverse lines: DR Gain (4400) 500, CR Bank USD (1025) 500
    $dr = $revEntry->lines->firstWhere('debit', '>', 0);
    $cr = $revEntry->lines->firstWhere('credit', '>', 0);

    expect((float) $dr->debit)->toBe(500.00)
        ->and($dr->account->code)->toBe('4400')
        ->and((float) $cr->credit)->toBe(500.00)
        ->and($cr->account->code)->toBe('1025');
});

test('it renders FX rates and revaluation pages and accepts web routes', function () {
    // 1. Rates Index
    $this->actingAs($this->user)
        ->get('/accounting/fx-rates')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Accounting/FxRates/Index')
            ->has('rates')
            ->has('latestRates')
        );

    // 2. Post new Rate via web
    $this->actingAs($this->user)
        ->post('/accounting/fx-rates', [
            'from_currency' => 'EUR',
            'rate' => 4.120000,
            'effective_date' => '2026-09-30',
            'source' => 'SAMA API',
        ])
        ->assertRedirect();

    expect(CurrencyExchangeRate::where('from_currency', 'EUR')->where('rate', 4.120000)->exists())->toBeTrue();

    // 3. Revaluations Index
    $this->actingAs($this->user)
        ->get('/accounting/fx-revaluations')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Accounting/FxRevaluations/Index')
            ->has('revaluations')
            ->has('metrics')
        );

    // 4. Create Revaluation preview
    $this->actingAs($this->user)
        ->get('/accounting/fx-revaluations/create?date=2026-09-30')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Accounting/FxRevaluations/Create')
            ->has('preview')
        );

    // 5. Post Revaluation via web
    $response = $this->actingAs($this->user)
        ->post('/accounting/fx-revaluations', [
            'date' => '2026-09-30',
            'notes' => 'Q3 Automated FX Batch',
        ]);

    $response->assertRedirect();
    $reval = FxRevaluation::latest()->firstOrFail();

    // 6. View Revaluation Details
    $this->actingAs($this->user)
        ->get("/accounting/fx-revaluations/{$reval->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Accounting/FxRevaluations/Show')
            ->has('revaluation')
        );
});
