<?php

namespace App\Modules\HR\Models;

use App\Models\User;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeCustody extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'employee_custodies';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'employee_id',
        'custody_number',
        'type',
        'purpose',
        'amount',
        'current_balance',
        'status',
        'disbursement_method',
        'disbursement_account_id',
        'custody_account_id',
        'journal_entry_id',
        'disbursed_at',
        'created_by',
        'approved_by',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:6',
        'current_balance' => 'decimal:6',
        'disbursed_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function disbursementAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'disbursement_account_id');
    }

    public function custodyAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'custody_account_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(EmployeeCustodySettlement::class, 'custody_id');
    }
}
