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

class FxRevaluation extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'fx_revaluations';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'revaluation_number',
        'date',
        'status', // draft, posted, reversed
        'total_gain',
        'total_loss',
        'net_adjustment',
        'journal_entry_id',
        'reversal_journal_entry_id',
        'created_by_id',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'total_gain' => 'decimal:4',
        'total_loss' => 'decimal:4',
        'net_adjustment' => 'decimal:4',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(FxRevaluationLine::class, 'fx_revaluation_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function reversalJournalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'reversal_journal_entry_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_id');
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
