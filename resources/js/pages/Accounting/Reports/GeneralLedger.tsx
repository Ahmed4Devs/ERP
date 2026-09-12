import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { BookOpen, Search, Printer, Calendar, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface LedgerLine {
    date: string;
    entry_number: string;
    description: string;
    debit: string;
    credit: string;
    running_balance: string;
}

interface ReportData {
    account: (Account & { type: string; current_balance: string }) | null;
    lines: LedgerLine[];
    total_debit: string;
    total_credit: string;
}

interface Props {
    report: ReportData;
    accounts: Account[];
    filters: {
        account_id?: string;
        start_date?: string;
        end_date?: string;
    };
}

export default function GeneralLedger({ report, accounts, filters }: Props) {
    const { t, isRtl } = useTranslation();

    const [form, setForm] = useState({
        account_id: filters.account_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || new Date().toISOString().split('T')[0],
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/general-ledger', form, { preserveState: true });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
            <Head title={t('reports.generalLedgerTitle')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('reports.generalLedgerTitle')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('reports.generalLedgerSubtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button asChild variant="outline" size="sm" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
                        <a href={`/reports/general-ledger/export?account_id=${form.account_id || ''}&start_date=${form.start_date || ''}&end_date=${form.end_date || ''}`}>
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

            {/* Filter Bar */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:hidden">
                <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="gl_acc">{t('accounting.chartOfAccounts')}</Label>
                        <select
                            id="gl_acc"
                            value={form.account_id}
                            onChange={(e) => setForm({ ...form, account_id: e.target.value })}
                            className="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors dark:border-neutral-800"
                        >
                            <option value="">All Accounts</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name} {acc.name_ar ? `(${acc.name_ar})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="gl_start">{t('invoices.date')} From</Label>
                        <Input
                            id="gl_start"
                            type="date"
                            value={form.start_date}
                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="gl_end">{t('invoices.date')} To</Label>
                        <Input
                            id="gl_end"
                            type="date"
                            value={form.end_date}
                            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        />
                    </div>

                    <Button type="submit" variant="secondary" className="gap-1.5">
                        <Search className="h-4 w-4" />
                        <span>Filter Ledger</span>
                    </Button>
                </form>
            </div>

            {/* Active Account Info if filtered */}
            {report.account && (
                <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                    <BookOpen className="h-5 w-5 text-neutral-500" />
                    <div>
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">
                            {report.account.code}
                        </span>
                        <span className="mx-2 text-neutral-400">•</span>
                        <span className="font-semibold text-neutral-900 dark:text-white">
                            {report.account.name}
                        </span>
                        {report.account.name_ar && (
                            <span className="text-xs text-neutral-500 ms-2 font-normal">
                                ({report.account.name_ar})
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900 print:border-none print:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                            <tr>
                                <th className="px-5 py-3 font-semibold">{t('invoices.date')}</th>
                                <th className="px-5 py-3 font-semibold">{t('invoices.entryNumber')}</th>
                                <th className="px-5 py-3 font-semibold">{t('invoices.description')}</th>
                                <th className="px-5 py-3 font-semibold text-end">{t('invoices.debit')}</th>
                                <th className="px-5 py-3 font-semibold text-end">{t('invoices.credit')}</th>
                                <th className="px-5 py-3 font-semibold text-end">{t('accounting.balance')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {report.lines.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-neutral-500">
                                        No journal entries found matching criteria.
                                    </td>
                                </tr>
                            ) : (
                                report.lines.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-5 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {line.date}
                                        </td>
                                        <td className="px-5 py-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {line.entry_number}
                                        </td>
                                        <td className="px-5 py-3 text-neutral-700 dark:text-neutral-300">
                                            {line.description}
                                        </td>
                                        <td className="px-5 py-3 text-end font-mono text-neutral-900 dark:text-neutral-100">
                                            {Number(line.debit) > 0 ? Number(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-end font-mono text-neutral-900 dark:text-neutral-100">
                                            {Number(line.credit) > 0 ? Number(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                        </td>
                                        <td className="px-5 py-3 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                            {Number(line.running_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-neutral-50 font-bold border-t-2 border-neutral-300 dark:bg-neutral-950 dark:border-neutral-700">
                            <tr>
                                <td colSpan={3} className="px-5 py-3.5 uppercase tracking-wider text-xs text-neutral-900 dark:text-white">
                                    Period Totals
                                </td>
                                <td className="px-5 py-3.5 text-end font-mono text-neutral-900 dark:text-white">
                                    {Number(report.total_debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                                <td className="px-5 py-3.5 text-end font-mono text-neutral-900 dark:text-white">
                                    {Number(report.total_credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                                <td className="px-5 py-3.5"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
