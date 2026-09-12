<?php

namespace App\Modules\Purchasing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\MasterData\Models\Party;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Purchasing\Models\VendorPayment;
use App\Modules\Purchasing\Services\PostVendorPaymentAndAllocateAction;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VendorPaymentController extends Controller
{
    public function __construct(
        protected PostVendorPaymentAndAllocateAction $postVendorPaymentAndAllocateAction
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $payments = VendorPayment::where('company_id', $companyId)
            ->with(['party', 'paymentAccount', 'allocations.bill'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('payment_number', 'ilike', "%{$search}%")
                        ->orWhereHas('party', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%"));
                });
            })
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        $vendors = Party::where(function ($q) use ($companyId): void {
            $q->whereHas('vendorProfiles', fn ($vq) => $vq->where('company_id', $companyId))
                ->orWhereIn('type', ['vendor', 'both']);
        })
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_ar']);

        $disbursementAccounts = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('type', 'asset')->whereIn('subtype', ['bank', 'cash', 'current_asset']);
            })
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get(['id', 'code', 'name', 'name_ar']);

        $openBills = VendorBill::where('company_id', $companyId)
            ->whereIn('status', ['posted', 'partially_paid'])
            ->with('party:id,name,name_ar')
            ->get(['id', 'bill_number', 'party_id', 'total', 'amount_paid', 'balance_due', 'date']);

        return Inertia::render('Purchasing/Payments/Index', [
            'payments' => $payments,
            'vendors' => $vendors,
            'disbursementAccounts' => $disbursementAccounts,
            'openBills' => $openBills,
            'filters' => [
                'search' => $request->search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'party_id' => ['nullable', 'string', 'uuid'],
            'vendor_id' => ['nullable', 'string', 'uuid'],
            'payment_account_id' => ['nullable', 'string', 'uuid'],
            'bank_account_id' => ['nullable', 'string', 'uuid'],
            'date' => ['nullable', 'date'],
            'payment_date' => ['nullable', 'date'],
            'amount' => ['required', 'numeric', 'min:0.000001'],
            'payment_method' => ['required', 'string', 'in:bank_transfer,cash,check'],
            'notes' => ['nullable', 'string'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
            'allocations' => ['nullable', 'array'],
            'allocations.*.vendor_bill_id' => ['required_with:allocations', 'string', 'uuid'],
            'allocations.*.amount' => ['required_with:allocations', 'numeric', 'min:0.000001'],
        ]);

        $payment = $this->postVendorPaymentAndAllocateAction->execute($validated);

        return redirect()->route('vendor-payments.index')->with('success', "Vendor Payment {$payment->payment_number} posted and allocated successfully.");
    }

    public function print(string $id, TafqeetService $tafqeetService, QrCodeSvgService $qrSvgService): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $payment = VendorPayment::where('company_id', $companyId)
            ->with([
                'party',
                'paymentAccount',
                'allocations.bill',
                'company',
            ])
            ->findOrFail($id);

        $company = $payment->company ?: $currentCompany->get();
        $qrPayload = "Vendor Payment: {$payment->payment_number} | Amount: {$payment->amount} SAR | Date: {$payment->payment_date} | Beneficiary: {$payment->party?->name}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        return Inertia::render('Purchasing/Payments/Print', [
            'payment' => $payment,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($payment->amount),
                'en' => $tafqeetService->inEnglish($payment->amount),
            ],
        ]);
    }
}
