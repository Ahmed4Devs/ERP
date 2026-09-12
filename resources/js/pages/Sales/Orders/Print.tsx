import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, Printer, Building2, CheckCircle2, ShieldCheck, ShoppingCart, Calendar, Phone } from 'lucide-react';
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
    description: string;
    quantity: string;
    unit_price: string;
    tax_amount: string;
    line_total: string;
    product?: Product;
}

interface SalesOrder {
    id: string;
    order_number: string;
    order_date: string;
    delivery_date?: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total_amount: string;
    status: string;
    notes?: string;
    customer?: {
        name: string;
        name_ar?: string;
        tax_id?: string;
        phone?: string;
    };
    quotation?: {
        quote_number: string;
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
    order: SalesOrder;
    company: Company | null;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function SalesOrderPrint({ order, company, qrCodeDataUri, amountInWords }: Props) {
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

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 print:bg-white print:p-0">
            <Head title={`أمر بيع - ${order.order_number}`} />

            {/* Print Action Toolbar */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/sales/orders/${order.id}`}>
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة لتفاصيل أمر البيع' : 'Back to Order'}</span>
                        </Link>
                    </Button>
                    <div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                            {order.order_number}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handlePrint}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة أمر البيع / PDF' : 'Print Order / PDF'}</span>
                    </Button>
                </div>
            </div>

            {/* A4 Sheet Container */}
            <div className="max-w-4xl mx-auto bg-white text-neutral-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-neutral-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-full">
                
                {/* Header: Company & Title */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-8 gap-4">
                    <div className="space-y-1.5 text-start">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-lg">
                                <ShoppingCart className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-neutral-900">
                                {companyName}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-600">
                            {locale === 'ar' ? 'إدارة المبيعات والعمليات التجارية والتسليم' : 'Sales & Commercial Fulfillment'}
                        </p>
                        <div className="text-xs text-neutral-500 font-mono space-y-0.5 pt-1">
                            <div>الرقم الضريبي / Tax ID: <span className="font-semibold text-neutral-800">{taxNumber}</span></div>
                            <div>السجل التجاري / CR: <span className="font-semibold text-neutral-800">{crNumber}</span></div>
                        </div>
                    </div>

                    {/* Badge & Meta */}
                    <div className="text-end space-y-2">
                        <div className="inline-block bg-emerald-50 text-emerald-900 border-2 border-emerald-600 px-4 py-2 rounded-xl">
                            <h1 className="text-lg sm:text-xl font-black tracking-wide">أمر بيع معتمد</h1>
                            <p className="text-xs font-semibold tracking-wider uppercase text-emerald-700">Approved Sales Order</p>
                        </div>
                        <div className="text-xs text-neutral-600 space-y-1 font-mono pt-1">
                            <div>رقم الأمر / Order No: <span className="font-bold text-base text-neutral-900">{order.order_number}</span></div>
                            <div>تاريخ الأمر / Date: <span className="font-semibold text-neutral-800">{order.order_date}</span></div>
                            {order.delivery_date && (
                                <div className="text-emerald-700 font-bold">تاريخ التسليم المتوقع: {order.delivery_date}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Customer & References Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                            بيانات العميل (Customer Details)
                        </h2>
                        <div className="text-sm font-bold text-neutral-900 text-base">
                            {locale === 'ar' ? (order.customer?.name_ar || order.customer?.name) : (order.customer?.name || order.customer?.name_ar)}
                        </div>
                        <div className="text-xs text-neutral-600 space-y-1">
                            <div>الرقم الضريبي للعميل: <span className="font-mono font-semibold text-neutral-800">{order.customer?.tax_id || '—'}</span></div>
                            {order.customer?.phone && <div>الهاتف: <span className="font-mono">{order.customer.phone}</span></div>}
                        </div>
                    </div>

                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                            بيانات الاعتماد والتنفيذ (Fulfillment Info)
                        </h2>
                        <div className="text-xs text-neutral-700 space-y-1.5">
                            {order.quotation && (
                                <div>بناءً على عرض السعر رقم: <span className="font-mono font-bold text-indigo-700">{order.quotation.quote_number}</span></div>
                            )}
                            <div>حالة التنفيذ: <span className="font-semibold uppercase text-emerald-700">{order.status}</span></div>
                            <div>مركز الإصدار: <span className="text-neutral-900 font-medium">الإدارة العامة للمبيعات</span></div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden mb-6">
                    <table className="w-full text-xs text-start">
                        <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                            <tr>
                                <th className="p-3 text-start">#</th>
                                <th className="p-3 text-start">المنتج / البند (Item & Description)</th>
                                <th className="p-3 text-center">الكمية (Qty)</th>
                                <th className="p-3 text-end">سعر الوحدة (Unit Price)</th>
                                <th className="p-3 text-end">الضريبة 15% (VAT)</th>
                                <th className="p-3 text-end">الإجمالي (Total)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {order.lines.map((line, idx) => (
                                <tr key={line.id || idx}>
                                    <td className="p-3 font-mono text-neutral-500">{idx + 1}</td>
                                    <td className="p-3">
                                        <div className="font-bold text-neutral-900">
                                            {line.product ? (locale === 'ar' ? (line.product.name_ar || line.product.name) : line.product.name) : line.description}
                                        </div>
                                        {line.product && line.product.sku && (
                                            <span className="font-mono text-[10px] text-neutral-400">SKU: {line.product.sku}</span>
                                        )}
                                        {line.description && line.product && (
                                            <p className="text-[11px] text-neutral-500 mt-0.5">{line.description}</p>
                                        )}
                                    </td>
                                    <td className="p-3 text-center font-mono font-bold">{Number(line.quantity)}</td>
                                    <td className="p-3 text-end font-mono">{Number(line.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-end font-mono text-neutral-600">{Number(line.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="p-3 text-end font-mono font-bold text-neutral-900">
                                        {Number(line.line_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Financial Summary & Tafqeet */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 items-start">
                    <div className="space-y-3">
                        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5">
                            <span className="text-xs font-bold text-neutral-600 block">المبلغ كتابةً (Tafqeet):</span>
                            <div className="text-sm font-bold text-neutral-900">{amountInWords.ar}</div>
                            <div className="text-xs text-neutral-600 italic border-t border-neutral-200 pt-1.5">{amountInWords.en}</div>
                        </div>

                        {order.notes && (
                            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                                <span className="font-bold text-neutral-700 block">ملاحظات وتعليمات الشحن:</span>
                                <p className="text-neutral-600 leading-relaxed">{order.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between text-neutral-600">
                            <span>المجموع الفرعي (Subtotal):</span>
                            <span className="font-mono font-semibold text-neutral-900">
                                {Number(order.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                            <span>ضريبة القيمة المضافة ({Number(order.tax_rate) * 100}% VAT):</span>
                            <span className="font-mono font-semibold text-neutral-900">
                                {Number(order.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                        <div className="border-t-2 border-neutral-300 pt-2 flex justify-between text-sm font-bold text-neutral-900">
                            <span>الإجمالي الكلي لأمر البيع (Total):</span>
                            <span className="font-mono font-black text-emerald-700 text-lg">
                                {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signatures & Execution Approvals */}
                <div className="border-t-2 border-neutral-200 pt-8 mt-8">
                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">مسئول المبيعات<br /><span className="text-[10px] text-neutral-400 font-normal">Sales Officer</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والتاريخ</span>
                        </div>
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">أمين المستودع والشحن<br /><span className="text-[10px] text-neutral-400 font-normal">Warehouse & Dispatch</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والتاريخ</span>
                        </div>
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">توقيع واستلام العميل<br /><span className="text-[10px] text-neutral-400 font-normal">Client Acceptance Signature</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">الاسم والتوقيع والختم</span>
                        </div>
                    </div>
                </div>

                {/* Footer: QR Code & Verification info */}
                <div className="mt-12 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
                    <div className="flex items-center gap-3">
                        <img
                            src={qrCodeDataUri}
                            alt="QR Verification"
                            className="w-16 h-16 border border-neutral-300 rounded p-0.5 bg-white"
                        />
                        <div className="space-y-0.5 text-start">
                            <div className="font-semibold text-neutral-700 flex items-center gap-1">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                <span>أمر بيع تجاري معتمد وموثق</span>
                            </div>
                            <p className="text-[11px] text-neutral-500">جاهز لأعمال الصرف المخزني وإصدار الفواتير الضريبية</p>
                            <p className="text-[10px] font-mono text-neutral-400">Generated: {new Date().toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="text-center sm:text-end text-[11px] space-y-0.5">
                        <div className="font-semibold text-neutral-700">{companyName}</div>
                        <div>المركز الرئيسي — المملكة العربية السعودية</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
