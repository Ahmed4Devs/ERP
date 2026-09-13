<?php

namespace App\Modules\Inventory\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SerialTransaction extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'serial_transactions';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'serial_id',
        'product_id',
        'warehouse_id',
        'transaction_type', // receive, dispatch, return, scrap, transfer
        'reference_type',
        'reference_id',
        'transaction_date',
        'notes',
    ];

    protected $casts = [
        'transaction_date' => 'date',
    ];

    public function serial(): BelongsTo
    {
        return $this->belongsTo(ProductSerial::class, 'serial_id');
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
