<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\HR\Models\Department;
use App\Modules\HR\Models\Designation;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\EmployeeLoan;
use App\Modules\HR\Models\EndOfServiceSettlement;
use App\Modules\HR\Models\LeaveRequest;
use App\Modules\HR\Services\EndOfServiceCalculator;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
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
    $this->tenant = Tenant::where('slug', 'al-amal')->first();
    $this->company = Company::where('tenant_id', $this->tenant->id)->first();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $this->branch = Branch::where('company_id', $this->company->id)->first() ?? Branch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Main Branch',
        'code' => 'MAIN-01',
    ]);

    // Ensure Provision Account 2160 exists
    Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '2160'], [
        'tenant_id' => $this->tenant->id, 'name' => 'End of Service Indemnity Provision', 'name_ar' => 'مخصص مكافأة نهاية الخدمة', 'type' => 'liability', 'subtype' => 'payroll_payable',
    ]);
    // Ensure Loan/Advance Account 1140 exists
    Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '1140'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Employee Advances & Loans', 'name_ar' => 'سلف وقروض الموظفين', 'type' => 'asset', 'subtype' => 'receivable',
    ]);

    $this->department = Department::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'ENG'],
        ['tenant_id' => $this->tenant->id, 'name' => 'Engineering']
    );

    $this->designation = Designation::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => 'SR-ENG'],
        ['tenant_id' => $this->tenant->id, 'title' => 'Senior Engineer']
    );
});

test('leave requests lifecycle and approvals work cleanly', function () {
    $employee = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'department_id' => $this->department->id,
        'designation_id' => $this->designation->id,
        'employee_number' => 'EMP-TEST-001',
        'first_name' => 'Khalid',
        'last_name' => 'Al-Otaibi',
        'hire_date' => '2024-01-01',
        'status' => 'active',
        'basic_salary' => '8000.000000',
        'housing_allowance' => '2000.000000',
        'transport_allowance' => '1000.000000',
    ]);

    $this->actingAs($this->user);

    // 1. Submit leave request
    $response = $this->post(route('hr.leaves.store'), [
        'employee_id' => $employee->id,
        'leave_type' => 'annual',
        'start_date' => '2026-10-01',
        'end_date' => '2026-10-05', // 5 days
        'reason' => 'Annual family vacation',
    ]);

    $response->assertRedirect(route('hr.leaves.index'));

    $leave = LeaveRequest::where('employee_id', $employee->id)->first();
    expect($leave)->not->toBeNull()
        ->and($leave->status)->toBe('pending')
        ->and((float) $leave->days_count)->toBe(5.0);

    // 2. Approve leave request
    $approveResp = $this->post(route('hr.leaves.approve', $leave->id));
    $approveResp->assertRedirect(route('hr.leaves.index'));

    $leave->refresh();
    expect($leave->status)->toBe('approved')
        ->and($leave->approved_by)->toBe($this->user->id)
        ->and($leave->approved_at)->not->toBeNull();

    // 3. Reject second leave request
    $sickLeave = LeaveRequest::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'employee_id' => $employee->id,
        'leave_type' => 'sick',
        'start_date' => '2026-10-10',
        'end_date' => '2026-10-11',
        'days_count' => '2.00',
        'status' => 'pending',
    ]);

    $rejectResp = $this->post(route('hr.leaves.reject', $sickLeave->id), [
        'rejection_reason' => 'Medical certificate not provided',
    ]);
    $rejectResp->assertRedirect(route('hr.leaves.index'));

    $sickLeave->refresh();
    expect($sickLeave->status)->toBe('rejected')
        ->and($sickLeave->rejection_reason)->toBe('Medical certificate not provided');
});

test('employee loan creation and automated payroll run installment deduction works', function () {
    $employee = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'department_id' => $this->department->id,
        'designation_id' => $this->designation->id,
        'employee_number' => 'EMP-LOAN-001',
        'first_name' => 'Fahad',
        'last_name' => 'Al-Ghamdi',
        'hire_date' => '2023-01-01',
        'status' => 'active',
        'basic_salary' => '10000.000000',
        'housing_allowance' => '2500.000000',
        'transport_allowance' => '1000.000000',
        'other_allowances' => '0.000000',
    ]);

    $this->actingAs($this->user);

    // 1. Create a loan of 6,000 SAR for 6 installments starting 2026-09-01
    $response = $this->post(route('hr.loans.store'), [
        'employee_id' => $employee->id,
        'branch_id' => $this->branch->id,
        'total_amount' => 6000,
        'installments_count' => 6,
        'start_date' => '2026-09-01',
        'reason' => 'Emergency family aid',
    ]);

    $response->assertRedirect(route('hr.loans.index'));

    $loan = EmployeeLoan::where('employee_id', $employee->id)->first();
    expect($loan)->not->toBeNull()
        ->and((float) $loan->total_amount)->toBe(6000.0)
        ->and((float) $loan->monthly_installment)->toBe(1000.0)
        ->and($loan->installments()->count())->toBe(6);

    $septemberInstallment = $loan->installments()
        ->where('period_year', 2026)
        ->where('period_month', 9)
        ->first();
    expect($septemberInstallment)->not->toBeNull()
        ->and($septemberInstallment->status)->toBe('pending');

    // 2. Generate Payroll Run for 2026/09
    $generateAction = app(GeneratePayrollRunAction::class);
    $run = $generateAction->execute(
        companyId: $this->company->id,
        tenantId: $this->tenant->id,
        year: 2026,
        month: 9,
        paymentDate: '2026-09-28'
    );

    // Verify the payslip auto-deducted the 1000 SAR loan installment
    $payslip = $run->payslips()->where('employee_id', $employee->id)->first();
    expect($payslip)->not->toBeNull()
        ->and((float) $payslip->other_deductions)->toBe(1000.0);

    // 3. Post and Disburse the Payroll Run
    $postAction = app(PostPayrollRunAction::class);
    $postAction->execute($run);

    $disburseAction = app(DisbursePayrollAction::class);
    $disburseAction->execute($run);

    // 4. Verify the loan installment is marked deducted and loan balance is reduced
    $septemberInstallment->refresh();
    expect($septemberInstallment->status)->toBe('deducted')
        ->and($septemberInstallment->deducted_at)->not->toBeNull();

    $loan->refresh();
    expect((float) $loan->paid_amount)->toBe(1000.0)
        ->and((float) $loan->remaining_amount)->toBe(5000.0)
        ->and($loan->status)->toBe('active');
});

test('end of service calculator, legal settlement, and GL journal entry works end to end', function () {
    // 6 years service, gross salary = 12,000 (basic 8000 + housing 2500 + transport 1500)
    $employee = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'department_id' => $this->department->id,
        'designation_id' => $this->designation->id,
        'employee_number' => 'EMP-EOS-001',
        'first_name' => 'Tareq',
        'last_name' => 'Al-Harbi',
        'first_name_ar' => 'طارق',
        'last_name_ar' => 'الحربي',
        'hire_date' => '2020-01-01',
        'status' => 'active',
        'basic_salary' => '8000.000000',
        'housing_allowance' => '2500.000000',
        'transport_allowance' => '1500.000000',
        'other_allowances' => '0.000000',
    ]);

    $this->actingAs($this->user);

    // 1. Test calculation engine
    $calc = app(EndOfServiceCalculator::class)->calculate(
        employee: $employee,
        terminationType: 'resignation',
        lastWorkingDate: '2026-01-01', // exactly 6 years
        unusedLeaveDays: 15,
        otherEntitlements: 1000,
        deductions: 2000
    );

    // 6 years service:
    // First 5 years: 0.5 * 12000 * 5 = 30,000
    // Year 6: 1.0 * 12000 * 1 = 12,000
    // Full gratuity = 42,000
    // Resignation between 5 and 10 years = 2/3 (0.666667)
    // Payable gratuity = 42,000 * (2/3) = 28,000 SAR
    expect((float) $calc['service_years'])->toBe(6.0)
        ->and((float) $calc['monthly_wage'])->toBe(12000.0)
        ->and(round((float) $calc['full_gratuity'], 0))->toBe(42000.0)
        ->and(round((float) $calc['gratuity_amount'], 0))->toBe(28000.0);

    // Leave comp: 15 days * (12000 / 30) = 15 * 400 = 6,000 SAR
    expect((float) $calc['leave_compensation_amount'])->toBe(6000.0);

    // Net payout: 28,000 + 6,000 + 1,000 - 2,000 = 33,000 SAR
    expect(round((float) $calc['net_settlement_amount'], 0))->toBe(33000.0);

    // 2. Store End of Service Settlement record
    $response = $this->post(route('hr.end-of-service.store'), [
        'employee_id' => $employee->id,
        'branch_id' => $this->branch->id,
        'termination_type' => 'resignation',
        'last_working_date' => '2026-01-01',
        'unused_leave_days' => 15,
        'other_entitlements' => 1000,
        'deductions_amount' => 2000,
        'notes' => 'Employee resigned to pursue personal business.',
    ]);

    $settlement = EndOfServiceSettlement::where('employee_id', $employee->id)->first();
    expect($settlement)->not->toBeNull()
        ->and($settlement->status)->toBe('draft');

    $response->assertRedirect(route('hr.end-of-service.show', $settlement->id));

    // 3. Settle and Post GL Journal Entry
    $settleResp = $this->post(route('hr.end-of-service.settle', $settlement->id));
    $settleResp->assertRedirect(route('hr.end-of-service.show', $settlement->id));

    $settlement->refresh();
    expect($settlement->status)->toBe('settled')
        ->and($settlement->journal_entry_id)->not->toBeNull()
        ->and($settlement->settled_at)->not->toBeNull();

    // Verify Employee is updated to 'resigned'
    $employee->refresh();
    expect($employee->status)->toBe('resigned');

    // Verify GL entry is balanced
    $journalEntry = $settlement->journalEntry;
    expect($journalEntry)->not->toBeNull()
        ->and($journalEntry->lines()->count())->toBeGreaterThan(1);

    $totalDebit = $journalEntry->lines()->sum('debit');
    $totalCredit = $journalEntry->lines()->sum('credit');
    expect((float) $totalDebit)->toBeGreaterThan(0)
        ->and(bccomp((string) $totalDebit, (string) $totalCredit, 6))->toBe(0);

    // 4. Print clearance certificate view
    $printResp = $this->get(route('hr.end-of-service.print', $settlement->id));
    $printResp->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('HR/EndOfService/Print')
            ->has('settlement')
            ->has('company')
            ->has('qrCodeDataUri')
            ->has('amountInWords')
        );
});
