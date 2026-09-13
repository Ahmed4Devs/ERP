<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\FiscalYearClosing;
use App\Modules\Accounting\Services\FiscalYearClosingService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FiscalYearClosingController extends Controller
{
    public function __construct(
        protected FiscalYearClosingService $closingService
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $closings = FiscalYearClosing::where('company_id', $companyId)
            ->with(['journalEntry', 'retainedEarningsAccount', 'closedBy'])
            ->orderBy('fiscal_year', 'desc')
            ->get();

        return Inertia::render('Accounting/YearEndClosing/Index', [
            'closings' => $closings,
        ]);
    }

    public function create(Request $request): Response
    {
        $year = (int) ($request->input('year') ?? (now()->year - 1));
        $preview = $this->closingService->previewClosing($year);

        return Inertia::render('Accounting/YearEndClosing/Create', [
            'preview' => $preview,
            'selectedYear' => $year,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'fiscal_year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'notes' => ['nullable', 'string'],
        ]);

        $year = (int) $request->input('fiscal_year');
        $notes = $request->input('notes');

        $closing = $this->closingService->closeYear($year, $notes);

        return redirect()->route('accounting.year-end-closing.show', $closing->id)
            ->with('success', "Fiscal year {$year} closed and retained earnings journal entry posted.");
    }

    public function show(FiscalYearClosing $fiscalYearClosing): Response
    {
        $currentCompany = app(CurrentCompany::class);
        if ($fiscalYearClosing->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $fiscalYearClosing->load([
            'journalEntry.lines.account',
            'retainedEarningsAccount',
            'closedBy',
        ]);

        return Inertia::render('Accounting/YearEndClosing/Show', [
            'closing' => $fiscalYearClosing,
        ]);
    }

    public function reopen(FiscalYearClosing $fiscalYearClosing): RedirectResponse
    {
        $currentCompany = app(CurrentCompany::class);
        if ($fiscalYearClosing->company_id !== $currentCompany->id()) {
            abort(403);
        }

        $this->closingService->reopenYear($fiscalYearClosing);

        return redirect()->route('accounting.year-end-closing.index')
            ->with('success', "Fiscal year {$fiscalYearClosing->fiscal_year} reopened successfully.");
    }
}
