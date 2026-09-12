import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, Printer, Building2, CheckCircle2, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    code: string;
    name: string;
    name_ar?: string;
}

interface BillLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    tax_amount?: string;
    line_total?: string;
    expenseAccount?: Account;
}

interface JournalLine {
    id: string;
    account: Account;
    debit: string;
    credit: string;
}

interface JournalEntry {
    entry_number: string;
    lines: JournalLine[];
}

interface VendorBill {
    id: string;
    bill_number: string;
    vendor_invoice_ref?: string;
    bill_date?: string;
    date?: string;
    due_date: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    amount_paid: string;
    balance_due: string;
    status: 'draft' | 'posted' | 'partially_paid' | 'paid' | 'cancelled';
    notes?: string;
    party?: {
        name: string;
        name_ar?: string;
        tax_id?: string;
        phone?: string;
    };
    purchaseOrder?: {
        order_number: string;
    };
    lines: BillLine[];
    journalEntry?: JournalEntry;
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
    bill: VendorBill;
    company: Company | null;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function VendorBillPrint({ bill, company, qrCodeDataUri, amountInWords }: Props) {
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

    const billDate = bill.bill_date || bill.date || new Date().toISOString().split('T')[0];

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 print:bg-white print:p-0">
            <Head title={`فاتورة مورد - ${bill.bill_number}`} />

            {/* Print Action Toolbar (Hidden on print) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/vendor-bills/${bill.id}`}>
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة لتفاصيل الفاتورة' : 'Back to Bill'}</span>
                        </Link>
                    </Button>
                    <div>
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 font-mono">
                            {bill.bill_number}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handlePrint}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة الفاتورة / PDF' : 'Print Bill / PDF'}</span>
                    </Button>
                </div>
            </div>

            {/* A4 Sheet Container */}
            <div className="max-w-4xl mx-auto bg-white text-neutral-900 p-8 sm:p-12 rounded-2xl shadow-xl border border-neutral-200 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:max-w-full">
                
                {/* Header: Company & Title */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-8 gap-4">
                    <div className="space-y-1.5 text-start">
                        <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-lg">
                                <FileSpreadsheet className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-neutral-900">
                                {companyName}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-600">
                            {locale === 'ar' ? 'إدارة المشتريات والحسابات الدائنة' : 'Purchasing & Accounts Payable Management'}
                        </p>
                        <div className="text-xs text-neutral-500 font-mono space-y-0.5 pt-1">
                            <div>الرقم الضريبي / Tax ID: <span className="font-semibold text-neutral-800">{taxNumber}</span></div>
                            <div>السجل التجاري / CR: <span className="font-semibold text-neutral-800">{crNumber}</span></div>
                        </div>
                    </div>

                    {/* Voucher Badge & Status */}
                    <div className="text-end space-y-2">
                        <div className="inline-block bg-blue-50 text-blue-900 border-2 border-blue-600 px-4 py-2 rounded-xl">
                            <h1 className="text-lg sm:text-xl font-black tracking-wide">فاتورة شراء معتمدة</h1>
                            <p className="text-xs font-semibold tracking-wider uppercase text-blue-700">Official Vendor Bill</p>
                        </div>
                        <div className="text-xs text-neutral-600 space-y-1 font-mono pt-1">
                            <div>رقم الفاتورة بالنظام / No: <span className="font-bold text-base text-neutral-900">{bill.bill_number}</span></div>
                            <div>تاريخ الفاتورة / Date: <span className="font-semibold text-neutral-800">{billDate}</span></div>
                            <div>تاريخ الاستحقاق / Due: <span className="font-semibold text-neutral-800">{bill.due_date}</span></div>
                        </div>
                    </div>
                </div>

                {/* Vendor & Bill References Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                            بيانات المورد (Vendor Information)
                        </h2>
                        <div className="text-sm font-bold text-neutral-900 text-base">
                            {locale === 'ar' ? (bill.party?.name_ar || bill.party?.name) : (bill.party?.name || bill.party?.name_ar)}
                        </div>
                        <div className="text-xs text-neutral-600 space-y-1">
                            <div>الرقم الضريبي للمورد: <span className="font-mono font-semibold text-neutral-800">{bill.party?.tax_id || '—'}</span></div>
                            {bill.party?.phone && <div>الهاتف: <span className="font-mono">{bill.party.phone}</span></div>}
                        </div>
                    </div>

                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                            مراجع المستند (Document References)
                        </h2>
                        <div className="text-xs text-neutral-700 space-y-1.5">
                            <div>رقم فاتورة المورد الأصلية: <span className="font-mono font-bold text-neutral-900">{bill.vendor_invoice_ref || '—'}</span></div>
                            {bill.purchaseOrder && (
                                <div>مرجع أمر الشراء (PO): <span className="font-mono font-bold text-blue-700">{bill.purchaseOrder.order_number}</span></div>
                            )}
                            {bill.journalEntry && (
                                <div>رقم القيد المحاسبي المولد: <span className="font-mono font-semibold text-neutral-800">{bill.journalEntry.entry_number}</span></div>
                            )}
                            <div>حالة المستند: <span className="font-semibold uppercase text-emerald-700">{bill.status}</span></div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden mb-6">
                    <table className="w-full text-xs text-start">
                        <thead className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                            <tr>
                                <th className="p-3 text-start">#</th>
                                <th className="p-3 text-start">الوصف / البند (Description)</th>
                                <th className="p-3 text-start">حساب المصروف (Expense Account)</th>
                                <th className="p-3 text-center">الكمية (Qty)</th>
                                <th className="p-3 text-end">سعر الوحدة (Price)</th>
                                <th className="p-3 text-end">الإجمالي (Total)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {bill.lines.map((line, idx) => {
                                const qty = parseFloat(line.quantity || '1');
                                const price = parseFloat(line.unit_price || '0');
                                const lineSub = qty * price;
                                return (
                                    <tr key={line.id || idx}>
                                        <td className="p-3 font-mono text-neutral-500">{idx + 1}</td>
                                        <td className="p-3 font-medium text-neutral-900">{line.description}</td>
                                        <td className="p-3 text-neutral-600">
                                            {line.expenseAccount ? `${line.expenseAccount.code} - ${locale === 'ar' ? (line.expenseAccount.name_ar || line.expenseAccount.name) : line.expenseAccount.name}` : '—'}
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold">{qty}</td>
                                        <td className="p-3 text-end font-mono">{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="p-3 text-end font-mono font-bold text-neutral-900">
                                            {lineSub.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Totals & Tafqeet Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 items-start">
                    <div className="space-y-3">
                        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5">
                            <span className="text-xs font-bold text-neutral-600 block">المبلغ كتابةً (Tafqeet):</span>
                            <div className="text-sm font-bold text-neutral-900">{amountInWords.ar}</div>
                            <div className="text-xs text-neutral-600 italic border-t border-neutral-200 pt-1.5">{amountInWords.en}</div>
                        </div>

                        {bill.notes && (
                            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                                <span className="font-bold text-neutral-600 block">ملاحظات:</span>
                                <p className="text-neutral-700">{bill.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between text-neutral-600">
                            <span>المجموع الفرعي (Subtotal):</span>
                            <span className="font-mono font-semibold text-neutral-900">
                                {Number(bill.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                        <div className="flex justify-between text-neutral-600">
                            <span>ضريبة القيمة المضافة ({Number(bill.tax_rate) * 100}% VAT):</span>
                            <span className="font-mono font-semibold text-neutral-900">
                                {Number(bill.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                        <div className="border-t-2 border-neutral-300 pt-2 flex justify-between text-sm font-bold text-neutral-900">
                            <span>إجمالي الفاتورة شامل الضريبة (Total):</span>
                            <span className="font-mono font-black text-blue-700 text-base">
                                {Number(bill.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                        <div className="border-t border-neutral-200 pt-2 flex justify-between text-neutral-600">
                            <span>المبلغ المدفوع (Amount Paid):</span>
                            <span className="font-mono text-emerald-700 font-semibold">
                                {Number(bill.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                        <div className="flex justify-between font-bold text-neutral-900">
                            <span>الرصيد المستحق (Balance Due):</span>
                            <span className="font-mono text-amber-700 font-black">
                                {Number(bill.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signatures & Official Approvals Block */}
                <div className="border-t-2 border-neutral-200 pt-8 mt-8">
                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">مستلم الفاتورة / أمين المخزن<br /><span className="text-[10px] text-neutral-400 font-normal">Received By</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والتاريخ</span>
                        </div>
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">محاسب المشتريات والذمم الدائنة<br /><span className="text-[10px] text-neutral-400 font-normal">Accounts Payable Accountant</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والتاريخ</span>
                        </div>
                        <div className="space-y-12">
                            <span className="text-xs font-bold text-neutral-700 block">المدير المالي / الاعتماد<br /><span className="text-[10px] text-neutral-400 font-normal">Financial Controller Approval</span></span>
                            <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                            <span className="text-[10px] text-neutral-500 block">التوقيع والختم</span>
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
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                                <span>فاتورة شراء ومصروفات معتمدة برمجياً</span>
                            </div>
                            <p className="text-[11px] text-neutral-500">تم التوليد والترحيل آلياً لدفاتر الأستاذ العام</p>
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
