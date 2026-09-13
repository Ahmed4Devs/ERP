import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, X, RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

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
    code: string;
    name: string;
}

interface CreditNoteLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    product?: Product;
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

interface CreditNote {
    id: string;
    credit_note_number: string;
    date: string;
    reason?: string;
    notes?: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    status: string;
    customer?: Party;
    branch?: {
        id: string;
        name: string;
    };
    lines: CreditNoteLine[];
}

interface Props {
    creditNote: CreditNote;
    company: Company;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function CreditNotesPrint({
    creditNote,
    company,
    qrCodeDataUri,
    amountInWords,
}: Props) {
    const { isRtl } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 sm:px-6 print:p-0 print:bg-white text-neutral-900">
            <Head title={`${creditNote.credit_note_number} - ${isRtl ? 'إشعار دائن رسمي' : 'Tax Credit Note'}`} />

            {/* Print Controls Bar */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
                        <Printer className="h-4 w-4" />
                        {isRtl ? 'طباعة الإشعار الدائن' : 'Print Credit Note'}
                    </Button>
                    <Button variant="outline" onClick={() => window.close()}>
                        <X className="h-4 w-4" />
                        {isRtl ? 'إغلاق' : 'Close'}
                    </Button>
                </div>
                <div className="text-xs text-neutral-500">
                    {isRtl ? 'إشعار ضريبي دائن معتمد وفق متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA)' : 'ZATCA Compliant Tax Credit Note'}
                </div>
            </div>

            {/* A4 Sheet Container */}
            <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-lg shadow-sm border border-neutral-200 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full">
                {/* Header with Bilingual Names and QR */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-6">
                    <div className="space-y-1 text-start">
                        <h1 className="text-xl sm:text-2xl font-black text-neutral-900">
                            {company.name_ar || company.name}
                        </h1>
                        <p className="text-sm font-semibold text-neutral-600">
                            {company.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                            {company.address}
                        </p>
                        <div className="text-xs font-mono font-medium pt-1">
                            {isRtl ? 'الرقم الضريبي:' : 'VAT No:'} <span className="font-bold">{company.tax_number || '300000000000003'}</span>
                        </div>
                    </div>

                    <div className="text-center flex flex-col items-center">
                        <div className="inline-block border-2 border-rose-600 text-rose-600 px-4 py-1 font-black text-base sm:text-lg uppercase tracking-wider rounded">
                            {isRtl ? 'إشعار دائن ضريبي' : 'TAX CREDIT NOTE'}
                        </div>
                        <div className="text-xs font-mono text-neutral-500 mt-1">
                            {creditNote.credit_note_number}
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        {qrCodeDataUri && (
                            <img
                                src={qrCodeDataUri}
                                alt="ZATCA QR Code"
                                className="w-24 h-24 sm:w-28 sm:h-28 border border-neutral-300 p-1 rounded"
                            />
                        )}
                        <span className="text-[10px] text-neutral-400 mt-1 font-mono">
                            ZATCA e-Invoice Spec
                        </span>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-6 bg-neutral-50 p-4 rounded border border-neutral-200 text-xs mb-6">
                    <div className="space-y-1.5 text-start">
                        <div className="font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-200 pb-1 mb-1">
                            {isRtl ? 'بيانات العميل / المشتري' : 'Customer / Buyer Details'}
                        </div>
                        <div className="font-semibold text-sm text-neutral-900">{creditNote.customer?.name}</div>
                        {creditNote.customer?.tax_id && (
                            <div>{isRtl ? 'الرقم الضريبي:' : 'VAT ID:'} <span className="font-mono">{creditNote.customer.tax_id}</span></div>
                        )}
                        {creditNote.customer?.phone && (
                            <div>{isRtl ? 'الهاتف:' : 'Phone:'} {creditNote.customer.phone}</div>
                        )}
                        {creditNote.customer?.address && (
                            <div>{isRtl ? 'العنوان:' : 'Address:'} {creditNote.customer.address}</div>
                        )}
                    </div>

                    <div className="space-y-1.5 text-start">
                        <div className="font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-200 pb-1 mb-1">
                            {isRtl ? 'تفاصيل الإشعار' : 'Credit Note Details'}
                        </div>
                        <div>{isRtl ? 'رقم الإشعار:' : 'Note #:'} <span className="font-mono font-bold">{creditNote.credit_note_number}</span></div>
                        <div>{isRtl ? 'تاريخ التحرير:' : 'Issue Date:'} <span className="font-mono">{creditNote.date}</span></div>
                        <div>{isRtl ? 'سبب الإشعار:' : 'Reason:'} <span>{creditNote.reason || (isRtl ? 'مردودات مبيعات' : 'Sales return')}</span></div>
                        <div>{isRtl ? 'الفرع:' : 'Branch:'} <span>{creditNote.branch?.name || (isRtl ? 'المركز الرئيسي' : 'HQ')}</span></div>
                    </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full text-xs text-start mb-6 border border-neutral-300">
                    <thead className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-700">
                        <tr>
                            <th className="py-2.5 px-3 text-start border-e border-neutral-300">#</th>
                            <th className="py-2.5 px-3 text-start border-e border-neutral-300">{isRtl ? 'الصنف والوصف' : 'Item & Description'}</th>
                            <th className="py-2.5 px-3 text-center border-e border-neutral-300 w-20">{isRtl ? 'الكمية' : 'Qty'}</th>
                            <th className="py-2.5 px-3 text-end border-e border-neutral-300 w-28">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                            <th className="py-2.5 px-3 text-end border-e border-neutral-300 w-24">{isRtl ? 'الضريبة (15%)' : 'VAT (15%)'}</th>
                            <th className="py-2.5 px-3 text-end w-32">{isRtl ? 'الإجمالي' : 'Total (SAR)'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {creditNote.lines.map((line, idx) => (
                            <tr key={line.id}>
                                <td className="py-2 px-3 text-center border-e border-neutral-200 text-neutral-400">{idx + 1}</td>
                                <td className="py-2 px-3 border-e border-neutral-200">
                                    <div className="font-bold text-neutral-900">{line.product?.name || line.description}</div>
                                    {line.product && <div className="text-[10px] text-neutral-500 font-mono">{line.product.code}</div>}
                                </td>
                                <td className="py-2 px-3 text-center font-mono border-e border-neutral-200 font-medium">
                                    {parseFloat(line.quantity)}
                                </td>
                                <td className="py-2 px-3 text-end font-mono border-e border-neutral-200">
                                    {parseFloat(line.unit_price).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-end font-mono border-e border-neutral-200">
                                    {parseFloat(line.tax_amount).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-end font-mono font-bold">
                                    {parseFloat(line.total).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals Breakdown & Tafqeet */}
                <div className="grid grid-cols-2 gap-4 items-start mb-8">
                    <div className="border border-neutral-200 p-3 rounded text-xs space-y-1">
                        <div className="font-bold text-neutral-700">{isRtl ? 'المبلغ بالحروف (تفقيط):' : 'Amount in Words:'}</div>
                        <div className="text-neutral-800 font-medium">{amountInWords.ar}</div>
                        <div className="text-neutral-500 italic font-sans">{amountInWords.en}</div>
                    </div>

                    <div className="border border-neutral-300 rounded overflow-hidden text-xs">
                        <div className="flex justify-between py-2 px-3 border-b border-neutral-200">
                            <span className="text-neutral-600">{isRtl ? 'المجموع غير شامل الضريبة:' : 'Subtotal Excl. VAT:'}</span>
                            <span className="font-mono font-semibold">{parseFloat(creditNote.subtotal).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between py-2 px-3 border-b border-neutral-200">
                            <span className="text-neutral-600">{isRtl ? 'ضريبة القيمة المضافة (15%):' : 'Total VAT (15%):'}</span>
                            <span className="font-mono font-semibold">{parseFloat(creditNote.tax_amount).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between py-2.5 px-3 bg-neutral-100 font-bold text-sm">
                            <span className="text-neutral-900">{isRtl ? 'إجمالي المردود المستحق الدائن:' : 'Total Credited Amount:'}</span>
                            <span className="font-mono text-rose-700">{parseFloat(creditNote.total).toFixed(2)} SAR</span>
                        </div>
                    </div>
                </div>

                {/* Signatures & Approvals */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-neutral-200 text-center text-xs">
                    <div>
                        <div className="text-neutral-500 mb-10">{isRtl ? 'إعداد المحاسب المسؤول' : 'Prepared By'}</div>
                        <div className="border-t border-neutral-400 pt-1 font-medium">{isRtl ? 'التوقيع / التاريخ' : 'Signature / Date'}</div>
                    </div>
                    <div>
                        <div className="text-neutral-500 mb-10">{isRtl ? 'اعتماد المدير المالي' : 'Financial Manager Approval'}</div>
                        <div className="border-t border-neutral-400 pt-1 font-medium">{isRtl ? 'التوقيع / الختم' : 'Signature / Stamp'}</div>
                    </div>
                    <div>
                        <div className="text-neutral-500 mb-10">{isRtl ? 'استلام وتوقيع العميل' : 'Customer Acceptance'}</div>
                        <div className="border-t border-neutral-400 pt-1 font-medium">{isRtl ? 'الاسم / التوقيع' : 'Name / Signature'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
