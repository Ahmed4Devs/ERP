<?php

namespace App\Modules\Accounting\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetLine extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'budget_lines';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'budget_id',
        'account_id',
        'cost_center_id',
        'period_month',
        'planned_amount',
        'notes',
    ];

    protected $casts = [
        'period_month' => 'integer',
        'planned_amount' => 'decimal:4',
    ];

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class, 'budget_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'cost_center_id');
    }
}
