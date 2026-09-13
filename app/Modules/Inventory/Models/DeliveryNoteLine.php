<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Sales\Models\SalesOrderLine;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryNoteLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'delivery_note_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'delivery_note_id',
        'product_id',
        'sales_order_line_id',
        'description',
        'quantity',
        'unit_cost',
        'total_cost',
    ];

    protected $casts = [
        'quantity' => 'decimal:6',
        'unit_cost' => 'decimal:6',
        'total_cost' => 'decimal:6',
    ];

    public function deliveryNote(): BelongsTo
    {
        return $this->belongsTo(DeliveryNote::class, 'delivery_note_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function salesOrderLine(): BelongsTo
    {
        return $this->belongsTo(SalesOrderLine::class, 'sales_order_line_id');
    }
}
