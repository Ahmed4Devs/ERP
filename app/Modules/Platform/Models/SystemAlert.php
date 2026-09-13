<?php

namespace App\Modules\Platform\Models;

use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SystemAlert extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'system_alerts';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'alert_type',
        'title',
        'title_ar',
        'message',
        'message_ar',
        'severity',
        'source_type',
        'source_id',
        'action_url',
        'is_read',
        'is_dismissed',
        'read_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'is_dismissed' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function source(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'source_type', 'source_id');
    }
}
