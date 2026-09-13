<?php

namespace App\Modules\Accounting\Models;

use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

class JournalEntryLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'journal_entry_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'journal_entry_id',
        'account_id',
        'cost_center_id',
        'debit',
        'credit',
        'description',
    ];

    protected $casts = [
        'debit' => 'decimal:6',
        'credit' => 'decimal:6',
    ];

    protected static function booted(): void
    {
        static::updating(function ($line): void {
            if ($line->journalEntry && $line->journalEntry->status === 'posted') {
                throw new RuntimeException('Cannot update lines of a posted journal entry.');
            }
        });

        static::deleting(function ($line): void {
            if ($line->journalEntry && $line->journalEntry->status === 'posted') {
                throw new RuntimeException('Cannot delete lines of a posted journal entry.');
            }
        });
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'cost_center_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
