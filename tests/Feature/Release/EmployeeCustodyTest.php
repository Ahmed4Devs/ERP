<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\HR\Actions\DisburseEmployeeCustodyAction;
use App\Modules\HR\Models\Employee;
use App\Modules\HR\Models\EmployeeCustody;
use App\Modules\HR\Models\EmployeeCustodyExpenseLine;
use App\Modules\HR\Models\EmployeeCustodySettlement;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
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
    $this->employee = Employee::where('company_id', $this->company->id)->firstOrFail();

    $this->bankAccount = Account::where('company_id', $this->company->id)->where('code', '1020')->first()
        ?? Account::where('company_id', $this->company->id)->where('type', 'asset')->firstOrFail();

    $this->expenseAccount = Account::where('company_id', $this->company->id)->where('code', '5100')->first()
        ?? Account::where('company_id', $this->company->id)->where('type', 'expense')->firstOrFail();
});

test('it creates and disburses an employee custody advance with automated GL double entry posting', function () {
    // 1. Create custody via HTTP endpoint
    $response = $this->actingAs($this->user)->post(route('hr.custodies.store'), [
        'employee_id' => $this->employee->id,
        'branch_id' => $this->branch->id,
        'type' => 'temporary',
        'purpose' => 'Riyadh Site Operational Procurement',
        'amount' => '5000.00',
        'disbursement_method' => 'bank_transfer',
        'disbursement_account_id' => $this->bankAccount->id,
        'auto_disburse' => true,
        'notes' => 'Urgent procurement advance',
    ]);

    $response->assertRedirect();

    $custody = EmployeeCustody::where('company_id', $this->company->id)
        ->where('employee_id', $this->employee->id)
        ->latest()
        ->firstOrFail();

    expect($custody->status)->toBe('disbursed')
        ->and($custody->custody_number)->toContain('CUST-')
        ->and((float) $custody->amount)->toBe(5000.0)
        ->and((float) $custody->current_balance)->toBe(5000.0)
        ->and($custody->disbursed_at)->not->toBeNull()
        ->and($custody->journal_entry_id)->not->toBeNull();

    // 2. Verify GL Journal Entry
    $journal = JournalEntry::with('lines.account')->findOrFail($custody->journal_entry_id);
    expect($journal->source_type)->toBe('employee_custody_disbursement')
        ->and($journal->source_id)->toBe($custody->id);

    $debitLine = $journal->lines->where('debit', '>', 0)->first();
    $creditLine = $journal->lines->where('credit', '>', 0)->first();

    // DR 1140 Employee Custodies & Advances
    expect($debitLine)->not->toBeNull()
        ->and($debitLine->account->code)->toBe('1140')
        ->and((float) $debitLine->debit)->toBe(5000.0);

    // CR Bank Account 1020
    expect($creditLine)->not->toBeNull()
        ->and($creditLine->account_id)->toBe($this->bankAccount->id)
        ->and((float) $creditLine->credit)->toBe(5000.0);
});

test('it settles custody expense vouchers, separates 15% ZATCA input VAT, and handles cash refund clearance', function () {
    // 1. Setup an active disbursed custody of 5,000 SAR
    $custody = EmployeeCustody::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'employee_id' => $this->employee->id,
        'custody_number' => 'CUST-TEST-001',
        'type' => 'temporary',
        'purpose' => 'Site Supplies',
        'amount' => '5000.000000',
        'current_balance' => '5000.000000',
        'status' => 'approved',
        'disbursement_method' => 'bank_transfer',
        'disbursement_account_id' => $this->bankAccount->id,
    ]);

    $disburseAction = app(DisburseEmployeeCustodyAction::class);
    $disburseAction->execute($custody, $this->user->id);

    expect($custody->fresh()->status)->toBe('disbursed');

    // 2. Submit settlement:
    // Line 1: Subtotal 2000 SAR + 15% VAT (300 SAR) = 2300 SAR
    // Line 2: Subtotal 1000 SAR + 15% VAT (150 SAR) = 1150 SAR
    // Total Claimed = 3450 SAR
    // Cash Refund to Treasury = 1550 SAR (3450 + 1550 = 5000 SAR)
    $response = $this->actingAs($this->user)->post(route('hr.custodies.settle.store', $custody->id), [
        'settlement_date' => now()->toDateString(),
        'refund_amount' => '1550.00',
        'reimbursement_amount' => '0',
        'notes' => 'Final settlement and clearance',
        'lines' => [
            [
                'expense_account_id' => $this->expenseAccount->id,
                'vendor_name' => 'Saudi Tools & Hardware Co.',
                'vendor_tax_number' => '310123456700003',
                'invoice_number' => 'INV-8821',
                'invoice_date' => now()->toDateString(),
                'subtotal' => '2000.00',
                'tax_rate' => 0.15,
                'description' => 'Industrial Equipment & Drill Set',
            ],
            [
                'expense_account_id' => $this->expenseAccount->id,
                'vendor_name' => 'Riyadh Electric Supplies Ltd',
                'vendor_tax_number' => '310987654300003',
                'invoice_number' => 'INV-4412',
                'invoice_date' => now()->toDateString(),
                'subtotal' => '1000.00',
                'tax_rate' => 0.15,
                'description' => 'Heavy Duty Cables & Breakers',
            ],
        ],
    ]);

    $response->assertRedirect();

    $custody->refresh();
    $settlement = EmployeeCustodySettlement::where('custody_id', $custody->id)->latest()->firstOrFail();

    expect($settlement->status)->toBe('posted')
        ->and((float) $settlement->total_expenses_amount)->toBe(3000.0)
        ->and((float) $settlement->total_tax_amount)->toBe(450.0)
        ->and((float) $settlement->total_claimed_amount)->toBe(3450.0)
        ->and((float) $settlement->refund_amount)->toBe(1550.0)
        ->and($settlement->journal_entry_id)->not->toBeNull();

    // Verify custody clearance
    expect((float) $custody->current_balance)->toBe(0.0)
        ->and($custody->status)->toBe('closed');

    // 3. Verify Journal Entry
    $journal = JournalEntry::with('lines.account')->findOrFail($settlement->journal_entry_id);

    // Debits:
    // Line 1: 2000.0 to 5100
    // Line 2: 1000.0 to 5100
    // Tax: 450.0 to 1150 / 2150
    // Refund: 1550.0 to Bank
    // Total Debits = 5000.0 SAR
    // Credit: 5000.0 to Custody 1140
    $totalDebits = $journal->lines->sum('debit');
    $totalCredits = $journal->lines->sum('credit');

    expect((float) $totalDebits)->toBe(5000.0)
        ->and((float) $totalCredits)->toBe(5000.0);

    $custodyCreditLine = $journal->lines->where('credit', '>', 0)->first();
    expect($custodyCreditLine->account->code)->toBe('1140')
        ->and((float) $custodyCreditLine->credit)->toBe(5000.0);

    $vatDebitLine = $journal->lines->where('account.code', '1150')->first()
        ?? $journal->lines->where('account.code', '2150')->first();
    expect($vatDebitLine)->not->toBeNull()
        ->and((float) $vatDebitLine->debit)->toBe(450.0);
});

test('it renders the custody settlement print voucher with Tafqeet', function () {
    $custody = EmployeeCustody::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'employee_id' => $this->employee->id,
        'custody_number' => 'CUST-PRINT-001',
        'type' => 'temporary',
        'purpose' => 'Print Test Custody',
        'amount' => '1000.000000',
        'current_balance' => '0.000000',
        'status' => 'closed',
    ]);

    $settlement = EmployeeCustodySettlement::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'custody_id' => $custody->id,
        'settlement_number' => 'ST-PRINT-001',
        'settlement_date' => now()->toDateString(),
        'total_expenses_amount' => '869.570000',
        'total_tax_amount' => '130.430000',
        'total_claimed_amount' => '1000.000000',
        'status' => 'posted',
    ]);

    EmployeeCustodyExpenseLine::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'settlement_id' => $settlement->id,
        'expense_account_id' => $this->expenseAccount->id,
        'vendor_name' => 'Al-Amal Store',
        'subtotal' => '869.570000',
        'tax_rate' => '0.150000',
        'tax_amount' => '130.430000',
        'total' => '1000.000000',
        'description' => 'General Stationery',
    ]);

    $response = $this->actingAs($this->user)
        ->get(route('hr.custodies.settlements.print', $settlement->id));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('HR/Custodies/Print')
            ->has('settlement.settlement_number')
            ->has('company')
            ->has('tafqeet')
        );
});
