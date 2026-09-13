<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\Budget;
use App\Modules\Accounting\Models\JournalEntryLine;
use Illuminate\Support\Facades\DB;

class BudgetVarianceService
{
    /**
     * Calculate Budget vs Actuals variance analysis for a budget.
     */
    public function calculateVariance(string $budgetId): array
    {
        /** @var Budget $budget */
        $budget = Budget::with(['costCenter', 'lines.account', 'lines.costCenter'])->findOrFail($budgetId);

        $lineResults = [];
        $totalPlanned = 0.0;
        $totalActual = 0.0;
        $overBudgetCount = 0;

        foreach ($budget->lines as $line) {
            $account = $line->account;
            $planned = (float) $line->planned_amount;
            $totalPlanned += $planned;

            // Query actual amounts from posted journal entries
            $query = JournalEntryLine::query()
                ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
                ->where('journal_entries.company_id', $budget->company_id)
                ->where('journal_entries.status', 'posted')
                ->where('journal_entry_lines.account_id', $line->account_id)
                ->whereYear('journal_entries.date', $budget->fiscal_year);

            if ($line->period_month > 0) {
                $query->whereMonth('journal_entries.date', $line->period_month);
            }

            // If line or budget is attached to a cost center, filter by it
            $targetCostCenterId = $line->cost_center_id ?? $budget->cost_center_id;
            if ($targetCostCenterId) {
                $query->where('journal_entry_lines.cost_center_id', $targetCostCenterId);
            }

            $sums = $query->select(
                DB::raw('COALESCE(SUM(journal_entry_lines.debit), 0) as total_debit'),
                DB::raw('COALESCE(SUM(journal_entry_lines.credit), 0) as total_credit')
            )->first();

            $totalDebit = (float) ($sums->total_debit ?? 0);
            $totalCredit = (float) ($sums->total_credit ?? 0);

            // If expense account: Actual = Debit - Credit; If revenue: Actual = Credit - Debit
            $actual = $account && $account->type === 'revenue'
                ? ($totalCredit - $totalDebit)
                : ($totalDebit - $totalCredit);

            $totalActual += $actual;

            $variance = $planned - $actual; // Positive = Under budget (favorable for expense), Negative = Over budget (unfavorable)
            $utilizationPercent = $planned > 0 ? round(($actual / $planned) * 100, 2) : ($actual > 0 ? 100.0 : 0.0);

            $isOverBudget = $actual > $planned && $planned > 0;
            if ($isOverBudget) {
                $overBudgetCount++;
            }

            $lineResults[] = [
                'line_id' => $line->id,
                'account_id' => $line->account_id,
                'account_code' => $account?->code,
                'account_name' => $account?->name_ar ?? $account?->name,
                'account_type' => $account?->type,
                'cost_center_name' => $line->costCenter?->name ?? $budget->costCenter?->name,
                'period_month' => $line->period_month,
                'planned_amount' => $planned,
                'actual_amount' => $actual,
                'variance_amount' => $variance,
                'utilization_percent' => $utilizationPercent,
                'is_over_budget' => $isOverBudget,
                'notes' => $line->notes,
            ];
        }

        $overallVariance = $totalPlanned - $totalActual;
        $overallUtilization = $totalPlanned > 0 ? round(($totalActual / $totalPlanned) * 100, 2) : 0.0;

        return [
            'budget' => $budget,
            'summary' => [
                'total_planned' => $totalPlanned,
                'total_actual' => $totalActual,
                'total_variance' => $overallVariance,
                'overall_utilization_percent' => $overallUtilization,
                'over_budget_lines_count' => $overBudgetCount,
                'is_over_budget_overall' => $totalActual > $totalPlanned && $totalPlanned > 0,
            ],
            'lines' => $lineResults,
        ];
    }
}
