<?php

namespace App\Modules\Retail\Actions;

use App\Modules\Organization\Models\Company;
use App\Modules\Retail\Models\PosSession;
use Illuminate\Support\Collection;

class GeneratePosReportAction
{
    /**
     * Generate structured financial report data for X-Report or Z-Report.
     *
     * @return array<string, mixed>
     */
    public function execute(PosSession $session, string $type = 'Z'): array
    {
        $session->loadMissing([
            'terminal.warehouse',
            'terminal.branch',
            'user',
            'closedByUser',
            'orders.lines.product',
            'differenceJournalEntry',
        ]);

        $company = Company::find($session->company_id);
        $terminal = $session->terminal;
        $orders = $session->orders;

        $totalOrdersCount = $orders->count();
        $totalGrossSales = '0.000000';
        $totalDiscounts = '0.000000';
        $totalNetSales = '0.000000';
        $totalTax = '0.000000';
        $totalCashSales = '0.000000';
        $totalCardSales = '0.000000';

        $productSummaries = [];

        foreach ($orders as $order) {
            $subtotal = (string) $order->subtotal;
            $taxAmount = (string) $order->tax_amount;
            $discountAmount = (string) $order->discount_amount;
            $gross = bcadd($subtotal, $discountAmount, 6);

            $totalGrossSales = bcadd($totalGrossSales, $gross, 6);
            $totalDiscounts = bcadd($totalDiscounts, $discountAmount, 6);
            $totalNetSales = bcadd($totalNetSales, $subtotal, 6);
            $totalTax = bcadd($totalTax, $taxAmount, 6);

            $paymentMethod = $order->payment_method;
            $orderTotal = (string) $order->total_amount;

            if ($paymentMethod === 'cash') {
                $totalCashSales = bcadd($totalCashSales, $orderTotal, 6);
            } elseif ($paymentMethod === 'card') {
                $totalCardSales = bcadd($totalCardSales, $orderTotal, 6);
            } else {
                $totalCashSales = bcadd($totalCashSales, $orderTotal, 6);
            }

            foreach ($order->lines as $line) {
                $pId = $line->product_id;
                if (! isset($productSummaries[$pId])) {
                    $productSummaries[$pId] = [
                        'name' => $line->product?->name_ar ?: ($line->product?->name ?: $line->description),
                        'sku' => $line->product?->sku ?? 'N/A',
                        'quantity' => '0.000000',
                        'total' => '0.000000',
                    ];
                }
                $productSummaries[$pId]['quantity'] = bcadd($productSummaries[$pId]['quantity'], (string) $line->quantity, 6);
                $productSummaries[$pId]['total'] = bcadd($productSummaries[$pId]['total'], (string) $line->line_total, 6);
            }
        }

        // Drawer values
        $openingCash = (string) $session->opening_cash;
        $expectedCash = bcadd($openingCash, $totalCashSales, 6);
        $closingCash = $session->closing_cash !== null ? (string) $session->closing_cash : null;
        $cashDifference = $session->cash_difference !== null ? (string) $session->cash_difference : null;

        $topProducts = Collection::make($productSummaries)
            ->sortByDesc(fn ($item) => (float) $item['total'])
            ->take(10)
            ->values()
            ->all();

        return [
            'report_type' => $type,
            'report_title_ar' => $type === 'Z' ? 'تقرير الإغلاق المالي لليومية (Z-Report)' : 'تقرير قراءة الوردية الآنية (X-Report)',
            'report_title_en' => $type === 'Z' ? 'End of Day Fiscal Z-Report' : 'Mid-Shift Reading X-Report',
            'report_number' => $type === 'Z'
                ? ($session->z_report_number ?? sprintf('Z-%s-%s', $terminal->code, $session->created_at->format('Ymd')))
                : sprintf('X-%s-%s', $terminal->code, now()->format('Ymd-Hi')),
            'z_sequence' => $session->z_report_sequence,
            'company' => [
                'name' => $company?->legal_name ?: ($company?->name ?? 'Enterprise POS'),
                'tax_number' => $company?->tax_number ?? '300000000000003',
                'cr_number' => $company?->commercial_registration ?? '',
                'address' => $company?->address ?? '',
                'currency' => $company?->currency ?? 'SAR',
            ],
            'terminal' => [
                'id' => $terminal->id,
                'name' => $terminal->name,
                'code' => $terminal->code,
                'warehouse' => $terminal->warehouse?->name,
                'branch' => $terminal->branch?->name,
            ],
            'session' => [
                'id' => $session->id,
                'session_number' => $session->session_number,
                'status' => $session->status,
                'cashier_name' => $session->user?->name,
                'opened_at' => $session->opened_at?->toIso8601String(),
                'closed_at' => ($session->closed_at ?? ($type === 'X' ? now() : null))?->toIso8601String(),
                'closed_by_name' => $session->closedByUser?->name ?? $session->user?->name,
                'notes' => $session->notes,
            ],
            'sales' => [
                'orders_count' => $totalOrdersCount,
                'gross_sales' => (float) $totalGrossSales,
                'discounts' => (float) $totalDiscounts,
                'net_sales' => (float) $totalNetSales,
                'tax_rate' => '15%',
                'tax_amount' => (float) $totalTax,
                'total_amount' => (float) bcadd($totalNetSales, $totalTax, 6),
            ],
            'payments' => [
                'cash_sales' => (float) $totalCashSales,
                'card_sales' => (float) $totalCardSales,
                'total_collected' => (float) bcadd($totalCashSales, $totalCardSales, 6),
            ],
            'drawer' => [
                'opening_float' => (float) $openingCash,
                'cash_sales' => (float) $totalCashSales,
                'expected_cash' => (float) $expectedCash,
                'counted_cash' => $closingCash !== null ? (float) $closingCash : null,
                'difference' => $cashDifference !== null ? (float) $cashDifference : null,
                'status' => $cashDifference === null ? 'open' : (bccomp($cashDifference, '0.000000', 6) === 0 ? 'balanced' : (bccomp($cashDifference, '0.000000', 6) < 0 ? 'shortage' : 'surplus')),
            ],
            'top_products' => $topProducts,
            'generated_at' => now()->toIso8601String(),
        ];
    }
}
