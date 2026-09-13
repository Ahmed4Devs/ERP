<?php

namespace App\Modules\Accounting\Queries;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Shared\Context\CurrentCompany;
use Illuminate\Support\Facades\DB;

class CashFlowStatementQuery
{
    public function __construct(
        protected IncomeStatementQuery $incomeStatementQuery
    ) {}

    /**
     * Compute Cash Flow Statement according to IAS 7 (Indirect Method).
     *
     * @return array{
     *     start_date: string,
     *     end_date: string,
     *     operating_activities: array{
     *         net_income: float,
     *         depreciation: float,
     *         working_capital_changes: array<int, array{name: string, name_ar: string, amount: float}>,
     *         total_operating: float
     *     },
     *     investing_activities: array{
     *         items: array<int, array{name: string, name_ar: string, amount: float}>,
     *         total_investing: float
     *     },
     *     financing_activities: array{
     *         items: array<int, array{name: string, name_ar: string, amount: float}>,
     *         total_financing: float
     *     },
     *     net_change_in_cash: float,
     *     beginning_cash: float,
     *     ending_cash: float
     * }
     */
    public function execute(?string $startDate = null, ?string $endDate = null): array
    {
        $currentCompany = app(CurrentCompany::class);
        $companyId = $currentCompany->id();

        $startDate = $startDate ?: now()->startOfYear()->toDateString();
        $endDate = $endDate ?: now()->toDateString();

        // 1. Net Income from Income Statement
        $pnl = $this->incomeStatementQuery->execute($startDate, $endDate);
        $netIncome = (float) $pnl['net_profit'];

        // 2. Non-cash depreciation expense during period
        $depreciationDebit = (float) JournalEntryLine::where('journal_entry_lines.company_id', $companyId)
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.status', 'posted')
            ->whereBetween('journal_entries.date', [$startDate, $endDate])
            ->where(function ($q): void {
                $q->where('accounts.code', 'like', '53%')
                    ->orWhere('accounts.subtype', 'depreciation');
            })
            ->sum(DB::raw('journal_entry_lines.debit - journal_entry_lines.credit'));

        // 3. Working Capital Changes (Opening vs Closing balance)
        $arChange = $this->getAccountNetChange($companyId, ['1200', '12%'], 'receivable', $startDate, $endDate);
        // Decrease in AR is cash inflow (+), increase is cash outflow (-)
        $arCashImpact = -$arChange;

        $inventoryChange = $this->getAccountNetChange($companyId, ['1300', '13%'], 'inventory', $startDate, $endDate);
        $invCashImpact = -$inventoryChange;

        $otherCurrentAssetsChange = $this->getAccountNetChange($companyId, ['1400', '14%'], 'other_current_asset', $startDate, $endDate);
        $otherAssetsCashImpact = -$otherCurrentAssetsChange;

        $apChange = $this->getAccountNetChange($companyId, ['2010', '201%'], 'payable', $startDate, $endDate);
        // Increase in AP is cash inflow (+)
        $apCashImpact = $apChange;

        $otherLiabilitiesChange = $this->getAccountNetChange($companyId, ['2020', '2030', '20%'], 'other_current_liability', $startDate, $endDate);
        $otherLiabilitiesCashImpact = $otherLiabilitiesChange;

        $workingCapitalItems = [
            [
                'name' => 'Change in Accounts Receivable',
                'name_ar' => 'التغير في حسابات العملاء والمدينين',
                'amount' => round($arCashImpact, 2),
            ],
            [
                'name' => 'Change in Merchandise Inventory',
                'name_ar' => 'التغير في مخزون البضائع',
                'amount' => round($invCashImpact, 2),
            ],
            [
                'name' => 'Change in Prepayments & Other Current Assets',
                'name_ar' => 'التغير في المصاريف المدفوعة مقدماً والأصول المتداولة الأخرى',
                'amount' => round($otherAssetsCashImpact, 2),
            ],
            [
                'name' => 'Change in Accounts Payable & Suppliers',
                'name_ar' => 'التغير في حسابات الموردين والدائنين',
                'amount' => round($apCashImpact, 2),
            ],
            [
                'name' => 'Change in VAT & Other Accrued Liabilities',
                'name_ar' => 'التغير في ضريبة القيمة المضافة والمستحقات الأخرى',
                'amount' => round($otherLiabilitiesCashImpact, 2),
            ],
        ];

        $wcTotal = array_sum(array_column($workingCapitalItems, 'amount'));
        $totalOperating = round($netIncome + $depreciationDebit + $wcTotal, 2);

        // 4. Investing Activities (CapEx in Fixed Assets 1500)
        $fixedAssetsChange = $this->getAccountNetChange($companyId, ['1500', '15%'], 'fixed_asset', $startDate, $endDate);
        // Increase in Fixed Assets is cash outflow (-)
        $capexAmount = -$fixedAssetsChange;

        $investingItems = [
            [
                'name' => 'Purchase / Disposal of Property, Plant & Equipment',
                'name_ar' => 'الإضافات والاستبعادات في الأصول الثابتة والمعدات',
                'amount' => round($capexAmount, 2),
            ],
        ];
        $totalInvesting = round($capexAmount, 2);

        // 5. Financing Activities (Loans 2200, Equity / Capital 3000)
        $loansChange = $this->getAccountNetChange($companyId, ['2200', '22%'], 'long_term_liability', $startDate, $endDate);
        $capitalChange = $this->getAccountNetChange($companyId, ['3000', '3100'], 'equity', $startDate, $endDate);

        $financingItems = [
            [
                'name' => 'Proceeds / Repayment of Bank Loans & Facilities',
                'name_ar' => 'الحصول على / سداد القروض والتسهيلات البنكية',
                'amount' => round($loansChange, 2),
            ],
            [
                'name' => 'Capital Contributions / Dividends Paid',
                'name_ar' => 'المساهمات في رأس المال / توزيعات الأرباح',
                'amount' => round($capitalChange, 2),
            ],
        ];
        $totalFinancing = round($loansChange + $capitalChange, 2);

        // 6. Net Change in Cash & Reconciliation
        $netChangeInCash = round($totalOperating + $totalInvesting + $totalFinancing, 2);

        $beginningCash = $this->getCashBalanceAsOf($companyId, $startDate, true);
        $endingCash = round($beginningCash + $netChangeInCash, 2);

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'operating_activities' => [
                'net_income' => round($netIncome, 2),
                'depreciation' => round($depreciationDebit, 2),
                'working_capital_changes' => $workingCapitalItems,
                'total_operating' => $totalOperating,
            ],
            'investing_activities' => [
                'items' => $investingItems,
                'total_investing' => $totalInvesting,
            ],
            'financing_activities' => [
                'items' => $financingItems,
                'total_financing' => $totalFinancing,
            ],
            'net_change_in_cash' => $netChangeInCash,
            'beginning_cash' => round($beginningCash, 2),
            'ending_cash' => round($endingCash, 2),
        ];
    }

    /**
     * Compute the net change in balance for account groups between start and end date.
     */
    protected function getAccountNetChange(
        string $companyId,
        array $codes,
        string $subtype,
        string $startDate,
        string $endDate
    ): float {
        $query = JournalEntryLine::where('journal_entry_lines.company_id', $companyId)
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.status', 'posted')
            ->whereBetween('journal_entries.date', [$startDate, $endDate])
            ->where(function ($q) use ($codes, $subtype): void {
                $q->where('accounts.subtype', $subtype);
                foreach ($codes as $c) {
                    $q->orWhere('accounts.code', 'like', $c);
                }
            });

        // Determine if account is normally debit or credit
        $accountSample = Account::where('company_id', $companyId)
            ->where(function ($q) use ($codes, $subtype): void {
                $q->where('subtype', $subtype);
                foreach ($codes as $c) {
                    $q->orWhere('accounts.code', 'like', $c);
                }
            })
            ->first();

        $isDebitNormal = $accountSample ? in_array($accountSample->type, ['asset', 'expense']) : true;

        if ($isDebitNormal) {
            return (float) $query->sum(DB::raw('journal_entry_lines.debit - journal_entry_lines.credit'));
        }

        return (float) $query->sum(DB::raw('journal_entry_lines.credit - journal_entry_lines.debit'));
    }

    /**
     * Get cash and bank balance as of a given date.
     */
    protected function getCashBalanceAsOf(string $companyId, string $date, bool $beforeDate = false): float
    {
        $operator = $beforeDate ? '<' : '<=';

        return (float) JournalEntryLine::where('journal_entry_lines.company_id', $companyId)
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->join('accounts', 'accounts.id', '=', 'journal_entry_lines.account_id')
            ->where('journal_entries.status', 'posted')
            ->where('journal_entries.date', $operator, $date)
            ->where(function ($q): void {
                $q->whereIn('accounts.subtype', ['cash', 'bank'])
                    ->orWhere('accounts.code', 'like', '101%')
                    ->orWhere('accounts.code', 'like', '102%')
                    ->orWhere('accounts.code', 'like', '103%');
            })
            ->sum(DB::raw('journal_entry_lines.debit - journal_entry_lines.credit'));
    }
}
