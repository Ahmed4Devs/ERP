import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Percent, Eye, Printer, Download, CheckCircle2, Clock, FileText, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface User {
    id: number;
    name: string;
}

interface VatReturn {
    id: string;
    return_number: string;
    period_type: string;
    tax_period: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'filed' | 'paid';
    total_sales_amount: string;
    total_output_vat: string;
    total_purchases_amount: string;
    total_input_vat: string;
    net_vat_due: string;
    final_net_payable: string;
    filing_date?: string;
    filed_by_user?: User;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    vatReturns: PaginatedData<VatReturn>;
    metrics: {
        total_payable: number;
        filed_count: number;
        draft_count: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function VatReturnsIndex({ vatReturns, metrics, filters }: Props) {
    const { isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/accounting/vat-returns', {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    const statusBadge = (s: VatReturn['status']) => {
        switch (s) {
            case 'filed':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isRtl ? 'معتمد ومُقدم (Filed)' : 'Filed'}
                    </span>
                );
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isRtl ? 'تم السداد (Paid)' : 'Paid'}
                    </span>
                );
            case 'draft':
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-3.5 w-3.5" />
                        {isRtl ? 'مسودة (Draft)' : 'Draft'}
                    </span>
                );
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <Head title={isRtl ? 'إقرارات ضريبة القيمة المضافة ZATCA' : 'ZATCA VAT Returns'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <Percent className="h-7 w-7 text-indigo-600" />
                        <span>{isRtl ? 'إقرارات ضريبة القيمة المضافة (ZATCA VAT Returns)' : 'Value Added Tax (VAT) Returns'}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إعداد واعتماد إقرارات ضريبة القيمة المضافة الدورية وفق معايير هيئة الزكاة والضريبة والجمارك'
                            : 'Generate, audit, file and print periodic VAT declarations compliant with ZATCA standards'}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                    <Link href="/accounting/vat-returns/create">
                        <Plus className="h-4 w-4" />
                        <span>{isRtl ? 'إعداد إقرار ضريبي جديد' : 'Prepare VAT Return'}</span>
                    </Link>
                </Button>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs font-medium text-neutral-500">{isRtl ? 'صافي الضريبة المستحقة للسداد' : 'Total Net VAT Payable'}</p>
                    <p className="text-2xl font-mono font-black text-neutral-900 dark:text-neutral-100 mt-1">
                        {Number(metrics.total_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                </div>
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{isRtl ? 'إقرارات معتمدة ومقدمة' : 'Filed Declarations'}</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{metrics.filed_count}</p>
                </div>
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-xs dark:border-amber-900/50 dark:bg-amber-950/20">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{isRtl ? 'مسودات قيد المراجعة' : 'Drafts in Review'}</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">{metrics.draft_count}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder={isRtl ? 'البحث برقم الإقرار أو الفترة الضريبية (مثال: 2026-Q1)...' : 'Search by return # or period (e.g. 2026-Q1)...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                        <option value="draft">{isRtl ? 'مسودة (Draft)' : 'Draft'}</option>
                        <option value="filed">{isRtl ? 'معتمد ومقدم (Filed)' : 'Filed'}</option>
                        <option value="paid">{isRtl ? 'مسدد (Paid)' : 'Paid'}</option>
                    </select>
                    <Button type="submit" variant="secondary">
                        {isRtl ? 'تصفية' : 'Filter'}
                    </Button>
                </form>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                        <thead className="border-b border-neutral-100 bg-neutral-50/75 dark:border-neutral-800 dark:bg-neutral-900/50">
                            <tr>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'رقم الإقرار' : 'Return #'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'الفترة الضريبية' : 'Tax Period'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'التواريخ' : 'Dates'}</th>
                                <th className="px-4 py-3 text-end font-medium text-neutral-500">{isRtl ? 'ضريبة المخرجات (مبيعات)' : 'Output VAT'}</th>
                                <th className="px-4 py-3 text-end font-medium text-neutral-500">{isRtl ? 'ضريبة المدخلات (مشتريات)' : 'Input VAT'}</th>
                                <th className="px-4 py-3 text-end font-medium text-neutral-500">{isRtl ? 'صافي الضريبة الواجبة' : 'Net VAT Payable'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-4 py-3 text-end font-medium text-neutral-500">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {vatReturns.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                                        <Percent className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                                        <p>{isRtl ? 'لا توجد إقرارات ضريبية مسجلة.' : 'No VAT returns found.'}</p>
                                    </td>
                                </tr>
                            ) : (
                                vatReturns.data.map((ret) => {
                                    const netVal = parseFloat(ret.final_net_payable || '0');
                                    return (
                                        <tr key={ret.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                <Link href={`/accounting/vat-returns/${ret.id}`} className="hover:text-indigo-600 hover:underline">
                                                    {ret.return_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-mono text-xs">
                                                    {ret.tax_period}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                                {ret.start_date} → {ret.end_date}
                                            </td>
                                            <td className="px-4 py-3 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                                <div className="flex items-center justify-end gap-1 text-emerald-600">
                                                    <ArrowUpRight className="h-3 w-3" />
                                                    {Number(ret.total_output_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                                <div className="flex items-center justify-end gap-1 text-blue-600">
                                                    <ArrowDownRight className="h-3 w-3" />
                                                    {Number(ret.total_input_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-end font-mono font-black text-base text-indigo-700 dark:text-indigo-300">
                                                {Number(ret.final_net_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="px-4 py-3">
                                                {statusBadge(ret.status)}
                                            </td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-neutral-600 hover:text-indigo-600" title={isRtl ? 'عرض ومراجعة الإقرار' : 'View Return'}>
                                                        <Link href={`/accounting/vat-returns/${ret.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-neutral-600 hover:text-indigo-600" title={isRtl ? 'طباعة نموذج هيئة الزكاة' : 'Print Declaration'}>
                                                        <a href={`/accounting/vat-returns/${ret.id}/print`} target="_blank" rel="noopener noreferrer">
                                                            <Printer className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-neutral-600 hover:text-indigo-600" title={isRtl ? 'تصدير CSV' : 'Export CSV'}>
                                                        <a href={`/accounting/vat-returns/${ret.id}/export`} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {vatReturns.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500">
                            {isRtl
                                ? `الصفحة ${vatReturns.current_page} من ${vatReturns.last_page} (إجمالي ${vatReturns.total})`
                                : `Page ${vatReturns.current_page} of ${vatReturns.last_page} (${vatReturns.total} total)`}
                        </p>
                        <div className="flex gap-2">
                            {Array.from({ length: vatReturns.last_page }, (_, i) => i + 1).map((page) => (
                                <Link
                                    key={page}
                                    href={`/accounting/vat-returns?page=${page}&search=${search}&status=${status}`}
                                    className={`px-3 py-1 text-xs rounded-md ${
                                        page === vatReturns.current_page
                                            ? 'bg-indigo-600 text-white font-bold'
                                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                                    }`}
                                >
                                    {page}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
