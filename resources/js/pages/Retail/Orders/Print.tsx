import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, Printer, ShoppingBag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
}

interface OrderLine {
    id: string;
    description?: string;
    quantity: string;
    unit_price: string;
    tax_amount: string;
    line_total: string;
    product?: Product;
}

interface PosOrder {
    id: string;
    order_number: string;
    payment_method: string;
    cash_tendered?: string;
    change_due?: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total_amount: string;
    created_at: string;
    session?: {
        session_number: string;
        terminal?: {
            name: string;
            code: string;
            branch?: {
                name: string;
                name_ar?: string;
                city?: string;
            };
        };
    };
    customer?: {
        name: string;
        name_ar?: string;
        tax_id?: string;
    };
    lines: OrderLine[];
}

interface Company {
    name: string;
    legal_name?: string;
    tax_number?: string;
    settings?: {
        cr_number?: string;
        address?: string;
        phone?: string;
    };
}

interface Props {
    order: PosOrder;
    company: Company | null;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function PosOrderPrint({ order, company, qrCodeDataUri, amountInWords }: Props) {
    const { t, isRtl, locale } = useTranslation();

    const handlePrint = () => {
        window.print();
    };

    const BackIcon = isRtl ? ArrowRight : ArrowLeft;
    const companyName = locale === 'ar'
        ? (company?.legal_name || company?.name || 'شركة الحلول المتكاملة للأعمال')
        : (company?.name || company?.legal_name || 'Integrated Enterprise Solutions Co.');
    const taxNumber = company?.tax_number || '300123456700003';
    const crNumber = company?.settings?.cr_number || '1010789456';
    const branchName = locale === 'ar'
        ? (order.session?.terminal?.branch?.name_ar || order.session?.terminal?.branch?.name || 'الفرع الرئيسي')
        : (order.session?.terminal?.branch?.name || order.session?.terminal?.branch?.name_ar || 'Main Branch');

    const formatPaymentMethod = (method: string) => {
        switch (method) {
            case 'cash':
                return isRtl ? 'نقداً (Cash)' : 'Cash';
            case 'card':
                return isRtl ? 'شبكة / مدى (Mada/Card)' : 'Card';
            case 'split':
                return isRtl ? 'دفع متعدد (Split)' : 'Split';
            default:
                return method.toUpperCase();
        }
    };

    return (
        <div className="min-h-screen bg-neutral-200 dark:bg-neutral-950 py-6 px-4 print:bg-white print:p-0">
            <Head title={`إيصال نقاط البيع - ${order.order_number}`} />

            {/* Print Action Toolbar */}
            <div className="max-w-xs mx-auto mb-4 flex items-center justify-between gap-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 p-3 rounded-xl shadow-sm print:hidden">
                <Button asChild variant="outline" size="sm" className="gap-1 text-xs">
                    <Link href={`/retail/orders/${order.id}`}>
                        <BackIcon className="h-3.5 w-3.5" />
                        <span>{isRtl ? 'الطلب' : 'Order'}</span>
                    </Link>
                </Button>

                <Button
                    onClick={handlePrint}
                    size="sm"
                    className="gap-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs shadow-sm"
                >
                    <Printer className="h-3.5 w-3.5" />
                    <span>{isRtl ? 'طباعة إيصال 80mm' : 'Print Thermal 80mm'}</span>
                </Button>
            </div>

            {/* 80mm Thermal Receipt Canvas */}
            <div className="max-w-xs mx-auto bg-white text-neutral-900 p-5 rounded-lg shadow-md border border-neutral-300 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full font-mono text-[11px] leading-tight">
                
                {/* Store Header */}
                <div className="text-center pb-3 border-b border-dashed border-neutral-400 space-y-1">
                    <div className="flex justify-center mb-1">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold">
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="font-bold text-sm text-neutral-900 tracking-tight font-sans">
                        {companyName}
                    </div>
                    <div className="text-[10px] text-neutral-600 font-sans">{branchName}</div>
                    <div className="text-[10px] text-neutral-600 pt-0.5">الرقم الضريبي / VAT: {taxNumber}</div>
                    <div className="text-[10px] text-neutral-600">السجل التجاري / CR: {crNumber}</div>

                    <div className="pt-2">
                        <div className="inline-block bg-neutral-100 border border-neutral-300 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider font-sans">
                            فاتورة ضريبية مبسطة
                            <span className="block text-[8px] font-normal text-neutral-500">Simplified Tax Invoice</span>
                        </div>
                    </div>
                </div>

                {/* Receipt Metadata */}
                <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-neutral-500">رقم الفاتورة:</span>
                        <span className="font-bold text-neutral-900">{order.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-neutral-500">التاريخ والوقت:</span>
                        <span>{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-neutral-500">نقطة البيع:</span>
                        <span>{order.session?.terminal?.name || 'Terminal 1'}</span>
                    </div>
                    {order.customer && (
                        <div className="flex justify-between pt-0.5 border-t border-dotted border-neutral-300">
                            <span className="text-neutral-500">العميل:</span>
                            <span className="font-sans font-medium">{locale === 'ar' ? (order.customer.name_ar || order.customer.name) : order.customer.name}</span>
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <div className="py-2.5 border-b border-dashed border-neutral-400">
                    <table className="w-full text-start text-[10px]">
                        <thead>
                            <tr className="border-b border-neutral-300 text-neutral-600">
                                <th className="pb-1 text-start">البند / الصنف</th>
                                <th className="pb-1 text-center">الكمية</th>
                                <th className="pb-1 text-end">السعر</th>
                                <th className="pb-1 text-end">المجموع</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dotted divide-neutral-200">
                            {order.lines.map((line, idx) => (
                                <tr key={line.id || idx}>
                                    <td className="py-1.5 pe-1 font-sans">
                                        <div className="font-semibold text-neutral-900">
                                            {line.product ? (locale === 'ar' ? (line.product.name_ar || line.product.name) : line.product.name) : (line.description || 'صنف')}
                                        </div>
                                    </td>
                                    <td className="py-1.5 text-center font-bold">{Number(line.quantity)}</td>
                                    <td className="py-1.5 text-end font-mono">{Number(line.unit_price).toFixed(2)}</td>
                                    <td className="py-1.5 text-end font-mono font-bold text-neutral-900">
                                        {Number(line.line_total).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Breakdown */}
                <div className="py-2.5 border-b border-dashed border-neutral-400 space-y-1.5 text-[10px]">
                    <div className="flex justify-between text-neutral-600">
                        <span>المجموع الفرعي (غير شامل الضريبة):</span>
                        <span className="font-mono">{Number(order.subtotal).toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                        <span>ضريبة القيمة المضافة (15% VAT):</span>
                        <span className="font-mono">{Number(order.tax_amount).toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-neutral-900 pt-1 border-t border-neutral-300">
                        <span>الإجمالي الكلي شامل الضريبة:</span>
                        <span className="font-mono text-sm font-black">{Number(order.total_amount).toFixed(2)} SAR</span>
                    </div>
                    <div className="text-[9px] text-neutral-500 font-sans italic pt-0.5">
                        {amountInWords.ar}
                    </div>
                </div>

                {/* Payment Breakdown */}
                <div className="py-2 border-b border-dashed border-neutral-400 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                        <span className="text-neutral-500">طريقة الدفع:</span>
                        <span className="font-semibold">{formatPaymentMethod(order.payment_method)}</span>
                    </div>
                    {order.cash_tendered && parseFloat(order.cash_tendered) > 0 && (
                        <>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">المبلغ المدفوع:</span>
                                <span className="font-mono">{Number(order.cash_tendered).toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-neutral-900 font-semibold">
                                <span className="text-neutral-500">المتبقي (الباقي):</span>
                                <span className="font-mono">{Number(order.change_due || 0).toFixed(2)} SAR</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Official ZATCA QR Code */}
                <div className="py-4 text-center space-y-2">
                    <div className="flex justify-center">
                        <img
                            src={qrCodeDataUri}
                            alt="ZATCA E-Invoice QR"
                            className="w-32 h-32 border border-neutral-200 p-1 bg-white rounded shadow-sm"
                        />
                    </div>
                    <div className="text-[9px] text-neutral-500 font-sans">
                        رمز استجابة الفوترة الإلكترونية السريعة (ZATCA QR)
                    </div>
                </div>

                {/* Receipt Footer & Policies */}
                <div className="pt-2 text-center text-[9px] text-neutral-500 space-y-1 font-sans border-t border-dotted border-neutral-300">
                    <p className="font-medium text-neutral-700">البضاعة المباعة ترد وتستبدل خلال 7 أيام مع إحضار الفاتورة</p>
                    <p>شكراً لزيارتكم ونسعد بخدمتكم دائماً</p>
                    <p className="font-mono text-[8px] text-neutral-400">POS-TERMINAL-{order.order_number}</p>
                </div>

            </div>
        </div>
    );
}
