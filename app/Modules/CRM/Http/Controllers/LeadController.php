<?php

namespace App\Modules\CRM\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\CRM\Models\Lead;
use App\Modules\CRM\Services\ConvertLeadAction;
use App\Modules\MasterData\Models\Party;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $leads = Lead::where('company_id', $companyId)
            ->with(['party', 'assignedUser'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('lead_number', 'ilike', "%{$search}%")
                        ->orWhere('title', 'ilike', "%{$search}%")
                        ->orWhere('contact_name', 'ilike', "%{$search}%")
                        ->orWhere('company_name', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%");
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('CRM/Leads/Index', [
            'leads' => $leads,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
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
            ->get(['id', 'name', 'name_ar']);

        $users = User::orderBy('name', 'asc')->get(['id', 'name', 'email']);

        return Inertia::render('CRM/Leads/Create', [
            'customers' => $customers,
            'users' => $users,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'party_id' => 'nullable|uuid|exists:parties,id',
            'contact_name' => 'required|string|max:100',
            'email' => 'nullable|email|max:150',
            'phone' => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:150',
            'source' => 'required|string|in:website,referral,cold_call,partner,exhibition',
            'status' => 'required|string|in:new,contacted,qualified,proposal,won,lost',
            'estimated_value' => 'nullable|numeric|min:0',
            'probability_percent' => 'nullable|integer|min:0|max:100',
            'assigned_user_id' => 'nullable|integer|exists:users,id',
            'loss_reason' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $leadNumber = 'LD-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4));

        $lead = Lead::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'lead_number' => $leadNumber,
            'title' => $validated['title'],
            'party_id' => $validated['party_id'] ?? null,
            'contact_name' => $validated['contact_name'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'company_name' => $validated['company_name'] ?? null,
            'source' => $validated['source'],
            'status' => $validated['status'],
            'estimated_value' => $validated['estimated_value'] ?? '0.000000',
            'probability_percent' => $validated['probability_percent'] ?? 20,
            'assigned_user_id' => $validated['assigned_user_id'] ?? null,
            'loss_reason' => $validated['loss_reason'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('crm.leads.show', $lead->id)
            ->with('success', 'Lead created successfully.');
    }

    public function show(Lead $lead): Response
    {
        $lead->load(['party', 'assignedUser']);

        return Inertia::render('CRM/Leads/Show', [
            'lead' => $lead,
        ]);
    }

    public function convert(Lead $lead, ConvertLeadAction $action): RedirectResponse
    {
        $result = $action->execute($lead);

        return redirect()->route('crm.leads.show', $lead->id)
            ->with('success', 'Lead successfully converted to Customer and Sales Quotation.');
    }
}
