import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Lock, CheckCircle2, RotateCcw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface Props {
    closing: {
        id: string;
        fiscal_year: number;
        closing_date: string;
        status: 'closed' | 'reopened';
        total_revenue: string;
        total_expenses: string;
        net_profit_loss: string;
        notes?: string;
        closedBy?: { name: string };
        retainedEarningsAccount?: { code: string; name: string };
        journalEntry?: {
            id: string;
            entry_number: string;
            lines: Array<{
                id: string;
                account: { code: string; name: string };
                debit: string;
                credit: string;
                description?: string;
            }>;
        };
    };
}

export default function YearEndClosingShow({ closing }: Props) {
    const { t, isRtl } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    const reopenForm = useForm({});

    const handleReopen = () => {
        if (confirm(t('yearEndClosing.confirmReopen', `هل أنت متأكد من إعادة فتح السنة المالية ${closing.fiscal_year} لأغراض المراجعة والتدقيق؟`))) {
            reopenForm.post(`/accounting/year-end-closing/${closing.id}/reopen`);
        }
    };

    const net = Number(closing.net_profit_loss);

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting', 'المحاسبة المالية'), href: '/accounting' },
            { title: t('nav.yearEndClosing', 'إقفال السنة المالية'), href: '/accounting/year-end-closing' },
            { title: `السنة ${closing.fiscal_year}`, href: `/accounting/year-end-closing/${closing.id}` }
        ]}>
            <Head title={`إقفال السنة المالية ${closing.fiscal_year}`} />

            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <Link href="/accounting/year-end-closing">
                            <Button variant="ghost" size="icon">
                                <BackIcon className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold font-mono text-foreground">
                                    {t('yearEndClosing.yearHeading', 'إقفال السنة المالية')} {closing.fiscal_year}
                                </h1>
                                {closing.status === 'closed' ? (
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
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('yearEndClosing.closedAt', 'تاريخ الإقفال')}: {closing.closing_date} • {t('common.by', 'بواسطة')}: {closing.closedBy?.name || '-'}
                            </p>
                        </div>
                    </div>

                    {closing.status === 'closed' && (
                        <Button
                            variant="outline"
                            onClick={handleReopen}
                            disabled={reopenForm.processing}
                            className="gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {reopenForm.processing ? t('common.processing', 'جاري...') : t('yearEndClosing.reopenBtn', 'إعادة الفتح للتدقيق')}
                        </Button>
                    )}
                </div>

                {/* Summary KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('accounting.revenue', 'إجمالي الإيرادات المقفلة')}</p>
                        <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                            {Number(closing.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('accounting.expenses', 'إجمالي المصروفات المقفلة')}</p>
                        <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                            {Number(closing.total_expenses).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('accounting.netProfitLoss', 'صافي النتيجة المرحل للأرباح المبقاة')}</p>
                        <p className={`text-2xl font-bold font-mono mt-1 ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {net >= 0 ? '+' : ''}{net.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                {/* Retained earnings and journal entry details */}
                {closing.journalEntry && (
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                        <h2 className="font-semibold text-foreground flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-amber-500" />
                            {t('yearEndClosing.glClosingEntry', 'قيد إقفال السنة المالية')} ({closing.journalEntry.entry_number})
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-start">
                                <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                                    <tr>
                                        <th className="py-2.5 px-3 text-start">{t('account.code', 'رقم الحساب')}</th>
                                        <th className="py-2.5 px-3 text-start">{t('account.name', 'اسم الحساب')}</th>
                                        <th className="py-2.5 px-3 text-start">{t('common.description', 'البيان')}</th>
                                        <th className="py-2.5 px-3 text-end">{t('accounting.debit', 'مدين')}</th>
                                        <th className="py-2.5 px-3 text-end">{t('accounting.credit', 'دائن')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border font-mono">
                                    {closing.journalEntry.lines.map((l) => (
                                        <tr key={l.id} className="hover:bg-muted/30">
                                            <td className="py-2.5 px-3 font-semibold">{l.account?.code}</td>
                                            <td className="py-2.5 px-3 font-sans">{l.account?.name}</td>
                                            <td className="py-2.5 px-3 font-sans text-muted-foreground">{l.description || '-'}</td>
                                            <td className="py-2.5 px-3 text-end text-emerald-600 dark:text-emerald-400 font-bold">
                                                {Number(l.debit) > 0 ? Number(l.debit).toFixed(2) : '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-end text-blue-600 dark:text-blue-400 font-bold">
                                                {Number(l.credit) > 0 ? Number(l.credit).toFixed(2) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
