import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ShoppingBag, Truck, CheckCircle2, Clock, FolderKanban, FileText, Plus, Printer, PackageCheck, AlertTriangle, ShieldAlert, Receipt } from 'lucide-react';
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

interface DeliveryNote {
    id: string;
    delivery_number: string;
    date: string;
    status: string;
    warehouse?: { name: string; code: string };
}

interface Invoice {
    id: string;
    invoice_number: string;
    date: string;
    status: string;
    total: string;
    balance_due: string;
}

interface CreditStatus {
    credit_limit: number;
    current_balance: number;
    projected_balance: number;
    available_credit: number;
    is_exceeded: boolean;
    utilization_percent: number;
    has_credit_limit: boolean;
}

interface SalesOrder {
    id: string;
    order_number: string;
    customer: Party;
    quotation?: Quotation;
    projects?: Project[];
    delivery_notes?: DeliveryNote[];
    invoices?: Invoice[];
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
    creditStatus?: CreditStatus | null;
}

export default function SalesOrderShow({ order, creditStatus }: Props) {
    const { t, isRtl } = useTranslation();
    const [status, setStatus] = useState(order.status);
    const [isConverting, setIsConverting] = useState(false);

    const handleStatusUpdate = (newStatus: string) => {
        router.put(`/sales/orders/${order.id}/status`, { status: newStatus }, {
            onSuccess: () => setStatus(newStatus as any),
        });
    };

    const handleConvertToInvoice = (ignoreCreditLimit = false) => {
        const confirmMsg = ignoreCreditLimit
            ? (isRtl
                ? 'تنبيه: سقف الائتمان تم تجاوزه للعميل! هل ترغب في اعتماد الاستثناء الإداري وإصدار الفاتورة الضريبية فوراً؟'
                : 'Warning: Customer credit limit exceeded! Proceed with supervisor override to convert order into tax invoice?')
            : (isRtl
                ? 'هل أنت متأكد من رغبتك في تحويل أمر البيع إلى فاتورة ضريبية رسمية بنقرة واحدة؟'
                : 'Are you sure you want to convert this Sales Order into an official Tax Invoice?');

        if (window.confirm(confirmMsg)) {
            setIsConverting(true);
            router.post(`/sales/orders/${order.id}/convert-to-invoice`, {
                ignore_credit_limit: ignoreCreditLimit,
            }, {
                onFinish: () => setIsConverting(false),
            });
        }
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
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize border ${
                                order.invoicing_status === 'fully_billed'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : order.invoicing_status === 'partially_billed'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                            }`}>
                                {order.invoicing_status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                            {isRtl && order.customer?.name_ar ? order.customer.name_ar : order.customer?.name}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" className="gap-2">
                        <a href={`/sales/orders/${order.id}/print`} target="_blank" rel="noopener noreferrer">
                            <Printer className="h-4 w-4" />
                            <span>{isRtl ? 'طباعة أمر البيع / PDF' : 'Print Order / PDF'}</span>
                        </a>
                    </Button>

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

                    {order.invoicing_status !== 'fully_billed' && (
                        <Button
                            onClick={() => handleConvertToInvoice(creditStatus?.is_exceeded ?? false)}
                            disabled={isConverting}
                            className={`gap-2 text-white shadow-sm ${
                                creditStatus?.is_exceeded
                                    ? 'bg-amber-600 hover:bg-amber-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                        >
                            <Receipt className="h-4 w-4" />
                            <span>
                                {isConverting
                                    ? (isRtl ? 'جاري التحويل...' : 'Converting...')
                                    : creditStatus?.is_exceeded
                                    ? (isRtl ? 'تجاوز سقف الائتمان والفوترة' : 'Override Limit & Convert')
                                    : (isRtl ? 'إصدار فاتورة ضريبية رسمية' : 'Generate Tax Invoice')}
                            </span>
                        </Button>
                    )}

                    <Button asChild variant="outline" className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                        <Link href={`/inventory/delivery-notes/create?sales_order_id=${order.id}`}>
                            <PackageCheck className="h-4 w-4" />
                            <span>{isRtl ? 'إنشاء سند تسليم' : 'Create Delivery Note'}</span>
                        </Link>
                    </Button>

                    <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/projects/create">
                            <FolderKanban className="h-4 w-4" />
                            <span>{isRtl ? 'إنشاء مشروع تنفيذي' : 'Create Project'}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Credit Risk Banner */}
            {creditStatus && creditStatus.has_credit_limit && (
                <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                    creditStatus.is_exceeded
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-950 dark:text-rose-100'
                        : 'bg-neutral-50 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
                }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg shrink-0 ${
                            creditStatus.is_exceeded
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                        }`}>
                            {creditStatus.is_exceeded ? <ShieldAlert className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">
                                    {isRtl ? 'مؤشر الائتمان التجاري للعميل (Credit Risk)' : 'Customer Credit Risk Status'}
                                </span>
                                {creditStatus.is_exceeded ? (
                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-200 text-rose-900 dark:bg-rose-900/80 dark:text-rose-200">
                                        {isRtl ? 'تم تجاوز السقف المسموح!' : 'Limit Exceeded!'}
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        {isRtl ? 'ضمن النطاق الآمن' : 'Safe Credit Zone'}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                                {isRtl
                                    ? `الحد الائتماني: ${creditStatus.credit_limit.toLocaleString()} ر.س | المستحق الحالي: ${creditStatus.current_balance.toLocaleString()} ر.س | الرصيد المتوقع بعد هذا الأمر: ${creditStatus.projected_balance.toLocaleString()} ر.س`
                                    : `Credit Limit: ${creditStatus.credit_limit.toLocaleString()} SAR | Current Outstanding: ${creditStatus.current_balance.toLocaleString()} SAR | Projected: ${creditStatus.projected_balance.toLocaleString()} SAR`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-neutral-200 dark:border-neutral-800">
                        <div className="flex flex-col text-start md:text-end">
                            <span className="text-xs text-neutral-500">{isRtl ? 'الرصيد المتاح' : 'Available Credit'}</span>
                            <span className="font-mono font-bold text-sm">
                                {creditStatus.available_credit.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                        <div className="flex flex-col text-start md:text-end">
                            <span className="text-xs text-neutral-500">{isRtl ? 'نسبة الاستهلاك' : 'Utilization'}</span>
                            <span className={`font-mono font-bold text-sm ${creditStatus.is_exceeded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {creditStatus.utilization_percent}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

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

                        {order.delivery_notes && order.delivery_notes.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                    <PackageCheck className="h-4 w-4 text-indigo-600" />
                                    <span>{isRtl ? 'سندات التسليم المرتبطة بأمر البيع' : 'Linked Delivery Notes'}</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {order.delivery_notes.map((dn) => (
                                        <Link
                                            key={dn.id}
                                            href={`/inventory/delivery-notes/${dn.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <PackageCheck className="h-4 w-4 text-indigo-600" />
                                                <span className="font-mono text-xs font-bold">{dn.delivery_number}</span>
                                                {dn.warehouse && (
                                                    <span className="text-xs text-neutral-500">[{dn.warehouse.code}]</span>
                                                )}
                                            </div>
                                            <span className="text-xs capitalize font-medium text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full">{dn.status}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {order.invoices && order.invoices.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                    <Receipt className="h-4 w-4 text-emerald-600" />
                                    <span>{isRtl ? 'الفواتير الضريبية المصدرة (ZATCA)' : 'Issued Tax Invoices (ZATCA)'}</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {order.invoices.map((inv) => (
                                        <Link
                                            key={inv.id}
                                            href={`/invoices/${inv.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Receipt className="h-4 w-4 text-emerald-600" />
                                                <span className="font-mono text-xs font-bold">{inv.invoice_number}</span>
                                                <span className="text-xs text-neutral-500">{inv.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-semibold">{Number(inv.total).toLocaleString()} SAR</span>
                                                <span className="text-xs capitalize font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full">{inv.status}</span>
                                            </div>
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
