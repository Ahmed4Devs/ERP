import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, X, Percent, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Company {
    name: string;
    name_ar?: string;
    legal_name?: string;
    tax_number?: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface VatReturn {
    id: string;
    return_number: string;
    tax_period: string;
    start_date: string;
    end_date: string;
    status: string;
    standard_sales_amount: string;
    standard_sales_vat: string;
    standard_sales_adjustment: string;
    zero_rated_sales_amount: string;
    exempt_sales_amount: string;
    total_sales_amount: string;
    total_output_vat: string;
    standard_purchases_amount: string;
    standard_purchases_vat: string;
    standard_purchases_adjustment: string;
    imports_vat_amount: string;
    zero_rated_purchases_amount: string;
    exempt_purchases_amount: string;
    total_purchases_amount: string;
    total_input_vat: string;
    net_vat_due: string;
    previous_period_credit: string;
    final_net_payable: string;
    filing_date?: string;
}

interface Props {
    vatReturn: VatReturn;
    company: Company;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function VatReturnsPrint({
    vatReturn,
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

    const netPayable = parseFloat(vatReturn.final_net_payable || '0');

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 sm:px-6 print:bg-white print:p-0 print:m-0">
            <Head title={`Print-VAT-${vatReturn.return_number}`} />

            {/* Print Action Bar */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs border border-neutral-200 dark:border-neutral-800 print:hidden">
                <div className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-indigo-600" />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {isRtl ? 'معاينة وطباعة إقرار ضريبة القيمة المضافة (ZATCA)' : 'ZATCA VAT Return Print Preview'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة الإقرار / PDF' : 'Print / Save PDF'}</span>
                    </Button>
                    <Button onClick={() => window.close()} variant="outline" className="gap-1.5">
                        <X className="h-4 w-4" />
                        <span>{isRtl ? 'إغلاق' : 'Close'}</span>
                    </Button>
                </div>
            </div>

            {/* A4 Sheet */}
            <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-8 sm:p-12 shadow-lg border border-neutral-200 dark:border-neutral-800 print:shadow-none print:border-none print:p-6 print:max-w-none print:w-full">
                {/* Header */}
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
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 space-y-0.5 font-mono">
                            <p className="font-bold text-sm text-indigo-700 dark:text-indigo-400">
                                {isRtl ? `الرقم الضريبي للمكلف: ${company.tax_number || '300000000000003'}` : `VAT Reg Number: ${company.tax_number || '300000000000003'}`}
                            </p>
                            {company.address && <p>{company.address}</p>}
                        </div>
                    </div>

                    <div className="text-end">
                        <div className="inline-block bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 rounded-sm font-bold text-base tracking-wider uppercase mb-3">
                            إقرار ضريبة القيمة المضافة
                            <span className="block text-[11px] font-normal tracking-normal text-neutral-300 dark:text-neutral-600">
                                VALUE ADDED TAX (VAT) RETURN
                            </span>
                        </div>
                        <p className="font-mono font-bold text-base text-neutral-900 dark:text-white">
                            {vatReturn.return_number}
                        </p>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {isRtl ? `الفترة الضريبية: ${vatReturn.tax_period}` : `Tax Period: ${vatReturn.tax_period}`}
                        </p>
                    </div>
                </div>

                {/* Info Strip */}
                <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 mb-6 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <span className="text-neutral-500 block mb-0.5">{isRtl ? 'الفترة الضريبية:' : 'Tax Period:'}</span>
                            <span className="font-bold text-sm font-mono text-neutral-900 dark:text-white">
                                {vatReturn.tax_period}
                            </span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block mb-0.5">{isRtl ? 'من تاريخ إلى تاريخ:' : 'Date Range:'}</span>
                            <span className="font-mono font-semibold">
                                {vatReturn.start_date} → {vatReturn.end_date}
                            </span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block mb-0.5">{isRtl ? 'تاريخ التقديم:' : 'Filing Date:'}</span>
                            <span className="font-mono">
                                {vatReturn.filing_date || vatReturn.end_date}
                            </span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block mb-0.5">{isRtl ? 'حالة الإقرار:' : 'Status:'}</span>
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {vatReturn.status === 'filed' ? (isRtl ? 'معتمد ومقدم رسمياً' : 'Officially Filed') : (isRtl ? 'مسودة' : 'Draft')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Official ZATCA Form 14-Lines Table */}
                <div className="mb-6 space-y-4">
                    <table className="w-full text-start text-xs border-collapse">
                        <thead>
                            <tr className="border-y-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-800 dark:text-neutral-200">
                                <th className="py-2.5 px-3 text-start w-10">#</th>
                                <th className="py-2.5 px-3 text-start">{isRtl ? 'البيان (هيئة الزكاة والضريبة والجمارك)' : 'Description (ZATCA Form)'}</th>
                                <th className="py-2.5 px-3 text-end w-36">{isRtl ? 'المبلغ الخاضع (SAR)' : 'Taxable (SAR)'}</th>
                                <th className="py-2.5 px-3 text-end w-32">{isRtl ? 'التعديل (SAR)' : 'Adjustment'}</th>
                                <th className="py-2.5 px-3 text-end w-36">{isRtl ? 'مبلغ الضريبة (SAR)' : 'VAT (SAR)'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                            {/* Line 1 */}
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/20 font-semibold">
                                <td className="py-2 px-3 font-bold">1</td>
                                <td className="py-2 px-3 font-sans">المبيعات الخاضعة للنسبة الأساسية (Standard rated sales)</td>
                                <td className="py-2 px-3 text-end font-bold">{Number(vatReturn.standard_sales_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-2 px-3 text-end font-bold text-emerald-700 dark:text-emerald-400">{Number(vatReturn.standard_sales_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {/* Line 2 */}
                            <tr>
                                <td className="py-1.5 px-3 text-neutral-400">2</td>
                                <td className="py-1.5 px-3 font-sans text-neutral-500">المبيعات للمواطنين (الخدمات الخاصة المعفاة)</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                            </tr>
                            {/* Line 3 */}
                            <tr>
                                <td className="py-1.5 px-3 text-neutral-400">3</td>
                                <td className="py-1.5 px-3 font-sans text-neutral-500">المبيعات المحلية الخاضعة لنسبة الصفر</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                            </tr>
                            {/* Line 4 */}
                            <tr>
                                <td className="py-1.5 px-3 text-neutral-400">4</td>
                                <td className="py-1.5 px-3 font-sans text-neutral-500">الصادرات (Exports)</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                            </tr>
                            {/* Line 5 */}
                            <tr>
                                <td className="py-1.5 px-3 text-neutral-400">5</td>
                                <td className="py-1.5 px-3 font-sans text-neutral-500">المبيعات المعفاة من الضريبة (Exempt sales)</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                            </tr>
                            {/* Line 6 */}
                            <tr className="border-t border-b-2 border-neutral-300 dark:border-neutral-700 bg-emerald-50/50 dark:bg-emerald-950/20 font-bold">
                                <td className="py-2.5 px-3">6</td>
                                <td className="py-2.5 px-3 font-sans font-black text-emerald-900 dark:text-emerald-300">
                                    إجمالي المبيعات وضريبة المخرجات (Total Sales & Output VAT)
                                </td>
                                <td className="py-2.5 px-3 text-end font-black">{Number(vatReturn.total_sales_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-2.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-2.5 px-3 text-end font-black text-emerald-700 dark:text-emerald-400">{Number(vatReturn.total_output_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>

                            {/* Line 7 */}
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/20 font-semibold">
                                <td className="py-2 px-3 font-bold">7</td>
                                <td className="py-2 px-3 font-sans">المشتريات الخاضعة للنسبة الأساسية (Standard rated purchases)</td>
                                <td className="py-2 px-3 text-end font-bold">{Number(vatReturn.standard_purchases_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-2 px-3 text-end font-bold text-blue-700 dark:text-blue-400">{Number(vatReturn.standard_purchases_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {/* Line 8 */}
                            <tr>
                                <td className="py-1.5 px-3 text-neutral-400">8</td>
                                <td className="py-1.5 px-3 font-sans text-neutral-500">الاستيرادات الخاضعة للضريبة المدفوعة في الجمارك</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                            </tr>
                            {/* Line 9 */}
                            <tr>
                                <td className="py-1.5 px-3 text-neutral-400">9</td>
                                <td className="py-1.5 px-3 font-sans text-neutral-500">الاستيرادات الخاضعة لآلية الاحتساب العكسي</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                            </tr>
                            {/* Line 10 */}
                            <tr>
                                <td className="py-1.5 px-3 text-neutral-400">10</td>
                                <td className="py-1.5 px-3 font-sans text-neutral-500">المشتريات الخاضعة لنسبة الصفر والمشتريات المعفاة</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                            </tr>
                            {/* Line 11 */}
                            <tr className="border-t border-b-2 border-neutral-300 dark:border-neutral-700 bg-blue-50/50 dark:bg-blue-950/20 font-bold">
                                <td className="py-2.5 px-3">11</td>
                                <td className="py-2.5 px-3 font-sans font-black text-blue-900 dark:text-blue-300">
                                    إجمالي المشتريات وضريبة المدخلات (Total Purchases & Input VAT)
                                </td>
                                <td className="py-2.5 px-3 text-end font-black">{Number(vatReturn.total_purchases_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="py-2.5 px-3 text-end text-neutral-400">0.00</td>
                                <td className="py-2.5 px-3 text-end font-black text-blue-700 dark:text-blue-400">{Number(vatReturn.total_input_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>

                            {/* Line 12 */}
                            <tr>
                                <td className="py-2 px-3 font-bold">12</td>
                                <td className="py-2 px-3 font-sans font-bold">صافي الضريبة المستحقة للفترة الحالية (Net VAT Due)</td>
                                <td></td>
                                <td></td>
                                <td className="py-2 px-3 text-end font-bold text-sm">{Number(vatReturn.net_vat_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {/* Line 13 */}
                            <tr>
                                <td className="py-1.5 px-3 text-neutral-400">13</td>
                                <td className="py-1.5 px-3 font-sans text-neutral-500">رصيد دائن مرحل من فترات سابقة (Credit Carried Forward)</td>
                                <td></td>
                                <td></td>
                                <td className="py-1.5 px-3 text-end text-neutral-400">0.00</td>
                            </tr>
                            {/* Line 14 */}
                            <tr className="border-t-2 border-neutral-900 dark:border-neutral-100 bg-indigo-50 dark:bg-indigo-950/40 font-black text-sm">
                                <td className="py-3 px-3">14</td>
                                <td className="py-3 px-3 font-sans text-indigo-900 dark:text-indigo-200">
                                    صافي الضريبة الواجب سدادها / (المستردة) - Net VAT Payable
                                </td>
                                <td></td>
                                <td></td>
                                <td className="py-3 px-3 text-end text-indigo-700 dark:text-indigo-300 text-base">
                                    {netPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Amount in Words & QR Code */}
                <div className="flex justify-between items-end border-t border-neutral-200 dark:border-neutral-800 pt-4 mb-12 text-xs">
                    <div className="max-w-md space-y-1.5">
                        <div>
                            <span className="text-neutral-500">{isRtl ? 'صافي الضريبة كتابة (بالريال السعودي):' : 'Net VAT Amount in Words:'}</span>
                            <p className="font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                                {isRtl ? amountInWords.ar : amountInWords.en}
                            </p>
                        </div>
                        <p className="italic text-[11px] text-neutral-400 pt-1">
                            {isRtl
                                ? 'إقرار المكلف: نقر بأن جميع البيانات والمعلومات الواردة في هذا الإقرار صحيحة وكاملة ومطابقة لدفاتر وسجلات المنشأة وفق نظام ضريبة القيمة المضافة ولوائحه التنفيذية.'
                                : 'Declaration: We declare that the information provided in this VAT return is true, complete, and in accordance with the VAT Law.'}
                        </p>
                    </div>

                    <div className="flex flex-col items-center">
                        <img src={qrCodeDataUri} alt="QR Verification" className="w-24 h-24 border border-neutral-200 dark:border-neutral-700 p-1 rounded" />
                        <span className="text-[10px] text-neutral-400 font-mono mt-1">الاعتماد الضريبي الإلكتروني</span>
                    </div>
                </div>

                {/* Official Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-neutral-900 dark:border-neutral-100 text-center text-xs">
                    <div className="space-y-8">
                        <p className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            {isRtl ? 'إعداد المحاسب القانوني' : 'Prepared by Tax Accountant'}
                        </p>
                        <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                        <p className="text-neutral-500">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                    </div>

                    <div className="space-y-8">
                        <p className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            {isRtl ? 'مراجعة مدير الضرائب' : 'Reviewed by Tax Manager'}
                        </p>
                        <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                        <p className="text-neutral-500">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                    </div>

                    <div className="space-y-8">
                        <p className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            {isRtl ? 'اعتماد المدير المالي والمفوض' : 'Approved by CFO / Signatory'}
                        </p>
                        <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                        <p className="text-neutral-500">{isRtl ? 'التوقيع والختم الرسمي' : 'Signature & Stamp'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
