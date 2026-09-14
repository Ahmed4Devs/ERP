<?php

namespace App\Modules\Trade\Models;

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesCommissionRun extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'sales_commission_runs';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'run_number',
        'period_start',
        'period_end',
        'basis',
        'status',
        'total_eligible_sales',
        'total_commission_amount',
        'total_bonus_amount',
        'total_deductions',
        'total_net_payable',
        'journal_entry_id',
        'payment_journal_id',
        'created_by',
        'approved_by',
        'approved_at',
        'settled_at',
        'notes',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'total_eligible_sales' => 'decimal:6',
        'total_commission_amount' => 'decimal:6',
        'total_bonus_amount' => 'decimal:6',
        'total_deductions' => 'decimal:6',
        'total_net_payable' => 'decimal:6',
        'approved_at' => 'datetime',
        'settled_at' => 'datetime',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(SalesCommissionRunLine::class, 'sales_commission_run_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function paymentJournal(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'payment_journal_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
