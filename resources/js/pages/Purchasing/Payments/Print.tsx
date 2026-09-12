import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, Printer, Building2, CheckCircle2, ShieldCheck, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    code: string;
    name: string;
    name_ar?: string;
}

interface BillAllocation {
    id: string;
    allocated_amount?: string;
    amount?: string;
    bill?: {
        bill_number: string;
        vendor_invoice_ref?: string;
        date?: string;
        bill_date?: string;
        total: string;
    };
}

interface Payment {
    id: string;
    payment_number: string;
    date?: string;
    payment_date?: string;
    amount: string;
    payment_method: 'cash' | 'bank_transfer' | 'check' | string;
    notes?: string;
    party?: {
        name: string;
        name_ar?: string;
        tax_id?: string;
        phone?: string;
    };
    paymentAccount?: Account;
    allocations?: BillAllocation[];
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
    payment: Payment;
    company: Company | null;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function VendorPaymentPrint({ payment, company, qrCodeDataUri, amountInWords }: Props) {
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

    const paymentDate = payment.payment_date || payment.date || new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 print:bg-white print:p-0">
            <Head title={`سند صرف - ${payment.payment_number}`} />

            {/* Print Action Toolbar (Hidden on print) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href="/vendor-payments">
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة لسندات الصرف' : 'Back to Payments'}</span>
                        </Link>
                    </Button>
                    <div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                            {payment.payment_number}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handlePrint}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة السند / PDF' : 'Print Voucher / PDF'}</span>
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
                                <Banknote className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-neutral-900">
                                {companyName}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-600">
                            {locale === 'ar' ? 'حلول تخطيط موارد المؤسسات المتطورة' : 'Enterprise Resource Planning Platform'}
                        </p>
                        <div className="text-xs text-neutral-500 font-mono space-y-0.5 pt-1">
                            <div>الرقم الضريبي / Tax ID: <span className="font-semibold text-neutral-800">{taxNumber}</span></div>
                            <div>السجل التجاري / CR: <span className="font-semibold text-neutral-800">{crNumber}</span></div>
                        </div>
                    </div>

                    {/* Voucher Badge & Status */}
                    <div className="text-end space-y-2">
                        <div className="inline-block bg-emerald-50 text-emerald-900 border-2 border-emerald-600 px-4 py-2 rounded-xl">
                            <h1 className="text-lg sm:text-xl font-black tracking-wide">سند صرف رسمي</h1>
                            <p className="text-xs font-semibold tracking-wider uppercase text-emerald-700">Official Payment Voucher</p>
                        </div>
                        <div className="text-xs text-neutral-600 space-y-1 font-mono pt-1">
                            <div>رقم السند / No: <span className="font-bold text-base text-neutral-900">{payment.payment_number}</span></div>
                            <div>تاريخ الصرف / Date: <span className="font-semibold text-neutral-800">{paymentDate}</span></div>
                        </div>
                    </div>
                </div>

                {/* Voucher Highlighted Amount Card */}
                <div className="mb-8 p-6 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-center sm:text-start space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                            المبلغ المصروف / Disbursed Amount
                        </span>
                        <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                            <span className="text-4xl font-black text-emerald-950 font-mono">
                                {Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-base font-bold text-emerald-800">ريال سعودي / SAR</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-s border-emerald-200 pt-4 sm:pt-0 sm:ps-6">
                        <div className="text-xs space-y-1">
                            <div className="text-neutral-500">طريقة الصرف / Payment Method:</div>
                            <div className="font-bold text-neutral-900 text-sm">{formatPaymentMethod(payment.payment_method)}</div>
                            <div className="text-neutral-500 pt-1">من حساب / Paid From:</div>
                            <div className="font-semibold text-neutral-900 text-xs">
                                {locale === 'ar' ? (payment.paymentAccount?.name_ar || payment.paymentAccount?.name || 'حساب الخزينة / البنك') : (payment.paymentAccount?.name || 'Treasury / Bank Account')}
                                <span className="text-neutral-500 font-mono ms-1">({payment.paymentAccount?.code || '1110'})</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Amount In Words (Tafqeet) */}
                <div className="mb-8 p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                    <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-neutral-600 whitespace-nowrap pt-0.5">المبلغ بالحروف:</span>
                        <span className="text-sm font-semibold text-neutral-900">{amountInWords.ar}</span>
                    </div>
                    <div className="flex items-start gap-2 border-t border-neutral-200/80 pt-2">
                        <span className="text-xs font-bold text-neutral-500 whitespace-nowrap pt-0.5">Amount in Words:</span>
                        <span className="text-xs font-medium text-neutral-700 italic">{amountInWords.en}</span>
                    </div>
                </div>

                {/* Beneficiary Details */}
                <div className="mb-8 p-5 bg-white border border-neutral-200 rounded-xl shadow-sm">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                        بيانات المستفيد / المورد (Beneficiary Details)
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-xs text-neutral-500 block">يُصرف لأمر السادة / Pay To:</span>
                            <span className="font-bold text-neutral-900 text-base">
                                {locale === 'ar' ? (payment.party?.name_ar || payment.party?.name || 'غير محدد') : (payment.party?.name || payment.party?.name_ar || 'N/A')}
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-neutral-500 block">الرقم الضريبي للمورد / Vendor Tax ID:</span>
                            <span className="font-mono font-semibold text-neutral-800">
                                {payment.party?.tax_id || '—'}
                            </span>
                        </div>
                        {payment.party?.phone && (
                            <div>
                                <span className="text-xs text-neutral-500 block">رقم الاتصال / Phone:</span>
                                <span className="font-mono text-neutral-800">{payment.party.phone}</span>
                            </div>
                        )}
                        {payment.notes && (
                            <div className="sm:col-span-2 pt-2 border-t border-neutral-100">
                                <span className="text-xs text-neutral-500 block">البيان / ملاحظات الصرف:</span>
                                <span className="text-sm text-neutral-800">{payment.notes}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Allocated Bills Table */}
                {payment.allocations && payment.allocations.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                            تسوية الفواتير والمطالبات (Allocated Vendor Bills)
                        </h2>
                        <div className="border border-neutral-200 rounded-xl overflow-hidden">
                            <table className="w-full text-xs text-start">
                                <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                                    <tr>
                                        <th className="p-3 text-start">#</th>
                                        <th className="p-3 text-start">رقم فاتورة المورد / Bill No</th>
                                        <th className="p-3 text-start">مرجع الفاتورة / Ref</th>
                                        <th className="p-3 text-end">إجمالي الفاتورة</th>
                                        <th className="p-3 text-end">المبلغ المسدد / Allocated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200">
                                    {payment.allocations.map((alloc, idx) => (
                                        <tr key={alloc.id || idx}>
                                            <td className="p-3 font-mono text-neutral-500">{idx + 1}</td>
                                            <td className="p-3 font-mono font-bold text-neutral-800">{alloc.bill?.bill_number || '—'}</td>
                                            <td className="p-3 font-mono text-neutral-600">{alloc.bill?.vendor_invoice_ref || '—'}</td>
                                            <td className="p-3 text-end font-mono">
                                                {alloc.bill?.total ? `${Number(alloc.bill.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR` : '—'}
                                            </td>
                                            <td className="p-3 text-end font-mono font-bold text-emerald-700">
                                                {Number(alloc.allocated_amount || alloc.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Signatures & Official Approvals Block */}
                <div className="border-t-2 border-neutral-200 pt-8 mt-12">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">المحاسب المسئول<br /><span className="text-[10px] text-neutral-400 font-normal">Prepared By</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والتاريخ</span>
                        </div>
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">المدير المالي<br /><span className="text-[10px] text-neutral-400 font-normal">Reviewed By</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والتاريخ</span>
                        </div>
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">المفوض بالصرف<br /><span className="text-[10px] text-neutral-400 font-normal">Authorized Signature</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والتاريخ</span>
                        </div>
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">توقيع المستلم<br /><span className="text-[10px] text-neutral-400 font-normal">Beneficiary Signature</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">الاسم / الهوية / التوقيع</span>
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
                                <span>سند صرف مالي إلكتروني موثق</span>
                            </div>
                            <p className="text-[11px] text-neutral-500">تم التوليد آلياً من منصة ERP المالية والمحاسبية</p>
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
