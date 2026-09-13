<?php

namespace App\Modules\HR\Models;

use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeLoan extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'employee_loans';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'employee_id',
        'loan_number',
        'total_amount',
        'monthly_installment',
        'installments_count',
        'paid_amount',
        'remaining_amount',
        'start_date',
        'disbursement_date',
        'status',
        'reason',
        'journal_entry_id',
    ];

    protected $casts = [
        'total_amount' => 'decimal:6',
        'monthly_installment' => 'decimal:6',
        'paid_amount' => 'decimal:6',
        'remaining_amount' => 'decimal:6',
        'start_date' => 'date',
        'disbursement_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function installments(): HasMany
    {
        return $this->hasMany(EmployeeLoanInstallment::class, 'employee_loan_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }
}
