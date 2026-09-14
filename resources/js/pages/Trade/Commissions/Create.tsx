import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    CheckCircle2,
    DollarSign,
    HandCoins,
    RefreshCw,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface PreviewLine {
    sales_representative_id: string;
    representative_name: string;
    representative_code: string;
    plan_name: string;
    sales_target: number;
    achieved_sales: number;
    achievement_rate: number;
    commission_amount: number;
    bonus_amount: number;
    deductions_amount: number;
    net_payable: number;
}

interface PreviewData {
    period_start: string;
    period_end: string;
    basis: 'invoiced_sales' | 'collected_cash';
    total_eligible_sales: number;
    total_commission_amount: number;
    total_bonus_amount: number;
    total_deductions: number;
    total_net_payable: number;
    lines: PreviewLine[];
}

interface Props {
    preview: PreviewData;
    initialFilters: {
        period_start: string;
        period_end: string;
        basis: string;
    };
}

export default function CreateCommissionRun({ preview: initialPreview, initialFilters }: Props) {
    const { t, isRtl } = useTranslation();
    const [preview, setPreview] = useState<PreviewData>(initialPreview);
    const [loadingPreview, setLoadingPreview] = useState(false);

    const form = useForm({
        period_start: initialFilters.period_start,
        period_end: initialFilters.period_end,
        basis: initialFilters.basis,
        notes: '',
    });

    const handleRefreshPreview = async () => {
        setLoadingPreview(true);
        try {
            const response = await fetch('/trade/commissions/preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({
                    period_start: form.data.period_start,
                    period_end: form.data.period_end,
                    basis: form.data.basis,
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setPreview(data);
            }
        } catch (e) {
            console.error('Failed to preview commissions', e);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/trade/commissions');
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('trade.commissions.newRunTitle', 'احتساب مسير عمولات مبيعات جديد')} />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Link href="/trade/commissions" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                    {t('trade.commissions.title', 'عمولات المبيعات')}
                </Link>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">
                    {t('trade.commissions.newRun', 'احتساب مسير جديد')}
                </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                        <HandCoins className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        {t('trade.commissions.newRunTitle', 'احتساب مسير عمولات مبيعات دوري')}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {t('trade.commissions.newRunDesc', 'تحديد الفترة الزمنية والأساس لاحتساب إنجاز المناديب والعمولات التلقائية')}
                    </p>
                </div>
            </div>

            {/* Filter / Configuration Card */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    {t('trade.commissions.periodConfig', 'إعدادات الفترة وأساس الاحتساب')}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            {t('trade.commissions.periodStart', 'تاريخ بداية الفترة')}
                        </label>
                        <Input
                            type="date"
                            value={form.data.period_start}
                            onChange={(e) => form.setData('period_start', e.target.value)}
                            className="mt-1"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            {t('trade.commissions.periodEnd', 'تاريخ نهاية الفترة')}
                        </label>
                        <Input
                            type="date"
                            value={form.data.period_end}
                            onChange={(e) => form.setData('period_end', e.target.value)}
                            className="mt-1"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            {t('trade.commissions.basisSelect', 'أساس الاحتساب')}
                        </label>
                        <select
                            value={form.data.basis}
                            onChange={(e) => form.setData('basis', e.target.value)}
                            className="mt-1 w-full text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5"
                        >
                            <option value="invoiced_sales">فواتير المبيعات المعتمدة (Invoiced Sales)</option>
                            <option value="collected_cash">التحصيلات النقدية والبنكية (Collected Cash)</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleRefreshPreview}
                        disabled={loadingPreview}
                        className="gap-2 text-indigo-600 dark:text-indigo-400 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900/50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loadingPreview ? 'animate-spin' : ''}`} />
                        {t('trade.commissions.recalc', 'إعادة احتساب المعاينة')}
                    </Button>
                </div>
            </div>

            {/* Calculated Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-xs font-medium text-indigo-800 dark:text-indigo-300">
                        {t('trade.commissions.totalSales', 'إجمالي المبيعات المؤهلة')}
                    </span>
                    <div className="mt-2 text-2xl font-bold font-mono text-indigo-950 dark:text-indigo-100">
                        {Number(preview.total_eligible_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-xs font-sans font-normal ms-1 text-indigo-600">SAR</span>
                    </div>
                </div>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                        {t('trade.commissions.grossComm', 'إجمالي العمولات الأساسية')}
                    </span>
                    <div className="mt-2 text-2xl font-bold font-mono text-emerald-950 dark:text-emerald-100">
                        {Number(preview.total_commission_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-xs font-sans font-normal ms-1 text-emerald-600">SAR</span>
                    </div>
                </div>

                <div className="bg-purple-50/50 dark:bg-purple-950/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                    <span className="text-xs font-medium text-purple-800 dark:text-purple-300">
                        {t('trade.commissions.totalBonus', 'بونص تحقيق المستهدف')}
                    </span>
                    <div className="mt-2 text-2xl font-bold font-mono text-purple-950 dark:text-purple-100">
                        {Number(preview.total_bonus_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-xs font-sans font-normal ms-1 text-purple-600">SAR</span>
                    </div>
                </div>

                <div className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 p-5 rounded-2xl shadow-sm">
                    <span className="text-xs font-medium opacity-80">
                        {t('trade.commissions.netPayable', 'صافي العمولات المستحقة')}
                    </span>
                    <div className="mt-2 text-2xl font-bold font-mono">
                        {Number(preview.total_net_payable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        <span className="text-xs font-sans font-normal ms-1 opacity-80">SAR</span>
                    </div>
                </div>
            </div>

            {/* Preview Lines Breakdown */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm space-y-4">
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {t('trade.commissions.repBreakdown', 'جدول استحقاقات مندوبي المبيعات')}
                    </h3>
                    <span className="text-xs text-zinc-500 font-mono">
                        {preview.lines.length} {t('trade.commissions.repsCovered', 'مندوب مشمول')}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 text-xs uppercase font-medium border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-5 py-3 text-start">{t('trade.commissions.rep', 'المندوب')}</th>
                                <th className="px-5 py-3 text-start">{t('trade.commissions.plan', 'الخطة')}</th>
                                <th className="px-5 py-3 text-end">{t('trade.commissions.target', 'المستهدف')}</th>
                                <th className="px-5 py-3 text-end">{t('trade.commissions.achieved', 'المبيعات المحققة')}</th>
                                <th className="px-5 py-3 text-center">{t('trade.commissions.rate', 'نسبة الإنجاز')}</th>
                                <th className="px-5 py-3 text-end">{t('trade.commissions.comm', 'العمولة')}</th>
                                <th className="px-5 py-3 text-end">{t('trade.commissions.bonus', 'البونص')}</th>
                                <th className="px-5 py-3 text-end">{t('trade.commissions.net', 'الصافي المستحق')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
                            {preview.lines.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-zinc-500 font-sans">
                                        {t('trade.commissions.noRepsFound', 'لا يوجد مندوبو مبيعات نشطون في هذه المنشأة.')}
                                    </td>
                                </tr>
                            ) : (
                                preview.lines.map((line) => (
                                    <tr key={line.sales_representative_id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                                        <td className="px-5 py-3.5 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                                            {line.representative_name}
                                            <span className="block text-xs font-mono text-zinc-400">{line.representative_code}</span>
                                        </td>
                                        <td className="px-5 py-3.5 font-sans text-zinc-600 dark:text-zinc-400">
                                            {line.plan_name}
                                        </td>
                                        <td className="px-5 py-3.5 text-end text-zinc-700 dark:text-zinc-300">
                                            {Number(line.sales_target).toLocaleString()} SAR
                                        </td>
                                        <td className="px-5 py-3.5 text-end font-semibold text-zinc-900 dark:text-zinc-100">
                                            {Number(line.achieved_sales).toLocaleString()} SAR
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
                                                line.achievement_rate >= 100
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                            }`}>
                                                {line.achievement_rate}%
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-end text-zinc-900 dark:text-zinc-100">
                                            {Number(line.commission_amount).toLocaleString()} SAR
                                        </td>
                                        <td className="px-5 py-3.5 text-end text-purple-600 dark:text-purple-400 font-semibold">
                                            {Number(line.bonus_amount).toLocaleString()} SAR
                                        </td>
                                        <td className="px-5 py-3.5 text-end text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                            {Number(line.net_payable).toLocaleString()} SAR
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes and Submit Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {t('trade.commissions.notes', 'ملاحظات وتوجيهات المسير')}
                    </label>
                    <textarea
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                        placeholder="أدخل أي ملاحظات توضيحية حول هذا المسير المالي..."
                        className="mt-1 w-full text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 h-20"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <Link href="/trade/commissions">
                        <Button type="button" variant="outline">
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                    </Link>

                    <Button
                        type="submit"
                        disabled={form.processing || preview.lines.length === 0}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        {t('trade.commissions.saveRun', 'حفظ واعتماد مسودة المسير')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
