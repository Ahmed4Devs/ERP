<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\FxRevaluation;
use App\Modules\Accounting\Services\FxRevaluationService;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class FxRevaluationController extends Controller
{
    public function __construct(
        protected FxRevaluationService $fxService
    ) {}

    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $revaluations = FxRevaluation::where('company_id', $companyId)
            ->with(['journalEntry', 'creator'])
            ->latest('date')
            ->paginate(15)
            ->withQueryString();

        $metrics = [
            'total_gain_all_time' => (float) FxRevaluation::where('company_id', $companyId)->where('status', 'posted')->sum('total_gain'),
            'total_loss_all_time' => (float) FxRevaluation::where('company_id', $companyId)->where('status', 'posted')->sum('total_loss'),
            'net_adjustment_all_time' => (float) FxRevaluation::where('company_id', $companyId)->where('status', 'posted')->sum('net_adjustment'),
            'batches_count' => FxRevaluation::where('company_id', $companyId)->count(),
        ];

        return Inertia::render('Accounting/FxRevaluations/Index', [
            'revaluations' => $revaluations,
            'metrics' => $metrics,
        ]);
    }

    public function create(Request $request): Response
    {
        $company = app(CurrentCompany::class)->get();
        $closingDate = $request->input('date', now()->toDateString());

        $preview = $this->fxService->calculateRevaluation($company->id, $company->tenant_id, $closingDate);

        return Inertia::render('Accounting/FxRevaluations/Create', [
            'preview' => $preview,
            'selectedDate' => $closingDate,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $company = app(CurrentCompany::class)->get();

        $validated = $request->validate([
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $revaluation = $this->fxService->createAndPostRevaluation(
            $company->id,
            $company->tenant_id,
            $validated['date'],
            Auth::id(),
            $validated['notes'] ?? null
        );

        return redirect()->route('accounting.fx-revaluations.show', $revaluation->id)
            ->with('success', "تم إجراء تسوية وإعادة تقييم العملات الأجنبية وتوليد السند المحاسبي بنجاح ({$revaluation->revaluation_number}).");
    }

    public function show(FxRevaluation $fxRevaluation): Response
    {
        $fxRevaluation->load([
            'lines.account',
            'journalEntry.lines.account',
            'reversalJournalEntry.lines.account',
            'creator',
        ]);

        return Inertia::render('Accounting/FxRevaluations/Show', [
            'revaluation' => $fxRevaluation,
        ]);
    }

    public function reverse(Request $request, FxRevaluation $fxRevaluation): RedirectResponse
    {
        $validated = $request->validate([
            'reversal_date' => ['nullable', 'date'],
        ]);

        $this->fxService->reverseRevaluation($fxRevaluation->id, $validated['reversal_date'] ?? null);

        return back()->with('success', 'تم عكس قيد تسوية فروقات العملة بنجاح وتوليد سند العكس المحاسبي.');
    }
}
