<?php

namespace App\Modules\Inventory\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BatchTransaction extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'batch_transactions';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'batch_id',
        'product_id',
        'warehouse_id',
        'transaction_type', // receipt, issue, adjustment, transfer
        'direction', // in, out
        'quantity',
        'reference_type',
        'reference_id',
        'transaction_date',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'transaction_date' => 'date',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }
}
