<?php

namespace App\Modules\Trade\Services;

use App\Modules\Accounting\Models\Receipt;
use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\MasterData\Models\Party;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Trade\Models\SalesRepresentative;

class CalculateCommissionsService
{
    /**
     * Preview or calculate commission lines for all active sales representatives in a company.
     *
     * @param  string  $basis  'invoiced_sales' or 'collected_cash'
     * @return array{
     *     period_start: string,
     *     period_end: string,
     *     basis: string,
     *     total_eligible_sales: float,
     *     total_commission_amount: float,
     *     total_bonus_amount: float,
     *     total_deductions: float,
     *     total_net_payable: float,
     *     lines: array<int, array>
     * }
     */
    public function calculate(
        string $companyId,
        string $periodStart,
        string $periodEnd,
        string $basis = 'invoiced_sales'
    ): array {
        $reps = SalesRepresentative::where('company_id', $companyId)
            ->where('is_active', true)
            ->with(['plan', 'branch'])
            ->get();

        $lines = [];
        $totalSales = 0.0;
        $totalCommission = 0.0;
        $totalBonus = 0.0;
        $totalNet = 0.0;

        foreach ($reps as $rep) {
            $achievedSales = 0.0;

            if ($basis === 'collected_cash') {
                // Cash basis: Sum posted receipts for customers assigned to this representative
                $customerIds = Party::where('sales_rep_id', $rep->id)
                    ->pluck('id');

                $achievedSales = (float) Receipt::where('company_id', $companyId)
                    ->whereIn('party_id', $customerIds)
                    ->where('status', 'posted')
                    ->whereBetween('date', [$periodStart, $periodEnd])
                    ->sum('amount');
            } else {
                // Invoiced sales basis:
                // 1. Direct invoices tagged with this sales rep
                $directInvoiceSales = (float) ServiceInvoice::where('company_id', $companyId)
                    ->where('sales_rep_id', $rep->id)
                    ->where('status', 'posted')
                    ->whereBetween('date', [$periodStart, $periodEnd])
                    ->sum('total');

                // 2. Invoices belonging to customers assigned to this sales rep (excluding already counted)
                $assignedCustomerIds = Party::where('sales_rep_id', $rep->id)
                    ->pluck('id');

                $customerInvoiceSales = (float) ServiceInvoice::where('company_id', $companyId)
                    ->whereIn('party_id', $assignedCustomerIds)
                    ->where(function ($q) use ($rep) {
                        $q->whereNull('sales_rep_id')->orWhere('sales_rep_id', $rep->id);
                    })
                    ->where('status', 'posted')
                    ->whereBetween('date', [$periodStart, $periodEnd])
                    ->sum('total');

                // 3. Also check approved sales orders if invoices were not used
                $orderSales = (float) SalesOrder::where('company_id', $companyId)
                    ->where(function ($q) use ($rep, $assignedCustomerIds) {
                        $q->where('sales_rep_id', $rep->id)
                            ->orWhereIn('customer_id', $assignedCustomerIds);
                    })
                    ->whereIn('status', ['confirmed', 'delivering', 'completed'])
                    ->whereBetween('order_date', [$periodStart, $periodEnd])
                    ->sum('total_amount');

                $achievedSales = max($directInvoiceSales + $customerInvoiceSales, $orderSales);
            }

            $target = (float) $rep->monthly_target;
            $achievementRate = $target > 0 ? round(($achievedSales / $target) * 100, 2) : 100.0;

            $plan = $rep->plan;
            $calc = $plan ? $plan->calculateForAmount($achievedSales, $target) : [
                'commission_amount' => round($achievedSales * 0.02, 2),
                'bonus_amount' => 0.0,
                'total_commission' => round($achievedSales * 0.02, 2),
                'effective_rate' => 2.0,
            ];

            $commAmount = $calc['commission_amount'];
            $bonusAmount = $calc['bonus_amount'];
            $netPayable = $commAmount + $bonusAmount;

            $lines[] = [
                'sales_representative_id' => $rep->id,
                'representative_name' => $rep->name,
                'representative_code' => $rep->code,
                'plan_name' => $plan?->name ?? 'Default (2%)',
                'sales_target' => $target,
                'achieved_sales' => round($achievedSales, 2),
                'achievement_rate' => $achievementRate,
                'commission_amount' => $commAmount,
                'bonus_amount' => $bonusAmount,
                'deductions_amount' => 0.0,
                'net_payable' => $netPayable,
            ];

            $totalSales += $achievedSales;
            $totalCommission += $commAmount;
            $totalBonus += $bonusAmount;
            $totalNet += $netPayable;
        }

        return [
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'basis' => $basis,
            'total_eligible_sales' => round($totalSales, 2),
            'total_commission_amount' => round($totalCommission, 2),
            'total_bonus_amount' => round($totalBonus, 2),
            'total_deductions' => 0.0,
            'total_net_payable' => round($totalNet, 2),
            'lines' => $lines,
        ];
    }
}
