<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'warehouses';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'code',
        'name',
        'name_ar',
        'address',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function locations(): HasMany
    {
        return $this->hasMany(WarehouseLocation::class, 'warehouse_id');
    }

    public function inventoryLevels(): HasMany
    {
        return $this->hasMany(InventoryLevel::class, 'warehouse_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'warehouse_id');
    }
}
