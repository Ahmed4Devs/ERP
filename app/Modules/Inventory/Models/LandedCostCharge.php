<?php

namespace App\Modules\Inventory\Models;

use App\Modules\Accounting\Models\Account;
use App\Modules\MasterData\Models\Party;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandedCostCharge extends Model
{
    use HasUuids;

    protected $table = 'landed_cost_charges';

    protected $fillable = [
        'landed_cost_id',
        'cost_type',
        'description',
        'amount',
        'vendor_party_id',
        'expense_account_id',
    ];

    protected $casts = [
        'amount' => 'decimal:4',
    ];

    public function landedCost(): BelongsTo
    {
        return $this->belongsTo(LandedCost::class, 'landed_cost_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'vendor_party_id');
    }

    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'expense_account_id');
    }
}
