<?php

namespace App\Modules\Retail\Models;

use App\Modules\MasterData\Models\Party;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyAccount extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'loyalty_accounts';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'party_id',
        'loyalty_program_id',
        'current_tier_id',
        'card_number',
        'points_balance',
        'lifetime_points_earned',
        'lifetime_points_redeemed',
        'status',
        'joined_at',
    ];

    protected $casts = [
        'points_balance' => 'integer',
        'lifetime_points_earned' => 'integer',
        'lifetime_points_redeemed' => 'integer',
        'joined_at' => 'datetime',
    ];

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(LoyaltyProgram::class, 'loyalty_program_id');
    }

    public function currentTier(): BelongsTo
    {
        return $this->belongsTo(LoyaltyTier::class, 'current_tier_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(LoyaltyTransaction::class, 'loyalty_account_id')->latest();
    }

    /**
     * Compute current monetary value of points in SAR.
     */
    public function availableRedeemValue(): string
    {
        if (! $this->program) {
            $this->load('program');
        }

        return $this->program ? $this->program->calculateDiscountForPoints($this->points_balance) : '0.000000';
    }

    /**
     * Automatically evaluate tier eligibility based on lifetime earned points and update current tier.
     */
    public function refreshTierStatus(): ?LoyaltyTier
    {
        if (! $this->program) {
            $this->load('program.tiers');
        }

        $eligibleTier = $this->program->tiers
            ->where('min_points_threshold', '<=', $this->lifetime_points_earned)
            ->sortByDesc('min_points_threshold')
            ->first();

        if ($eligibleTier && $eligibleTier->id !== $this->current_tier_id) {
            $this->current_tier_id = $eligibleTier->id;
            $this->save();
        }

        return $eligibleTier;
    }

    /**
     * Next tier info and progression percentage.
     */
    public function getNextTierProgress(): array
    {
        if (! $this->program) {
            $this->load('program.tiers');
        }

        $allTiers = $this->program->tiers->sortBy('min_points_threshold')->values();
        $nextTier = $allTiers->first(fn ($t) => $t->min_points_threshold > $this->lifetime_points_earned);

        if (! $nextTier) {
            return [
                'has_next' => false,
                'next_tier_name' => null,
                'next_tier_name_ar' => null,
                'points_needed' => 0,
                'progress_percentage' => 100,
            ];
        }

        $currentTierThreshold = $this->currentTier ? $this->currentTier->min_points_threshold : 0;
        $gap = $nextTier->min_points_threshold - $currentTierThreshold;
        $earnedInBracket = max(0, $this->lifetime_points_earned - $currentTierThreshold);
        $percentage = $gap > 0 ? min(100, round(($earnedInBracket / $gap) * 100)) : 100;

        return [
            'has_next' => true,
            'next_tier_name' => $nextTier->name,
            'next_tier_name_ar' => $nextTier->name_ar,
            'points_needed' => max(0, $nextTier->min_points_threshold - $this->lifetime_points_earned),
            'progress_percentage' => $percentage,
            'target_points' => $nextTier->min_points_threshold,
        ];
    }
}
