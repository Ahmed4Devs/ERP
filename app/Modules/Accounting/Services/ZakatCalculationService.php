<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\Account;
use App\Modules\Accounting\Models\JournalEntryLine;
use App\Modules\Accounting\Queries\IncomeStatementQuery;
use App\Modules\Assets\Services\ZatcaTaxDepreciationService;
use App\Modules\Organization\Models\Company;
use Illuminate\Support\Facades\DB;

class ZakatCalculationService
{
    public function __construct(
        protected IncomeStatementQuery $incomeStatementQuery,
        protected ZatcaTaxDepreciationService $taxDepreciationService
    ) {}

    /**
     * Compute full Saudi Zakat Base and Annual Zakat Liability Schedule
     * in accordance with ZATCA Regulations (Indirect / Sources of Funds Method).
     *
     * @param array{
     *     calendar_type?: 'gregorian'|'hijri',
     *     custom_adjusted_profit?: float|null,
     *     carried_forward_losses?: float|null,
     *     non_deductible_provisions?: float|null,
     * } $options
     * @return array<string, mixed>
     */
    public function calculateZakatSchedule(string $companyId, int $taxYear, array $options = []): array
    {
        $startDate = "{$taxYear}-01-01";
        $endDate = "{$taxYear}-12-31";
        $calendarType = $options['calendar_type'] ?? 'gregorian';
        $zakatRate = $calendarType === 'hijri' ? 0.025 : 0.025775; // 2.5% Hijri vs 2.5775% Gregorian

        // Fetch Cumulative Balance of Accounts as of End of Tax Year
        $aggregates = JournalEntryLine::where('journal_entry_lines.company_id', $companyId)
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->where('journal_entries.status', 'posted')
            ->where('journal_entries.date', '<=', $endDate)
            ->groupBy('journal_entry_lines.account_id')
            ->select([
                'journal_entry_lines.account_id',
                DB::raw('SUM(journal_entry_lines.debit) as total_debit'),
                DB::raw('SUM(journal_entry_lines.credit) as total_credit'),
            ])
            ->get()
            ->keyBy('account_id');

        $company = Company::find($companyId);

        // -------------------------------------------------------------
        // PART 1: SOURCES OF FUNDS ADDED TO ZAKAT BASE (المصادر المضافة)
        // -------------------------------------------------------------

        // 1. Paid-up Share Capital (رأس المال المدفوع)
        $capitalAccounts = Account::where('company_id', $companyId)
            ->where('type', 'equity')
            ->where(function ($q): void {
                $q->where('subtype', 'capital')
                    ->orWhere('code', 'like', '30%');
            })
            ->get();

        $capitalTotal = 0.0;
        $capitalDetails = [];
        foreach ($capitalAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $bal = max(0.0, $credit - $debit); // Equity normal balance is credit
            $capitalTotal += $bal;
            $capitalDetails[] = [
                'code' => $acc->code,
                'name' => $acc->name,
                'name_ar' => $acc->name_ar,
                'balance' => round($bal, 2),
            ];
        }

        // 2. Retained Earnings & Statutory Reserves (الأرباح المبقاة والاحتياطيات)
        $retainedAccounts = Account::where('company_id', $companyId)
            ->where('type', 'equity')
            ->where(function ($q): void {
                $q->whereIn('subtype', ['retained_earnings', 'reserves'])
                    ->orWhere('code', 'like', '31%')
                    ->orWhere('code', 'like', '32%');
            })
            ->get();

        $reservesTotal = 0.0;
        $reservesDetails = [];
        foreach ($retainedAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $bal = $credit - $debit;
            if ($bal > 0) {
                $reservesTotal += $bal;
                $reservesDetails[] = [
                    'code' => $acc->code,
                    'name' => $acc->name,
                    'name_ar' => $acc->name_ar,
                    'balance' => round($bal, 2),
                ];
            }
        }

        // 3. Long-term Provisions (المخصصات طويلة الأجل مثل نهاية الخدمة)
        $provisionAccounts = Account::where('company_id', $companyId)
            ->where('type', 'liability')
            ->where(function ($q): void {
                $q->whereIn('code', ['2050', '2160', '2170'])
                    ->orWhere('subtype', 'provision')
                    ->orWhere(function ($nameQ): void {
                        $nameQ->where('name', 'ilike', '%end of service%')
                            ->orWhere('name', 'ilike', '%eosb%')
                            ->orWhere('name', 'ilike', '%gratuity%')
                            ->orWhere('name_ar', 'like', '%نهاية الخدمة%');
                    });
            })
            ->whereNotIn('code', ['2010', '2020', '2030', '2040', '2060', '2150']) // Exclude current payables & zakat provision
            ->get();

        $provisionsTotal = 0.0;
        $provisionsDetails = [];
        foreach ($provisionAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $bal = max(0.0, $credit - $debit);
            $provisionsTotal += $bal;
            $provisionsDetails[] = [
                'code' => $acc->code,
                'name' => $acc->name,
                'name_ar' => $acc->name_ar,
                'balance' => round($bal, 2),
            ];
        }

        // 4. Long-term Liabilities & Term Financing (الديون والقروض طويلة الأجل لتمويل الأصول)
        $longTermDebtAccounts = Account::where('company_id', $companyId)
            ->where('type', 'liability')
            ->where(function ($q): void {
                $q->where('subtype', 'long_term_liability')
                    ->orWhere('code', 'like', '22%')
                    ->orWhere('name', 'ilike', '%term loan%')
                    ->orWhere('name_ar', 'like', '%قرض طويل الأجل%');
            })
            ->whereNotIn('code', ['2010', '2020', '2030', '2040', '2060', '2150', '2160'])
            ->get();

        $debtTotal = 0.0;
        $debtDetails = [];
        foreach ($longTermDebtAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $bal = max(0.0, $credit - $debit);
            $debtTotal += $bal;
            $debtDetails[] = [
                'code' => $acc->code,
                'name' => $acc->name,
                'name_ar' => $acc->name_ar,
                'balance' => round($bal, 2),
            ];
        }

        // 5. Adjusted Net Profit for the Year (صافي الربح المعدل لغرض الزكاة)
        $incomeReport = $this->incomeStatementQuery->execute($startDate, $endDate);
        $accountingNetProfit = (float) $incomeReport['net_profit'];

        // Non-deductible add-backs (unapproved provisions, fines, depreciation difference)
        $nonDeductibleAddbacks = isset($options['non_deductible_provisions'])
            ? (float) $options['non_deductible_provisions']
            : 0.0;

        $adjustedNetProfit = isset($options['custom_adjusted_profit'])
            ? (float) $options['custom_adjusted_profit']
            : ($accountingNetProfit + $nonDeductibleAddbacks);

        $totalSources = round($capitalTotal + $reservesTotal + $provisionsTotal + $debtTotal + max(0.0, $adjustedNetProfit), 2);

        // -------------------------------------------------------------
        // PART 2: DEDUCTIONS FROM ZAKAT BASE (الحسومات المسموح بها)
        // -------------------------------------------------------------

        // 1. Net Statutory Tax Asset Base (الأصول الثابتة الصافية لغرض الزكاة وفق المادة 17)
        $taxDeprSchedule = $this->taxDepreciationService->computeSchedule($companyId, $taxYear);
        $statutoryFixedAssetsBase = (float) $taxDeprSchedule['totals']['closing_base'];

        // If no fixed asset module assets exist, check GL Fixed Asset accounts
        if ($statutoryFixedAssetsBase <= 0) {
            $glFixedAssetAccounts = Account::where('company_id', $companyId)
                ->where('type', 'asset')
                ->where(function ($q): void {
                    $q->where('subtype', 'fixed_asset')
                        ->orWhere('code', 'like', '15%')
                        ->orWhere('code', 'like', '16%');
                })
                ->get();

            $glFaTotal = 0.0;
            foreach ($glFixedAssetAccounts as $acc) {
                $agg = $aggregates->get($acc->id);
                $debit = $agg ? (float) $agg->total_debit : 0.0;
                $credit = $agg ? (float) $agg->total_credit : 0.0;
                $glFaTotal += ($debit - $credit);
            }
            $statutoryFixedAssetsBase = max(0.0, $glFaTotal);
        }

        // 2. Capital Work in Progress (مشاريع رأسمالية قيد التنفيذ)
        $cwipAccounts = Account::where('company_id', $companyId)
            ->where('type', 'asset')
            ->where(function ($q): void {
                $q->whereIn('code', ['1450', '1550'])
                    ->orWhere('subtype', 'work_in_progress')
                    ->orWhere('name', 'ilike', '%work in progress%')
                    ->orWhere('name_ar', 'like', '%قيد التنفيذ%');
            })
            ->get();

        $cwipTotal = 0.0;
        $cwipDetails = [];
        foreach ($cwipAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $bal = max(0.0, $debit - $credit);
            $cwipTotal += $bal;
            $cwipDetails[] = [
                'code' => $acc->code,
                'name' => $acc->name,
                'name_ar' => $acc->name_ar,
                'balance' => round($bal, 2),
            ];
        }

        // 3. Long-term Investments (الاستثمارات طويلة الأجل في شركات خاضعة للزكاة)
        $investmentAccounts = Account::where('company_id', $companyId)
            ->where('type', 'asset')
            ->where(function ($q): void {
                $q->where('subtype', 'investment')
                    ->orWhere('code', 'like', '13%');
            })
            ->get();

        $investmentTotal = 0.0;
        $investmentDetails = [];
        foreach ($investmentAccounts as $acc) {
            $agg = $aggregates->get($acc->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $bal = max(0.0, $debit - $credit);
            $investmentTotal += $bal;
            $investmentDetails[] = [
                'code' => $acc->code,
                'name' => $acc->name,
                'name_ar' => $acc->name_ar,
                'balance' => round($bal, 2),
            ];
        }

        // 4. Carried-forward Prior Losses (الخسائر المدورة الجائز حسمها نظاماً)
        // ZATCA cap: maximum 25% of current year adjusted net profit
        $rawCarriedLosses = isset($options['carried_forward_losses']) ? (float) $options['carried_forward_losses'] : 0.0;
        $maxAllowableLossDeduction = $adjustedNetProfit > 0 ? round($adjustedNetProfit * 0.25, 2) : 0.0;
        $allowableCarriedLosses = min($rawCarriedLosses, $maxAllowableLossDeduction);

        $totalDeductions = round($statutoryFixedAssetsBase + $cwipTotal + $investmentTotal + $allowableCarriedLosses, 2);

        // -------------------------------------------------------------
        // PART 3: NET ZAKAT BASE & STATUTORY LIABILITY COMPUTATION
        // -------------------------------------------------------------
        $preliminaryZakatBase = round($totalSources - $totalDeductions, 2);

        // ZATCA Minimum Floor Rule:
        // When adjusted net profit > 0, the Zakat Base cannot be lower than the adjusted net profit.
        $floorApplied = false;
        if ($adjustedNetProfit > 0 && $preliminaryZakatBase < $adjustedNetProfit) {
            $finalZakatBase = $adjustedNetProfit;
            $floorApplied = true;
        } else {
            $finalZakatBase = max(0.0, $preliminaryZakatBase);
        }

        // Annual Zakat Due
        $annualZakatDue = round($finalZakatBase * $zakatRate, 2);

        // -------------------------------------------------------------
        // PART 4: EXISTING GL ACCRUAL & RECOMMENDED ADJUSTMENT
        // -------------------------------------------------------------
        $zakatProvisionAccount = Account::where('company_id', $companyId)
            ->where(function ($q): void {
                $q->where('code', '2060')
                    ->orWhere('name', 'ilike', '%zakat provision%')
                    ->orWhere('name_ar', 'like', '%مخصص الزكاة%');
            })
            ->first();

        $existingProvisionBalance = 0.0;
        if ($zakatProvisionAccount) {
            $agg = $aggregates->get($zakatProvisionAccount->id);
            $debit = $agg ? (float) $agg->total_debit : 0.0;
            $credit = $agg ? (float) $agg->total_credit : 0.0;
            $existingProvisionBalance = max(0.0, $credit - $debit);
        }

        $recommendedAdjustment = max(0.0, round($annualZakatDue - $existingProvisionBalance, 2));

        return [
            'tax_year' => $taxYear,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'calendar_type' => $calendarType,
            'zakat_rate' => $zakatRate,
            'zakat_rate_percentage' => ($zakatRate * 100).'%',
            'sources' => [
                'capital' => [
                    'title' => 'رأس المال المدفوع',
                    'title_en' => 'Paid-up Share Capital',
                    'total' => round($capitalTotal, 2),
                    'accounts' => $capitalDetails,
                ],
                'reserves_and_retained' => [
                    'title' => 'الأرباح المبقاة والاحتياطيات النظامية',
                    'title_en' => 'Retained Earnings & Reserves',
                    'total' => round($reservesTotal, 2),
                    'accounts' => $reservesDetails,
                ],
                'provisions' => [
                    'title' => 'المخصصات طويلة الأجل (نهاية الخدمة وغيرها)',
                    'title_en' => 'Long-term Provisions (EOSB & Others)',
                    'total' => round($provisionsTotal, 2),
                    'accounts' => $provisionsDetails,
                ],
                'long_term_liabilities' => [
                    'title' => 'الديون والتمويل طويل الأجل لتمويل الأصول',
                    'title_en' => 'Long-term Financing & Liabilities',
                    'total' => round($debtTotal, 2),
                    'accounts' => $debtDetails,
                ],
                'adjusted_profit' => [
                    'title' => 'صافي الربح المعدل لغرض الزكاة',
                    'title_en' => 'Adjusted Net Profit for Zakat',
                    'accounting_profit' => round($accountingNetProfit, 2),
                    'addbacks' => round($nonDeductibleAddbacks, 2),
                    'total' => round($adjustedNetProfit, 2),
                ],
                'total_sources' => $totalSources,
            ],
            'deductions' => [
                'statutory_fixed_assets' => [
                    'title' => 'صافي الأصول الثابتة الزكوية (المادة 17)',
                    'title_en' => 'Net Statutory Fixed Assets Base (Article 17)',
                    'total' => round($statutoryFixedAssetsBase, 2),
                ],
                'cwip' => [
                    'title' => 'مشاريع رأسمالية قيد التنفيذ',
                    'title_en' => 'Capital Work in Progress (CWIP)',
                    'total' => round($cwipTotal, 2),
                    'accounts' => $cwipDetails,
                ],
                'investments' => [
                    'title' => 'الاستثمارات طويلة الأجل في منشآت خاضعة للزكاة',
                    'title_en' => 'Long-term Equity Investments',
                    'total' => round($investmentTotal, 2),
                    'accounts' => $investmentDetails,
                ],
                'carried_losses' => [
                    'title' => 'الخسائر المدورة الجائز حسمها (سقف 25%)',
                    'title_en' => 'Allowable Carried-forward Losses (25% Cap)',
                    'requested' => round($rawCarriedLosses, 2),
                    'allowable' => round($allowableCarriedLosses, 2),
                    'total' => round($allowableCarriedLosses, 2),
                ],
                'total_deductions' => $totalDeductions,
            ],
            'calculation' => [
                'preliminary_base' => $preliminaryZakatBase,
                'floor_applied' => $floorApplied,
                'floor_rule_note' => $floorApplied ? 'تم تطبيق قاعدة الحد الأدنى: الوعاء الزكوي لا يقل عن صافي الربح المعدل' : null,
                'net_zakat_base' => $finalZakatBase,
                'zakat_rate' => $zakatRate,
                'annual_zakat_due' => $annualZakatDue,
                'existing_provision_balance' => round($existingProvisionBalance, 2),
                'recommended_adjustment' => $recommendedAdjustment,
            ],
        ];
    }

    /**
     * Generate standard CSV Audit Schedule for ZATCA corporate return.
     */
    public function generateZakatScheduleCsv(string $companyId, int $taxYear, array $options = []): string
    {
        $schedule = $this->calculateZakatSchedule($companyId, $taxYear, $options);
        $company = Company::find($companyId);

        $output = fopen('php://temp', 'r+');
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM

        fputcsv($output, ['إقرار واحتساب الوعاء الزكوي التقديري ومخصص الزكاة الشرعية / Saudi Zakat Base & Annual Liability Schedule']);
        fputcsv($output, ['المنشأة / Company', $company?->legal_name ?: ($company?->name ?: 'Company')]);
        fputcsv($output, ['الرقم الضريبي / VAT Number', $company?->tax_number ?: '-']);
        fputcsv($output, ['السنة المالية / Tax Year', $taxYear]);
        fputcsv($output, ['التقويم الزكوي / Calendar', $schedule['calendar_type'] === 'hijri' ? 'هجري (2.5%)' : 'ميلادي (2.5775%)']);
        fputcsv($output, ['المرجع النظامي / Statutory Authority', 'المرسوم الملكي ولائحة جباية الزكاة الصادرة عن هيئة الزكاة والضريبة والجمارك ZATCA']);
        fputcsv($output, []);

        // 1. Sources of Funds
        fputcsv($output, ['البند / Component', 'التصنيف / Classification', 'المبلغ بالريال السعودي / Amount (SAR)']);
        fputcsv($output, ['1. مصادر الأموال المضافة للوعاء / Sources of Funds Added to Base', '', '']);
        fputcsv($output, ['- رأس المال المدفوع', 'Share Capital', number_format($schedule['sources']['capital']['total'], 2, '.', '')]);
        fputcsv($output, ['- الأرباح المبقاة والاحتياطيات النظامية', 'Retained Earnings & Reserves', number_format($schedule['sources']['reserves_and_retained']['total'], 2, '.', '')]);
        fputcsv($output, ['- مخصصات طويلة الأجل (مكافأة نهاية الخدمة وغيرها)', 'Long-term Provisions', number_format($schedule['sources']['provisions']['total'], 2, '.', '')]);
        fputcsv($output, ['- الديون والتمويل طويل الأجل لتمويل الأصول', 'Long-term Financing', number_format($schedule['sources']['long_term_liabilities']['total'], 2, '.', '')]);
        fputcsv($output, ['- صافي الربح المعدل لغرض الزكاة', 'Adjusted Net Profit', number_format($schedule['sources']['adjusted_profit']['total'], 2, '.', '')]);
        fputcsv($output, ['إجمالي المصادر المضافة / Total Sources', '', number_format($schedule['sources']['total_sources'], 2, '.', '')]);
        fputcsv($output, []);

        // 2. Deductions
        fputcsv($output, ['2. الحسومات المسموح بها من الوعاء / Allowable Deductions from Base', '', '']);
        fputcsv($output, ['- صافي الأصول الثابتة الزكوية (المادة 17)', 'Net Statutory Fixed Assets (Art. 17)', number_format($schedule['deductions']['statutory_fixed_assets']['total'], 2, '.', '')]);
        fputcsv($output, ['- مشاريع رأسمالية قيد التنفيذ (CWIP)', 'Capital Work in Progress', number_format($schedule['deductions']['cwip']['total'], 2, '.', '')]);
        fputcsv($output, ['- الاستثمارات طويلة الأجل في منشآت خاضعة للزكاة', 'Long-term Equity Investments', number_format($schedule['deductions']['investments']['total'], 2, '.', '')]);
        fputcsv($output, ['- الخسائر المدورة الجائز حسمها (سقف 25%)', 'Allowable Carried-forward Losses', number_format($schedule['deductions']['carried_losses']['total'], 2, '.', '')]);
        fputcsv($output, ['إجمالي الحسومات / Total Deductions', '', number_format($schedule['deductions']['total_deductions'], 2, '.', '')]);
        fputcsv($output, []);

        // 3. Final Zakat Determination
        fputcsv($output, ['3. احتساب الوعاء والزكاة المستحقة / Zakat Base & Liability Calculation', '', '']);
        fputcsv($output, ['الوعاء الزكوي المحسوب (المصادر - الحسومات)', 'Calculated Zakat Base', number_format($schedule['calculation']['preliminary_base'], 2, '.', '')]);
        if ($schedule['calculation']['floor_applied']) {
            fputcsv($output, ['ملاحظة الحد الأدنى للوعاء', 'Minimum Floor Adjustment', 'تم تعديل الوعاء ليعادل صافي الربح المعدل كحد أدنى']);
        }
        fputcsv($output, ['صافي الوعاء الزكوي النهائي', 'Net Final Zakat Base', number_format($schedule['calculation']['net_zakat_base'], 2, '.', '')]);
        fputcsv($output, ['نسبة الزكاة الشرعية', 'Applicable Zakat Rate', $schedule['zakat_rate_percentage']]);
        fputcsv($output, ['الزكاة الشرعية المستحقة عن السنة', 'Annual Zakat Liability Due', number_format($schedule['calculation']['annual_zakat_due'], 2, '.', '')]);
        fputcsv($output, ['رصيد مخصص الزكاة الحالي في الدفاتر', 'Existing GL Zakat Provision', number_format($schedule['calculation']['existing_provision_balance'], 2, '.', '')]);
        fputcsv($output, ['مخصص الزكاة المطلوب تكوينه / القيد المقترح', 'Recommended Provision Accrual', number_format($schedule['calculation']['recommended_adjustment'], 2, '.', '')]);

        rewind($output);
        $content = stream_get_contents($output);
        fclose($output);

        return $content ?: '';
    }
}
