<?php

namespace App\Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Purchasing\Models\PurchaseOrder;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Services\PostVendorBillAction;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VendorBillController extends Controller
{
    public function __construct(
        protected PostVendorBillAction $postVendorBillAction
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $bills = VendorBill::where('company_id', $companyId)
            ->with(['party', 'purchaseOrder'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('bill_number', 'ilike', "%{$search}%")
                        ->orWhere('vendor_invoice_ref', 'ilike', "%{$search}%")
                        ->orWhereHas('party', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Purchasing/Bills/Index', [
            'bills' => $bills,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(Request $request): Response
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

        $prefillFromPo = null;
        if ($request->po_id) {
            $prefillFromPo = PurchaseOrder::where('company_id', $companyId)
                ->with('lines')
                ->find($request->po_id);
        }

        return Inertia::render('Purchasing/Bills/Create', [
            'vendors' => $vendors,
            'expenseAccounts' => $expenseAccounts,
            'prefillFromPo' => $prefillFromPo,
            'defaultDate' => now()->toDateString(),
            'defaultDueDate' => now()->addDays(30)->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'party_id' => ['nullable', 'string', 'uuid'],
            'vendor_id' => ['nullable', 'string', 'uuid'],
            'date' => ['nullable', 'date'],
            'bill_date' => ['nullable', 'date'],
            'due_date' => ['required', 'date'],
            'vendor_invoice_ref' => ['nullable', 'string', 'max:100'],
            'vendor_bill_number' => ['nullable', 'string', 'max:100'],
            'purchase_order_id' => ['nullable', 'string', 'uuid'],
            'expense_account_id' => ['nullable', 'string', 'uuid'],
            'notes' => ['nullable', 'string'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.description' => ['required', 'string', 'max:255'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.000001'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.expense_account_id' => ['nullable', 'string', 'uuid'],
        ]);

        $bill = $this->postVendorBillAction->execute($validated);

        return redirect()->route('vendor-bills.show', $bill->id)->with('success', "Vendor Bill {$bill->bill_number} created and posted successfully.");
    }

    public function show(string $id): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $bill = VendorBill::where('company_id', $companyId)
            ->with([
                'party',
                'lines.expenseAccount',
                'purchaseOrder',
                'journalEntry.lines.account',
                'allocations.payment',
            ])
            ->findOrFail($id);

        return Inertia::render('Purchasing/Bills/Show', [
            'bill' => $bill,
        ]);
    }

    public function print(string $id, TafqeetService $tafqeetService, QrCodeSvgService $qrSvgService): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $bill = VendorBill::where('company_id', $companyId)
            ->with([
                'party',
                'lines.expenseAccount',
                'purchaseOrder',
                'journalEntry.lines.account',
                'allocations.payment',
                'company',
            ])
            ->findOrFail($id);

        $company = $bill->company ?: $currentCompany->get();
        $qrPayload = "Vendor Bill: {$bill->bill_number} | Supplier: {$bill->party?->name} | Tax ID: {$bill->party?->tax_id} | Total: {$bill->total} SAR | Tax: {$bill->tax_amount} SAR";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        return Inertia::render('Purchasing/Bills/Print', [
            'bill' => $bill,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($bill->total),
                'en' => $tafqeetService->inEnglish($bill->total),
            ],
        ]);
    }
}
