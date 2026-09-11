<?php

namespace App\Modules\Inventory\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLevel extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'inventory_levels';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'warehouse_id',
        'product_id',
        'quantity_on_hand',
        'quantity_reserved',
        'quantity_available',
        'moving_average_cost',
        'total_value',
        'reorder_point',
    ];

    protected $casts = [
        'quantity_on_hand' => 'decimal:6',
        'quantity_reserved' => 'decimal:6',
        'quantity_available' => 'decimal:6',
        'moving_average_cost' => 'decimal:6',
        'total_value' => 'decimal:6',
        'reorder_point' => 'decimal:6',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
