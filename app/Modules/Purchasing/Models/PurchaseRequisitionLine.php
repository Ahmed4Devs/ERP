<?php

namespace App\Modules\Purchasing\Models;

use App\Modules\Inventory\Models\Product;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequisitionLine extends Model
{
    use HasUuids;

    protected $table = 'purchase_requisition_lines';

    protected $fillable = [
        'purchase_requisition_id',
        'product_id',
        'description',
        'quantity',
        'estimated_unit_cost',
        'estimated_total',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:6',
        'estimated_unit_cost' => 'decimal:6',
        'estimated_total' => 'decimal:6',
    ];

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequisition::class, 'purchase_requisition_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
