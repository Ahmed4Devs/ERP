<?php

namespace App\Modules\Inventory\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductBatch extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'product_batches';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'product_id',
        'warehouse_id',
        'batch_number',
        'supplier_batch_number',
        'manufacture_date',
        'expiry_date',
        'received_qty',
        'current_qty',
        'reserved_qty',
        'unit_cost',
        'status', // active, expired, depleted, quarantined
        'notes',
    ];

    protected $casts = [
        'manufacture_date' => 'date',
        'expiry_date' => 'date',
        'received_qty' => 'decimal:4',
        'current_qty' => 'decimal:4',
        'reserved_qty' => 'decimal:4',
        'unit_cost' => 'decimal:6',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function serials(): HasMany
    {
        return $this->hasMany(ProductSerial::class, 'batch_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(BatchTransaction::class, 'batch_id');
    }

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }

    public function getDaysUntilExpiryAttribute(): ?int
    {
        if (! $this->expiry_date) {
            return null;
        }

        return (int) now()->startOfDay()->diffInDays($this->expiry_date->startOfDay(), false);
    }
}
