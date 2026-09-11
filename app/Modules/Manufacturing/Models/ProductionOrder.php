<?php

namespace App\Modules\Manufacturing\Models;

use App\Modules\Inventory\Models\Product;
use App\Modules\Inventory\Models\Warehouse;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductionOrder extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'production_orders';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'order_number',
        'bom_id',
        'finished_product_id',
        'source_warehouse_id',
        'destination_warehouse_id',
        'target_quantity',
        'produced_quantity',
        'total_material_cost',
        'unit_material_cost',
        'status', // draft, in_progress, completed, cancelled
        'start_date',
        'completion_date',
        'notes',
    ];

    protected $casts = [
        'target_quantity' => 'decimal:6',
        'produced_quantity' => 'decimal:6',
        'total_material_cost' => 'decimal:6',
        'unit_material_cost' => 'decimal:6',
        'start_date' => 'date',
        'completion_date' => 'date',
    ];

    public function bom(): BelongsTo
    {
        return $this->belongsTo(BillOfMaterial::class, 'bom_id');
    }

    public function finishedProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'finished_product_id');
    }

    public function sourceWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'source_warehouse_id');
    }

    public function destinationWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'destination_warehouse_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProductionOrderItem::class, 'production_order_id');
    }
}
