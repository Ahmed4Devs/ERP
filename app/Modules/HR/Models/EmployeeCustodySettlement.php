<?php

namespace App\Modules\HR\Models;

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeCustodySettlement extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'employee_custody_settlements';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'custody_id',
        'settlement_number',
        'settlement_date',
        'total_expenses_amount',
        'total_tax_amount',
        'total_claimed_amount',
        'refund_amount',
        'reimbursement_amount',
        'status',
        'journal_entry_id',
        'posted_at',
        'posted_by',
        'notes',
    ];

    protected $casts = [
        'settlement_date' => 'date',
        'total_expenses_amount' => 'decimal:6',
        'total_tax_amount' => 'decimal:6',
        'total_claimed_amount' => 'decimal:6',
        'refund_amount' => 'decimal:6',
        'reimbursement_amount' => 'decimal:6',
        'posted_at' => 'datetime',
    ];

    public function custody(): BelongsTo
    {
        return $this->belongsTo(EmployeeCustody::class, 'custody_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function postedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(EmployeeCustodyExpenseLine::class, 'settlement_id');
    }
}
