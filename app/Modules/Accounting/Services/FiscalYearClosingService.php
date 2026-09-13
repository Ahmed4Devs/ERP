<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Exceptions\PostingException;
use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\FiscalPeriod;
use App\Modules\Accounting\Models\FiscalYearClosing;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Shared\Context\CurrentCompany;
use App\Shared\Context\CurrentTenant;
use Illuminate\Support\Facades\DB;

class FiscalYearClosingService
{
    public function __construct(
        protected PostingEngine $postingEngine
    ) {}

    /**
     * Preview closing balances and proposed year-end closing entry.
     */
    public function previewClosing(int $fiscalYear): array
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $startDate = "{$fiscalYear}-01-01";
        $endDate = "{$fiscalYear}-12-31";

        // Query revenue and expense aggregates
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

        $revenueAccounts = Account::where('company_id', $companyId)
            ->where('type', 'revenue')
            ->where('is_postable', true)
            ->orderBy('code')
            ->get();

        $expenseAccounts = Account::where('company_id', $companyId)
            ->where('type', 'expense')
            ->where('is_postable', true)
            ->orderBy('code')
            ->get();

        $revenueLines = [];
        $totalRevenue = 0.0;
        foreach ($revenueAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $net = $credit - $debit; // Normal balance is credit

            if (abs($net) > 0.0001) {
                $revenueLines[] = [
                    'account_id' => $acc->id,
                    'code' => $acc->code,
                    'name' => $acc->name,
                    'name_ar' => $acc->name_ar,
                    'balance' => $net,
                ];
                $totalRevenue += $net;
            }
        }

        $expenseLines = [];
        $totalExpenses = 0.0;
        foreach ($expenseAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $net = $debit - $credit; // Normal balance is debit

            if (abs($net) > 0.0001) {
                $expenseLines[] = [
                    'account_id' => $acc->id,
                    'code' => $acc->code,
                    'name' => $acc->name,
                    'name_ar' => $acc->name_ar,
                    'balance' => $net,
                ];
                $totalExpenses += $net;
            }
        }

        $netProfitLoss = $totalRevenue - $totalExpenses;

        $retainedEarningsAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('subtype', 'retained_earnings')->orWhere('code', '3200');
            })
            ->first();

        if (! $retainedEarningsAccount) {
            $tenantId = app(CurrentTenant::class)->id();
            $retainedEarningsAccount = Account::create([
                'tenant_id' => $tenantId,
                'company_id' => $companyId,
                'code' => '3200',
                'name' => 'Retained Earnings',
                'name_ar' => 'الأرباح المبقاة / المدورة',
                'type' => 'equity',
                'subtype' => 'retained_earnings',
                'currency' => 'SAR',
                'is_postable' => true,
                'is_system' => true,
            ]);
        }

        return [
            'fiscal_year' => $fiscalYear,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_revenue' => round($totalRevenue, 2),
            'total_expenses' => round($totalExpenses, 2),
            'net_profit_loss' => round($netProfitLoss, 2),
            'revenue_lines' => $revenueLines,
            'expense_lines' => $expenseLines,
            'retained_earnings_account' => $retainedEarningsAccount ? [
                'id' => $retainedEarningsAccount->id,
                'code' => $retainedEarningsAccount->code,
                'name' => $retainedEarningsAccount->name,
            ] : null,
        ];
    }

    /**
     * Execute Fiscal Year-End Closing, generate closing JV, and lock periods.
     */
    public function closeYear(int $fiscalYear, ?string $notes = null): FiscalYearClosing
    {
        $currentCompany = app(CurrentCompany::class);
        $currentTenant = app(CurrentTenant::class);

        $companyId = $currentCompany->id();
        $tenantId = $currentTenant->id();

        // Check if already closed
        $existing = FiscalYearClosing::where('company_id', $companyId)
            ->where('fiscal_year', $fiscalYear)
            ->where('status', 'closed')
            ->first();

        if ($existing) {
            throw new PostingException("Fiscal year {$fiscalYear} is already closed.");
        }

        $preview = $this->previewClosing($fiscalYear);
        if (! $preview['retained_earnings_account']) {
            throw new PostingException("Retained Earnings account (3200) not found for company {$companyId}.");
        }

        $retainedAccount = Account::findOrFail($preview['retained_earnings_account']['id']);

        return DB::transaction(function () use ($currentTenant, $currentCompany, $fiscalYear, $preview, $retainedAccount, $notes): FiscalYearClosing {
            // Build balanced closing entry lines
            $glLines = [];

            // Zero out Revenue accounts: Debit each with its credit balance
            foreach ($preview['revenue_lines'] as $rev) {
                $glLines[] = [
                    'account_id' => $rev['account_id'],
                    'debit' => $rev['balance'],
                    'credit' => 0.0,
                    'description' => "Year-end closing of {$rev['code']} for {$fiscalYear}",
                ];
            }

            // Zero out Expense accounts: Credit each with its debit balance
            foreach ($preview['expense_lines'] as $exp) {
                $glLines[] = [
                    'account_id' => $exp['account_id'],
                    'debit' => 0.0,
                    'credit' => $exp['balance'],
                    'description' => "Year-end closing of {$exp['code']} for {$fiscalYear}",
                ];
            }

            // Balance to Retained Earnings (3200)
            $netProfit = $preview['net_profit_loss'];
            if ($netProfit > 0) {
                // Profit: Credit Retained Earnings
                $glLines[] = [
                    'account_id' => $retainedAccount->id,
                    'debit' => 0.0,
                    'credit' => $netProfit,
                    'description' => "Net Profit transfer to Retained Earnings for {$fiscalYear}",
                ];
            } elseif ($netProfit < 0) {
                // Loss: Debit Retained Earnings
                $glLines[] = [
                    'account_id' => $retainedAccount->id,
                    'debit' => abs($netProfit),
                    'credit' => 0.0,
                    'description' => "Net Loss transfer to Retained Earnings for {$fiscalYear}",
                ];
            }

            $journalEntry = null;
            if (! empty($glLines)) {
                $journalEntry = $this->postingEngine->post([
                    'date' => "{$fiscalYear}-12-31",
                    'entry_type' => 'year_end_closing',
                    'description' => "Year-End Closing Journal Entry for Fiscal Year {$fiscalYear}",
                    'lines' => $glLines,
                ]);
            }

            // Lock all fiscal periods for this year
            FiscalPeriod::where('company_id', $currentCompany->id())
                ->whereYear('start_date', $fiscalYear)
                ->update(['is_locked' => true]);

            // Save or update fiscal year closing record
            $closing = FiscalYearClosing::updateOrCreate(
                [
                    'company_id' => $currentCompany->id(),
                    'fiscal_year' => $fiscalYear,
                ],
                [
                    'tenant_id' => $currentTenant->id(),
                    'closing_date' => "{$fiscalYear}-12-31",
                    'journal_entry_id' => $journalEntry?->id,
                    'total_revenue' => $preview['total_revenue'],
                    'total_expenses' => $preview['total_expenses'],
                    'net_profit_loss' => $preview['net_profit_loss'],
                    'retained_earnings_account_id' => $retainedAccount->id,
                    'status' => 'closed',
                    'notes' => $notes,
                    'closed_by_id' => auth()->id(),
                ]
            );

            return $closing->refresh();
        });
    }

    /**
     * Reopen a closed fiscal year for audit adjustments.
     */
    public function reopenYear(FiscalYearClosing $closing): FiscalYearClosing
    {
        if ($closing->status !== 'closed') {
            throw new PostingException("Fiscal year {$closing->fiscal_year} is not closed.");
        }

        return DB::transaction(function () use ($closing): FiscalYearClosing {
            // Unlock periods
            FiscalPeriod::where('company_id', $closing->company_id)
                ->whereYear('start_date', $closing->fiscal_year)
                ->update(['is_locked' => false]);

            $closing->update(['status' => 'reopened']);

            return $closing->fresh();
        });
    }
}
