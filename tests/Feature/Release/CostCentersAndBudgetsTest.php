<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\Budget;
use App\Modules\Accounting\Models\BudgetLine;
use App\Modules\Accounting\Models\CostCenter;
use App\Modules\Accounting\Models\FiscalPeriod;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\Accounting\Services\BudgetVarianceService;
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

    // Ensure expense and bank accounts exist
    $this->expenseAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '5100'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'IT & Software Expenses',
            'name_ar' => 'مصاريف البرمجيات والتقنية',
            'type' => 'expense',
            'subtype' => 'operating_expense',
        ]
    );

    $this->bankAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '1020'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Al-Rajhi Bank',
            'name_ar' => 'بنك الراجحي',
            'type' => 'asset',
            'subtype' => 'bank',
        ]
    );

    $this->period = FiscalPeriod::firstOrCreate(
        ['company_id' => $this->company->id, 'name' => 'September 2026'],
        [
            'tenant_id' => $this->tenant->id,
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'is_locked' => false,
        ]
    );

    $this->varianceService = app(BudgetVarianceService::class);
});

test('hierarchical cost centers creation and tree relationship', function () {
    $parent = CostCenter::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'code' => 'CC-OPS',
        'name' => 'Operations Department',
        'name_ar' => 'إدارة العمليات',
        'type' => 'department',
    ]);

    $child = CostCenter::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'parent_id' => $parent->id,
        'code' => 'CC-OPS-TECH',
        'name' => 'Technical Support Unit',
        'name_ar' => 'وحدة الدعم الفني',
        'type' => 'operational',
    ]);

    expect($child->parent->id)->toBe($parent->id)
        ->and($parent->children)->toHaveCount(1)
        ->and($parent->children->first()->id)->toBe($child->id);
});

test('budget creation, actual journal posting, and variance calculation', function () {
    $costCenter = CostCenter::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'code' => 'CC-DIGITAL',
        'name' => 'Digital Transformation',
        'type' => 'project',
    ]);

    // Create a Budget of 50,000 SAR for IT Expenses
    $budget = Budget::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'cost_center_id' => $costCenter->id,
        'name' => 'موازنة التقنية 2026',
        'fiscal_year' => 2026,
        'status' => 'draft',
    ]);

    $line = BudgetLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'budget_id' => $budget->id,
        'account_id' => $this->expenseAccount->id,
        'cost_center_id' => $costCenter->id,
        'period_month' => 0, // Full Year
        'planned_amount' => 50000,
    ]);

    // Post an actual journal entry of 30,000 SAR on this account and cost center
    $entry = JournalEntry::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'entry_number' => 'JV-BUDGET-ACTUAL-01',
        'date' => '2026-09-10',
        'description' => 'Test Actual Expenses for Budget',
        'status' => 'posted',
    ]);

    JournalEntryLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'journal_entry_id' => $entry->id,
        'account_id' => $this->expenseAccount->id,
        'cost_center_id' => $costCenter->id,
        'debit' => 30000,
        'credit' => 0,
        'description' => 'Server license payment',
    ]);

    JournalEntryLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'journal_entry_id' => $entry->id,
        'account_id' => $this->bankAccount->id,
        'debit' => 0,
        'credit' => 30000,
        'description' => 'Payment from bank',
    ]);

    // Calculate Variance
    $result = $this->varianceService->calculateVariance($budget->id);

    expect($result['summary']['total_planned'])->toBe(50000.0)
        ->and($result['summary']['total_actual'])->toBe(30000.0)
        ->and($result['summary']['total_variance'])->toBe(20000.0) // 20,000 remaining
        ->and($result['summary']['overall_utilization_percent'])->toBe(60.0)
        ->and($result['summary']['over_budget_lines_count'])->toBe(0)
        ->and($result['lines'][0]['is_over_budget'])->toBeFalse();
});

test('HTTP endpoints for cost centers and budgets operate with valid responses', function () {
    // 1. Cost Centers Index
    $this->actingAs($this->user)
        ->get(route('accounting.cost-centers.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Accounting/CostCenters/Index')
            ->has('costCenters')
            ->has('metrics')
        );

    // 2. Store Cost Center via HTTP
    $response = $this->actingAs($this->user)->post(route('accounting.cost-centers.store'), [
        'code' => 'CC-HTTP-01',
        'name' => 'Marketing Department',
        'name_ar' => 'إدارة التسويق',
        'type' => 'department',
    ]);

    $response->assertRedirect(route('accounting.cost-centers.index'));
    $center = CostCenter::where('code', 'CC-HTTP-01')->firstOrFail();
    expect($center->name)->toBe('Marketing Department');

    // 3. Budgets Index
    $this->actingAs($this->user)
        ->get(route('accounting.budgets.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Accounting/Budgets/Index')
            ->has('budgets')
            ->has('metrics')
        );

    // 4. Budgets Create Page
    $this->actingAs($this->user)
        ->get(route('accounting.budgets.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Accounting/Budgets/Create')
            ->has('accounts')
            ->has('costCenters')
        );

    // 5. Store Budget via HTTP
    $budgetResponse = $this->actingAs($this->user)->post(route('accounting.budgets.store'), [
        'name' => 'موازنة التسويق 2026',
        'fiscal_year' => 2026,
        'cost_center_id' => $center->id,
        'lines' => [
            [
                'account_id' => $this->expenseAccount->id,
                'cost_center_id' => $center->id,
                'period_month' => 0,
                'planned_amount' => 80000,
                'notes' => 'Digital ad spend',
            ],
        ],
    ]);

    $budget = Budget::where('name', 'موازنة التسويق 2026')->firstOrFail();
    $budgetResponse->assertRedirect(route('accounting.budgets.show', $budget->id));

    // 6. Show Budget & Variance
    $this->actingAs($this->user)
        ->get(route('accounting.budgets.show', $budget->id))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Accounting/Budgets/Show')
            ->where('budget.name', 'موازنة التسويق 2026')
            ->has('summary')
            ->has('lines')
        );

    // 7. Approve Budget
    $this->actingAs($this->user)
        ->post(route('accounting.budgets.approve', $budget->id))
        ->assertRedirect();

    $budget->refresh();
    expect($budget->status)->toBe('approved');
});
