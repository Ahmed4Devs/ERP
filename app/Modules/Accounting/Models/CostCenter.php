<?php

namespace App\Modules\Accounting\Models;

use App\Models\User;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CostCenter extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'cost_centers';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'parent_id',
        'code',
        'name',
        'name_ar',
        'type', // operational, project, department, fleet, overhead
        'manager_id',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'manager_id' => 'integer',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(CostCenter::class, 'parent_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function journalLines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class, 'cost_center_id');
    }

    public function budgets(): HasMany
    {
        return $this->hasMany(Budget::class, 'cost_center_id');
    }
}
