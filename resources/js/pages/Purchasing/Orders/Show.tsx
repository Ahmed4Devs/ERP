import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle, FileText, ShoppingBag, AlertCircle, Eye, Printer } from 'lucide-react';
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

interface VendorProfile {
    id: string;
    party: Party;
}

interface OrderLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
}

interface VendorBill {
    id: string;
    bill_number: string;
    bill_date: string;
    total: string;
    balance_due: string;
    status: string;
}

interface PurchaseOrder {
    id: string;
    order_number: string;
    vendor: VendorProfile;
    order_date: string;
    expected_delivery_date?: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    status: 'draft' | 'approved' | 'billed' | 'cancelled';
    notes?: string;
    lines: OrderLine[];
    bills: VendorBill[];
}

interface Props {
    order: PurchaseOrder;
}

export default function PurchaseOrdersShow({ order }: Props) {
    const { t, isRtl } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = () => {
        setIsProcessing(true);
        router.post(`/purchase-orders/${order.id}/approve`, {}, {
            onFinish: () => setIsProcessing(false),
        });
    };

    const statusBadge = (status: PurchaseOrder['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
            case 'billed':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${t('purchaseOrders.title')} - ${order.order_number}`} />

            {/* Back link & actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="rounded-full">
                        <Link href="/purchase-orders">
                            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                {order.order_number}
                            </h1>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(order.status)}`}>
                                {t(`purchaseOrders.${order.status}`, order.status)}
                            </span>
                        </div>
                        <p className="text-sm text-neutral-500">
                            {t('purchaseOrders.orderDate')}: {order.order_date}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <a href={`/purchase-orders/${order.id}/print`} target="_blank" rel="noopener noreferrer">
                            <Printer className="h-4 w-4" />
                            <span>{isRtl ? 'طباعة رسمية' : 'Official Print'}</span>
                        </a>
                    </Button>

                    {order.status === 'draft' && (
                        <Button
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <CheckCircle className="h-4 w-4" />
                            <span>{t('purchaseOrders.approve')}</span>
                        </Button>
                    )}

                    {order.status === 'approved' && (
                        <Button asChild className="gap-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800">
                            <Link href={`/vendor-bills/create?purchase_order_id=${order.id}`}>
                                <FileText className="h-4 w-4" />
                                <span>{t('purchaseOrders.convertToBill')}</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Printable Order Sheet */}
            <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                {/* Header info */}
                <div className="grid gap-6 sm:grid-cols-2 pb-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                            {t('purchaseOrders.vendor')}
                        </p>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            {isRtl && order.vendor.party.name_ar ? order.vendor.party.name_ar : order.vendor.party.name}
                        </h2>
                        {order.vendor.party.tax_id && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                {t('customers.taxId')}: <span className="font-mono">{order.vendor.party.tax_id}</span>
                            </p>
                        )}
                        {order.vendor.party.email && (
                            <p className="text-sm text-neutral-500">{order.vendor.party.email}</p>
                        )}
                    </div>

                    <div className="sm:text-end space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                        <p>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{t('purchaseOrders.orderDate')}:</span>{' '}
                            <span className="font-mono">{order.order_date}</span>
                        </p>
                        {order.expected_delivery_date && (
                            <p>
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">{t('purchaseOrders.expectedDeliveryDate')}:</span>{' '}
                                <span className="font-mono">{order.expected_delivery_date}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs font-semibold uppercase">
                            <tr>
                                <th className="py-3 text-start">#</th>
                                <th className="py-3 text-start">{t('purchaseOrders.itemDescription')}</th>
                                <th className="py-3 text-center">{t('purchaseOrders.quantity')}</th>
                                <th className="py-3 text-end">{t('purchaseOrders.unitPrice')}</th>
                                <th className="py-3 text-end">{t('purchaseOrders.lineTotal')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {order.lines.map((line, idx) => (
                                <tr key={line.id}>
                                    <td className="py-3 text-neutral-400 font-mono text-xs">{idx + 1}</td>
                                    <td className="py-3 font-medium text-neutral-900 dark:text-neutral-100">{line.description}</td>
                                    <td className="py-3 text-center font-mono">{Number(line.quantity).toFixed(2)}</td>
                                    <td className="py-3 text-end font-mono">
                                        {Number(line.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </td>
                                    <td className="py-3 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                        {Number(line.line_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Breakdown */}
                <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-4 flex flex-col items-end gap-2 text-sm">
                    <div className="flex justify-between w-64 text-neutral-600 dark:text-neutral-400">
                        <span>{t('purchaseOrders.subtotal')}:</span>
                        <span className="font-mono font-medium">
                            {Number(order.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </span>
                    </div>
                    <div className="flex justify-between w-64 text-neutral-600 dark:text-neutral-400">
                        <span>{t('purchaseOrders.tax')}:</span>
                        <span className="font-mono font-medium">
                            {Number(order.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </span>
                    </div>
                    <div className="flex justify-between w-64 text-lg font-bold text-neutral-900 dark:text-neutral-100 border-t border-neutral-200 dark:border-neutral-800 pt-2">
                        <span>{t('purchaseOrders.total')}:</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                            {Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </span>
                    </div>
                </div>

                {order.notes && (
                    <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <p className="text-xs uppercase font-semibold text-neutral-400 mb-1">{t('purchaseOrders.notes')}</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{order.notes}</p>
                    </div>
                )}
            </div>

            {/* Linked Vendor Bills */}
            {order.bills && order.bills.length > 0 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:hidden">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span>{t('vendorBills.title')}</span>
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-2 text-start">{t('vendorBills.billNumber')}</th>
                                    <th className="px-4 py-2 text-start">{t('vendorBills.billDate')}</th>
                                    <th className="px-4 py-2 text-end">{t('vendorBills.totalAmount')}</th>
                                    <th className="px-4 py-2 text-end">{t('vendorBills.balanceDue')}</th>
                                    <th className="px-4 py-2 text-end">{t('customers.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {order.bills.map((bill) => (
                                    <tr key={bill.id}>
                                        <td className="px-4 py-3 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {bill.bill_number}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {bill.bill_date}
                                        </td>
                                        <td className="px-4 py-3 text-end font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {Number(bill.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-4 py-3 text-end font-mono font-medium text-amber-600 dark:text-amber-400">
                                            {Number(bill.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1">
                                                <Link href={`/vendor-bills/${bill.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span>{t('common.view')}</span>
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
