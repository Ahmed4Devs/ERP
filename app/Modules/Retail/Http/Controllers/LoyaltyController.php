<?php

namespace App\Modules\Retail\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Retail\Models\LoyaltyAccount;
use App\Modules\Retail\Models\LoyaltyProgram;
use App\Modules\Retail\Models\LoyaltyTier;
use App\Modules\Retail\Models\LoyaltyTransaction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LoyaltyController extends Controller
{
    public function index(Request $request): Response
    {
        $company = app(CurrentCompany::class)->get();
        $tenant = app(CurrentTenant::class)->get();

        // 1. Ensure a default program exists if none exists
        $program = LoyaltyProgram::with('tiers')
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->first();

        if (! $program) {
            $program = $this->createDefaultProgram($tenant->id, $company->id);
        }

        // 2. Compute Dashboard Metrics
        $totalAccounts = LoyaltyAccount::where('company_id', $company->id)->where('status', 'active')->count();
        $totalPointsCirculation = (int) LoyaltyAccount::where('company_id', $company->id)->where('status', 'active')->sum('points_balance');
        $totalLifetimeEarned = (int) LoyaltyAccount::where('company_id', $company->id)->sum('lifetime_points_earned');
        $totalLifetimeRedeemed = (int) LoyaltyAccount::where('company_id', $company->id)->sum('lifetime_points_redeemed');

        $outstandingLiabilitySar = $program->calculateDiscountForPoints($totalPointsCirculation);
        $totalRedeemedValueSar = $program->calculateDiscountForPoints($totalLifetimeRedeemed);

        // 3. Accounts Query with search & filter
        $search = $request->input('search');
        $tierFilter = $request->input('tier');

        $accountsQuery = LoyaltyAccount::with(['party', 'currentTier', 'program'])
            ->where('company_id', $company->id);

        if ($search) {
            $accountsQuery->where(function ($q) use ($search) {
                $q->where('card_number', 'like', "%{$search}%")
                    ->orWhereHas('party', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('name_ar', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($tierFilter) {
            $accountsQuery->where('current_tier_id', $tierFilter);
        }

        $accounts = $accountsQuery->orderBy('points_balance', 'desc')->paginate(15)->withQueryString();

        // 4. Eligible customers for new enrollment
        $enrolledPartyIds = LoyaltyAccount::where('company_id', $company->id)->pluck('party_id');
        $availableCustomers = Party::where('tenant_id', $tenant->id)
            ->whereNotIn('id', $enrolledPartyIds)
            ->select('id', 'name', 'name_ar', 'phone', 'email')
            ->orderBy('name')
            ->limit(50)
            ->get();

        return Inertia::render('Retail/Loyalty/Index', [
            'program' => $program,
            'metrics' => [
                'total_accounts' => $totalAccounts,
                'total_points_circulation' => $totalPointsCirculation,
                'total_lifetime_earned' => $totalLifetimeEarned,
                'total_lifetime_redeemed' => $totalLifetimeRedeemed,
                'outstanding_liability_sar' => $outstandingLiabilitySar,
                'total_redeemed_value_sar' => $totalRedeemedValueSar,
            ],
            'accounts' => $accounts,
            'tiers' => $program->tiers,
            'availableCustomers' => $availableCustomers,
            'filters' => [
                'search' => $search,
                'tier' => $tierFilter,
            ],
        ]);
    }

    public function show(LoyaltyAccount $account): Response
    {
        $account->load([
            'party',
            'program.tiers',
            'currentTier',
            'transactions.createdByUser',
            'transactions.journalEntry',
        ]);

        $nextTierProgress = $account->getNextTierProgress();
        $availableDiscountSar = $account->availableRedeemValue();

        return Inertia::render('Retail/Loyalty/Show', [
            'account' => $account,
            'nextTierProgress' => $nextTierProgress,
            'availableDiscountSar' => $availableDiscountSar,
        ]);
    }

    public function storeAccount(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();
        $tenant = app(CurrentTenant::class)->get();

        $validated = $request->validate([
            'party_id' => 'required|uuid|exists:parties,id',
            'loyalty_program_id' => 'nullable|uuid|exists:loyalty_programs,id',
            'custom_card_number' => 'nullable|string|max:60|unique:loyalty_accounts,card_number',
        ]);

        $program = null;
        if (! empty($validated['loyalty_program_id'])) {
            $program = LoyaltyProgram::with('tiers')->findOrFail($validated['loyalty_program_id']);
        } else {
            $program = LoyaltyProgram::with('tiers')->where('company_id', $company->id)->where('is_active', true)->firstOrFail();
        }

        // Generate card number if not provided
        $cardNumber = ! empty($validated['custom_card_number'])
            ? $validated['custom_card_number']
            : 'LOY-'.strtoupper(bin2hex(random_bytes(4)));

        // Assign base tier (threshold = 0)
        $baseTier = $program->tiers->sortBy('min_points_threshold')->first();

        $account = LoyaltyAccount::create([
            'tenant_id' => $tenant->id,
            'company_id' => $company->id,
            'party_id' => $validated['party_id'],
            'loyalty_program_id' => $program->id,
            'current_tier_id' => $baseTier?->id,
            'card_number' => $cardNumber,
            'points_balance' => 0,
            'lifetime_points_earned' => 0,
            'lifetime_points_redeemed' => 0,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        return redirect()->route('retail.loyalty.show', $account->id)
            ->with('success', __('Customer successfully enrolled in loyalty program.'));
    }

    public function adjustPoints(Request $request, LoyaltyAccount $account): RedirectResponse
    {
        $validated = $request->validate([
            'points' => 'required|integer|not_in:0',
            'notes' => 'required|string|max:255',
        ]);

        $points = (int) $validated['points'];
        if ($points < 0 && abs($points) > $account->points_balance) {
            return back()->withErrors(['points' => __('Cannot deduct more points than available balance.')]);
        }

        DB::transaction(function () use ($account, $points, $validated, $request) {
            $account->points_balance += $points;
            if ($points > 0) {
                $account->lifetime_points_earned += $points;
            } else {
                $account->lifetime_points_redeemed += abs($points);
            }
            $account->save();

            $monetaryVal = $account->program->calculateDiscountForPoints(abs($points));

            LoyaltyTransaction::create([
                'tenant_id' => $account->tenant_id,
                'company_id' => $account->company_id,
                'loyalty_account_id' => $account->id,
                'transaction_type' => 'manual_adjust',
                'points' => $points,
                'balance_after' => $account->points_balance,
                'spend_amount' => null,
                'monetary_equivalent' => $monetaryVal,
                'reference_type' => 'manual_adjustment',
                'reference_id' => null,
                'notes' => $validated['notes'],
                'created_by_user_id' => $request->user()?->id,
            ]);

            $account->refreshTierStatus();
        });

        return back()->with('success', __('Loyalty points balance adjusted successfully.'));
    }

    public function calculateRedemption(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id' => 'required_without:card_number|nullable|uuid|exists:loyalty_accounts,id',
            'card_number' => 'required_without:account_id|nullable|string',
            'points' => 'nullable|integer|min:1',
            'target_discount' => 'nullable|numeric|min:0.01',
        ]);

        $accountQuery = LoyaltyAccount::with(['program', 'currentTier', 'party']);
        if (! empty($validated['account_id'])) {
            $accountQuery->where('id', $validated['account_id']);
        } else {
            $accountQuery->where('card_number', $validated['card_number']);
        }

        $account = $accountQuery->first();
        if (! $account) {
            return response()->json(['success' => false, 'message' => __('Loyalty account not found.')], 404);
        }

        if ($account->status !== 'active') {
            return response()->json(['success' => false, 'message' => __('Loyalty account is suspended.')], 422);
        }

        $program = $account->program;
        $pointsToRedeem = 0;

        if (! empty($validated['points'])) {
            $pointsToRedeem = (int) $validated['points'];
        } elseif (! empty($validated['target_discount'])) {
            $pointsToRedeem = $program->calculatePointsNeededForDiscount($validated['target_discount']);
        }

        $eligible = true;
        $errorReason = null;

        if ($pointsToRedeem < $program->min_points_to_redeem) {
            $eligible = false;
            $errorReason = __('Points requested is less than minimum redemption threshold of :min points.', ['min' => $program->min_points_to_redeem]);
        } elseif ($pointsToRedeem > $account->points_balance) {
            $eligible = false;
            $errorReason = __('Insufficient points balance. Available: :pts points.', ['pts' => $account->points_balance]);
        }

        $discountSar = $program->calculateDiscountForPoints($pointsToRedeem);
        $maxPossibleDiscount = $program->calculateDiscountForPoints($account->points_balance);

        return response()->json([
            'success' => true,
            'account' => [
                'id' => $account->id,
                'card_number' => $account->card_number,
                'customer_name' => $account->party->name_ar ?: $account->party->name,
                'tier_name' => $account->currentTier?->name_ar ?: $account->currentTier?->name,
                'points_balance' => $account->points_balance,
                'max_discount_sar' => $maxPossibleDiscount,
            ],
            'requested_points' => $pointsToRedeem,
            'discount_amount_sar' => $discountSar,
            'is_eligible' => $eligible,
            'ineligibility_reason' => $errorReason,
        ]);
    }

    public function programs(): Response
    {
        $company = app(CurrentCompany::class)->get();
        $programs = LoyaltyProgram::with('tiers')
            ->where('company_id', $company->id)
            ->get();

        return Inertia::render('Retail/Loyalty/Programs', [
            'programs' => $programs,
        ]);
    }

    public function storeProgram(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();
        $tenant = app(CurrentTenant::class)->get();

        $validated = $request->validate([
            'id' => 'nullable|uuid|exists:loyalty_programs,id',
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:150',
            'name_ar' => 'nullable|string|max:150',
            'description' => 'nullable|string',
            'spend_amount_per_point' => 'required|numeric|min:0.01',
            'point_redeem_value' => 'required|numeric|min:0.0001',
            'min_points_to_redeem' => 'required|integer|min:1',
            'points_expiry_days' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'tiers' => 'required|array|min:1',
            'tiers.*.tier_code' => 'required|string|max:50',
            'tiers.*.name' => 'required|string|max:100',
            'tiers.*.name_ar' => 'nullable|string|max:100',
            'tiers.*.min_points_threshold' => 'required|integer|min:0',
            'tiers.*.earn_multiplier' => 'required|numeric|min:1',
            'tiers.*.color_hex' => 'nullable|string|max:20',
            'tiers.*.perks_summary_ar' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($tenant, $company, $validated) {
            $program = LoyaltyProgram::updateOrCreate(
                ['id' => $validated['id'] ?? null],
                [
                    'tenant_id' => $tenant->id,
                    'company_id' => $company->id,
                    'code' => $validated['code'],
                    'name' => $validated['name'],
                    'name_ar' => $validated['name_ar'] ?? $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'spend_amount_per_point' => $validated['spend_amount_per_point'],
                    'point_redeem_value' => $validated['point_redeem_value'],
                    'min_points_to_redeem' => $validated['min_points_to_redeem'],
                    'points_expiry_days' => $validated['points_expiry_days'] ?? null,
                    'is_active' => $validated['is_active'] ?? true,
                ]
            );

            // Sync tiers
            $existingTierIds = [];
            foreach ($validated['tiers'] as $tierData) {
                $tier = LoyaltyTier::updateOrCreate(
                    [
                        'loyalty_program_id' => $program->id,
                        'tier_code' => $tierData['tier_code'],
                    ],
                    [
                        'name' => $tierData['name'],
                        'name_ar' => $tierData['name_ar'] ?? $tierData['name'],
                        'min_points_threshold' => $tierData['min_points_threshold'],
                        'earn_multiplier' => $tierData['earn_multiplier'],
                        'color_hex' => $tierData['color_hex'] ?? '#64748b',
                        'perks_summary_ar' => $tierData['perks_summary_ar'] ?? null,
                    ]
                );
                $existingTierIds[] = $tier->id;
            }

            LoyaltyTier::where('loyalty_program_id', $program->id)
                ->whereNotIn('id', $existingTierIds)
                ->delete();
        });

        return back()->with('success', __('Loyalty program updated successfully.'));
    }

    public function cardPrint(LoyaltyAccount $account, QrCodeSvgService $qrSvgService): Response
    {
        $account->load(['party', 'program', 'currentTier', 'company']);
        $company = $account->company ?: app(CurrentCompany::class)->get();

        $qrPayload = json_encode([
            'card_number' => $account->card_number,
            'customer_name' => $account->party->name_ar ?: $account->party->name,
            'company' => $company->name_ar ?: $company->name,
            'tier' => $account->currentTier?->name_ar ?: $account->currentTier?->name,
        ], JSON_UNESCAPED_UNICODE);

        $qrSvg = $qrSvgService->render($qrPayload, 160);

        return Inertia::render('Retail/Loyalty/CardPrint', [
            'account' => $account,
            'company' => $company,
            'qrSvg' => $qrSvg,
        ]);
    }

    /**
     * Bootstrap default loyalty program with standard tiers: Bronze, Silver, Gold, Platinum.
     */
    protected function createDefaultProgram(string $tenantId, string $companyId): LoyaltyProgram
    {
        return DB::transaction(function () use ($tenantId, $companyId) {
            $program = LoyaltyProgram::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'code' => 'REWARDS-STANDARD',
                'name' => 'Customer Rewards & Loyalty Program',
                'name_ar' => 'برنامج مكافآت ونقاط الولاء القياسي',
                'description' => 'Standard customer rewards program with tiered earnings and checkout discounts.',
                'spend_amount_per_point' => '10.000000', // 10 SAR spend = 1 point
                'point_redeem_value' => '0.050000', // 100 points = 5 SAR discount
                'min_points_to_redeem' => 100,
                'points_expiry_days' => 365,
                'is_active' => true,
            ]);

            $tiers = [
                [
                    'tier_code' => 'bronze',
                    'name' => 'Bronze',
                    'name_ar' => 'البرونزي',
                    'min_points_threshold' => 0,
                    'earn_multiplier' => '1.0000',
                    'color_hex' => '#cd7f32',
                    'perks_summary_ar' => 'اكتساب نقطة لكل 10 ر.س',
                ],
                [
                    'tier_code' => 'silver',
                    'name' => 'Silver',
                    'name_ar' => 'الفضي',
                    'min_points_threshold' => 500,
                    'earn_multiplier' => '1.2500',
                    'color_hex' => '#94a3b8',
                    'perks_summary_ar' => 'زيادة بنسبة 25% في معدل اكتساب النقاط',
                ],
                [
                    'tier_code' => 'gold',
                    'name' => 'Gold',
                    'name_ar' => 'الذهبي',
                    'min_points_threshold' => 2000,
                    'earn_multiplier' => '1.5000',
                    'color_hex' => '#eab308',
                    'perks_summary_ar' => 'زيادة بنسبة 50% في معدل اكتساب النقاط وعروض حصرية',
                ],
                [
                    'tier_code' => 'platinum',
                    'name' => 'Platinum',
                    'name_ar' => 'البلاتيني VIP',
                    'min_points_threshold' => 5000,
                    'earn_multiplier' => '2.0000',
                    'color_hex' => '#6366f1',
                    'perks_summary_ar' => 'مضاعفة النقاط 200% مع أولوية خدمة ومكافآت مجانية',
                ],
            ];

            foreach ($tiers as $tier) {
                LoyaltyTier::create(array_merge($tier, [
                    'loyalty_program_id' => $program->id,
                ]));
            }

            return $program->load('tiers');
        });
    }
}
