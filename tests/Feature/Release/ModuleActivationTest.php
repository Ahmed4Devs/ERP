<?php

use App\Models\User;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Platform\Services\ModuleRegistry;
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
    $this->registry = app(ModuleRegistry::class);
});

test('it enables all modules by default for unconfigured companies ensuring zero regression', function () {
    // Unconfigured company has null/empty module settings
    $enabled = $this->registry->getEnabledModulesForCompany($this->company);
    $allModules = $this->registry->getAllModules();

    expect($enabled)->toBe(array_keys($allModules))
        ->and(count($enabled))->toBe(11)
        ->and($this->registry->isModuleEnabled('manufacturing', $this->company))->toBeTrue()
        ->and($this->registry->isModuleEnabled('contracting', $this->company))->toBeTrue()
        ->and($this->registry->isModuleEnabled('retail_pos', $this->company))->toBeTrue();

    // Route access is permitted
    $response = $this->actingAs($this->user)->get(route('manufacturing.orders.index'));
    $response->assertOk();
});

test('it allows customizing and updating enabled modules for a company', function () {
    // Disable manufacturing, contracting, and retail_pos
    $newModules = ['financials', 'sales', 'purchasing', 'inventory', 'hr_payroll'];

    $response = $this->actingAs($this->user)
        ->post(route('settings.modules.update'), [
            'enabled_modules' => $newModules,
        ]);

    $response->assertRedirect();
    $this->company->refresh();

    $enabled = $this->registry->getEnabledModulesForCompany($this->company);

    expect($enabled)->toContain('financials')
        ->and($enabled)->toContain('sales')
        ->and($enabled)->toContain('purchasing')
        ->and($enabled)->toContain('inventory')
        ->and($enabled)->toContain('hr_payroll')
        ->and($enabled)->not->toContain('manufacturing')
        ->and($enabled)->not->toContain('contracting')
        ->and($enabled)->not->toContain('retail_pos');

    expect($this->registry->isModuleEnabled('manufacturing', $this->company))->toBeFalse()
        ->and($this->registry->isModuleEnabled('sales', $this->company))->toBeTrue();
});

test('it always enforces Core Financials even if omitted from custom update', function () {
    // Attempt to update without 'financials'
    $this->actingAs($this->user)
        ->post(route('settings.modules.update'), [
            'enabled_modules' => ['sales', 'inventory'],
        ]);

    $this->company->refresh();
    $enabled = $this->registry->getEnabledModulesForCompany($this->company);

    expect($enabled)->toContain('financials')
        ->and($this->registry->isModuleEnabled('financials', $this->company))->toBeTrue();
});

test('it blocks access to disabled modules via route middleware with friendly redirection and JSON 403', function () {
    // Disable manufacturing
    $this->registry->updateCompanyModules($this->company, ['financials', 'sales', 'purchasing']);

    // 1. Web request: should redirect to dashboard with error flash message
    $webResponse = $this->actingAs($this->user)->get(route('manufacturing.orders.index'));
    $webResponse->assertRedirect(route('dashboard'))
        ->assertSessionHas('error');

    // 2. JSON request: should return HTTP 403 with error payload
    $jsonResponse = $this->actingAs($this->user)
        ->getJson(route('manufacturing.orders.index'));

    $jsonResponse->assertStatus(403)
        ->assertJson([
            'module' => 'manufacturing',
            'is_enabled' => false,
        ]);

    // 3. Enabled module remains accessible
    $salesResponse = $this->actingAs($this->user)->get(route('sales.orders.index'));
    $salesResponse->assertOk();
});

test('it applies industry bundle presets accurately', function () {
    // 1. Apply Retail & POS preset
    $retailResponse = $this->actingAs($this->user)
        ->post(route('settings.modules.preset'), [
            'preset' => 'retail',
        ]);

    $retailResponse->assertRedirect();
    $this->company->refresh();

    $retailModules = $this->registry->getEnabledModulesForCompany($this->company);
    expect($retailModules)->toContain('retail_pos')
        ->and($retailModules)->toContain('inventory')
        ->and($retailModules)->toContain('sales')
        ->and($retailModules)->toContain('financials')
        ->and($retailModules)->not->toContain('manufacturing')
        ->and($retailModules)->not->toContain('contracting');

    // 2. Apply Industrial & Manufacturing preset
    $mfgResponse = $this->actingAs($this->user)
        ->post(route('settings.modules.preset'), [
            'preset' => 'manufacturing',
        ]);

    $mfgResponse->assertRedirect();
    $this->company->refresh();

    $mfgModules = $this->registry->getEnabledModulesForCompany($this->company);
    expect($mfgModules)->toContain('manufacturing')
        ->and($mfgModules)->toContain('fixed_assets')
        ->and($mfgModules)->not->toContain('retail_pos');

    // 3. Apply Full Enterprise Suite
    $allResponse = $this->actingAs($this->user)
        ->post(route('settings.modules.preset'), [
            'preset' => 'all',
        ]);

    $allResponse->assertRedirect();
    $this->company->refresh();

    $allModules = $this->registry->getEnabledModulesForCompany($this->company);
    expect(count($allModules))->toBe(11);
});

test('it renders the module management screen with all modules and presets', function () {
    $response = $this->actingAs($this->user)
        ->get(route('settings.modules.index'));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Platform/Modules/Index')
            ->has('modules', 11)
            ->has('presets', 6)
            ->has('enabledModules')
            ->has('company')
        );
});
