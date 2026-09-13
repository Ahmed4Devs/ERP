<?php

namespace App\Modules\Accounting\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PettyCashSettlementLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'petty_cash_settlement_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'settlement_id',
        'expense_account_id',
        'description',
        'receipt_ref',
        'receipt_date',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total',
    ];

    protected $casts = [
        'receipt_date' => 'date',
        'subtotal' => 'decimal:6',
        'tax_rate' => 'decimal:4',
        'tax_amount' => 'decimal:6',
        'total' => 'decimal:6',
    ];

    public function settlement(): BelongsTo
    {
        return $this->belongsTo(PettyCashSettlement::class, 'settlement_id');
    }

    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'expense_account_id');
    }
}
