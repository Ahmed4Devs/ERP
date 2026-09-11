<?php

namespace App\Modules\HR\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'attendances';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'employee_id',
        'date',
        'status',
        'hours_worked',
        'overtime_hours',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'hours_worked' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
