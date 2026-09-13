<?php

namespace App\Modules\Accounting\Queries;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Shared\Context\CurrentCompany;
use Illuminate\Support\Facades\DB;

class IncomeStatementQuery
{
    /**
     * Compute Income Statement (Profit & Loss) for a specified date range.
     *
     * @return array{
     *     start_date: string,
     *     end_date: string,
     *     revenue_accounts: array<int, array{id: string, code: string, name: string, name_ar: string|null, amount: float, percentage: float}>,
     *     total_revenue: float,
     *     cogs_accounts: array<int, array{id: string, code: string, name: string, name_ar: string|null, amount: float, percentage: float}>,
     *     total_cogs: float,
     *     gross_profit: float,
     *     gross_profit_margin: float,
     *     expense_accounts: array<int, array{id: string, code: string, name: string, name_ar: string|null, subtype: string|null, amount: float, percentage: float}>,
     *     total_operating_expenses: float,
     *     operating_profit: float,
     *     net_profit: float,
     *     net_profit_margin: float
     * }
     */
    public function execute(?string $startDate = null, ?string $endDate = null): array
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $startDate = $startDate ?: now()->startOfYear()->toDateString();
        $endDate = $endDate ?: now()->toDateString();

        // 1. Fetch aggregates of posted journal entries within period for revenue and expense accounts
        $aggregates = JournalEntryLine::where('journal_entry_lines.company_id', $companyId)
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->where('journal_entries.status', 'posted')
            ->whereBetween('journal_entries.date', [$startDate, $endDate])
            ->groupBy('journal_entry_lines.account_id')
            ->select([
                'journal_entry_lines.account_id',
                DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                DB::raw('SUM(journal_entry_lines.credit) as total_credit'),
            ])
            ->get()
            ->keyBy('account_id');

        // 2. Fetch revenue accounts
        $revenueAccountsList = Account::where('company_id', $companyId)
            ->where('type', 'revenue')
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get();

        $revenueAccounts = [];
        $totalRevenue = 0.0;

        foreach ($revenueAccountsList as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $net = $credit - $debit; // Revenue normal balance is credit

            $totalRevenue += $net;

            $revenueAccounts[] = [
                'id' => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'name_ar' => $acc->name_ar,
                'amount' => $net,
                'percentage' => 0.0, // calculated later
            ];
        }

        // 3. Fetch expense accounts (split COGS vs Operating Expenses)
        $allExpenseAccounts = Account::where('company_id', $companyId)
            ->where('type', 'expense')
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get();

        $cogsAccounts = [];
        $totalCogs = 0.0;

        $operatingExpenseAccounts = [];
        $totalOperatingExpenses = 0.0;

        foreach ($allExpenseAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $net = $debit - $credit; // Expense normal balance is debit

            $isCogs = ($acc->subtype === 'cost_of_sales' || str_starts_with($acc->code, '50'));

            if ($isCogs) {
                $totalCogs += $net;
                $cogsAccounts[] = [
                    'id' => $acc->id,
                    'code' => $acc->code,
                    'name' => $acc->name,
                    'name_ar' => $acc->name_ar,
                    'amount' => $net,
                    'percentage' => 0.0,
                ];
            } else {
                $totalOperatingExpenses += $net;
                $operatingExpenseAccounts[] = [
                    'id' => $acc->id,
                    'code' => $acc->code,
                    'name' => $acc->name,
                    'name_ar' => $acc->name_ar,
                    'subtype' => $acc->subtype,
                    'amount' => $net,
                    'percentage' => 0.0,
                ];
            }
        }

        // Calculate percentages
        $revenueBase = $totalRevenue > 0 ? $totalRevenue : 1.0;

        foreach ($revenueAccounts as &$rev) {
            $rev['percentage'] = round(($rev['amount'] / $revenueBase) * 100, 2);
        }
        unset($rev);

        foreach ($cogsAccounts as &$cogs) {
            $cogs['percentage'] = round(($cogs['amount'] / $revenueBase) * 100, 2);
        }
        unset($cogs);

        foreach ($operatingExpenseAccounts as &$exp) {
            $exp['percentage'] = round(($exp['amount'] / $revenueBase) * 100, 2);
        }
        unset($exp);

        $grossProfit = $totalRevenue - $totalCogs;
        $grossProfitMargin = $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 2) : 0.0;

        $operatingProfit = $grossProfit - $totalOperatingExpenses;
        $netProfit = $operatingProfit;
        $netProfitMargin = $totalRevenue > 0 ? round(($netProfit / $totalRevenue) * 100, 2) : 0.0;

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'revenue_accounts' => $revenueAccounts,
            'total_revenue' => $totalRevenue,
            'cogs_accounts' => $cogsAccounts,
            'total_cogs' => $totalCogs,
            'gross_profit' => $grossProfit,
            'gross_profit_margin' => $grossProfitMargin,
            'expense_accounts' => $operatingExpenseAccounts,
            'total_operating_expenses' => $totalOperatingExpenses,
            'operating_profit' => $operatingProfit,
            'net_profit' => $netProfit,
            'net_profit_margin' => $netProfitMargin,
        ];
    }
}
