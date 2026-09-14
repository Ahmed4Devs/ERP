<?php

namespace App\Modules\Retail\Models;

use App\Models\User;
use App\Modules\Accounting\Models\JournalEntry;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoyaltyTransaction extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'loyalty_transactions';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'loyalty_account_id',
        'transaction_type',
        'points',
        'balance_after',
        'spend_amount',
        'monetary_equivalent',
        'reference_type',
        'reference_id',
        'journal_entry_id',
        'notes',
        'created_by_user_id',
    ];

    protected $casts = [
        'points' => 'integer',
        'balance_after' => 'integer',
        'spend_amount' => 'decimal:6',
        'monetary_equivalent' => 'decimal:6',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(LoyaltyAccount::class, 'loyalty_account_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
