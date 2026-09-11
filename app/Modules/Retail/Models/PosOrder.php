<?php

namespace App\Modules\Retail\Models;

use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\MasterData\Models\Party;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosOrder extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'pos_orders';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'session_id',
        'customer_id',
        'receipt_number',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'payment_method',
        'cash_tendered',
        'change_due',
        'journal_entry_id',
        'qr_payload',
    ];

    protected $casts = [
        'subtotal' => 'decimal:6',
        'tax_rate' => 'decimal:6',
        'tax_amount' => 'decimal:6',
        'discount_amount' => 'decimal:6',
        'total_amount' => 'decimal:6',
        'cash_tendered' => 'decimal:6',
        'change_due' => 'decimal:6',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(PosSession::class, 'session_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PosOrderLine::class, 'pos_order_id');
    }
}
