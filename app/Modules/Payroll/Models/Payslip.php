<?php

namespace App\Modules\Payroll\Models;

use App\Modules\HR\Models\Employee;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payslip extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'payslips';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'payroll_run_id',
        'employee_id',
        'basic_salary',
        'housing_allowance',
        'transport_allowance',
        'other_allowances',
        'overtime_amount',
        'gross_salary',
        'gosi_contributory_wage',
        'social_insurance_deduction',
        'employer_gosi_contribution',
        'other_deductions',
        'total_deductions',
        'net_salary',
        'status',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:6',
        'housing_allowance' => 'decimal:6',
        'transport_allowance' => 'decimal:6',
        'other_allowances' => 'decimal:6',
        'overtime_amount' => 'decimal:6',
        'gross_salary' => 'decimal:6',
        'gosi_contributory_wage' => 'decimal:6',
        'social_insurance_deduction' => 'decimal:6',
        'employer_gosi_contribution' => 'decimal:6',
        'other_deductions' => 'decimal:6',
        'total_deductions' => 'decimal:6',
        'net_salary' => 'decimal:6',
    ];

    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }
}
