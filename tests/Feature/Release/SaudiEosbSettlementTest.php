<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\EmployeeCustody;
use App\Modules\HR\Models\EmployeeLoan;
use App\Modules\HR\Models\EndOfServiceSettlement;
use App\Modules\HR\Services\EndOfServiceCalculator;
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

    $this->tenant = Tenant::where('slug', 'al-amal')->firstOrFail();
    $this->company = Company::where('tenant_id', $this->tenant->id)->firstOrFail();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $this->branch = Branch::where('company_id', $this->company->id)->firstOrFail();

    // Create Corporate Bank Account 1020
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

    // Create Provision Account 2160
    $this->provisionAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '2160'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'End of Service Indemnity Provision',
            'name_ar' => 'مخصص مكافأة نهاية الخدمة',
            'type' => 'liability',
            'subtype' => 'payroll_payable',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '100000.000000',
        ]
    );

    // Create Advances/Custody Account 1140
    $this->advancesAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '1140'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Employee Advances & Custodies',
            'name_ar' => 'سلف وقروض وعهد الموظفين',
            'type' => 'asset',
            'subtype' => 'receivable',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '50000.000000',
        ]
    );

    // Create Entitlements Expense Account 5120
    $this->expenseAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '5120'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Leave Compensation & Termination Entitlements',
            'name_ar' => 'تعويضات الإجازات ومستحقات نهاية الخدمة',
            'type' => 'expense',
            'subtype' => 'operating_expense',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '0.000000',
        ]
    );
});

test('calculates accurate Saudi Labor Law Article 84 and 85 gratuities', function () {
    $calculator = app(EndOfServiceCalculator::class);

    // Employee hired exactly 6 years ago with 10,000 SAR gross wage (7000 base + 2000 house + 1000 trans)
    $hireDate = Carbon::now()->subYears(6)->toDateString();
    $lastWorkingDate = Carbon::now()->toDateString();

    $emp = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'employee_number' => 'EMP-TEST-84',
        'first_name' => 'Tariq',
        'last_name' => 'Al-Harbi',
        'first_name_ar' => 'طارق',
        'last_name_ar' => 'الحربي',
        'email' => 'tariq@example.com',
        'hire_date' => $hireDate,
        'status' => 'active',
        'basic_salary' => '7000.00',
        'housing_allowance' => '2000.00',
        'transport_allowance' => '1000.00',
        'other_allowances' => '0.00',
    ]);

    // 1. Article 84: Employer termination or contract end
    // First 5 years @ 0.5 month = 5 * 5,000 = 25,000
    // 6th year @ 1.0 month = 1 * 10,000 = 10,000
    // Total Gratuity = 35,000 SAR (100%)
    $res84 = $calculator->calculate($emp, 'employer_termination', $lastWorkingDate);
    expect((float) $res84['monthly_wage'])->toBe(10000.0)
        ->and((float) $res84['entitlement_rate'])->toBe(1.0)
        ->and(round((float) $res84['gratuity_amount'], 2))->toBe(35000.0);

    // 2. Article 85: Resignation
    // 6 years service is in the range [5 to 10 years] -> Entitlement factor is 2/3 (66.67%)
    // 35,000 * 2/3 = 23,333.33 SAR
    $res85 = $calculator->calculate($emp, 'resignation', $lastWorkingDate);
    expect((float) $res85['entitlement_rate'])->toBeGreaterThan(0.66)
        ->and(round((float) $res85['gratuity_amount'], 2))->toBe(23333.35);

    // 3. Short service resignation (<2 years): 0%
    $shortEmp = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'employee_number' => 'EMP-TEST-SHORT',
        'first_name' => 'Fahad',
        'last_name' => 'Al-Otaibi',
        'email' => 'fahad@example.com',
        'hire_date' => Carbon::now()->subMonths(18)->toDateString(),
        'status' => 'active',
        'basic_salary' => '6000.00',
        'housing_allowance' => '1500.00',
        'transport_allowance' => '500.00',
        'other_allowances' => '0.00',
    ]);
    $resShort = $calculator->calculate($shortEmp, 'resignation', $lastWorkingDate);
    expect((float) $resShort['entitlement_rate'])->toBe(0.0)
        ->and((float) $resShort['gratuity_amount'])->toBe(0.0);
});

test('completes full end-of-service settlement with leave compensation and custody deduction', function () {
    // Employee with 5 years service, 12,000 SAR gross wage
    $hireDate = Carbon::now()->subYears(5)->toDateString();
    $lastDate = Carbon::now()->toDateString();

    $employee = Employee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'employee_number' => 'EMP-SETTLE-01',
        'first_name' => 'Sultan',
        'last_name' => 'Al-Ghamdi',
        'first_name_ar' => 'سلطان',
        'last_name_ar' => 'الغامدي',
        'email' => 'sultan@example.com',
        'hire_date' => $hireDate,
        'status' => 'active',
        'basic_salary' => '9000.00',
        'housing_allowance' => '2000.00',
        'transport_allowance' => '1000.00',
        'other_allowances' => '0.00',
    ]);

    // Active custody for employee that needs clearance: 3,000 SAR
    $custody = EmployeeCustody::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'employee_id' => $employee->id,
        'custody_number' => 'CUST-009',
        'type' => 'operational',
        'purpose' => 'Field operational petty cash',
        'amount' => '3000.00',
        'current_balance' => '3000.00',
        'status' => 'disbursed',
    ]);

    // Active loan for employee: 2,000 SAR remaining
    $loan = EmployeeLoan::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'employee_id' => $employee->id,
        'loan_number' => 'LOAN-004',
        'total_amount' => '5000.00',
        'monthly_installment' => '1000.00',
        'installments_count' => 5,
        'paid_amount' => '3000.00',
        'remaining_amount' => '2000.00',
        'start_date' => Carbon::now()->subMonths(3)->toDateString(),
        'status' => 'active',
        'reason' => 'Emergency advance',
    ]);

    // 1. Preview Calculation API
    $previewResponse = $this->actingAs($this->user)
        ->postJson(route('hr.end-of-service.preview'), [
            'employee_id' => $employee->id,
            'termination_type' => 'contract_end',
            'last_working_date' => $lastDate,
            'unused_leave_days' => 15, // 15 days @ 400/day = 6,000 SAR
            'other_entitlements' => 1000,
            'deductions_amount' => 5000, // 3,000 custody + 2,000 loan
        ]);

    $previewResponse->assertOk()
        ->assertJsonStructure([
            'hire_date',
            'last_working_date',
            'service_years',
            'monthly_wage',
            'gratuity_amount',
            'leave_compensation_amount',
            'net_settlement_amount',
        ]);

    // Gratuity: 5 years * (12,000 / 2) = 30,000 SAR
    // Leave: 15 * (12,000 / 30) = 6,000 SAR
    // Other: 1,000 SAR
    // Deductions: 5,000 SAR
    // Net Settlement: 30,000 + 6,000 + 1,000 - 5,000 = 32,000 SAR
    $previewData = $previewResponse->json();
    expect(round((float) $previewData['gratuity_amount'], 2))->toBe(30000.0)
        ->and(round((float) $previewData['leave_compensation_amount'], 2))->toBe(6000.0)
        ->and(round((float) $previewData['net_settlement_amount'], 2))->toBe(32000.0);

    // 2. Store Draft Settlement
    $storeResponse = $this->actingAs($this->user)
        ->post(route('hr.end-of-service.store'), [
            'employee_id' => $employee->id,
            'branch_id' => $this->branch->id,
            'termination_type' => 'contract_end',
            'last_working_date' => $lastDate,
            'unused_leave_days' => 15,
            'other_entitlements' => 1000,
            'deductions_amount' => 5000,
            'notes' => 'Final settlement contract end and full clearance.',
        ]);

    $settlement = EndOfServiceSettlement::where('employee_id', $employee->id)->firstOrFail();
    $storeResponse->assertRedirect(route('hr.end-of-service.show', $settlement->id));

    expect($settlement->status)->toBe('draft')
        ->and((float) $settlement->net_settlement_amount)->toBe(32000.0);

    // 3. Execute Final Settlement & GL Posting
    $settleResponse = $this->actingAs($this->user)
        ->post(route('hr.end-of-service.settle', $settlement->id));

    $settleResponse->assertRedirect(route('hr.end-of-service.show', $settlement->id));

    $settlement->refresh();
    $employee->refresh();
    $custody->refresh();
    $loan->refresh();

    // Verify Settlement and Employee Status
    expect($settlement->status)->toBe('settled')
        ->and($settlement->settled_at)->not->toBeNull()
        ->and($settlement->journal_entry_id)->not->toBeNull()
        ->and($employee->status)->toBe('terminated');

    // Verify Active Custody and Loan were Cleared by Deductions
    expect((float) $custody->current_balance)->toBe(0.0)
        ->and($custody->status)->toBe('settled')
        ->and((float) $loan->remaining_amount)->toBe(0.0)
        ->and($loan->status)->toBe('fully_paid');

    // Verify General Ledger Journal Entry
    $journal = JournalEntry::with('lines.account')->findOrFail($settlement->journal_entry_id);
    expect($journal->status)->toBe('posted');

    // Expected Journal Lines:
    // DR 2160 (EOSB Provision): 30,000 SAR
    // DR 5120 (Leave & Entitlements): 7,000 SAR (6,000 leave + 1,000 other)
    // CR 1140 (Employee Advances/Custody): 5,000 SAR
    // CR 1020 (Bank Account): 32,000 SAR
    $totalDebits = (float) $journal->lines->sum('debit');
    $totalCredits = (float) $journal->lines->sum('credit');

    expect($totalDebits)->toBe(37000.0)
        ->and($totalCredits)->toBe(37000.0);

    $provisionLine = $journal->lines->firstWhere('account_id', $this->provisionAccount->id);
    expect($provisionLine)->not->toBeNull()
        ->and((float) $provisionLine->debit)->toBe(30000.0);

    $bankLine = $journal->lines->firstWhere('account_id', $this->bankAccount->id);
    expect($bankLine)->not->toBeNull()
        ->and((float) $bankLine->credit)->toBe(32000.0);

    $advancesLine = $journal->lines->firstWhere('account_id', $this->advancesAccount->id);
    expect($advancesLine)->not->toBeNull()
        ->and((float) $advancesLine->credit)->toBe(5000.0);

    // 4. Test Printable Clearance Voucher & Schedule Export
    $printResponse = $this->actingAs($this->user)
        ->get(route('hr.end-of-service.print', $settlement->id));
    $printResponse->assertOk();

    $csvResponse = $this->actingAs($this->user)
        ->get(route('hr.end-of-service.export-schedule'));
    $csvResponse->assertOk()
        ->assertHeader('Content-Disposition', 'attachment; filename=EOSB_Liability_Schedule_'.now()->toDateString().'.csv');
});
