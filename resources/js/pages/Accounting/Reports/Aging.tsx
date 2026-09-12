import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Clock, Calendar, Printer, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface AgingRow {
    party_id: string;
    party_name: string;
    party_name_ar?: string | null;
    current: string;
    days_31_60: string;
    days_61_90: string;
    days_over_90: string;
    total: string;
}

interface Props {
    report: AgingRow[];
    asOfDate: string;
}

export default function Aging({ report, asOfDate }: Props) {
    const { t, isRtl } = useTranslation();
    const [date, setDate] = useState(asOfDate);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/ar-aging', { as_of_date: date }, { preserveState: true });
    };

    // Calculate totals for each bracket
    const totalCurrent = report.reduce((acc, r) => acc + parseFloat(r.current || '0'), 0);
    const total31to60 = report.reduce((acc, r) => acc + parseFloat(r.days_31_60 || '0'), 0);
    const total61to90 = report.reduce((acc, r) => acc + parseFloat(r.days_61_90 || '0'), 0);
    const totalOver90 = report.reduce((acc, r) => acc + parseFloat(r.days_over_90 || '0'), 0);
    const grandTotal = report.reduce((acc, r) => acc + parseFloat(r.total || '0'), 0);

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
            <Head title={t('reports.arAgingTitle')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('reports.arAgingTitle')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('reports.arAgingSubtitle')}
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
                        <a href={`/reports/ar-aging/export?as_of_date=${date}`}>
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

            {/* Summary Bracket Cards */}
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 print:grid-cols-4">
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs text-neutral-500 font-medium">{t('reports.current')}</p>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white font-mono mt-1">
                        {totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs text-neutral-500 font-medium">{t('reports.days31to60')}</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-1">
                        {total31to60.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs text-neutral-500 font-medium">{t('reports.days61to90')}</p>
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400 font-mono mt-1">
                        {total61to90.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs text-neutral-500 font-medium">{t('reports.daysOver90')}</p>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
                        {totalOver90.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900 print:border-none print:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                            <tr>
                                <th className="px-5 py-3 font-semibold">{t('invoices.customer')}</th>
                                <th className="px-5 py-3 font-semibold text-end">{t('reports.current')}</th>
                                <th className="px-5 py-3 font-semibold text-end">{t('reports.days31to60')}</th>
                                <th className="px-5 py-3 font-semibold text-end">{t('reports.days61to90')}</th>
                                <th className="px-5 py-3 font-semibold text-end">{t('reports.daysOver90')}</th>
                                <th className="px-5 py-3 font-semibold text-end">{t('reports.totalDue')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {report.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-neutral-500">
                                        No outstanding receivable balances found.
                                    </td>
                                </tr>
                            ) : (
                                report.map((row) => (
                                    <tr key={row.party_id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-neutral-100">
                                            <div>{row.party_name}</div>
                                            {row.party_name_ar && <div className="text-xs text-neutral-500 mt-0.5">{row.party_name_ar}</div>}
                                        </td>
                                        <td className="px-5 py-3.5 text-end font-mono text-neutral-900 dark:text-neutral-100">
                                            {Number(row.current) > 0 ? Number(row.current).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-end font-mono text-amber-600 dark:text-amber-400">
                                            {Number(row.days_31_60) > 0 ? Number(row.days_31_60).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-end font-mono text-orange-600 dark:text-orange-400">
                                            {Number(row.days_61_90) > 0 ? Number(row.days_61_90).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-end font-mono text-rose-600 dark:text-rose-400 font-semibold">
                                            {Number(row.days_over_90) > 0 ? Number(row.days_over_90).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                        </td>
                                        <td className="px-5 py-3.5 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(row.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-neutral-50 font-bold border-t-2 border-neutral-300 dark:bg-neutral-950 dark:border-neutral-700">
                            <tr>
                                <td className="px-5 py-3.5 uppercase tracking-wider text-xs text-neutral-900 dark:text-white">
                                    Total Receivables
                                </td>
                                <td className="px-5 py-3.5 text-end font-mono text-neutral-900 dark:text-white">
                                    {totalCurrent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                                <td className="px-5 py-3.5 text-end font-mono text-amber-600 dark:text-amber-400">
                                    {total31to60.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                                <td className="px-5 py-3.5 text-end font-mono text-orange-600 dark:text-orange-400">
                                    {total61to90.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                                <td className="px-5 py-3.5 text-end font-mono text-rose-600 dark:text-rose-400">
                                    {totalOver90.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                                <td className="px-5 py-3.5 text-end font-mono text-neutral-900 dark:text-white">
                                    {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
