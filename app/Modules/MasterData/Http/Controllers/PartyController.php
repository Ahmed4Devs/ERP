<?php

namespace App\Modules\MasterData\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\MasterData\Models\CustomerProfile;
use App\Modules\MasterData\Models\Party;
use App\Modules\Platform\Services\AuditLogger;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartyController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $parties = Party::query()
            ->with(['customerProfiles' => function ($query) use ($companyId): void {
                if ($companyId) {
                    $query->where('company_id', $companyId);
                }
            }])
            ->when($request->search, function ($query, $search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'ilike', "%{$search}%")
                        ->orWhere('name_ar', 'ilike', "%{$search}%")
                        ->orWhere('email', 'ilike', "%{$search}%")
                        ->orWhere('phone', 'ilike', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $parties->through(function ($party) {
            foreach ($party->customerProfiles as $cp) {
                $cp->ensurePortalToken();
            }

            return $party;
        });

        return Inertia::render('MasterData/Customers/Index', [
            'parties' => $parties,
            'filters' => [
                'search' => $request->search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:customer,vendor,both,partner'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'payment_terms_days' => ['nullable', 'integer', 'min:0'],
        ]);

        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        if (! $currentTenant->check() || ! $currentCompany->check()) {
            abort(403, 'Active Tenant and Company context required.');
        }

        $party = Party::create([
            'tenant_id' => $currentTenant->id(),
            'name' => $validated['name'],
            'name_ar' => $validated['name_ar'] ?? null,
            'type' => $validated['type'],
            'tax_id' => $validated['tax_id'] ?? null,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'status' => 'active',
        ]);

        $profile = CustomerProfile::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'party_id' => $party->id,
            'credit_limit' => $validated['credit_limit'] ?? 0,
            'payment_terms_days' => $validated['payment_terms_days'] ?? 30,
            'currency' => $currentCompany->get()?->currency ?? 'USD',
            'is_active' => true,
        ]);

        AuditLogger::log(
            action: 'party.created',
            entityType: Party::class,
            entityId: $party->id,
            newValues: [
                'party' => $party->toArray(),
                'profile' => $profile->toArray(),
            ]
        );

        return redirect()->route('customers.index')->with('success', 'Customer created successfully.');
    }

    public function destroy(Party $party): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        if ($party->tenant_id !== $currentTenant->id()) {
            abort(403, 'Unauthorized access to party in another tenant.');
        }

        $oldData = $party->toArray();
        $party->delete();

        AuditLogger::log(
            action: 'party.deleted',
            entityType: Party::class,
            entityId: $party->id,
            oldValues: $oldData
        );

        return redirect()->route('customers.index')->with('success', 'Customer deleted successfully.');
    }
}
