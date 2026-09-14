<?php

namespace App\Modules\Retail\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Retail\Actions\ClosePosSessionAction;
use App\Modules\Retail\Actions\GeneratePosReportAction;
use App\Modules\Retail\Actions\OpenPosSessionAction;
use App\Modules\Retail\Models\PosSession;
use App\Modules\Retail\Models\PosTerminal;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosSessionController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = app(CurrentCompany::class)->id();

        $sessions = PosSession::where('company_id', $companyId)
            ->with(['terminal', 'user', 'closedByUser', 'differenceJournalEntry'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->terminal_id, fn ($q, $terminalId) => $q->where('terminal_id', $terminalId))
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $terminals = PosTerminal::where('company_id', $companyId)->get();

        $stats = [
            'total_sessions' => PosSession::where('company_id', $companyId)->count(),
            'open_sessions' => PosSession::where('company_id', $companyId)->where('status', 'open')->count(),
            'closed_sessions' => PosSession::where('company_id', $companyId)->where('status', 'closed')->count(),
            'total_reconciled_sales' => (float) PosSession::where('company_id', $companyId)->where('status', 'closed')->sum('total_net_sales'),
            'total_cash_variance' => (float) PosSession::where('company_id', $companyId)->where('status', 'closed')->sum('cash_difference'),
        ];

        return Inertia::render('Retail/Sessions/Index', [
            'sessions' => $sessions,
            'terminals' => $terminals,
            'stats' => $stats,
            'filters' => [
                'status' => $request->status,
                'terminal_id' => $request->terminal_id,
            ],
        ]);
    }

    public function store(Request $request, OpenPosSessionAction $openAction): RedirectResponse
    {
        $validated = $request->validate([
            'terminal_id' => 'required|uuid|exists:pos_terminals,id',
            'opening_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $session = $openAction->execute([
            'terminal_id' => $validated['terminal_id'],
            'opening_cash' => $validated['opening_cash'],
            'user_id' => auth()->id(),
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('retail.pos.terminal', $session->terminal_id)
            ->with('success', "POS Session (#{$session->session_number}) opened successfully.");
    }

    public function show(PosSession $session, GeneratePosReportAction $reportAction): Response
    {
        $session->load([
            'terminal.warehouse',
            'terminal.branch',
            'user',
            'closedByUser',
            'orders.lines.product',
            'orders.customer',
            'differenceJournalEntry.lines.account',
        ]);

        $reportPreview = $reportAction->execute($session, $session->status === 'closed' ? 'Z' : 'X');

        return Inertia::render('Retail/Sessions/Show', [
            'posSession' => $session,
            'reportPreview' => $reportPreview,
        ]);
    }

    public function close(Request $request, PosSession $session, ClosePosSessionAction $closeAction): RedirectResponse
    {
        $validated = $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $closedSession = $closeAction->execute([
            'session_id' => $session->id,
            'closing_cash' => $validated['closing_cash'],
            'closed_by' => auth()->id(),
            'notes' => $validated['notes'] ?? null,
        ]);

        $msg = "POS Session (#{$closedSession->session_number}) closed successfully. Z-Report: {$closedSession->z_report_number}.";
        if (bccomp((string) $closedSession->cash_difference, '0.000000', 6) !== 0) {
            $diffFormatted = number_format((float) $closedSession->cash_difference, 2);
            $msg .= " Cash variance recorded ({$diffFormatted} SAR).";
        }

        return redirect()->route('retail.sessions.show', $session->id)
            ->with('success', $msg);
    }

    public function zReport(Request $request, PosSession $session, GeneratePosReportAction $reportAction): Response|JsonResponse
    {
        $report = $reportAction->execute($session, 'Z');

        if ($request->wantsJson()) {
            return response()->json($report);
        }

        return Inertia::render('Retail/Sessions/ZReportPrint', [
            'report' => $report,
        ]);
    }

    public function xReport(Request $request, PosSession $session, GeneratePosReportAction $reportAction): Response|JsonResponse
    {
        $report = $reportAction->execute($session, 'X');

        if ($request->wantsJson()) {
            return response()->json($report);
        }

        return Inertia::render('Retail/Sessions/ZReportPrint', [
            'report' => $report,
        ]);
    }
}
