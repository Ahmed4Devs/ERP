<?php

namespace App\Modules\Projects\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectTask extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'project_tasks';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'project_id',
        'title',
        'estimated_hours',
        'actual_hours',
        'status', // todo, in_progress, review, done
        'priority', // low, medium, high, urgent
        'due_date',
    ];

    protected $casts = [
        'estimated_hours' => 'decimal:2',
        'actual_hours' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function timesheets(): HasMany
    {
        return $this->hasMany(ProjectTimesheet::class, 'task_id');
    }
}
