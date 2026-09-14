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

class SalesRepresentative extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'sales_representatives';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'employee_id',
        'user_id',
        'commission_plan_id',
        'code',
        'name',
        'name_ar',
        'phone',
        'email',
        'monthly_target',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'monthly_target' => 'decimal:6',
        'is_active' => 'boolean',
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

    public function plan(): BelongsTo
    {
        return $this->belongsTo(CommissionPlan::class, 'commission_plan_id');
    }

    public function runLines(): HasMany
    {
        return $this->hasMany(SalesCommissionRunLine::class, 'sales_representative_id');
    }
}
