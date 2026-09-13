<?php

namespace App\Modules\Governance\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalRule extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'approval_rules';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'module',
        'name',
        'min_amount',
        'max_amount',
        'required_levels',
        'is_active',
        'description',
    ];

    protected $casts = [
        'min_amount' => 'decimal:4',
        'max_amount' => 'decimal:4',
        'required_levels' => 'integer',
        'is_active' => 'boolean',
    ];

    public function levels(): HasMany
    {
        return $this->hasMany(ApprovalRuleLevel::class, 'rule_id')->orderBy('level_number');
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ApprovalRequest::class, 'rule_id');
    }
}
