import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Receipt, ArrowLeft, Plus, Trash2, Calculator, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface Custody {
    id: string;
    custody_number: string;
    amount: string;
    current_balance: string;
    purpose: string;
    employee?: {
        first_name: string;
        last_name: string;
        employee_number: string;
    };
}

interface Props {
    custody: Custody;
    expenseAccounts: Account[];
}

interface ExpenseLineForm {
    expense_account_id: string;
    vendor_name: string;
    vendor_tax_number: string;
    invoice_number: string;
    invoice_date: string;
    subtotal: string;
    tax_rate: number;
    description: string;
}

export default function CustodySettle({ custody, expenseAccounts }: Props) {
    const { isRtl } = useTranslation();

    const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
    const [lines, setLines] = useState<ExpenseLineForm[]>([
        {
            expense_account_id: expenseAccounts[0]?.id || '',
            vendor_name: '',
            vendor_tax_number: '',
            invoice_number: '',
            invoice_date: new Date().toISOString().split('T')[0],
            subtotal: '',
            tax_rate: 0.15,
            description: '',
        },
    ]);

    const [refundAmount, setRefundAmount] = useState('0');
    const [reimbursementAmount, setReimbursementAmount] = useState('0');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddLine = () => {
        setLines([
            ...lines,
            {
                expense_account_id: expenseAccounts[0]?.id || '',
                vendor_name: '',
                vendor_tax_number: '',
                invoice_number: '',
                invoice_date: new Date().toISOString().split('T')[0],
                subtotal: '',
                tax_rate: 0.15,
                description: '',
            },
        ]);
    };

    const handleRemoveLine = (idx: number) => {
        if (lines.length > 1) {
            setLines(lines.filter((_, i) => i !== idx));
        }
    };

    const handleLineChange = (idx: number, field: keyof ExpenseLineForm, val: any) => {
        const updated = [...lines];
        updated[idx] = { ...updated[idx], [field]: val };
        setLines(updated);
    };

    // Calculate totals
    const totalSubtotal = lines.reduce((acc, l) => acc + (parseFloat(l.subtotal) || 0), 0);
    const totalTax = lines.reduce((acc, l) => acc + ((parseFloat(l.subtotal) || 0) * (l.tax_rate || 0)), 0);
    const totalClaimed = totalSubtotal + totalTax;
    const currentBalanceNum = parseFloat(custody.current_balance || '0');
    const diff = currentBalanceNum - totalClaimed;

    const handleAutoSetRefund = () => {
        if (diff > 0) {
            setRefundAmount(diff.toFixed(2));
            setReimbursementAmount('0');
        } else if (diff < 0) {
            setReimbursementAmount(Math.abs(diff).toFixed(2));
            setRefundAmount('0');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(`/hr/custodies/${custody.id}/settle`, {
            settlement_date: settlementDate,
            refund_amount: refundAmount,
            reimbursement_amount: reimbursementAmount,
            notes,
            lines: lines.map((l) => ({
                expense_account_id: l.expense_account_id,
                vendor_name: l.vendor_name,
                vendor_tax_number: l.vendor_tax_number || null,
                invoice_number: l.invoice_number || null,
                invoice_date: l.invoice_date || null,
                subtotal: l.subtotal,
                tax_rate: l.tax_rate,
                description: l.description,
            })),
        }, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={isRtl ? `تسوية العهدة #${custody.custody_number}` : `Settle Custody #${custody.custody_number}`} />

            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                    <Link href={`/hr/custodies/${custody.id}`}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Receipt className="h-6 w-6 text-indigo-600" />
                        {isRtl ? `تسوية فواتير ومصروفات العهدة #${custody.custody_number}` : `Settle Expenses for Custody #${custody.custody_number}`}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        {custody.employee?.first_name} {custody.employee?.last_name} &bull; {isRtl ? 'الرصيد القائم:' : 'Current Balance:'}{' '}
                        <span className="font-mono font-bold text-amber-600">{Number(custody.current_balance).toFixed(2)} SAR</span>
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Settlement Date & Header */}
                <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            {isRtl ? 'تاريخ تسوية السند *' : 'Settlement Date *'}
                        </label>
                        <Input
                            type="date"
                            required
                            value={settlementDate}
                            onChange={(e) => setSettlementDate(e.target.value)}
                            className="mt-1 font-mono text-sm"
                        />
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-1">
                        <div className="flex justify-between gap-6">
                            <span className="text-neutral-500">{isRtl ? 'مبلغ العهدة الأصلي:' : 'Original Float:'}</span>
                            <span className="font-mono font-bold">{Number(custody.amount).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between gap-6">
                            <span className="text-neutral-500">{isRtl ? 'الرصيد المتبقي الحالي:' : 'Current Balance:'}</span>
                            <span className="font-mono font-bold text-amber-600">{Number(custody.current_balance).toFixed(2)} SAR</span>
                        </div>
                    </div>
                </div>

                {/* Expense Lines Card */}
                <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
                    <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-indigo-600" />
                            {isRtl ? 'بنود فواتير المصروفات وضريبة القيمة المضافة (15% VAT)' : 'Expense Invoices & 15% VAT Breakdown'}
                        </h3>
                        <Button type="button" onClick={handleAddLine} size="sm" variant="outline" className="gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                            <Plus className="h-4 w-4" />
                            <span>{isRtl ? 'إضافة فاتورة / بند' : 'Add Line'}</span>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {lines.map((line, idx) => {
                            const sub = parseFloat(line.subtotal) || 0;
                            const tax = sub * (line.tax_rate || 0);
                            const total = sub + tax;

                            return (
                                <div
                                    key={idx}
                                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-neutral-500">
                                            {isRtl ? `فاتورة بند #${idx + 1}` : `Invoice Line #${idx + 1}`}
                                        </span>
                                        {lines.length > 1 && (
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleRemoveLine(idx)}
                                                className="h-7 w-7 text-rose-600 hover:text-rose-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                                                {isRtl ? 'حساب المصروف *' : 'Expense Account *'}
                                            </label>
                                            <select
                                                required
                                                value={line.expense_account_id}
                                                onChange={(e) => handleLineChange(idx, 'expense_account_id', e.target.value)}
                                                className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-xs font-mono"
                                            >
                                                {expenseAccounts.map((acc) => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.code} - {acc.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                                                {isRtl ? 'اسم المورد / المتجر *' : 'Vendor / Store Name *'}
                                            </label>
                                            <Input
                                                required
                                                type="text"
                                                value={line.vendor_name}
                                                onChange={(e) => handleLineChange(idx, 'vendor_name', e.target.value)}
                                                placeholder={isRtl ? 'مثال: شركة المواد الفنية' : 'e.g. Modern Logistics Ltd'}
                                                className="mt-1 text-xs"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                                                {isRtl ? 'الرقم الضريبي للمورد (15 رقم لزاتكا)' : 'Vendor Tax # (15 digits)'}
                                            </label>
                                            <Input
                                                type="text"
                                                value={line.vendor_tax_number}
                                                onChange={(e) => handleLineChange(idx, 'vendor_tax_number', e.target.value)}
                                                placeholder="300000000000003"
                                                className="mt-1 text-xs font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                        <div>
                                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                                                {isRtl ? 'رقم الفاتورة الضريبية' : 'Invoice Number'}
                                            </label>
                                            <Input
                                                type="text"
                                                value={line.invoice_number}
                                                onChange={(e) => handleLineChange(idx, 'invoice_number', e.target.value)}
                                                placeholder="INV-9821"
                                                className="mt-1 text-xs font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                                                {isRtl ? 'المبلغ قبل الضريبة (SAR) *' : 'Subtotal (SAR) *'}
                                            </label>
                                            <Input
                                                required
                                                type="number"
                                                step="any"
                                                min="0.01"
                                                value={line.subtotal}
                                                onChange={(e) => handleLineChange(idx, 'subtotal', e.target.value)}
                                                placeholder="0.00"
                                                className="mt-1 text-xs font-mono font-bold"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                                                {isRtl ? 'نسبة الضريبة' : 'VAT Rate'}
                                            </label>
                                            <select
                                                value={line.tax_rate}
                                                onChange={(e) => handleLineChange(idx, 'tax_rate', parseFloat(e.target.value))}
                                                className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-xs font-mono"
                                            >
                                                <option value={0.15}>15% (ضريبة قياسية سعودية)</option>
                                                <option value={0.0}>0% (معفى / بدون ضريبة)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                                                {isRtl ? 'الإجمالي الشامل للضريبة' : 'Line Total'}
                                            </label>
                                            <div className="mt-1 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-mono font-bold text-xs text-neutral-900 dark:text-neutral-100 flex justify-between">
                                                <span>{total.toFixed(2)} SAR</span>
                                                <span className="text-[10px] text-indigo-600">({tax.toFixed(2)} VAT)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                                            {isRtl ? 'وصف المصروف والغرض *' : 'Expense Description *'}
                                        </label>
                                        <Input
                                            required
                                            type="text"
                                            value={line.description}
                                            onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                                            placeholder={isRtl ? 'مثال: شراء كوابل وتوصيلات كهربائية للموقع' : 'e.g. Electrical wiring and cables for project'}
                                            className="mt-1 text-xs"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Clearance, Refunds & Summary Card */}
                <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-indigo-600" />
                            {isRtl ? 'ملخص المطالبة وإخلاء الطرف' : 'Claim Summary & Clearance'}
                        </span>
                        <Button type="button" onClick={handleAutoSetRefund} size="sm" variant="outline" className="text-xs">
                            {isRtl ? 'احتساب الفارق تلقائياً' : 'Auto Calculate Clearance'}
                        </Button>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                            <p className="text-xs text-neutral-500">{isRtl ? 'صافي المصروفات' : 'Net Expenses'}</p>
                            <p className="text-lg font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                                {totalSubtotal.toFixed(2)} SAR
                            </p>
                        </div>

                        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl">
                            <p className="text-xs text-neutral-500">{isRtl ? 'ضريبة القيمة المضافة المستردة (15% VAT)' : '15% VAT Recoverable'}</p>
                            <p className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                {totalTax.toFixed(2)} SAR
                            </p>
                        </div>

                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">{isRtl ? 'إجمالي المطالبة الشامل' : 'Total Claimed'}</p>
                            <p className="text-xl font-mono font-bold text-indigo-900 dark:text-indigo-200 mt-1">
                                {totalClaimed.toFixed(2)} SAR
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {isRtl ? 'المبلغ المردود لخزينة الشركة (إرجاع فائض العهدة)' : 'Refund Returned to Company (SAR)'}
                            </label>
                            <Input
                                type="number"
                                step="any"
                                min="0"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                className="mt-1 font-mono text-sm"
                            />
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                                {isRtl ? 'إذا أعاد الموظف نقداً متبقياً إلى صندوق أو بنك الشركة' : 'Unspent advance returned to treasury'}
                            </p>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {isRtl ? 'المبلغ الإضافي المصروف للموظف (في حال تجاوزت فواتيره العهدة)' : 'Excess Reimbursement Paid to Employee (SAR)'}
                            </label>
                            <Input
                                type="number"
                                step="any"
                                min="0"
                                value={reimbursementAmount}
                                onChange={(e) => setReimbursementAmount(e.target.value)}
                                className="mt-1 font-mono text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            {isRtl ? 'ملاحظات وتفسيرات السند' : 'Notes'}
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-xs"
                            placeholder={isRtl ? 'ملاحظات الفواتير والمرفقات...' : 'Invoice descriptions...'}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href={`/hr/custodies/${custody.id}`}>{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    >
                        {isSubmitting ? (isRtl ? 'جاري الترحيل...' : 'Posting...') : (isRtl ? 'اعتماد وترحيل التسوية المحاسبية' : 'Post & Seal Settlement')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
