import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    BookOpen,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Coins,
    CreditCard,
    DollarSign,
    Download,
    FileSpreadsheet,
    FileText,
    HelpCircle,
    Landmark,
    Layers,
    PieChart,
    Plus,
    RefreshCw,
    Scale,
    Send,
    ShieldAlert,
    ShieldCheck,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface AccountDetail {
    code: string;
    name: string;
    name_ar?: string;
    balance: number;
}

interface SourceCategory {
    title: string;
    title_en: string;
    total: number;
    accounts?: AccountDetail[];
    accounting_profit?: number;
    addbacks?: number;
}

interface DeductionCategory {
    title: string;
    title_en: string;
    total: number;
    accounts?: AccountDetail[];
    requested?: number;
    allowable?: number;
}

interface ZakatSchedule {
    tax_year: number;
    start_date: string;
    end_date: string;
    calendar_type: 'gregorian' | 'hijri';
    zakat_rate: number;
    zakat_rate_percentage: string;
    sources: {
        capital: SourceCategory;
        reserves_and_retained: SourceCategory;
        provisions: SourceCategory;
        long_term_liabilities: SourceCategory;
        adjusted_profit: SourceCategory;
        total_sources: number;
    };
    deductions: {
        statutory_fixed_assets: DeductionCategory;
        cwip: DeductionCategory;
        investments: DeductionCategory;
        carried_losses: DeductionCategory;
        total_deductions: number;
    };
    calculation: {
        preliminary_base: number;
        floor_applied: boolean;
        floor_rule_note?: string;
        net_zakat_base: number;
        zakat_rate: number;
        annual_zakat_due: number;
        existing_provision_balance: number;
        recommended_adjustment: number;
    };
}

interface Props {
    schedule: ZakatSchedule;
    taxYear: number;
    calendarType: 'gregorian' | 'hijri';
    filters: {
        tax_year: number;
        calendar_type: 'gregorian' | 'hijri';
        carried_forward_losses?: number;
        non_deductible_provisions?: number;
    };
}

export default function ZakatScheduleIndex({
    schedule,
    taxYear,
    calendarType,
    filters,
}: Props) {
    const { t, isRtl } = useTranslation();
    const [selectedYear, setSelectedYear] = useState<number>(taxYear);
    const [selectedCalendar, setSelectedCalendar] = useState<'gregorian' | 'hijri'>(calendarType);
    const [carriedLosses, setCarriedLosses] = useState<string>(
        filters.carried_forward_losses !== undefined && filters.carried_forward_losses !== null
            ? String(filters.carried_forward_losses)
            : ''
    );
    const [nonDeductible, setNonDeductible] = useState<string>(
        filters.non_deductible_provisions !== undefined && filters.non_deductible_provisions !== null
            ? String(filters.non_deductible_provisions)
            : ''
    );

    const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
    const [postAmount, setPostAmount] = useState<string>(
        schedule.calculation.recommended_adjustment > 0
            ? String(schedule.calculation.recommended_adjustment)
            : String(schedule.calculation.annual_zakat_due)
    );
    const [isPosting, setIsPosting] = useState(false);

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/accounting/zakat',
            {
                tax_year: selectedYear,
                calendar_type: selectedCalendar,
                carried_forward_losses: carriedLosses ? parseFloat(carriedLosses) : undefined,
                non_deductible_provisions: nonDeductible ? parseFloat(nonDeductible) : undefined,
            },
            { preserveState: true }
        );
    };

    const handlePostProvision = (e: React.FormEvent) => {
        e.preventDefault();
        setIsPosting(true);
        router.post(
            '/accounting/zakat/post-provision',
            {
                tax_year: selectedYear,
                calendar_type: selectedCalendar,
                amount: parseFloat(postAmount),
            },
            {
                onSuccess: () => {
                    setIsPostingModalOpen(false);
                },
                onFinish: () => setIsPosting(false),
            }
        );
    };

    const exportUrl = `/accounting/zakat/export?tax_year=${selectedYear}&calendar_type=${selectedCalendar}${
        carriedLosses ? `&carried_forward_losses=${carriedLosses}` : ''
    }${nonDeductible ? `&non_deductible_provisions=${nonDeductible}` : ''}`;

    return (
        <AppLayout
            breadcrumbs={[
                { title: t('nav.accounting', 'المحاسبة والمالية'), href: '/accounts' },
                { title: isRtl ? 'الوعاء ومخصص الزكاة الشرعية' : 'ZATCA Zakat Schedule' },
            ]}
        >
            <Head title={isRtl ? 'محرك الوعاء ومخصص الزكاة الشرعية' : 'Saudi Zakat Schedule Engine'} />

            <div className="flex flex-col gap-6 p-6">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                                <Scale className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                <span>{isRtl ? 'محرك احتساب الوعاء التقديري ومخصص الزكاة الشرعية' : 'Saudi Zakat Base & Annual Liability Schedule'}</span>
                            </h1>
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {isRtl ? 'معتمد ZATCA' : 'ZATCA Compliant'}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-3xl">
                            {isRtl
                                ? 'احتساب الوعاء الزكوي للمكلفين ذوي الحسابات النظامية وفق اللائحة التنفيذية لجباية الزكاة الصادرة عن هيئة الزكاة والضريبة والجمارك (طريقة مصادر الأموال).'
                                : 'Comprehensive statutory Zakat base computation and liability accrual schedule in compliance with ZATCA regulations (Indirect / Sources of Funds method).'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <a href={exportUrl} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold border-neutral-300 dark:border-neutral-700">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                <span>{isRtl ? 'تصدير جدول الإقرار (CSV)' : 'Export ZATCA CSV'}</span>
                            </Button>
                        </a>
                        <Button
                            size="sm"
                            onClick={() => setIsPostingModalOpen(true)}
                            className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                            <Send className="h-4 w-4" />
                            <span>{isRtl ? 'ترحيل قيد مخصص الزكاة' : 'Post GL Zakat Provision'}</span>
                        </Button>
                    </div>
                </div>

                {/* Filter & Parameters Bar */}
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                                {isRtl ? 'السنة المالية الزكوية' : 'Tax Year'}
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="w-full h-8 rounded-md border border-neutral-300 bg-transparent px-2.5 text-xs font-mono dark:border-neutral-700 dark:bg-neutral-800"
                            >
                                {[2023, 2024, 2025, 2026, 2027].map((yr) => (
                                    <option key={yr} value={yr}>{yr}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                                {isRtl ? 'نوع التقويم والنسبة' : 'Calendar & Rate'}
                            </label>
                            <select
                                value={selectedCalendar}
                                onChange={(e) => setSelectedCalendar(e.target.value as 'gregorian' | 'hijri')}
                                className="w-full h-8 rounded-md border border-neutral-300 bg-transparent px-2.5 text-xs dark:border-neutral-700 dark:bg-neutral-800"
                            >
                                <option value="gregorian">{isRtl ? 'ميلادي (2.5775% — 365 يوماً)' : 'Gregorian (2.5775% / 365 Days)'}</option>
                                <option value="hijri">{isRtl ? 'هجري (2.5000% — 354 يوماً)' : 'Hijri (2.5000% / 354 Days)'}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                                {isRtl ? 'الخسائر المدورة السابقة (ريال)' : 'Prior Carried Losses (SAR)'}
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={carriedLosses}
                                onChange={(e) => setCarriedLosses(e.target.value)}
                                placeholder="0.00"
                                className="h-8 text-xs font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                                {isRtl ? 'مصاريف غير جائزة الحسم (ريال)' : 'Non-Deductible Addbacks (SAR)'}
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={nonDeductible}
                                onChange={(e) => setNonDeductible(e.target.value)}
                                placeholder="0.00"
                                className="h-8 text-xs font-mono"
                            />
                        </div>

                        <Button type="submit" size="sm" className="h-8 text-xs gap-1 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900">
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>{isRtl ? 'تحديث الحساب' : 'Recalculate'}</span>
                        </Button>
                    </form>
                </div>

                {/* Statutory Minimum Floor Rule Alert */}
                {schedule.calculation.floor_applied && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                                {isRtl ? 'تطبيق قاعدة الحد الأدنى للوعاء الزكوي (المادة 5 من اللائحة التنفيذية):' : 'ZATCA Statutory Floor Rule Applied:'}
                            </h4>
                            <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                                {isRtl
                                    ? `الوعاء الزكوي التقديري المحسوب من معادلة المصادر ناقص الحسومات بلغ (${schedule.calculation.preliminary_base.toLocaleString()} ريال)، وهو أقل من صافي الربح المعدل للسنة (${schedule.sources.adjusted_profit.total.toLocaleString()} ريال). وفقاً للائحة الزكاة، تم تعديل الوعاء الزكوي ليعادل صافي الربح المعدل كحد أدنى.`
                                    : `The calculated Zakat base was ${schedule.calculation.preliminary_base.toLocaleString()} SAR, which is lower than the adjusted net profit (${schedule.sources.adjusted_profit.total.toLocaleString()} SAR). Under ZATCA regulations, the final Zakat base is set to the adjusted profit floor.`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Key Metric KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Sources */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                {isRtl ? 'إجمالي المصادر المضافة (+)' : 'Total Sources of Funds (+)'}
                            </span>
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black font-mono text-neutral-900 dark:text-neutral-100">
                            {schedule.sources.total_sources.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                            <span className="text-xs font-normal font-sans text-neutral-500">SAR</span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                            {isRtl ? 'رأس المال والاحتياطيات والديون والأرباح' : 'Capital, reserves, provisions, debt & profit'}
                        </p>
                    </div>

                    {/* Total Deductions */}
                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                {isRtl ? 'إجمالي الحسومات المعتمدة (-)' : 'Allowable Deductions (-)'}
                            </span>
                            <div className="p-2 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                <TrendingDown className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                            -{schedule.deductions.total_deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                            <span className="text-xs font-normal font-sans text-neutral-500">SAR</span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                            {isRtl ? 'أصول ثابتة (م17)، مشاريع قيد التنفيذ، استثمارات' : 'Statutory assets, CWIP, equity investments'}
                        </p>
                    </div>

                    {/* Net Zakat Base */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                {isRtl ? 'صافي الوعاء الزكوي الخاضع' : 'Net Final Zakat Base'}
                            </span>
                            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                <Scale className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black font-mono text-emerald-900 dark:text-emerald-100">
                            {schedule.calculation.net_zakat_base.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                            <span className="text-xs font-normal font-sans text-emerald-700 dark:text-emerald-300">SAR</span>
                        </p>
                        <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                            {isRtl ? `النسبة المطبقة: ${schedule.zakat_rate_percentage}` : `Rate applied: ${schedule.zakat_rate_percentage}`}
                        </p>
                    </div>

                    {/* Annual Zakat Due & Adjustment */}
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                                {isRtl ? 'مخصص الزكاة المستحقة' : 'Annual Zakat Liability'}
                            </span>
                            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                                <Coins className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black font-mono text-indigo-900 dark:text-indigo-100">
                            {schedule.calculation.annual_zakat_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                            <span className="text-xs font-normal font-sans text-indigo-700 dark:text-indigo-300">SAR</span>
                        </p>
                        <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-1 font-medium">
                            {isRtl
                                ? `المخصص بالدفاتر: ${schedule.calculation.existing_provision_balance.toLocaleString()} | المطلوب قيده: ${schedule.calculation.recommended_adjustment.toLocaleString()}`
                                : `GL Provision: ${schedule.calculation.existing_provision_balance.toLocaleString()} | To Accrue: ${schedule.calculation.recommended_adjustment.toLocaleString()}`}
                        </p>
                    </div>
                </div>

                {/* Section 1: Detailed Sources Table */}
                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                {isRtl ? '1. مصادر الأموال المضافة للوعاء الزكوي (المصادر الداخلية والخارجية)' : '1. Sources of Funds Added to Zakat Base'}
                            </h3>
                        </div>
                        <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                            {schedule.sources.total_sources.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </span>
                    </div>

                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {/* Capital */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                            <div>
                                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{schedule.sources.capital.title}</span>
                                <p className="text-xs text-neutral-500 mt-0.5">{schedule.sources.capital.title_en} — أسهم وحصص رأس المال المدفوع</p>
                            </div>
                            <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                {schedule.sources.capital.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        {/* Reserves & Retained Earnings */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                            <div>
                                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{schedule.sources.reserves_and_retained.title}</span>
                                <p className="text-xs text-neutral-500 mt-0.5">{schedule.sources.reserves_and_retained.title_en} — الاحتياطي النظامي والأرباح المدورة</p>
                            </div>
                            <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                {schedule.sources.reserves_and_retained.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        {/* Long-term Provisions */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                            <div>
                                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{schedule.sources.provisions.title}</span>
                                <p className="text-xs text-neutral-500 mt-0.5">{schedule.sources.provisions.title_en} — مخصص مكافأة نهاية الخدمة التراكمي لجميع الموظفين</p>
                            </div>
                            <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                {schedule.sources.provisions.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        {/* Long-term Liabilities */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                            <div>
                                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{schedule.sources.long_term_liabilities.title}</span>
                                <p className="text-xs text-neutral-500 mt-0.5">{schedule.sources.long_term_liabilities.title_en} — قروض وتمويل بنكي طويل الأجل</p>
                            </div>
                            <span className="font-mono font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                {schedule.sources.long_term_liabilities.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        {/* Adjusted Profit */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-50/30 dark:bg-blue-950/20">
                            <div>
                                <span className="font-bold text-xs text-blue-900 dark:text-blue-200">{schedule.sources.adjusted_profit.title}</span>
                                <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                                    {isRtl
                                        ? `الربح الدفتري: (${schedule.sources.adjusted_profit.accounting_profit?.toLocaleString()} ريال) + الإضافات: (${schedule.sources.adjusted_profit.addbacks?.toLocaleString()} ريال)`
                                        : `Accounting Net Income: (${schedule.sources.adjusted_profit.accounting_profit?.toLocaleString()} SAR) + Addbacks: (${schedule.sources.adjusted_profit.addbacks?.toLocaleString()} SAR)`}
                                </p>
                            </div>
                            <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-300">
                                {schedule.sources.adjusted_profit.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section 2: Detailed Deductions Table */}
                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/40">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-rose-600" />
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                {isRtl ? '2. الحسومات المسموح بها من الوعاء الزكوي (الأصول طويلة الأجل المعفاة)' : '2. Allowable Deductions from Zakat Base'}
                            </h3>
                        </div>
                        <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                            -{schedule.deductions.total_deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </span>
                    </div>

                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {/* Statutory Fixed Assets (Article 17) */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                            <div>
                                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{schedule.deductions.statutory_fixed_assets.title}</span>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    {isRtl
                                        ? 'القيمة الزكوية الدفترية للأصول الثابتة وفق طريقة الرصيد المتناقص (جدول استهلاك الأصول المادة 17)'
                                        : 'Calculated using ZATCA statutory declining pool method under Article 17 of Tax & Zakat Regulations'}
                                </p>
                            </div>
                            <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                                {schedule.deductions.statutory_fixed_assets.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        {/* CWIP */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                            <div>
                                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{schedule.deductions.cwip.title}</span>
                                <p className="text-xs text-neutral-500 mt-0.5">{schedule.deductions.cwip.title_en} — دفعات مشاريع وتجهيزات رأسمالية مستقبلية</p>
                            </div>
                            <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                                {schedule.deductions.cwip.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        {/* Investments */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                            <div>
                                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{schedule.deductions.investments.title}</span>
                                <p className="text-xs text-neutral-500 mt-0.5">{schedule.deductions.investments.title_en} — مساهمات في شركات داخل المملكة خاضعة للزكاة</p>
                            </div>
                            <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                                {schedule.deductions.investments.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        {/* Carried Losses */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                            <div>
                                <span className="font-bold text-xs text-neutral-900 dark:text-neutral-100">{schedule.deductions.carried_losses.title}</span>
                                <p className="text-xs text-neutral-500 mt-0.5">
                                    {isRtl
                                        ? `الخسائر المعتمدة حسمت بحد أقصى 25% من صافي الربح المعدل: (${schedule.deductions.carried_losses.allowable?.toLocaleString()} ريال)`
                                        : `Allowable carried-forward losses capped at 25% of current year adjusted profit: (${schedule.deductions.carried_losses.allowable?.toLocaleString()} SAR)`}
                                </p>
                            </div>
                            <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                                {schedule.deductions.carried_losses.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section 3: GL Journal Entry Preview */}
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'سند قيد إثبات مخصص الزكاة الشرعية المقترح لدفتر الأستاذ العام' : 'Proposed General Ledger Zakat Provision Accrual Entry'}
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs rtl:text-right">
                            <thead className="border-b border-neutral-200 bg-neutral-50/50 uppercase text-neutral-500">
                                <tr>
                                    <th className="px-3 py-2">{isRtl ? 'رقم الحساب واسمه' : 'Account Code & Name'}</th>
                                    <th className="px-3 py-2">{isRtl ? 'البيان والتفاصيل' : 'Line Description'}</th>
                                    <th className="px-3 py-2 text-right rtl:text-left">{isRtl ? 'مدين (DR)' : 'Debit (DR)'}</th>
                                    <th className="px-3 py-2 text-right rtl:text-left">{isRtl ? 'دائن (CR)' : 'Credit (CR)'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                                <tr>
                                    <td className="px-3 py-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                                        5150 - {isRtl ? 'مصروف الزكاة الشرعية' : 'Zakat Expense'}
                                    </td>
                                    <td className="px-3 py-2.5 font-sans text-neutral-600 dark:text-neutral-400">
                                        {isRtl ? `إثبات مخصص الزكاة الشرعية المستحقة عن السنة المالية ${selectedYear}` : `Annual Zakat Expense Accrual - Tax Year ${selectedYear}`}
                                    </td>
                                    <td className="px-3 py-2.5 text-right rtl:text-left font-bold text-neutral-900 dark:text-neutral-100">
                                        {schedule.calculation.recommended_adjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-3 py-2.5 text-right rtl:text-left text-neutral-400">-</td>
                                </tr>
                                <tr>
                                    <td className="px-3 py-2.5 font-bold text-neutral-900 dark:text-neutral-100">
                                        2060 - {isRtl ? 'مخصص الزكاة الشرعية المستحقة' : 'Zakat Provision Liability'}
                                    </td>
                                    <td className="px-3 py-2.5 font-sans text-neutral-600 dark:text-neutral-400">
                                        {isRtl ? `مخصص الزكاة الشرعية المستحقة للسداد لـ ZATCA عن عام ${selectedYear}` : `Annual Zakat Provision Liability for ZATCA - Tax Year ${selectedYear}`}
                                    </td>
                                    <td className="px-3 py-2.5 text-right rtl:text-left text-neutral-400">-</td>
                                    <td className="px-3 py-2.5 text-right rtl:text-left font-bold text-neutral-900 dark:text-neutral-100">
                                        {schedule.calculation.recommended_adjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Posting Modal */}
                <Dialog open={isPostingModalOpen} onOpenChange={setIsPostingModalOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold">
                                {isRtl ? 'ترحيل قيد مخصص الزكاة الشرعية لدفتر الأستاذ' : 'Post Zakat Provision to General Ledger'}
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                {isRtl
                                    ? `سيتم تسجيل قيد محاسبي معتمد في دفتر الأستاذ العام بتاريخ 31-12-${selectedYear} لتحميل حساب الأرباح والخسائر بمصروف الزكاة وإثبات الالتزام في مخصص الزكاة.`
                                    : `Records the annual Zakat liability entry in the General Ledger as of 31-12-${selectedYear}.`}
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handlePostProvision} className="space-y-4 py-2">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    {isRtl ? 'مبلغ القيد المقترح (ريال سعودي) *' : 'Provision Amount (SAR) *'}
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={postAmount}
                                    onChange={(e) => setPostAmount(e.target.value)}
                                    className="h-9 font-mono text-sm"
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    {isRtl
                                        ? `المبلغ الافتراضي يعادل القيد المقترح بعد خصم الرصيد السابق (${schedule.calculation.recommended_adjustment.toLocaleString()} ريال).`
                                        : `Default equals recommended adjustment (${schedule.calculation.recommended_adjustment.toLocaleString()} SAR).`}
                                </p>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsPostingModalOpen(false)}
                                >
                                    {t('common.cancel', 'إلغاء')}
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isPosting || parseFloat(postAmount) <= 0}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    {isPosting ? t('common.loading', 'جاري الترحيل...') : (isRtl ? 'تأكيد الترحيل للدفاتر' : 'Confirm & Post Entry')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
