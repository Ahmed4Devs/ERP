<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Assets\Models\AssetCategory;
use App\Modules\Assets\Models\FixedAsset;
use App\Modules\Assets\Models\FixedAssetDisposal;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
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
    $this->branch = Branch::where('company_id', $this->company->id)->first() ?? Branch::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'name' => 'Main Branch',
        'code' => 'MAIN-01',
    ]);

    // Ensure Asset GL Accounts exist
    $this->assetAccount = Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '1500'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Machinery & Equipment', 'name_ar' => 'الآلات والمعدات', 'type' => 'asset', 'subtype' => 'fixed_asset',
    ]);

    $this->accDepAccount = Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '1590'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Accumulated Depreciation - Machinery', 'name_ar' => 'مجمع إهلاك الآلات والمعدات', 'type' => 'asset', 'subtype' => 'accumulated_depreciation',
    ]);

    $this->depExpAccount = Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '5200'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Depreciation Expense', 'name_ar' => 'مصروف إهلاك الأصول الثابتة', 'type' => 'expense', 'subtype' => 'operating_expense',
    ]);

    $this->bankAccount = Account::firstOrCreate(['company_id' => $this->company->id, 'code' => '1020'], [
        'tenant_id' => $this->tenant->id, 'name' => 'Al-Rajhi Bank Main Account', 'name_ar' => 'حساب بنك الراجحي الرئيسي', 'type' => 'asset', 'subtype' => 'bank',
    ]);

    $this->category = AssetCategory::firstOrCreate(
        ['company_id' => $this->company->id, 'name' => 'Industrial Machinery'],
        [
            'tenant_id' => $this->tenant->id,
            'code' => 'CAT-MACH-01',
            'useful_life_months' => 60,
            'depreciation_method' => 'straight_line',
            'asset_account_id' => $this->assetAccount->id,
            'accumulated_depreciation_account_id' => $this->accDepAccount->id,
            'depreciation_expense_account_id' => $this->depExpAccount->id,
        ]
    );
});

test('asset sale with capital gain lifecycle and automated GL postings', function () {
    // 1. Visit Index page
    $indexResponse = $this->actingAs($this->user)->get('/assets/disposals');
    $indexResponse->assertOk();
    $indexResponse->assertInertia(fn ($page) => $page->component('Assets/Disposals/Index'));

    // 2. Visit Create page
    $createResponse = $this->actingAs($this->user)->get('/assets/disposals/create');
    $createResponse->assertOk();
    $createResponse->assertInertia(fn ($page) => $page->component('Assets/Disposals/Create'));

    // 3. Create Fixed Asset for sale
    $asset = FixedAsset::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'category_id' => $this->category->id,
        'asset_tag' => 'AST-MACH-771',
        'name' => 'CNC Milling Machine Model X',
        'name_ar' => 'ماكينة تفريز صناعية CNC',
        'serial_number' => 'SN-CNC-9901',
        'purchase_date' => now()->subMonths(36)->toDateString(),
        'in_service_date' => now()->subMonths(36)->toDateString(),
        'acquisition_cost' => '50000.000000',
        'salvage_value' => '5000.000000',
        'useful_life_months' => 60,
        'depreciation_method' => 'straight_line',
        'accumulated_depreciation' => '30000.000000',
        'net_book_value' => '20000.000000',
        'status' => 'active',
        'asset_account_id' => $this->assetAccount->id,
        'accumulated_depreciation_account_id' => $this->accDepAccount->id,
        'depreciation_expense_account_id' => $this->depExpAccount->id,
    ]);

    // 4. Record Sale Disposal with Proceeds = 25,000 (Gain = 5,000)
    $disposalData = [
        'fixed_asset_id' => $asset->id,
        'disposal_date' => now()->toDateString(),
        'disposal_type' => 'sale',
        'proceeds' => 25000.0,
        'bank_account_id' => $this->bankAccount->id,
        'buyer_name' => 'Saudi Heavy Equipment Buyers LLC',
        'reason' => 'Upgrade to automated 5-axis unit',
        'notes' => 'Inspected and certified by maintenance manager',
    ];

    $storeResponse = $this->actingAs($this->user)->post('/assets/disposals', $disposalData);
    $disposal = FixedAssetDisposal::where('fixed_asset_id', $asset->id)->first();
    expect($disposal)->not->toBeNull();
    $storeResponse->assertRedirect("/assets/disposals/{$disposal->id}");

    expect((float) $disposal->acquisition_cost)->toBe(50000.0)
        ->and((float) $disposal->accumulated_depreciation)->toBe(30000.0)
        ->and((float) $disposal->net_book_value)->toBe(20000.0)
        ->and((float) $disposal->proceeds)->toBe(25000.0)
        ->and($disposal->gain_loss_type)->toBe('gain')
        ->and((float) $disposal->gain_loss_amount)->toBe(5000.0)
        ->and($disposal->status)->toBe('draft');

    // 5. View Show page
    $showResponse = $this->actingAs($this->user)->get("/assets/disposals/{$disposal->id}");
    $showResponse->assertOk();
    $showResponse->assertInertia(fn ($page) => $page->component('Assets/Disposals/Show'));

    // 6. Post Disposal
    $postResponse = $this->actingAs($this->user)->post("/assets/disposals/{$disposal->id}/post");
    $postResponse->assertRedirect("/assets/disposals/{$disposal->id}");

    $disposal->refresh();
    $asset->refresh();

    expect($disposal->status)->toBe('posted')
        ->and($disposal->journal_entry_id)->not->toBeNull()
        ->and($asset->status)->toBe('disposed')
        ->and((float) $asset->net_book_value)->toBe(0.0);

    // Verify GL Journal Entry
    // DR Bank 1020: 25,000
    // DR Acc Dep 1590: 30,000
    // CR Asset 1500: 50,000
    // CR Gain on Disposal 4300: 5,000
    $journal = $disposal->journalEntry;
    expect($journal)->not->toBeNull();

    $drBank = $journal->lines->where('account_id', $this->bankAccount->id)->first();
    $drAccDep = $journal->lines->where('account_id', $this->accDepAccount->id)->first();
    $crAsset = $journal->lines->where('account_id', $this->assetAccount->id)->first();
    $gainAccount = Account::where('company_id', $this->company->id)->where('code', '4300')->first();
    $crGain = $journal->lines->where('account_id', $gainAccount->id)->first();

    expect((float) $drBank->debit)->toBe(25000.0)
        ->and((float) $drAccDep->debit)->toBe(30000.0)
        ->and((float) $crAsset->credit)->toBe(50000.0)
        ->and((float) $crGain->credit)->toBe(5000.0);

    // 7. View Print Certificate
    $printResponse = $this->actingAs($this->user)->get("/assets/disposals/{$disposal->id}/print");
    $printResponse->assertOk();
    $printResponse->assertInertia(fn ($page) => $page->component('Assets/Disposals/Print')
        ->has('qrCodeDataUri')
        ->has('amountInWords')
    );
});

test('asset scrap and write-off lifecycle with loss on disposal', function () {
    // 1. Create Fixed Asset for scrap
    $asset = FixedAsset::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'branch_id' => $this->branch->id,
        'category_id' => $this->category->id,
        'asset_tag' => 'AST-FORK-092',
        'name' => 'Hydraulic Forklift',
        'name_ar' => 'رافعة شوكية هيدروليكية',
        'serial_number' => 'SN-FRK-102',
        'purchase_date' => now()->subMonths(24)->toDateString(),
        'in_service_date' => now()->subMonths(24)->toDateString(),
        'acquisition_cost' => '40000.000000',
        'salvage_value' => '0.000000',
        'useful_life_months' => 48,
        'depreciation_method' => 'straight_line',
        'accumulated_depreciation' => '15000.000000',
        'net_book_value' => '25000.000000',
        'status' => 'active',
        'asset_account_id' => $this->assetAccount->id,
        'accumulated_depreciation_account_id' => $this->accDepAccount->id,
        'depreciation_expense_account_id' => $this->depExpAccount->id,
    ]);

    // 2. Record Scrap Disposal with Proceeds = 0 (Loss = 25,000)
    $disposalData = [
        'fixed_asset_id' => $asset->id,
        'disposal_date' => now()->toDateString(),
        'disposal_type' => 'scrap',
        'proceeds' => 0.0,
        'reason' => 'Catastrophic engine failure and frame fracture beyond economic repair',
        'notes' => 'Scrap authorization signed by safety committee',
    ];

    $this->actingAs($this->user)->post('/assets/disposals', $disposalData);
    $disposal = FixedAssetDisposal::where('fixed_asset_id', $asset->id)->first();
    expect($disposal)->not->toBeNull()
        ->and($disposal->gain_loss_type)->toBe('loss')
        ->and((float) $disposal->gain_loss_amount)->toBe(25000.0);

    // 3. Post Scrap
    $this->actingAs($this->user)->post("/assets/disposals/{$disposal->id}/post");

    $disposal->refresh();
    $asset->refresh();

    expect($disposal->status)->toBe('posted')
        ->and($asset->status)->toBe('disposed')
        ->and((float) $asset->net_book_value)->toBe(0.0);

    // Verify GL:
    // DR Acc Dep 1590: 15,000
    // DR Loss on Disposal 5300: 25,000
    // CR Asset Account 1500: 40,000
    $journal = $disposal->journalEntry;
    expect($journal)->not->toBeNull();

    $drAccDep = $journal->lines->where('account_id', $this->accDepAccount->id)->first();
    $lossAccount = Account::where('company_id', $this->company->id)->where('code', '5300')->first();
    $drLoss = $journal->lines->where('account_id', $lossAccount->id)->first();
    $crAsset = $journal->lines->where('account_id', $this->assetAccount->id)->first();

    expect((float) $drAccDep->debit)->toBe(15000.0)
        ->and((float) $drLoss->debit)->toBe(25000.0)
        ->and((float) $crAsset->credit)->toBe(40000.0);
});
