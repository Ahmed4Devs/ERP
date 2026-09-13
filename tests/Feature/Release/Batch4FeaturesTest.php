<?php

use App\Models\User;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\Inventory\Models\Product;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Payroll\Models\PayrollRun;
use App\Modules\Payroll\Models\Payslip;
use App\Modules\Payroll\Services\WpsFileGeneratorService;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Platform\Services\AuditLogger;
use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Modules\Purchasing\Models\PurchaseRequisition;
use App\Modules\Purchasing\Services\PurchaseRequisitionService;
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

test('purchase requisitions full lifecycle and conversion to purchase orders works seamlessly', function () {
    $dept = Department::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'PROC'],
        ['tenant_id' => $this->tenant->id, 'name' => 'Procurement']
    );

    $product = Product::where('company_id', $this->company->id)->firstOrFail();
    $product->update([
        'moving_average_cost' => 4500,
        'standard_cost' => 4500,
    ]);

    $vendor = Party::create([
        'tenant_id' => $this->tenant->id,
        'type' => 'vendor',
        'name' => 'Saudi Tech Supplies Co.',
        'tax_id' => '310998877600003',
        'currency' => 'SAR',
    ]);

    // 1. Create Purchase Requisition via HTTP POST
    $response = $this->actingAs($this->user)->post(route('purchase-requisitions.store'), [
        'department_id' => $dept->id,
        'required_date' => now()->addDays(5)->toDateString(),
        'priority' => 'high',
        'notes' => 'Urgent hardware requisitions for new software developers',
        'lines' => [
            [
                'product_id' => $product->id,
                'description' => 'Development Laptop 32GB RAM',
                'quantity' => 2,
                'estimated_unit_cost' => 4500,
                'notes' => 'Include warranty',
            ],
            [
                'product_id' => null,
                'description' => 'Laptop backpacks & accessories',
                'quantity' => 2,
                'estimated_unit_cost' => 250,
                'notes' => 'Accessories bundle',
            ],
        ],
    ]);

    $response->assertRedirect();
    $requisition = PurchaseRequisition::where('company_id', $this->company->id)->latest()->first();

    expect($requisition)->not->toBeNull()
        ->and($requisition->status)->toBe('draft')
        ->and($requisition->priority)->toBe('high')
        ->and((float) $requisition->total_estimated_amount)->toBe(9500.0)
        ->and($requisition->lines)->toHaveCount(2);

    // 2. Submit for approval
    $submitResp = $this->actingAs($this->user)->post(route('purchase-requisitions.submit', $requisition->id));
    $submitResp->assertRedirect();
    $requisition->refresh();
    expect($requisition->status)->toBe('submitted');

    // 3. Approve Requisition
    $approveResp = $this->actingAs($this->user)->post(route('purchase-requisitions.approve', $requisition->id));
    $approveResp->assertRedirect();
    $requisition->refresh();
    expect($requisition->status)->toBe('approved')
        ->and($requisition->approved_by_id)->toBe($this->user->id)
        ->and($requisition->approved_at)->not->toBeNull();

    // 4. 1-Click Convert to Purchase Order
    $convertResp = $this->actingAs($this->user)->post(route('purchase-requisitions.convert-to-po', $requisition->id), [
        'vendor_party_id' => $vendor->id,
        'expected_delivery_date' => now()->addDays(7)->toDateString(),
    ]);

    $requisition->refresh();
    expect($requisition->status)->toBe('converted')
        ->and($requisition->purchase_order_id)->not->toBeNull();

    $po = PurchaseOrder::find($requisition->purchase_order_id);
    expect($po)->not->toBeNull()
        ->and($po->party_id)->toBe($vendor->id)
        ->and($po->lines)->toHaveCount(2)
        ->and((float) $po->subtotal)->toBe(9500.0)
        ->and((float) $po->tax_amount)->toBe(950.0) // 10% tax
        ->and((float) $po->total)->toBe(10450.0);

    // 5. Verify cannot re-convert or reject converted PR
    $service = app(PurchaseRequisitionService::class);
    expect(fn () => $service->convertToPurchaseOrder($requisition, $vendor->id))
        ->toThrow(InvalidArgumentException::class);

    expect(fn () => $service->reject($requisition, 'Too late'))
        ->toThrow(InvalidArgumentException::class);
});

test('audit logs center tracks events, filters records, and exports csv correctly', function () {
    $this->actingAs($this->user);

    // 1. Generate audit log events via AuditLogger
    $log1 = AuditLogger::log(
        action: 'purchase_requisition.approved',
        entityType: 'App\Modules\Purchasing\Models\PurchaseRequisition',
        entityId: 'PR-TEST-UUID-01',
        oldValues: ['status' => 'submitted'],
        newValues: ['status' => 'approved', 'approved_by' => $this->user->id],
        companyId: $this->company->id,
        tenantId: $this->tenant->id
    );

    $log2 = AuditLogger::log(
        action: 'security.permission_changed',
        entityType: 'App\Models\User',
        entityId: (string) $this->user->id,
        oldValues: ['role' => 'accountant'],
        newValues: ['role' => 'financial_manager'],
        companyId: $this->company->id,
        tenantId: $this->tenant->id
    );

    expect($log1)->not->toBeNull()
        ->and($log1->action)->toBe('purchase_requisition.approved')
        ->and($log1->old_values['status'])->toBe('submitted')
        ->and($log1->new_values['status'])->toBe('approved');

    // 2. Query index page
    $response = $this->actingAs($this->user)->get(route('audit-logs.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Platform/AuditLogs/Index')
        ->has('logs.data')
        ->has('metrics')
        ->where('metrics.active_users_count', fn ($val) => $val >= 1)
    );

    // 3. Filter by specific action
    $filterResponse = $this->actingAs($this->user)->get(route('audit-logs.index', ['action' => 'security.permission_changed']));
    $filterResponse->assertOk();
    $filterResponse->assertInertia(fn ($page) => $page
        ->where('logs.data.0.action', 'security.permission_changed')
    );

    // 4. Test Export CSV endpoint
    $exportResponse = $this->actingAs($this->user)->get(route('audit-logs.export', ['action' => 'purchase_requisition.approved']));
    $exportResponse->assertOk();
    expect($exportResponse->headers->get('content-type'))->toContain('text/csv');

    // Stream content check
    ob_start();
    $exportResponse->sendContent();
    $csvContent = ob_get_clean();

    expect($csvContent)->toContain('Timestamp,User,Action')
        ->toContain('purchase_requisition.approved')
        ->toContain('PR-TEST-UUID-01');
});
