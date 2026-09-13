<?php

namespace App\Modules\Accounting\Models;

use App\Models\User;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashSettlement extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'petty_cash_settlements';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'fund_id',
        'settlement_number',
        'date',
        'subtotal',
        'tax_amount',
        'total',
        'reimbursement_type',
        'bank_account_id',
        'status',
        'journal_entry_id',
        'notes',
        'created_by',
        'posted_by',
        'posted_at',
    ];

    protected $casts = [
        'date' => 'date',
        'posted_at' => 'datetime',
        'subtotal' => 'decimal:6',
        'tax_amount' => 'decimal:6',
        'total' => 'decimal:6',
    ];

    public function fund(): BelongsTo
    {
        return $this->belongsTo(PettyCashFund::class, 'fund_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'bank_account_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PettyCashSettlementLine::class, 'settlement_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }
}
