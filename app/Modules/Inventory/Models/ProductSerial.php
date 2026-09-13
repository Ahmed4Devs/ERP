<?php

namespace App\Modules\Inventory\Models;

use App\Modules\MasterData\Models\Party;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductSerial extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'product_serials';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'product_id',
        'warehouse_id',
        'batch_id',
        'customer_id',
        'serial_number',
        'status', // in_stock, reserved, sold, returned, scrapped
        'unit_cost',
        'warranty_start_date',
        'warranty_end_date',
        'warranty_notes',
        'notes',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:6',
        'warranty_start_date' => 'date',
        'warranty_end_date' => 'date',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(SerialTransaction::class, 'serial_id');
    }

    public function isUnderWarranty(): bool
    {
        if (! $this->warranty_end_date) {
            return false;
        }

        return ! $this->warranty_end_date->isPast();
    }
}
