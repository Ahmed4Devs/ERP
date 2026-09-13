import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, RotateCcw, CheckCircle2, Clock, Eye, Printer, ArrowLeft, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
}

interface Branch {
    id: string;
    name: string;
}

interface CreditNote {
    id: string;
    credit_note_number: string;
    date: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    status: 'draft' | 'posted';
    customer?: Party;
    branch?: Branch;
    reason?: string;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    creditNotes: PaginatedData<CreditNote>;
    metrics: {
        total_notes: number;
        posted_count: number;
        total_refunded: string | number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function CreditNotesIndex({ creditNotes, metrics, filters }: Props) {
    const { isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/sales/credit-notes', {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <Head title={isRtl ? 'الإشعارات الدائنة ومردودات المبيعات' : 'Sales Credit Notes'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <RotateCcw className="h-7 w-7 text-rose-600" />
                        {isRtl ? 'الإشعارات الدائنة ومردودات المبيعات' : 'Sales Credit Notes'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدارة مردودات المبيعات وعكس الإيراد وضريبة المخرجات واسترداد المخزون محاسبياً'
                            : 'Manage customer returns, revenue reversal, VAT output adjustments & stock restock'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild className="bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-sm">
                        <Link href="/sales/credit-notes/create">
                            <Plus className="h-4 w-4" />
                            {isRtl ? 'إشعار دائن جديد' : 'New Credit Note'}
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                            {isRtl ? 'إجمالي الإشعارات' : 'Total Notes'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600">
                            <RotateCcw className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {metrics.total_notes}
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {isRtl ? 'الإشعارات المرحلة' : 'Posted Notes'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {metrics.posted_count}
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            {isRtl ? 'إجمالي المردودات المرحلة' : 'Total Credited'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-rose-600 dark:text-rose-400">
                        {parseFloat(String(metrics.total_refunded || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-neutral-500">{isRtl ? 'ر.س' : 'SAR'}</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearch} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className={`absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'} h-4 w-4 text-neutral-400`} />
                    <Input
                        type="text"
                        placeholder={isRtl ? 'بحث برقم الإشعار أو اسم العميل...' : 'Search note number or customer...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`${isRtl ? 'pr-9' : 'pl-9'} text-sm`}
                    />
                </div>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                    <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                    <option value="draft">{isRtl ? 'مسودة' : 'Draft'}</option>
                    <option value="posted">{isRtl ? 'مرحل' : 'Posted'}</option>
                </select>
                <Button type="submit" variant="secondary" className="gap-2">
                    <Search className="h-4 w-4" />
                    {isRtl ? 'تصفية' : 'Filter'}
                </Button>
            </form>

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'رقم الإشعار' : 'Note Number'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'العميل' : 'Customer'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'الفرع' : 'Branch'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'المبلغ بدون الضريبة' : 'Subtotal'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'الضريبة' : 'VAT'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'الإجمالي' : 'Total'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="py-3.5 px-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {creditNotes.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-neutral-400">
                                        <RotateCcw className="h-10 w-10 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
                                        {isRtl ? 'لا توجد إشعارات دائنة مطابقة' : 'No credit notes found'}
                                    </td>
                                </tr>
                            ) : (
                                creditNotes.data.map((note) => (
                                    <tr key={note.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-medium text-rose-600 dark:text-rose-400">
                                            <Link href={`/sales/credit-notes/${note.id}`} className="hover:underline">
                                                {note.credit_note_number}
                                            </Link>
                                        </td>
                                        <td className="py-3.5 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                                            {note.customer?.name || '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                                            {note.date}
                                        </td>
                                        <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                                            {note.branch?.name || '—'}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                                            {parseFloat(note.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                                            {parseFloat(note.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {parseFloat(note.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} {isRtl ? 'ر.س' : 'SAR'}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {note.status === 'posted' ? (
                                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    {isRtl ? 'مرحل' : 'Posted'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                    <Clock className="h-3 w-3" />
                                                    {isRtl ? 'مسودة' : 'Draft'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Link href={`/sales/credit-notes/${note.id}`} title={isRtl ? 'عرض' : 'View'}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Link href={`/sales/credit-notes/${note.id}/print`} title={isRtl ? 'طباعة' : 'Print'}>
                                                        <Printer className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {creditNotes.last_page > 1 && (
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-sm">
                        <span className="text-neutral-500">
                            {isRtl
                                ? `الصفحة ${creditNotes.current_page} من ${creditNotes.last_page}`
                                : `Page ${creditNotes.current_page} of ${creditNotes.last_page}`}
                        </span>
                        <div className="flex items-center gap-2">
                            {creditNotes.current_page > 1 && (
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                >
                                    <Link href={`/sales/credit-notes?page=${creditNotes.current_page - 1}&search=${search}&status=${status}`}>
                                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                                        {isRtl ? 'السابق' : 'Previous'}
                                    </Link>
                                </Button>
                            )}
                            {creditNotes.current_page < creditNotes.last_page && (
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                >
                                    <Link href={`/sales/credit-notes?page=${creditNotes.current_page + 1}&search=${search}&status=${status}`}>
                                        {isRtl ? 'التالي' : 'Next'}
                                        {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
