<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\FixedAsset;
use App\Modules\Assets\Models\FixedAssetDisposal;
use App\Modules\Assets\Services\ZatcaTaxDepreciationService;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Services\SaudiEosbCalculatorService;
use App\Modules\MasterData\Models\CustomerProfile;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Sales\Models\SalesOrder;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;

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

test('b2b customer self service portal allows clients to view statement, invoices, orders and download zatca xml without employee login', function () {
    // 1. Create a B2B Customer with CustomerProfile and secure portal token
    $customerParty = Party::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Saudi Tech Enterprises Ltd',
        'name_ar' => 'شركة المشاريع التقنية السعودية المحدودة',
        'type' => 'customer',
        'tax_id' => '310998877600003',
        'email' => 'finance@sauditech.com',
        'phone' => '+966501234567',
        'status' => 'active',
    ]);

    $profile = CustomerProfile::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'party_id' => $customerParty->id,
        'credit_limit' => 250000.00,
        'payment_terms_days' => 45,
        'currency' => 'SAR',
        'is_active' => true,
    ]);

    $token = $profile->portal_token;
    expect($token)->not->toBeEmpty();

    // 2. Create a Sales Order for this customer
    $order = SalesOrder::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'customer_id' => $customerParty->id,
        'order_number' => 'SO-PORTAL-001',
        'order_date' => now()->toDateString(),
        'subtotal' => 40000.00,
        'tax_amount' => 6000.00,
        'total_amount' => 46000.00,
        'currency' => 'SAR',
        'status' => 'confirmed',
        'invoicing_status' => 'partially_billed',
    ]);

    // 3. Create a posted ZATCA Service Invoice with mock XML
    $sampleXml = '<?xml version="1.0" encoding="UTF-8"?><Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"><ID>INV-PORTAL-101</ID></Invoice>';
    $invoice = ServiceInvoice::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'party_id' => $customerParty->id,
        'sales_order_id' => $order->id,
        'invoice_number' => 'INV-PORTAL-101',
        'date' => now()->toDateString(),
        'due_date' => now()->addDays(45)->toDateString(),
        'status' => 'posted',
        'subtotal' => 20000.00,
        'tax_rate' => 0.15,
        'tax_amount' => 3000.00,
        'total' => 23000.00,
        'amount_paid' => 5000.00,
        'balance_due' => 18000.00,
        'currency' => 'SAR',
        'zatca_status' => 'cleared',
        'zatca_cleared_xml' => $sampleXml,
    ]);

    // 4. Test Public Portal Dashboard (Without Auth / Login)
    $portalResp = $this->get(route('portal.dashboard', ['token' => $token]));
    $portalResp->assertOk();
    $portalResp->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Portal/Customer/Dashboard')
        ->where('portalToken', $token)
        ->where('customer.name', 'Saudi Tech Enterprises Ltd')
        ->where('metrics.credit_limit', 250000)
        ->where('metrics.outstanding_balance', 18000)
        ->where('metrics.available_credit', 232000)
        ->has('invoices', 1)
        ->has('orders', 1)
        ->has('statement')
    );

    // 5. Test Customer Statement CSV Export (Public / Token-Secured)
    $exportResp = $this->get(route('portal.statement.export', ['token' => $token]));
    $exportResp->assertOk();
    expect($exportResp->headers->get('content-type'))->toContain('text/csv');

    // 6. Test Download ZATCA Compliant XML
    $xmlResp = $this->get(route('portal.invoice.xml', ['token' => $token, 'invoice' => $invoice->id]));
    $xmlResp->assertOk();
    expect($xmlResp->headers->get('content-type'))->toContain('application/xml')
        ->and($xmlResp->getContent())->toContain('<ID>INV-PORTAL-101</ID>');

    // 7. Test Printable ZATCA Tax Invoice with QR Code
    $printResp = $this->get(route('portal.invoice.print', ['token' => $token, 'invoice' => $invoice->id]));
    $printResp->assertOk();
    $printResp->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Accounting/Invoices/Print')
        ->has('qrCodeDataUri')
        ->has('amountInWords.ar')
        ->has('amountInWords.en')
    );

    // 8. Test Admin Regenerating Customer Portal Token
    $adminResp = $this->actingAs($this->user)->post(route('customers.regenerate-portal-token', ['profile' => $profile->id]));
    $adminResp->assertRedirect();
    $profile->refresh();
    expect($profile->portal_token)->not->toBe($token);

    // Old token should now return 404
    $oldTokenResp = $this->get(route('portal.dashboard', ['token' => $token]));
    $oldTokenResp->assertNotFound();

    // New token should work
    $newTokenResp = $this->get(route('portal.dashboard', ['token' => $profile->portal_token]));
    $newTokenResp->assertOk();
});

test('zatca statutory asset tax depreciation and zakat schedule engine computes 5 groups declining pool formula and exports audit csv', function () {
    // Clean any seeded assets for deterministic calculation
    FixedAsset::where('company_id', $this->company->id)->delete();

    // 1. Create an Asset Category
    $category = AssetCategory::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'BUILDINGS'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Corporate Buildings',
            'name_ar' => 'المباني الإدارية',
            'depreciation_method' => 'straight_line',
            'useful_life_months' => 360,
            'zatca_tax_group' => 'group_1',
        ]
    );

    // 2. Asset in Group 1 (Buildings 3%): Prior year purchase, opening base 1,000,000 SAR
    $buildingAsset = FixedAsset::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'category_id' => $category->id,
        'asset_tag' => 'AST-BLD-001',
        'name' => 'HQ Main Building',
        'name_ar' => 'المبنى الرئيسي للشركة',
        'purchase_date' => '2024-01-15',
        'in_service_date' => '2024-02-01',
        'acquisition_cost' => 1000000.00,
        'salvage_value' => 0.00,
        'useful_life_months' => 360,
        'depreciation_method' => 'straight_line',
        'accumulated_depreciation' => 50000.00,
        'net_book_value' => 950000.00,
        'zatca_tax_group' => 'group_1',
        'zatca_tax_base' => 950000.00,
        'status' => 'active',
    ]);

    // 3. Asset in Group 3 (Machinery & Software 25%): Purchased in current year (Addition = 200,000 SAR)
    $serverAsset = FixedAsset::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'category_id' => $category->id,
        'asset_tag' => 'AST-IT-101',
        'name' => 'Data Center Blade Servers',
        'name_ar' => 'خوادم مركز البيانات',
        'purchase_date' => '2026-03-10',
        'in_service_date' => '2026-03-15',
        'acquisition_cost' => 200000.00,
        'salvage_value' => 0.00,
        'useful_life_months' => 36,
        'depreciation_method' => 'straight_line',
        'accumulated_depreciation' => 0.00,
        'net_book_value' => 200000.00,
        'zatca_tax_group' => 'group_3',
        'status' => 'active',
    ]);

    // 4. Asset in Group 5 (Other / Passenger Vehicles 10%): Opening base 100,000 SAR with Disposal of 30,000 SAR
    $carAsset = FixedAsset::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'category_id' => $category->id,
        'asset_tag' => 'AST-CAR-501',
        'name' => 'Executive Transport Vehicle',
        'name_ar' => 'مركبة نقل تنفيذية',
        'purchase_date' => '2025-06-01',
        'in_service_date' => '2025-06-01',
        'acquisition_cost' => 120000.00,
        'salvage_value' => 20000.00,
        'useful_life_months' => 48,
        'depreciation_method' => 'straight_line',
        'accumulated_depreciation' => 20000.00,
        'net_book_value' => 100000.00,
        'zatca_tax_group' => 'group_5',
        'zatca_tax_base' => 100000.00,
        'status' => 'active',
    ]);

    // Create a posted disposal for car asset with proceeds 30,000 SAR
    FixedAssetDisposal::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'fixed_asset_id' => $carAsset->id,
        'disposal_number' => 'DISP-2026-001',
        'disposal_date' => '2026-07-20',
        'disposal_type' => 'sale',
        'acquisition_cost' => 120000.00,
        'accumulated_depreciation' => 35000.00,
        'net_book_value' => 85000.00,
        'proceeds' => 30000.00,
        'gain_loss_amount' => 55000.00,
        'gain_loss_type' => 'loss',
        'status' => 'posted',
        'posted_at' => now(),
    ]);

    // 5. Test Service Calculation
    $taxService = app(ZatcaTaxDepreciationService::class);
    $schedule = $taxService->computeSchedule($this->company->id, 2026);

    // Verify Group 1:
    // Opening 950,000, Additions 0, Disposals 0 -> Statutory Base = 950,000. Tax Depr @ 3% = 28,500.00.
    // Closing Base = 950,000 - 28,500 = 921,500.00.
    $g1 = $schedule['groups']['group_1'];
    expect($g1['opening_base'])->toBe(950000.00)
        ->and($g1['rate'])->toBe(0.03)
        ->and($g1['tax_depreciation'])->toBe(28500.00)
        ->and($g1['closing_base'])->toBe(921500.00);

    // Verify Group 3:
    // Opening 0, Additions 200,000, Disposals 0 -> Statutory Base = 0 + 0.5 * 200,000 = 100,000.
    // Tax Depr @ 25% = 25,000.00.
    // Closing Base = 0 + 200,000 - 25,000 = 175,000.00.
    $g3 = $schedule['groups']['group_3'];
    expect($g3['additions'])->toBe(200000.00)
        ->and($g3['statutory_base'])->toBe(100000.00)
        ->and($g3['rate'])->toBe(0.25)
        ->and($g3['tax_depreciation'])->toBe(25000.00)
        ->and($g3['closing_base'])->toBe(175000.00);

    // Verify Group 5:
    // Opening 100,000, Additions 0, Disposals 30,000 -> Statutory Base = 100,000 + 0.5 * (-30,000) = 85,000.
    // Tax Depr @ 10% = 8,500.00.
    // Closing Base = 100,000 - 30,000 - 8,500 = 61,500.00.
    $g5 = $schedule['groups']['group_5'];
    expect($g5['opening_base'])->toBe(100000.00)
        ->and($g5['disposals'])->toBe(30000.00)
        ->and($g5['statutory_base'])->toBe(85000.00)
        ->and($g5['rate'])->toBe(0.10)
        ->and($g5['tax_depreciation'])->toBe(8500.00)
        ->and($g5['closing_base'])->toBe(61500.00);

    // Total Tax Depreciation across all groups = 28,500 + 25,000 + 8,500 = 62,000.00 SAR
    expect($schedule['totals']['tax_depreciation'])->toBe(62000.00);

    // 6. Test Controller UI Endpoint
    $pageResp = $this->actingAs($this->user)->get(route('assets.zatca-tax-schedule.index', ['tax_year' => 2026]));
    $pageResp->assertOk();
    $pageResp->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Assets/ZatcaTaxSchedule/Index')
        ->where('taxYear', 2026)
        ->has('schedule.groups.group_1')
        ->has('schedule.groups.group_2')
        ->has('schedule.groups.group_3')
        ->has('schedule.groups.group_4')
        ->has('schedule.groups.group_5')
        ->where('schedule.totals.tax_depreciation', 62000)
        ->has('assets.data')
    );

    // 7. Test Updating Asset Statutory Tax Group
    $updateResp = $this->actingAs($this->user)->put(
        route('assets.zatca-tax-schedule.update-group', ['asset' => $buildingAsset->id]),
        ['zatca_tax_group' => 'group_2', 'zatca_tax_base' => 900000.00]
    );
    $updateResp->assertRedirect();
    $buildingAsset->refresh();
    expect($buildingAsset->zatca_tax_group)->toBe('group_2')
        ->and((float) $buildingAsset->zatca_tax_base)->toBe(900000.00);

    // 8. Test Statutory CSV Export Endpoint
    $exportResp = $this->actingAs($this->user)->get(route('assets.zatca-tax-schedule.export', ['tax_year' => 2026]));
    $exportResp->assertOk();
    expect($exportResp->headers->get('content-type'))->toContain('text/csv');
    $csvContent = $exportResp->streamedContent();
    expect($csvContent)->toContain('المجموعة الأولى')
        ->and($csvContent)->toContain('المجموعة الثالثة')
        ->and($csvContent)->toContain('المادة 17');
});
