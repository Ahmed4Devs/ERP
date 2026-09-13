<?php

namespace App\Modules\Contracting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Contracting\Actions\ApproveAndBillProgressClaimAction;
use App\Modules\Contracting\Models\ContractingClaim;
use App\Modules\Contracting\Models\ContractingClaimItem;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Projects\Models\Project;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ContractingClaimController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $claims = ContractingClaim::where('company_id', $companyId)
            ->with(['project', 'customer', 'invoice'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->search, function ($q, $search) {
                $q->where('claim_number', 'ilike', "%{$search}%")
                    ->orWhereHas('project', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%"))
                    ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%"));
            })
            ->orderBy('claim_date', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Contracting/Claims/Index', [
            'claims' => $claims,
            'filters' => [
                'status' => $request->status,
                'search' => $request->search,
            ],
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $projects = Project::where('company_id', $companyId)->get();
        $customers = Party::where('type', 'customer')->get();

        return Inertia::render('Contracting/Claims/Create', [
            'projects' => $projects,
            'customers' => $customers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        $tenantId = app(CurrentTenant::class)->id();

        $validated = $request->validate([
            'claim_number' => 'required|string|max:50',
            'project_id' => 'required|uuid|exists:projects,id',
            'customer_id' => 'required|uuid|exists:parties,id',
            'claim_date' => 'required|date',
            'contract_value' => 'required|numeric|min:0',
            'previous_billed_amount' => 'nullable|numeric|min:0',
            'retention_rate' => 'nullable|numeric|min:0|max:1',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.work_description' => 'required|string|max:255',
            'items.*.scheduled_value' => 'required|numeric|min:0',
            'items.*.previous_percentage' => 'nullable|numeric|min:0|max:1',
            'items.*.current_percentage' => 'required|numeric|min:0|max:1',
        ]);

        DB::transaction(function () use ($companyId, $tenantId, $validated) {
            $currentWorkAmount = '0.000000';
            $processedItems = [];

            foreach ($validated['items'] as $item) {
                $schedVal = number_format((float) $item['scheduled_value'], 6, '.', '');
                $prevPct = number_format((float) ($item['previous_percentage'] ?? 0), 4, '.', '');
                $currPct = number_format((float) $item['current_percentage'], 4, '.', '');

                $pctDelta = bcsub($currPct, $prevPct, 4);
                if (bccomp($pctDelta, '0.0000', 4) < 0) {
                    $pctDelta = '0.0000';
                }
                $itemAmount = bcmul($schedVal, $pctDelta, 6);
                $currentWorkAmount = bcadd($currentWorkAmount, $itemAmount, 6);

                $processedItems[] = [
                    'work_description' => $item['work_description'],
                    'scheduled_value' => $schedVal,
                    'previous_percentage' => $prevPct,
                    'current_percentage' => $currPct,
                    'current_amount' => $itemAmount,
                ];
            }

            $retentionRate = number_format((float) ($validated['retention_rate'] ?? '0.0500'), 4, '.', '');
            $retentionAmount = bcmul($currentWorkAmount, $retentionRate, 6);
            $netClaimAmount = bcsub($currentWorkAmount, $retentionAmount, 6);
            $taxAmount = bcmul($netClaimAmount, '0.100000', 6);
            $totalAmount = bcadd($netClaimAmount, $taxAmount, 6);

            $claim = ContractingClaim::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'claim_number' => strtoupper($validated['claim_number']),
                'project_id' => $validated['project_id'],
                'customer_id' => $validated['customer_id'],
                'claim_date' => $validated['claim_date'],
                'contract_value' => $validated['contract_value'],
                'previous_billed_amount' => $validated['previous_billed_amount'] ?? '0.000000',
                'current_work_amount' => $currentWorkAmount,
                'retention_rate' => $retentionRate,
                'retention_amount' => $retentionAmount,
                'net_claim_amount' => $netClaimAmount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'status' => 'draft',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($processedItems as $pItem) {
                ContractingClaimItem::create([
                    'tenant_id' => $tenantId,
                    'company_id' => $companyId,
                    'claim_id' => $claim->id,
                    'work_description' => $pItem['work_description'],
                    'scheduled_value' => $pItem['scheduled_value'],
                    'previous_percentage' => $pItem['previous_percentage'],
                    'current_percentage' => $pItem['current_percentage'],
                    'current_amount' => $pItem['current_amount'],
                ]);
            }
        });

        return redirect()->route('contracting.claims.index')
            ->with('success', 'Progress claim submitted successfully.');
    }

    public function show(ContractingClaim $claim): Response
    {
        abort_if($claim->tenant_id !== app(CurrentTenant::class)->id(), 403);

        $claim->load(['project', 'customer', 'invoice.lines', 'items']);

        return Inertia::render('Contracting/Claims/Show', [
            'claim' => $claim,
        ]);
    }

    public function bill(Request $request, ContractingClaim $claim, ApproveAndBillProgressClaimAction $billAction): RedirectResponse
    {
        abort_if($claim->tenant_id !== app(CurrentTenant::class)->id(), 403);

        $billAction->execute([
            'claim_id' => $claim->id,
            'notes' => $request->notes,
        ]);

        return redirect()->route('contracting.claims.show', $claim->id)
            ->with('success', 'Progress claim certified and official Service Invoice generated.');
    }

    public function print(string $id, TafqeetService $tafqeetService, QrCodeSvgService $qrSvgService): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $claim = ContractingClaim::where('company_id', $companyId)
            ->with(['project', 'customer', 'invoice', 'items', 'company'])
            ->findOrFail($id);

        $company = $claim->company ?: $currentCompany->get();
        $currency = $company->currency ?? 'SAR';
        $customerName = $claim->customer ? ($claim->customer->name_ar ?: $claim->customer->name) : 'Customer';

        $qrPayload = "Progress Claim: {$claim->claim_number} | Project: {$claim->project?->name} | Client: {$customerName} | Net Claim: {$claim->total_amount} {$currency} | Date: {$claim->claim_date}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        return Inertia::render('Contracting/Claims/Print', [
            'claim' => $claim,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($claim->total_amount),
                'en' => $tafqeetService->inEnglish($claim->total_amount),
            ],
        ]);
    }
}
