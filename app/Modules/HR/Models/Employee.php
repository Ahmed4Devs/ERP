<?php

namespace App\Modules\HR\Models;

use App\Modules\Organization\Models\Branch;
use App\Modules\Payroll\Models\Payslip;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'employees';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'department_id',
        'designation_id',
        'employee_number',
        'first_name',
        'last_name',
        'first_name_ar',
        'last_name_ar',
        'email',
        'phone',
        'national_id',
        'hire_date',
        'status',
        'basic_salary',
        'housing_allowance',
        'transport_allowance',
        'other_allowances',
        'bank_name',
        'iban',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'basic_salary' => 'decimal:6',
        'housing_allowance' => 'decimal:6',
        'transport_allowance' => 'decimal:6',
        'other_allowances' => 'decimal:6',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class, 'designation_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'employee_id');
    }

    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class, 'employee_id');
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class, 'employee_id');
    }

    public function loans(): HasMany
    {
        return $this->hasMany(EmployeeLoan::class, 'employee_id');
    }

    public function endOfServiceSettlements(): HasMany
    {
        return $this->hasMany(EndOfServiceSettlement::class, 'employee_id');
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getFullNameArAttribute(): ?string
    {
        if ($this->first_name_ar || $this->last_name_ar) {
            return trim("{$this->first_name_ar} {$this->last_name_ar}");
        }

        return null;
    }

    public function getTotalAllowances(): string
    {
        return bcadd(
            bcadd((string) $this->housing_allowance, (string) $this->transport_allowance, 6),
            (string) $this->other_allowances,
            6
        );
    }

    public function getGrossSalary(): string
    {
        return bcadd((string) $this->basic_salary, $this->getTotalAllowances(), 6);
    }
}
