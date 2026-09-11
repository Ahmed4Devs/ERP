<?php

namespace App\Modules\Assets\Models;

use App\Modules\Accounting\Models\Account;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FixedAsset extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'fixed_assets';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'category_id',
        'asset_tag',
        'name',
        'name_ar',
        'serial_number',
        'purchase_date',
        'in_service_date',
        'acquisition_cost',
        'salvage_value',
        'useful_life_months',
        'depreciation_method',
        'accumulated_depreciation',
        'net_book_value',
        'status', // active, fully_depreciated, disposed
        'asset_account_id',
        'accumulated_depreciation_account_id',
        'depreciation_expense_account_id',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'in_service_date' => 'date',
        'acquisition_cost' => 'decimal:6',
        'salvage_value' => 'decimal:6',
        'useful_life_months' => 'integer',
        'accumulated_depreciation' => 'decimal:6',
        'net_book_value' => 'decimal:6',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'category_id');
    }

    public function assetAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'asset_account_id');
    }

    public function accumulatedDepreciationAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'accumulated_depreciation_account_id');
    }

    public function depreciationExpenseAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'depreciation_expense_account_id');
    }

    public function depreciationEntries(): HasMany
    {
        return $this->hasMany(AssetDepreciationEntry::class, 'fixed_asset_id');
    }

    /**
     * Calculate monthly straight-line depreciation amount.
     * Monthly = (Cost - Salvage) / Useful_Life_Months
     * Clamped to remaining depreciable amount: Net Book Value - Salvage Value
     */
    public function calculateMonthlyDepreciation(): string
    {
        if ($this->status !== 'active') {
            return '0.000000';
        }

        $remainingDepreciable = bcsub((string) $this->net_book_value, (string) $this->salvage_value, 6);
        if (bccomp($remainingDepreciable, '0.000000', 6) <= 0) {
            return '0.000000';
        }

        if ($this->useful_life_months <= 0) {
            return '0.000000';
        }

        $totalDepreciableBase = bcsub((string) $this->acquisition_cost, (string) $this->salvage_value, 6);
        if (bccomp($totalDepreciableBase, '0.000000', 6) <= 0) {
            return '0.000000';
        }

        $standardMonthly = bcdiv($totalDepreciableBase, (string) $this->useful_life_months, 6);

        // Clamp to remaining depreciable
        if (bccomp($standardMonthly, $remainingDepreciable, 6) > 0) {
            return $remainingDepreciable;
        }

        return $standardMonthly;
    }
}
