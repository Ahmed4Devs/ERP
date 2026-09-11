<?php

namespace App\Modules\Manufacturing\Models;

use App\Modules\Inventory\Models\Product;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductionOrderItem extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'production_order_items';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'production_order_id',
        'product_id',
        'planned_quantity',
        'consumed_quantity',
        'unit_cost',
        'total_cost',
    ];

    protected $casts = [
        'planned_quantity' => 'decimal:6',
        'consumed_quantity' => 'decimal:6',
        'unit_cost' => 'decimal:6',
        'total_cost' => 'decimal:6',
    ];

    public function productionOrder(): BelongsTo
    {
        return $this->belongsTo(ProductionOrder::class, 'production_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
