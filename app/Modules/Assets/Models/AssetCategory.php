<?php

namespace App\Modules\Assets\Models;

use App\Modules\Accounting\Models\Account;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssetCategory extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'asset_categories';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'code',
        'name',
        'name_ar',
        'depreciation_method',
        'zatca_tax_group',
        'useful_life_months',
        'asset_account_id',
        'accumulated_depreciation_account_id',
        'depreciation_expense_account_id',
    ];

    protected $casts = [
        'useful_life_months' => 'integer',
    ];

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

    public function fixedAssets(): HasMany
    {
        return $this->hasMany(FixedAsset::class, 'category_id');
    }
}
