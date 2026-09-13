<?php

namespace App\Modules\HR\Models;

use App\Modules\Payroll\Models\Payslip;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeLoanInstallment extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'employee_loan_installments';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'employee_loan_id',
        'employee_id',
        'installment_number',
        'period_year',
        'period_month',
        'amount',
        'status',
        'payslip_id',
        'deducted_at',
    ];

    protected $casts = [
        'amount' => 'decimal:6',
        'deducted_at' => 'datetime',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(EmployeeLoan::class, 'employee_loan_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function payslip(): BelongsTo
    {
        return $this->belongsTo(Payslip::class, 'payslip_id');
    }
}
