<?php

namespace App\Modules\Support\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\MasterData\Models\Party;
use App\Modules\Projects\Models\Project;
use App\Modules\Support\Models\SupportTicket;
use App\Modules\Support\Models\SupportTicketMessage;
use App\Modules\Support\Services\ResolveTicketAction;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SupportTicketController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $tickets = SupportTicket::where('company_id', $companyId)
            ->with(['customer', 'project', 'assignedUser'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('ticket_number', 'ilike', "%{$search}%")
                        ->orWhere('subject', 'ilike', "%{$search}%")
                        ->orWhere('contact_name', 'ilike', "%{$search}%")
                        ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->priority, fn ($q) => $q->where('priority', $request->priority))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Support/Tickets/Index', [
            'tickets' => $tickets,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
                'priority' => $request->priority,
            ],
        ]);
    }

    public function create(): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $customers = Party::where(function ($q) use ($companyId): void {
            $q->whereHas('customerProfiles', fn ($cq) => $cq->where('company_id', $companyId))
                ->orWhereIn('type', ['customer', 'both']);
        })
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_ar', 'email', 'phone']);

        $projects = Project::where('company_id', $companyId)
            ->orderBy('name', 'asc')
            ->get(['id', 'project_number', 'name']);

        $users = User::orderBy('name', 'asc')->get(['id', 'name']);

        return Inertia::render('Support/Tickets/Create', [
            'customers' => $customers,
            'projects' => $projects,
            'users' => $users,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $validated = $request->validate([
            'customer_id' => 'required|uuid|exists:parties,id',
            'project_id' => 'nullable|uuid|exists:projects,id',
            'contact_name' => 'required|string|max:100',
            'contact_email' => 'nullable|email|max:150',
            'subject' => 'required|string|max:200',
            'description' => 'required|string',
            'priority' => 'required|string|in:low,medium,high,urgent',
            'assigned_user_id' => 'nullable|integer|exists:users,id',
        ]);

        $ticketNumber = 'TCK-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4));

        $ticket = SupportTicket::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'ticket_number' => $ticketNumber,
            'customer_id' => $validated['customer_id'],
            'project_id' => $validated['project_id'] ?? null,
            'contact_name' => $validated['contact_name'],
            'contact_email' => $validated['contact_email'] ?? null,
            'subject' => $validated['subject'],
            'description' => $validated['description'],
            'priority' => $validated['priority'],
            'status' => 'open',
            'assigned_user_id' => $validated['assigned_user_id'] ?? null,
        ]);

        SupportTicketMessage::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'ticket_id' => $ticket->id,
            'user_id' => null,
            'sender_type' => 'customer',
            'sender_name' => $validated['contact_name'],
            'message' => $validated['description'],
        ]);

        return redirect()->route('support.tickets.show', $ticket->id)
            ->with('success', 'Support Ticket created successfully.');
    }

    public function show(SupportTicket $ticket): Response
    {
        $ticket->load(['customer', 'project', 'assignedUser', 'messages.user']);

        return Inertia::render('Support/Tickets/Show', [
            'ticket' => $ticket,
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        $user = Auth::user();

        SupportTicketMessage::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'ticket_id' => $ticket->id,
            'user_id' => $user?->id,
            'sender_type' => 'agent',
            'sender_name' => $user?->name ?? 'Support Agent',
            'message' => $validated['message'],
        ]);

        if ($ticket->status === 'open') {
            $ticket->status = 'in_progress';
            $ticket->save();
        }

        return redirect()->route('support.tickets.show', $ticket->id)
            ->with('success', 'Response message added.');
    }

    public function resolve(Request $request, SupportTicket $ticket, ResolveTicketAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'resolution_message' => 'nullable|string',
        ]);

        $action->execute($ticket, $validated['resolution_message'] ?? null, Auth::user());

        return redirect()->route('support.tickets.show', $ticket->id)
            ->with('success', 'Ticket marked as resolved.');
    }
}
