import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Printer, CheckCircle2, Clock, RotateCcw, AlertTriangle, ShieldCheck, Building2, User, FileText, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface JournalLine {
    id: string;
    account_id: string;
    debit: string;
    credit: string;
    description: string;
    account?: Account;
}

interface JournalEntry {
    id: string;
    entry_number: string;
    date: string;
    description: string;
    lines: JournalLine[];
}

interface LineItem {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    product?: {
        id: string;
        name: string;
        code: string;
    };
    warehouse?: {
        id: string;
        name: string;
    };
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
    status: 'draft' | 'posted';
    posted_at?: string;
    customer?: {
        id: string;
        name: string;
    };
    branch?: {
        id: string;
        name: string;
    };
    invoice?: {
        id: string;
        invoice_number: string;
    };
    lines: LineItem[];
    journal_entry?: JournalEntry;
    costing_journal_entry?: JournalEntry;
}

interface Props {
    creditNote: CreditNote;
}

export default function CreditNotesShow({ creditNote }: Props) {
    const { isRtl } = useTranslation();

    const handlePost = () => {
        if (confirm(isRtl ? 'هل أنت متأكد من ترحيل هذا الإشعار الدائن وعكس الإيراد وضريبة القيمة المضافة واسترداد المخزون؟' : 'Are you sure you want to post this credit note? This will reverse revenue, output VAT and restock inventory.')) {
            router.post(`/sales/credit-notes/${creditNote.id}/post`);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${isRtl ? 'إشعار دائن' : 'Credit Note'} ${creditNote.credit_note_number}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <Link href="/sales/credit-notes">
                            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                                {creditNote.credit_note_number}
                            </h1>
                            {creditNote.status === 'posted' ? (
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {isRtl ? 'مرحل ومقفل' : 'Posted'}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="h-3.5 w-3.5" />
                                    {isRtl ? 'مسودة' : 'Draft'}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {isRtl ? 'تاريخ التحرير:' : 'Issued Date:'} {creditNote.date}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/sales/credit-notes/${creditNote.id}/print`}>
                            <Printer className="h-4 w-4" />
                            {isRtl ? 'طباعة رسمية (A4)' : 'Print Voucher'}
                        </Link>
                    </Button>

                    {creditNote.status === 'draft' && (
                        <Button
                            onClick={handlePost}
                            className="bg-rose-600 hover:bg-rose-700 text-white gap-2 shadow-sm"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            {isRtl ? 'ترحيل الإشعار وعكس القيود' : 'Post & Reverse GL'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {isRtl ? 'بيانات العميل' : 'Customer'}
                    </span>
                    <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {creditNote.customer?.name || '—'}
                    </div>
                    {creditNote.invoice && (
                        <div className="text-xs text-neutral-500">
                            {isRtl ? 'مرتبط بفاتورة:' : 'Linked Invoice:'} <span className="font-mono text-rose-600">{creditNote.invoice.invoice_number}</span>
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {isRtl ? 'الفرع والسبب' : 'Branch & Reason'}
                    </span>
                    <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {creditNote.branch?.name || (isRtl ? 'المركز الرئيسي' : 'Headquarters')}
                    </div>
                    <div className="text-xs text-neutral-500 truncate" title={creditNote.reason}>
                        {creditNote.reason || (isRtl ? 'مردودات مبيعات عامة' : 'General sales return')}
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                        <RotateCcw className="h-3.5 w-3.5 text-rose-600" />
                        {isRtl ? 'صافي المردود' : 'Total Amount'}
                    </span>
                    <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                        {parseFloat(creditNote.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-neutral-500">{isRtl ? 'ر.س' : 'SAR'}</span>
                    </div>
                    <div className="text-xs text-neutral-500">
                        {isRtl ? 'شامل ضريبة:' : 'Inc. VAT:'} {parseFloat(creditNote.tax_amount).toFixed(2)} SAR
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'تفاصيل الأصناف والكميات المرتجعة' : 'Returned Items & Quantities'}
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="py-3 px-4 text-start">#</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'الصنف' : 'Product'}</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'المستودع المستلم' : 'Warehouse'}</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'الوصف' : 'Description'}</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'الكمية' : 'Qty'}</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'الضريبة' : 'VAT'}</th>
                                <th className="py-3 px-4 text-end">{isRtl ? 'الإجمالي' : 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {creditNote.lines.map((line, idx) => (
                                <tr key={line.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                                    <td className="py-3 px-4 text-neutral-400">{idx + 1}</td>
                                    <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                                        {line.product ? `${line.product.name} (${line.product.code})` : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                        {line.warehouse?.name || (isRtl ? 'بدون إرجاع' : 'None')}
                                    </td>
                                    <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                        {line.description}
                                    </td>
                                    <td className="py-3 px-4 font-mono font-medium">
                                        {parseFloat(line.quantity)}
                                    </td>
                                    <td className="py-3 px-4 font-mono">
                                        {parseFloat(line.unit_price).toFixed(2)}
                                    </td>
                                    <td className="py-3 px-4 font-mono text-neutral-500">
                                        {parseFloat(line.tax_amount).toFixed(2)} ({parseFloat(line.tax_rate) * 100}%)
                                    </td>
                                    <td className="py-3 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100 text-end">
                                        {parseFloat(line.total).toFixed(2)} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Subtotals & Taxes Footer */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                    <div className="w-full sm:w-72 space-y-2 text-sm">
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>{isRtl ? 'المجموع بدون الضريبة:' : 'Subtotal:'}</span>
                            <span className="font-mono">{parseFloat(creditNote.subtotal).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>{isRtl ? 'ضريبة القيمة المضافة:' : 'VAT Amount:'}</span>
                            <span className="font-mono">{parseFloat(creditNote.tax_amount).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-neutral-900 dark:text-neutral-100 border-t pt-2 dark:border-neutral-700">
                            <span>{isRtl ? 'إجمالي المردود المستحق:' : 'Net Credited:'}</span>
                            <span className="font-mono text-rose-600 dark:text-rose-400">{parseFloat(creditNote.total).toFixed(2)} SAR</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accounting GL Impact (if posted) */}
            {creditNote.status === 'posted' && creditNote.journal_entry && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b pb-3 dark:border-neutral-800">
                        <Landmark className="h-5 w-5 text-indigo-600" />
                        <span>{isRtl ? 'قيود اليومية الآلية (الأثر المالي المحاسبي)' : 'Automated GL Journal Entries'}</span>
                        <span className="text-xs font-mono font-normal text-neutral-400">({creditNote.journal_entry.entry_number})</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-medium">
                                <tr>
                                    <th className="py-2 px-3 text-start">{isRtl ? 'رقم الحساب' : 'Account Code'}</th>
                                    <th className="py-2 px-3 text-start">{isRtl ? 'اسم الحساب' : 'Account Name'}</th>
                                    <th className="py-2 px-3 text-start">{isRtl ? 'البيان' : 'Description'}</th>
                                    <th className="py-2 px-3 text-end">{isRtl ? 'مدين (DR)' : 'Debit'}</th>
                                    <th className="py-2 px-3 text-end">{isRtl ? 'دائن (CR)' : 'Credit'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {creditNote.journal_entry.lines.map((jl) => (
                                    <tr key={jl.id}>
                                        <td className="py-2 px-3 font-mono font-medium text-indigo-600">{jl.account?.code}</td>
                                        <td className="py-2 px-3 font-medium text-neutral-800 dark:text-neutral-200">
                                            {isRtl && jl.account?.name_ar ? jl.account.name_ar : jl.account?.name}
                                        </td>
                                        <td className="py-2 px-3 text-neutral-500">{jl.description}</td>
                                        <td className="py-2 px-3 font-mono text-end font-semibold text-emerald-600">
                                            {parseFloat(jl.debit) > 0 ? parseFloat(jl.debit).toFixed(2) : '—'}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-end font-semibold text-rose-600">
                                            {parseFloat(jl.credit) > 0 ? parseFloat(jl.credit).toFixed(2) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
