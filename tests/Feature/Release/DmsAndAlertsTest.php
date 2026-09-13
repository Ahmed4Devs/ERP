<?php

use App\Models\User;
use App\Modules\Inventory\Models\GoodsReceipt;
use App\Modules\Inventory\Models\InventoryLevel;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Attachment;
use App\Modules\Platform\Models\SystemAlert;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Platform\Services\AlertEngineService;
use App\Modules\Platform\Services\AttachmentService;
use App\Modules\Treasury\Models\BankGuarantee;
use App\Modules\Treasury\Models\Cheque;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed();
    $this->tenant = Tenant::where('slug', 'al-amal')->first();
    $this->company = Company::where('tenant_id', $this->tenant->id)->first();
    app(CurrentTenant::class)->set($this->tenant);
    app(CurrentCompany::class)->set($this->company);

    $this->user = User::where('email', 'admin@alamal.com')->firstOrFail();
    $this->warehouse = Warehouse::where('company_id', $this->company->id)->first();

    $this->attachmentService = app(AttachmentService::class);
    $this->alertEngine = app(AlertEngineService::class);

    Storage::fake('local');
    $this->withoutVite();
});

test('it uploads, lists, downloads, and deletes polymorphic attachments via DMS', function () {
    $this->actingAs($this->user);

    $vendor = Party::where('tenant_id', $this->tenant->id)->first();
    $grn = GoodsReceipt::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'warehouse_id' => $this->warehouse->id,
        'party_id' => $vendor->id,
        'receipt_number' => 'GRN-DMS-001',
        'date' => '2026-09-13',
        'status' => 'draft',
        'total_cost' => 1000.00,
    ]);

    // 1. Upload file via HTTP endpoint
    $file = UploadedFile::fake()->create('customs_declaration.pdf', 1024, 'application/pdf');

    $response = $this->postJson('/attachments', [
        'file' => $file,
        'attachable_type' => GoodsReceipt::class,
        'attachable_id' => $grn->id,
        'category' => 'tax_document',
        'description' => 'Customs official clearance document',
    ]);

    $response->assertCreated();
    $attachmentId = $response->json('attachment.id');
    expect($attachmentId)->not->toBeNull();

    $attachment = Attachment::find($attachmentId);
    expect($attachment)->not->toBeNull()
        ->and($attachment->file_name)->toBe('customs_declaration.pdf')
        ->and($attachment->category)->toBe('tax_document')
        ->and($attachment->attachable_type)->toBe(GoodsReceipt::class)
        ->and($attachment->attachable_id)->toBe($grn->id);

    // 2. List attachments for model
    $listResponse = $this->getJson('/attachments?attachable_type='.urlencode(GoodsReceipt::class)."&attachable_id={$grn->id}");
    $listResponse->assertOk()
        ->assertJsonCount(1);

    // 3. Download attachment
    $downloadResponse = $this->get("/attachments/{$attachment->id}/download");
    $downloadResponse->assertOk();

    // 4. Delete attachment
    $deleteResponse = $this->deleteJson("/attachments/{$attachment->id}");
    $deleteResponse->assertOk();

    expect(Attachment::find($attachment->id))->toBeNull();
});

test('it scans and generates automated alerts for maturing cheques, expiring guarantees, and low stock', function () {
    $this->actingAs($this->user);

    // 1. Create a PDC cheque due in 3 days
    $cheque = Cheque::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'cheque_number' => 'CHQ-DUE-999',
        'type' => 'received',
        'bank_name' => 'Riyad Bank',
        'drawer_name' => 'Horizon Co.',
        'issue_date' => '2026-09-01',
        'due_date' => now()->addDays(3)->toDateString(),
        'amount' => 75000.00,
        'currency' => 'SAR',
        'status' => 'in_safe',
    ]);

    // 2. Create an active Bank Guarantee expiring in 5 days
    $bg = BankGuarantee::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'guarantee_number' => 'BG-EXP-111',
        'type' => 'performance_bond',
        'issuing_bank' => 'SNB',
        'beneficiary_name' => 'Ministry of Transport',
        'issue_date' => '2026-01-01',
        'expiry_date' => now()->addDays(5)->toDateString(),
        'amount' => 500000.00,
        'margin_percentage' => 10.00,
        'margin_amount' => 50000.00,
        'commission_amount' => 2500.00,
        'status' => 'active',
    ]);

    // 3. Set a product stock to 2 units (low stock)
    $product = Product::where('company_id', $this->company->id)->first();
    InventoryLevel::updateOrCreate(
        ['warehouse_id' => $this->warehouse->id, 'product_id' => $product->id],
        ['quantity_on_hand' => 2, 'quantity_reserved' => 0]
    );

    // Run scanner
    $count = $this->alertEngine->scanAllAlerts($this->company->id);
    expect($count)->toBeGreaterThanOrEqual(3);

    // Verify alerts created in database
    $chequeAlert = SystemAlert::where('company_id', $this->company->id)
        ->where('alert_type', 'cheque_due')
        ->where('source_id', $cheque->id)
        ->first();
    expect($chequeAlert)->not->toBeNull()
        ->and($chequeAlert->severity)->toBe('warning');

    $bgAlert = SystemAlert::where('company_id', $this->company->id)
        ->where('alert_type', 'guarantee_expiring')
        ->where('source_id', $bg->id)
        ->first();
    expect($bgAlert)->not->toBeNull()
        ->and($bgAlert->severity)->toBe('critical');

    $stockAlert = SystemAlert::where('company_id', $this->company->id)
        ->where('alert_type', 'low_stock')
        ->where('source_id', $product->id)
        ->first();
    expect($stockAlert)->not->toBeNull();

    // 4. Test unread count API endpoint
    $countResponse = $this->getJson('/alerts/unread-count');
    $countResponse->assertOk()
        ->assertJsonStructure(['unread_count', 'recent']);
    expect($countResponse->json('unread_count'))->toBeGreaterThanOrEqual(3);

    // 5. Test mark as read
    $readResponse = $this->postJson("/alerts/{$chequeAlert->id}/read");
    $readResponse->assertOk();
    $chequeAlert->refresh();
    expect($chequeAlert->is_read)->toBeTrue();

    // 6. Test dismiss
    $dismissResponse = $this->postJson("/alerts/{$bgAlert->id}/dismiss");
    $dismissResponse->assertOk();
    $bgAlert->refresh();
    expect($bgAlert->is_dismissed)->toBeTrue();

    // 7. Test Alerts page view
    $indexResponse = $this->get('/alerts');
    $indexResponse->assertOk();
});

test('it executes erp check alerts artisan command successfully', function () {
    $this->artisan('erp:check-alerts', ['--company' => $this->company->id])
        ->assertSuccessful();
});
