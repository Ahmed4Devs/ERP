<?php

namespace App\Modules\Payroll\Models;

use App\Modules\Accounting\Models\JournalEntry;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollRun extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'payroll_runs';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'run_number',
        'period_month',
        'period_year',
        'payment_date',
        'total_basic',
        'total_allowances',
        'total_deductions',
        'total_net',
        'status', // draft, approved, posted, paid
        'journal_entry_id',
        'disbursement_journal_entry_id',
        'notes',
    ];

    protected $casts = [
        'period_month' => 'integer',
        'period_year' => 'integer',
        'payment_date' => 'date',
        'total_basic' => 'decimal:6',
        'total_allowances' => 'decimal:6',
        'total_deductions' => 'decimal:6',
        'total_net' => 'decimal:6',
    ];

    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class, 'payroll_run_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function disbursementJournalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'disbursement_journal_entry_id');
    }
}
