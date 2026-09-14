<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Trade\Models\CommissionPlan;
use App\Modules\Trade\Models\SalesCommissionRun;
use App\Modules\Trade\Models\SalesRepresentative;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Carbon\Carbon;
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

    // Ensure Accounts
    $this->bankAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '1020'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Main Corporate Bank Account',
            'name_ar' => 'الحساب البنكي الرئيسي',
            'type' => 'asset',
            'subtype' => 'bank',
            'currency' => 'SAR',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '500000.000000',
        ]
    );

    $this->expenseAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '5130'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Sales Commissions & Distribution Expense',
            'name_ar' => 'مصروف عمولات البيع والتوزيع',
            'type' => 'expense',
            'subtype' => 'operating_expense',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '0.000000',
        ]
    );

    $this->liabilityAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '2040'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Accrued Sales Commissions Payable',
            'name_ar' => 'مستحقات عمولات البيع والتسويق',
            'type' => 'liability',
            'subtype' => 'current_liability',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '0.000000',
        ]
    );

    // Create Commission Plan with Tiers:
    // 0 to 50k @ 2.0%
    // 50k to 100k @ 3.5%
    // 100k+ @ 5.0%
    // Target bonus: 1.0% if target reached
    $this->plan = CommissionPlan::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'code' => 'PLAN-TIERED-01',
        'name' => 'Tiered Wholesale Plan',
        'name_ar' => 'خطة عمولات الجملة المتدرجة',
        'basis' => 'invoiced_sales',
        'tiers' => [
            ['min' => 0, 'max' => 50000, 'rate' => 2.0],
            ['min' => 50000, 'max' => 100000, 'rate' => 3.5],
            ['min' => 100000, 'max' => null, 'rate' => 5.0],
        ],
        'target_bonus_rate' => '1.0',
        'is_active' => true,
    ]);

    // Create Sales Representative with 70,000 SAR monthly target
    $this->rep = SalesRepresentative::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'commission_plan_id' => $this->plan->id,
        'code' => 'REP-001',
        'name' => 'Khaled Al-Mansoor',
        'name_ar' => 'خالد المنصور',
        'phone' => '0555123456',
        'email' => 'khaled@example.com',
        'monthly_target' => '70000.00',
        'is_active' => true,
    ]);

    // Create Customer assigned to this rep
    $this->customer = Party::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Al-Noor Trading Est',
        'name_ar' => 'مؤسسة النور للتجارة',
        'type' => 'customer',
        'sales_rep_id' => $this->rep->id,
    ]);
});

test('calculates accurate tiered commissions with target bonus', function () {
    // 1. Sales: 40,000 SAR (In tier 1: 40k * 2% = 800 SAR, no bonus)
    $calc1 = $this->plan->calculateForAmount(40000, 70000);
    expect($calc1['commission_amount'])->toBe(800.0)
        ->and($calc1['bonus_amount'])->toBe(0.0)
        ->and($calc1['total_commission'])->toBe(800.0);

    // 2. Sales: 80,000 SAR (Target 70,000 exceeded!)
    // Tier 1: 50,000 * 2% = 1,000 SAR
    // Tier 2: 30,000 * 3.5% = 1,050 SAR
    // Base Commission = 2,050 SAR
    // Target Bonus: 80,000 * 1% = 800 SAR
    // Grand Total = 2,850 SAR
    $calc2 = $this->plan->calculateForAmount(80000, 70000);
    expect($calc2['commission_amount'])->toBe(2050.0)
        ->and($calc2['bonus_amount'])->toBe(800.0)
        ->and($calc2['total_commission'])->toBe(2850.0);

    // 3. Sales: 120,000 SAR
    // Tier 1: 50,000 * 2% = 1,000 SAR
    // Tier 2: 50,000 * 3.5% = 1,750 SAR
    // Tier 3: 20,000 * 5% = 1,000 SAR
    // Base = 3,750 SAR
    // Bonus: 120,000 * 1% = 1,200 SAR
    // Total = 4,950 SAR
    $calc3 = $this->plan->calculateForAmount(120000, 70000);
    expect($calc3['commission_amount'])->toBe(3750.0)
        ->and($calc3['bonus_amount'])->toBe(1200.0)
        ->and($calc3['total_commission'])->toBe(4950.0);
});

test('runs full commission workflow: preview, store draft, and post GL entries', function () {
    $periodStart = Carbon::now()->startOfMonth()->toDateString();
    $periodEnd = Carbon::now()->endOfMonth()->toDateString();

    // Create 2 posted invoices belonging to this rep totaling 80,000 SAR
    ServiceInvoice::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'party_id' => $this->customer->id,
        'sales_rep_id' => $this->rep->id,
        'invoice_number' => 'INV-TEST-001',
        'date' => Carbon::now()->toDateString(),
        'due_date' => Carbon::now()->addDays(30)->toDateString(),
        'status' => 'posted',
        'subtotal' => '43478.26',
        'tax_amount' => '6521.74',
        'total' => '50000.00',
    ]);

    ServiceInvoice::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'party_id' => $this->customer->id,
        'sales_rep_id' => $this->rep->id,
        'invoice_number' => 'INV-TEST-002',
        'date' => Carbon::now()->toDateString(),
        'due_date' => Carbon::now()->addDays(30)->toDateString(),
        'status' => 'posted',
        'subtotal' => '26086.96',
        'tax_amount' => '3913.04',
        'total' => '30000.00',
    ]);

    // 1. Preview API
    $previewResponse = $this->actingAs($this->user)
        ->postJson(route('trade.commissions.preview'), [
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'basis' => 'invoiced_sales',
        ]);

    $previewResponse->assertOk()
        ->assertJsonStructure([
            'period_start',
            'period_end',
            'basis',
            'total_eligible_sales',
            'total_commission_amount',
            'total_bonus_amount',
            'total_net_payable',
            'lines',
        ]);

    $previewData = $previewResponse->json();
    expect((float) $previewData['total_eligible_sales'])->toBe(80000.0)
        ->and((float) $previewData['total_commission_amount'])->toBe(2050.0)
        ->and((float) $previewData['total_bonus_amount'])->toBe(800.0)
        ->and((float) $previewData['total_net_payable'])->toBe(2850.0);

    // 2. Store Commission Run Draft
    $storeResponse = $this->actingAs($this->user)
        ->post(route('trade.commissions.store'), [
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'basis' => 'invoiced_sales',
            'notes' => 'Monthly commission calculation run for Q3.',
        ]);

    $run = SalesCommissionRun::where('company_id', $this->company->id)->latest()->firstOrFail();
    $storeResponse->assertRedirect(route('trade.commissions.show', $run->id));

    expect($run->status)->toBe('draft')
        ->and((float) $run->total_eligible_sales)->toBe(80000.0)
        ->and((float) $run->total_net_payable)->toBe(2850.0);

    // 3. Settle and Post to General Ledger
    $settleResponse = $this->actingAs($this->user)
        ->post(route('trade.commissions.settle', $run->id), [
            'disburse_from_bank' => true,
        ]);

    $settleResponse->assertRedirect(route('trade.commissions.show', $run->id));

    $run->refresh();
    expect($run->status)->toBe('settled')
        ->and($run->settled_at)->not->toBeNull()
        ->and($run->journal_entry_id)->not->toBeNull()
        ->and($run->payment_journal_id)->not->toBeNull();

    // Verify Accrual Journal Entry:
    // DR 5130 (Sales Commission Expense): 2,850 SAR
    // CR 2040 (Accrued Sales Commission): 2,850 SAR
    $accrualJournal = JournalEntry::with('lines.account')->findOrFail($run->journal_entry_id);
    expect($accrualJournal->status)->toBe('posted')
        ->and((float) $accrualJournal->lines->sum('debit'))->toBe(2850.0)
        ->and((float) $accrualJournal->lines->sum('credit'))->toBe(2850.0);

    $expenseLine = $accrualJournal->lines->firstWhere('account_id', $this->expenseAccount->id);
    expect($expenseLine)->not->toBeNull()
        ->and((float) $expenseLine->debit)->toBe(2850.0);

    // Verify Payment Journal Entry:
    // DR 2040 (Accrued Sales Commission): 2,850 SAR
    // CR 1020 (Corporate Bank Account): 2,850 SAR
    $paymentJournal = JournalEntry::with('lines.account')->findOrFail($run->payment_journal_id);
    expect($paymentJournal->status)->toBe('posted')
        ->and((float) $paymentJournal->lines->sum('debit'))->toBe(2850.0)
        ->and((float) $paymentJournal->lines->sum('credit'))->toBe(2850.0);

    $bankLine = $paymentJournal->lines->firstWhere('account_id', $this->bankAccount->id);
    expect($bankLine)->not->toBeNull()
        ->and((float) $bankLine->credit)->toBe(2850.0);

    // 4. Test Printable Rep Statement
    $line = $run->lines->firstOrFail();
    $printResponse = $this->actingAs($this->user)
        ->get(route('trade.commissions.print-statement', [$run->id, $line->id]));

    $printResponse->assertOk();
});
