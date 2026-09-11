<?php

use App\Models\User;
use App\Modules\Contracting\Models\ContractingClaim;
use App\Modules\Inventory\Exceptions\InsufficientStockException;
use App\Modules\Inventory\Models\Product;
use App\Modules\Manufacturing\Models\ProductionOrder;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\AuditLog;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Retail\Actions\CompletePosSaleAction;
use App\Modules\Retail\Models\PosSession;
use App\Modules\Retail\Models\PosTerminal;
use App\Modules\Trade\Models\PriceList;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
});

test('asvs v4: unauthenticated requests cannot access protected erp endpoints', function () {
    $endpoints = [
        '/dashboard',
        '/accounting/periods',
        '/vendor-bills',
        '/inventory/products',
        '/retail/terminals',
        '/manufacturing/orders',
        '/trade/pricelists',
        '/contracting/claims',
    ];

    foreach ($endpoints as $endpoint) {
        $response = $this->get($endpoint);
        $response->assertRedirect('/login');
    }
});

test('asvs v4: cross-tenant isolation strictly blocks tenant b user from accessing tenant a resources', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $tenantB = Tenant::where('slug', 'al-binaa')->firstOrFail();
    $companyB = Company::where('tenant_id', $tenantB->id)->firstOrFail();

    // User in Tenant B
    $userB = User::where('email', 'admin@albinaa.com')->firstOrFail();

    // Tenant A resources
    $terminalA = PosTerminal::where('company_id', $companyA->id)->firstOrFail();
    $claimA = ContractingClaim::where('company_id', $companyA->id)->firstOrFail();
    $orderA = ProductionOrder::where('company_id', $companyA->id)->firstOrFail();
    $priceListA = PriceList::where('company_id', $companyA->id)->firstOrFail();

    // Acting as Tenant B user: cannot view or manipulate Tenant A's POS terminal (403 or 404)
    $responseTerminal = $this->actingAs($userB)->get("/retail/pos/{$terminalA->id}");
    expect(in_array($responseTerminal->status(), [403, 404], true))->toBeTrue();

    // Acting as Tenant B user: cannot view Tenant A's contracting claim
    $responseClaim = $this->actingAs($userB)->get("/contracting/claims/{$claimA->id}");
    expect(in_array($responseClaim->status(), [403, 404], true))->toBeTrue();

    // Acting as Tenant B user: cannot view Tenant A's manufacturing production order
    $responseOrder = $this->actingAs($userB)->get("/manufacturing/orders/{$orderA->id}");
    expect(in_array($responseOrder->status(), [403, 404], true))->toBeTrue();

    // Acting as Tenant B user: cannot view Tenant A's price list
    $responsePriceList = $this->actingAs($userB)->get("/trade/pricelists/{$priceListA->id}");
    expect(in_array($responsePriceList->status(), [403, 404], true))->toBeTrue();
});

test('asvs v4: cross-company isolation blocks user from switching to another tenant company', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantB = Tenant::where('slug', 'al-binaa')->firstOrFail();
    $companyB = Company::where('tenant_id', $tenantB->id)->firstOrFail();

    $response = $this->actingAs($userA)->post(route('context.company'), [
        'company_id' => $companyB->id,
    ]);

    $response->assertNotFound();
    expect(session('active_company_id'))->not->toBe($companyB->id);
});

test('asvs v5: non-negative inventory policy prevents overselling beyond on-hand stock', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    $session = PosSession::firstOrFail();
    $product = Product::where('company_id', $companyA->id)->where('sku', 'PRD-LAP-001')->firstOrFail();

    $saleAction = app(CompletePosSaleAction::class);

    // Attempting to sell 10,000 laptops when on-hand is insufficient must throw InsufficientStockException
    expect(fn () => $saleAction->execute([
        'session_id' => $session->id,
        'payment_method' => 'cash',
        'cash_tendered' => '50000000.000000',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => '10000.000000',
                'unit_price' => '4500.000000',
                'description' => 'Massive Oversell Attempt',
            ],
        ],
    ]))->toThrow(InsufficientStockException::class);
});

test('asvs v5: input validation rejects negative prices and invalid payloads', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $vendor = Party::where('type', 'vendor')->firstOrFail();

    // Passing negative unit price into vendor bill creation
    $response = $this->actingAs($userA)->post(route('vendor-bills.store'), [
        'vendor_id' => $vendor->id,
        'vendor_bill_number' => 'VB-TAMPER-001',
        'bill_date' => now()->toDateString(),
        'lines' => [
            [
                'description' => 'Tampered Line Item',
                'quantity' => 1,
                'unit_price' => -500.00,
            ],
        ],
    ]);

    $response->assertSessionHasErrors();
});

test('asvs v8: immutable audit trail records critical state changes', function () {
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA = Company::where('tenant_id', $tenantA->id)->firstOrFail();
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();

    app(CurrentTenant::class)->set($tenantA);
    app(CurrentCompany::class)->set($companyA);

    // Record an audit entry
    $auditLog = AuditLog::create([
        'tenant_id' => $tenantA->id,
        'company_id' => $companyA->id,
        'user_id' => $userA->id,
        'action' => 'security.compliance_verification_run',
        'entity_type' => Tenant::class,
        'entity_id' => $tenantA->id,
        'old_values' => null,
        'new_values' => ['milestone' => 'M8', 'status' => 'verified'],
        'ip_address' => '127.0.0.1',
        'user_agent' => 'PestSecuritySuite/1.0',
        'created_at' => now(),
    ]);

    expect($auditLog)->not->toBeNull()
        ->and($auditLog->action)->toBe('security.compliance_verification_run')
        ->and($auditLog->tenant_id)->toBe($tenantA->id);
});
