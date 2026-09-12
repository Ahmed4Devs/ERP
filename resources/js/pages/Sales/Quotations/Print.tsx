import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, Printer, Building2, CheckCircle2, ShieldCheck, FileCheck, Calendar, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
}

interface QuotationLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    discount_amount: string;
    tax_amount: string;
    line_total: string;
    product?: Product;
}

interface Quotation {
    id: string;
    quote_number: string;
    issue_date: string;
    valid_until: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    discount_amount: string;
    total_amount: string;
    status: string;
    terms_and_conditions?: string;
    notes?: string;
    customer?: {
        name: string;
        name_ar?: string;
        tax_id?: string;
        phone?: string;
        email?: string;
    };
    lines: QuotationLine[];
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
    quotation: Quotation;
    company: Company | null;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function SalesQuotationPrint({ quotation, company, qrCodeDataUri, amountInWords }: Props) {
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
            <Head title={`عرض سعر - ${quotation.quote_number}`} />

            {/* Print Action Toolbar */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/sales/quotations/${quotation.id}`}>
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة لتفاصيل العرض' : 'Back to Quotation'}</span>
                        </Link>
                    </Button>
                    <div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                            {quotation.quote_number}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handlePrint}
                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة عرض السعر / PDF' : 'Print Quotation / PDF'}</span>
                    </Button>
                </div>
            </div>

            {/* A4 Sheet Container */}
            <div className="max-w-4xl mx-auto bg-white text-neutral-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-neutral-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-full">
                
                {/* Header: Company & Title */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-8 gap-4">
                    <div className="space-y-1.5 text-start">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-lg">
                                <FileCheck className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-neutral-900">
                                {companyName}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-600">
                            {locale === 'ar' ? 'عروض الأسعار والمبيعات التجارية المعتمدة' : 'Official Commercial Sales & Quotations'}
                        </p>
                        <div className="text-xs text-neutral-500 font-mono space-y-0.5 pt-1">
                            <div>الرقم الضريبي / Tax ID: <span className="font-semibold text-neutral-800">{taxNumber}</span></div>
                            <div>السجل التجاري / CR: <span className="font-semibold text-neutral-800">{crNumber}</span></div>
                        </div>
                    </div>

                    {/* Badge & Meta */}
                    <div className="text-end space-y-2">
                        <div className="inline-block bg-indigo-50 text-indigo-900 border-2 border-indigo-600 px-4 py-2 rounded-xl">
                            <h1 className="text-lg sm:text-xl font-black tracking-wide">عرض أسعار رسمي</h1>
                            <p className="text-xs font-semibold tracking-wider uppercase text-indigo-700">Official Sales Quotation</p>
                        </div>
                        <div className="text-xs text-neutral-600 space-y-1 font-mono pt-1">
                            <div>رقم العرض / Quote No: <span className="font-bold text-base text-neutral-900">{quotation.quote_number}</span></div>
                            <div>تاريخ الإصدار / Issue Date: <span className="font-semibold text-neutral-800">{quotation.issue_date}</span></div>
                            <div className="text-indigo-700 font-bold">صالح حتى / Valid Until: {quotation.valid_until}</div>
                        </div>
                    </div>
                </div>

                {/* Customer Details Box */}
                <div className="mb-8 p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        مقدَم إلى السادة / Quotation Prepared For:
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-1">
                        <div>
                            <span className="text-xs text-neutral-500 block">اسم العميل / Customer Name:</span>
                            <span className="font-bold text-neutral-900 text-base">
                                {locale === 'ar' ? (quotation.customer?.name_ar || quotation.customer?.name) : (quotation.customer?.name || quotation.customer?.name_ar)}
                            </span>
                        </div>
                        <div>
                            <span className="text-xs text-neutral-500 block">الرقم الضريبي للعميل / Customer Tax ID:</span>
                            <span className="font-mono font-semibold text-neutral-800">
                                {quotation.customer?.tax_id || '—'}
                            </span>
                        </div>
                        {quotation.customer?.phone && (
                            <div>
                                <span className="text-xs text-neutral-500 block">الهاتف / Phone:</span>
                                <span className="font-mono text-neutral-800">{quotation.customer.phone}</span>
                            </div>
                        )}
                        {quotation.customer?.email && (
                            <div>
                                <span className="text-xs text-neutral-500 block">البريد الإلكتروني / Email:</span>
                                <span className="font-mono text-neutral-800">{quotation.customer.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quotation Lines Table */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden mb-6">
                    <table className="w-full text-xs text-start">
                        <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                            <tr>
                                <th className="p-3 text-start">#</th>
                                <th className="p-3 text-start">المنتج / البند (Item & Description)</th>
                                <th className="p-3 text-center">الكمية (Qty)</th>
                                <th className="p-3 text-end">سعر الوحدة (Unit Price)</th>
                                <th className="p-3 text-end">الخصم (Discount)</th>
                                <th className="p-3 text-end">الضريبة 15% (VAT)</th>
                                <th className="p-3 text-end">الإجمالي (Total)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {quotation.lines.map((line, idx) => (
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
                                    <td className="p-3 text-end font-mono text-neutral-500">{Number(line.discount_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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

                        {quotation.terms_and_conditions && (
                            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                                <span className="font-bold text-neutral-700 block">الشروط والأحكام (Terms & Conditions):</span>
                                <p className="text-neutral-600 whitespace-pre-line leading-relaxed">{quotation.terms_and_conditions}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between text-neutral-600">
                            <span>المجموع الفرعي (Subtotal):</span>
                            <span className="font-mono font-semibold text-neutral-900">
                                {Number(quotation.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                        {parseFloat(quotation.discount_amount || '0') > 0 && (
                            <div className="flex justify-between text-rose-600">
                                <span>إجمالي الخصم (Discount):</span>
                                <span className="font-mono font-semibold">
                                    -{Number(quotation.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-neutral-600">
                            <span>ضريبة القيمة المضافة ({Number(quotation.tax_rate) * 100}% VAT):</span>
                            <span className="font-mono font-semibold text-neutral-900">
                                {Number(quotation.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                        <div className="border-t-2 border-neutral-300 pt-2 flex justify-between text-sm font-bold text-neutral-900">
                            <span>الإجمالي الكلي لعرض السعر (Grand Total):</span>
                            <span className="font-mono font-black text-indigo-700 text-lg">
                                {Number(quotation.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signatures & Approvals */}
                <div className="border-t-2 border-neutral-200 pt-8 mt-8">
                    <div className="grid grid-cols-2 gap-8 text-center">
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">إعداد واعتماد قسم المبيعات<br /><span className="text-[10px] text-neutral-400 font-normal">Sales Department Representative</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والتاريخ وختم الشركة</span>
                        </div>
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">موافقة وقبول العميل<br /><span className="text-[10px] text-neutral-400 font-normal">Customer Acceptance & Authorization</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">اسم المفوض / التوقيع / الختم</span>
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
                                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                                <span>عرض أسعار تجاري معتمد إلكترونياً</span>
                            </div>
                            <p className="text-[11px] text-neutral-500">تعتبر الأسعار صالحة ومؤكدة حتى تاريخ انتهاء الصلاحية المحدد أعلاه</p>
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
