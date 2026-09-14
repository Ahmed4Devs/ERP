<?php

namespace App\Modules\Trade\Models;

use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryTrip extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'delivery_trips';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'driver_id',
        'vehicle_id',
        'departure_warehouse_id',
        'trip_number',
        'scheduled_date',
        'dispatched_at',
        'completed_at',
        'status',
        'total_deliveries_count',
        'completed_deliveries_count',
        'total_weight_kg',
        'total_cod_expected',
        'total_cod_collected',
        'cod_settlement_status',
        'settlement_journal_entry_id',
        'route_notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'dispatched_at' => 'datetime',
        'completed_at' => 'datetime',
        'total_weight_kg' => 'decimal:2',
        'total_cod_expected' => 'decimal:6',
        'total_cod_collected' => 'decimal:6',
    ];

    public function driver(): BelongsTo
    {
        return $this->belongsTo(DeliveryDriver::class, 'driver_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(DeliveryVehicle::class, 'vehicle_id');
    }

    public function departureWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'departure_warehouse_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function stops(): HasMany
    {
        return $this->hasMany(DeliveryTripStop::class, 'delivery_trip_id')->orderBy('stop_sequence', 'asc');
    }

    public function settlementJournalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'settlement_journal_entry_id');
    }

    /**
     * Recalculate trip progress and totals.
     */
    public function recalculateTotals(): void
    {
        $this->total_deliveries_count = $this->stops()->count();
        $this->completed_deliveries_count = $this->stops()->where('status', 'delivered')->count();
        $this->total_cod_expected = $this->stops()->sum('cod_amount_due');
        $this->total_cod_collected = $this->stops()->where('status', 'delivered')->sum('cod_amount_collected');

        if ($this->total_deliveries_count > 0 && $this->completed_deliveries_count === $this->total_deliveries_count) {
            $this->status = 'completed';
            if (! $this->completed_at) {
                $this->completed_at = now();
            }
        }

        $this->save();
    }
}
