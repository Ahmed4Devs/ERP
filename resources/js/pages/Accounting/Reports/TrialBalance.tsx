import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { BarChart3, CheckCircle2, AlertCircle, Printer, Calendar, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface AccountRow {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    type: string;
    debit_total: string;
    credit_total: string;
    net_debit: string;
    net_credit: string;
}

interface ReportData {
    accounts: AccountRow[];
    total_debit: string;
    total_credit: string;
    is_balanced: boolean;
}

interface Props {
    report: ReportData;
    asOfDate: string;
}

export default function TrialBalance({ report, asOfDate }: Props) {
    const { t, isRtl } = useTranslation();
    const [date, setDate] = useState(asOfDate);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/trial-balance', { as_of_date: date }, { preserveState: true });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
            <Head title={t('reports.trialBalanceTitle')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('reports.trialBalanceTitle')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('reports.trialBalanceSubtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <form onSubmit={handleFilter} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{t('reports.asOfDate')}:</span>
                        </div>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="h-9 w-36 text-xs"
                        />
                        <Button type="submit" variant="secondary" size="sm">
                            {t('common.view')}
                        </Button>
                    </form>

                    <Button asChild variant="outline" size="sm" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
                        <a href={`/reports/trial-balance/export?as_of_date=${date}`}>
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>{isRtl ? 'تصدير Excel' : 'Export Excel'}</span>
                        </a>
                    </Button>

                    <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-1.5">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة' : 'Print'}</span>
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('reports.debitTotal')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                            {Number(report.total_debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                        <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('reports.creditTotal')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                            {Number(report.total_credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className={`rounded-lg p-3 ${report.is_balanced ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'}`}>
                        {report.is_balanced ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">Equilibrium Status</p>
                        <p className={`text-base font-bold ${report.is_balanced ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {report.is_balanced ? t('reports.balanced') : t('reports.notBalanced')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900 print:border-none print:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                            <tr>
                                <th className="px-5 py-3 font-semibold">{t('accounting.code')}</th>
                                <th className="px-5 py-3 font-semibold">{t('accounting.accountName')}</th>
                                <th className="px-5 py-3 font-semibold">{t('accounting.type')}</th>
                                <th className="px-5 py-3 font-semibold text-end">{t('reports.netDebit')}</th>
                                <th className="px-5 py-3 font-semibold text-end">{t('reports.netCredit')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {report.accounts.map((acc) => (
                                <tr key={acc.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="px-5 py-3.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {acc.code}
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-neutral-100">
                                        <div>{acc.name}</div>
                                        {acc.name_ar && <div className="text-xs text-neutral-500 mt-0.5">{acc.name_ar}</div>}
                                    </td>
                                    <td className="px-5 py-3.5 text-xs uppercase text-neutral-500">
                                        {t(`accounting.${acc.type}`, acc.type)}
                                    </td>
                                    <td className="px-5 py-3.5 text-end font-mono text-neutral-900 dark:text-neutral-100">
                                        {Number(acc.net_debit) > 0
                                            ? Number(acc.net_debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            : '—'}
                                    </td>
                                    <td className="px-5 py-3.5 text-end font-mono text-neutral-900 dark:text-neutral-100">
                                        {Number(acc.net_credit) > 0
                                            ? Number(acc.net_credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-neutral-50 font-bold border-t-2 border-neutral-300 dark:bg-neutral-950 dark:border-neutral-700">
                            <tr>
                                <td colSpan={3} className="px-5 py-4 text-neutral-900 dark:text-white uppercase tracking-wider text-xs">
                                    {t('reports.balanced')} Grand Totals
                                </td>
                                <td className="px-5 py-4 text-end font-mono text-neutral-900 dark:text-white">
                                    {Number(report.total_debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                                <td className="px-5 py-4 text-end font-mono text-neutral-900 dark:text-white">
                                    {Number(report.total_credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
