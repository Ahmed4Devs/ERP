<?php

namespace App\Modules\Inventory\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustmentLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'stock_adjustment_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'stock_adjustment_id',
        'product_id',
        'type',
        'quantity',
        'unit_cost',
        'line_total',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:6',
        'unit_cost' => 'decimal:6',
        'line_total' => 'decimal:6',
    ];

    public function stockAdjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class, 'stock_adjustment_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
