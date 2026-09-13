<?php

namespace App\Modules\Accounting\Models;

use App\Models\User;
use App\Modules\Organization\Models\Company;
use App\Modules\Platform\Models\Tenant;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BankReconciliation extends Model
{
    use BelongsToCompany, HasUuids, SoftDeletes;

    protected $table = 'bank_reconciliations';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'bank_account_id',
        'statement_number',
        'statement_date',
        'start_date',
        'end_date',
        'opening_balance',
        'closing_balance',
        'cleared_balance',
        'difference',
        'status', // draft, in_progress, reconciled
        'reconciled_at',
        'reconciled_by',
        'notes',
    ];

    protected $casts = [
        'statement_date' => 'date',
        'start_date' => 'date',
        'end_date' => 'date',
        'opening_balance' => 'decimal:6',
        'closing_balance' => 'decimal:6',
        'cleared_balance' => 'decimal:6',
        'difference' => 'decimal:6',
        'reconciled_at' => 'datetime',
    ];

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'bank_account_id');
    }

    public function reconciledByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reconciled_by');
    }

    public function statementLines(): HasMany
    {
        return $this->hasMany(BankStatementLine::class, 'bank_reconciliation_id');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
