import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Banknote, Printer, FileSpreadsheet, Calendar, Search, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface CashFlowReport {
    start_date: string;
    end_date: string;
    operating_activities: {
        net_income: number;
        depreciation: number;
        working_capital_changes: Array<{ name: string; name_ar: string; amount: number }>;
        total_operating: number;
    };
    investing_activities: {
        items: Array<{ name: string; name_ar: string; amount: number }>;
        total_investing: number;
    };
    financing_activities: {
        items: Array<{ name: string; name_ar: string; amount: number }>;
        total_financing: number;
    };
    net_change_in_cash: number;
    beginning_cash: number;
    ending_cash: number;
}

interface Props {
    report: CashFlowReport;
    filters: {
        start_date: string;
        end_date: string;
    };
}

export default function CashFlowStatement({ report, filters }: Props) {
    const { t, isRtl } = useTranslation();

    const [form, setForm] = useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/cash-flow', form, { preserveState: true });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        window.location.href = `/reports/cash-flow/export?start_date=${form.start_date}&end_date=${form.end_date}`;
    };

    const formatCurrency = (val: number) => {
        const sign = val < 0 ? '-' : '';
        return `${sign}${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`;
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting', 'المحاسبة المالية'), href: '/accounting' },
            { title: t('nav.cashFlow', 'قائمة التدفقات النقدية (IAS 7)'), href: '/reports/cash-flow' }
        ]}>
            <Head title={t('cashFlow.title', 'قائمة التدفقات النقدية - IAS 7')} />

            <div className="p-6 space-y-6 max-w-5xl mx-auto print:p-0 print:max-w-none">
                {/* Header Actions - hidden on print */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-emerald-950 p-6 rounded-2xl text-white shadow-xl print:hidden">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/20 backdrop-blur-sm rounded-xl border border-emerald-400/30">
                                <Banknote className="w-6 h-6 text-emerald-300" />
                            </div>
                            <h1 className="text-2xl font-bold">
                                {t('cashFlow.title', 'قائمة التدفقات النقدية (IAS 7 Statement of Cash Flows)')}
                            </h1>
                        </div>
                        <p className="mt-2 text-emerald-200/80 text-sm max-w-2xl">
                            {t('cashFlow.subtitle', 'التدفقات النقدية التشغيلية والاستثمارية والتمويلية ومطابقة رصيد النقدية وما في حكمه')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleExport} className="text-slate-900 bg-white hover:bg-slate-100 gap-1.5 shadow-sm">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            {t('common.exportCsv', 'تصدير CSV')}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint} className="text-slate-900 bg-white hover:bg-slate-100 gap-1.5 shadow-sm">
                            <Printer className="w-4 h-4 text-slate-700" />
                            {t('common.print', 'طباعة')}
                        </Button>
                    </div>
                </div>

                {/* Filter Form - hidden on print */}
                <form onSubmit={handleFilter} className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-wrap items-end gap-3 print:hidden">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('common.from', 'من تاريخ')}</label>
                        <Input
                            type="date"
                            value={form.start_date}
                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                            className="h-9 text-xs"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('common.to', 'إلى تاريخ')}</label>
                        <Input
                            type="date"
                            value={form.end_date}
                            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                            className="h-9 text-xs"
                        />
                    </div>
                    <Button type="submit" size="sm" className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white">
                        <Search className="w-3.5 h-3.5" />
                        {t('common.filter', 'تحديث التقرير')}
                    </Button>
                </form>

                {/* Statement Report Paper */}
                <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
                    <div className="text-center border-b border-border pb-4">
                        <h2 className="text-xl font-bold text-foreground">{t('cashFlow.reportTitle', 'قائمة التدفقات النقدية')}</h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('cashFlow.period', 'عن الفترة من')} <span className="font-mono font-bold text-foreground">{report.start_date}</span> {t('common.to', 'إلى')} <span className="font-mono font-bold text-foreground">{report.end_date}</span>
                        </p>
                    </div>

                    {/* Section 1: Operating Activities */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-muted/50 p-2.5 rounded-lg border-s-4 border-emerald-500">
                            <h3 className="font-bold text-sm text-foreground">
                                {t('cashFlow.operatingTitle', 'أولاً: التدفقات النقدية من الأنشطة التشغيلية (Operating Activities)')}
                            </h3>
                            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(report.operating_activities.total_operating)}
                            </span>
                        </div>

                        <div className="ps-4 pe-2 space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-border/50">
                                <span>{t('cashFlow.netIncome', 'صافي الدخل / الربح للفترة (Net Income)')}</span>
                                <span className="font-mono font-medium">{formatCurrency(report.operating_activities.net_income)}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-border/50">
                                <span className="text-muted-foreground ps-2">{t('cashFlow.depreciation', 'يضاف: مصروف إهلاك الأصول الثابتة والتسويات غير النقدية')}</span>
                                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                    +{formatCurrency(report.operating_activities.depreciation)}
                                </span>
                            </div>

                            <div className="pt-2 font-semibold text-muted-foreground">
                                {t('cashFlow.wcChanges', 'التغيرات في بنود رأس المال العامل:')}
                            </div>
                            {report.operating_activities.working_capital_changes.map((item, idx) => (
                                <div key={idx} className="flex justify-between py-1 ps-4 border-b border-border/30">
                                    <span>{isRtl ? item.name_ar : item.name}</span>
                                    <span className={`font-mono font-semibold ${item.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Investing Activities */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-muted/50 p-2.5 rounded-lg border-s-4 border-blue-500">
                            <h3 className="font-bold text-sm text-foreground">
                                {t('cashFlow.investingTitle', 'ثانياً: التدفقات النقدية من الأنشطة الاستثمارية (Investing Activities)')}
                            </h3>
                            <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                                {formatCurrency(report.investing_activities.total_investing)}
                            </span>
                        </div>

                        <div className="ps-4 pe-2 space-y-2 text-xs">
                            {report.investing_activities.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between py-1 border-b border-border/50">
                                    <span>{isRtl ? item.name_ar : item.name}</span>
                                    <span className={`font-mono font-semibold ${item.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 3: Financing Activities */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-muted/50 p-2.5 rounded-lg border-s-4 border-purple-500">
                            <h3 className="font-bold text-sm text-foreground">
                                {t('cashFlow.financingTitle', 'ثالثاً: التدفقات النقدية من الأنشطة التمويلية (Financing Activities)')}
                            </h3>
                            <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                                {formatCurrency(report.financing_activities.total_financing)}
                            </span>
                        </div>

                        <div className="ps-4 pe-2 space-y-2 text-xs">
                            {report.financing_activities.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between py-1 border-b border-border/50">
                                    <span>{isRtl ? item.name_ar : item.name}</span>
                                    <span className={`font-mono font-semibold ${item.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-purple-600 dark:text-purple-400'}`}>
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Cash Reconciliation */}
                    <div className="pt-4 border-t-2 border-border space-y-2 bg-muted/30 p-4 rounded-xl">
                        <div className="flex justify-between font-bold text-sm py-1">
                            <span>{t('cashFlow.netChange', 'صافي التغير في النقدية وما في حكمها')}</span>
                            <span className={`font-mono ${report.net_change_in_cash < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {formatCurrency(report.net_change_in_cash)}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground py-1">
                            <span>{t('cashFlow.begCash', 'رصيد النقدية والبنوك في بداية الفترة')}</span>
                            <span className="font-mono font-medium">{formatCurrency(report.beginning_cash)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2 border-t border-border text-foreground">
                            <span>{t('cashFlow.endCash', 'رصيد النقدية والبنوك في نهاية الفترة')}</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                {formatCurrency(report.ending_cash)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
