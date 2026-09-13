<?php

namespace App\Modules\Sales\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\Sales\Models\SalesOrder;
use App\Shared\Context\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $orders = SalesOrder::where('company_id', $companyId)
            ->with(['customer', 'quotation'])
            ->when($request->search, function ($q, $search): void {
                $q->where(function ($sq) use ($search): void {
                    $sq->where('order_number', 'ilike', "%{$search}%")
                        ->orWhereHas('customer', fn ($cq) => $cq->where('name', 'ilike', "%{$search}%")->orWhere('name_ar', 'ilike', "%{$search}%"));
                });
            })
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest('order_date')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Orders/Index', [
            'orders' => $orders,
            'filters' => [
                'search' => $request->search,
                'status' => $request->status,
            ],
        ]);
    }

    public function show(SalesOrder $order): Response
    {
        $order->load(['customer', 'quotation', 'lines.product', 'projects', 'deliveryNotes.warehouse']);

        return Inertia::render('Sales/Orders/Show', [
            'order' => $order,
        ]);
    }

    public function updateStatus(Request $request, SalesOrder $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:draft,confirmed,delivering,completed,cancelled',
        ]);

        $order->status = $validated['status'];
        $order->save();

        return redirect()->route('sales.orders.show', $order->id)
            ->with('success', 'Sales Order status updated successfully.');
    }

    public function print(SalesOrder $order, TafqeetService $tafqeetService, QrCodeSvgService $qrSvgService): Response
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        if ($order->company_id !== $companyId) {
            abort(403);
        }

        $order->load(['customer', 'quotation', 'lines.product', 'company']);
        $company = $order->company ?: $currentCompany->get();

        $qrPayload = "Sales Order: {$order->order_number} | Customer: {$order->customer?->name} | Total: {$order->total_amount} SAR | Date: {$order->order_date}";
        $qrCodeDataUri = $qrSvgService->generateDataUri($qrPayload, 160);

        return Inertia::render('Sales/Orders/Print', [
            'order' => $order,
            'company' => $company,
            'qrCodeDataUri' => $qrCodeDataUri,
            'amountInWords' => [
                'ar' => $tafqeetService->inArabic($order->total_amount),
                'en' => $tafqeetService->inEnglish($order->total_amount),
            ],
        ]);
    }
}
