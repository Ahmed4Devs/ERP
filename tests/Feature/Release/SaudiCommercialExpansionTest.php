<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Services\SaudiEosbCalculatorService;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
    $this->tenant = Tenant::where('slug', 'al-amal')->first();
    $this->company = Company::where('tenant_id', $this->tenant->id)->first();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $this->branch = Branch::where('company_id', $this->company->id)->first();
});

test('saudi labor law end of service gratuity engine calculates articles 84 and 85 accurately and posts gl provision accruals', function () {
    $dept = Department::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'TECH'],
        ['tenant_id' => $this->tenant->id, 'name' => 'Technology']
    );
    $desig = Designation::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'DEV'],
        ['tenant_id' => $this->tenant->id, 'title' => 'Software Engineer']
    );

    // 1. Employee with 3.0 years service: Basic 10,000 + Housing 2,500 = 12,500 SAR
    // Under Art 84: 3.0 * (12,500 / 2) = 18,750 SAR full gratuity
    // Under Art 85 (Resignation between 2 and 5 yrs): 1/3 of 18,750 = 6,250 SAR
    $hireDate3Years = Carbon::now()->subYears(3)->toDateString();
    $emp3Yrs = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'department_id' => $dept->id,
        'designation_id' => $desig->id,
        'employee_number' => 'EMP-EOSB-3YR',
        'first_name' => 'Fahad',
        'last_name' => 'Al-Otaibi',
        'hire_date' => $hireDate3Years,
        'status' => 'active',
        'basic_salary' => 10000.00,
        'housing_allowance' => 2500.00,
    ]);

    // 2. Employee with 7.0 years service: Basic 20,000 + Housing 5,000 = 25,000 SAR
    // Under Art 84: (5.0 * 12,500) + (2.0 * 25,000) = 62,500 + 50,000 = 112,500 SAR
    // Under Art 85 (Resignation between 5 and 10 yrs): 2/3 of 112,500 = 75,000 SAR
    $hireDate7Years = Carbon::now()->subYears(7)->toDateString();
    $emp7Yrs = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'department_id' => $dept->id,
        'designation_id' => $desig->id,
        'employee_number' => 'EMP-EOSB-7YR',
        'first_name' => 'Saad',
        'last_name' => 'Al-Harbi',
        'hire_date' => $hireDate7Years,
        'status' => 'active',
        'basic_salary' => 20000.00,
        'housing_allowance' => 5000.00,
    ]);

    // 3. Employee with 12.0 years service: Basic 30,000 + Housing 6,000 = 36,000 SAR
    // Under Art 84: (5.0 * 18,000) + (7.0 * 36,000) = 90,000 + 252,000 = 342,000 SAR
    // Under Art 85 (Resignation >= 10 yrs): 100% = 342,000 SAR
    $hireDate12Years = Carbon::now()->subYears(12)->toDateString();
    $emp12Yrs = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'department_id' => $dept->id,
        'designation_id' => $desig->id,
        'employee_number' => 'EMP-EOSB-12YR',
        'first_name' => 'Mansour',
        'last_name' => 'Al-Zahrani',
        'hire_date' => $hireDate12Years,
        'status' => 'active',
        'basic_salary' => 30000.00,
        'housing_allowance' => 6000.00,
    ]);

    $service = app(SaudiEosbCalculatorService::class);

    // Test individual calculations
    $calc3 = $service->calculateForEmployee($emp3Yrs, null, 'resignation');
    expect($calc3['statutory_accrued_liability'])->toEqual(18750.00)
        ->and($calc3['entitlement_percentage'])->toEqual(33.3)
        ->and($calc3['payable_entitlement'])->toEqual(6250.00);

    $calc7 = $service->calculateForEmployee($emp7Yrs, null, 'resignation');
    expect($calc7['statutory_accrued_liability'])->toEqual(112500.00)
        ->and($calc7['entitlement_percentage'])->toEqual(66.7)
        ->and($calc7['payable_entitlement'])->toEqual(75000.00);

    $calc12 = $service->calculateForEmployee($emp12Yrs, null, 'resignation');
    expect($calc12['statutory_accrued_liability'])->toEqual(342000.00)
        ->and($calc12['entitlement_percentage'])->toEqual(100.0)
        ->and($calc12['payable_entitlement'])->toEqual(342000.00);

    // Test company-wide liability schedule
    $schedule = $service->getCompanyLiabilitySchedule($this->company->id);
    expect($schedule['total_active_employees'])->toBeGreaterThanOrEqual(3)
        ->and($schedule['total_cumulative_ifrs_liability'])->toBeGreaterThanOrEqual(473250.00)
        ->and($schedule['recommended_adjustment'])->toBeGreaterThan(0);

    // Test CSV schedule generation
    $csv = $service->generateScheduleCsv($this->company->id);
    expect($csv)->toContain('EMP-EOSB-3YR')
        ->toContain('Fahad Al-Otaibi')
        ->toContain('18750.00')
        ->toContain('33.3%')
        ->toContain('6250.00');

    // 4. Test Web Index Route receives liabilitySchedule prop
    $indexResp = $this->actingAs($this->user)->get(route('hr.end-of-service.index'));
    $indexResp->assertOk();
    $indexResp->assertInertia(fn ($page) => $page
        ->component('HR/EndOfService/Index')
        ->has('liabilitySchedule')
        ->where('liabilitySchedule.total_cumulative_ifrs_liability', fn ($val) => $val >= 473250.00)
    );

    // 5. Test Posting End of Service Provision Accrual to General Ledger
    $postResp = $this->actingAs($this->user)->post(route('hr.end-of-service.accrue'));
    $postResp->assertRedirect();
    $postResp->assertSessionHas('success');

    // Verify GL Account 5140 (Expense) and 2160 (Provision) have been created/updated
    $expenseAcc = Account::where('company_id', $this->company->id)->where('code', '5140')->first();
    $provisionAcc = Account::where('company_id', $this->company->id)->where('code', '2160')->first();
    expect($expenseAcc)->not->toBeNull()
        ->and($provisionAcc)->not->toBeNull();

    $journal = JournalEntry::where('company_id', $this->company->id)
        ->where('source_type', 'eosb_accrual')
        ->latest()
        ->first();
    expect($journal)->not->toBeNull()
        ->and($journal->status)->toBe('posted');

    // 6. Test Streamed CSV Export Route
    $exportResp = $this->actingAs($this->user)->get(route('hr.end-of-service.export-schedule'));
    $exportResp->assertOk();
    expect($exportResp->headers->get('content-type'))->toContain('text/csv');
});
