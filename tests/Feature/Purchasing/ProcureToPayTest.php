<?php

use App\Models\User;
use App\Modules\Accounting\Exceptions\PostingConflictException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Models\VendorProfile;
use App\Modules\Purchasing\Queries\AccountsPayableAgingQuery;
use App\Modules\Purchasing\Services\PostVendorBillAction;
use App\Modules\Treasury\Models\TreasuryTransfer;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
});

test('purchase order is created in draft status and can be approved', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $vendor = VendorProfile::where('company_id', $companyA->id)->firstOrFail();

    // 1. Create Purchase Order
    $response = $this->actingAs($userA)->post(route('purchase-orders.store'), [
        'vendor_id' => $vendor->id,
        'order_date' => '2026-03-10',
        'expected_delivery_date' => '2026-03-25',
        'notes' => 'Hardware components and monitors',
        'lines' => [
            [
                'description' => '27-inch 4K Monitors',
                'quantity' => 2,
                'unit_price' => 1500.00,
            ],
            [
                'description' => 'Wireless Keyboards & Mice',
                'quantity' => 5,
                'unit_price' => 200.00,
            ],
        ],
    ]);

    $response->assertRedirect();

    $po = PurchaseOrder::where('party_id', $vendor->party_id)->latest('created_at')->first();
    expect($po)->not->toBeNull()
        ->and((float) $po->subtotal)->toBe(4000.00)
        ->and((float) $po->tax_rate)->toBe(0.10)
        ->and((float) $po->tax_amount)->toBe(400.00)
        ->and((float) $po->total)->toBe(4400.00)
        ->and($po->status)->toBe('draft')
        ->and($po->lines)->toHaveCount(2);

    // 2. Approve Purchase Order
    $approveResponse = $this->actingAs($userA)->post(route('purchase-orders.approve', $po->id));
    $approveResponse->assertRedirect();

    $po->refresh();
    expect($po->status)->toBe('approved');
});

test('vendor bill posts atomically with 10% test tax and balances Debit Expense + Debit Input Tax vs Credit AP', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $vendor = VendorProfile::where('company_id', $companyA->id)->firstOrFail();

    $expenseAccount = Account::where('company_id', $companyA->id)->where('code', '5200')->firstOrFail();
    $inputTaxAccount = Account::where('company_id', $companyA->id)->where('code', '1150')->firstOrFail();
    $apAccount = Account::where('company_id', $companyA->id)->where('code', '2010')->firstOrFail();

    $initialApBalance = (float) $apAccount->current_balance;
    $initialInputTaxBalance = (float) $inputTaxAccount->current_balance;

    $response = $this->actingAs($userA)->post(route('vendor-bills.store'), [
        'vendor_id' => $vendor->id,
        'vendor_bill_number' => 'INV-SUP-2026-001',
        'bill_date' => '2026-03-12',
        'due_date' => '2026-04-12',
        'expense_account_id' => $expenseAccount->id,
        'notes' => 'Cloud infrastructure & software licenses',
        'lines' => [
            [
                'description' => 'Server Cloud Hosting - March 2026',
                'quantity' => 1,
                'unit_price' => 2000.00,
            ],
        ],
    ]);

    $response->assertRedirect();

    $bill = VendorBill::where('party_id', $vendor->party_id)->latest('created_at')->first();
    expect($bill)->not->toBeNull()
        ->and((float) $bill->subtotal)->toBe(2000.00)
        ->and((float) $bill->tax_rate)->toBe(0.10)
        ->and((float) $bill->tax_amount)->toBe(200.00)
        ->and((float) $bill->total)->toBe(2200.00)
        ->and((float) $bill->balance_due)->toBe(2200.00)
        ->and((float) $bill->amount_paid)->toBe(0.00)
        ->and($bill->status)->toBe('posted');

    // Verify balanced Journal Entry
    $journal = $bill->journalEntry;
    expect($journal)->not->toBeNull()
        ->and($journal->status)->toBe('posted')
        ->and($journal->lines)->toHaveCount(3);

    $totalDebit = (float) $journal->lines->sum('debit');
    $totalCredit = (float) $journal->lines->sum('credit');
    expect($totalDebit)->toBe(2200.00)
        ->and($totalCredit)->toBe(2200.00);

    // Verify AP account credit balance increased by 2,200.00
    $apAccount->refresh();
    expect((float) $apAccount->current_balance)->toBe($initialApBalance + 2200.00);

    // Verify 1150 Input Tax debit balance increased by 200.00
    $inputTaxAccount->refresh();
    expect((float) $inputTaxAccount->current_balance)->toBe($initialInputTaxBalance + 200.00);
});

test('vendor payment with allocations decrements bill balance due and updates status to partially_paid and paid', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $vendor = VendorProfile::where('company_id', $companyA->id)->firstOrFail();

    $expenseAccount = Account::where('company_id', $companyA->id)->where('code', '5200')->firstOrFail();
    $bankAccount = Account::where('company_id', $companyA->id)->where('code', '1020')->firstOrFail();
    $apAccount = Account::where('company_id', $companyA->id)->where('code', '2010')->firstOrFail();

    // 1. Create a Vendor Bill for 1,000 + 10% (100) = 1,100
    $this->actingAs($userA)->post(route('vendor-bills.store'), [
        'vendor_id' => $vendor->id,
        'vendor_bill_number' => 'BILL-XYZ-101',
        'bill_date' => '2026-03-10',
        'due_date' => '2026-04-10',
        'expense_account_id' => $expenseAccount->id,
        'lines' => [
            [
                'description' => 'Network switches maintenance',
                'quantity' => 1,
                'unit_price' => 1000.00,
            ],
        ],
    ]);

    $bill = VendorBill::where('party_id', $vendor->party_id)->latest('created_at')->firstOrFail();
    expect((float) $bill->balance_due)->toBe(1100.00);

    // 2. Partial Payment of 500.00 from Bank 1020
    $this->actingAs($userA)->post(route('vendor-payments.store'), [
        'vendor_id' => $vendor->id,
        'bank_account_id' => $bankAccount->id,
        'payment_date' => '2026-03-15',
        'payment_method' => 'bank_transfer',
        'amount' => 500.00,
        'allocations' => [
            [
                'vendor_bill_id' => $bill->id,
                'amount' => 500.00,
            ],
        ],
    ]);

    $bill->refresh();
    expect((float) $bill->amount_paid)->toBe(500.00)
        ->and((float) $bill->balance_due)->toBe(600.00)
        ->and($bill->status)->toBe('partially_paid');

    // 3. Full Settlement Payment of 600.00 from Bank 1020
    $this->actingAs($userA)->post(route('vendor-payments.store'), [
        'vendor_id' => $vendor->id,
        'bank_account_id' => $bankAccount->id,
        'payment_date' => '2026-03-20',
        'payment_method' => 'bank_transfer',
        'amount' => 600.00,
        'allocations' => [
            [
                'vendor_bill_id' => $bill->id,
                'amount' => 600.00,
            ],
        ],
    ]);

    $bill->refresh();
    expect((float) $bill->amount_paid)->toBe(1100.00)
        ->and((float) $bill->balance_due)->toBe(0.00)
        ->and($bill->status)->toBe('paid');
});

test('treasury transfer moves funds atomically and posts balanced double-entry GL', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    $cashAccount = Account::where('company_id', $companyA->id)->where('code', '1010')->firstOrFail();
    $bankAccount = Account::where('company_id', $companyA->id)->where('code', '1020')->firstOrFail();

    $initialCashBalance = (float) $cashAccount->current_balance;
    $initialBankBalance = (float) $bankAccount->current_balance;

    $response = $this->actingAs($userA)->post(route('treasury.transfers.store'), [
        'from_account_id' => $cashAccount->id,
        'to_account_id' => $bankAccount->id,
        'transfer_date' => '2026-03-15',
        'amount' => 3000.00,
        'reference_number' => 'DEP-00912',
        'description' => 'Cash deposit to main bank account',
    ]);

    $response->assertRedirect();

    $transfer = TreasuryTransfer::where('company_id', $companyA->id)->latest('created_at')->first();
    expect($transfer)->not->toBeNull()
        ->and((float) $transfer->amount)->toBe(3000.00)
        ->and($transfer->from_account_id)->toBe($cashAccount->id)
        ->and($transfer->to_account_id)->toBe($bankAccount->id);

    // Verify balanced GL entry: DR 1020 Bank, CR 1010 Cash
    $journal = $transfer->journalEntry;
    expect($journal)->not->toBeNull()
        ->and($journal->status)->toBe('posted')
        ->and($journal->lines)->toHaveCount(2);

    $debitLine = $journal->lines->where('account_id', $bankAccount->id)->first();
    $creditLine = $journal->lines->where('account_id', $cashAccount->id)->first();

    expect((float) $debitLine->debit)->toBe(3000.00)
        ->and((float) $creditLine->credit)->toBe(3000.00);

    // Verify account balances
    $cashAccount->refresh();
    $bankAccount->refresh();
    expect((float) $cashAccount->current_balance)->toBe($initialCashBalance - 3000.00)
        ->and((float) $bankAccount->current_balance)->toBe($initialBankBalance + 3000.00);
});

test('treasury transfer rejects transfer to the same account', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $bankAccount = Account::where('company_id', $companyA->id)->where('code', '1020')->firstOrFail();

    $response = $this->actingAs($userA)->post(route('treasury.transfers.store'), [
        'from_account_id' => $bankAccount->id,
        'to_account_id' => $bankAccount->id,
        'transfer_date' => '2026-03-15',
        'amount' => 1000.00,
    ]);

    $response->assertSessionHasErrors(['to_account_id']);
});

test('accounts payable aging query classifies unpaid vendor bills by age brackets accurately', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $vendor = VendorProfile::where('company_id', $companyA->id)->firstOrFail();
    $expenseAccount = Account::where('company_id', $companyA->id)->where('code', '5200')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $action = app(PostVendorBillAction::class);

    // Bill 1: Current (due in 5 days relative to asOfDate 2026-04-01) -> due_date 2026-03-25 is 7 days overdue -> current bracket (0-30)
    $action->execute([
        'vendor_id' => $vendor->id,
        'bill_date' => '2026-03-01',
        'due_date' => '2026-03-20', // 12 days overdue relative to 2026-04-01 -> 0-30 days
        'expense_account_id' => $expenseAccount->id,
        'lines' => [
            ['description' => 'Item 1', 'quantity' => 1, 'unit_price' => 1000.00],
        ],
    ]);

    // Bill 2: 45 days overdue relative to 2026-04-01 -> due_date 2026-02-15 -> days_31_60 bracket
    $action->execute([
        'vendor_id' => $vendor->id,
        'bill_date' => '2026-02-01',
        'due_date' => '2026-02-15',
        'expense_account_id' => $expenseAccount->id,
        'lines' => [
            ['description' => 'Item 2', 'quantity' => 1, 'unit_price' => 2000.00],
        ],
    ]);

    $query = app(AccountsPayableAgingQuery::class);
    $report = $query->execute('2026-04-01');

    expect($report)->not->toBeEmpty();
    $vendorRow = collect($report)->firstWhere('vendor_id', $vendor->id);
    expect($vendorRow)->not->toBeNull()
        ->and((float) $vendorRow['current'])->toBe(1100.00) // 1000 + 10%
        ->and((float) $vendorRow['days_31_60'])->toBe(2200.00) // 2000 + 10%
        ->and((float) $vendorRow['total'])->toBe(3300.00);
});

test('posting vendor bill throws conflict if already posted', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $vendor = VendorProfile::where('company_id', $companyA->id)->firstOrFail();
    $expenseAccount = Account::where('company_id', $companyA->id)->where('code', '5200')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $action = app(PostVendorBillAction::class);
    $bill = $action->execute([
        'vendor_id' => $vendor->id,
        'bill_date' => '2026-03-01',
        'due_date' => '2026-03-20',
        'expense_account_id' => $expenseAccount->id,
        'lines' => [
            ['description' => 'Item 1', 'quantity' => 1, 'unit_price' => 500.00],
        ],
    ]);

    expect($bill->status)->toBe('posted');

    // Attempting to post the same bill again must throw PostingConflictException
    expect(fn () => $action->execute(['id' => $bill->id]))
        ->toThrow(PostingConflictException::class);
});
