import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, PackageCheck, Printer, Truck, CheckCircle2, ShoppingBag, MapPin, User, FileText, ArrowDownUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    tax_id?: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
    unit?: {
        name: string;
        name_ar?: string;
    };
}

interface DeliveryNoteLine {
    id: string;
    description: string;
    quantity: string;
    unit_cost: string;
    total_cost: string;
    product: Product;
}

interface SalesOrder {
    id: string;
    order_number: string;
    order_date: string;
    status: string;
}

interface JournalLine {
    id: string;
    debit: string;
    credit: string;
    description: string;
    account: {
        code: string;
        name: string;
        name_ar?: string;
    };
}

interface JournalEntry {
    id: string;
    entry_number: string;
    date: string;
    lines: JournalLine[];
}

interface StockMovement {
    id: string;
    movement_number: string;
    direction: string;
    quantity: string;
    date: string;
    product?: Product;
}

interface DeliveryNote {
    id: string;
    delivery_number: string;
    date: string;
    status: 'draft' | 'dispatched' | 'delivered' | 'cancelled';
    driver_name?: string;
    vehicle_plate?: string;
    tracking_number?: string;
    recipient_name?: string;
    recipient_phone?: string;
    shipping_address?: string;
    total_cost: string;
    notes?: string;
    warehouse: Warehouse;
    customer: Party;
    sales_order?: SalesOrder;
    journal_entry?: JournalEntry;
    lines: DeliveryNoteLine[];
    stock_movements?: StockMovement[];
}

interface Props {
    deliveryNote: DeliveryNote;
}

export default function DeliveryNotesShow({ deliveryNote }: Props) {
    const { t, isRtl } = useTranslation();

    const totalQuantity = deliveryNote.lines.reduce((sum, l) => sum + parseFloat(l.quantity || '0'), 0);

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${deliveryNote.delivery_number} - ${isRtl ? 'سند تسليم وإخراج بضاعة' : 'Delivery Note'}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/inventory/delivery-notes">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                {deliveryNote.delivery_number}
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                <Truck className="h-3.5 w-3.5" />
                                {deliveryNote.status}
                            </span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                            {isRtl && deliveryNote.customer?.name_ar ? deliveryNote.customer.name_ar : deliveryNote.customer?.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="gap-2">
                        <a href={`/inventory/delivery-notes/${deliveryNote.id}/print`} target="_blank" rel="noopener noreferrer">
                            <Printer className="h-4 w-4" />
                            <span>{isRtl ? 'طباعة سند التسليم / PDF' : 'Print Delivery Note / PDF'}</span>
                        </a>
                    </Button>
                    {deliveryNote.sales_order && (
                        <Button asChild variant="secondary" className="gap-2">
                            <Link href={`/sales/orders/${deliveryNote.sales_order.id}`}>
                                <ShoppingBag className="h-4 w-4" />
                                <span>{deliveryNote.sales_order.order_number}</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer & Destination Card */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <User className="h-5 w-5 text-indigo-600" />
                        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'بيانات العميل والتسليم' : 'Customer & Delivery Target'}
                        </h2>
                    </div>
                    <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-500">{isRtl ? 'العميل:' : 'Customer:'}</span>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                {isRtl && deliveryNote.customer?.name_ar ? deliveryNote.customer.name_ar : deliveryNote.customer?.name}
                            </span>
                        </div>
                        {deliveryNote.customer?.tax_id && (
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{isRtl ? 'الرقم الضريبي:' : 'VAT #:'}</span>
                                <span className="font-mono text-neutral-700 dark:text-neutral-300">{deliveryNote.customer.tax_id}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-neutral-500">{isRtl ? 'تاريخ التسليم:' : 'Delivery Date:'}</span>
                            <span className="font-mono">{deliveryNote.date}</span>
                        </div>
                        {deliveryNote.recipient_name && (
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{isRtl ? 'المستلم في الموقع:' : 'Recipient:'}</span>
                                <span className="font-medium">{deliveryNote.recipient_name}</span>
                            </div>
                        )}
                        {deliveryNote.recipient_phone && (
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{isRtl ? 'هاتف المستلم:' : 'Phone:'}</span>
                                <span className="font-mono">{deliveryNote.recipient_phone}</span>
                            </div>
                        )}
                        {deliveryNote.shipping_address && (
                            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <span className="text-neutral-500 block mb-1">{isRtl ? 'عنوان التسليم:' : 'Shipping Address:'}</span>
                                <p className="text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800/50 p-2.5 rounded-lg text-xs">
                                    {deliveryNote.shipping_address}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Warehouse & Transport Card */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <Truck className="h-5 w-5 text-indigo-600" />
                        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'المستودع والنقل والشحن' : 'Warehouse & Logistics'}
                        </h2>
                    </div>
                    <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-500">{isRtl ? 'المستودع المصدر:' : 'Source Warehouse:'}</span>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                [{deliveryNote.warehouse?.code}] {deliveryNote.warehouse?.name}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">{isRtl ? 'السائق:' : 'Driver:'}</span>
                            <span>{deliveryNote.driver_name || (isRtl ? 'غير محدد' : 'N/A')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">{isRtl ? 'لوحة الشاحنة:' : 'Vehicle Plate:'}</span>
                            <span className="font-mono">{deliveryNote.vehicle_plate || (isRtl ? 'غير محدد' : 'N/A')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">{isRtl ? 'رقم التتبع:' : 'Tracking #:'}</span>
                            <span className="font-mono">{deliveryNote.tracking_number || (isRtl ? 'غير محدد' : 'N/A')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500">{isRtl ? 'أمر البيع:' : 'Sales Order:'}</span>
                            <span className="font-mono font-bold text-indigo-600">
                                {deliveryNote.sales_order ? deliveryNote.sales_order.order_number : (isRtl ? 'تسليم مباشر' : 'Direct')}
                            </span>
                        </div>
                        {deliveryNote.notes && (
                            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <span className="text-neutral-500 block mb-1">{isRtl ? 'ملاحظات:' : 'Notes:'}</span>
                                <p className="text-neutral-700 dark:text-neutral-300 text-xs italic">{deliveryNote.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delivered Items Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                        <PackageCheck className="h-5 w-5 text-indigo-600" />
                        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'الأصناف المسلمة' : 'Delivered Items'}
                        </h2>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                        {isRtl ? `إجمالي الكمية: ${totalQuantity}` : `Total Qty: ${totalQuantity}`}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                        <thead>
                            <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-500 text-xs">
                                <th className="py-2.5 text-start">{isRtl ? 'رمز الصنف SKU' : 'SKU'}</th>
                                <th className="py-2.5 text-start">{isRtl ? 'اسم المنتج' : 'Product Name'}</th>
                                <th className="py-2.5 text-start">{isRtl ? 'البيان والوصف' : 'Description'}</th>
                                <th className="py-2.5 text-end">{isRtl ? 'الكمية المسلمة' : 'Delivered Qty'}</th>
                                <th className="py-2.5 text-start ps-3">{isRtl ? 'الوحدة' : 'Unit'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {deliveryNote.lines.map((line) => (
                                <tr key={line.id}>
                                    <td className="py-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {line.product?.sku}
                                    </td>
                                    <td className="py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                        {isRtl && line.product?.name_ar ? line.product.name_ar : line.product?.name}
                                    </td>
                                    <td className="py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                                        {line.description}
                                    </td>
                                    <td className="py-3 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100 text-base">
                                        {line.quantity}
                                    </td>
                                    <td className="py-3 ps-3 text-neutral-500 text-xs">
                                        {isRtl && line.product?.unit?.name_ar ? line.product.unit.name_ar : (line.product?.unit?.name || 'Unit')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* General Ledger Entry Card */}
            {deliveryNote.journal_entry && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {isRtl ? 'قيد اليومية المحاسبي (المخزون المستمر وتكلفة المبيعات)' : 'Perpetual Inventory GL Journal Entry'}
                            </h2>
                        </div>
                        <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                            {deliveryNote.journal_entry.entry_number}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-500 text-xs">
                                    <th className="py-2 text-start">{isRtl ? 'رقم الحساب' : 'Account #'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'اسم الحساب' : 'Account Name'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'البيان' : 'Description'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'مدين (SAR)' : 'Debit (SAR)'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'دائن (SAR)' : 'Credit (SAR)'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono text-xs">
                                {deliveryNote.journal_entry.lines.map((jl) => (
                                    <tr key={jl.id}>
                                        <td className="py-2 font-bold text-neutral-900 dark:text-neutral-100">
                                            {jl.account.code}
                                        </td>
                                        <td className="py-2 font-sans font-medium text-neutral-800 dark:text-neutral-200">
                                            {isRtl && jl.account.name_ar ? jl.account.name_ar : jl.account.name}
                                        </td>
                                        <td className="py-2 font-sans text-neutral-500">
                                            {jl.description}
                                        </td>
                                        <td className="py-2 text-end text-neutral-900 dark:text-neutral-100">
                                            {parseFloat(jl.debit) > 0 ? parseFloat(jl.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="py-2 text-end text-neutral-900 dark:text-neutral-100">
                                            {parseFloat(jl.credit) > 0 ? parseFloat(jl.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
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
