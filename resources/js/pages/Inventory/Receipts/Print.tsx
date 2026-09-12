import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, Printer, Building2, CheckCircle2, ShieldCheck, PackageCheck, Boxes, Warehouse as WarehouseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Unit {
    name: string;
    symbol: string;
}

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
    unit?: Unit;
}

interface ReceiptLine {
    id: string;
    description?: string;
    quantity: string;
    unit_cost: string;
    product?: Product;
}

interface GoodsReceipt {
    id: string;
    receipt_number: string;
    date: string;
    status: string;
    notes?: string;
    warehouse?: {
        name: string;
        code: string;
    };
    party?: {
        name: string;
        name_ar?: string;
        tax_id?: string;
        phone?: string;
    };
    purchaseOrder?: {
        order_number: string;
    };
    lines: ReceiptLine[];
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
    receipt: GoodsReceipt;
    company: Company | null;
    qrCodeDataUri: string;
    totalCost: number;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function GoodsReceiptPrint({ receipt, company, qrCodeDataUri, totalCost, amountInWords }: Props) {
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
            <Head title={`سند استلام مخزني - ${receipt.receipt_number}`} />

            {/* Print Action Toolbar */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/inventory/receipts/${receipt.id}`}>
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة لتفاصيل السند' : 'Back to GRN'}</span>
                        </Link>
                    </Button>
                    <div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                            {receipt.receipt_number}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handlePrint}
                        className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة سند الاستلام / PDF' : 'Print GRN / PDF'}</span>
                    </Button>
                </div>
            </div>

            {/* A4 Sheet Container */}
            <div className="max-w-4xl mx-auto bg-white text-neutral-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-neutral-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-full">
                
                {/* Header: Company & Title */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-8 gap-4">
                    <div className="space-y-1.5 text-start">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-lg">
                                <PackageCheck className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-neutral-900">
                                {companyName}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-600">
                            {locale === 'ar' ? 'إدارة المستودعات وسلاسل الإمداد والمخزون' : 'Supply Chain & Inventory Management'}
                        </p>
                        <div className="text-xs text-neutral-500 font-mono space-y-0.5 pt-1">
                            <div>الرقم الضريبي / Tax ID: <span className="font-semibold text-neutral-800">{taxNumber}</span></div>
                            <div>السجل التجاري / CR: <span className="font-semibold text-neutral-800">{crNumber}</span></div>
                        </div>
                    </div>

                    {/* Badge & Meta */}
                    <div className="text-end space-y-2">
                        <div className="inline-block bg-amber-50 text-amber-900 border-2 border-amber-600 px-4 py-2 rounded-xl">
                            <h1 className="text-lg sm:text-xl font-black tracking-wide">سند استلام بضاعة (GRN)</h1>
                            <p className="text-xs font-semibold tracking-wider uppercase text-amber-700">Goods Receipt Note</p>
                        </div>
                        <div className="text-xs text-neutral-600 space-y-1 font-mono pt-1">
                            <div>رقم السند / GRN No: <span className="font-bold text-base text-neutral-900">{receipt.receipt_number}</span></div>
                            <div>تاريخ الاستلام / Date: <span className="font-semibold text-neutral-800">{receipt.date}</span></div>
                            <div>الحالة: <span className="font-semibold uppercase text-emerald-700">{receipt.status}</span></div>
                        </div>
                    </div>
                </div>

                {/* Warehouse & Supplier Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500">
                            <WarehouseIcon className="h-4 w-4 text-amber-600" />
                            <span>المستودع المستلم (Receiving Warehouse)</span>
                        </div>
                        <div className="text-sm font-bold text-neutral-900 text-base">
                            {receipt.warehouse?.name || 'المستودع الرئيسي'}
                        </div>
                        <div className="text-xs text-neutral-600 space-y-1">
                            <div>كود المستودع: <span className="font-mono font-semibold text-neutral-800">{receipt.warehouse?.code || 'WH-01'}</span></div>
                            <div>نوع الحركة: <span className="font-medium text-emerald-700">إضافة مخزنية مع تسوية وسيط GRNI</span></div>
                        </div>
                    </div>

                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                            المورد وأمر الشراء (Supplier & PO Reference)
                        </h2>
                        <div className="text-xs text-neutral-700 space-y-1.5">
                            <div>اسم المورد: <span className="font-bold text-neutral-900">{locale === 'ar' ? (receipt.party?.name_ar || receipt.party?.name) : (receipt.party?.name || receipt.party?.name_ar)}</span></div>
                            {receipt.party?.tax_id && (
                                <div>الرقم الضريبي للمورد: <span className="font-mono font-semibold text-neutral-800">{receipt.party.tax_id}</span></div>
                            )}
                            {receipt.purchaseOrder && (
                                <div>بموجب أمر الشراء رقم: <span className="font-mono font-bold text-amber-700">{receipt.purchaseOrder.order_number}</span></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Received Items Table */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden mb-6">
                    <table className="w-full text-xs text-start">
                        <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                            <tr>
                                <th className="p-3 text-start">#</th>
                                <th className="p-3 text-start">رمز الصنف (SKU)</th>
                                <th className="p-3 text-start">الصنف والوصف (Item Description)</th>
                                <th className="p-3 text-center">الوحدة (Unit)</th>
                                <th className="p-3 text-center">الكمية المستلمة (Qty)</th>
                                <th className="p-3 text-end">تكلفة الوحدة (Unit Cost)</th>
                                <th className="p-3 text-end">إجمالي القيمة (Total Cost)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {receipt.lines.map((line, idx) => {
                                const qty = parseFloat(line.quantity || '0');
                                const cost = parseFloat(line.unit_cost || '0');
                                const sub = qty * cost;
                                return (
                                    <tr key={line.id || idx}>
                                        <td className="p-3 font-mono text-neutral-500">{idx + 1}</td>
                                        <td className="p-3 font-mono font-bold text-neutral-800">{line.product?.sku || '—'}</td>
                                        <td className="p-3">
                                            <div className="font-bold text-neutral-900">
                                                {line.product ? (locale === 'ar' ? (line.product.name_ar || line.product.name) : line.product.name) : (line.description || 'بضاعة')}
                                            </div>
                                            {line.description && line.product && (
                                                <p className="text-[11px] text-neutral-500 mt-0.5">{line.description}</p>
                                            )}
                                        </td>
                                        <td className="p-3 text-center text-neutral-600">{line.product?.unit?.symbol || 'قطعة'}</td>
                                        <td className="p-3 text-center font-mono font-bold text-emerald-700 text-sm">{qty}</td>
                                        <td className="p-3 text-end font-mono">{cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="p-3 text-end font-mono font-bold text-neutral-900">
                                            {sub.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Total Valuation & Tafqeet */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 items-start">
                    <div className="space-y-3">
                        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5">
                            <span className="text-xs font-bold text-neutral-600 block">إجمالي تقييم البضاعة كتابةً (Tafqeet):</span>
                            <div className="text-sm font-bold text-neutral-900">{amountInWords.ar}</div>
                            <div className="text-xs text-neutral-600 italic border-t border-neutral-200 pt-1.5">{amountInWords.en}</div>
                        </div>

                        {receipt.notes && (
                            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                                <span className="font-bold text-neutral-600 block">ملاحظات الاستلام والفحص:</span>
                                <p className="text-neutral-700 leading-relaxed">{receipt.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between text-neutral-600">
                            <span>إجمالي الأصناف المستلمة:</span>
                            <span className="font-mono font-bold text-neutral-900">{receipt.lines.length} أصناف</span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                            <span>إجمالي كميات الوحدات:</span>
                            <span className="font-mono font-bold text-neutral-900">
                                {receipt.lines.reduce((acc, l) => acc + parseFloat(l.quantity || '0'), 0)} وحدة
                            </span>
                        </div>
                        <div className="border-t-2 border-neutral-300 pt-2 flex justify-between text-sm font-bold text-neutral-900">
                            <span>القيمة التقديرية المقيدة لـ GRNI:</span>
                            <span className="font-mono font-black text-amber-700 text-lg">
                                {Number(totalCost).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signatures & Custody Verification */}
                <div className="border-t-2 border-neutral-200 pt-8 mt-8">
                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">أمين المستودع المستلم<br /><span className="text-[10px] text-neutral-400 font-normal">Warehouse Receiver</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والتاريخ</span>
                        </div>
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">فحص الجودة والمطابقة<br /><span className="text-[10px] text-neutral-400 font-normal">Quality & Specs Inspector</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والتاريخ</span>
                        </div>
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">مندوب التوصيل / المورد<br /><span className="text-[10px] text-neutral-400 font-normal">Carrier / Supplier Representative</span></span>
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
                                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                                <span>سند استلام بضائع مخزني موثق</span>
                            </div>
                            <p className="text-[11px] text-neutral-500">تم تحديث كميات المخزون وتكلفة المتوسط المرجح آلياً</p>
                            <p className="text-[10px] font-mono text-neutral-400">Generated: {new Date().toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="text-center sm:text-end text-[11px] space-y-0.5">
                        <div className="font-semibold text-neutral-700">{companyName}</div>
                        <div>المركز الرئيسي — إدارة المستودعات المركزية</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
