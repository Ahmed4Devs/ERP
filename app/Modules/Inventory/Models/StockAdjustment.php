<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Accounting\Models\JournalEntry;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StockAdjustment extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'stock_adjustments';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'warehouse_id',
        'journal_entry_id',
        'adjustment_number',
        'date',
        'reason',
        'status',
        'total_cost_impact',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'total_cost_impact' => 'decimal:6',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(StockAdjustmentLine::class, 'stock_adjustment_id');
    }
}
