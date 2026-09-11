<?php

namespace App\Modules\Projects\Queries;

use App\Modules\Projects\Models\Project;

class ProjectProfitabilityQuery
{
    /**
     * Calculate comprehensive financial and operational profitability for a project.
     *
     * @return array{
     *     project_id: string,
     *     project_number: string,
     *     name: string,
     *     budget_cost: string,
     *     budget_revenue: string,
     *     planned_margin: string,
     *     planned_margin_percent: string,
     *     actual_labor_cost: string,
     *     actual_billable_revenue: string,
     *     actual_billed_revenue: string,
     *     unbilled_revenue: string,
     *     actual_margin: string,
     *     actual_margin_percent: string,
     *     cost_variance: string,
     *     total_hours: string,
     *     billable_hours: string,
     *     non_billable_hours: string,
     *     tasks_summary: array<int, array{id: string, title: string, status: string, estimated_hours: string, actual_hours: string}>
     * }
     */
    public function execute(Project $project): array
    {
        $project->loadMissing(['timesheets.employee', 'tasks', 'customer', 'salesOrder']);

        $totalLaborCost = '0.000000';
        $totalBillableRevenue = '0.000000';
        $totalBilledRevenue = '0.000000';
        $totalHours = '0.00';
        $billableHours = '0.00';
        $nonBillableHours = '0.00';

        foreach ($project->timesheets as $ts) {
            $totalLaborCost = bcadd($totalLaborCost, (string) $ts->total_cost, 6);
            $totalHours = bcadd($totalHours, (string) $ts->hours, 2);

            if ($ts->is_billable) {
                $totalBillableRevenue = bcadd($totalBillableRevenue, (string) $ts->total_billable, 6);
                $billableHours = bcadd($billableHours, (string) $ts->hours, 2);

                if ($ts->is_billed) {
                    $totalBilledRevenue = bcadd($totalBilledRevenue, (string) $ts->total_billable, 6);
                }
            } else {
                $nonBillableHours = bcadd($nonBillableHours, (string) $ts->hours, 2);
            }
        }

        $budgetCost = (string) $project->budget_cost;
        $budgetRevenue = (string) $project->budget_revenue;

        $plannedMargin = bcsub($budgetRevenue, $budgetCost, 6);
        $plannedMarginPercent = '0.00';
        if (bccomp($budgetRevenue, '0.000000', 6) > 0) {
            $plannedMarginPercent = bcmul(bcdiv($plannedMargin, $budgetRevenue, 6), '100', 2);
        }

        // If project has sales order, that might represent contract fixed price revenue
        $actualRevenue = $totalBillableRevenue;
        if ($project->salesOrder && bccomp((string) $project->salesOrder->total_amount, '0.000000', 6) > 0) {
            $actualRevenue = (string) $project->salesOrder->total_amount;
        }

        $actualMargin = bcsub($actualRevenue, $totalLaborCost, 6);
        $actualMarginPercent = '0.00';
        if (bccomp($actualRevenue, '0.000000', 6) > 0) {
            $actualMarginPercent = bcmul(bcdiv($actualMargin, $actualRevenue, 6), '100', 2);
        }

        $costVariance = bcsub($budgetCost, $totalLaborCost, 6);
        $unbilledRevenue = bcsub($totalBillableRevenue, $totalBilledRevenue, 6);

        $tasksSummary = $project->tasks->map(function ($task) {
            return [
                'id' => $task->id,
                'title' => $task->title,
                'status' => $task->status,
                'priority' => $task->priority,
                'estimated_hours' => (string) $task->estimated_hours,
                'actual_hours' => (string) $task->actual_hours,
            ];
        })->values()->all();

        return [
            'project_id' => $project->id,
            'project_number' => $project->project_number,
            'name' => $project->name,
            'budget_cost' => $budgetCost,
            'budget_revenue' => $budgetRevenue,
            'planned_margin' => $plannedMargin,
            'planned_margin_percent' => $plannedMarginPercent,
            'actual_labor_cost' => $totalLaborCost,
            'actual_billable_revenue' => $totalBillableRevenue,
            'actual_billed_revenue' => $totalBilledRevenue,
            'unbilled_revenue' => $unbilledRevenue,
            'actual_margin' => $actualMargin,
            'actual_margin_percent' => $actualMarginPercent,
            'cost_variance' => $costVariance,
            'total_hours' => $totalHours,
            'billable_hours' => $billableHours,
            'non_billable_hours' => $nonBillableHours,
            'tasks_summary' => $tasksSummary,
        ];
    }
}
