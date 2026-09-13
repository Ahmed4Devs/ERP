<?php

namespace App\Modules\Governance\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalRuleLevel extends Model
{
    use HasUuids;

    protected $table = 'approval_rule_levels';

    protected $fillable = [
        'rule_id',
        'level_number',
        'level_name',
        'approver_role',
        'approver_user_id',
    ];

    protected $casts = [
        'level_number' => 'integer',
        'approver_user_id' => 'integer',
    ];

    public function rule(): BelongsTo
    {
        return $this->belongsTo(ApprovalRule::class, 'rule_id');
    }

    public function approverUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }
}
