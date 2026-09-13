<?php

namespace App\Modules\Platform\Services;

use App\Modules\Accounting\Models\ServiceInvoice;
use App\Modules\Accounting\Queries\BalanceSheetQuery;
use App\Modules\Purchasing\Models\VendorBill;
use App\Modules\Sales\Models\SalesOrder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ExecutiveBiDashboardService
{
    public function __construct(
        protected BalanceSheetQuery $balanceSheetQuery
    ) {}

    /**
     * Compute comprehensive financial intelligence, liquidity ratios, and BI metrics for C-level executives.
     *
     * @return array{
     *     financial_intelligence: array{
     *         working_capital: float,
     *         current_ratio: float,
     *         quick_ratio: float,
     *         cash_ratio: float,
     *         current_assets: float,
     *         current_liabilities: float,
     *         cash_and_bank: float,
     *         inventory_valuation: float,
     *         accounts_receivable: float,
     *         accounts_payable: float,
     *         dso_days: int
     *     },
     *     monthly_trends: array<int, array{
     *         month_key: string,
     *         label_en: string,
     *         label_ar: string,
     *         revenue: float,
     *         expenses: float,
     *         net_profit: float
     *     }>,
     *     zatca_compliance: array{
     *         cleared: int,
     *         reported: int,
     *         pending: int,
     *         rejected: int,
     *         total_invoices: int,
     *         compliance_rate: float
     *     },
     *     commercial_pipeline: array{
     *         confirmed_orders_count: int,
     *         delivering_orders_count: int,
     *         unbilled_orders_value: float,
     *         fully_billed_orders_count: int
     *     },
     *     top_customers: array<int, array{
     *         party_id: string,
     *         name: string,
     *         name_ar: string|null,
     *         invoices_count: int,
     *         total_volume: float
     *     }>
     * }
     */
    public function getExecutiveBiMetrics(string $companyId): array
    {
        // 1. Balance Sheet calculation for Working Capital & Liquidity Ratios
        $bs = $this->balanceSheetQuery->execute();

        $currentAssets = 0.0;
        $currentLiabilities = 0.0;
        $cashAndBank = 0.0;
        $inventoryValuation = 0.0;

        foreach ($bs['assets'] as $asset) {
            $isCurrent = in_array($asset['subtype'], ['cash', 'bank', 'receivable', 'tax_receivable', 'inventory'], true)
                || ($asset['code'] < '1500');

            if ($isCurrent) {
                $currentAssets += $asset['balance'];
            }
            if (in_array($asset['subtype'], ['cash', 'bank'], true) || in_array($asset['code'], ['1010', '1020'], true)) {
                $cashAndBank += $asset['balance'];
            }
            if ($asset['subtype'] === 'inventory' || $asset['code'] === '1300') {
                $inventoryValuation += $asset['balance'];
            }
        }

        foreach ($bs['liabilities'] as $liab) {
            $isCurrent = in_array($liab['subtype'], ['payable', 'clearing', 'payroll_payable', 'tax_payable'], true)
                || ($liab['code'] < '2500');

            if ($isCurrent) {
                $currentLiabilities += $liab['balance'];
            }
        }

        $workingCapital = $currentAssets - $currentLiabilities;
        $currentRatio = $currentLiabilities > 0 ? round($currentAssets / $currentLiabilities, 2) : ($currentAssets > 0 ? 1.0 : 0.0);
        $quickRatio = $currentLiabilities > 0 ? round(($currentAssets - $inventoryValuation) / $currentLiabilities, 2) : ($currentAssets > 0 ? 1.0 : 0.0);
        $cashRatio = $currentLiabilities > 0 ? round($cashAndBank / $currentLiabilities, 2) : ($cashAndBank > 0 ? 1.0 : 0.0);

        // 2. Outstanding Accounts Receivable & Accounts Payable
        $totalAr = (float) ServiceInvoice::where('company_id', $companyId)
            ->whereIn('status', ['posted', 'partially_paid'])
            ->sum('balance_due');

        $totalAp = (float) VendorBill::where('company_id', $companyId)
            ->whereIn('status', ['posted', 'partially_paid', 'approved'])
            ->sum('balance_due');

        $totalPostedRevenue = (float) ServiceInvoice::where('company_id', $companyId)
            ->where('status', 'posted')
            ->sum('total');

        $dsoDays = $totalPostedRevenue > 0 ? (int) round(($totalAr / $totalPostedRevenue) * 365, 0) : 0;

        // 3. Monthly Trends (Last 6 Months)
        $monthlyTrends = [];
        $arabicMonths = [
            1 => 'يناير', 2 => 'فبراير', 3 => 'مارس', 4 => 'أبريل',
            5 => 'مايو', 6 => 'يونيو', 7 => 'يوليو', 8 => 'أغسطس',
            9 => 'سبتمبر', 10 => 'أكتوبر', 11 => 'نوفمبر', 12 => 'ديسمبر',
        ];

        for ($i = 5; $i >= 0; $i--) {
            $start = Carbon::now()->subMonths($i)->startOfMonth();
            $end = Carbon::now()->subMonths($i)->endOfMonth();
            $monthNum = (int) $start->format('n');
            $year = $start->format('Y');

            $rev = (float) ServiceInvoice::where('company_id', $companyId)
                ->where('status', 'posted')
                ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                ->sum('total');

            $exp = (float) VendorBill::where('company_id', $companyId)
                ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                ->sum('total');

            $profit = $rev - $exp;

            $monthlyTrends[] = [
                'month_key' => $start->format('Y-m'),
                'label_en' => $start->format('M Y'),
                'label_ar' => ($arabicMonths[$monthNum] ?? '').' '.$year,
                'revenue' => round($rev, 2),
                'expenses' => round($exp, 2),
                'net_profit' => round($profit, 2),
            ];
        }

        // 4. ZATCA Compliance Metrics
        $cleared = ServiceInvoice::where('company_id', $companyId)->where('zatca_status', 'cleared')->count();
        $reported = ServiceInvoice::where('company_id', $companyId)->where('zatca_status', 'reported')->count();
        $rejected = ServiceInvoice::where('company_id', $companyId)->where('zatca_status', 'rejected')->count();
        $totalPostedInvoices = ServiceInvoice::where('company_id', $companyId)->where('status', 'posted')->count();
        $pending = max(0, $totalPostedInvoices - ($cleared + $reported + $rejected));
        $complianceRate = $totalPostedInvoices > 0 ? round((($cleared + $reported) / $totalPostedInvoices) * 100, 1) : 100.0;

        // 5. Commercial Pipeline
        $confirmedOrders = SalesOrder::where('company_id', $companyId)->where('status', 'confirmed')->count();
        $deliveringOrders = SalesOrder::where('company_id', $companyId)->where('status', 'delivering')->count();
        $unbilledOrdersValue = (float) SalesOrder::where('company_id', $companyId)->where('invoicing_status', 'unbilled')->sum('total_amount');
        $fullyBilledOrdersCount = SalesOrder::where('company_id', $companyId)->where('invoicing_status', 'fully_billed')->count();

        // 6. Top 5 Customers by Volume
        $topCustomers = ServiceInvoice::where('company_id', $companyId)
            ->where('status', 'posted')
            ->whereNotNull('party_id')
            ->select('party_id', DB::raw('COUNT(id) as invoices_count'), DB::raw('SUM(total) as total_volume'))
            ->groupBy('party_id')
            ->orderByDesc('total_volume')
            ->take(5)
            ->with(['party' => fn ($q) => $q->select('id', 'name', 'name_ar')])
            ->get()
            ->map(fn ($row) => [
                'party_id' => (string) $row->party_id,
                'name' => $row->party?->name ?? 'Customer',
                'name_ar' => $row->party?->name_ar ?? null,
                'invoices_count' => (int) $row->invoices_count,
                'total_volume' => (float) $row->total_volume,
            ])
            ->all();

        return [
            'financial_intelligence' => [
                'working_capital' => round($workingCapital, 2),
                'current_ratio' => $currentRatio,
                'quick_ratio' => $quickRatio,
                'cash_ratio' => $cashRatio,
                'current_assets' => round($currentAssets, 2),
                'current_liabilities' => round($currentLiabilities, 2),
                'cash_and_bank' => round($cashAndBank, 2),
                'inventory_valuation' => round($inventoryValuation, 2),
                'accounts_receivable' => round($totalAr, 2),
                'accounts_payable' => round($totalAp, 2),
                'dso_days' => $dsoDays,
            ],
            'monthly_trends' => $monthlyTrends,
            'zatca_compliance' => [
                'cleared' => $cleared,
                'reported' => $reported,
                'pending' => $pending,
                'rejected' => $rejected,
                'total_invoices' => $totalPostedInvoices,
                'compliance_rate' => $complianceRate,
            ],
            'commercial_pipeline' => [
                'confirmed_orders_count' => $confirmedOrders,
                'delivering_orders_count' => $deliveringOrders,
                'unbilled_orders_value' => round($unbilledOrdersValue, 2),
                'fully_billed_orders_count' => $fullyBilledOrdersCount,
            ],
            'top_customers' => $topCustomers,
        ];
    }
}
