<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\BankReconciliation;
use App\Modules\Accounting\Models\BankStatementLine;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\Accounting\Services\BankReconciliationService;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BankReconciliationController extends Controller
{
    public function __construct(
        protected BankReconciliationService $service
    ) {}

    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $reconciliations = BankReconciliation::where('company_id', $companyId)
            ->with(['bankAccount', 'reconciledByUser'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('statement_number', 'ilike', "%{$search}%")
                        ->orWhereHas('bankAccount', fn ($bq) => $bq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%")->orWhere('code', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->bank_account_id, fn ($q) => $q->where('bank_account_id', $request->bank_account_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('statement_date')
            ->paginate(15)
            ->withQueryString();

        $bankAccounts = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'bank')->orWhere('code', '1020');
            })
            ->where('is_postable', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'name_ar', 'current_balance']);

        return Inertia::render('Accounting/BankReconciliations/Index', [
            'reconciliations' => $reconciliations,
            'bankAccounts' => $bankAccounts,
            'filters' => [
                'search' => $request->search,
                'bank_account_id' => $request->bank_account_id,
                'status' => $request->status,
            ],
        ]);
    }

    public function create(): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $bankAccounts = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'bank')->orWhere('code', '1020');
            })
            ->where('is_postable', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'name_ar', 'current_balance']);

        return Inertia::render('Accounting/BankReconciliations/Create', [
            'bankAccounts' => $bankAccounts,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bank_account_id' => 'required|uuid|exists:accounts,id',
            'statement_number' => 'required|string|max:50',
            'statement_date' => 'required|date',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'opening_balance' => 'required|numeric',
            'closing_balance' => 'required|numeric',
            'notes' => 'nullable|string',
            'csv_file' => 'nullable|file|mimes:csv,txt|max:5120',
        ]);

        $tenantId = app(CurrentTenant::class)->id();
        $companyId = app(CurrentCompany::class)->id();

        $recon = BankReconciliation::create([
            'tenant_id' => $tenantId,
            'company_id' => $companyId,
            'bank_account_id' => $validated['bank_account_id'],
            'statement_number' => $validated['statement_number'],
            'statement_date' => $validated['statement_date'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'opening_balance' => $validated['opening_balance'],
            'closing_balance' => $validated['closing_balance'],
            'cleared_balance' => $validated['opening_balance'],
            'difference' => bcsub((string) $validated['closing_balance'], (string) $validated['opening_balance'], 6),
            'status' => 'draft',
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($request->hasFile('csv_file')) {
            $csvContent = file_get_contents($request->file('csv_file')->getRealPath());
            $this->service->importCsv($recon, $csvContent);
        }

        $this->service->recalculate($recon);

        return redirect()->route('accounting.bank-reconciliation.show', $recon->id)
            ->with('success', "Bank statement {$recon->statement_number} created successfully.");
    }

    public function show(BankReconciliation $bankReconciliation): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        if ($bankReconciliation->company_id !== $companyId) {
            abort(403);
        }

        $this->service->recalculate($bankReconciliation);

        $bankReconciliation->load([
            'bankAccount',
            'reconciledByUser',
            'statementLines.matchedJournalLine.journalEntry',
        ]);

        // Get all already matched GL IDs for this bank account across all reconciliations
        $alreadyMatchedGlIds = BankStatementLine::whereNotNull('matched_journal_entry_line_id')
            ->pluck('matched_journal_entry_line_id')
            ->toArray();

        // Get GL transactions for this bank account up to reconciliation end date
        $glTransactions = JournalEntryLine::where('account_id', $bankReconciliation->bank_account_id)
            ->whereHas('journalEntry', function ($q) use ($bankReconciliation): void {
                $q->where('status', 'posted')
                    ->where('date', '<=', $bankReconciliation->end_date);
            })
            ->with('journalEntry')
            ->orderBy('created_at')
            ->get()
            ->map(function ($glLine) use ($alreadyMatchedGlIds, $bankReconciliation) {
                $isMatchedInThis = $bankReconciliation->statementLines->contains('matched_journal_entry_line_id', $glLine->id);
                $isMatchedElsewhere = in_array($glLine->id, $alreadyMatchedGlIds, true) && ! $isMatchedInThis;

                return [
                    'id' => $glLine->id,
                    'journal_entry_id' => $glLine->journal_entry_id,
                    'entry_number' => $glLine->journalEntry->entry_number,
                    'date' => $glLine->journalEntry->date,
                    'description' => $glLine->description ?: $glLine->journalEntry->description,
                    'debit' => (float) $glLine->debit,
                    'credit' => (float) $glLine->credit,
                    'amount' => (float) $glLine->debit > 0 ? (float) $glLine->debit : (float) $glLine->credit,
                    'type' => (float) $glLine->debit > 0 ? 'deposit' : 'withdrawal',
                    'is_matched' => $isMatchedInThis || $isMatchedElsewhere,
                    'is_matched_in_this' => $isMatchedInThis,
                    'is_matched_elsewhere' => $isMatchedElsewhere,
                ];
            });

        return Inertia::render('Accounting/BankReconciliations/Show', [
            'reconciliation' => $bankReconciliation,
            'glTransactions' => $glTransactions,
        ]);
    }

    public function autoMatch(BankReconciliation $bankReconciliation): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        if ($bankReconciliation->company_id !== $companyId) {
            abort(403);
        }

        if ($bankReconciliation->status === 'reconciled') {
            return back()->with('error', 'Reconciliation is already finalized and locked.');
        }

        $result = $this->service->autoMatch($bankReconciliation);

        return back()->with('success', "Auto-match completed! Matched {$result['matched_count']} transaction(s). Remaining difference: {$result['difference']} SAR.");
    }

    public function match(Request $request, BankReconciliation $bankReconciliation): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        if ($bankReconciliation->company_id !== $companyId) {
            abort(403);
        }

        if ($bankReconciliation->status === 'reconciled') {
            return back()->with('error', 'Reconciliation is already finalized and locked.');
        }

        $validated = $request->validate([
            'statement_line_id' => 'required|uuid|exists:bank_statement_lines,id',
            'journal_line_id' => 'required|uuid|exists:journal_entry_lines,id',
        ]);

        $this->service->manualMatch($bankReconciliation, $validated['statement_line_id'], $validated['journal_line_id']);

        return back()->with('success', 'Lines matched successfully.');
    }

    public function unmatch(Request $request, BankReconciliation $bankReconciliation): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        if ($bankReconciliation->company_id !== $companyId) {
            abort(403);
        }

        if ($bankReconciliation->status === 'reconciled') {
            return back()->with('error', 'Reconciliation is already finalized and locked.');
        }

        $validated = $request->validate([
            'statement_line_id' => 'required|uuid|exists:bank_statement_lines,id',
        ]);

        $this->service->unmatch($bankReconciliation, $validated['statement_line_id']);

        return back()->with('success', 'Match removed.');
    }

    public function importLines(Request $request, BankReconciliation $bankReconciliation): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        if ($bankReconciliation->company_id !== $companyId) {
            abort(403);
        }

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $csvContent = file_get_contents($request->file('csv_file')->getRealPath());
        $count = $this->service->importCsv($bankReconciliation, $csvContent);

        return back()->with('success', "Successfully imported {$count} statement lines.");
    }

    public function finalize(BankReconciliation $bankReconciliation): RedirectResponse
    {
        $companyId = app(CurrentCompany::class)->id();
        if ($bankReconciliation->company_id !== $companyId) {
            abort(403);
        }

        try {
            $this->service->finalize($bankReconciliation, auth()->id());

            return back()->with('success', 'Bank reconciliation finalized and locked successfully.');
        } catch (\InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function print(BankReconciliation $bankReconciliation, QrCodeSvgService $qrSvgService, TafqeetService $tafqeetService): Response
    {
        $companyId = app(CurrentCompany::class)->id();
        if ($bankReconciliation->company_id !== $companyId) {
            abort(403);
        }

        $this->service->recalculate($bankReconciliation);

        $bankReconciliation->load([
            'bankAccount',
            'reconciledByUser',
            'statementLines.matchedJournalLine.journalEntry',
            'company',
        ]);

        $company = $bankReconciliation->company ?: app(CurrentCompany::class)->get();

        // Calculate Outstanding Deposits (GL deposits not yet cleared on bank statement)
        $matchedGlIds = $bankReconciliation->statementLines->where('is_reconciled', true)->pluck('matched_journal_entry_line_id')->filter()->toArray();

        $unreconciledGl = JournalEntryLine::where('account_id', $bankReconciliation->bank_account_id)
            ->whereHas('journalEntry', function ($q) use ($bankReconciliation): void {
                $q->where('status', 'posted')
                    ->where('date', '<=', $bankReconciliation->end_date);
            })
            ->whereNotIn('id', $matchedGlIds)
            ->with('journalEntry')
            ->get();

        $depositsInTransit = $unreconciledGl->where('debit', '>', 0);
        $outstandingChecks = $unreconciledGl->where('credit', '>', 0);

        $totalDepositsInTransit = $depositsInTransit->sum(fn ($l) => (float) $l->debit);
        $totalOutstandingChecks = $outstandingChecks->sum(fn ($l) => (float) $l->credit);

        $bankClosing = (float) $bankReconciliation->closing_balance;
        $adjustedBankBalance = $bankClosing + $totalDepositsInTransit - $totalOutstandingChecks;

        $qrPayload = "Recon: {$bankReconciliation->statement_number} | Bank: {$bankReconciliation->bankAccount?->name} | Balance: {$bankReconciliation->closing_balance} SAR | Date: {$bankReconciliation->statement_date}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        return Inertia::render('Accounting/BankReconciliations/Print', [
            'reconciliation' => $bankReconciliation,
            'company' => $company,
            'depositsInTransit' => $depositsInTransit->values(),
            'outstandingChecks' => $outstandingChecks->values(),
            'totalDepositsInTransit' => $totalDepositsInTransit,
            'totalOutstandingChecks' => $totalOutstandingChecks,
            'adjustedBankBalance' => $adjustedBankBalance,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($bankClosing),
                'en' => $tafqeetService->inEnglish($bankClosing),
            ],
        ]);
    }
}
