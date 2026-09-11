<?php

namespace App\Modules\Retail\Models;

use App\Modules\Inventory\Models\Product;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosOrderLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'pos_order_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'pos_order_id',
        'product_id',
        'description',
        'quantity',
        'unit_price',
        'unit_cost',
        'tax_amount',
        'line_total',
    ];

    protected $casts = [
        'quantity' => 'decimal:6',
        'unit_price' => 'decimal:6',
        'unit_cost' => 'decimal:6',
        'tax_amount' => 'decimal:6',
        'line_total' => 'decimal:6',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(PosOrder::class, 'pos_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
