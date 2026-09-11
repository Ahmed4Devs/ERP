<?php

namespace App\Modules\Inventory\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockTransfer extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'stock_transfers';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'from_warehouse_id',
        'to_warehouse_id',
        'transfer_number',
        'date',
        'status',
        'total_value',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'total_value' => 'decimal:6',
    ];

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(StockTransferLine::class, 'stock_transfer_id');
    }
}
