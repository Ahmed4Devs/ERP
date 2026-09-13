<?php

namespace App\Modules\Treasury\Models;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\MasterData\Models\Party;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cheque extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'cheques';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'type', // received, issued
        'cheque_number',
        'bank_name',
        'drawer_name',
        'payee_name',
        'issue_date',
        'due_date',
        'amount',
        'currency',
        'status', // in_safe, under_collection, collected, bounced, returned_to_drawer, issued, cleared, cancelled
        'party_id',
        'bank_account_id',
        'pdc_account_id',
        'journal_entry_id',
        'settlement_journal_entry_id',
        'bounce_reason',
        'notes',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'amount' => 'decimal:4',
    ];

    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'bank_account_id');
    }

    public function pdcAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'pdc_account_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function settlementJournalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'settlement_journal_entry_id');
    }

    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && in_array($this->status, ['in_safe', 'under_collection', 'issued']);
    }
}
