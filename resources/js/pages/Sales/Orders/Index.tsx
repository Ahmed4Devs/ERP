import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, ShoppingBag, Eye, CheckCircle2, Clock, Truck, Printer } from 'lucide-react';
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
}

interface SalesOrder {
    id: string;
    order_number: string;
    customer: Party;
    quotation?: Quotation;
    order_date: string;
    delivery_date?: string;
    subtotal: string;
    tax_amount: string;
    total_amount: string;
    status: 'draft' | 'confirmed' | 'delivering' | 'completed' | 'cancelled';
    invoicing_status: 'unbilled' | 'partially_billed' | 'fully_billed';
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    orders: PaginatedData<SalesOrder>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function SalesOrdersIndex({ orders, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/sales/orders', { search, status: selectedStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get('/sales/orders', { search, status: status || undefined }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: SalesOrder['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700';
            case 'confirmed':
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'delivering':
                return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 border border-rose-200';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const totalOrdersValue = orders.data.reduce((acc, o) => acc + parseFloat(o.total_amount || '0'), 0);
    const confirmedCount = orders.data.filter(o => o.status === 'confirmed' || o.status === 'delivering').length;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'أوامر البيع للعملاء' : 'Sales Orders'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'أوامر البيع والتوريد' : 'Sales Orders'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدارة أوامر البيع المعتمدة، جدولة التسليم، وتتبع حالة الفوترة والتنفيذ'
                            : 'Manage confirmed sales orders, fulfillment schedules, and billing status'}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي قيمة أوامر البيع' : 'Total Sales Orders Value'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {totalOrdersValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </h3>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
                        <ShoppingBag className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'أوامر قيد التنفيذ والتسليم' : 'In Fulfillment / Delivery'}</p>
                        <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                            {confirmedCount}
                        </h3>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
                        <Truck className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي الأوامر' : 'Total Orders'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {orders.total}
                        </h3>
                    </div>
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/50 text-sky-600 rounded-lg">
                        <CheckCircle2 className="h-5 w-5" />
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
                            placeholder={isRtl ? 'بحث برقم الأمر أو العميل...' : 'Search order # or customer...'}
                            className={`${isRtl ? 'pr-9' : 'pl-9'}`}
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                        {isRtl ? 'بحث' : 'Search'}
                    </Button>
                </form>

                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                    {['', 'draft', 'confirmed', 'delivering', 'completed', 'cancelled'].map((status) => (
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
                                <th className="px-6 py-3 text-start">{isRtl ? 'رقم الأمر' : 'Order #'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'العميل' : 'Customer'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'تاريخ الأمر' : 'Order Date'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'تاريخ التسليم' : 'Delivery Date'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'حالة الفوترة' : 'Invoicing'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'الإجمالي' : 'Total Amount'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                                        <ShoppingBag className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        {isRtl ? 'لا توجد أوامر بيع مطابقة' : 'No sales orders found'}
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((order) => (
                                    <tr key={order.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {order.order_number}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                            {isRtl && order.customer?.name_ar ? order.customer.name_ar : order.customer?.name}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {order.order_date}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {order.delivery_date || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize bg-neutral-100 text-neutral-600">
                                                {order.invoicing_status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-600 dark:text-neutral-400 hover:text-emerald-600" title={isRtl ? 'طباعة أمر البيع' : 'Print Order'}>
                                                    <a href={`/sales/orders/${order.id}/print`} target="_blank" rel="noopener noreferrer">
                                                        <Printer className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                                <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900">
                                                    <Link href={`/sales/orders/${order.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                        <span>{isRtl ? 'عرض' : 'View'}</span>
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
            </div>
        </div>
    );
}
