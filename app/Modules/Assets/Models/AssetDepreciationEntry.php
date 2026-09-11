<?php

namespace App\Modules\Assets\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetDepreciationEntry extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'asset_depreciation_entries';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'depreciation_run_id',
        'fixed_asset_id',
        'amount',
        'prior_accumulated_depreciation',
        'new_accumulated_depreciation',
        'new_net_book_value',
    ];

    protected $casts = [
        'amount' => 'decimal:6',
        'prior_accumulated_depreciation' => 'decimal:6',
        'new_accumulated_depreciation' => 'decimal:6',
        'new_net_book_value' => 'decimal:6',
    ];

    public function depreciationRun(): BelongsTo
    {
        return $this->belongsTo(AssetDepreciationRun::class, 'depreciation_run_id');
    }

    public function fixedAsset(): BelongsTo
    {
        return $this->belongsTo(FixedAsset::class, 'fixed_asset_id');
    }
}
