<?php

namespace App\Modules\Projects\Models;

use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\HR\Models\Employee;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectTimesheet extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'project_timesheets';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'project_id',
        'task_id',
        'employee_id',
        'date',
        'hours',
        'hourly_cost',
        'hourly_billing_rate',
        'total_cost',
        'total_billable',
        'is_billable',
        'is_billed',
        'invoice_id',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'hours' => 'decimal:2',
        'hourly_cost' => 'decimal:6',
        'hourly_billing_rate' => 'decimal:6',
        'total_cost' => 'decimal:6',
        'total_billable' => 'decimal:6',
        'is_billable' => 'boolean',
        'is_billed' => 'boolean',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(ProjectTask::class, 'task_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(ServiceInvoice::class, 'invoice_id');
    }
}
