import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, Printer, Building2, CheckCircle2, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    code: string;
    name: string;
    name_ar?: string;
}

interface OrderLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    subtotal: string;
    tax_amount: string;
    line_total: string;
    expenseAccount?: Account;
}

interface PurchaseOrder {
    id: string;
    po_number: string;
    date: string;
    expected_delivery_date?: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    currency: string;
    status: 'draft' | 'approved' | 'partially_received' | 'closed' | string;
    notes?: string;
    party?: {
        name: string;
        name_ar?: string;
        tax_id?: string;
        phone?: string;
        email?: string;
    };
    approver?: {
        name: string;
        email: string;
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
    order: PurchaseOrder;
    company: Company | null;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function PurchaseOrderPrint({ order, company, qrCodeDataUri, amountInWords }: Props) {
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
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 print:bg-white print:p-0 font-sans">
            <Head title={`أمر شراء - ${order.po_number}`} />

            {/* Print Action Toolbar (Hidden on print) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/purchase-orders/${order.id}`}>
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة لأمر الشراء' : 'Back to Order'}</span>
                        </Link>
                    </Button>
                    <div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                            {order.po_number}
                        </span>
                        <span className="text-xs text-neutral-500 block">
                            {isRtl ? 'أمر شراء وتوريد رسمي معتمد' : 'Official Purchase Order Document'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handlePrint}
                        className="gap-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة / حفظ كـ PDF' : 'Print / Save as PDF'}</span>
                    </Button>
                </div>
            </div>

            {/* Printable Document Paper */}
            <div className="max-w-4xl mx-auto bg-white text-neutral-900 border border-neutral-200 shadow-md print:shadow-none print:border-none rounded-2xl print:rounded-none p-10 sm:p-12 print:p-0">
                {/* Header */}
                <div className="border-b-2 border-neutral-900 pb-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        <div className="space-y-1 text-start">
                            <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-extrabold tracking-tight text-neutral-950">
                                        {companyName}
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-medium">
                                        Procurement & Supply Chain Division
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs text-neutral-600 pt-2 space-y-0.5">
                                <div>
                                    <span className="font-semibold">{isRtl ? 'الرقم الضريبي:' : 'VAT:'}</span>{' '}
                                    <span className="font-mono font-bold text-neutral-900">{taxNumber}</span>
                                </div>
                                <div>
                                    <span className="font-semibold">{isRtl ? 'السجل التجاري:' : 'CR:'}</span>{' '}
                                    <span className="font-mono">{crNumber}</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-start sm:text-end space-y-1">
                            <div className="inline-block bg-neutral-950 text-white px-4 py-1.5 rounded-lg text-sm font-bold tracking-wider uppercase">
                                {isRtl ? 'أمر شراء رسمي' : 'OFFICIAL PURCHASE ORDER'}
                            </div>
                            <div className="pt-2 text-xs space-y-1 text-neutral-700">
                                <div>
                                    <span className="text-neutral-500">{isRtl ? 'رقم أمر الشراء:' : 'PO Number:'}</span>{' '}
                                    <span className="font-mono font-bold text-neutral-950 text-sm">{order.po_number}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-500">{isRtl ? 'تاريخ الطلب:' : 'Order Date:'}</span>{' '}
                                    <span className="font-mono">{order.date}</span>
                                </div>
                                {order.expected_delivery_date && (
                                    <div>
                                        <span className="text-neutral-500">{isRtl ? 'تاريخ التوريد المتوقع:' : 'Delivery Date:'}</span>{' '}
                                        <span className="font-mono">{order.expected_delivery_date}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vendor & Approval Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 border border-neutral-200 rounded-xl p-5 mb-6 text-xs">
                    <div>
                        <span className="font-bold text-neutral-400 uppercase tracking-wider block mb-1 text-[11px]">
                            {isRtl ? 'بيانات المورد المعتمد (Vendor)' : 'VENDOR DETAILS'}
                        </span>
                        <h2 className="text-sm font-bold text-neutral-950">
                            {order.party?.name_ar || order.party?.name || '—'}
                        </h2>
                        {order.party?.tax_id && (
                            <div className="text-neutral-600 mt-1">
                                <span className="font-semibold">{isRtl ? 'الرقم الضريبي للمورد:' : 'Vendor VAT:'}</span>{' '}
                                <span className="font-mono font-bold">{order.party.tax_id}</span>
                            </div>
                        )}
                        {order.party?.phone && (
                            <div className="text-neutral-600">
                                <span className="font-semibold">{isRtl ? 'الهاتف:' : 'Phone:'}</span>{' '}
                                <span className="font-mono">{order.party.phone}</span>
                            </div>
                        )}
                    </div>

                    <div className="sm:text-end flex flex-col justify-between">
                        <div>
                            <span className="font-bold text-neutral-400 uppercase tracking-wider block mb-1 text-[11px]">
                                {isRtl ? 'حالة الاعتماد' : 'APPROVAL STATUS'}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'approved' 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="capitalize">{order.status}</span>
                            </span>
                            {order.approver && (
                                <p className="text-[11px] text-neutral-500 mt-1">
                                    {isRtl ? 'معتمد من:' : 'Approved by:'} {order.approver.name}
                                </p>
                            )}
                        </div>
                        <div className="text-[11px] text-neutral-500 pt-2">
                            {isRtl ? 'عملة التوريد:' : 'Currency:'} <span className="font-bold text-neutral-800">{order.currency || 'SAR'}</span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200">
                    <table className="w-full text-xs text-start">
                        <thead className="bg-neutral-900 text-white font-semibold uppercase text-[11px]">
                            <tr>
                                <th className="p-3 text-start w-10">#</th>
                                <th className="p-3 text-start">{isRtl ? 'البيان ومواصفات الصنف' : 'Item Description'}</th>
                                <th className="p-3 text-center w-16">{isRtl ? 'الكمية' : 'Qty'}</th>
                                <th className="p-3 text-end w-24">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                                <th className="p-3 text-end w-24">{isRtl ? 'الضريبة' : 'VAT'}</th>
                                <th className="p-3 text-end w-28">{isRtl ? 'الإجمالي' : 'Total (SAR)'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {order.lines.map((line, idx) => (
                                <tr key={line.id} className={idx % 2 === 1 ? 'bg-neutral-50/70' : 'bg-white'}>
                                    <td className="p-3 font-mono text-neutral-500 text-center">{idx + 1}</td>
                                    <td className="p-3">
                                        <p className="font-semibold text-neutral-900">{line.description}</p>
                                        {line.expenseAccount && (
                                            <p className="text-[10px] text-neutral-500 mt-0.5">
                                                {line.expenseAccount.code} - {line.expenseAccount.name_ar || line.expenseAccount.name}
                                            </p>
                                        )}
                                    </td>
                                    <td className="p-3 text-center font-mono font-medium">{Number(line.quantity).toLocaleString()}</td>
                                    <td className="p-3 text-end font-mono">
                                        {Number(line.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-end font-mono text-neutral-600">
                                        {Number(line.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-end font-mono font-bold text-neutral-950">
                                        {Number(line.line_total || line.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Section: Tafqeet and Financial Totals */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-8 border-b border-neutral-200">
                    <div className="md:col-span-6 flex items-center gap-4 bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                        <div className="bg-white p-2 rounded-lg border border-neutral-200 shadow-sm shrink-0">
                            <img
                                src={qrCodeDataUri}
                                alt="Order Verification QR"
                                className="w-24 h-24 object-contain"
                            />
                        </div>
                        <div className="text-xs text-neutral-600 space-y-1">
                            <div className="flex items-center gap-1 font-bold text-neutral-900">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                <span>{isRtl ? 'رمز التحقق من أمر الشراء' : 'PO Verification'}</span>
                            </div>
                            <p className="text-[11px] text-neutral-500 leading-relaxed">
                                {isRtl
                                    ? 'أمر شراء ملزم وصادر من قسم المشتريات وفق الشروط والأسعار المعتمدة.'
                                    : 'Official purchase order issued under approved corporate procurement terms.'}
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-6 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-neutral-200 text-neutral-600">
                            <span>{isRtl ? 'المجموع قبل الضريبة:' : 'Subtotal:'}</span>
                            <span className="font-mono font-semibold text-neutral-900">
                                {Number(order.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="flex justify-between py-1 border-b border-neutral-200 text-neutral-600">
                            <span>{isRtl ? 'ضريبة القيمة المضافة:' : 'VAT:'}</span>
                            <span className="font-mono font-semibold text-neutral-900">
                                {Number(order.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="flex justify-between py-2 border-b-2 border-neutral-900 text-sm font-extrabold text-neutral-950">
                            <span>{isRtl ? 'إجمالي أمر الشراء الصافي:' : 'Total Purchase Order:'}</span>
                            <span className="font-mono text-base">
                                {Number(order.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Amount in words */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 my-6 text-xs text-neutral-800 space-y-1">
                    <div>
                        <span className="font-bold text-neutral-500">{isRtl ? 'المبلغ كتابة:' : 'Amount in Arabic:'}</span>{' '}
                        <span className="font-medium text-neutral-950 font-sans">{amountInWords.ar}</span>
                    </div>
                    <div>
                        <span className="font-bold text-neutral-500">{isRtl ? 'باللغة الإنجليزية:' : 'Amount in English:'}</span>{' '}
                        <span className="font-medium text-neutral-950 font-sans">{amountInWords.en}</span>
                    </div>
                </div>

                {/* Notes & Terms */}
                {order.notes && (
                    <div className="text-xs text-neutral-600 bg-white border border-neutral-200 rounded-xl p-3 mb-6">
                        <span className="font-bold text-neutral-900 block mb-0.5">{isRtl ? 'شروط التوريد والملاحظات:' : 'Terms & Delivery Notes:'}</span>
                        <p>{order.notes}</p>
                    </div>
                )}

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs">
                    <div className="space-y-10 border border-dashed border-neutral-300 rounded-xl p-4">
                        <span className="font-bold text-neutral-600 block">{isRtl ? 'مسئول المشتريات' : 'Procurement Officer'}</span>
                        <div className="text-neutral-400 text-[10px]">____________________</div>
                    </div>

                    <div className="space-y-10 border border-dashed border-neutral-300 rounded-xl p-4">
                        <span className="font-bold text-neutral-600 block">{isRtl ? 'مدير المشتريات / الاعتماد' : 'Procurement Manager'}</span>
                        <div className="text-neutral-400 text-[10px]">____________________</div>
                    </div>

                    <div className="flex flex-col items-center justify-center border border-dashed border-neutral-300 rounded-xl p-4 min-h-[100px]">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center text-center text-[10px] text-neutral-400 p-2">
                            {isRtl ? 'ختم الاعتماد الرسمي' : 'Official Stamp'}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-3 border-t border-neutral-200 text-center text-[10px] text-neutral-400 flex justify-between items-center">
                    <span>{companyName} &bull; {isRtl ? 'أوامر الشراء المعتمدة' : 'Official Purchase Orders'}</span>
                    <span className="font-mono">{order.po_number} &bull; Page 1 of 1</span>
                </div>
            </div>
        </div>
    );
}
