<?php

use App\Models\User;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Models\ServiceInvoiceLine;
use App\Modules\Localization\Models\ZatcaLog;
use App\Modules\Localization\Services\Zatca\ZatcaClientService;
use App\Modules\Localization\Services\Zatca\ZatcaCryptographicService;
use App\Modules\Localization\Services\Zatca\ZatcaUblXmlService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
    $this->tenant = Tenant::where('slug', 'al-amal')->first();
    $this->company = Company::where('tenant_id', $this->tenant->id)->first();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();

    $this->crypto = app(ZatcaCryptographicService::class);
    $this->xmlService = app(ZatcaUblXmlService::class);
    $this->clientService = app(ZatcaClientService::class);

    $this->customer = Party::firstOrCreate(
        ['tenant_id' => $this->tenant->id, 'name' => 'Al-Mada Contracting'],
        [
            'name_ar' => 'شركة المدى للمقاولات',
            'type' => 'customer',
            'tax_id' => '310987654300003',
        ]
    );

    $this->invoice = ServiceInvoice::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'party_id' => $this->customer->id,
        'invoice_number' => 'INV-ZATCA-001',
        'date' => '2026-09-12',
        'due_date' => '2026-10-12',
        'subtotal' => 10000.00,
        'tax_rate' => 15.00,
        'tax_amount' => 1500.00,
        'total' => 11500.00,
        'amount_paid' => 0,
        'balance_due' => 11500.00,
        'currency' => 'SAR',
        'status' => 'posted',
    ]);

    ServiceInvoiceLine::create([
        'service_invoice_id' => $this->invoice->id,
        'description' => 'Consulting and Cloud Architecture Services',
        'quantity' => 1,
        'unit_price' => 10000.00,
        'subtotal' => 10000.00,
        'tax_rate' => 15.00,
        'tax_amount' => 1500.00,
        'total' => 11500.00,
    ]);
});

test('it generates ECDSA keypair, CSR, canonical invoice hash, and Phase 2 9-tag QR code', function () {
    $keys = $this->crypto->generateKeyPair();
    expect($keys)->toHaveKeys(['private_key', 'public_key'])
        ->and($keys['private_key'])->toContain('PRIVATE KEY');

    $csr = $this->crypto->generateCsr(
        $keys['private_key'],
        'EGS-TEST-UUID',
        'Al-Amal Corp',
        'Finance',
        '310123456700003'
    );
    expect($csr)->toContain('CERTIFICATE REQUEST');

    $sampleXml = '<Invoice><ID>INV-1</ID><cbc:IssueDate>2026-09-12</cbc:IssueDate></Invoice>';
    $hash = $this->crypto->computeInvoiceHash($sampleXml);
    expect($hash)->toBeString()->and(strlen($hash))->toBeGreaterThan(20);

    $signature = $this->crypto->signInvoiceHash($hash, $keys['private_key']);
    expect($signature)->toBeString()->and(strlen($signature))->toBeGreaterThan(20);

    $qr = $this->crypto->generatePhase2QrCode(
        'Al-Amal Corp',
        '310123456700003',
        '2026-09-12T10:00:00Z',
        '11500.00',
        '1500.00',
        $hash,
        $signature,
        $keys['public_key']
    );
    expect($qr)->toBeString();
    $decoded = base64_decode($qr);
    // Byte 1 should be tag 1 (0x01)
    expect(ord($decoded[0]))->toBe(1);
});

test('it generates compliant UBL 2.1 XML for standard B2B invoice', function () {
    $config = $this->clientService->getOrCreateDefaultConfig($this->company->id, $this->tenant->id);

    $xml = $this->xmlService->generateInvoiceXml(
        $this->invoice,
        $config,
        'standard',
        $config->last_invoice_hash,
        1
    );

    expect($xml)->toContain('urn:oasis:names:specification:ubl:schema:xsd:Invoice-2')
        ->and($xml)->toContain('<cbc:ProfileID>reporting:1.0</cbc:ProfileID>')
        ->and($xml)->toContain("<cbc:ID>{$this->invoice->invoice_number}</cbc:ID>")
        ->and($xml)->toContain('<cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>')
        ->and($xml)->toContain('<cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>')
        ->and($xml)->toContain('<cac:AccountingSupplierParty>')
        ->and($xml)->toContain('<cac:AccountingCustomerParty>')
        ->and($xml)->toContain('<cbc:TaxAmount currencyID="SAR">1500.00</cbc:TaxAmount>')
        ->and($xml)->toContain('<cbc:PayableAmount currencyID="SAR">11500.00</cbc:PayableAmount>');
});

test('it executes complete ZATCA onboarding flow from CSR to Production CSID', function () {
    $config = $this->clientService->getOrCreateDefaultConfig($this->company->id, $this->tenant->id);

    // 1. Request compliance CSID with OTP
    $csidResult = $this->clientService->requestComplianceCsid($config, '123456');
    expect($csidResult['success'])->toBeTrue();

    $config->refresh();
    expect($config->compliance_csid)->not->toBeNull()
        ->and($config->status)->toBe('csr_generated');

    // 2. Run compliance check to acquire production CSID
    $compResult = $this->clientService->runComplianceCheck($config);
    expect($compResult['success'])->toBeTrue();

    $config->refresh();
    expect($config->production_csid)->not->toBeNull()
        ->and($config->status)->toBe('production_ready')
        ->and($config->isReadyForProduction())->toBeTrue();
});

test('it clears standard B2B invoice with cryptographic signing, QR, and hash chaining', function () {
    $config = $this->clientService->getOrCreateDefaultConfig($this->company->id, $this->tenant->id);
    $oldCounter = $config->invoice_counter;
    $oldPih = $config->last_invoice_hash;

    $result = $this->clientService->clearStandardInvoice($this->invoice);

    expect($result['success'])->toBeTrue()
        ->and($result['status'])->toBe('cleared');

    $this->invoice->refresh();
    expect($this->invoice->zatca_status)->toBe('cleared')
        ->and($this->invoice->zatca_invoice_type)->toBe('standard')
        ->and($this->invoice->zatca_invoice_hash)->not->toBeNull()
        ->and($this->invoice->zatca_qr_code)->not->toBeNull()
        ->and($this->invoice->zatca_xml)->not->toBeNull()
        ->and($this->invoice->zatca_previous_hash)->toBe($oldPih);

    $config->refresh();
    expect($config->invoice_counter)->toBe($oldCounter + 1)
        ->and($config->last_invoice_hash)->toBe($this->invoice->zatca_invoice_hash);

    // Audit log recorded
    $log = ZatcaLog::where('service_invoice_id', $this->invoice->id)->latest()->first();
    expect($log)->not->toBeNull()
        ->and($log->action)->toBe('clearance')
        ->and($log->is_success)->toBeTrue();
});

test('it reports simplified B2C invoice to ZATCA reporting endpoint', function () {
    $result = $this->clientService->reportSimplifiedInvoice($this->invoice);

    expect($result['success'])->toBeTrue()
        ->and($result['status'])->toBe('reported');

    $this->invoice->refresh();
    expect($this->invoice->zatca_status)->toBe('reported')
        ->and($this->invoice->zatca_invoice_type)->toBe('simplified');
});

test('it renders ZATCA settings and supports web transmissions and XML download', function () {
    // 1. ZATCA Dashboard page
    $this->actingAs($this->user)
        ->get('/settings/zatca')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/Zatca/Index')
            ->has('config')
            ->has('metrics')
        );

    // 2. Update config via web
    $this->actingAs($this->user)
        ->put('/settings/zatca/config', [
            'environment' => 'simulation',
            'simulation_mode' => true,
            'vat_number' => '310999999900003',
            'branch_name' => 'Jeddah Branch',
            'organization_name' => 'Al-Amal Jeddah Corp',
            'egs_custom_id' => 'CASHIER-02',
        ])
        ->assertRedirect();

    // 3. Web Invoice Transmission
    $this->actingAs($this->user)
        ->post("/invoices/{$this->invoice->id}/zatca/transmit", [
            'type' => 'standard',
        ])
        ->assertRedirect();

    $this->invoice->refresh();
    expect($this->invoice->zatca_status)->toBe('cleared');

    // 4. Download signed XML
    $xmlResponse = $this->actingAs($this->user)
        ->get("/invoices/{$this->invoice->id}/zatca/xml");

    $xmlResponse->assertOk()
        ->assertHeader('Content-Type', 'application/xml');
});
