<?php

namespace App\Modules\Retail\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Retail\Actions\ClosePosSessionAction;
use App\Modules\Retail\Actions\OpenPosSessionAction;
use App\Modules\Retail\Models\PosSession;
use App\Modules\Retail\Models\PosTerminal;
use App\Shared\Context\CurrentCompany;
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
            ->with(['terminal', 'user'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->terminal_id, fn ($q, $terminalId) => $q->where('terminal_id', $terminalId))
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $terminals = PosTerminal::where('company_id', $companyId)->get();

        return Inertia::render('Retail/Sessions/Index', [
            'sessions' => $sessions,
            'terminals' => $terminals,
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

    public function show(PosSession $session): Response
    {
        $session->load(['terminal.warehouse', 'terminal.branch', 'user', 'orders.lines.product', 'orders.customer']);

        return Inertia::render('Retail/Sessions/Show', [
            'posSession' => $session,
        ]);
    }

    public function close(Request $request, PosSession $session, ClosePosSessionAction $closeAction): RedirectResponse
    {
        $validated = $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $closeAction->execute([
            'session_id' => $session->id,
            'closing_cash' => $validated['closing_cash'],
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('retail.sessions.show', $session->id)
            ->with('success', "POS Session (#{$session->session_number}) closed and reconciled successfully.");
    }
}
