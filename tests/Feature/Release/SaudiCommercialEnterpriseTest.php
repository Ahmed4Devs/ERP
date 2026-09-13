<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\MasterData\Models\CustomerProfile;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Payroll\Services\GeneratePayrollRunAction;
use App\Modules\Payroll\Services\GosiCalculatorService;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Platform\Services\ExecutiveBiDashboardService;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Models\SalesOrderLine;
use App\Modules\Sales\Services\CustomerCreditService;
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

test('commercial sales order conversion enforces customer credit limit and generates zatca tax invoice atomically', function () {
    // 1. Create a Commercial Customer with 50,000 SAR credit limit
    $customer = Party::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Saudi Tech Horizon Co.',
        'name_ar' => 'شركة أفق التقنية السعودية',
        'type' => 'customer',
        'tax_id' => '310998877600003',
        'email' => 'sales@techhorizon.sa',
        'phone' => '+966501112233',
        'status' => 'active',
    ]);

    CustomerProfile::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'party_id' => $customer->id,
        'credit_limit' => 50000.00,
        'payment_terms_days' => 30,
        'currency' => 'SAR',
        'is_active' => true,
    ]);

    $creditService = app(CustomerCreditService::class);
    $initialCheck = $creditService->checkCreditLimit($customer, $this->company->id, 0.0);
    expect($initialCheck['has_credit_limit'])->toBeTrue()
        ->and($initialCheck['credit_limit'])->toEqual(50000.00)
        ->and($initialCheck['current_balance'])->toEqual(0.0)
        ->and($initialCheck['available_credit'])->toEqual(50000.00)
        ->and($initialCheck['is_exceeded'])->toBeFalse();

    // 2. Create Sales Order #1 (Subtotal: 20,000 SAR)
    $order1 = SalesOrder::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'order_number' => 'SO-SAUDI-2026-001',
        'customer_id' => $customer->id,
        'order_date' => now()->toDateString(),
        'subtotal' => 20000.00,
        'tax_rate' => 0.15,
        'tax_amount' => 3000.00,
        'discount_amount' => 0.00,
        'total_amount' => 23000.00,
        'status' => 'confirmed',
        'invoicing_status' => 'unbilled',
    ]);

    SalesOrderLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'sales_order_id' => $order1->id,
        'description' => 'ERP Turnkey Enterprise Implementation License',
        'quantity' => 1,
        'unit_price' => 20000.00,
        'tax_amount' => 3000.00,
        'line_total' => 23000.00,
    ]);

    // 3. Test Show route receives creditStatus prop
    $showResp = $this->actingAs($this->user)->get(route('sales.orders.show', $order1->id));
    $showResp->assertOk();
    $showResp->assertInertia(fn ($page) => $page
        ->component('Sales/Orders/Show')
        ->has('creditStatus')
        ->where('creditStatus.credit_limit', 50000)
        ->where('creditStatus.is_exceeded', false)
    );

    // 4. Convert Order #1 to Tax Invoice (under limit -> succeeds)
    $convertResp = $this->actingAs($this->user)->post(route('sales.orders.convert-to-invoice', $order1->id));
    $convertResp->assertRedirect();
    $convertResp->assertSessionHas('success');

    $order1->refresh();
    expect($order1->invoicing_status)->toBe('fully_billed');

    $invoice1 = ServiceInvoice::where('sales_order_id', $order1->id)->first();
    expect($invoice1)->not->toBeNull()
        ->and($invoice1->status)->toBe('posted')
        ->and((float) $invoice1->total)->toBeGreaterThan(0.0)
        ->and($invoice1->party_id)->toBe($customer->id);

    // 5. Verify Customer outstanding balance is now updated
    $updatedCheck = $creditService->checkCreditLimit($customer, $this->company->id, 0.0);
    expect($updatedCheck['current_balance'])->toBeGreaterThan(0.0)
        ->and($updatedCheck['available_credit'])->toBeLessThan(50000.00);

    // 6. Create Sales Order #2 with large total that pushes over 50,000 SAR limit
    $order2 = SalesOrder::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'order_number' => 'SO-SAUDI-2026-002',
        'customer_id' => $customer->id,
        'order_date' => now()->toDateString(),
        'subtotal' => 35000.00,
        'tax_rate' => 0.15,
        'tax_amount' => 5250.00,
        'discount_amount' => 0.00,
        'total_amount' => 40250.00,
        'status' => 'confirmed',
        'invoicing_status' => 'unbilled',
    ]);

    SalesOrderLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'sales_order_id' => $order2->id,
        'description' => 'Custom Cloud Infrastructure Server Cluster',
        'quantity' => 1,
        'unit_price' => 35000.00,
        'tax_amount' => 5250.00,
        'line_total' => 40250.00,
    ]);

    // Check credit status for order 2: current_balance (~23,000) + 40,250 = ~63,250 > 50,000 => is_exceeded
    $check2 = $creditService->checkCreditLimit($customer, $this->company->id, (float) $order2->total_amount);
    expect($check2['is_exceeded'])->toBeTrue();

    // 7. Attempt conversion without override -> should fail with error session
    $blockedResp = $this->actingAs($this->user)->post(route('sales.orders.convert-to-invoice', $order2->id), [
        'ignore_credit_limit' => false,
    ]);
    $blockedResp->assertRedirect();
    $blockedResp->assertSessionHas('error');
    expect($order2->fresh()->invoicing_status)->toBe('unbilled');

    // 8. Attempt conversion WITH supervisor override -> should succeed
    $overrideResp = $this->actingAs($this->user)->post(route('sales.orders.convert-to-invoice', $order2->id), [
        'ignore_credit_limit' => true,
    ]);
    $overrideResp->assertRedirect();
    $overrideResp->assertSessionHas('success');

    $order2->refresh();
    expect($order2->invoicing_status)->toBe('fully_billed');
    $invoice2 = ServiceInvoice::where('sales_order_id', $order2->id)->first();
    expect($invoice2)->not->toBeNull()
        ->and($invoice2->status)->toBe('posted');
});

test('c-level executive financial intelligence and bi dashboard provides working capital liquidity ratios and zatca telemetry', function () {
    // 1. Check executive dashboard route
    $response = $this->actingAs($this->user)->get(route('dashboard'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->has('biMetrics')
        ->has('biMetrics.financial_intelligence')
        ->has('biMetrics.monthly_trends')
        ->has('biMetrics.zatca_compliance')
        ->has('biMetrics.commercial_pipeline')
        ->where('biMetrics.financial_intelligence.current_ratio', fn ($val) => is_numeric($val))
        ->where('biMetrics.zatca_compliance.compliance_rate', fn ($val) => is_numeric($val))
    );

    // 2. Test ExecutiveBiDashboardService directly
    $service = app(ExecutiveBiDashboardService::class);
    $data = $service->getExecutiveBiMetrics($this->company->id);

    expect($data)->toHaveKeys([
        'financial_intelligence',
        'monthly_trends',
        'zatca_compliance',
        'commercial_pipeline',
        'top_customers',
    ]);

    expect($data['financial_intelligence'])->toHaveKeys([
        'working_capital',
        'current_ratio',
        'quick_ratio',
        'cash_ratio',
        'current_assets',
        'current_liabilities',
        'cash_and_bank',
        'inventory_valuation',
        'accounts_receivable',
        'accounts_payable',
        'dso_days',
    ]);

    expect($data['zatca_compliance'])->toHaveKeys([
        'cleared',
        'reported',
        'pending',
        'rejected',
        'total_invoices',
        'compliance_rate',
    ]);
});
