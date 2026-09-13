<?php

namespace App\Modules\Accounting\Models;

use App\Models\User;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PettyCashFund extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'petty_cash_funds';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'custodian_id',
        'account_id',
        'name',
        'name_ar',
        'code',
        'fund_limit',
        'current_balance',
        'status',
        'notes',
    ];

    protected $casts = [
        'fund_limit' => 'decimal:6',
        'current_balance' => 'decimal:6',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function custodian(): BelongsTo
    {
        return $this->belongsTo(User::class, 'custodian_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function settlements(): HasMany
    {
        return $this->hasMany(PettyCashSettlement::class, 'fund_id');
    }
}
