<?php

namespace App\Modules\Inventory\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockTransferLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'stock_transfer_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'stock_transfer_id',
        'product_id',
        'quantity',
        'dispatched_quantity',
        'received_quantity',
        'shortage_quantity',
        'shortage_reason',
        'unit_cost',
        'line_total',
    ];

    protected $casts = [
        'quantity' => 'decimal:6',
        'dispatched_quantity' => 'decimal:6',
        'received_quantity' => 'decimal:6',
        'shortage_quantity' => 'decimal:6',
        'unit_cost' => 'decimal:6',
        'line_total' => 'decimal:6',
    ];

    public function stockTransfer(): BelongsTo
    {
        return $this->belongsTo(StockTransfer::class, 'stock_transfer_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
