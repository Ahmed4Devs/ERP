<?php

namespace App\Modules\Accounting\Models;

use App\Models\User;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FiscalYearClosing extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'fiscal_year_closings';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'fiscal_year',
        'closing_date',
        'journal_entry_id',
        'total_revenue',
        'total_expenses',
        'net_profit_loss',
        'retained_earnings_account_id',
        'status',
        'notes',
        'closed_by_id',
    ];

    protected $casts = [
        'fiscal_year' => 'integer',
        'closing_date' => 'date',
        'total_revenue' => 'decimal:4',
        'total_expenses' => 'decimal:4',
        'net_profit_loss' => 'decimal:4',
    ];

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function retainedEarningsAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'retained_earnings_account_id');
    }

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by_id');
    }
}
