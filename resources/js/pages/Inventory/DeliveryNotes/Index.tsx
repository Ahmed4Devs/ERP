import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, PackageCheck, Eye, Printer, Truck, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface SalesOrder {
    id: string;
    order_number: string;
}

interface DeliveryNote {
    id: string;
    delivery_number: string;
    date: string;
    status: 'draft' | 'dispatched' | 'delivered' | 'cancelled';
    driver_name?: string;
    vehicle_plate?: string;
    total_cost: string;
    warehouse: Warehouse;
    customer: Party;
    sales_order?: SalesOrder;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    deliveryNotes: PaginatedData<DeliveryNote>;
    warehouses: Warehouse[];
    filters: {
        search?: string;
        warehouse_id?: string;
        customer_id?: string;
        status?: string;
    };
}

export default function DeliveryNotesIndex({ deliveryNotes, warehouses, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory/delivery-notes', {
            search: search || undefined,
            warehouse_id: selectedWarehouse || undefined,
            status: selectedStatus || undefined,
        }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: DeliveryNote['status']) => {
        switch (status) {
            case 'dispatched':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Truck className="h-3 w-3" />
                        {isRtl ? 'تم الإرسال / قيد التوصيل' : 'Dispatched'}
                    </span>
                );
            case 'delivered':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        {isRtl ? 'تم التسليم بنجاح' : 'Delivered'}
                    </span>
                );
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-3 w-3" />
                        {isRtl ? 'مسودة' : 'Draft'}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <Head title={isRtl ? 'سندات تسليم وإخراج البضاعة' : 'Goods Delivery Notes'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <PackageCheck className="h-7 w-7 text-indigo-600" />
                        <span>{isRtl ? 'سندات تسليم وإخراج البضاعة' : 'Goods Delivery Notes'}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدارة ومتابعة سندات إخراج البضاعة من المستودعات إلى العملاء وربطها بأوامر البيع'
                            : 'Manage outbound goods delivery notes from warehouses to customers linked with sales orders'}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                    <Link href="/inventory/delivery-notes/create">
                        <Plus className="h-4 w-4" />
                        <span>{isRtl ? 'إنشاء سند تسليم جديد' : 'New Delivery Note'}</span>
                    </Link>
                </Button>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي السندات' : 'Total Deliveries'}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{deliveryNotes.total}</p>
                </div>
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 shadow-xs dark:border-blue-900/50 dark:bg-blue-950/20">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">{isRtl ? 'سندات قيد التوصيل' : 'In Transit'}</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">
                        {deliveryNotes.data.filter(d => d.status === 'dispatched').length}
                    </p>
                </div>
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{isRtl ? 'تم استلامها' : 'Delivered'}</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                        {deliveryNotes.data.filter(d => d.status === 'delivered').length}
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder={isRtl ? 'البحث برقم السند، العميل، السائق، اللوحة...' : 'Search by delivery #, customer, driver, plate...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <select
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">{isRtl ? 'جميع المستودعات' : 'All Warehouses'}</option>
                        {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                        <option value="dispatched">{isRtl ? 'قيد التوصيل (Dispatched)' : 'Dispatched'}</option>
                        <option value="delivered">{isRtl ? 'تم التسليم (Delivered)' : 'Delivered'}</option>
                        <option value="draft">{isRtl ? 'مسودة (Draft)' : 'Draft'}</option>
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
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'رقم السند' : 'Delivery #'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'التاريخ' : 'Date'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'العميل' : 'Customer'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'المستودع المصدر' : 'Source Warehouse'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'أمر البيع' : 'Sales Order'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'السائق / اللوحة' : 'Driver / Vehicle'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-4 py-3 text-end font-medium text-neutral-500">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {deliveryNotes.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                                        <PackageCheck className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                                        <p>{isRtl ? 'لا توجد سندات تسليم حتى الآن.' : 'No delivery notes found.'}</p>
                                    </td>
                                </tr>
                            ) : (
                                deliveryNotes.data.map((dn) => (
                                    <tr key={dn.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            <Link href={`/inventory/delivery-notes/${dn.id}`} className="hover:text-indigo-600 hover:underline">
                                                {dn.delivery_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                            {dn.date}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                            {isRtl && dn.customer?.name_ar ? dn.customer.name_ar : dn.customer?.name}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                            <span className="font-mono text-xs font-semibold me-1">[{dn.warehouse?.code}]</span>
                                            {dn.warehouse?.name}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                                            {dn.sales_order ? (
                                                <Link href={`/sales/orders/${dn.sales_order.id}`} className="text-indigo-600 hover:underline">
                                                    {dn.sales_order.order_number}
                                                </Link>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                                            {dn.driver_name ? (
                                                <div>
                                                    <span>{dn.driver_name}</span>
                                                    {dn.vehicle_plate && <span className="ms-1 font-mono text-neutral-400">({dn.vehicle_plate})</span>}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {statusBadge(dn.status)}
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-neutral-600 hover:text-indigo-600">
                                                    <Link href={`/inventory/delivery-notes/${dn.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-neutral-600 hover:text-indigo-600">
                                                    <a href={`/inventory/delivery-notes/${dn.id}/print`} target="_blank" rel="noopener noreferrer">
                                                        <Printer className="h-4 w-4" />
                                                    </a>
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
                {deliveryNotes.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500">
                            {isRtl
                                ? `الصفحة ${deliveryNotes.current_page} من ${deliveryNotes.last_page} (إجمالي ${deliveryNotes.total})`
                                : `Page ${deliveryNotes.current_page} of ${deliveryNotes.last_page} (${deliveryNotes.total} total)`}
                        </p>
                        <div className="flex gap-2">
                            {Array.from({ length: deliveryNotes.last_page }, (_, i) => i + 1).map((page) => (
                                <Link
                                    key={page}
                                    href={`/inventory/delivery-notes?page=${page}&search=${search}&warehouse_id=${selectedWarehouse}&status=${selectedStatus}`}
                                    className={`px-3 py-1 text-xs rounded-md ${
                                        page === deliveryNotes.current_page
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
