import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ShoppingBag, Truck, CheckCircle2, Clock, FolderKanban, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
}

interface Product {
    id: string;
    sku: string;
    name: string;
}

interface OrderLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    tax_amount: string;
    line_total: string;
    product?: Product;
}

interface Quotation {
    id: string;
    quote_number: string;
}

interface Project {
    id: string;
    project_number: string;
    name: string;
    status: string;
}

interface SalesOrder {
    id: string;
    order_number: string;
    customer: Party;
    quotation?: Quotation;
    projects?: Project[];
    order_date: string;
    delivery_date?: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    discount_amount: string;
    total_amount: string;
    status: 'draft' | 'confirmed' | 'delivering' | 'completed' | 'cancelled';
    invoicing_status: 'unbilled' | 'partially_billed' | 'fully_billed';
    notes?: string;
    lines: OrderLine[];
}

interface Props {
    order: SalesOrder;
}

export default function SalesOrderShow({ order }: Props) {
    const { t, isRtl } = useTranslation();
    const [status, setStatus] = useState(order.status);

    const handleStatusUpdate = (newStatus: string) => {
        router.put(`/sales/orders/${order.id}/status`, { status: newStatus }, {
            onSuccess: () => setStatus(newStatus as any),
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${order.order_number} - ${isRtl ? 'أمر بيع' : 'Sales Order'}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/sales/orders">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                {order.order_number}
                            </h1>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-blue-50 text-blue-700 border border-blue-200">
                                {order.status}
                            </span>
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-neutral-100 text-neutral-600">
                                {order.invoicing_status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                            {isRtl && order.customer?.name_ar ? order.customer.name_ar : order.customer?.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {order.status === 'confirmed' && (
                        <Button onClick={() => handleStatusUpdate('delivering')} variant="outline" className="gap-2 text-amber-600 border-amber-200">
                            <Truck className="h-4 w-4" />
                            <span>{isRtl ? 'بدء التوريد / التنفيذ' : 'Start Delivery'}</span>
                        </Button>
                    )}
                    {order.status === 'delivering' && (
                        <Button onClick={() => handleStatusUpdate('completed')} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{isRtl ? 'إكمال الطلب' : 'Complete Order'}</span>
                        </Button>
                    )}
                    <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/projects/create">
                            <FolderKanban className="h-4 w-4" />
                            <span>{isRtl ? 'إنشاء مشروع تنفيذي' : 'Create Project'}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Document Details Card */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                        <p className="text-xs text-neutral-500 mb-1">{isRtl ? 'العميل' : 'Customer'}</p>
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">
                            {isRtl && order.customer?.name_ar ? order.customer.name_ar : order.customer?.name}
                        </p>
                        {order.customer?.tax_id && (
                            <p className="text-xs text-neutral-500 font-mono mt-0.5">{order.customer.tax_id}</p>
                        )}
                    </div>

                    <div>
                        <p className="text-xs text-neutral-500 mb-1">{isRtl ? 'تاريخ الأمر' : 'Order Date'}</p>
                        <p className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {order.order_date}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-neutral-500 mb-1">{isRtl ? 'تاريخ التسليم المتوقع' : 'Delivery Date'}</p>
                        <p className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {order.delivery_date || '-'}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-neutral-500 mb-1">{isRtl ? 'عرض السعر الأساسي' : 'Base Quotation'}</p>
                        {order.quotation ? (
                            <Link href={`/sales/quotations/${order.quotation.id}`} className="font-mono text-sm font-medium text-indigo-600 hover:underline">
                                {order.quotation.quote_number}
                            </Link>
                        ) : (
                            <span className="text-neutral-400 text-sm">-</span>
                        )}
                    </div>
                </div>

                {/* Lines Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase">
                                <th className="pb-3 text-start">{isRtl ? 'البند والوصف' : 'Item & Description'}</th>
                                <th className="pb-3 text-end">{isRtl ? 'الكمية' : 'Quantity'}</th>
                                <th className="pb-3 text-end">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                                <th className="pb-3 text-end">{isRtl ? 'الضريبة (10%)' : 'Tax (10%)'}</th>
                                <th className="pb-3 text-end">{isRtl ? 'الإجمالي' : 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {order.lines.map((line) => (
                                <tr key={line.id}>
                                    <td className="py-4">
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{line.description}</p>
                                        {line.product && (
                                            <p className="text-xs text-neutral-500 font-mono mt-0.5">SKU: {line.product.sku}</p>
                                        )}
                                    </td>
                                    <td className="py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                        {parseFloat(line.quantity).toLocaleString()}
                                    </td>
                                    <td className="py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                        {Number(line.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                        {Number(line.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(line.line_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Summary */}
                <div className="flex flex-col sm:flex-row justify-between items-start pt-6 border-t border-neutral-200 dark:border-neutral-800 gap-6">
                    <div className="w-full sm:w-1/2 space-y-4">
                        {order.notes && (
                            <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</p>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{order.notes}</p>
                            </div>
                        )}

                        {order.projects && order.projects.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">{isRtl ? 'المشاريع التنفيذية المرتبطة' : 'Linked Delivery Projects'}</p>
                                <div className="space-y-2">
                                    {order.projects.map((prj) => (
                                        <Link
                                            key={prj.id}
                                            href={`/projects/${prj.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FolderKanban className="h-4 w-4 text-indigo-600" />
                                                <span className="font-mono text-xs font-bold">{prj.project_number}</span>
                                                <span className="text-sm font-medium">{prj.name}</span>
                                            </div>
                                            <span className="text-xs capitalize font-medium text-neutral-500">{prj.status}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 space-y-2 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
                            <span className="font-mono font-medium">{Number(order.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">{isRtl ? 'ضريبة الاختبار (10%)' : 'Test Tax (10%)'}</span>
                            <span className="font-mono font-medium">{Number(order.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                        </div>
                        <div className="flex justify-between text-base font-bold pt-2 border-t border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
                            <span>{isRtl ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
