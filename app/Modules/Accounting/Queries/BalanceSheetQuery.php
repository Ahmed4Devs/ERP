<?php

namespace App\Modules\Accounting\Queries;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Shared\Context\CurrentCompany;
use Illuminate\Support\Facades\DB;

class BalanceSheetQuery
{
    /**
     * Compute Balance Sheet (Statement of Financial Position) as of a specific date.
     *
     * @return array{
     *     as_of_date: string,
     *     assets: array<int, array{id: string, code: string, name: string, name_ar: string|null, subtype: string|null, balance: float}>,
     *     total_assets: float,
     *     liabilities: array<int, array{id: string, code: string, name: string, name_ar: string|null, subtype: string|null, balance: float}>,
     *     total_liabilities: float,
     *     equity_accounts: array<int, array{id: string, code: string, name: string, name_ar: string|null, subtype: string|null, balance: float}>,
     *     retained_or_current_earnings: float,
     *     total_equity: float,
     *     total_liabilities_and_equity: float,
     *     is_balanced: bool,
     *     discrepancy: float
     * }
     */
    public function execute(?string $asOfDate = null): array
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $asOfDate = $asOfDate ?: now()->toDateString();

        // 1. Fetch all aggregates up to $asOfDate
        $aggregates = JournalEntryLine::where('journal_entry_lines.company_id', $companyId)
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->where('journal_entries.status', 'posted')
            ->where('journal_entries.date', '<=', $asOfDate)
            ->groupBy('journal_entry_lines.account_id')
            ->select([
                'journal_entry_lines.account_id',
                DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                DB::raw('SUM(journal_entry_lines.credit) as total_credit'),
            ])
            ->get()
            ->keyBy('account_id');

        // 2. Compute Assets (Normal balance: Debit - Credit)
        $assetAccounts = Account::where('company_id', $companyId)
            ->where('type', 'asset')
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get();

        $assets = [];
        $totalAssets = 0.0;

        foreach ($assetAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $balance = $debit - $credit;

            $totalAssets += $balance;

            $assets[] = [
                'id' => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'name_ar' => $acc->name_ar,
                'subtype' => $acc->subtype,
                'balance' => $balance,
            ];
        }

        // 3. Compute Liabilities (Normal balance: Credit - Debit)
        $liabilityAccounts = Account::where('company_id', $companyId)
            ->where('type', 'liability')
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get();

        $liabilities = [];
        $totalLiabilities = 0.0;

        foreach ($liabilityAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $balance = $credit - $debit;

            $totalLiabilities += $balance;

            $liabilities[] = [
                'id' => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'name_ar' => $acc->name_ar,
                'subtype' => $acc->subtype,
                'balance' => $balance,
            ];
        }

        // 4. Compute Equity Accounts (Normal balance: Credit - Debit)
        $equityAccountsList = Account::where('company_id', $companyId)
            ->where('type', 'equity')
            ->where('is_postable', true)
            ->orderBy('code', 'asc')
            ->get();

        $equityAccounts = [];
        $baseEquityTotal = 0.0;

        foreach ($equityAccountsList as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $balance = $credit - $debit;

            $baseEquityTotal += $balance;

            $equityAccounts[] = [
                'id' => $acc->id,
                'code' => $acc->code,
                'name' => $acc->name,
                'name_ar' => $acc->name_ar,
                'subtype' => $acc->subtype,
                'balance' => $balance,
            ];
        }

        // 5. Compute Cumulative Net Income up to $asOfDate (Revenues - Expenses)
        $incomeAccounts = Account::where('company_id', $companyId)
            ->whereIn('type', ['revenue', 'expense'])
            ->where('is_postable', true)
            ->get();

        $totalRevenue = 0.0;
        $totalExpense = 0.0;

        foreach ($incomeAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            if (! $agg) {
                continue;
            }
            $debit = (float) $agg->total_debit;
            $credit = (float) $agg->total_credit;

            if ($acc->type === 'revenue') {
                $totalRevenue += ($credit - $debit);
            } else {
                $totalExpense += ($debit - $credit);
            }
        }

        $currentPeriodEarnings = $totalRevenue - $totalExpense;
        $totalEquity = $baseEquityTotal + $currentPeriodEarnings;

        $totalLiabilitiesAndEquity = $totalLiabilities + $totalEquity;
        $discrepancy = round($totalAssets - $totalLiabilitiesAndEquity, 4);
        $isBalanced = abs($discrepancy) < 0.01;

        return [
            'as_of_date' => $asOfDate,
            'assets' => $assets,
            'total_assets' => round($totalAssets, 2),
            'liabilities' => $liabilities,
            'total_liabilities' => round($totalLiabilities, 2),
            'equity_accounts' => $equityAccounts,
            'retained_or_current_earnings' => round($currentPeriodEarnings, 2),
            'total_equity' => round($totalEquity, 2),
            'total_liabilities_and_equity' => round($totalLiabilitiesAndEquity, 2),
            'is_balanced' => $isBalanced,
            'discrepancy' => $discrepancy,
        ];
    }
}
