<?php

namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StocktakeSessionLine extends Model
{
    use HasUuids;

    protected $table = 'stocktake_session_lines';

    protected $fillable = [
        'stocktake_session_id',
        'product_id',
        'book_quantity',
        'counted_quantity',
        'variance_quantity',
        'unit_cost',
        'variance_amount',
        'notes',
    ];

    protected $casts = [
        'book_quantity' => 'decimal:4',
        'counted_quantity' => 'decimal:4',
        'variance_quantity' => 'decimal:4',
        'unit_cost' => 'decimal:4',
        'variance_amount' => 'decimal:4',
    ];

    public function stocktakeSession(): BelongsTo
    {
        return $this->belongsTo(StocktakeSession::class, 'stocktake_session_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
