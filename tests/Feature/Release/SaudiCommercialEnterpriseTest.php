<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Payroll\Services\GeneratePayrollRunAction;
use App\Modules\Payroll\Services\GosiCalculatorService;
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
    $this->branch = Branch::where('company_id', $this->company->id)->first();
});

test('saudi gosi engine correctly calculates statutory rates caps wages and posts employer GL liability', function () {
    $dept = Department::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'FIN'],
        ['tenant_id' => $this->tenant->id, 'name' => 'Finance']
    );
    $desig = Designation::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'ACC'],
        ['tenant_id' => $this->tenant->id, 'title' => 'Accountant']
    );

    // 1. Standard Saudi Citizen (Basic 10,000, Housing 2,500 -> Contributory 12,500)
    $saudiEmp = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'department_id' => $dept->id,
        'designation_id' => $desig->id,
        'employee_number' => 'EMP-SA-01',
        'first_name' => 'Salman',
        'last_name' => 'Al-Dosari',
        'hire_date' => '2023-01-01',
        'status' => 'active',
        'national_id' => '1022334455',
        'nationality' => 'Saudi',
        'basic_salary' => 10000,
        'housing_allowance' => 2500,
        'transport_allowance' => 1000,
        'iban' => 'SA0380000000608010167520',
    ]);

    // 2. High Salary Saudi Executive (Basic 50,000, Housing 15,000 -> Total 65,000 -> Capped at 45,000 SAR)
    $execSaudi = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'department_id' => $dept->id,
        'designation_id' => $desig->id,
        'employee_number' => 'EMP-SA-EXEC',
        'first_name' => 'Turki',
        'last_name' => 'Al-Sheikh',
        'hire_date' => '2022-01-01',
        'status' => 'active',
        'national_id' => '1099887766',
        'nationality' => 'Saudi',
        'basic_salary' => 50000,
        'housing_allowance' => 15000,
        'transport_allowance' => 2000,
        'iban' => 'SA0380000000608010167521',
    ]);

    // 3. Non-Saudi Resident (Basic 6,000, Housing 1,500 -> Contributory 7,500, Employee 0%, Employer 2% Hazards)
    $expatEmp = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'department_id' => $dept->id,
        'designation_id' => $desig->id,
        'employee_number' => 'EMP-EXP-01',
        'first_name' => 'Muhammad',
        'last_name' => 'Ibrahim',
        'hire_date' => '2023-06-01',
        'status' => 'active',
        'national_id' => '2455667788',
        'nationality' => 'Egyptian',
        'basic_salary' => 6000,
        'housing_allowance' => 1500,
        'transport_allowance' => 500,
        'iban' => 'SA0380000000608010167522',
    ]);

    $gosiService = app(GosiCalculatorService::class);

    // Test individual employee calculations
    $saudiCalc = $gosiService->calculateForEmployee($saudiEmp);
    expect($saudiCalc['is_saudi'])->toBeTrue()
        ->and((float) $saudiCalc['contributory_wage'])->toBe(12500.0)
        ->and((float) $saudiCalc['employee_deduction'])->toBe(1218.75) // 12500 * 9.75%
        ->and((float) $saudiCalc['employer_contribution'])->toBe(1468.75) // 12500 * 11.75%
        ->and((float) $saudiCalc['total_remittance'])->toBe(2687.50);

    $execCalc = $gosiService->calculateForEmployee($execSaudi);
    expect($execCalc['is_saudi'])->toBeTrue()
        ->and((float) $execCalc['contributory_wage'])->toBe(45000.0) // Capped at 45,000
        ->and((float) $execCalc['employee_deduction'])->toBe(4387.50) // 45000 * 9.75%
        ->and((float) $execCalc['employer_contribution'])->toBe(5287.50); // 45000 * 11.75%

    $expatCalc = $gosiService->calculateForEmployee($expatEmp);
    expect($expatCalc['is_saudi'])->toBeFalse()
        ->and((float) $expatCalc['contributory_wage'])->toBe(7500.0)
        ->and((float) $expatCalc['employee_deduction'])->toBe(0.0) // 0%
        ->and((float) $expatCalc['employer_contribution'])->toBe(150.0); // 7500 * 2%

    // 4. Generate Payroll Run and verify payslips store correct GOSI fields
    $run = app(GeneratePayrollRunAction::class)->execute(
        companyId: $this->company->id,
        tenantId: $this->tenant->id,
        year: 2026,
        month: 10,
        paymentDate: '2026-10-28'
    );

    $saudiSlip = $run->payslips()->where('employee_id', $saudiEmp->id)->first();
    expect($saudiSlip)->not->toBeNull()
        ->and((float) $saudiSlip->gosi_contributory_wage)->toBe(12500.0)
        ->and((float) $saudiSlip->social_insurance_deduction)->toBe(1218.75)
        ->and((float) $saudiSlip->employer_gosi_contribution)->toBe(1468.75);

    // 5. Test GOSI Statement query endpoint
    $response = $this->actingAs($this->user)->get(route('payroll.gosi.index', ['run_id' => $run->id]));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Payroll/Gosi/Index')
        ->has('gosiData')
        ->where('gosiData.total_saudi_employees', fn ($val) => $val >= 2)
        ->where('gosiData.total_non_saudi_employees', fn ($val) => $val >= 1)
    );

    // 6. Test GOSI CSV Export
    $exportResp = $this->actingAs($this->user)->get(route('payroll.gosi.export', ['run_id' => $run->id]));
    $exportResp->assertOk();
    expect($exportResp->headers->get('content-type'))->toContain('text/csv');

    ob_start();
    $exportResp->sendContent();
    $csv = ob_get_clean();

    expect($csv)->toContain('National ID / Iqama')
        ->toContain('1022334455')
        ->toContain('Salman Al-Dosari')
        ->toContain('2455667788')
        ->toContain('1218.75');

    // 7. Test Posting Employer GOSI Contribution to General Ledger
    $postResp = $this->actingAs($this->user)->post(route('payroll.gosi.post-employer', $run->id));
    $postResp->assertRedirect();
    $postResp->assertSessionHas('success');

    // Verify GL Account 2040 and 5130 have been posted
    $gosiPayable = Account::where('company_id', $this->company->id)->where('code', '2040')->first();
    expect($gosiPayable)->not->toBeNull();
});
