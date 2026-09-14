<?php

namespace App\Modules\Inventory\Models;

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
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
        'status', // draft, dispatched, in_transit, received, completed, cancelled
        'total_value',
        'shortage_value',
        'driver_name',
        'vehicle_plate',
        'tracking_number',
        'dispatched_at',
        'received_at',
        'dispatched_by',
        'received_by',
        'in_transit_journal_id',
        'receipt_journal_id',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'dispatched_at' => 'datetime',
        'received_at' => 'datetime',
        'total_value' => 'decimal:6',
        'shortage_value' => 'decimal:6',
    ];

    public function dispatchedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dispatched_by');
    }

    public function receivedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function inTransitJournal(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'in_transit_journal_id');
    }

    public function receiptJournal(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'receipt_journal_id');
    }

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
