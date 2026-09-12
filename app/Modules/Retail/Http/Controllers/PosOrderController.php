<?php

namespace App\Modules\Retail\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Localization\Services\QrCodeSvgService;
use App\Modules\Localization\Services\TafqeetService;
use App\Modules\Localization\Services\ZatcaQrCodeService;
use App\Modules\Retail\Actions\CompletePosSaleAction;
use App\Modules\Retail\Models\PosOrder;
use App\Shared\Context\CurrentCompany;
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

    public function print(
        PosOrder $order,
        ZatcaQrCodeService $zatcaQrService,
        QrCodeSvgService $qrSvgService,
        TafqeetService $tafqeetService
    ): Response {
        $order->load(['session.terminal.branch', 'customer', 'lines.product', 'company']);
        $company = $order->company ?: app(CurrentCompany::class)->get();

        $sellerName = $company?->legal_name ?: $company?->name ?: 'شركة الحلول المتكاملة';
        $taxNumber = $company?->tax_number ?: '300123456700003';

        $tlvBase64 = $zatcaQrService->generateBase64Tlv(
            sellerName: $sellerName,
            vatRegistrationNumber: $taxNumber,
            timestamp: $order->created_at?->toIso8601String() ?: now()->toIso8601String(),
            invoiceTotalWithVat: (string) $order->total_amount,
            vatTotal: (string) $order->tax_amount,
        );

        $qrCodeDataUri = $qrSvgService->generateDataUri($tlvBase64, 160);

        return Inertia::render('Retail/Orders/Print', [
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
