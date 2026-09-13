import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, X, PackageCheck, Truck, UserCheck, ShieldCheck } from 'lucide-react';
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
    product: Product;
}

interface SalesOrder {
    id: string;
    order_number: string;
    order_date: string;
}

interface Company {
    name: string;
    name_ar?: string;
    legal_name?: string;
    tax_number?: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface DeliveryNote {
    id: string;
    delivery_number: string;
    date: string;
    status: string;
    driver_name?: string;
    vehicle_plate?: string;
    tracking_number?: string;
    recipient_name?: string;
    recipient_phone?: string;
    shipping_address?: string;
    notes?: string;
    warehouse: Warehouse;
    customer: Party;
    sales_order?: SalesOrder;
    lines: DeliveryNoteLine[];
}

interface Props {
    deliveryNote: DeliveryNote;
    company: Company;
    qrCodeDataUri: string;
    totalItems: number;
    totalCost: number;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function DeliveryNotesPrint({
    deliveryNote,
    company,
    qrCodeDataUri,
    totalItems,
}: Props) {
    const { isRtl } = useTranslation();

    useEffect(() => {
        // Auto open print dialog when loaded
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 sm:px-6 print:bg-white print:p-0 print:m-0">
            <Head title={`Print-${deliveryNote.delivery_number}`} />

            {/* Print Action Bar (Hidden when printing) */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs border border-neutral-200 dark:border-neutral-800 print:hidden">
                <div className="flex items-center gap-2">
                    <PackageCheck className="h-5 w-5 text-indigo-600" />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {isRtl ? 'معاينة وطباعة سند تسليم وإخراج البضاعة' : 'Goods Delivery Note Print Preview'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة المستند / PDF' : 'Print / Save PDF'}</span>
                    </Button>
                    <Button onClick={() => window.close()} variant="outline" className="gap-1.5">
                        <X className="h-4 w-4" />
                        <span>{isRtl ? 'إغلاق' : 'Close'}</span>
                    </Button>
                </div>
            </div>

            {/* A4 Sheet */}
            <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8 sm:p-12 shadow-lg border border-neutral-200 dark:border-neutral-800 print:shadow-none print:border-none print:p-6 print:max-w-none print:w-full">
                {/* Company Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 dark:border-neutral-100 pb-6 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-950 dark:text-white">
                            {company.legal_name || company.name}
                        </h1>
                        {company.name_ar && (
                            <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">
                                {company.name_ar}
                            </h2>
                        )}
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 space-y-0.5">
                            {company.tax_number && (
                                <p>{isRtl ? `الرقم الضريبي: ${company.tax_number}` : `VAT Reg: ${company.tax_number}`}</p>
                            )}
                            {company.address && <p>{company.address}</p>}
                            {company.phone && <p>{company.phone} | {company.email}</p>}
                        </div>
                    </div>

                    <div className="text-end">
                        <div className="inline-block bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 rounded-sm font-bold text-base tracking-wider uppercase mb-3">
                            سند تسليم وإخراج بضاعة
                            <span className="block text-[11px] font-normal tracking-normal text-neutral-300 dark:text-neutral-600">
                                GOODS DELIVERY NOTE
                            </span>
                        </div>
                        <p className="font-mono font-bold text-lg text-neutral-900 dark:text-white">
                            {deliveryNote.delivery_number}
                        </p>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {isRtl ? `التاريخ: ${deliveryNote.date}` : `Date: ${deliveryNote.date}`}
                        </p>
                    </div>
                </div>

                {/* Logistics & Customer Info Grid */}
                <div className="grid grid-cols-2 gap-6 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 mb-6 text-sm">
                    {/* Customer */}
                    <div className="space-y-1.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-700 pb-1">
                            {isRtl ? 'بيانات العميل والمستلم' : 'Consignee / Customer'}
                        </p>
                        <p className="font-bold text-base text-neutral-950 dark:text-white">
                            {isRtl && deliveryNote.customer?.name_ar ? deliveryNote.customer.name_ar : deliveryNote.customer?.name}
                        </p>
                        {deliveryNote.customer?.tax_id && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                                {isRtl ? `الرقم الضريبي: ${deliveryNote.customer.tax_id}` : `VAT: ${deliveryNote.customer.tax_id}`}
                            </p>
                        )}
                        {deliveryNote.recipient_name && (
                            <p className="text-xs text-neutral-700 dark:text-neutral-300">
                                {isRtl ? `المستلم: ${deliveryNote.recipient_name}` : `Attention: ${deliveryNote.recipient_name}`}
                                {deliveryNote.recipient_phone && ` (${deliveryNote.recipient_phone})`}
                            </p>
                        )}
                        {deliveryNote.shipping_address && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                {deliveryNote.shipping_address}
                            </p>
                        )}
                    </div>

                    {/* Logistics */}
                    <div className="space-y-1.5">
                        <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-700 pb-1">
                            {isRtl ? 'بيانات الشحن والمستودع' : 'Warehouse & Dispatch Details'}
                        </p>
                        <div className="grid grid-cols-2 gap-y-1 text-xs">
                            <span className="text-neutral-500">{isRtl ? 'المستودع المصدر:' : 'Source Warehouse:'}</span>
                            <span className="font-semibold">[{deliveryNote.warehouse?.code}] {deliveryNote.warehouse?.name}</span>

                            <span className="text-neutral-500">{isRtl ? 'أمر البيع:' : 'Sales Order:'}</span>
                            <span className="font-mono font-bold">
                                {deliveryNote.sales_order ? deliveryNote.sales_order.order_number : (isRtl ? 'تسليم مباشر' : 'Direct Delivery')}
                            </span>

                            <span className="text-neutral-500">{isRtl ? 'السائق:' : 'Driver:'}</span>
                            <span>{deliveryNote.driver_name || '-'}</span>

                            <span className="text-neutral-500">{isRtl ? 'رقم اللوحة:' : 'Vehicle Plate:'}</span>
                            <span className="font-mono">{deliveryNote.vehicle_plate || '-'}</span>

                            {deliveryNote.tracking_number && (
                                <>
                                    <span className="text-neutral-500">{isRtl ? 'رقم البوليصة:' : 'Waybill / Track:'}</span>
                                    <span className="font-mono">{deliveryNote.tracking_number}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-6">
                    <table className="w-full text-start text-sm border-collapse">
                        <thead>
                            <tr className="border-y-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 text-xs font-bold">
                                <th className="py-2.5 px-3 text-start w-12">#</th>
                                <th className="py-2.5 px-3 text-start">{isRtl ? 'رمز الصنف SKU' : 'SKU'}</th>
                                <th className="py-2.5 px-3 text-start">{isRtl ? 'اسم المنتج والبيان' : 'Item Description'}</th>
                                <th className="py-2.5 px-3 text-end w-32">{isRtl ? 'الكمية المسلمة' : 'Delivered Qty'}</th>
                                <th className="py-2.5 px-3 text-start w-24">{isRtl ? 'الوحدة' : 'Unit'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {deliveryNote.lines.map((line, idx) => (
                                <tr key={line.id}>
                                    <td className="py-3 px-3 text-neutral-500 text-xs">{idx + 1}</td>
                                    <td className="py-3 px-3 font-mono font-bold text-xs">{line.product?.sku}</td>
                                    <td className="py-3 px-3">
                                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {isRtl && line.product?.name_ar ? line.product.name_ar : line.product?.name}
                                        </p>
                                        {line.description && (
                                            <p className="text-xs text-neutral-500">{line.description}</p>
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-end font-mono font-bold text-base">
                                        {line.quantity}
                                    </td>
                                    <td className="py-3 px-3 text-xs text-neutral-600 dark:text-neutral-400">
                                        {isRtl && line.product?.unit?.name_ar ? line.product.unit.name_ar : (line.product?.unit?.name || 'Unit')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-neutral-900 dark:border-neutral-100 font-bold bg-neutral-50 dark:bg-neutral-800/50">
                                <td colSpan={3} className="py-2.5 px-3 text-end text-sm">
                                    {isRtl ? 'إجمالي عدد القطع والوحدات المسلمة:' : 'Total Delivered Units:'}
                                </td>
                                <td className="py-2.5 px-3 text-end font-mono text-base">
                                    {totalItems}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Notes & Verification QR Code */}
                <div className="flex justify-between items-end border-t border-neutral-200 dark:border-neutral-800 pt-4 mb-12">
                    <div className="max-w-md text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                        {deliveryNote.notes && (
                            <div>
                                <p className="font-bold text-neutral-800 dark:text-neutral-200">{isRtl ? 'ملاحظات:' : 'Notes:'}</p>
                                <p>{deliveryNote.notes}</p>
                            </div>
                        )}
                        <p className="italic text-[11px] text-neutral-400 pt-1">
                            {isRtl
                                ? 'إقرار: يقر المستلم بأنه استلم البضاعة المذكورة أعلاه بحالة جيدة ومطابقة للمواصفات المطلوبة.'
                                : 'Declaration: The consignee acknowledges receipt of the goods in good condition and order.'}
                        </p>
                    </div>

                    <div className="flex flex-col items-center">
                        <img src={qrCodeDataUri} alt="QR Verification" className="w-24 h-24 border border-neutral-200 dark:border-neutral-700 p-1 rounded" />
                        <span className="text-[10px] text-neutral-400 font-mono mt-1">التحقق الإلكتروني</span>
                    </div>
                </div>

                {/* Formal Signatures Grid */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-neutral-900 dark:border-neutral-100 text-center text-xs">
                    <div className="space-y-8">
                        <p className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            {isRtl ? 'أمين المستودع' : 'Warehouse Officer'}
                        </p>
                        <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                        <p className="text-neutral-500">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                    </div>

                    <div className="space-y-8">
                        <p className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            {isRtl ? 'السائق / الناقل' : 'Carrier / Driver'}
                        </p>
                        <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                        <p className="text-neutral-500">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                    </div>

                    <div className="space-y-8">
                        <p className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            {isRtl ? 'المستلم (العميل)' : 'Receiver (Customer)'}
                        </p>
                        <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                        <p className="text-neutral-500">{isRtl ? 'التوقيع وختم الاستلام' : 'Signature & Official Stamp'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
