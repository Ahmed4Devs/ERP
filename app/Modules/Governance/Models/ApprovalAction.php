<?php

namespace App\Modules\Governance\Models;

use App\Models\User;
use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalAction extends Model
{
    use BelongsToTenant, HasUuids;

    protected $table = 'approval_actions';

    protected $fillable = [
        'tenant_id',
        'approval_request_id',
        'level_number',
        'action', // approved, rejected
        'actor_id',
        'comments',
        'action_at',
    ];

    protected $casts = [
        'level_number' => 'integer',
        'actor_id' => 'integer',
        'action_at' => 'datetime',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ApprovalRequest::class, 'approval_request_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
