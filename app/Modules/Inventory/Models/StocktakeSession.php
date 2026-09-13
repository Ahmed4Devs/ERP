<?php

namespace App\Modules\Inventory\Models;

use App\Models\User;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class StocktakeSession extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'stocktake_sessions';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'warehouse_id',
        'session_number',
        'date',
        'status',
        'count_type',
        'stock_adjustment_id',
        'notes',
        'created_by_id',
        'completed_at',
    ];

    protected $casts = [
        'date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function stockAdjustment(): BelongsTo
    {
        return $this->belongsTo(StockAdjustment::class, 'stock_adjustment_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(StocktakeSessionLine::class, 'stocktake_session_id');
    }
}
