<?php

namespace App\Modules\Retail\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Retail\Actions\CompletePosSaleAction;
use App\Modules\Retail\Models\PosOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosOrderController extends Controller
{
    public function store(Request $request, CompletePosSaleAction $saleAction): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => 'required|uuid|exists:pos_sessions,id',
            'customer_id' => 'nullable|uuid|exists:parties,id',
            'payment_method' => 'required|string|in:cash,card,split',
            'cash_tendered' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.description' => 'nullable|string|max:255',
        ]);

        $order = $saleAction->execute($validated);

        return response()->json([
            'success' => true,
            'message' => 'Sale completed successfully.',
            'order' => $order,
        ]);
    }

    public function show(PosOrder $order): Response
    {
        $order->load(['session.terminal.branch', 'customer', 'lines.product', 'journalEntry.lines.account']);

        return Inertia::render('Retail/Orders/Show', [
            'order' => $order,
        ]);
    }
}
