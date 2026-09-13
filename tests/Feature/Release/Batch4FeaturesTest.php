<?php

use App\Models\User;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Payroll\Models\PayrollRun;
use App\Modules\Payroll\Models\Payslip;
use App\Modules\Payroll\Services\WpsFileGeneratorService;
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

test('wps sif and mudad csv exports generate valid formats', function () {
    $dept = Department::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'IT'],
        ['tenant_id' => $this->tenant->id, 'name' => 'IT Dept']
    );
    $desig = Designation::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'DEV'],
        ['tenant_id' => $this->tenant->id, 'title' => 'Software Engineer']
    );

    $emp = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'department_id' => $dept->id,
        'designation_id' => $desig->id,
        'employee_number' => 'EMP-WPS-01',
        'first_name' => 'Fahad',
        'last_name' => 'Al-Harbi',
        'hire_date' => '2024-01-01',
        'status' => 'active',
        'national_id' => '1088765432',
        'basic_salary' => 8000,
        'housing_allowance' => 2000,
        'transportation_allowance' => 1000,
        'iban' => 'SA0380000000608010167519',
    ]);

    $payrollRun = PayrollRun::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'run_number' => 'PR-2026-09',
        'period_year' => 2026,
        'period_month' => 9,
        'payment_date' => '2026-09-30',
        'status' => 'approved',
        'total_gross' => 11000,
        'total_deductions' => 500,
        'total_net' => 10500,
    ]);

    Payslip::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'payroll_run_id' => $payrollRun->id,
        'employee_id' => $emp->id,
        'payslip_number' => 'SLIP-001',
        'basic_salary' => 8000,
        'housing_allowance' => 2000,
        'transport_allowance' => 1000,
        'other_allowances' => 0,
        'overtime_amount' => 0,
        'gross_salary' => 11000,
        'total_deductions' => 500,
        'net_salary' => 10500,
    ]);

    $wpsService = app(WpsFileGeneratorService::class);
    $sifContent = $wpsService->generateSif($payrollRun);

    expect($sifContent)->toContain('SCR,')
        ->toContain('10500.00')
        ->toContain('SAR')
        ->toContain('PR-2026-09')
        ->toContain('EDR,1088765432,Fahad Al-Harbi')
        ->toContain('SA0380000000608010167519');

    $csvContent = $wpsService->generateMudadCsv($payrollRun);
    expect($csvContent)->toContain('National ID / Iqama')
        ->toContain('1088765432')
        ->toContain('Fahad Al-Harbi')
        ->toContain('10500.00');

    // Test HTTP download endpoints
    $sifResponse = $this->actingAs($this->user)->get(route('payroll.runs.wps-sif', $payrollRun->id));
    $sifResponse->assertOk();
    expect($sifResponse->headers->get('content-disposition'))->toContain('WPS-PR-2026-09.sif');

    $csvResponse = $this->actingAs($this->user)->get(route('payroll.runs.wps-csv', $payrollRun->id));
    $csvResponse->assertOk();
    expect($csvResponse->headers->get('content-disposition'))->toContain('MUDAD-WPS-PR-2026-09.csv');
});
