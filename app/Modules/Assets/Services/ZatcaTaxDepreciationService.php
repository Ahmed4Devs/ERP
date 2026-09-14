<?php

namespace App\Modules\Assets\Services;

use App\Modules\Assets\Models\FixedAsset;
use App\Modules\Assets\Models\FixedAssetDisposal;
use Carbon\Carbon;

class ZatcaTaxDepreciationService
{
    /**
     * ZATCA Statutory 5 Asset Depreciation Groups (Article 17 of Saudi Income Tax Law & Zakat Executive Regulations).
     */
    public const GROUPS = [
        'group_1' => [
            'code' => 'G1',
            'name_ar' => 'المجموعة الأولى: المباني الثابتة',
            'name_en' => 'Group 1: Stationary Buildings',
            'rate' => 0.03, // 3%
            'description' => 'المباني والمنشآت الثابتة والمستودعات والإنشاءات المدنية',
        ],
        'group_2' => [
            'code' => 'G2',
            'name_ar' => 'المجموعة الثانية: المنقولات الصناعية والزراعية',
            'name_en' => 'Group 2: Movable Industrial and Agricultural Assets',
            'rate' => 0.10, // 10%
            'description' => 'المعدات المنقولة، آلات الحفر الثقيلة، الصهاريج والحاويات الزراعية والصناعية',
        ],
        'group_3' => [
            'code' => 'G3',
            'name_ar' => 'المجموعة الثالثة: الآلات والمعدات وأجهزة وبرمجيات الحاسب',
            'name_en' => 'Group 3: Machinery, Equipment, Hardware and Software',
            'rate' => 0.25, // 25%
            'description' => 'خطوط الإنتاج، الآلات والمعدات، أنظمة التشغيل، البرمجيات وتطبيقات الحاسب الآلي',
        ],
        'group_4' => [
            'code' => 'G4',
            'name_ar' => 'المجموعة الرابعة: نفقات المسح الجيولوجي والتنقيب',
            'name_en' => 'Group 4: Geological Survey and Exploration Costs',
            'rate' => 0.20, // 20%
            'description' => 'أعمال الحفر والتنقيب واستكشاف الموارد الطبيعية والأعمال التجهيزية',
        ],
        'group_5' => [
            'code' => 'G5',
            'name_ar' => 'المجموعة الخامسة: الأصول الأخرى الملموسة وغير الملموسة',
            'name_en' => 'Group 5: Other Tangible and Intangible Assets',
            'rate' => 0.10, // 10%
            'description' => 'سيارات نقل الركاب، الأثاث المكتبي، تحسينات العقارات المستأجرة، الأصول غير الملموسة',
        ],
    ];

    /**
     * Compute full ZATCA statutory asset depreciation and zakat schedule for a specific tax year.
     *
     * @return array{
     *     tax_year: int,
     *     start_date: string,
     *     end_date: string,
     *     groups: array<string, array{
     *         code: string,
     *         name_ar: string,
     *         name_en: string,
     *         rate: float,
     *         rate_percentage: string,
     *         description: string,
     *         opening_base: float,
     *         additions: float,
     *         disposals: float,
     *         statutory_base: float,
     *         tax_depreciation: float,
     *         closing_base: float,
     *         accounting_depreciation: float,
     *         temporary_difference: float,
     *         assets_count: int
     *     }>,
     *     totals: array{
     *         opening_base: float,
     *         additions: float,
     *         disposals: float,
     *         statutory_base: float,
     *         tax_depreciation: float,
     *         closing_base: float,
     *         accounting_depreciation: float,
     *         temporary_difference: float,
     *         total_assets_count: int
     *     }
     * }
     */
    public function computeSchedule(string $companyId, int $taxYear): array
    {
        $startDate = "{$taxYear}-01-01";
        $endDate = "{$taxYear}-12-31";

        $scheduleGroups = [];
        $totals = [
            'opening_base' => 0.0,
            'additions' => 0.0,
            'disposals' => 0.0,
            'statutory_base' => 0.0,
            'tax_depreciation' => 0.0,
            'closing_base' => 0.0,
            'accounting_depreciation' => 0.0,
            'temporary_difference' => 0.0,
            'total_assets_count' => 0,
        ];

        foreach (self::GROUPS as $groupKey => $meta) {
            $rate = $meta['rate'];

            // Query assets for this group
            $assets = FixedAsset::where('company_id', $companyId)
                ->where(function ($q) use ($groupKey): void {
                    $q->where('zatca_tax_group', $groupKey)
                        ->orWhere(function ($sq) use ($groupKey): void {
                            $sq->whereNull('zatca_tax_group')
                                ->whereHas('category', fn ($cq) => $cq->where('zatca_tax_group', $groupKey));
                        });
                })
                ->where('purchase_date', '<=', $endDate)
                ->get();

            $openingBase = 0.0;
            $additions = 0.0;
            $accountingDepr = 0.0;
            $assetsCount = $assets->count();

            foreach ($assets as $asset) {
                $purchaseDate = Carbon::parse($asset->purchase_date);
                $cost = (float) $asset->acquisition_cost;

                // Estimated annual accounting straight-line depreciation
                $usefulLifeMonths = max(1, $asset->useful_life_months);
                $annualBookDepr = ($cost - (float) $asset->salvage_value) / ($usefulLifeMonths / 12);

                if ($purchaseDate->year < $taxYear) {
                    // Prior asset -> forms opening base
                    if ($asset->zatca_tax_base !== null) {
                        $openingBase += (float) $asset->zatca_tax_base;
                    } else {
                        // Default to net book value at beginning of year or residual
                        $openingBase += max(0.0, (float) $asset->net_book_value);
                    }
                    $accountingDepr += $annualBookDepr;
                } elseif ($purchaseDate->year === $taxYear) {
                    // Current year addition
                    $additions += $cost;

                    // Prorated book depreciation for current year additions
                    $monthsActive = 12 - $purchaseDate->month + 1;
                    $accountingDepr += ($annualBookDepr / 12) * $monthsActive;
                }
            }

            // Disposals during the year for this group
            $assetIds = $assets->pluck('id')->toArray();
            $disposals = 0.0;
            if (! empty($assetIds)) {
                $disposals = (float) FixedAssetDisposal::where('company_id', $companyId)
                    ->whereIn('fixed_asset_id', $assetIds)
                    ->whereBetween('disposal_date', [$startDate, $endDate])
                    ->where('status', 'posted')
                    ->sum('proceeds');
            }

            // ZATCA Declining Pool Statutory Depreciation Formula:
            // Base = Opening + 50% * (Additions - Disposals)
            $netAdjustment = 0.5 * ($additions - $disposals);
            $statutoryBase = max(0.0, $openingBase + $netAdjustment);

            $taxDepreciation = round($statutoryBase * $rate, 2);

            // Closing Base at Year-End for Zakat Base determination
            $closingBase = max(0.0, $openingBase + $additions - $disposals - $taxDepreciation);

            // Small balance threshold write-off rule (under SAR 1,000)
            if ($closingBase > 0 && $closingBase <= 1000.0) {
                $taxDepreciation += $closingBase;
                $closingBase = 0.0;
            }

            $temporaryDifference = round($accountingDepr - $taxDepreciation, 2);

            $groupResult = [
                'code' => $meta['code'],
                'name_ar' => $meta['name_ar'],
                'name_en' => $meta['name_en'],
                'rate' => $rate,
                'rate_percentage' => ($rate * 100).'%',
                'description' => $meta['description'],
                'opening_base' => round($openingBase, 2),
                'additions' => round($additions, 2),
                'disposals' => round($disposals, 2),
                'statutory_base' => round($statutoryBase, 2),
                'tax_depreciation' => round($taxDepreciation, 2),
                'closing_base' => round($closingBase, 2),
                'accounting_depreciation' => round($accountingDepr, 2),
                'temporary_difference' => $temporaryDifference,
                'assets_count' => $assetsCount,
            ];

            $scheduleGroups[$groupKey] = $groupResult;

            // Accumulate Totals
            $totals['opening_base'] += $groupResult['opening_base'];
            $totals['additions'] += $groupResult['additions'];
            $totals['disposals'] += $groupResult['disposals'];
            $totals['statutory_base'] += $groupResult['statutory_base'];
            $totals['tax_depreciation'] += $groupResult['tax_depreciation'];
            $totals['closing_base'] += $groupResult['closing_base'];
            $totals['accounting_depreciation'] += $groupResult['accounting_depreciation'];
            $totals['temporary_difference'] += $groupResult['temporary_difference'];
            $totals['total_assets_count'] += $assetsCount;
        }

        return [
            'tax_year' => $taxYear,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'groups' => $scheduleGroups,
            'totals' => array_map(fn ($val) => is_float($val) ? round($val, 2) : $val, $totals),
        ];
    }

    /**
     * Generate standard ZATCA statutory CSV audit report for income tax and zakat declarations.
     */
    public function generateScheduleCsv(string $companyId, int $taxYear): string
    {
        $schedule = $this->computeSchedule($companyId, $taxYear);

        $fp = fopen('php://memory', 'r+');
        fprintf($fp, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM

        fputcsv($fp, ['ZATCA Statutory Asset Tax Depreciation & Zakat Schedule / جدول استهلاك الأصول لأغراض الزكاة وضريبة الدخل']);
        fputcsv($fp, ['Tax Year / العام المالي والضريبي', $taxYear]);
        fputcsv($fp, ['Regulatory Basis / المرجع النظامي', 'Article 17 of Saudi Income Tax Law & Zakat Executive Regulations (المادة 17 من نظام ضريبة الدخل ولائحة جباية الزكاة)']);
        fputcsv($fp, []);

        fputcsv($fp, [
            'Group Code / الرمز',
            'ZATCA Asset Group / مجموعة الأصول النظامية',
            'Rate / النسبة',
            'Opening Base / رصيد بداية العام',
            'Additions / الإضافات الرأسمالية',
            'Disposals / الاستبعادات والبيع',
            'Statutory Depr Base / وعاء الاستهلاك النظامي',
            'Tax Depreciation / الاستهلاك الضريبي والزكوي',
            'Closing Base / رصيد نهاية العام (الوعاء)',
            'Accounting Depr / الاستهلاك الدفتري',
            'Temporary Difference / الفرق المؤقت',
            'Assets Count / عدد الأصول',
        ]);

        foreach ($schedule['groups'] as $g) {
            fputcsv($fp, [
                $g['code'],
                "{$g['name_ar']} ({$g['name_en']})",
                $g['rate_percentage'],
                number_format($g['opening_base'], 2),
                number_format($g['additions'], 2),
                number_format($g['disposals'], 2),
                number_format($g['statutory_base'], 2),
                number_format($g['tax_depreciation'], 2),
                number_format($g['closing_base'], 2),
                number_format($g['accounting_depreciation'], 2),
                number_format($g['temporary_difference'], 2),
                $g['assets_count'],
            ]);
        }

        fputcsv($fp, []);
        $t = $schedule['totals'];
        fputcsv($fp, [
            'TOTALS / الإجمالي',
            'Total All Groups / إجمالي كافة المجموعات',
            '-',
            number_format($t['opening_base'], 2),
            number_format($t['additions'], 2),
            number_format($t['disposals'], 2),
            number_format($t['statutory_base'], 2),
            number_format($t['tax_depreciation'], 2),
            number_format($t['closing_base'], 2),
            number_format($t['accounting_depreciation'], 2),
            number_format($t['temporary_difference'], 2),
            $t['total_assets_count'],
        ]);

        rewind($fp);
        $content = stream_get_contents($fp);
        fclose($fp);

        return $content;
    }
}
