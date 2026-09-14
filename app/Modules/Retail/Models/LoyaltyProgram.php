<?php

namespace App\Modules\Retail\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyProgram extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'loyalty_programs';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'code',
        'name',
        'name_ar',
        'description',
        'spend_amount_per_point',
        'point_redeem_value',
        'min_points_to_redeem',
        'points_expiry_days',
        'is_active',
    ];

    protected $casts = [
        'spend_amount_per_point' => 'decimal:6',
        'point_redeem_value' => 'decimal:6',
        'min_points_to_redeem' => 'integer',
        'points_expiry_days' => 'integer',
        'is_active' => 'boolean',
    ];

    public function tiers(): HasMany
    {
        return $this->hasMany(LoyaltyTier::class, 'loyalty_program_id')->orderBy('min_points_threshold', 'asc');
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(LoyaltyAccount::class, 'loyalty_program_id');
    }

    /**
     * Calculate points earned for a given spend amount and customer tier.
     */
    public function calculatePointsForSpend(string|float $spend, ?LoyaltyTier $tier = null): int
    {
        $spendFloat = (float) $spend;
        $spendPerPoint = (float) $this->spend_amount_per_point;

        if ($spendPerPoint <= 0 || $spendFloat <= 0) {
            return 0;
        }

        $basePoints = floor($spendFloat / $spendPerPoint);
        $multiplier = $tier ? (float) $tier->earn_multiplier : 1.0;

        return (int) floor($basePoints * $multiplier);
    }

    /**
     * Calculate the monetary discount value in SAR for a given amount of points.
     */
    public function calculateDiscountForPoints(int $points): string
    {
        if ($points <= 0) {
            return '0.000000';
        }

        return bcmul((string) $points, (string) $this->point_redeem_value, 6);
    }

    /**
     * Calculate points needed to cover a target discount amount in SAR.
     */
    public function calculatePointsNeededForDiscount(string|float $discount): int
    {
        $discountFloat = (float) $discount;
        $pointValue = (float) $this->point_redeem_value;

        if ($pointValue <= 0 || $discountFloat <= 0) {
            return 0;
        }

        return (int) ceil($discountFloat / $pointValue);
    }
}
