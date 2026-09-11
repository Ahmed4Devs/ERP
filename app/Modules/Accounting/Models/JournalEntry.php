<?php

namespace App\Modules\Accounting\Models;

use App\Models\User;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'journal_entries';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'entry_number',
        'date',
        'description',
        'status',
        'source_type',
        'source_id',
        'idempotency_key',
        'payload_hash',
        'reversal_of_id',
        'posted_at',
        'posted_by',
    ];

    protected $casts = [
        'date' => 'date',
        'posted_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class, 'journal_entry_id');
    }

    public function reversalOf(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'reversal_of_id');
    }

    public function reversedBy(): HasMany
    {
        return $this->hasMany(JournalEntry::class, 'reversal_of_id');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function totalDebit(): string
    {
        $sum = '0.000000';
        foreach ($this->lines as $line) {
            $sum = bcadd($sum, (string) $line->debit, 6);
        }

        return $sum;
    }

    public function totalCredit(): string
    {
        $sum = '0.000000';
        foreach ($this->lines as $line) {
            $sum = bcadd($sum, (string) $line->credit, 6);
        }

        return $sum;
    }

    public function isBalanced(): bool
    {
        return bccomp($this->totalDebit(), $this->totalCredit(), 6) === 0;
    }
}
