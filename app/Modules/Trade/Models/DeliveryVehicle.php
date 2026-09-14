<?php

namespace App\Modules\Trade\Models;

use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryVehicle extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'delivery_vehicles';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'plate_number',
        'model',
        'vehicle_type',
        'max_weight_capacity_kg',
        'max_volume_capacity_cbm',
        'status',
        'insurance_expiry',
        'license_expiry',
        'notes',
    ];

    protected $casts = [
        'max_weight_capacity_kg' => 'decimal:2',
        'max_volume_capacity_cbm' => 'decimal:2',
        'insurance_expiry' => 'date',
        'license_expiry' => 'date',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(DeliveryTrip::class, 'vehicle_id');
    }
}
