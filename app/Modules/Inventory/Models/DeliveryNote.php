<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\MasterData\Models\Party;
use App\Modules\Organization\Models\Branch;
use App\Modules\Organization\Models\Company;
use App\Modules\Sales\Models\SalesOrder;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeliveryNote extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'delivery_notes';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'warehouse_id',
        'customer_id',
        'sales_order_id',
        'journal_entry_id',
        'delivery_number',
        'date',
        'status',
        'driver_name',
        'vehicle_plate',
        'tracking_number',
        'recipient_name',
        'recipient_phone',
        'shipping_address',
        'total_cost',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'total_cost' => 'decimal:6',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(DeliveryNoteLine::class, 'delivery_note_id');
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'reference_id')->where('reference_type', self::class);
    }
}
