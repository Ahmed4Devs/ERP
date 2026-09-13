<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Accounting\Models\Account;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'products';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'category_id',
        'unit_id',
        'sku',
        'barcode',
        'name',
        'name_ar',
        'description',
        'type',
        'standard_cost',
        'moving_average_cost',
        'list_price',
        'inventory_account_id',
        'cogs_account_id',
        'revenue_account_id',
        'grni_account_id',
        'tax_rate',
        'tracking_type',
        'shelf_life_days',
        'warranty_months',
        'is_active',
    ];

    protected $casts = [
        'standard_cost' => 'decimal:6',
        'moving_average_cost' => 'decimal:6',
        'list_price' => 'decimal:6',
        'tax_rate' => 'decimal:6',
        'shelf_life_days' => 'integer',
        'warranty_months' => 'integer',
        'is_active' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(UnitOfMeasure::class, 'unit_id');
    }

    public function inventoryAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'inventory_account_id');
    }

    public function cogsAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'cogs_account_id');
    }

    public function revenueAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'revenue_account_id');
    }

    public function grniAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'grni_account_id');
    }

    public function inventoryLevels(): HasMany
    {
        return $this->hasMany(InventoryLevel::class, 'product_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'product_id');
    }

    public function batches(): HasMany
    {
        return $this->hasMany(ProductBatch::class, 'product_id');
    }

    public function serials(): HasMany
    {
        return $this->hasMany(ProductSerial::class, 'product_id');
    }
}
