<?php

use App\Models\User;
use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\UnitOfMeasure;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Trade\Models\PriceList;
use App\Modules\Trade\Models\PriceListItem;
use App\Modules\Trade\Models\Promotion;
use App\Modules\Trade\Services\EvaluatePromotionsService;
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
    $this->unit = UnitOfMeasure::where('tenant_id', $this->tenant->id)->first()
        ?? UnitOfMeasure::firstOrFail();

    // Create 2 test products
    $this->productA = Product::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'unit_id' => $this->unit->id,
        'sku' => 'PROD-A',
        'name' => 'Premium Olive Oil 1L',
        'name_ar' => 'زيت زيتون بكر ممتاز 1 لتر',
        'type' => 'storable',
        'list_price' => '50.00',
        'cost_price' => '30.00',
        'is_active' => true,
    ]);

    $this->productB = Product::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'unit_id' => $this->unit->id,
        'sku' => 'PROD-B',
        'name' => 'Organic Honey 500g',
        'name_ar' => 'عسل سدر طبيعي 500 جم',
        'type' => 'storable',
        'list_price' => '100.00',
        'cost_price' => '60.00',
        'is_active' => true,
    ]);
});

test('it creates a new BOGO promotion via HTTP endpoint', function () {
    $response = $this->actingAs($this->user)->post(route('trade.promotions.store'), [
        'name' => 'Buy 2 Get 1 Free Promo',
        'name_ar' => 'عرض اشترِ 2 واحصل على 1 مجاناً',
        'code' => 'BOGO2026',
        'type' => 'bogo',
        'buy_product_id' => $this->productA->id,
        'buy_quantity' => 2,
        'get_product_id' => $this->productA->id,
        'get_quantity' => 1,
        'get_discount_percentage' => 100,
        'apply_automatically' => true,
        'is_active' => true,
    ]);

    $response->assertRedirect(route('trade.promotions.index'));
    $response->assertSessionHas('success');

    $promo = Promotion::where('company_id', $this->company->id)
        ->where('code', 'BOGO2026')
        ->first();

    expect($promo)->not->toBeNull();
    expect($promo->type)->toBe('bogo');
    expect((float) $promo->buy_quantity)->toBe(2.0);
    expect((float) $promo->get_discount_percentage)->toBe(100.0);
});

test('it accurately evaluates BOGO discounts and rewards in cart evaluation service', function () {
    // 1. Create BOGO: Buy 2 Olive Oils (Product A), Get 1 Olive Oil 100% Free
    Promotion::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Buy 2 Get 1 Free',
        'name_ar' => 'اشترِ 2 واحصل على 1 مجاناً',
        'code' => 'BOGO-A',
        'type' => 'bogo',
        'buy_product_id' => $this->productA->id,
        'buy_quantity' => 2,
        'get_product_id' => $this->productA->id,
        'get_quantity' => 1,
        'get_discount_percentage' => 100,
        'apply_automatically' => true,
        'is_active' => true,
    ]);

    $evalService = app(EvaluatePromotionsService::class);

    // Cart with 3 units of Product A (2 paid + 1 free): Total = 3 * 50 = 150 SAR. Promo discount = 50 SAR. Net = 100 SAR.
    $result = $evalService->evaluate($this->company->id, [
        [
            'product_id' => $this->productA->id,
            'quantity' => 3,
        ],
    ]);

    expect($result['subtotal'])->toEqual(150);
    expect($result['total_discount'])->toEqual(50);
    expect($result['net_total'])->toEqual(100);
    // 15% VAT on 100 SAR = 15 SAR
    expect($result['tax_amount'])->toEqual(15);
    expect($result['grand_total'])->toEqual(115);
    expect($result['applied_promotions'])->toHaveCount(1);
    expect($result['applied_promotions'][0]['type'])->toBe('bogo');
});

test('it combines tiered wholesale volume pricing with cart-level promotions', function () {
    // 1. Create Price List with Volume Tiers for Product B:
    // 1-9 units: 100 SAR each
    // 10+ units: 80 SAR each (20% discount)
    $priceList = PriceList::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'code' => 'WHOLESALE',
        'name' => 'Wholesale Tiered List',
        'currency' => 'SAR',
        'is_default' => true,
        'is_active' => true,
    ]);

    PriceListItem::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'price_list_id' => $priceList->id,
        'product_id' => $this->productB->id,
        'min_quantity' => 1,
        'price' => '100.00',
        'discount_percentage' => 0,
    ]);

    PriceListItem::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'price_list_id' => $priceList->id,
        'product_id' => $this->productB->id,
        'min_quantity' => 10,
        'price' => '80.00',
        'discount_percentage' => 0,
    ]);

    // 2. Create a Cart Promotion: 10% off on orders over 500 SAR
    Promotion::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => '10% Cart Discount',
        'name_ar' => 'خصم 10% على السلة',
        'type' => 'percentage',
        'discount_rate' => 10,
        'min_order_amount' => 500,
        'apply_automatically' => true,
        'is_active' => true,
    ]);

    // Order 10 units of Product B:
    // Wholesale tier unit price = 80 SAR
    // Subtotal = 10 * 80 = 800 SAR
    // Promo discount 10% on 800 SAR = 80 SAR
    // Net total = 720 SAR
    // Tax 15% on 720 = 108 SAR
    // Grand total = 828 SAR
    $response = $this->actingAs($this->user)->postJson(route('trade.promotions.evaluate'), [
        'items' => [
            [
                'product_id' => $this->productB->id,
                'quantity' => 10,
            ],
        ],
        'price_list_id' => $priceList->id,
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['subtotal'])->toEqual(800);
    expect($data['total_discount'])->toEqual(80);
    expect($data['net_total'])->toEqual(720);
    expect($data['tax_amount'])->toEqual(108);
    expect($data['grand_total'])->toEqual(828);
});

test('it toggles promotion active status', function () {
    $promo = Promotion::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Seasonal Promo',
        'type' => 'fixed_amount',
        'fixed_discount_amount' => 25,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->user)->post(route('trade.promotions.toggle', $promo->id));
    $response->assertRedirect();

    $promo->refresh();
    expect($promo->is_active)->toBeFalse();

    // Toggle back
    $this->actingAs($this->user)->post(route('trade.promotions.toggle', $promo->id));
    $promo->refresh();
    expect($promo->is_active)->toBeTrue();
});
