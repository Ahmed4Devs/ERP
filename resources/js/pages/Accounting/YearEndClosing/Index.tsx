import { Head, Link } from '@inertiajs/react';
import { Plus, Eye, CalendarCheck, Lock, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface FiscalYearClosing {
    id: string;
    fiscal_year: number;
    closing_date: string;
    total_revenue: string;
    total_expenses: string;
    net_profit_loss: string;
    status: 'closed' | 'reopened';
    journalEntry?: { id: string; entry_number: string };
    closedBy?: { name: string };
}

interface Props {
    closings: FiscalYearClosing[];
}

export default function YearEndClosingIndex({ closings }: Props) {
    const { t, isRtl } = useTranslation();

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting', 'المحاسبة المالية'), href: '/accounting' },
            { title: t('nav.yearEndClosing', 'إقفال السنة المالية'), href: '/accounting/year-end-closing' }
        ]}>
            <Head title={t('yearEndClosing.title', 'إقفال السنة المالية وترحيل الأرباح والخسائر')} />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-amber-950 p-6 rounded-2xl text-white shadow-xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500/20 backdrop-blur-sm rounded-xl border border-amber-400/30">
                                <Lock className="w-6 h-6 text-amber-300" />
                            </div>
                            <h1 className="text-2xl font-bold">
                                {t('yearEndClosing.title', 'إقفال السنة المالية (Fiscal Year-End Closing)')}
                            </h1>
                        </div>
                        <p className="mt-2 text-amber-200/80 text-sm max-w-2xl">
                            {t('yearEndClosing.subtitle', 'تصفير حسابات الإيرادات والمصروفات آلياً وترحيل صافي النتيجة إلى الأرباح المبقاة (3200) وقفل الفترات المالية')}
                        </p>
                    </div>

                    <Link href="/accounting/year-end-closing/create">
                        <Button className="bg-amber-600 hover:bg-amber-500 text-white gap-2 shadow-lg shadow-amber-600/30">
                            <Plus className="w-4 h-4" />
                            {t('yearEndClosing.executeClosing', 'إقفال سنة مالية جديدة')}
                        </Button>
                    </Link>
                </div>

                {/* Closings Table */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                                <tr>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('yearEndClosing.year', 'السنة المالية')}</th>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('yearEndClosing.closingDate', 'تاريخ الإقفال')}</th>
                                    <th className="py-3.5 px-4 text-end font-semibold">{t('accounting.revenue', 'إجمالي الإيرادات')}</th>
                                    <th className="py-3.5 px-4 text-end font-semibold">{t('accounting.expenses', 'إجمالي المصروفات')}</th>
                                    <th className="py-3.5 px-4 text-end font-semibold">{t('accounting.netProfitLoss', 'صافي النتيجة (أرباح مدورة)')}</th>
                                    <th className="py-3.5 px-4 text-center font-semibold">{t('common.status', 'الحالة')}</th>
                                    <th className="py-3.5 px-4 text-center font-semibold">{t('common.actions', 'الإجراءات')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {closings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                                            <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-base font-medium">{t('yearEndClosing.noClosings', 'لا توجد سنوات مالية مقفلة حالياً')}</p>
                                            <p className="text-xs mt-1">{t('yearEndClosing.noClosingsHint', 'يمكنك إجراء فحص ومعاينة وإقفال أي سنة مالية منتهية')}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    closings.map((c) => {
                                        const net = Number(c.net_profit_loss);
                                        return (
                                            <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-3.5 px-4 font-mono font-bold text-base text-foreground">
                                                    {c.fiscal_year}
                                                </td>
                                                <td className="py-3.5 px-4 text-muted-foreground">{c.closing_date}</td>
                                                <td className="py-3.5 px-4 text-end font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                                                    {Number(c.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                                </td>
                                                <td className="py-3.5 px-4 text-end font-mono text-rose-600 dark:text-rose-400 font-medium">
                                                    {Number(c.total_expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                                </td>
                                                <td className="py-3.5 px-4 text-end font-mono font-bold text-foreground">
                                                    <span className={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                        {net >= 0 ? '+' : ''}{net.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {c.status === 'closed' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {t('yearEndClosing.status.closed', 'مقفلة')}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                                                            <RotateCcw className="w-3 h-3" />
                                                            {t('yearEndClosing.status.reopened', 'مفتوحة للتدقيق')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <Link href={`/accounting/year-end-closing/${c.id}`}>
                                                        <Button variant="ghost" size="sm" className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50">
                                                            <Eye className="w-4 h-4" />
                                                            {t('common.view', 'عرض')}
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
