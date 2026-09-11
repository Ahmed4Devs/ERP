import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Receipt, CheckCircle2, Clock, Eye, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface Quotation {
    id: string;
    quote_number: string;
    customer: Party;
    issue_date: string;
    valid_until: string;
    subtotal: string;
    tax_amount: string;
    discount_amount: string;
    total_amount: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    quotations: PaginatedData<Quotation>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function QuotationsIndex({ quotations, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/sales/quotations', { search, status: selectedStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get('/sales/quotations', { search, status: status || undefined }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: Quotation['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
            case 'sent':
                return 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-200';
            case 'accepted':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200';
            case 'converted':
                return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const totalQuotesValue = quotations.data.reduce((acc, q) => acc + parseFloat(q.total_amount || '0'), 0);
    const acceptedCount = quotations.data.filter(q => q.status === 'accepted' || q.status === 'converted').length;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'عروض الأسعار للعملاء' : 'Sales Quotations'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'عروض الأسعار التجارية' : 'Sales Quotations'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إصدار عروض الأسعار بضريبة 10% والخصومات، وتتبع القبول والتحويل إلى أوامر بيع'
                            : 'Manage commercial quotations with 10% test tax, discounts, and order conversion'}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/sales/quotations/create">
                        <Plus className="h-4 w-4" />
                        <span>{isRtl ? 'إنشاء عرض سعر جديد' : 'New Sales Quotation'}</span>
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي قيمة العروض' : 'Total Quotations Value'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {totalQuotesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </h3>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
                        <Receipt className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'عروض مقبولة ومتحولة' : 'Accepted & Converted'}</p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                            {acceptedCount}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'عدد العروض النشطة' : 'Active Quotations Count'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {quotations.total}
                        </h3>
                    </div>
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/50 text-sky-600 rounded-lg">
                        <Clock className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-80">
                    <div className="relative flex-1">
                        <Search className={`absolute top-2.5 h-4 w-4 text-neutral-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={isRtl ? 'بحث برقم العرض أو العميل...' : 'Search quote # or customer...'}
                            className={`${isRtl ? 'pr-9' : 'pl-9'}`}
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                        {isRtl ? 'بحث' : 'Search'}
                    </Button>
                </form>

                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                    {['', 'draft', 'sent', 'accepted', 'converted', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                selectedStatus === status
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            {status === '' ? (isRtl ? 'الكل' : 'All') : status.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs font-semibold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 text-start">{isRtl ? 'رقم العرض' : 'Quote #'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'العميل' : 'Customer'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'صالح حتى' : 'Valid Until'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'الإجمالي' : 'Total Amount'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {quotations.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                                        <Receipt className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        {isRtl ? 'لا توجد عروض أسعار مطابقة' : 'No sales quotations found'}
                                    </td>
                                </tr>
                            ) : (
                                quotations.data.map((quote) => (
                                    <tr key={quote.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {quote.quote_number}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                            {isRtl && quote.customer?.name_ar ? quote.customer.name_ar : quote.customer?.name}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {quote.issue_date}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {quote.valid_until}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(quote.status)}`}>
                                                {quote.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(quote.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900">
                                                <Link href={`/sales/quotations/${quote.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span>{isRtl ? 'عرض' : 'View'}</span>
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
