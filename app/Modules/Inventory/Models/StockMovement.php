<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Accounting\Models\JournalEntry;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockMovement extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'stock_movements';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'warehouse_id',
        'product_id',
        'journal_entry_id',
        'movement_number',
        'movement_type',
        'direction',
        'quantity',
        'unit_cost',
        'total_cost',
        'pre_movement_qty',
        'post_movement_qty',
        'pre_movement_avg_cost',
        'post_movement_avg_cost',
        'reference_type',
        'reference_id',
        'date',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'quantity' => 'decimal:6',
        'unit_cost' => 'decimal:6',
        'total_cost' => 'decimal:6',
        'pre_movement_qty' => 'decimal:6',
        'post_movement_qty' => 'decimal:6',
        'pre_movement_avg_cost' => 'decimal:6',
        'post_movement_avg_cost' => 'decimal:6',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'reference_type', 'reference_id');
    }
}
