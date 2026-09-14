<?php

namespace App\Modules\Trade\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommissionPlan extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'sales_commission_plans';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'code',
        'name',
        'name_ar',
        'basis',
        'tiers',
        'target_bonus_rate',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'tiers' => 'array',
        'target_bonus_rate' => 'decimal:4',
        'is_active' => 'boolean',
    ];

    public function representatives(): HasMany
    {
        return $this->hasMany(SalesRepresentative::class, 'commission_plan_id');
    }

    /**
     * Calculate commission for a given sales amount based on the plan's tiers.
     *
     * @return array{commission_amount: float, bonus_amount: float, total_commission: float, effective_rate: float}
     */
    public function calculateForAmount(float|string $salesAmount, float|string $targetAmount = 0): array
    {
        $sales = (float) $salesAmount;
        $target = (float) $targetAmount;
        $tiers = $this->tiers ?: [];

        if (empty($tiers)) {
            // Default 2% flat rate if no tiers defined
            $comm = round($sales * 0.02, 2);

            return [
                'commission_amount' => $comm,
                'bonus_amount' => 0.0,
                'total_commission' => $comm,
                'effective_rate' => 2.0,
            ];
        }

        // Sort tiers by min ascending
        usort($tiers, fn ($a, $b) => ($a['min'] ?? 0) <=> ($b['min'] ?? 0));

        $totalCommission = 0.0;
        $remainingSales = $sales;

        foreach ($tiers as $tier) {
            $min = (float) ($tier['min'] ?? 0);
            $max = isset($tier['max']) && $tier['max'] !== null && $tier['max'] !== '' ? (float) $tier['max'] : null;
            $rate = (float) ($tier['rate'] ?? 0) / 100.0;

            if ($sales <= $min) {
                continue;
            }

            $taxableInTier = $max !== null ? min($sales, $max) - $min : $sales - $min;
            if ($taxableInTier > 0) {
                $totalCommission += $taxableInTier * $rate;
            }
        }

        // Bonus for reaching or exceeding target
        $bonusAmount = 0.0;
        $bonusRate = (float) $this->target_bonus_rate;
        if ($target > 0 && $sales >= $target && $bonusRate > 0) {
            $bonusAmount = round($sales * ($bonusRate / 100.0), 2);
        }

        $totalCommission = round($totalCommission, 2);
        $grandTotal = round($totalCommission + $bonusAmount, 2);
        $effectiveRate = $sales > 0 ? round(($grandTotal / $sales) * 100, 2) : 0.0;

        return [
            'commission_amount' => $totalCommission,
            'bonus_amount' => $bonusAmount,
            'total_commission' => $grandTotal,
            'effective_rate' => $effectiveRate,
        ];
    }
}
