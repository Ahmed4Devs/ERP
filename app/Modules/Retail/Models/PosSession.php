<?php

namespace App\Modules\Retail\Models;

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosSession extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'pos_sessions';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'terminal_id',
        'user_id',
        'session_number',
        'z_report_number',
        'z_report_sequence',
        'opening_cash',
        'closing_cash',
        'expected_cash',
        'cash_difference',
        'total_orders_count',
        'total_gross_sales',
        'total_discounts',
        'total_net_sales',
        'total_tax',
        'total_cash_sales',
        'total_card_sales',
        'difference_journal_entry_id',
        'closed_by',
        'status', // open, closed
        'opened_at',
        'closed_at',
        'notes',
    ];

    protected $casts = [
        'opening_cash' => 'decimal:6',
        'closing_cash' => 'decimal:6',
        'expected_cash' => 'decimal:6',
        'cash_difference' => 'decimal:6',
        'total_orders_count' => 'integer',
        'total_gross_sales' => 'decimal:6',
        'total_discounts' => 'decimal:6',
        'total_net_sales' => 'decimal:6',
        'total_tax' => 'decimal:6',
        'total_cash_sales' => 'decimal:6',
        'total_card_sales' => 'decimal:6',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function terminal(): BelongsTo
    {
        return $this->belongsTo(PosTerminal::class, 'terminal_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function closedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function differenceJournalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'difference_journal_entry_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(PosOrder::class, 'session_id');
    }
}
