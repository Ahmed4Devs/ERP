<?php

namespace App\Modules\Support\Services;

use App\Models\User;
use App\Modules\Support\Models\SupportTicket;
use App\Modules\Support\Models\SupportTicketMessage;
use Illuminate\Support\Facades\DB;

class ResolveTicketAction
{
    /**
     * Resolve a support ticket with optional closing notes or response.
     */
    public function execute(SupportTicket $ticket, ?string $resolutionMessage = null, ?User $agent = null): SupportTicket
    {
        return DB::transaction(function () use ($ticket, $resolutionMessage, $agent) {
            $ticket->status = 'resolved';
            $ticket->resolved_at = now();
            if ($agent && ! $ticket->assigned_user_id) {
                $ticket->assigned_user_id = $agent->id;
            }
            $ticket->save();

            if (! empty($resolutionMessage)) {
                SupportTicketMessage::create([
                    'tenant_id' => $ticket->tenant_id,
                    'company_id' => $ticket->company_id,
                    'ticket_id' => $ticket->id,
                    'user_id' => $agent?->id,
                    'sender_type' => 'agent',
                    'sender_name' => $agent?->name ?? 'Support Team',
                    'message' => $resolutionMessage,
                ]);
            }

            return $ticket;
        });
    }
}
