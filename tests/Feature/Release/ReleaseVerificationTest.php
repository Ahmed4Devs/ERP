<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Contracting\Actions\ApproveAndBillProgressClaimAction;
use App\Modules\Contracting\Models\ContractingClaim;
use App\Modules\CRM\Models\Lead;
use App\Modules\CRM\Services\ConvertLeadAction;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Inventory\Services\InventoryCostingEngine;
use App\Modules\Manufacturing\Actions\CompleteProductionOrderAction;
use App\Modules\Manufacturing\Models\ProductionOrder;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Models\VendorProfile;
use App\Modules\Retail\Actions\ClosePosSessionAction;
use App\Modules\Retail\Actions\CompletePosSaleAction;
use App\Modules\Retail\Actions\OpenPosSessionAction;
use App\Modules\Retail\Models\PosSession;
use App\Modules\Retail\Models\PosTerminal;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Services\ConvertQuotationToOrderAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
});

test('comprehensive enterprise lifecycle verification: lead to order, procurement, manufacturing, retail pos with zatca, contracting, and ledger balance', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // -------------------------------------------------------------------------
    // 1. CRM & COMMERCIAL: Lead -> Customer -> Quote -> Sales Order
    // -------------------------------------------------------------------------
    $lead = Lead::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'lead_number' => 'LD-REL-001',
        'title' => 'Enterprise Cloud ERP Deployment',
        'contact_name' => 'Tariq Al-Mansoor',
        'email' => 'tariq@mansoorgroup.sa',
        'phone' => '+966501234567',
        'company_name' => 'Mansoor Contracting Group',
        'source' => 'referral',
        'status' => 'qualified',
        'estimated_value' => '40000.000000',
        'probability_percent' => 85,
        'assigned_user_id' => $userA->id,
    ]);

    $convertLeadAction = app(ConvertLeadAction::class);
    $conversionResult = $convertLeadAction->execute($lead);

    expect($conversionResult['party'])->not->toBeNull()
        ->and($conversionResult['party']->type)->toBe('customer')
        ->and($conversionResult['quotation'])->not->toBeNull();

    $convertedCustomer = $conversionResult['party'];
    $quotation = $conversionResult['quotation'];

    // Convert Quotation to Confirmed Sales Order
    $quotation->update(['status' => 'accepted']);
    $convertQuoteAction = app(ConvertQuotationToOrderAction::class);
    $salesOrder = $convertQuoteAction->execute($quotation, now()->addDays(30)->toDateString());

    expect($salesOrder)->toBeInstanceOf(SalesOrder::class)
        ->and($salesOrder->status)->toBe('confirmed')
        ->and((float) $salesOrder->total_amount)->toBe(44000.0);

    // -------------------------------------------------------------------------
    // 2. PROCUREMENT & INVENTORY: Component Receipt & Vendor Bill
    // -------------------------------------------------------------------------
    $vendorProfile = VendorProfile::where('company_id', $companyA->id)->firstOrFail();
    $lap = Product::where('company_id', $companyA->id)->where('sku', 'PRD-LAP-001')->firstOrFail();
    $mon = Product::where('company_id', $companyA->id)->where('sku', 'PRD-MON-001')->firstOrFail();
    $chair = Product::where('company_id', $companyA->id)->where('sku', 'PRD-CHAIR-001')->firstOrFail();
    $bundle = Product::where('company_id', $companyA->id)->where('sku', 'PRD-BUNDLE-001')->firstOrFail();

    $productionOrder = ProductionOrder::where('company_id', $companyA->id)->where('order_number', 'MO-2026-0001')->firstOrFail();
    $warehouse = Warehouse::findOrFail($productionOrder->source_warehouse_id);

    // Costing engine receives components into the manufacturing warehouse
    $costingEngine = app(InventoryCostingEngine::class);
    $costingEngine->receiveStock([
        'company_id' => $companyA->id,
        'tenant_id' => $tenantA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $lap->id,
        'quantity' => '10.000000',
        'unit_cost' => '3500.000000',
    ]);
    $costingEngine->receiveStock([
        'company_id' => $companyA->id,
        'tenant_id' => $tenantA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $mon->id,
        'quantity' => '10.000000',
        'unit_cost' => '1200.000000',
    ]);
    $costingEngine->receiveStock([
        'company_id' => $companyA->id,
        'tenant_id' => $tenantA->id,
        'warehouse_id' => $warehouse->id,
        'product_id' => $chair->id,
        'quantity' => '10.000000',
        'unit_cost' => '600.000000',
    ]);

    // Post Vendor Bill for the components
    $expenseAccount = Account::where('company_id', $companyA->id)->where('code', '5200')->firstOrFail();
    $this->actingAs($userA)->post(route('vendor-bills.store'), [
        'vendor_id' => $vendorProfile->id,
        'vendor_bill_number' => 'VB-REL-2026-001',
        'bill_date' => now()->toDateString(),
        'due_date' => now()->addDays(30)->toDateString(),
        'expense_account_id' => $expenseAccount->id,
        'lines' => [
            [
                'description' => 'Procurement of IT Components Batch',
                'quantity' => 10,
                'unit_price' => 5300.00,
            ],
        ],
    ]);

    $vendorBill = VendorBill::where('party_id', $vendorProfile->party_id)->latest('created_at')->firstOrFail();
    expect((float) $vendorBill->balance_due)->toBe(58300.00) // 53000 + 10% tax
        ->and($vendorBill->status)->toBe('posted');

    // -------------------------------------------------------------------------
    // 3. MANUFACTURING: BOM -> Production Order -> Complete & Rollup
    // -------------------------------------------------------------------------
    $productionOrder = ProductionOrder::where('company_id', $companyA->id)->where('order_number', 'MO-2026-0001')->firstOrFail();
    $completeAction = app(CompleteProductionOrderAction::class);
    $completedOrder = $completeAction->execute([
        'production_order_id' => $productionOrder->id,
        'produced_quantity' => '5.000000',
    ]);

    expect($completedOrder->status)->toBe('completed')
        ->and((float) $completedOrder->produced_quantity)->toBe(5.0)
        ->and((float) $completedOrder->total_material_cost)->toBe(26500.0)
        ->and((float) $completedOrder->unit_material_cost)->toBe(5300.0);

    // -------------------------------------------------------------------------
    // 4. RETAIL POS: Shift Open -> ZATCA QR Sale -> Stock Relief -> Shift Close
    // -------------------------------------------------------------------------
    $terminal = PosTerminal::where('company_id', $companyA->id)->where('code', 'POS-RUH-01')->firstOrFail();

    // Close any previous open session
    PosSession::where('terminal_id', $terminal->id)->update(['status' => 'closed', 'closed_at' => now()]);

    $openPosAction = app(OpenPosSessionAction::class);
    $posSession = $openPosAction->execute([
        'terminal_id' => $terminal->id,
        'opening_cash' => '1000.000000',
        'user_id' => $userA->id,
        'notes' => 'Release Verification POS Shift',
    ]);

    $posSaleAction = app(CompletePosSaleAction::class);
    $posOrder = $posSaleAction->execute([
        'session_id' => $posSession->id,
        'customer_id' => $convertedCustomer->id,
        'payment_method' => 'cash',
        'cash_tendered' => '10000.000000',
        'items' => [
            [
                'product_id' => $lap->id,
                'quantity' => '2.000000',
                'unit_price' => '4500.000000',
                'description' => 'Dell Laptop',
            ],
        ],
    ]);

    expect((float) $posOrder->total_amount)->toBe(9900.0) // 9000 + 900 VAT
        ->and((float) $posOrder->change_due)->toBe(100.0)
        ->and($posOrder->qr_payload)->not->toBeEmpty();

    // Verify ZATCA QR is valid Base64 TLV
    $decodedBinary = base64_decode((string) $posOrder->qr_payload, true);
    expect($decodedBinary)->not->toBeFalse()
        ->and(ord($decodedBinary[0]))->toBe(1);

    // Close POS session
    $closePosAction = app(ClosePosSessionAction::class);
    $closedSession = $closePosAction->execute([
        'session_id' => $posSession->id,
        'closing_cash' => '10900.000000', // 1000 opening + 9900 cash sale
        'notes' => 'Shift balanced perfectly',
    ]);

    expect($closedSession->status)->toBe('closed')
        ->and((float) $closedSession->cash_difference)->toBe(0.0);

    // -------------------------------------------------------------------------
    // 5. CONTRACTING: Progress Claim with 5% Retention & Service Invoice Billing
    // -------------------------------------------------------------------------
    $claim = ContractingClaim::where('company_id', $companyA->id)->firstOrFail();
    $billClaimAction = app(ApproveAndBillProgressClaimAction::class);
    $billedClaim = $billClaimAction->execute([
        'claim_id' => $claim->id,
    ]);

    expect($billedClaim->status)->toBe('billed')
        ->and($billedClaim->invoice_id)->not->toBeNull()
        ->and((float) $billedClaim->current_work_amount)->toBe(75000.0)
        ->and((float) $billedClaim->retention_amount)->toBe(3750.0)
        ->and((float) $billedClaim->net_claim_amount)->toBe(71250.0)
        ->and((float) $billedClaim->tax_amount)->toBe(7125.0)
        ->and((float) $billedClaim->total_amount)->toBe(78375.0);

    // -------------------------------------------------------------------------
    // 6. GENERAL LEDGER INTEGRITY AUDIT & TRIAL BALANCE EQUILIBRIUM
    // -------------------------------------------------------------------------
    $entries = JournalEntry::where('company_id', $companyA->id)->with('lines')->get();
    expect($entries->count())->toBeGreaterThan(0);

    foreach ($entries as $entry) {
        $entryDebit = '0.000000';
        $entryCredit = '0.000000';
        foreach ($entry->lines as $line) {
            $entryDebit = bcadd($entryDebit, (string) $line->debit, 6);
            $entryCredit = bcadd($entryCredit, (string) $line->credit, 6);
        }
        expect(bccomp($entryDebit, $entryCredit, 6))->toBe(
            0,
            "Journal entry {$entry->entry_number} is unbalanced! DR: {$entryDebit}, CR: {$entryCredit}"
        );
    }

    // Run audit command directly
    $this->artisan('audit:verify-ledgers')
        ->assertSuccessful()
        ->expectsOutputToContain('INTEGRITY AUDIT PASSED');

    // Run backup drill command directly
    $this->artisan('backup:verify-drill')
        ->assertSuccessful()
        ->expectsOutputToContain('BACKUP VERIFICATION DRILL COMPLETED SUCCESSFULLY');
});
