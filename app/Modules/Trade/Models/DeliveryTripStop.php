<?php

namespace App\Modules\Trade\Models;

use App\Modules\Inventory\Models\DeliveryNote;
use App\Modules\MasterData\Models\Party;
use App\Modules\Sales\Models\SalesOrder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryTripStop extends Model
{
    use HasUuids;

    protected $table = 'delivery_trip_stops';

    protected $fillable = [
        'delivery_trip_id',
        'delivery_note_id',
        'sales_order_id',
        'customer_id',
        'stop_sequence',
        'destination_address',
        'recipient_contact_phone',
        'cod_amount_due',
        'cod_amount_collected',
        'cod_payment_method',
        'status',
        'delivered_at',
        'failure_reason',
        'recipient_name',
        'recipient_national_id',
        'recipient_signature_svg',
        'gps_latitude',
        'gps_longitude',
        'pod_notes',
    ];

    protected $casts = [
        'stop_sequence' => 'integer',
        'cod_amount_due' => 'decimal:6',
        'cod_amount_collected' => 'decimal:6',
        'delivered_at' => 'datetime',
        'gps_latitude' => 'decimal:7',
        'gps_longitude' => 'decimal:7',
    ];

    public function trip(): BelongsTo
    {
        return $this->belongsTo(DeliveryTrip::class, 'delivery_trip_id');
    }

    public function deliveryNote(): BelongsTo
    {
        return $this->belongsTo(DeliveryNote::class, 'delivery_note_id');
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }
}
