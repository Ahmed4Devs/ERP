<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Services\PostServiceInvoiceAction;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\Localization\Services\ZatcaQrCodeService;
use App\Modules\MasterData\Models\Party;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function __construct(
        protected PostServiceInvoiceAction $postServiceInvoiceAction
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $invoices = ServiceInvoice::where('company_id', $companyId)
            ->with(['party'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('invoice_number', 'ilike', "%{$search}%")
                        ->orWhereHas('party', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Accounting/Invoices/Index', [
            'invoices' => $invoices,
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

        $customers = Party::whereHas('customerProfiles', fn ($q) => $q->where('company_id', $companyId))
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_ar', 'tax_id']);

        $revenueAccounts = Account::where('company_id', $companyId)
            ->where('type', 'revenue')
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get(['id', 'code', 'name', 'name_ar']);

        return Inertia::render('Accounting/Invoices/Create', [
            'customers' => $customers,
            'revenueAccounts' => $revenueAccounts,
            'defaultDate' => now()->toDateString(),
            'defaultDueDate' => now()->addDays(30)->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'party_id' => ['required', 'string', 'uuid'],
            'date' => ['required', 'date'],
            'due_date' => ['required', 'date', 'after_or_equal:date'],
            'notes' => ['nullable', 'string'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.description' => ['required', 'string', 'max:255'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.000001'],
            'lines.*.unit_price' => ['required', 'numeric', 'min:0'],
            'lines.*.revenue_account_id' => ['nullable', 'string', 'uuid'],
        ]);

        $invoice = $this->postServiceInvoiceAction->execute($validated);

        return redirect()->route('invoices.show', $invoice->id)->with('success', "Invoice {$invoice->invoice_number} created and posted successfully.");
    }

    public function show(string $id): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $invoice = ServiceInvoice::where('company_id', $companyId)
            ->with([
                'party',
                'lines.revenueAccount',
                'journalEntry.lines.account',
                'allocations.receipt',
            ])
            ->findOrFail($id);

        return Inertia::render('Accounting/Invoices/Show', [
            'invoice' => $invoice,
        ]);
    }

    public function print(
        string $id,
        ZatcaQrCodeService $zatcaQrService,
        QrCodeSvgService $qrSvgService,
        TafqeetService $tafqeetService
    ): Response {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $invoice = ServiceInvoice::where('company_id', $companyId)
            ->with([
                'party',
                'lines.revenueAccount',
                'company',
                'branch',
                'allocations.receipt',
            ])
            ->findOrFail($id);

        $company = $invoice->company ?: $currentCompany->get();
        $sellerName = $company?->legal_name ?: ($company?->name ?: 'شركة الحلول المتكاملة للأعمال');
        $vatNumber = $company?->tax_number ?: '300123456700003';
        $timestamp = $invoice->created_at ? $invoice->created_at->toIso8601String() : now()->toIso8601String();

        $tlvBase64 = $zatcaQrService->generateBase64Tlv(
            sellerName: $sellerName,
            vatNumber: $vatNumber,
            timestamp: $timestamp,
            totalWithVat: (string) $invoice->total,
            vatTotal: (string) $invoice->tax_amount
        );

        $qrCodeDataUri = $qrSvgService->generateDataUri($tlvBase64, 180);

        return Inertia::render('Accounting/Invoices/Print', [
            'invoice' => $invoice,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($invoice->total),
                'en' => $tafqeetService->inEnglish($invoice->total),
            ],
        ]);
    }
}
