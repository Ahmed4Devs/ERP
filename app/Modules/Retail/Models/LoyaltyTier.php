<?php

namespace App\Modules\Retail\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LoyaltyTier extends Model
{
    use HasUuids;

    protected $table = 'loyalty_tiers';

    protected $fillable = [
        'loyalty_program_id',
        'tier_code',
        'name',
        'name_ar',
        'min_points_threshold',
        'earn_multiplier',
        'color_hex',
        'perks_summary_ar',
    ];

    protected $casts = [
        'min_points_threshold' => 'integer',
        'earn_multiplier' => 'decimal:4',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(LoyaltyProgram::class, 'loyalty_program_id');
    }

    public function accounts(): HasMany
    {
        return $this->hasMany(LoyaltyAccount::class, 'current_tier_id');
    }
}
