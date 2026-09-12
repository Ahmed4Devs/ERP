<?php

namespace App\Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Modules\Purchasing\Models\PurchaseOrderLine;
use App\Modules\Purchasing\Models\VendorProfile;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $orders = PurchaseOrder::where('company_id', $companyId)
            ->with(['party', 'approver'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('po_number', 'ilike', "%{$search}%")
                        ->orWhereHas('party', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Purchasing/Orders/Index', [
            'orders' => $orders,
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

        $vendors = Party::where(function ($q) use ($companyId): void {
            $q->whereHas('vendorProfiles', fn ($vq) => $vq->where('company_id', $companyId))
                ->orWhereIn('type', ['vendor', 'both']);
        })
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_ar', 'tax_id']);

        $expenseAccounts = Account::where('company_id', $companyId)
            ->where('type', 'expense')
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get(['id', 'code', 'name', 'name_ar']);

        return Inertia::render('Purchasing/Orders/Create', [
            'vendors' => $vendors,
            'expenseAccounts' => $expenseAccounts,
            'defaultDate' => now()->toDateString(),
            'defaultDeliveryDate' => now()->addDays(14)->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentTenant = app(CurrentTenant::class);
        $currentCompany = app(CurrentCompany::class);

        $validated = $request->validate([
            'party_id' => ['nullable', 'string', 'uuid'],
            'vendor_id' => ['nullable', 'string', 'uuid'],
            'date' => ['nullable', 'date'],
            'order_date' => ['nullable', 'date'],
            'expected_delivery_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.description' => ['required', 'string', 'max:255'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.000001'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.expense_account_id' => ['nullable', 'string', 'uuid'],
        ]);

        $partyId = $validated['party_id'] ?? null;
        if (! $partyId && ! empty($validated['vendor_id'])) {
            $vendorProfile = VendorProfile::find($validated['vendor_id']);
            $partyId = $vendorProfile ? $vendorProfile->party_id : $validated['vendor_id'];
        }

        $date = $validated['date'] ?? $validated['order_date'] ?? now()->toDateString();
        $year = date('Y', strtotime($date));
        $count = PurchaseOrder::where('company_id', $currentCompany->id())
            ->whereYear('date', $year)
            ->count();
        $seq = str_pad((string) ($count + 1), 6, '0', STR_PAD_LEFT);
        $poNumber = "PO-{$year}-{$seq}";

        $taxRate = '0.100000';
        $subtotal = '0.000000';

        foreach ($validated['lines'] as $line) {
            $qty = number_format((float) $line['quantity'], 6, '.', '');
            $price = number_format((float) $line['unit_price'], 6, '.', '');
            $subtotal = bcadd($subtotal, bcmul($qty, $price, 6), 6);
        }

        $taxAmount = bcmul($subtotal, $taxRate, 6);
        $total = bcadd($subtotal, $taxAmount, 6);

        $order = PurchaseOrder::create([
            'tenant_id' => $currentTenant->id(),
            'company_id' => $currentCompany->id(),
            'branch_id' => $currentCompany->branchId(),
            'party_id' => $partyId,
            'po_number' => $poNumber,
            'date' => $date,
            'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
            'status' => 'draft',
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'total' => $total,
            'currency' => $currentCompany->get()?->currency ?? 'SAR',
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($validated['lines'] as $line) {
            $qty = number_format((float) $line['quantity'], 6, '.', '');
            $price = number_format((float) $line['unit_price'], 6, '.', '');
            $lineSubtotal = bcmul($qty, $price, 6);
            $lineTax = bcmul($lineSubtotal, $taxRate, 6);
            $lineTotal = bcadd($lineSubtotal, $lineTax, 6);

            PurchaseOrderLine::create([
                'tenant_id' => $currentTenant->id(),
                'company_id' => $currentCompany->id(),
                'purchase_order_id' => $order->id,
                'expense_account_id' => $line['expense_account_id'] ?? null,
                'description' => $line['description'],
                'quantity' => $qty,
                'unit_price' => $price,
                'subtotal' => $lineSubtotal,
                'tax_rate' => $taxRate,
                'tax_amount' => $lineTax,
                'line_total' => $lineTotal,
            ]);
        }

        return redirect()->route('purchase-orders.show', $order->id)->with('success', "Purchase Order {$order->po_number} created successfully.");
    }

    public function show(string $id): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $order = PurchaseOrder::where('company_id', $companyId)
            ->with(['party', 'lines.expenseAccount', 'approver', 'bills'])
            ->findOrFail($id);

        return Inertia::render('Purchasing/Orders/Show', [
            'order' => $order,
        ]);
    }

    public function approve(string $id): RedirectResponse
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $order = PurchaseOrder::where('company_id', $companyId)->findOrFail($id);

        if ($order->status !== 'draft') {
            return back()->with('error', "Cannot approve order with status {$order->status}.");
        }

        $order->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', "Purchase Order {$order->po_number} approved successfully.");
    }

    public function print(
        string $id,
        TafqeetService $tafqeetService,
        QrCodeSvgService $qrSvgService
    ): Response {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $order = PurchaseOrder::where('company_id', $companyId)
            ->with([
                'party',
                'lines.expenseAccount',
                'approver',
                'company',
            ])
            ->findOrFail($id);

        $company = $order->company ?: $currentCompany->get();
        $qrPayload = "PO: {$order->po_number} | Vendor: {$order->party?->name} | Total: {$order->total} SAR | Date: {$order->date}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        return Inertia::render('Purchasing/Orders/Print', [
            'order' => $order,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($order->total),
                'en' => $tafqeetService->inEnglish($order->total),
            ],
        ]);
    }
}
