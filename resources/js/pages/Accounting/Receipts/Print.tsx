import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, Printer, Building2, CheckCircle2, ShieldCheck, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    code: string;
    name: string;
    name_ar?: string;
}

interface InvoiceAllocation {
    id: string;
    amount: string;
    invoice?: {
        invoice_number: string;
        date: string;
        total: string;
    };
}

interface Receipt {
    id: string;
    receipt_number: string;
    date: string;
    amount: string;
    unallocated_amount: string;
    payment_method: 'cash' | 'bank_transfer' | 'check' | string;
    notes?: string;
    party?: {
        name: string;
        name_ar?: string;
        tax_id?: string;
        phone?: string;
    };
    depositAccount?: Account;
    allocations?: InvoiceAllocation[];
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
    receipt: Receipt;
    company: Company | null;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function ReceiptPrint({ receipt, company, qrCodeDataUri, amountInWords }: Props) {
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

    const formatPaymentMethod = (method: string) => {
        switch (method) {
            case 'cash':
                return isRtl ? 'نقداً (Cash)' : 'Cash';
            case 'bank_transfer':
                return isRtl ? 'تحويل بنكي (Bank Transfer)' : 'Bank Transfer';
            case 'check':
                return isRtl ? 'شيك مصرفي (Cheque)' : 'Cheque';
            default:
                return method.replace('_', ' ').toUpperCase();
        }
    };

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 print:bg-white print:p-0">
            <Head title={`سند قبض - ${receipt.receipt_number}`} />

            {/* Print Action Toolbar (Hidden on print) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href="/receipts">
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة لسندات القبض' : 'Back to Receipts'}</span>
                        </Link>
                    </Button>
                    <div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                            {receipt.receipt_number}
                        </span>
                        <span className="text-xs text-neutral-500 block">
                            {isRtl ? 'معاينة سند القبض المالي المعتمد' : 'Official Payment Receipt Voucher'}
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

            {/* Printable Voucher Paper */}
            <div
                className="max-w-4xl mx-auto bg-white text-neutral-900 border border-neutral-200 shadow-md print:shadow-none print:border-none rounded-2xl print:rounded-none p-10 sm:p-12 print:p-0 font-sans"
            >
                {/* Official Letterhead Header */}
                <div className="border-b-2 border-neutral-900 pb-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        {/* Company Details */}
                        <div className="space-y-1 text-start">
                            <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-extrabold tracking-tight text-neutral-950">
                                        {companyName}
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-medium">
                                        Department of Finance & Treasury
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

                        {/* Voucher Badge & Metadata */}
                        <div className="text-start sm:text-end space-y-1.5">
                            <div className="inline-block bg-neutral-950 text-white px-5 py-2 rounded-lg text-sm font-bold tracking-wider uppercase">
                                {isRtl ? 'سند قبض مالي معتمد' : 'PAYMENT RECEIPT VOUCHER'}
                            </div>
                            <div className="pt-1 text-xs space-y-1 text-neutral-700">
                                <div>
                                    <span className="text-neutral-500">{isRtl ? 'رقم السند:' : 'Receipt No:'}</span>{' '}
                                    <span className="font-mono font-bold text-neutral-950 text-sm">{receipt.receipt_number}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-500">{isRtl ? 'تاريخ السند:' : 'Date:'}</span>{' '}
                                    <span className="font-mono font-medium">{receipt.date}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Amount Highlight Box */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-neutral-50 border-2 border-neutral-900 rounded-xl p-5 mb-6 gap-4">
                    <div>
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
                            {isRtl ? 'المبلغ المستلم الإجمالي' : 'TOTAL RECEIVED AMOUNT'}
                        </span>
                        <div className="text-2xl sm:text-3xl font-black font-mono text-neutral-950 mt-0.5">
                            {Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-sans font-bold text-neutral-600">SAR</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-end">
                            <span className="text-xs text-neutral-500 block">{isRtl ? 'طريقة القبض / السداد' : 'Payment Method'}</span>
                            <span className="text-sm font-bold text-neutral-900">{formatPaymentMethod(receipt.payment_method)}</span>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-white border border-neutral-300 flex items-center justify-center">
                            <Banknote className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                </div>

                {/* Voucher Narrative Statement */}
                <div className="space-y-4 text-xs sm:text-sm bg-white border border-neutral-200 rounded-xl p-6 mb-6 leading-relaxed">
                    <div className="flex items-baseline gap-2 border-b border-neutral-100 pb-3">
                        <span className="font-bold text-neutral-500 w-32 shrink-0">
                            {isRtl ? 'استلمنا من المكرم:' : 'Received From:'}
                        </span>
                        <span className="font-bold text-neutral-950 text-base">
                            {receipt.party?.name_ar || receipt.party?.name || '—'}
                        </span>
                        {receipt.party?.tax_id && (
                            <span className="text-xs text-neutral-500 font-mono">
                                ({isRtl ? 'الرقم الضريبي:' : 'VAT:'} {receipt.party.tax_id})
                            </span>
                        )}
                    </div>

                    <div className="flex items-baseline gap-2 border-b border-neutral-100 pb-3">
                        <span className="font-bold text-neutral-500 w-32 shrink-0">
                            {isRtl ? 'مبلغاً وقدره:' : 'Amount in Words:'}
                        </span>
                        <div className="space-y-0.5">
                            <span className="font-bold text-neutral-950 font-sans block">{amountInWords.ar}</span>
                            <span className="text-xs text-neutral-500 font-sans block italic">{amountInWords.en}</span>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-2 border-b border-neutral-100 pb-3">
                        <span className="font-bold text-neutral-500 w-32 shrink-0">
                            {isRtl ? 'وذلك لقاء:' : 'Being in Payment Of:'}
                        </span>
                        <span className="text-neutral-900 font-medium">
                            {receipt.notes || (isRtl ? 'سداد مستحقات فواتير مبيعات وخدمات للعميل' : 'Settlement of outstanding invoices and service billing')}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-neutral-500 w-32 shrink-0">
                            {isRtl ? 'أودع في حساب:' : 'Deposited To:'}
                        </span>
                        <span className="font-mono font-medium text-neutral-800">
                            {receipt.depositAccount ? `${receipt.depositAccount.code} - ${receipt.depositAccount.name_ar || receipt.depositAccount.name}` : 'الصندوق الرئيسي / البنك'}
                        </span>
                    </div>
                </div>

                {/* Allocations Table (if receipt was applied to invoices) */}
                {receipt.allocations && receipt.allocations.length > 0 && (
                    <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200">
                        <div className="bg-neutral-100 px-4 py-2 border-b border-neutral-200 font-bold text-xs text-neutral-700">
                            {isRtl ? 'جدول تسوية الفواتير المربوطة بالسند' : 'Invoice Allocations Breakdown'}
                        </div>
                        <table className="w-full text-xs">
                            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase text-[10px]">
                                <tr>
                                    <th className="p-2.5 text-start">{isRtl ? 'رقم الفاتورة' : 'Invoice No'}</th>
                                    <th className="p-2.5 text-start">{isRtl ? 'تاريخ الفاتورة' : 'Date'}</th>
                                    <th className="p-2.5 text-end">{isRtl ? 'إجمالي الفاتورة' : 'Total Invoice'}</th>
                                    <th className="p-2.5 text-end">{isRtl ? 'المبلغ المسدد بهذا السند' : 'Allocated Amount'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {receipt.allocations.map((alloc) => (
                                    <tr key={alloc.id}>
                                        <td className="p-2.5 font-mono font-bold text-neutral-950">
                                            {alloc.invoice?.invoice_number || '—'}
                                        </td>
                                        <td className="p-2.5 font-mono text-neutral-500">
                                            {alloc.invoice?.date || '—'}
                                        </td>
                                        <td className="p-2.5 text-end font-mono text-neutral-600">
                                            {alloc.invoice ? `${Number(alloc.invoice.total).toLocaleString()} SAR` : '—'}
                                        </td>
                                        <td className="p-2.5 text-end font-mono font-bold text-emerald-700">
                                            {Number(alloc.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* QR Code and Official Note */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-neutral-200 pt-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-1.5 rounded-lg border border-neutral-200 shadow-sm shrink-0">
                            <img
                                src={qrCodeDataUri}
                                alt="Receipt Verification QR"
                                className="w-20 h-20 object-contain"
                            />
                        </div>
                        <div className="text-xs text-neutral-500 space-y-1 max-w-sm">
                            <div className="flex items-center gap-1 font-bold text-neutral-900">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                <span>{isRtl ? 'سند مالي رسمي موثق' : 'Certified Financial Voucher'}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed">
                                {isRtl
                                    ? 'هذا السند معتمد في السجلات المحاسبية الرسمية للمنشأة، ويعتبر إبراء ذمة بالمبلغ المحدد أعلاه فقط.'
                                    : 'Certified in the official financial general ledger. Constitutes discharge of liability for the stated amount only.'}
                            </p>
                        </div>
                    </div>

                    <div className="text-end text-xs text-neutral-500">
                        <div><span className="font-semibold">{isRtl ? 'المبلغ غير المخصص:' : 'Unallocated:'}</span> <span className="font-mono font-bold">{Number(receipt.unallocated_amount || 0).toFixed(2)} SAR</span></div>
                    </div>
                </div>

                {/* Four-tier Official Signatures */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-center text-xs">
                    <div className="space-y-12 border border-dashed border-neutral-300 rounded-xl p-3">
                        <span className="font-bold text-neutral-600 block">{isRtl ? 'المستلم / أمين الصندوق' : 'Receiver / Cashier'}</span>
                        <div className="text-neutral-400 text-[10px]">________________</div>
                    </div>

                    <div className="space-y-12 border border-dashed border-neutral-300 rounded-xl p-3">
                        <span className="font-bold text-neutral-600 block">{isRtl ? 'المحاسب المالي' : 'Accountant'}</span>
                        <div className="text-neutral-400 text-[10px]">________________</div>
                    </div>

                    <div className="space-y-12 border border-dashed border-neutral-300 rounded-xl p-3">
                        <span className="font-bold text-neutral-600 block">{isRtl ? 'المدير المالي' : 'Finance Manager'}</span>
                        <div className="text-neutral-400 text-[10px]">________________</div>
                    </div>

                    <div className="flex flex-col items-center justify-center border border-dashed border-neutral-300 rounded-xl p-3 min-h-[90px]">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center text-center text-[9px] text-neutral-400 p-1">
                            {isRtl ? 'ختم القبض الرسمي' : 'Official Stamp'}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-3 border-t border-neutral-200 text-center text-[10px] text-neutral-400 flex justify-between items-center">
                    <span>{companyName} &bull; {isRtl ? 'سندات القبض المعتمدة' : 'Official Receipts'}</span>
                    <span className="font-mono">{receipt.receipt_number} &bull; Page 1 of 1</span>
                </div>
            </div>
        </div>
    );
}
