<?php

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Modules\Retail\Models\LoyaltyAccount;
use App\Modules\Retail\Models\LoyaltyProgram;
use App\Modules\Retail\Models\LoyaltyTier;
use App\Modules\Retail\Models\LoyaltyTransaction;
use App\Modules\Retail\Services\EarnLoyaltyPointsService;
use App\Modules\Retail\Services\PostLoyaltyGlEntryAction;
use App\Modules\Retail\Services\RedeemLoyaltyPointsService;
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

    // 1. Setup Standard Loyalty Program
    $this->program = LoyaltyProgram::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'code' => 'LOYALTY-TEST',
        'name' => 'Saudi VIP Rewards',
        'name_ar' => 'برنامج مكافآت كبار العملاء',
        'spend_amount_per_point' => '10.000000', // 10 SAR = 1 point
        'point_redeem_value' => '0.050000',     // 100 points = 5.00 SAR
        'min_points_to_redeem' => 100,
        'points_expiry_days' => 365,
        'is_active' => true,
    ]);

    $this->bronzeTier = LoyaltyTier::create([
        'loyalty_program_id' => $this->program->id,
        'tier_code' => 'bronze',
        'name' => 'Bronze',
        'name_ar' => 'البرونزي',
        'min_points_threshold' => 0,
        'earn_multiplier' => '1.0000',
        'color_hex' => '#cd7f32',
    ]);

    $this->silverTier = LoyaltyTier::create([
        'loyalty_program_id' => $this->program->id,
        'tier_code' => 'silver',
        'name' => 'Silver',
        'name_ar' => 'الفضي',
        'min_points_threshold' => 500,
        'earn_multiplier' => '1.2500',
        'color_hex' => '#94a3b8',
    ]);

    $this->goldTier = LoyaltyTier::create([
        'loyalty_program_id' => $this->program->id,
        'tier_code' => 'gold',
        'name' => 'Gold',
        'name_ar' => 'الذهبي',
        'min_points_threshold' => 2000,
        'earn_multiplier' => '1.5000',
        'color_hex' => '#eab308',
    ]);

    // 2. Setup Customer Party
    $this->customer = Party::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Fahad Al-Otaibi',
        'name_ar' => 'فهد العتيبي',
        'type' => 'customer',
        'phone' => '+966501112233',
        'email' => 'fahad@example.com',
        'status' => 'active',
    ]);

    // 3. Ensure GL Accounts
    $this->expenseAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '5140'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Customer Loyalty & Rewards Expense',
            'name_ar' => 'مصروف برامج الولاء والمكافآت',
            'type' => 'expense',
            'subtype' => 'operating_expense',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '0.000000',
        ]
    );

    $this->liabilityAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '2050'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Customer Loyalty Points Liability',
            'name_ar' => 'التزام نقاط الولاء المؤجلة للعملاء',
            'type' => 'liability',
            'subtype' => 'current_liability',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '0.000000',
        ]
    );

    $this->arAccount = Account::firstOrCreate(
        ['company_id' => $this->company->id, 'code' => '1030'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Accounts Receivable',
            'name_ar' => 'المدينون التجاريون والعملاء',
            'type' => 'asset',
            'subtype' => 'receivable',
            'is_postable' => true,
            'is_system' => true,
            'current_balance' => '0.000000',
        ]
    );
});

test('customer can be enrolled into loyalty program and starts at baseline bronze tier', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('retail.loyalty.accounts.store'), [
        'party_id' => $this->customer->id,
        'loyalty_program_id' => $this->program->id,
        'custom_card_number' => 'LOY-2026-9999',
    ]);

    $response->assertRedirect();

    $account = LoyaltyAccount::where('card_number', 'LOY-2026-9999')->first();
    expect($account)->not->toBeNull();
    expect($account->party_id)->toBe($this->customer->id);
    expect($account->points_balance)->toBe(0);
    expect($account->lifetime_points_earned)->toBe(0);
    expect($account->current_tier_id)->toBe($this->bronzeTier->id);
    expect($account->status)->toBe('active');
});

test('points are accrued accurately based on spend amount and tier multiplier', function () {
    $account = LoyaltyAccount::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'party_id' => $this->customer->id,
        'loyalty_program_id' => $this->program->id,
        'current_tier_id' => $this->bronzeTier->id,
        'card_number' => 'LOY-TEST-001',
        'points_balance' => 0,
        'lifetime_points_earned' => 0,
        'lifetime_points_redeemed' => 0,
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $earnService = app(EarnLoyaltyPointsService::class);

    // Spend 1,000 SAR on Bronze tier (1.0x) => 1,000 / 10 = 100 points
    $result = $earnService->execute(
        account: $account,
        spendAmount: '1000.000000',
        referenceType: 'service_invoice',
        referenceId: null,
        notes: 'Invoice #INV-2026-001'
    );

    expect($result['points_earned'])->toBe(100);
    $account->refresh();
    expect($account->points_balance)->toBe(100);
    expect($account->lifetime_points_earned)->toBe(100);

    // Now promote account to Silver tier (1.25x) and spend 1,000 SAR => 1,000 / 10 * 1.25 = 125 points
    $account->update(['current_tier_id' => $this->silverTier->id]);
    $account->refresh();

    $result2 = $earnService->execute(
        account: $account,
        spendAmount: '1000.000000',
        referenceType: 'pos_order'
    );

    expect($result2['points_earned'])->toBe(125);
    $account->refresh();
    expect($account->points_balance)->toBe(225);
    expect($account->lifetime_points_earned)->toBe(225);

    // Verify transactions in database
    expect(LoyaltyTransaction::where('loyalty_account_id', $account->id)->count())->toBe(2);
});

test('automatic tier progression upgrades customer when milestone is crossed', function () {
    $account = LoyaltyAccount::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'party_id' => $this->customer->id,
        'loyalty_program_id' => $this->program->id,
        'current_tier_id' => $this->bronzeTier->id,
        'card_number' => 'LOY-TEST-AUTO',
        'points_balance' => 0,
        'lifetime_points_earned' => 0,
        'lifetime_points_redeemed' => 0,
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $earnService = app(EarnLoyaltyPointsService::class);

    // Spend 25,000 SAR on Bronze tier => 2,500 points
    // Crosses Gold threshold (2,000 points)
    $earnService->execute(
        account: $account,
        spendAmount: '25000.000000'
    );

    $account->refresh();
    expect($account->points_balance)->toBe(2500);
    expect($account->lifetime_points_earned)->toBe(2500);
    // Auto-promoted to Gold tier!
    expect($account->current_tier_id)->toBe($this->goldTier->id);
});

test('redemption validates minimum threshold and enforces available balance', function () {
    $account = LoyaltyAccount::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'party_id' => $this->customer->id,
        'loyalty_program_id' => $this->program->id,
        'current_tier_id' => $this->silverTier->id,
        'card_number' => 'LOY-TEST-RED',
        'points_balance' => 300,
        'lifetime_points_earned' => 500,
        'lifetime_points_redeemed' => 0,
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $redeemService = app(RedeemLoyaltyPointsService::class);

    // 1. Try to redeem below minimum threshold (50 points < min 100)
    expect(fn () => $redeemService->execute($account, 50))
        ->toThrow(InvalidArgumentException::class);

    // 2. Try to redeem more than available balance (500 points > 300)
    expect(fn () => $redeemService->execute($account, 500))
        ->toThrow(InvalidArgumentException::class);

    // 3. Valid redemption: 200 points => 200 * 0.05 = 10.00 SAR discount
    $result = $redeemService->execute(
        account: $account,
        pointsToRedeem: 200,
        referenceType: 'pos_order',
        referenceId: null,
        notes: 'Redemption at Cashier #1'
    );

    expect($result['points_redeemed'])->toBe(200);
    expect(round((float) $result['discount_amount'], 2))->toBe(10.00);

    $account->refresh();
    expect($account->points_balance)->toBe(100);
    expect($account->lifetime_points_redeemed)->toBe(200);

    // Check transaction record
    $tx = $result['transaction'];
    expect($tx->transaction_type)->toBe('redeem');
    expect($tx->points)->toBe(-200);
    expect($tx->balance_after)->toBe(100);
});

test('GL journal posting records balanced double-entry accounting for loyalty points', function () {
    $account = LoyaltyAccount::create([
        'tenant_id' => $this->tenant->id,
        'company_id' => $this->company->id,
        'party_id' => $this->customer->id,
        'loyalty_program_id' => $this->program->id,
        'current_tier_id' => $this->bronzeTier->id,
        'card_number' => 'LOY-GL-001',
        'points_balance' => 0,
        'lifetime_points_earned' => 0,
        'lifetime_points_redeemed' => 0,
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $earnService = app(EarnLoyaltyPointsService::class);
    $redeemService = app(RedeemLoyaltyPointsService::class);
    $glAction = app(PostLoyaltyGlEntryAction::class);

    // 1. Earn 200 points on 2,000 SAR spend => monetary equivalent = 200 * 0.05 = 10.00 SAR
    $earnResult = $earnService->execute($account, '2000.000000');
    $earnTx = $earnResult['transaction'];

    $earnJournal = $glAction->execute($earnTx);
    expect($earnJournal)->not->toBeNull();
    expect($earnJournal->lines)->toHaveCount(2);

    // Verify Accrual: DR 5140 (Expense) 10.00 / CR 2050 (Liability) 10.00
    $debitLine = $earnJournal->lines->firstWhere('account_id', $this->expenseAccount->id);
    $creditLine = $earnJournal->lines->firstWhere('account_id', $this->liabilityAccount->id);

    expect(round((float) $debitLine->debit, 2))->toBe(10.00);
    expect(round((float) $creditLine->credit, 2))->toBe(10.00);

    // 2. Redeem 100 points => monetary equivalent = 100 * 0.05 = 5.00 SAR
    $redeemResult = $redeemService->execute($account, 100);
    $redeemTx = $redeemResult['transaction'];

    $redeemJournal = $glAction->execute($redeemTx);
    expect($redeemJournal)->not->toBeNull();
    expect($redeemJournal->lines)->toHaveCount(2);

    // Verify Redemption: DR 2050 (Liability) 5.00 / CR 1030 (AR) 5.00
    $redeemDebit = $redeemJournal->lines->firstWhere('account_id', $this->liabilityAccount->id);
    $redeemCredit = $redeemJournal->lines->firstWhere('account_id', $this->arAccount->id);

    expect(round((float) $redeemDebit->debit, 2))->toBe(5.00);
    expect(round((float) $redeemCredit->credit, 2))->toBe(5.00);
});
