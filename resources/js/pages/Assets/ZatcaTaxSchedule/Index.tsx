import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Calculator,
    Download,
    FileSpreadsheet,
    Layers,
    TrendingDown,
    Building,
    Truck,
    Cpu,
    Pickaxe,
    Package,
    Search,
    ShieldCheck,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Edit3,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';

interface GroupSchedule {
    code: string;
    name_ar: string;
    name_en: string;
    rate: number;
    rate_percentage: string;
    description: string;
    opening_base: number;
    additions: number;
    disposals: number;
    statutory_base: number;
    tax_depreciation: number;
    closing_base: number;
    accounting_depreciation: number;
    temporary_difference: number;
    assets_count: number;
}

interface ScheduleTotals {
    opening_base: number;
    additions: number;
    disposals: number;
    statutory_base: number;
    tax_depreciation: number;
    closing_base: number;
    accounting_depreciation: number;
    temporary_difference: number;
    total_assets_count: number;
}

interface FixedAssetItem {
    id: string;
    asset_tag: string;
    name: string;
    name_ar?: string;
    purchase_date: string;
    acquisition_cost: string;
    net_book_value: string;
    zatca_tax_group: string;
    zatca_tax_base?: string;
    category?: {
        name: string;
        name_ar?: string;
    };
    branch?: {
        name: string;
    };
}

interface Props {
    taxYear: number;
    schedule: {
        tax_year: number;
        start_date: string;
        end_date: string;
        groups: Record<string, GroupSchedule>;
        totals: ScheduleTotals;
    };
    groupsDefinition: Record<string, {
        code: string;
        name_ar: string;
        name_en: string;
        rate: number;
        description: string;
    }>;
    assets: {
        data: FixedAssetItem[];
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: {
        tax_year: number;
        search?: string;
        group?: string;
    };
}

export default function ZatcaTaxAssetScheduleIndex({
    taxYear,
    schedule,
    groupsDefinition,
    assets,
    filters,
}: Props) {
    const { isRtl } = useTranslation();
    const [selectedYear, setSelectedYear] = useState<number>(taxYear);
    const [search, setSearch] = useState<string>(filters.search || '');
    const [groupFilter, setGroupFilter] = useState<string>(filters.group || '');

    // Asset editing modal
    const [editingAsset, setEditingAsset] = useState<FixedAssetItem | null>(null);
    const [editGroup, setEditGroup] = useState<string>('group_5');
    const [editTaxBase, setEditTaxBase] = useState<string>('');

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(isRtl ? 'ar-SA' : 'en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        router.get(
            '/assets/zatca-tax-schedule',
            {
                tax_year: year,
                search,
                group: groupFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/assets/zatca-tax-schedule',
            {
                tax_year: selectedYear,
                search,
                group: groupFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleOpenEdit = (asset: FixedAssetItem) => {
        setEditingAsset(asset);
        setEditGroup(asset.zatca_tax_group || 'group_5');
        setEditTaxBase(asset.zatca_tax_base ? String(asset.zatca_tax_base) : '');
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAsset) return;

        router.put(
            `/assets/zatca-tax-schedule/assets/${editingAsset.id}`,
            {
                zatca_tax_group: editGroup,
                zatca_tax_base: editTaxBase ? parseFloat(editTaxBase) : null,
            },
            {
                onSuccess: () => setEditingAsset(null),
                preserveScroll: true,
            }
        );
    };

    const groupIcons: Record<string, any> = {
        group_1: Building,
        group_2: Truck,
        group_3: Cpu,
        group_4: Pickaxe,
        group_5: Package,
    };

    return (
        <AppLayout>
            <Head title={isRtl ? 'جدول استهلاك الأصول لأغراض الزكاة والضريبة (ZATCA)' : 'ZATCA Statutory Asset Schedule'} />

            <div className={`p-6 space-y-8 max-w-7xl mx-auto ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
                {/* Header Title & Actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <Calculator className="w-5 h-5" />
                            </span>
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                                {isRtl
                                    ? 'جدول استهلاك الأصول لأغراض الزكاة وضريبة الدخل'
                                    : 'ZATCA Statutory Asset Tax Depreciation & Zakat Schedule'}
                            </h1>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {isRtl
                                ? 'وفق المادة (17) من نظام ضريبة الدخل واللائحة التنفيذية لجباية الزكاة (طريقة رصيد المجموعة المتناقص - 5 مجموعات)'
                                : 'Compliant with Article 17 of Saudi Income Tax Law & Zakat Executive Regulations (Declining Pool Method)'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Tax Year Selector */}
                        <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1 shadow-sm">
                            {[2024, 2025, 2026, 2027].map((yr) => (
                                <button
                                    key={yr}
                                    onClick={() => handleYearChange(yr)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                        selectedYear === yr
                                            ? 'bg-neutral-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                >
                                    {yr}
                                </button>
                            ))}
                        </div>

                        {/* Export CSV Button */}
                        <Button
                            asChild
                            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                        >
                            <a href={`/assets/zatca-tax-schedule/export?tax_year=${selectedYear}`} download>
                                <Download className="w-4 h-4" />
                                <span>{isRtl ? 'تصدير كشف الزكاة والضريبة (CSV)' : 'Export ZATCA Schedule (CSV)'}</span>
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Telemetry KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Total Statutory Depr Base */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                {isRtl ? 'وعاء الاستهلاك النظامي' : 'Statutory Depr Base'}
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <Layers className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                                {formatCurrency(schedule.totals.statutory_base)}
                            </span>
                            <span className="text-xs text-neutral-500">SAR</span>
                        </div>
                        <span className="text-[11px] text-neutral-400 mt-1 block">
                            {isRtl ? 'بداية العام + 50% من (الإضافات - الاستبعادات)' : 'Opening + 50% * (Additions - Disposals)'}
                        </span>
                    </div>

                    {/* 2. Total Tax Depreciation */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                {isRtl ? 'الاستهلاك الضريبي والزكوي' : 'Total Tax Depreciation'}
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(schedule.totals.tax_depreciation)}
                            </span>
                            <span className="text-xs text-neutral-500">SAR</span>
                        </div>
                        <span className="text-[11px] text-neutral-400 mt-1 block">
                            {isRtl ? 'المصروف الجائز حسمه في الإقرار الضريبي والزكوي' : 'Allowable deduction for income tax & zakat'}
                        </span>
                    </div>

                    {/* 3. Closing Base (Zakat Base Inclusion) */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                {isRtl ? 'رصيد نهاية العام (الوعاء الزكوي)' : 'Closing Base (Zakat Base)'}
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                            <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                                {formatCurrency(schedule.totals.closing_base)}
                            </span>
                            <span className="text-xs text-neutral-500">SAR</span>
                        </div>
                        <span className="text-[11px] text-neutral-400 mt-1 block">
                            {isRtl ? 'الصافي المتبقي للعام القادم والمحسوم من الوعاء' : 'Residual base carried over to next tax year'}
                        </span>
                    </div>

                    {/* 4. Accounting vs Tax Temporary Difference */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                {isRtl ? 'صافي الفرق المؤقت' : 'Temporary Difference'}
                            </span>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                schedule.totals.temporary_difference >= 0
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                                {schedule.totals.temporary_difference >= 0 ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4" />
                                )}
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-1.5">
                            <span className={`text-2xl font-extrabold ${
                                schedule.totals.temporary_difference >= 0 ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                                {formatCurrency(Math.abs(schedule.totals.temporary_difference))}
                            </span>
                            <span className="text-xs text-neutral-500">SAR</span>
                        </div>
                        <span className="text-[11px] text-neutral-400 mt-1 block">
                            {schedule.totals.temporary_difference >= 0
                                ? (isRtl ? 'استهلاك دفتري زائد (يضاف لصافي الربح)' : 'Book > Tax (Add back to taxable profit)')
                                : (isRtl ? 'استهلاك ضريبي زائد (يحسم من صافي الربح)' : 'Tax > Book (Deduct from taxable profit)')}
                        </span>
                    </div>
                </div>

                {/* THE 5 ZATCA STATUTORY GROUPS TABLE */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                            <span>{isRtl ? 'الجدول النظامي للمجموعات الخمس (هيئة الزكاة والضريبة والجمارك)' : 'ZATCA 5 Statutory Groups Schedule'}</span>
                        </h2>
                        <span className="text-xs text-neutral-400 font-mono">
                            {schedule.start_date} → {schedule.end_date}
                        </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="px-4 py-3.5 text-start">{isRtl ? 'مجموعة الأصول (المادة 17)' : 'Asset Group'}</th>
                                    <th className="px-3 py-3.5 text-center">{isRtl ? 'النسبة' : 'Rate'}</th>
                                    <th className="px-3 py-3.5 text-end">{isRtl ? 'رصيد البداية' : 'Opening'}</th>
                                    <th className="px-3 py-3.5 text-end">{isRtl ? 'الإضافات' : 'Additions'}</th>
                                    <th className="px-3 py-3.5 text-end">{isRtl ? 'الاستبعادات' : 'Disposals'}</th>
                                    <th className="px-4 py-3.5 text-end">{isRtl ? 'وعاء الاستهلاك' : 'Depr Base'}</th>
                                    <th className="px-4 py-3.5 text-end">{isRtl ? 'الاستهلاك الضريبي' : 'Tax Depr'}</th>
                                    <th className="px-4 py-3.5 text-end">{isRtl ? 'رصيد النهاية' : 'Closing'}</th>
                                    <th className="px-3 py-3.5 text-end">{isRtl ? 'الدفتري' : 'Book Depr'}</th>
                                    <th className="px-3 py-3.5 text-end">{isRtl ? 'الفرق المؤقت' : 'Diff'}</th>
                                    <th className="px-3 py-3.5 text-center">{isRtl ? 'الأصول' : 'Assets'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/80 text-xs">
                                {Object.entries(schedule.groups).map(([grpKey, g]) => {
                                    const IconComp = groupIcons[grpKey] || Package;
                                    return (
                                        <tr key={grpKey} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                                            <td className="px-4 py-3.5 font-medium text-neutral-900 dark:text-neutral-100">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                                                        <IconComp className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-neutral-900 dark:text-white">
                                                            {isRtl ? g.name_ar : g.name_en}
                                                        </div>
                                                        <div className="text-[11px] text-neutral-400 line-clamp-1 max-w-xs">
                                                            {g.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                                {g.rate_percentage}
                                            </td>
                                            <td className="px-3 py-3.5 text-end font-mono text-neutral-700 dark:text-neutral-300">
                                                {formatCurrency(g.opening_base)}
                                            </td>
                                            <td className="px-3 py-3.5 text-end font-mono text-blue-600 dark:text-blue-400">
                                                {g.additions > 0 ? `+${formatCurrency(g.additions)}` : '-'}
                                            </td>
                                            <td className="px-3 py-3.5 text-end font-mono text-red-600 dark:text-red-400">
                                                {g.disposals > 0 ? `-${formatCurrency(g.disposals)}` : '-'}
                                            </td>
                                            <td className="px-4 py-3.5 text-end font-mono font-bold text-neutral-900 dark:text-white">
                                                {formatCurrency(g.statutory_base)}
                                            </td>
                                            <td className="px-4 py-3.5 text-end font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(g.tax_depreciation)}
                                            </td>
                                            <td className="px-4 py-3.5 text-end font-mono font-bold text-neutral-900 dark:text-neutral-200">
                                                {formatCurrency(g.closing_base)}
                                            </td>
                                            <td className="px-3 py-3.5 text-end font-mono text-neutral-500">
                                                {formatCurrency(g.accounting_depreciation)}
                                            </td>
                                            <td className={`px-3 py-3.5 text-end font-mono font-semibold ${
                                                g.temporary_difference >= 0 ? 'text-amber-500' : 'text-emerald-500'
                                            }`}>
                                                {formatCurrency(g.temporary_difference)}
                                            </td>
                                            <td className="px-3 py-3.5 text-center font-mono text-neutral-500">
                                                {g.assets_count}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-neutral-100 dark:bg-neutral-800/80 font-bold text-xs border-t-2 border-neutral-300 dark:border-neutral-700">
                                <tr>
                                    <td className="px-4 py-4 text-neutral-900 dark:text-white">
                                        {isRtl ? 'إجمالي كافة المجموعات النظامية' : 'TOTAL ALL 5 GROUPS'}
                                    </td>
                                    <td className="px-3 py-4 text-center">-</td>
                                    <td className="px-3 py-4 text-end font-mono text-neutral-900 dark:text-white">
                                        {formatCurrency(schedule.totals.opening_base)}
                                    </td>
                                    <td className="px-3 py-4 text-end font-mono text-blue-600 dark:text-blue-400">
                                        +{formatCurrency(schedule.totals.additions)}
                                    </td>
                                    <td className="px-3 py-4 text-end font-mono text-red-600 dark:text-red-400">
                                        -{formatCurrency(schedule.totals.disposals)}
                                    </td>
                                    <td className="px-4 py-4 text-end font-mono font-bold text-neutral-900 dark:text-white">
                                        {formatCurrency(schedule.totals.statutory_base)}
                                    </td>
                                    <td className="px-4 py-4 text-end font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(schedule.totals.tax_depreciation)}
                                    </td>
                                    <td className="px-4 py-4 text-end font-mono font-extrabold text-neutral-900 dark:text-white">
                                        {formatCurrency(schedule.totals.closing_base)}
                                    </td>
                                    <td className="px-3 py-4 text-end font-mono text-neutral-500">
                                        {formatCurrency(schedule.totals.accounting_depreciation)}
                                    </td>
                                    <td className={`px-3 py-4 text-end font-mono ${
                                        schedule.totals.temporary_difference >= 0 ? 'text-amber-500' : 'text-emerald-500'
                                    }`}>
                                        {formatCurrency(schedule.totals.temporary_difference)}
                                    </td>
                                    <td className="px-3 py-4 text-center font-mono text-neutral-900 dark:text-white">
                                        {schedule.totals.total_assets_count}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* SECTION 2: ASSET CLASSIFICATION & MAPPING */}
                <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-500" />
                                <span>{isRtl ? 'سجل تصنيف الأصول وفق مجموعات هيئة الزكاة' : 'Asset ZATCA Classification Registry'}</span>
                            </h2>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                {isRtl ? 'تحديد وتعديل المجموعة الضريبية وقاعدة الاستهلاك النظامية لكل أصل' : 'Assign and update statutory tax group and initial base for each asset'}
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="w-4 h-4 absolute top-2.5 left-3 text-neutral-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={isRtl ? 'بحث باسم الأصل أو الكود...' : 'Search by asset name or tag...'}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                            <Button type="submit" size="sm" variant="secondary" className="h-9">
                                {isRtl ? 'بحث' : 'Filter'}
                            </Button>
                        </form>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 shadow-xs">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="px-4 py-3.5 text-start">{isRtl ? 'كود الأصل' : 'Asset Tag'}</th>
                                    <th className="px-4 py-3.5 text-start">{isRtl ? 'اسم الأصل' : 'Asset Name'}</th>
                                    <th className="px-4 py-3.5 text-start">{isRtl ? 'التصنيف الدفتري' : 'Book Category'}</th>
                                    <th className="px-4 py-3.5 text-start">{isRtl ? 'المجموعة الضريبية (ZATCA)' : 'ZATCA Tax Group'}</th>
                                    <th className="px-4 py-3.5 text-end">{isRtl ? 'تكلفة الاقتناء' : 'Acquisition Cost'}</th>
                                    <th className="px-4 py-3.5 text-end">{isRtl ? 'صافي القيمة الدفترية' : 'Net Book Value'}</th>
                                    <th className="px-4 py-3.5 text-center">{isRtl ? 'إجراء' : 'Action'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/80 text-xs">
                                {assets.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                                            {isRtl ? 'لا توجد أصول مطابقة للبحث' : 'No assets found.'}
                                        </td>
                                    </tr>
                                ) : (
                                    assets.data.map((asset) => {
                                        const grpDef = groupsDefinition[asset.zatca_tax_group || 'group_5'];
                                        return (
                                            <tr key={asset.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition">
                                                <td className="px-4 py-3 font-mono font-semibold text-neutral-900 dark:text-white">
                                                    {asset.asset_tag}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                                                    <div>{asset.name}</div>
                                                    {asset.name_ar && (
                                                        <div className="text-[11px] text-neutral-400">{asset.name_ar}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-neutral-500">
                                                    {asset.category?.name || '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                                                        <span>{grpDef?.code || 'G5'}</span>
                                                        <span>-</span>
                                                        <span>{isRtl ? grpDef?.name_ar : grpDef?.name_en}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-end font-mono text-neutral-800 dark:text-neutral-200">
                                                    {formatCurrency(parseFloat(asset.acquisition_cost))}
                                                </td>
                                                <td className="px-4 py-3 text-end font-mono font-bold text-neutral-900 dark:text-white">
                                                    {formatCurrency(parseFloat(asset.net_book_value))}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleOpenEdit(asset)}
                                                        className="h-7 w-7 p-0 text-neutral-500 hover:text-emerald-600"
                                                        title={isRtl ? 'تعديل المجموعة الضريبية' : 'Edit Tax Group'}
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* EDIT ASSET ZATCA TAX GROUP MODAL */}
                <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
                    <DialogContent className="sm:max-w-md">
                        <form onSubmit={handleSaveEdit}>
                            <DialogHeader>
                                <DialogTitle>
                                    {isRtl ? 'تعديل المجموعة الضريبية للأصل (ZATCA)' : 'Update Asset ZATCA Tax Group'}
                                </DialogTitle>
                            </DialogHeader>

                            {editingAsset && (
                                <div className="py-4 space-y-4 text-xs">
                                    <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                                        <div className="font-bold text-sm text-neutral-900 dark:text-white">
                                            {editingAsset.name}
                                        </div>
                                        <div className="text-neutral-500 font-mono mt-0.5">
                                            {editingAsset.asset_tag} | {isRtl ? 'التكلفة:' : 'Cost:'} {formatCurrency(parseFloat(editingAsset.acquisition_cost))} SAR
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                                            {isRtl ? 'المجموعة الضريبية النظامية (المادة 17):' : 'Statutory Tax Group (Article 17):'}
                                        </label>
                                        <select
                                            value={editGroup}
                                            onChange={(e) => setEditGroup(e.target.value)}
                                            className="w-full h-10 px-3 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white"
                                        >
                                            {Object.entries(groupsDefinition).map(([k, meta]) => (
                                                <option key={k} value={k}>
                                                    {meta.code}: {isRtl ? meta.name_ar : meta.name_en} ({meta.rate * 100}%)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                                            {isRtl ? 'رصيد الوعاء الضريبي المخصص (اختياري):' : 'Custom Tax Base (Optional):'}
                                        </label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={editTaxBase}
                                            onChange={(e) => setEditTaxBase(e.target.value)}
                                            placeholder={isRtl ? 'اتركه فارغاً للاعتماد على القيمة الدفترية' : 'Leave empty to use net book value'}
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingAsset(null)}
                                >
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                                >
                                    {isRtl ? 'حفظ التعديل' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
