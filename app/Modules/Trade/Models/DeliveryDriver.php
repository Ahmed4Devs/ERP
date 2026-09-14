<?php

namespace App\Modules\Trade\Models;

use App\Models\User;
use App\Modules\HR\Models\Employee;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryDriver extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'delivery_drivers';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'employee_id',
        'user_id',
        'code',
        'name',
        'name_ar',
        'phone',
        'national_id',
        'license_number',
        'license_type',
        'status',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(DeliveryTrip::class, 'driver_id');
    }
}
