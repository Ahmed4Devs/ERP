<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandedCostAllocation extends Model
{
    use HasUuids;

    protected $table = 'landed_cost_allocations';

    protected $fillable = [
        'landed_cost_id',
        'goods_receipt_line_id',
        'product_id',
        'quantity',
        'weight_kg',
        'volume_cbm',
        'original_unit_cost',
        'allocated_amount',
        'customs_duty_allocated',
        'freight_allocated',
        'new_unit_cost',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'weight_kg' => 'decimal:4',
        'volume_cbm' => 'decimal:4',
        'original_unit_cost' => 'decimal:4',
        'allocated_amount' => 'decimal:4',
        'customs_duty_allocated' => 'decimal:4',
        'freight_allocated' => 'decimal:4',
        'new_unit_cost' => 'decimal:4',
    ];

    public function landedCost(): BelongsTo
    {
        return $this->belongsTo(LandedCost::class, 'landed_cost_id');
    }

    public function goodsReceiptLine(): BelongsTo
    {
        return $this->belongsTo(GoodsReceiptLine::class, 'goods_receipt_line_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
