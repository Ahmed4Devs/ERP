<?php

namespace App\Modules\Accounting\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Budget extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'budgets';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'cost_center_id',
        'name',
        'fiscal_year',
        'status', // draft, approved, closed
        'notes',
    ];

    protected $casts = [
        'fiscal_year' => 'integer',
    ];

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'cost_center_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(BudgetLine::class, 'budget_id');
    }

    public function getTotalPlannedAmountAttribute(): float
    {
        return (float) $this->lines()->sum('planned_amount');
    }
}
