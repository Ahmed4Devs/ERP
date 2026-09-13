import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Cpu, Plus, Search, Eye, Printer, Layers, Warehouse, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface ProductionOrder {
    id: string;
    order_number: string;
    bom: { bom_code: string };
    finished_product: { name: string; name_ar?: string; sku: string };
    source_warehouse: { name: string };
    destination_warehouse: { name: string };
    target_quantity: string;
    produced_quantity: string;
    total_material_cost: string;
    unit_material_cost: string;
    status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
    start_date: string;
    completion_date?: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    orders: PaginatedData<ProductionOrder>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function ProductionOrdersIndex({ orders, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manufacturing/orders', { search, status: selectedStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get('/manufacturing/orders', { search, status: status || undefined }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: ProductionOrder['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700';
            case 'in_progress':
                return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 border border-rose-200';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'أوامر الإنتاج والتجميع' : 'Production Orders'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Cpu className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'أوامر الإنتاج والتجميع الخفيف' : 'Production Orders'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إطلاق أوامر التجميع، سحب المواد الخام بنظام التكلفة المرجحة، وتوريد المنتجات النهائية'
                            : 'Track assembly work orders, relieve raw materials at moving average cost, receipt finished goods'}
                    </p>
                </div>
                <div>
                    <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/manufacturing/orders/create">
                            <Plus className="h-4 w-4" />
                            <span>{isRtl ? 'أمر إنتاج جديد' : 'New Production Order'}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">{isRtl ? 'الحالة:' : 'Status:'}</span>
                    {['', 'draft', 'in_progress', 'completed'].map((s) => (
                        <button
                            key={s}
                            onClick={() => handleStatusFilter(s)}
                            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                                selectedStatus === s
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                            }`}
                        >
                            {s === '' ? (isRtl ? 'الكل' : 'All') : s === 'draft' ? (isRtl ? 'مسودة' : 'Draft') : s === 'in_progress' ? (isRtl ? 'قيد التنفيذ' : 'In Progress') : (isRtl ? 'مكتمل' : 'Completed')}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="ms-auto flex gap-2">
                    <Input
                        placeholder={isRtl ? 'بحث برقم الأمر أو المنتج...' : 'Search by order # or product...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 text-xs w-60"
                    />
                    <Button type="submit" variant="secondary" size="sm">
                        {isRtl ? 'بحث' : 'Search'}
                    </Button>
                </form>
            </div>

            {/* Orders Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'رقم أمر الإنتاج' : 'Order #'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'المنتج النهائي' : 'Finished Good'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'هيكل المواد (BOM)' : 'BOM'}</th>
                                <th className="px-6 py-3.5 text-center font-mono">{isRtl ? 'المستهدف' : 'Target'}</th>
                                <th className="px-6 py-3.5 text-center font-mono">{isRtl ? 'المنجز' : 'Produced'}</th>
                                <th className="px-6 py-3.5 text-end font-mono">{isRtl ? 'تكلفة المواد' : 'Material Cost'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3.5 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                                        <Cpu className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        {isRtl ? 'لا توجد أوامر إنتاج مطابقة' : 'No production orders found'}
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((order) => (
                                    <tr key={order.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {order.order_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {isRtl && order.finished_product?.name_ar ? order.finished_product.name_ar : order.finished_product?.name}
                                            </div>
                                            <div className="text-xs font-mono text-neutral-500">
                                                {order.finished_product?.sku}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {order.bom?.bom_code}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono font-medium">
                                            {Number(order.target_quantity)}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {Number(order.produced_quantity)}
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {Number(order.total_material_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(order.status)}`}>
                                                {order.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 hover:text-neutral-900">
                                                    <Link href={`/manufacturing/orders/${order.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                        <span>{isRtl ? 'عرض والتنفيذ' : 'View & Execute'}</span>
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-900">
                                                    <Link href={`/manufacturing/orders/${order.id}/print`} title={isRtl ? 'طباعة بطاقة أمر التشغيل' : 'Print Job Card'}>
                                                        <Printer className="h-3.5 w-3.5" />
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
