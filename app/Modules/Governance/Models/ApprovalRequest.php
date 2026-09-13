<?php

namespace App\Modules\Governance\Models;

use App\Models\User;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ApprovalRequest extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'approval_requests';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'rule_id',
        'document_type',
        'document_id',
        'document_number',
        'amount',
        'currency',
        'requester_id',
        'current_level',
        'total_levels',
        'status', // pending, approved, rejected, cancelled
        'notes',
        'approved_at',
        'rejected_at',
    ];

    protected $casts = [
        'amount' => 'decimal:4',
        'current_level' => 'integer',
        'total_levels' => 'integer',
        'requester_id' => 'integer',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function rule(): BelongsTo
    {
        return $this->belongsTo(ApprovalRule::class, 'rule_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(ApprovalAction::class, 'approval_request_id')->orderBy('level_number');
    }

    public function currentLevelRule(): ?ApprovalRuleLevel
    {
        if (! $this->rule) {
            return null;
        }

        return $this->rule->levels->firstWhere('level_number', $this->current_level);
    }
}
