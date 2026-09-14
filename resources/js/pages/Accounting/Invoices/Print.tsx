import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, Printer, ShieldCheck, Building2, CheckCircle2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    code: string;
    name: string;
    name_ar?: string;
}

interface InvoiceLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    revenueAccount?: Account;
}

interface Invoice {
    id: string;
    invoice_number: string;
    date: string;
    due_date: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    amount_paid: string;
    balance_due: string;
    status: 'draft' | 'posted' | 'partially_paid' | 'paid' | 'reversed';
    notes?: string;
    created_at?: string;
    party: {
        id: string;
        name: string;
        name_ar?: string;
        tax_id?: string;
        email?: string;
        phone?: string;
    };
    lines: InvoiceLine[];
}

interface Company {
    name: string;
    legal_name?: string;
    tax_number?: string;
    currency?: string;
    settings?: {
        cr_number?: string;
        address?: string;
        phone?: string;
        email?: string;
    };
}

interface Props {
    invoice: Invoice;
    company: Company | null;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
    backUrl?: string;
}

export default function InvoicePrint({ invoice, company, qrCodeDataUri, amountInWords, backUrl }: Props) {
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
            <Head title={`فاتورة ضريبية - ${invoice.invoice_number}`} />

            {/* Print Action Toolbar (Hidden on paper/PDF) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={backUrl || `/invoices/${invoice.id}`}>
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة للتفاصيل' : 'Back to Invoice'}</span>
                        </Link>
                    </Button>
                    <div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                            {invoice.invoice_number}
                        </span>
                        <span className="text-xs text-neutral-500 block">
                            {isRtl ? 'معاينة الطباعة الرسمية القياسية (A4)' : 'Official Print Preview (A4 standard)'}
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

            {/* Printable A4 Sheet */}
            <div 
                id="printable-invoice"
                className="max-w-4xl mx-auto bg-white text-neutral-900 border border-neutral-200 shadow-md print:shadow-none print:border-none rounded-2xl print:rounded-none p-10 sm:p-12 print:p-0 transition-all font-sans"
                style={{ minHeight: '297mm' }}
            >
                {/* Official Letterhead Header */}
                <div className="border-b-2 border-neutral-900 pb-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                        {/* Company Identity */}
                        <div className="space-y-1.5 max-w-sm text-start">
                            <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-extrabold tracking-tight text-neutral-950 leading-tight">
                                        {companyName}
                                    </h1>
                                    <p className="text-xs text-neutral-500 font-medium">
                                        Enterprise Cloud ERP Platform
                                    </p>
                                </div>
                            </div>

                            <div className="text-xs text-neutral-600 space-y-0.5 pt-2">
                                <div>
                                    <span className="font-semibold">{isRtl ? 'الرقم الضريبي:' : 'VAT Number:'}</span>{' '}
                                    <span className="font-mono font-bold text-neutral-900">{taxNumber}</span>
                                </div>
                                <div>
                                    <span className="font-semibold">{isRtl ? 'السجل التجاري:' : 'CR Number:'}</span>{' '}
                                    <span className="font-mono">{crNumber}</span>
                                </div>
                                <div className="text-neutral-500">
                                    {company?.settings?.address || (isRtl ? 'المملكة العربية السعودية - الرياض' : 'Riyadh, Kingdom of Saudi Arabia')}
                                </div>
                            </div>
                        </div>

                        {/* Title & Document Badge */}
                        <div className="text-start sm:text-end space-y-1">
                            <div className="inline-block bg-neutral-950 text-white px-4 py-1.5 rounded-lg text-sm font-bold tracking-wider uppercase">
                                {isRtl ? 'فاتورة ضريبية' : 'TAX INVOICE'}
                            </div>
                            <div className="text-xs font-semibold text-neutral-500 tracking-wide">
                                ZATCA PHASE 2 COMPLIANT
                            </div>
                            <div className="pt-2 text-xs space-y-1 text-neutral-700">
                                <div>
                                    <span className="text-neutral-500">{isRtl ? 'رقم الفاتورة:' : 'Invoice No:'}</span>{' '}
                                    <span className="font-mono font-bold text-neutral-950 text-sm">{invoice.invoice_number}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-500">{isRtl ? 'تاريخ الإصدار:' : 'Issue Date:'}</span>{' '}
                                    <span className="font-mono">{invoice.date}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-500">{isRtl ? 'تاريخ الاستحقاق:' : 'Due Date:'}</span>{' '}
                                    <span className="font-mono">{invoice.due_date}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client / Buyer Box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 border border-neutral-200 rounded-xl p-5 mb-6 text-xs">
                    <div>
                        <span className="font-bold text-neutral-400 uppercase tracking-wider block mb-1 text-[11px]">
                            {isRtl ? 'بيانات العميل / المشتري (Bill To)' : 'CUSTOMER / BUYER DETAILS'}
                        </span>
                        <h2 className="text-sm font-bold text-neutral-950">
                            {invoice.party?.name_ar || invoice.party?.name}
                        </h2>
                        {invoice.party?.name_ar && invoice.party?.name && (
                            <p className="text-neutral-600 mt-0.5">{invoice.party.name}</p>
                        )}
                        <div className="mt-2 space-y-0.5 text-neutral-600">
                            {invoice.party?.tax_id && (
                                <div>
                                    <span className="font-semibold">{isRtl ? 'الرقم الضريبي للعميل:' : 'Customer VAT:'}</span>{' '}
                                    <span className="font-mono font-bold text-neutral-900">{invoice.party.tax_id}</span>
                                </div>
                            )}
                            {invoice.party?.phone && (
                                <div>
                                    <span className="font-semibold">{isRtl ? 'الهاتف:' : 'Phone:'}</span>{' '}
                                    <span className="font-mono">{invoice.party.phone}</span>
                                </div>
                            )}
                            {invoice.party?.email && (
                                <div>
                                    <span className="font-semibold">{isRtl ? 'البريد:' : 'Email:'}</span>{' '}
                                    <span>{invoice.party.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sm:text-end flex flex-col justify-between">
                        <div>
                            <span className="font-bold text-neutral-400 uppercase tracking-wider block mb-1 text-[11px]">
                                {isRtl ? 'حالة السداد والاعتماد' : 'PAYMENT STATUS'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="capitalize">{invoice.status.replace('_', ' ')}</span>
                            </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 pt-2">
                            {isRtl ? 'العملة الأساسية:' : 'Base Currency:'} <span className="font-bold text-neutral-800">SAR (ريال سعودي)</span>
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200">
                    <table className="w-full text-xs text-start">
                        <thead className="bg-neutral-900 text-white font-semibold uppercase text-[11px]">
                            <tr>
                                <th className="p-3 text-start w-10">#</th>
                                <th className="p-3 text-start">{isRtl ? 'البيان وتفاصيل الخدمة' : 'Item & Description'}</th>
                                <th className="p-3 text-center w-16">{isRtl ? 'الكمية' : 'Qty'}</th>
                                <th className="p-3 text-end w-24">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                                <th className="p-3 text-end w-24">{isRtl ? 'الضريبة (15%)' : 'VAT (15%)'}</th>
                                <th className="p-3 text-end w-28">{isRtl ? 'المجموع الشامل' : 'Total (SAR)'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {invoice.lines.map((line, idx) => (
                                <tr key={line.id} className={idx % 2 === 1 ? 'bg-neutral-50/70' : 'bg-white'}>
                                    <td className="p-3 font-mono text-neutral-500 text-center">{idx + 1}</td>
                                    <td className="p-3">
                                        <p className="font-semibold text-neutral-900">{line.description}</p>
                                        {line.revenueAccount && (
                                            <p className="text-[10px] text-neutral-500 mt-0.5">
                                                {line.revenueAccount.code} - {line.revenueAccount.name_ar || line.revenueAccount.name}
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
                                        {Number(line.total || (Number(line.subtotal) + Number(line.tax_amount))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Section: QR Code, Tafqeet, and Totals Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pb-8 border-b border-neutral-200">
                    {/* Left: QR Code & ZATCA Certification */}
                    <div className="md:col-span-6 flex items-center gap-4 bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                        <div className="bg-white p-2 rounded-lg border border-neutral-200 shadow-sm shrink-0">
                            <img
                                src={qrCodeDataUri}
                                alt="ZATCA Tax QR Code"
                                className="w-28 h-28 object-contain"
                            />
                        </div>
                        <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-neutral-950 text-xs">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                <span>{isRtl ? 'رمز التحقق الضريبي (ZATCA)' : 'ZATCA E-Invoice QR'}</span>
                            </div>
                            <p className="text-[11px] text-neutral-500 leading-relaxed">
                                {isRtl
                                    ? 'فاتورة ضريبية رسمية مشفرة بهيئة الزكاة والضريبة والجمارك (المرحلة 1 و 2) متوافقة مع متطلبات الفوترة الإلكترونية بالمملكة.'
                                    : 'Compliant with Saudi ZATCA electronic invoicing Phase 1 & 2 integration specifications.'}
                            </p>
                        </div>
                    </div>

                    {/* Right: Totals Breakdown */}
                    <div className="md:col-span-6 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-neutral-200 text-neutral-600">
                            <span>{isRtl ? 'المجموع الخاضع للضريبة (غير شامل الضريبة):' : 'Total Taxable Amount (Excl. VAT):'}</span>
                            <span className="font-mono font-semibold text-neutral-900">
                                {Number(invoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="flex justify-between py-1 border-b border-neutral-200 text-neutral-600">
                            <span>{isRtl ? 'ضريبة القيمة المضافة (15%):' : 'Value Added Tax (15%):'}</span>
                            <span className="font-mono font-semibold text-neutral-900">
                                {Number(invoice.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="flex justify-between py-2 border-b-2 border-neutral-900 text-sm font-extrabold text-neutral-950">
                            <span>{isRtl ? 'إجمالي الفاتورة الشامل للضريبة:' : 'Total Amount Due (Incl. VAT):'}</span>
                            <span className="font-mono text-base">
                                {Number(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="flex justify-between py-1 text-neutral-600">
                            <span>{isRtl ? 'المبلغ المدفوع / المسدد:' : 'Amount Paid:'}</span>
                            <span className="font-mono font-medium text-emerald-700">
                                {Number(invoice.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="flex justify-between py-1 border-t border-neutral-200 font-bold text-neutral-900">
                            <span>{isRtl ? 'الرصيد المتبقي المستحق:' : 'Balance Due:'}</span>
                            <span className="font-mono text-amber-700">
                                {Number(invoice.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tafqeet Amount in Words */}
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

                {/* Notes (if any) */}
                {invoice.notes && (
                    <div className="text-xs text-neutral-600 bg-white border border-neutral-200 rounded-xl p-3 mb-6">
                        <span className="font-bold text-neutral-900 block mb-0.5">{isRtl ? 'ملاحظات وشروط الدفع:' : 'Notes & Payment Terms:'}</span>
                        <p>{invoice.notes}</p>
                    </div>
                )}

                {/* Signatures & Official Stamp Area */}
                <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs">
                    <div className="space-y-10 border border-dashed border-neutral-300 rounded-xl p-4">
                        <span className="font-bold text-neutral-600 block">{isRtl ? 'إعداد المحاسب' : 'Prepared By'}</span>
                        <div className="text-neutral-400 text-[10px]">____________________</div>
                    </div>

                    <div className="space-y-10 border border-dashed border-neutral-300 rounded-xl p-4">
                        <span className="font-bold text-neutral-600 block">{isRtl ? 'اعتماد الإدارة المالية' : 'Financial Approval'}</span>
                        <div className="text-neutral-400 text-[10px]">____________________</div>
                    </div>

                    <div className="flex flex-col items-center justify-center border border-dashed border-neutral-300 rounded-xl p-4 min-h-[100px]">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center text-center text-[10px] text-neutral-400 p-2">
                            {isRtl ? 'الختم الرسمي للمنشأة' : 'Official Stamp'}
                        </div>
                    </div>
                </div>

                {/* Print Document Footer */}
                <div className="mt-10 pt-4 border-t border-neutral-200 text-center text-[10px] text-neutral-400 flex justify-between items-center">
                    <span>{companyName} &bull; {isRtl ? 'نظام إدارة الموارد السحابي' : 'Cloud Enterprise ERP'}</span>
                    <span className="font-mono">{invoice.invoice_number} &bull; Page 1 of 1</span>
                </div>
            </div>
        </div>
    );
}
