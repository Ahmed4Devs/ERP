<?php

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Retail\Actions\ClosePosSessionAction;
use App\Modules\Retail\Actions\CompletePosSaleAction;
use App\Modules\Retail\Actions\OpenPosSessionAction;
use App\Modules\Retail\Models\PosSession;
use App\Modules\Retail\Models\PosTerminal;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();

    $this->tenant = Tenant::where('slug', 'al-amal')->firstOrFail();
    $this->company = Company::where('tenant_id', $this->tenant->id)->firstOrFail();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $this->branch = Branch::where('company_id', $this->company->id)->firstOrFail();
    $this->warehouse = Warehouse::where('company_id', $this->company->id)->firstOrFail();

    // Ensure terminal exists and any open session is closed
    $this->terminal = PosTerminal::where('company_id', $this->company->id)->firstOrFail();
    PosSession::where('terminal_id', $this->terminal->id)->update([
        'status' => 'closed',
        'closed_at' => now(),
    ]);

    $this->customer = Party::firstOrCreate(
        ['tenant_id' => $this->tenant->id, 'name' => 'Walk-in Retail Customer'],
        ['type' => 'customer']
    );

    $this->product = Product::where('company_id', $this->company->id)->where('sku', 'LAP-DELL-01')->first()
        ?? Product::where('company_id', $this->company->id)->firstOrFail();

    InventoryLevel::updateOrCreate(
        [
            'tenant_id' => $this->tenant->id,
            'company_id' => $this->company->id,
            'warehouse_id' => $this->terminal->warehouse_id,
            'product_id' => $this->product->id,
        ],
        ['quantity_on_hand' => '100.000000']
    );
});

test('it opens a pos session, processes cash and card sales, and calculates live X-Report accurately', function () {
    $openAction = app(OpenPosSessionAction::class);
    $session = $openAction->execute([
        'terminal_id' => $this->terminal->id,
        'opening_cash' => '500.000000',
        'user_id' => $this->user->id,
        'notes' => 'Morning Shift with Float',
    ]);

    expect($session->status)->toBe('open')
        ->and((float) $session->opening_cash)->toBe(500.0)
        ->and((float) $session->expected_cash)->toBe(500.0);

    $saleAction = app(CompletePosSaleAction::class);

    // 1. Cash Sale: 100 SAR base + 10 SAR VAT = 110 SAR
    $cashOrder = $saleAction->execute([
        'session_id' => $session->id,
        'customer_id' => $this->customer->id,
        'payment_method' => 'cash',
        'cash_tendered' => '150.000000',
        'items' => [
            [
                'product_id' => $this->product->id,
                'quantity' => '1.000000',
                'unit_price' => '100.000000',
                'description' => 'Retail Item 1',
            ],
        ],
    ]);

    // 2. Card Sale (Mada): 200 SAR base + 20 SAR VAT = 220 SAR
    $cardOrder = $saleAction->execute([
        'session_id' => $session->id,
        'customer_id' => $this->customer->id,
        'payment_method' => 'card',
        'items' => [
            [
                'product_id' => $this->product->id,
                'quantity' => '2.000000',
                'unit_price' => '100.000000',
                'description' => 'Retail Item 2',
            ],
        ],
    ]);

    $session->refresh();
    // Expected cash in drawer = 500 opening + 110 cash sale = 610 SAR
    expect((float) $session->expected_cash)->toBe(610.0);

    // Call mid-shift X-Report JSON endpoint
    $response = $this->actingAs($this->user)
        ->getJson(route('retail.sessions.x-report', $session->id));

    $response->assertOk()
        ->assertJson([
            'report_type' => 'X',
            'sales' => [
                'orders_count' => 2,
                'net_sales' => 300.0,
                'tax_amount' => 30.0,
                'total_amount' => 330.0,
            ],
            'payments' => [
                'cash_sales' => 110.0,
                'card_sales' => 220.0,
                'total_collected' => 330.0,
            ],
            'drawer' => [
                'opening_float' => 500.0,
                'cash_sales' => 110.0,
                'expected_cash' => 610.0,
            ],
        ]);

    // Ensure session remains open
    expect($session->fresh()->status)->toBe('open');
});

test('it reconciles pos session with cash shortage and automatically posts GL adjustment to expense account 5350', function () {
    $openAction = app(OpenPosSessionAction::class);
    $session = $openAction->execute([
        'terminal_id' => $this->terminal->id,
        'opening_cash' => '1000.000000',
        'user_id' => $this->user->id,
    ]);

    $saleAction = app(CompletePosSaleAction::class);
    $saleAction->execute([
        'session_id' => $session->id,
        'customer_id' => $this->customer->id,
        'payment_method' => 'cash',
        'cash_tendered' => '500.000000',
        'items' => [
            [
                'product_id' => $this->product->id,
                'quantity' => '1.000000',
                'unit_price' => '200.000000',
            ],
        ],
    ]);

    // Expected cash: 1000 + 220 = 1220 SAR
    // Counted physical cash: 1180 SAR (Shortage of 40 SAR)
    $closeAction = app(ClosePosSessionAction::class);
    $closedSession = $closeAction->execute([
        'session_id' => $session->id,
        'closing_cash' => '1180.000000',
        'notes' => 'Shortage of 40 SAR due to change miscalculation',
    ]);

    expect($closedSession->status)->toBe('closed')
        ->and($closedSession->z_report_number)->toContain('Z-')
        ->and($closedSession->z_report_sequence)->toBeGreaterThanOrEqual(1)
        ->and((float) $closedSession->expected_cash)->toBe(1220.0)
        ->and((float) $closedSession->closing_cash)->toBe(1180.0)
        ->and((float) $closedSession->cash_difference)->toBe(-40.0)
        ->and($closedSession->difference_journal_entry_id)->not->toBeNull();

    // Verify GL Journal Entry for cash shortage
    $journal = JournalEntry::with('lines.account')->findOrFail($closedSession->difference_journal_entry_id);
    expect($journal->source_type)->toBe('pos_session_reconciliation')
        ->and($journal->source_id)->toBe($closedSession->id);

    $debitLine = $journal->lines->where('debit', '>', 0)->first();
    $creditLine = $journal->lines->where('credit', '>', 0)->first();

    expect($debitLine)->not->toBeNull()
        ->and($debitLine->account->code)->toBe('5350')
        ->and((float) $debitLine->debit)->toBe(40.0);

    expect($creditLine)->not->toBeNull()
        ->and((float) $creditLine->credit)->toBe(40.0)
        ->and($creditLine->account_id)->toBe($this->terminal->cash_account_id);
});

test('it reconciles pos session with cash surplus and automatically posts GL adjustment to revenue account 4350', function () {
    $openAction = app(OpenPosSessionAction::class);
    $session = $openAction->execute([
        'terminal_id' => $this->terminal->id,
        'opening_cash' => '500.000000',
        'user_id' => $this->user->id,
    ]);

    // Expected cash: 500 SAR
    // Counted physical cash: 525 SAR (Surplus of 25 SAR)
    $closeAction = app(ClosePosSessionAction::class);
    $closedSession = $closeAction->execute([
        'session_id' => $session->id,
        'closing_cash' => '525.000000',
        'notes' => 'Unclaimed customer change found',
    ]);

    expect($closedSession->status)->toBe('closed')
        ->and((float) $closedSession->cash_difference)->toBe(25.0)
        ->and($closedSession->difference_journal_entry_id)->not->toBeNull();

    // Verify GL Journal Entry for cash surplus
    $journal = JournalEntry::with('lines.account')->findOrFail($closedSession->difference_journal_entry_id);

    $debitLine = $journal->lines->where('debit', '>', 0)->first();
    $creditLine = $journal->lines->where('credit', '>', 0)->first();

    // DR Cash Drawer / CR Surplus Revenue 4350
    expect($debitLine->account_id)->toBe($this->terminal->cash_account_id)
        ->and((float) $debitLine->debit)->toBe(25.0);

    expect($creditLine->account->code)->toBe('4350')
        ->and((float) $creditLine->credit)->toBe(25.0);
});

test('it renders the fiscal Z-Report printable view and responds with full thermal payload', function () {
    $openAction = app(OpenPosSessionAction::class);
    $session = $openAction->execute([
        'terminal_id' => $this->terminal->id,
        'opening_cash' => '300.000000',
        'user_id' => $this->user->id,
    ]);

    $closeAction = app(ClosePosSessionAction::class);
    $closedSession = $closeAction->execute([
        'session_id' => $session->id,
        'closing_cash' => '300.000000',
    ]);

    // 1. Inertia HTML response for printable view
    $htmlResponse = $this->actingAs($this->user)
        ->get(route('retail.sessions.z-report', $closedSession->id));

    $htmlResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Retail/Sessions/ZReportPrint')
            ->has('report.report_number')
            ->has('report.company')
            ->has('report.sales')
            ->has('report.payments')
            ->has('report.drawer')
        );

    // 2. JSON API response
    $jsonResponse = $this->actingAs($this->user)
        ->getJson(route('retail.sessions.z-report', $closedSession->id));

    $jsonResponse->assertOk()
        ->assertJson([
            'report_type' => 'Z',
            'company' => [
                'name' => $this->company->legal_name ?: $this->company->name,
            ],
            'drawer' => [
                'status' => 'balanced',
            ],
        ]);
});
