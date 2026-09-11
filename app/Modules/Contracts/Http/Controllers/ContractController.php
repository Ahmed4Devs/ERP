<?php

namespace App\Modules\Contracts\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Contracts\Models\Contract;
use App\Modules\Contracts\Models\ContractLine;
use App\Modules\Contracts\Services\GenerateContractBillingInvoiceAction;
use App\Modules\MasterData\Models\Party;
use App\Modules\Projects\Models\Project;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ContractController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $contracts = Contract::where('company_id', $companyId)
            ->with(['customer', 'project'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('contract_number', 'ilike', "%{$search}%")
                        ->orWhere('title', 'ilike', "%{$search}%")
                        ->orWhere('title_ar', 'ilike', "%{$search}%")
                        ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('start_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Contracts/Index', [
            'contracts' => $contracts,
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

        $projects = Project::where('company_id', $companyId)
            ->orderBy('name', 'asc')
            ->get(['id', 'project_number', 'name']);

        return Inertia::render('Contracts/Create', [
            'customers' => $customers,
            'projects' => $projects,
            'defaultStartDate' => now()->toDateString(),
            'defaultEndDate' => now()->addYear()->toDateString(),
            'defaultNextBillingDate' => now()->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $validated = $request->validate([
            'customer_id' => 'required|uuid|exists:parties,id',
            'project_id' => 'nullable|uuid|exists:projects,id',
            'title' => 'required|string|max:150',
            'title_ar' => 'nullable|string|max:150',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'billing_cycle' => 'required|string|in:monthly,quarterly,semi_annual,annual',
            'recurring_amount' => 'required|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0',
            'next_billing_date' => 'required|date',
            'status' => 'required|string|in:draft,active,suspended,expired,terminated',
            'auto_renew' => 'boolean',
            'notes' => 'nullable|string',
            'lines' => 'nullable|array',
            'lines.*.description' => 'required|string|max:255',
            'lines.*.quantity' => 'required|numeric|min:0.000001',
            'lines.*.unit_price' => 'required|numeric|min:0',
        ]);

        $contract = DB::transaction(function () use ($validated, $currentTenant, $currentCompany) {
            $contractNumber = 'CNT-'.date('Ymd').'-'.strtoupper(substr(uniqid(), -4));

            $c = Contract::create([
                'tenant_id' => $currentTenant->id(),
                'company_id' => $currentCompany->id(),
                'contract_number' => $contractNumber,
                'customer_id' => $validated['customer_id'],
                'project_id' => $validated['project_id'] ?? null,
                'title' => $validated['title'],
                'title_ar' => $validated['title_ar'] ?? null,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'billing_cycle' => $validated['billing_cycle'],
                'recurring_amount' => $validated['recurring_amount'],
                'tax_rate' => $validated['tax_rate'] ?? '0.100000',
                'next_billing_date' => $validated['next_billing_date'],
                'status' => $validated['status'],
                'auto_renew' => $validated['auto_renew'] ?? false,
                'notes' => $validated['notes'] ?? null,
            ]);

            if (! empty($validated['lines'])) {
                foreach ($validated['lines'] as $line) {
                    $qty = number_format((float) $line['quantity'], 6, '.', '');
                    $price = number_format((float) $line['unit_price'], 6, '.', '');
                    ContractLine::create([
                        'tenant_id' => $currentTenant->id(),
                        'company_id' => $currentCompany->id(),
                        'contract_id' => $c->id,
                        'description' => $line['description'],
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'line_total' => bcmul($qty, $price, 6),
                    ]);
                }
            }

            return $c;
        });

        return redirect()->route('contracts.show', $contract->id)
            ->with('success', 'Contract created successfully.');
    }

    public function show(Contract $contract): Response
    {
        $contract->load(['customer', 'project', 'lines']);

        return Inertia::render('Contracts/Show', [
            'contract' => $contract,
        ]);
    }

    public function bill(Contract $contract, GenerateContractBillingInvoiceAction $action): RedirectResponse
    {
        $invoice = $action->execute($contract);

        return redirect()->route('contracts.show', $contract->id)
            ->with('success', "Invoice {$invoice->invoice_number} successfully generated and posted to GL.");
    }
}
