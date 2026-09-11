<?php

namespace App\Modules\Projects\Models;

use App\Modules\HR\Models\Employee;
use App\Modules\MasterData\Models\Party;
use App\Modules\Sales\Models\SalesOrder;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'projects';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'project_number',
        'name',
        'name_ar',
        'customer_id',
        'sales_order_id',
        'manager_id',
        'start_date',
        'end_date',
        'budget_cost',
        'budget_revenue',
        'status', // planning, in_progress, on_hold, completed, cancelled
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'budget_cost' => 'decimal:6',
        'budget_revenue' => 'decimal:6',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'manager_id');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'project_id');
    }

    public function timesheets(): HasMany
    {
        return $this->hasMany(ProjectTimesheet::class, 'project_id');
    }

    public function getTotalLaborCost(): string
    {
        $sum = '0.000000';
        foreach ($this->timesheets as $ts) {
            $sum = bcadd($sum, (string) $ts->total_cost, 6);
        }

        return $sum;
    }

    public function getTotalBillableHours(): string
    {
        $sum = '0.00';
        foreach ($this->timesheets as $ts) {
            if ($ts->is_billable) {
                $sum = bcadd($sum, (string) $ts->hours, 2);
            }
        }

        return $sum;
    }
}
