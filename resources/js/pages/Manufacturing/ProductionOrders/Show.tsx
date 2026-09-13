import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Cpu,
    ArrowLeft,
    CheckCircle2,
    Layers,
    Warehouse,
    Calendar,
    DollarSign,
    Box,
    Clock,
    Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface OrderItem {
    id: string;
    product: {
        name: string;
        name_ar?: string;
        sku: string;
        unit?: { code: string };
    };
    planned_quantity: string;
    consumed_quantity: string;
    unit_cost: string;
    total_cost: string;
}

interface ProductionOrder {
    id: string;
    order_number: string;
    bom: { bom_code: string };
    finished_product: {
        id: string;
        name: string;
        name_ar?: string;
        sku: string;
        unit?: { code: string };
    };
    source_warehouse: { name: string; code: string };
    destination_warehouse: { name: string; code: string };
    target_quantity: string;
    produced_quantity: string;
    total_material_cost: string;
    unit_material_cost: string;
    status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
    start_date: string;
    completion_date?: string;
    notes?: string;
    items: OrderItem[];
}

interface Props {
    order: ProductionOrder;
}

export default function ProductionOrderShow({ order }: Props) {
    const { t, isRtl } = useTranslation();
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [producedQty, setProducedQty] = useState(order.target_quantity);

    const isCompleted = order.status === 'completed';

    const handleComplete = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(`/manufacturing/orders/${order.id}/complete`, {
            produced_quantity: producedQty,
        }, {
            onSuccess: () => setCompleteModalOpen(false),
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={`Production Order - ${order.order_number}`} />

            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                        <Link href="/manufacturing/orders">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                                {order.order_number}
                            </h1>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                isCompleted
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${isCompleted ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'}`} />
                                {order.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            BOM: <span className="font-mono font-medium text-neutral-700 dark:text-neutral-300">{order.bom?.bom_code}</span> &bull; {order.finished_product?.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="gap-2">
                        <Link href={`/manufacturing/orders/${order.id}/print`}>
                            <Printer className="h-4 w-4" />
                            <span>{isRtl ? 'طباعة بطاقة التشغيل' : 'Print Job Card'}</span>
                        </Link>
                    </Button>

                    {!isCompleted && (
                        <Button
                            onClick={() => setCompleteModalOpen(true)}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{isRtl ? 'إكمال الإنتاج وتوريد المخزون' : 'Complete & Receipt Stock'}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'الكمية المستهدفة' : 'Target Quantity'}</p>
                    <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                        {Number(order.target_quantity)} <span className="text-xs font-normal text-neutral-400">units</span>
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'الكمية المنجزة' : 'Produced Output'}</p>
                    <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                        {Number(order.produced_quantity)} <span className="text-xs font-normal text-neutral-400">units</span>
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'إجمالي تكلفة المواد الخام' : 'Total Material Cost'}</p>
                    <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                        {Number(order.total_material_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'تكلفة إنتاج الوحدة' : 'Unit Material Cost'}</p>
                    <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                        {Number(order.unit_material_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                </div>
            </div>

            {/* Warehouse Routing */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                    <span className="text-neutral-500">{isRtl ? 'مستودع صرف المواد الخام:' : 'Source Warehouse:'}</span>
                    <span className="ms-2 font-medium text-neutral-900 dark:text-neutral-100">{order.source_warehouse?.name} ({order.source_warehouse?.code})</span>
                </div>
                <div>
                    <span className="text-neutral-500">{isRtl ? 'مستودع استلام المنتج النهائي:' : 'Destination Warehouse:'}</span>
                    <span className="ms-2 font-medium text-neutral-900 dark:text-neutral-100">{order.destination_warehouse?.name} ({order.destination_warehouse?.code})</span>
                </div>
            </div>

            {/* Raw Material Components Table */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2 border-b pb-3 mb-4">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    {isRtl ? 'صرف واستهلاك المواد الخام (Raw Material Consumption)' : 'Component Consumption Breakdown'}
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="pb-3 text-start">{isRtl ? 'المكون / الصنف' : 'Component Item'}</th>
                                <th className="pb-3 text-center font-mono">{isRtl ? 'المخطط' : 'Planned Qty'}</th>
                                <th className="pb-3 text-center font-mono">{isRtl ? 'المستهلك الفعلي' : 'Consumed Qty'}</th>
                                <th className="pb-3 text-end font-mono">{isRtl ? 'تكلفة الوحدة' : 'Unit Cost'}</th>
                                <th className="pb-3 text-end font-mono">{isRtl ? 'إجمالي التكلفة' : 'Total Cost'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {order.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                        {isRtl && item.product.name_ar ? item.product.name_ar : item.product.name}
                                        <span className="block text-xs font-mono text-neutral-500">{item.product.sku}</span>
                                    </td>
                                    <td className="py-3 text-center font-mono text-neutral-600 dark:text-neutral-400">
                                        {Number(item.planned_quantity)}
                                    </td>
                                    <td className="py-3 text-center font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(item.consumed_quantity)}
                                    </td>
                                    <td className="py-3 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                        {Number(item.unit_cost).toFixed(2)} SAR
                                    </td>
                                    <td className="py-3 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(item.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Complete Modal */}
            {completeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-600" />
                            {isRtl ? 'إكمال عملية التجميع والتوريد' : 'Complete Production & Receipt'}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">
                            {isRtl
                                ? 'سيتم صرف المواد الخام وتوريد الوحدات المجمعة للمستودع واحتساب التكلفة المرجحة تلقائياً'
                                : 'Raw materials will be issued, finished items received into warehouse, and unit moving average cost updated'}
                        </p>

                        <form onSubmit={handleComplete} className="mt-4 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                    {isRtl ? 'الكمية المنتجة الفعلية' : 'Actual Produced Quantity'}
                                </label>
                                <Input
                                    required
                                    type="number"
                                    step="any"
                                    value={producedQty}
                                    onChange={(e) => setProducedQty(e.target.value)}
                                    className="mt-1 font-mono text-lg"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCompleteModalOpen(false)}
                                    className="flex-1"
                                >
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    {isRtl ? 'تأكيد الإنجاز والتوريد' : 'Confirm & Receipt'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
