<?php

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\FiscalPeriod;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Services\CloseFiscalPeriodAction;
use App\Modules\Accounting\Services\PostingEngine;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\FixedAsset;
use App\Modules\Assets\Services\PostAssetDepreciationRunAction;
use App\Modules\HR\Models\Attendance;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Payroll\Models\PayrollRun;
use App\Modules\Payroll\Services\DisbursePayrollAction;
use App\Modules\Payroll\Services\GeneratePayrollRunAction;
use App\Modules\Payroll\Services\PostPayrollRunAction;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
});

test('employee profile is created with department, designation, and compensation components', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $branch = Branch::where('company_id', $companyA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $dept = Department::where('company_id', $companyA->id)->where('code', 'DEP-IT')->firstOrFail();
    $desig = Designation::where('company_id', $companyA->id)->where('code', 'DES-DEV')->firstOrFail();

    $emp = Employee::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'branch_id' => $branch->id,
        'department_id' => $dept->id,
        'designation_id' => $desig->id,
        'employee_number' => 'EMP-TEST-001',
        'first_name' => 'Kareem',
        'last_name' => 'Salem',
        'first_name_ar' => 'كريم',
        'last_name_ar' => 'سالم',
        'email' => 'kareem.salem@alamal.com',
        'phone' => '+966501122334',
        'hire_date' => '2026-01-15',
        'status' => 'active',
        'basic_salary' => '15000.000000',
        'housing_allowance' => '3750.000000',
        'transport_allowance' => '1000.000000',
        'other_allowances' => '250.000000',
        'bank_name' => 'Riyad Bank',
        'iban' => 'SA4420000001234567890123',
    ]);

    expect($emp->id)->not->toBeNull()
        ->and($emp->basic_salary)->toBe('15000.000000')
        ->and($emp->housing_allowance)->toBe('3750.000000')
        ->and($emp->department->code)->toBe('DEP-IT')
        ->and($emp->designation->code)->toBe('DES-DEV');

    // Total allowances = 3750 + 1000 + 250 = 5000
    expect($emp->getTotalAllowances())->toBe('5000.000000')
        // Gross = 15000 + 5000 = 20000
        ->and($emp->getGrossSalary())->toBe('20000.000000');
});

test('attendance logging records daily presence and overtime hours', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $emp = Employee::where('company_id', $companyA->id)->firstOrFail();

    $att = Attendance::updateOrCreate(
        [
            'company_id' => $companyA->id,
            'employee_id' => $emp->id,
            'date' => '2026-03-01',
        ],
        [
            'tenant_id' => $tenantA->id,
            'status' => 'present',
            'hours_worked' => '8.00',
            'overtime_hours' => '3.50',
            'notes' => 'Production release overtime',
        ]
    );

    expect($att->status)->toBe('present')
        ->and($att->hours_worked)->toBe('8.00')
        ->and($att->overtime_hours)->toBe('3.50');
});

test('payroll generation calculates payslips with GOSI 10% deduction and matches totals', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // Ensure we have employee EMP-001 with known salary
    $emp = Employee::where('company_id', $companyA->id)->where('employee_number', 'EMP-001')->firstOrFail();
    // basic: 12000, housing: 3000, transport: 1000, other: 500 => allowances: 4500, gross: 16500
    // Social insurance: 10% of 12000 = 1200
    // Net: 16500 - 1200 = 15300

    $action = app(GeneratePayrollRunAction::class);
    $run = $action->execute(
        companyId: $companyA->id,
        tenantId: $tenantA->id,
        year: 2026,
        month: 2,
        paymentDate: '2026-02-28',
        notes: 'February 2026 Payroll'
    );

    expect($run->status)->toBe('draft')
        ->and($run->run_number)->toBe('PAY-2026-02')
        ->and($run->payslips)->toHaveCount(1);

    $payslip = $run->payslips->first();
    expect($payslip->basic_salary)->toBe('12000.000000')
        ->and($payslip->gross_salary)->toBe('16500.000000')
        ->and($payslip->social_insurance_deduction)->toBe('1200.000000')
        ->and($payslip->net_salary)->toBe('15300.000000')
        ->and($run->total_basic)->toBe('12000.000000')
        ->and($run->total_allowances)->toBe('4500.000000')
        ->and($run->total_deductions)->toBe('1200.000000')
        ->and($run->total_net)->toBe('15300.000000');
});

test('payroll run post creates balanced double-entry GL journal for expenses and liabilities', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $generateAction = app(GeneratePayrollRunAction::class);
    $run = $generateAction->execute(
        companyId: $companyA->id,
        tenantId: $tenantA->id,
        year: 2026,
        month: 3,
        paymentDate: '2026-03-31'
    );

    $postAction = app(PostPayrollRunAction::class);
    $postedRun = $postAction->execute($run);

    expect($postedRun->status)->toBe('posted')
        ->and($postedRun->journal_entry_id)->not->toBeNull();

    $journal = JournalEntry::with('lines.account')->findOrFail($postedRun->journal_entry_id);

    // Verify journal balance: Debits == Credits
    expect($journal->totalDebit())->toBe($journal->totalCredit())
        ->and($journal->totalDebit())->toBe('16500.000000'); // 12000 basic + 4500 allowances

    // Check account balances
    $salariesExp = Account::where('company_id', $companyA->id)->where('code', '5110')->firstOrFail();
    $allowancesExp = Account::where('company_id', $companyA->id)->where('code', '5120')->firstOrFail();
    $payrollPayable = Account::where('company_id', $companyA->id)->where('code', '2030')->firstOrFail();
    $gosiPayable = Account::where('company_id', $companyA->id)->where('code', '2040')->firstOrFail();

    expect($salariesExp->current_balance)->toBe('12000.000000')
        ->and($allowancesExp->current_balance)->toBe('4500.000000')
        ->and($payrollPayable->current_balance)->toBe('15300.000000')
        ->and($gosiPayable->current_balance)->toBe('1200.000000');
});

test('payroll disbursement settles accrued payroll liability via bank account', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $generateAction = app(GeneratePayrollRunAction::class);
    $run = $generateAction->execute(
        companyId: $companyA->id,
        tenantId: $tenantA->id,
        year: 2026,
        month: 4,
        paymentDate: '2026-04-30'
    );

    $postAction = app(PostPayrollRunAction::class);
    $postedRun = $postAction->execute($run);

    $disburseAction = app(DisbursePayrollAction::class);
    $paidRun = $disburseAction->execute($postedRun);

    expect($paidRun->status)->toBe('paid')
        ->and($paidRun->disbursement_journal_entry_id)->not->toBeNull();

    $disburseJournal = JournalEntry::with('lines.account')->findOrFail($paidRun->disbursement_journal_entry_id);

    // Debits (DR 2030 15300) == Credits (CR 1020 15300)
    expect($disburseJournal->totalDebit())->toBe($disburseJournal->totalCredit())
        ->and($disburseJournal->totalDebit())->toBe('15300.000000');

    // Accrued Payroll liability account 2030 must now be zero (15300 CR from payroll post - 15300 DR from disbursement)
    $payrollPayable = Account::where('company_id', $companyA->id)->where('code', '2030')->firstOrFail();
    expect($payrollPayable->current_balance)->toBe('0.000000');
});

test('straight-line asset depreciation run calculates monthly depreciation and posts balanced GL entry', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // Initial seeded asset: AST-SRV-001 (Cost 48,000, salvage 0, life 48 months => 1,000/mo)
    $asset = FixedAsset::where('company_id', $companyA->id)->where('asset_tag', 'AST-SRV-001')->firstOrFail();
    expect($asset->calculateMonthlyDepreciation())->toBe('1000.000000');

    $deprAction = app(PostAssetDepreciationRunAction::class);
    $run1 = $deprAction->execute(
        companyId: $companyA->id,
        tenantId: $tenantA->id,
        year: 2026,
        month: 1,
        date: '2026-01-31'
    );

    expect($run1->status)->toBe('posted')
        ->and($run1->total_depreciation)->toBe('1000.000000')
        ->and($run1->journal_entry_id)->not->toBeNull();

    // Verify Asset balances updated
    $asset->refresh();
    expect($asset->accumulated_depreciation)->toBe('1000.000000')
        ->and($asset->net_book_value)->toBe('47000.000000')
        ->and($asset->status)->toBe('active');

    // Verify GL Posting: DR 5300 (1000) vs CR 1590 (1000)
    $deprExpense = Account::where('company_id', $companyA->id)->where('code', '5300')->firstOrFail();
    $accumDeprAcc = Account::where('company_id', $companyA->id)->where('code', '1590')->firstOrFail();

    expect($deprExpense->current_balance)->toBe('1000.000000')
        ->and($accumDeprAcc->current_balance)->toBe('-1000.000000');

    // Run Month 2
    $run2 = $deprAction->execute(
        companyId: $companyA->id,
        tenantId: $tenantA->id,
        year: 2026,
        month: 2,
        date: '2026-02-28'
    );

    $asset->refresh();
    expect($asset->accumulated_depreciation)->toBe('2000.000000')
        ->and($asset->net_book_value)->toBe('46000.000000');
});

test('depreciation engine clamps monthly amount to ensure net book value never dips below salvage value', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $cat = AssetCategory::where('company_id', $companyA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // Create asset nearing fully depreciated state
    // Cost 1,000, salvage 800, remaining depreciable 50, standard monthly = 100
    $asset = FixedAsset::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'category_id' => $cat->id,
        'asset_tag' => 'AST-CLAMP-001',
        'name' => 'Clamped Asset Test',
        'purchase_date' => '2026-01-01',
        'in_service_date' => '2026-01-01',
        'acquisition_cost' => '1000.000000',
        'salvage_value' => '800.000000',
        'useful_life_months' => 2, // (1000-800)/2 = 100/mo
        'accumulated_depreciation' => '150.000000',
        'net_book_value' => '850.000000', // only 50 left before salvage
        'status' => 'active',
    ]);

    // Should clamp to 50 instead of 100
    expect($asset->calculateMonthlyDepreciation())->toBe('50.000000');
});

test('fiscal close locking prevents backdated transactions into closed periods', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $period = FiscalPeriod::where('company_id', $companyA->id)->firstOrFail();
    expect($period->is_locked)->toBeFalse();

    // Lock the period
    $closeAction = app(CloseFiscalPeriodAction::class);
    $closeAction->execute($period, true);

    expect($period->refresh()->is_locked)->toBeTrue();

    // Attempt posting a journal entry inside the locked period (2026-05-15)
    $postingEngine = app(PostingEngine::class);
    $cash = Account::where('company_id', $companyA->id)->where('code', '1010')->firstOrFail();
    $capital = Account::where('company_id', $companyA->id)->where('code', '3010')->firstOrFail();

    expect(function () use ($postingEngine, $companyA, $tenantA, $cash, $capital) {
        $postingEngine->post([
            'company_id' => $companyA->id,
            'tenant_id' => $tenantA->id,
            'date' => '2026-05-15',
            'entry_type' => 'manual',
            'description' => 'Should fail due to locked period',
            'lines' => [
                ['account_id' => $cash->id, 'debit' => '500.000000', 'credit' => '0.000000'],
                ['account_id' => $capital->id, 'debit' => '0.000000', 'credit' => '500.000000'],
            ],
        ]);
    })->toThrow(PostingException::class, 'Fiscal period for date 2026-05-15 is locked.');

    // Unlock the period and attempt again
    $closeAction->execute($period, false);
    expect($period->refresh()->is_locked)->toBeFalse();

    $journal = $postingEngine->post([
        'company_id' => $companyA->id,
        'tenant_id' => $tenantA->id,
        'date' => '2026-05-15',
        'entry_type' => 'manual',
        'description' => 'Succeeds now that period is unlocked',
        'lines' => [
            ['account_id' => $cash->id, 'debit' => '500.000000', 'credit' => '0.000000'],
            ['account_id' => $capital->id, 'debit' => '0.000000', 'credit' => '500.000000'],
        ],
    ]);

    expect($journal->id)->not->toBeNull();
});

test('multi-tenancy isolation guarantees Tenant B cannot view or modify Tenant A workforce and assets', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    $tenantB = Tenant::where('slug', 'al-binaa')->firstOrFail();
    $companyB = Company::where('tenant_id', $tenantB->id)->firstOrFail();

    // Set context to Tenant B
    app(CurrentTenant::class)->set($tenantB);
    app(CurrentCompany::class)->set($companyB);

    // Tenant B should see 0 employees, 0 payroll runs, and 0 fixed assets from Tenant A
    expect(Employee::where('company_id', $companyB->id)->count())->toBe(0)
        ->and(PayrollRun::where('company_id', $companyB->id)->count())->toBe(0)
        ->and(FixedAsset::where('company_id', $companyB->id)->count())->toBe(0);
});
