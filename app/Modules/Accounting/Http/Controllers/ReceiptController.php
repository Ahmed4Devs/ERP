<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\Receipt;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Services\PostReceiptAndAllocateAction;
use App\Modules\MasterData\Models\Party;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    public function __construct(
        protected PostReceiptAndAllocateAction $postReceiptAndAllocateAction
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $receipts = Receipt::where('company_id', $companyId)
            ->with(['party', 'depositAccount', 'allocations.invoice'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('receipt_number', 'ilike', "%{$search}%")
                        ->orWhereHas('party', fn ($pq) => $pq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%"));
                });
            })
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        $customers = Party::whereHas('customerProfiles', fn ($q) => $q->where('company_id', $companyId))
            ->orderBy('name', 'asc')
            ->get(['id', 'name', 'name_ar']);

        $depositAccounts = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('type', 'asset')->whereIn('subtype', ['bank', 'cash', 'current_asset']);
            })
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get(['id', 'code', 'name', 'name_ar']);

        $openInvoices = ServiceInvoice::where('company_id', $companyId)
            ->whereIn('status', ['posted', 'partially_paid'])
            ->with('party:id,name,name_ar')
            ->get(['id', 'invoice_number', 'party_id', 'total', 'amount_paid', 'balance_due', 'date']);

        return Inertia::render('Accounting/Receipts/Index', [
            'receipts' => $receipts,
            'customers' => $customers,
            'depositAccounts' => $depositAccounts,
            'openInvoices' => $openInvoices,
            'filters' => [
                'search' => $request->search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'party_id' => ['required', 'string', 'uuid'],
            'deposit_account_id' => ['required', 'string', 'uuid'],
            'date' => ['required', 'date'],
            'amount' => ['required', 'numeric', 'min:0.000001'],
            'payment_method' => ['required', 'string', 'in:bank_transfer,cash,check'],
            'notes' => ['nullable', 'string'],
            'idempotency_key' => ['nullable', 'string', 'max:100'],
            'allocations' => ['nullable', 'array'],
            'allocations.*.service_invoice_id' => ['required_with:allocations', 'string', 'uuid'],
            'allocations.*.amount' => ['required_with:allocations', 'numeric', 'min:0.000001'],
        ]);

        $receipt = $this->postReceiptAndAllocateAction->execute($validated);

        return redirect()->route('receipts.index')->with('success', "Receipt {$receipt->receipt_number} posted and allocated successfully.");
    }
}
