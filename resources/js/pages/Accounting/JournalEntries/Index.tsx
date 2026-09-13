import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { BookOpen, Search, Eye, Printer, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface JournalEntryItem {
    id: string;
    entry_number: string;
    date: string;
    description: string;
    status: string;
    source_type?: string;
    total_debit: number;
    total_credit: number;
    is_balanced: boolean;
    posted_by?: string;
    posted_at?: string;
}

interface PaginatedEntries {
    data: JournalEntryItem[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface Props {
    entries: PaginatedEntries;
    filters: {
        search?: string;
        status?: string;
        start_date?: string;
        end_date?: string;
    };
}

export default function JournalEntriesIndex({ entries, filters }: Props) {
    const { isRtl } = useTranslation();

    const [form, setForm] = useState({
        search: filters.search || '',
        status: filters.status || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/accounting/journal-entries', form, { preserveState: true });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'posted':
                return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">{isRtl ? 'مرحل' : 'Posted'}</span>;
            case 'draft':
                return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">{isRtl ? 'مسودة' : 'Draft'}</span>;
            case 'reversed':
                return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">{isRtl ? 'معكوس' : 'Reversed'}</span>;
            default:
                return <span className="px-2 py-0.5 rounded text-xs font-bold bg-neutral-100 text-neutral-800">{status}</span>;
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <Head title={isRtl ? 'قيود اليومية العامة' : 'General Journal Entries'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <BookOpen className="h-7 w-7 text-indigo-600" />
                        <span>{isRtl ? 'قيود اليومية العامة' : 'General Journal Entries'}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'استعراض ومراجعة كافة القيود المحاسبية المرحلة وسندات القيد التفصيلية'
                            : 'Browse, inspect, and audit all general ledger journal entries and vouchers'}
                    </p>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div className="sm:col-span-2">
                        <Input
                            placeholder={isRtl ? 'بحث برقم القيد أو البيان...' : 'Search by entry number or description...'}
                            value={form.search}
                            onChange={(e) => setForm({ ...form, search: e.target.value })}
                            className="h-9"
                        />
                    </div>

                    <div>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <option value="">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
                            <option value="posted">{isRtl ? 'مرحل (Posted)' : 'Posted'}</option>
                            <option value="draft">{isRtl ? 'مسودة (Draft)' : 'Draft'}</option>
                            <option value="reversed">{isRtl ? 'معكوس (Reversed)' : 'Reversed'}</option>
                        </select>
                    </div>

                    <div>
                        <Input
                            type="date"
                            value={form.start_date}
                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                            className="h-9"
                            placeholder="From"
                        />
                    </div>

                    <div>
                        <Button type="submit" size="sm" className="w-full gap-1.5">
                            <Search className="h-4 w-4" />
                            <span>{isRtl ? 'بحث وتصفية' : 'Filter'}</span>
                        </Button>
                    </div>
                </form>
            </div>

            {/* Journal Entries Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                        <tr>
                            <th className="py-3 px-4">{isRtl ? 'رقم القيد' : 'Entry #'}</th>
                            <th className="py-3 px-4">{isRtl ? 'التاريخ' : 'Date'}</th>
                            <th className="py-3 px-4">{isRtl ? 'البيان المحاسبي' : 'Description'}</th>
                            <th className="py-3 px-4">{isRtl ? 'المصدر' : 'Source'}</th>
                            <th className="py-3 px-4 text-right">{isRtl ? 'إجمالي المدين' : 'Debit'}</th>
                            <th className="py-3 px-4 text-right">{isRtl ? 'إجمالي الدائن' : 'Credit'}</th>
                            <th className="py-3 px-4 text-center">{isRtl ? 'التوازن' : 'Balanced'}</th>
                            <th className="py-3 px-4 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                            <th className="py-3 px-4 text-center">{isRtl ? 'خيارات' : 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                        {entries.data.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-neutral-400 font-sans">
                                    <FileText className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
                                    <p>{isRtl ? 'لم يتم العثور على قيود يومية مطابقة' : 'No journal entries found.'}</p>
                                </td>
                            </tr>
                        ) : (
                            entries.data.map((entry) => (
                                <tr key={entry.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                    <td className="py-2.5 px-4 font-bold text-indigo-700 dark:text-indigo-400">
                                        <Link href={`/accounting/journal-entries/${entry.id}`} className="hover:underline">
                                            {entry.entry_number}
                                        </Link>
                                    </td>
                                    <td className="py-2.5 px-4 text-neutral-600 dark:text-neutral-400">{entry.date}</td>
                                    <td className="py-2.5 px-4 font-sans text-neutral-900 dark:text-neutral-100 max-w-xs truncate">
                                        {entry.description}
                                    </td>
                                    <td className="py-2.5 px-4 font-sans text-neutral-500 text-[11px]">
                                        {entry.source_type ? entry.source_type.replace('_', ' ') : 'Manual'}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(entry.total_debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(entry.total_credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2.5 px-4 text-center">
                                        {entry.is_balanced ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-rose-600 inline" />
                                        )}
                                    </td>
                                    <td className="py-2.5 px-4 text-center font-sans">
                                        {getStatusBadge(entry.status)}
                                    </td>
                                    <td className="py-2.5 px-4 text-center font-sans">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Button asChild variant="outline" size="sm" className="h-7 w-7 p-0" title={isRtl ? 'عرض القيد' : 'View'}>
                                                <Link href={`/accounting/journal-entries/${entry.id}`}>
                                                    <Eye className="h-3.5 w-3.5 text-neutral-600" />
                                                </Link>
                                            </Button>
                                            <Button asChild variant="outline" size="sm" className="h-7 w-7 p-0" title={isRtl ? 'طباعة سند القيد' : 'Print Voucher'}>
                                                <Link href={`/accounting/journal-entries/${entry.id}/print`}>
                                                    <Printer className="h-3.5 w-3.5 text-indigo-600" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {entries.last_page > 1 && (
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs font-sans">
                        <span className="text-neutral-500">
                            {isRtl ? `صفحة ${entries.current_page} من ${entries.last_page}` : `Page ${entries.current_page} of ${entries.last_page}`}
                        </span>
                        <div className="flex gap-2">
                            {entries.prev_page_url && (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={entries.prev_page_url}>{isRtl ? 'السابق' : 'Previous'}</Link>
                                </Button>
                            )}
                            {entries.next_page_url && (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={entries.next_page_url}>{isRtl ? 'التالي' : 'Next'}</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
