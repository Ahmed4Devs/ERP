<?php

namespace App\Modules\HR\Models;

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EndOfServiceSettlement extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'end_of_service_settlements';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'employee_id',
        'settlement_number',
        'termination_type',
        'hire_date',
        'last_working_date',
        'service_years',
        'base_salary_amount',
        'gratuity_entitlement_rate',
        'gratuity_amount',
        'unused_leave_days',
        'leave_compensation_amount',
        'other_entitlements',
        'deductions_amount',
        'net_settlement_amount',
        'status',
        'journal_entry_id',
        'settled_at',
        'prepared_by',
        'approved_by',
        'notes',
    ];

    protected $casts = [
        'hire_date' => 'date',
        'last_working_date' => 'date',
        'service_years' => 'decimal:4',
        'base_salary_amount' => 'decimal:6',
        'gratuity_entitlement_rate' => 'decimal:2',
        'gratuity_amount' => 'decimal:6',
        'unused_leave_days' => 'decimal:2',
        'leave_compensation_amount' => 'decimal:6',
        'other_entitlements' => 'decimal:6',
        'deductions_amount' => 'decimal:6',
        'net_settlement_amount' => 'decimal:6',
        'settled_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function preparer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prepared_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
