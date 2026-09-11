<?php

namespace App\Modules\Retail\Models;

use App\Modules\Accounting\Models\Account;
use App\Modules\Inventory\Models\Warehouse;
use App\Modules\Organization\Models\Branch;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosTerminal extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'pos_terminals';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'branch_id',
        'warehouse_id',
        'cash_account_id',
        'name',
        'code',
        'status', // active, inactive
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function cashAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'cash_account_id');
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(PosSession::class, 'terminal_id');
    }

    public function activeSession(): ?PosSession
    {
        return $this->sessions()->where('status', 'open')->latest()->first();
    }
}
