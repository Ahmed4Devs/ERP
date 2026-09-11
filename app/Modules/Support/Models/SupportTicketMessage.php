<?php

namespace App\Modules\Support\Models;

use App\Models\User;
use App\Shared\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupportTicketMessage extends Model
{
    use BelongsToCompany, HasUuids;

    protected $table = 'support_ticket_messages';

    protected $fillable = [
        'tenant_id',
        'company_id',
        'ticket_id',
        'user_id',
        'sender_type', // agent, customer
        'sender_name',
        'message',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
