<?php

use App\Models\User;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\AuditLog;
use App\Modules\Platform\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed initial dataset
    $this->seed();
});

test('tenant a user can view their own customers but not tenant b customers', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $tenantB = Tenant::where('slug', 'al-binaa')->firstOrFail();

    $partyA = Party::where('tenant_id', $tenantA->id)->firstOrFail();
    $partyB = Party::where('tenant_id', $tenantB->id)->firstOrFail();

    $response = $this->actingAs($userA)
        ->get(route('customers.index'));

    $response->assertOk();
    $response->assertSee($partyA->name);
    $response->assertDontSee($partyB->name);
});

test('tenant a user cannot delete a customer belonging to tenant b', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantB = Tenant::where('slug', 'al-binaa')->firstOrFail();
    $partyB = Party::where('tenant_id', $tenantB->id)->firstOrFail();

    $response = $this->actingAs($userA)
        ->delete(route('customers.destroy', $partyB->id));

    $response->assertForbidden();

    // Verify party B still exists in database (without tenant A's scope)
    expect(Party::withoutGlobalScopes()->find($partyB->id))->not->toBeNull();
});

test('user cannot switch to a tenant they do not belong to', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantB = Tenant::where('slug', 'al-binaa')->firstOrFail();

    $response = $this->actingAs($userA)
        ->post(route('context.tenant'), [
            'tenant_id' => $tenantB->id,
        ]);

    $response->assertNotFound();
    expect(session('active_tenant_id'))->not->toBe($tenantB->id);
});

test('user cannot switch to a company belonging to another tenant', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantB = Tenant::where('slug', 'al-binaa')->firstOrFail();
    $companyB = Company::where('tenant_id', $tenantB->id)->firstOrFail();

    $response = $this->actingAs($userA)
        ->post(route('context.company'), [
            'company_id' => $companyB->id,
        ]);

    $response->assertNotFound();
    expect(session('active_company_id'))->not->toBe($companyB->id);
});

test('customer creation generates audit log with explicit tenant and company scope', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();
    $tenantA = Tenant::where('slug', 'al-amal')->firstOrFail();
    $companyA1 = Company::where('tenant_id', $tenantA->id)->firstOrFail();

    $response = $this->actingAs($userA)
        ->post(route('customers.store'), [
            'name' => 'New Test Customer Ltd',
            'name_ar' => 'شركة العميل التجريبي الجديد',
            'type' => 'customer',
            'tax_id' => '300999888777003',
            'email' => 'testcustomer@example.com',
            'phone' => '+966551234567',
            'credit_limit' => 75000,
            'payment_terms_days' => 45,
        ]);

    $response->assertRedirect(route('customers.index'));

    $createdParty = Party::where('tax_id', '300999888777003')->first();
    expect($createdParty)->not->toBeNull()
        ->and($createdParty->tenant_id)->toBe($tenantA->id);

    $auditLog = AuditLog::where('action', 'party.created')
        ->where('entity_id', $createdParty->id)
        ->first();

    expect($auditLog)->not->toBeNull()
        ->and($auditLog->tenant_id)->toBe($tenantA->id)
        ->and($auditLog->company_id)->toBe($companyA1->id)
        ->and($auditLog->user_id)->toBe($userA->id);
});

test('locale switch updates session and user preference', function () {
    $userA = User::where('email', 'admin@alamal.com')->firstOrFail();

    $response = $this->actingAs($userA)
        ->post(route('context.locale'), [
            'locale' => 'en',
        ]);

    $response->assertRedirect();
    expect(session('locale'))->toBe('en');
    expect($userA->fresh()->locale)->toBe('en');

    $response2 = $this->actingAs($userA)
        ->post(route('context.locale'), [
            'locale' => 'ar',
        ]);

    $response2->assertRedirect();
    expect(session('locale'))->toBe('ar');
    expect($userA->fresh()->locale)->toBe('ar');
});
