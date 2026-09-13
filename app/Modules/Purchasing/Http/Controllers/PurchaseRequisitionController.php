<?php

namespace App\Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\HR\Models\Department;
use App\Modules\Inventory\Models\Product;
use App\Modules\MasterData\Models\Party;
use App\Modules\Purchasing\Models\PurchaseRequisition;
use App\Modules\Purchasing\Models\PurchaseRequisitionLine;
use App\Modules\Purchasing\Services\PurchaseRequisitionService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseRequisitionController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $requisitions = PurchaseRequisition::where('company_id', $companyId)
            ->with(['requester', 'approver', 'department', 'purchaseOrder'])
            ->when($request->search, function ($q, $search): void {
                $q->where('requisition_number', 'ilike', "%{$search}%")
                    ->orWhere('notes', 'ilike', "%{$search}%");
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->priority, fn ($q) => $q->where('priority', $request->priority))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Purchasing/Requisitions/Index', [
            'requisitions' => $requisitions,
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

        $departments = Department::where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $products = Product::where('company_id', $companyId)
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'moving_average_cost', 'standard_cost']);

        return Inertia::render('Purchasing/Requisitions/Create', [
            'departments' => $departments,
            'products' => $products,
            'defaultDate' => now()->addDays(7)->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $validated = $request->validate([
            'department_id' => ['nullable', 'string', 'uuid'],
            'required_date' => ['nullable', 'date'],
            'priority' => ['required', 'string', 'in:low,medium,high,urgent'],
            'notes' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['nullable', 'string', 'uuid'],
            'lines.*.description' => ['required', 'string', 'max:255'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.000001'],
            'lines.*.estimated_unit_cost' => ['required', 'numeric', 'min:0'],
            'lines.*.notes' => ['nullable', 'string'],
        ]);

        $year = now()->format('Y');
        $count = PurchaseRequisition::where('company_id', $currentCompany->id())
            ->whereYear('created_at', $year)
            ->count();
        $seq = str_pad((string) ($count + 1), 5, '0', STR_PAD_LEFT);
        $reqNumber = "PR-{$year}-{$seq}";

        $totalEstimated = '0.000000';
        foreach ($validated['lines'] as $line) {
            $qty = number_format((float) $line['quantity'], 6, '.', '');
            $cost = number_format((float) $line['estimated_unit_cost'], 6, '.', '');
            $totalEstimated = bcadd($totalEstimated, bcmul($qty, $cost, 6), 6);
        }

        $requisition = PurchaseRequisition::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'branch_id' => $currentCompany->branchId(),
            'department_id' => $validated['department_id'] ?? null,
            'requisition_number' => $reqNumber,
            'requested_by_id' => auth()->id(),
            'required_date' => $validated['required_date'] ?? null,
            'priority' => $validated['priority'],
            'status' => 'draft',
            'total_estimated_amount' => $totalEstimated,
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($validated['lines'] as $line) {
            $qty = number_format((float) $line['quantity'], 6, '.', '');
            $cost = number_format((float) $line['estimated_unit_cost'], 6, '.', '');
            $lineEstimatedTotal = bcmul($qty, $cost, 6);

            PurchaseRequisitionLine::create([
                'purchase_requisition_id' => $requisition->id,
                'product_id' => $line['product_id'] ?? null,
                'description' => $line['description'],
                'quantity' => $qty,
                'estimated_unit_cost' => $cost,
                'estimated_total' => $lineEstimatedTotal,
                'notes' => $line['notes'] ?? null,
            ]);
        }

        return redirect()->route('purchase-requisitions.show', $requisition->id)
            ->with('success', "Purchase Requisition {$requisition->requisition_number} created successfully.");
    }

    public function show(string $id): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $requisition = PurchaseRequisition::where('company_id', $companyId)
            ->with([
                'requester',
                'approver',
                'department',
                'branch',
                'purchaseOrder',
                'lines.product',
                'attachments.uploader',
            ])
            ->findOrFail($id);

        $vendors = Party::where(function ($q) use ($companyId): void {
            $q->whereHas('vendorProfiles', fn ($vq) => $vq->where('company_id', $companyId))
                ->orWhereIn('type', ['vendor', 'both']);
        })
            ->orderBy('name')
            ->get(['id', 'name', 'name_ar', 'tax_id']);

        return Inertia::render('Purchasing/Requisitions/Show', [
            'requisition' => $requisition,
            'vendors' => $vendors,
        ]);
    }

    public function submit(string $id, PurchaseRequisitionService $service): RedirectResponse
    {
        $currentCompany = app(CurrentCompany::class);
        $requisition = PurchaseRequisition::where('company_id', $currentCompany->id())->findOrFail($id);

        try {
            $service->submit($requisition);

            return back()->with('success', "Requisition {$requisition->requisition_number} submitted for approval.");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function approve(string $id, PurchaseRequisitionService $service): RedirectResponse
    {
        $currentCompany = app(CurrentCompany::class);
        $requisition = PurchaseRequisition::where('company_id', $currentCompany->id())->findOrFail($id);

        try {
            $service->approve($requisition, auth()->id());

            return back()->with('success', "Requisition {$requisition->requisition_number} approved successfully.");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function reject(Request $request, string $id, PurchaseRequisitionService $service): RedirectResponse
    {
        $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $currentCompany = app(CurrentCompany::class);
        $requisition = PurchaseRequisition::where('company_id', $currentCompany->id())->findOrFail($id);

        try {
            $service->reject($requisition, $request->reason);

            return back()->with('success', "Requisition {$requisition->requisition_number} rejected.");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function convertToPo(Request $request, string $id, PurchaseRequisitionService $service): RedirectResponse
    {
        $validated = $request->validate([
            'vendor_party_id' => ['required', 'string', 'uuid'],
            'expected_delivery_date' => ['nullable', 'date'],
            'line_overrides' => ['nullable', 'array'],
        ]);

        $currentCompany = app(CurrentCompany::class);
        $requisition = PurchaseRequisition::where('company_id', $currentCompany->id())->findOrFail($id);

        try {
            $po = $service->convertToPurchaseOrder(
                $requisition,
                $validated['vendor_party_id'],
                $validated['expected_delivery_date'] ?? null,
                $validated['line_overrides'] ?? []
            );

            return redirect()->route('purchase-orders.show', $po->id)
                ->with('success', "Requisition {$requisition->requisition_number} converted into Purchase Order {$po->po_number} successfully!");
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
