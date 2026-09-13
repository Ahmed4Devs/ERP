<?php

namespace App\Modules\Treasury\Models;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Projects\Models\Project;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankGuarantee extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'bank_guarantees';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'guarantee_number',
        'type', // bid_bond, performance_bond, advance_payment, retention
        'beneficiary_name',
        'issuing_bank',
        'amount',
        'margin_percentage',
        'margin_amount',
        'commission_amount',
        'bank_account_id',
        'margin_account_id',
        'journal_entry_id',
        'issue_date',
        'expiry_date',
        'status', // active, renewed, released, claimed
        'project_id',
        'notes',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expiry_date' => 'date',
        'amount' => 'decimal:4',
        'margin_percentage' => 'decimal:2',
        'margin_amount' => 'decimal:4',
        'commission_amount' => 'decimal:4',
    ];

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'bank_account_id');
    }

    public function marginAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'margin_account_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function isExpiringSoon(int $days = 30): bool
    {
        if (! $this->expiry_date || $this->status !== 'active') {
            return false;
        }

        return $this->expiry_date->isFuture() && $this->expiry_date->diffInDays(now()) <= $days;
    }
}
