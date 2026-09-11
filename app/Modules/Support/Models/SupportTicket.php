<?php

namespace App\Modules\Support\Models;

use App\Models\User;
use App\Modules\MasterData\Models\Party;
use App\Modules\Projects\Models\Project;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'support_tickets';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'ticket_number',
        'customer_id',
        'project_id',
        'contact_name',
        'contact_email',
        'subject',
        'description',
        'priority', // low, medium, high, urgent
        'status', // open, in_progress, waiting_customer, resolved, closed
        'assigned_user_id',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class, 'ticket_id')->orderBy('created_at', 'asc');
    }
}
