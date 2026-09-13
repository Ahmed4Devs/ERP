<?php

namespace App\Modules\Accounting\Models;

use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankStatementLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'bank_statement_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'bank_reconciliation_id',
        'line_date',
        'description',
        'reference_number',
        'type', // deposit, withdrawal
        'amount',
        'is_reconciled',
        'matched_journal_entry_line_id',
        'reconciled_at',
    ];

    protected $casts = [
        'line_date' => 'date',
        'amount' => 'decimal:6',
        'is_reconciled' => 'boolean',
        'reconciled_at' => 'datetime',
    ];

    public function reconciliation(): BelongsTo
    {
        return $this->belongsTo(BankReconciliation::class, 'bank_reconciliation_id');
    }

    public function matchedJournalLine(): BelongsTo
    {
        return $this->belongsTo(JournalEntryLine::class, 'matched_journal_entry_line_id');
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
