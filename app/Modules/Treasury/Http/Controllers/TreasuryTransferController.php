<?php

namespace App\Modules\Treasury\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Treasury\Models\TreasuryTransfer;
use App\Modules\Treasury\Services\PostTreasuryTransferAction;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TreasuryTransferController extends Controller
{
    public function __construct(
        protected PostTreasuryTransferAction $postTreasuryTransferAction
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $transfers = TreasuryTransfer::where('company_id', $companyId)
            ->with(['fromAccount', 'toAccount', 'journalEntry'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('transfer_number', 'ilike', "%{$search}%")
                        ->orWhere('reference', 'ilike', "%{$search}%");
                });
            })
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        $accounts = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('type', 'asset')->whereIn('subtype', ['bank', 'cash', 'current_asset']);
            })
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get(['id', 'code', 'name', 'name_ar', 'current_balance', 'currency']);

        return Inertia::render('Treasury/Transfers/Index', [
            'transfers' => $transfers,
            'accounts' => $accounts,
            'defaultDate' => now()->toDateString(),
            'filters' => [
                'search' => $request->search,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'from_account_id' => ['required', 'string', 'uuid', 'different:to_account_id'],
            'to_account_id' => ['required', 'string', 'uuid', 'different:from_account_id'],
            'date' => ['nullable', 'date'],
            'transfer_date' => ['nullable', 'date'],
            'amount' => ['required', 'numeric', 'min:0.000001'],
            'reference' => ['nullable', 'string', 'max:100'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $payload = [
            'from_account_id' => $validated['from_account_id'],
            'to_account_id' => $validated['to_account_id'],
            'date' => $validated['date'] ?? $validated['transfer_date'] ?? now()->toDateString(),
            'amount' => $validated['amount'],
            'reference' => $validated['reference'] ?? $validated['reference_number'] ?? null,
            'notes' => $validated['notes'] ?? $validated['description'] ?? null,
        ];

        $transfer = $this->postTreasuryTransferAction->execute($payload);

        return redirect()->route('treasury.transfers.index')->with('success', "Transfer {$transfer->transfer_number} completed and posted successfully.");
    }
}
