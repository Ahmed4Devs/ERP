import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, Trash2, HandCoins, DollarSign, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface PettyCashFund {
    id: string;
    name: string;
    code: string;
    current_balance: string;
    fund_limit: string;
    account_id: string;
}

interface Branch {
    id: string;
    name: string;
}

interface LineItem {
    expense_account_id: string;
    description: string;
    receipt_ref: string;
    receipt_date: string;
    subtotal: number;
    tax_rate: number;
}

interface Props {
    funds: PettyCashFund[];
    expenseAccounts: Account[];
    bankAccounts: Account[];
    branches: Branch[];
}

export default function CreateSettlement({ funds, expenseAccounts, bankAccounts, branches }: Props) {
    const { isRtl } = useTranslation();

    const [lines, setLines] = useState<LineItem[]>([
        {
            expense_account_id: expenseAccounts[0]?.id || '',
            description: 'نثريات ومستلزمات مكتبية / ضيافة',
            receipt_ref: '',
            receipt_date: new Date().toISOString().split('T')[0],
            subtotal: 100,
            tax_rate: 0.15,
        },
    ]);

    const { data, setData, post, processing, errors } = useForm({
        fund_id: funds[0]?.id || '',
        branch_id: branches[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        reimbursement_type: 'replenish_bank',
        bank_account_id: bankAccounts[0]?.id || '',
        notes: '',
        lines: lines,
    });

    const selectedFund = funds.find((f) => f.id === data.fund_id);

    const updateLine = (index: number, field: keyof LineItem, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
        setData('lines', newLines);
    };

    const addLine = () => {
        const newLine: LineItem = {
            expense_account_id: expenseAccounts[0]?.id || '',
            description: '',
            receipt_ref: '',
            receipt_date: new Date().toISOString().split('T')[0],
            subtotal: 0,
            tax_rate: 0.15,
        };
        const updated = [...lines, newLine];
        setLines(updated);
        setData('lines', updated);
    };

    const removeLine = (index: number) => {
        if (lines.length <= 1) return;
        const updated = lines.filter((_, i) => i !== index);
        setLines(updated);
        setData('lines', updated);
    };

    const subtotal = lines.reduce((acc, line) => acc + (line.subtotal || 0), 0);
    const taxAmount = lines.reduce((acc, line) => acc + ((line.subtotal || 0) * (line.tax_rate || 0)), 0);
    const total = subtotal + taxAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/accounting/petty-cash/settlements');
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={isRtl ? 'إصدار سند تسوية عهدة نقدية' : 'New Petty Cash Settlement'} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <HandCoins className="h-6 w-6 text-amber-600" />
                        {isRtl ? 'إصدار سند تسوية عهدة نقدية' : 'New Petty Cash Settlement'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'تسجيل الفواتير والمصروفات النثرية المدفوعة نقداً واسترداد ضريبة القيمة المضافة وإجراء الاستعاضة'
                            : 'Submit petty cash receipts for expense recording, VAT recovery & fund replenishment'}
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/accounting/petty-cash" className="gap-2">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        {isRtl ? 'رجوع للعهد' : 'Back to Petty Cash'}
                    </Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Fund & Voucher Parameters Card */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b pb-3 dark:border-neutral-800">
                        {isRtl ? 'بيانات السند وصندوق العهدة' : 'Voucher & Fund Details'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {isRtl ? 'صندوق العهدة *' : 'Petty Cash Fund *'}
                            </label>
                            <select
                                value={data.fund_id}
                                onChange={(e) => setData('fund_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                required
                            >
                                <option value="">{isRtl ? '-- اختر صندوق العهدة --' : '-- Select Fund --'}</option>
                                {funds.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.name} ({f.code}) - {parseFloat(f.current_balance).toLocaleString()} SAR
                                    </option>
                                ))}
                            </select>
                            {selectedFund && (
                                <p className="text-xs text-neutral-500 mt-1">
                                    {isRtl ? 'الرصيد المتاح حالياً:' : 'Current balance:'} <span className="font-mono font-bold text-emerald-600">{parseFloat(selectedFund.current_balance).toLocaleString()} SAR</span> / {parseFloat(selectedFund.fund_limit).toLocaleString()} SAR
                                </p>
                            )}
                            {errors.fund_id && <p className="text-rose-500 text-xs mt-1">{errors.fund_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {isRtl ? 'تاريخ السند *' : 'Voucher Date *'}
                            </label>
                            <Input
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                required
                            />
                            {errors.date && <p className="text-rose-500 text-xs mt-1">{errors.date}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {isRtl ? 'الفرع' : 'Branch'}
                            </label>
                            <select
                                value={data.branch_id}
                                onChange={(e) => setData('branch_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">{isRtl ? '-- المركز الرئيسي --' : '-- Main HQ --'}</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {isRtl ? 'طريقة الاستعاضة والتسوية *' : 'Reimbursement Type *'}
                            </label>
                            <select
                                value={data.reimbursement_type}
                                onChange={(e) => setData('reimbursement_type', e.target.value)}
                                className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                required
                            >
                                <option value="replenish_bank">{isRtl ? 'استعاضة فورية من البنك/الخزينة (إعادة ملء العهدة)' : 'Direct Bank Replenishment'}</option>
                                <option value="deduct_custody">{isRtl ? 'خصم وتخفيض من رصيد العهدة (إقفال جزئي)' : 'Deduct from Custody Balance'}</option>
                            </select>
                        </div>

                        {data.reimbursement_type === 'replenish_bank' && (
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {isRtl ? 'حساب البنك / الخزينة للاستعاضة *' : 'Bank / Cash Account *'}
                                </label>
                                <select
                                    value={data.bank_account_id}
                                    onChange={(e) => setData('bank_account_id', e.target.value)}
                                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                >
                                    {bankAccounts.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.code} - {isRtl && b.name_ar ? b.name_ar : b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expense Lines Table */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'بيان بنود المصروفات والفواتير النثرية' : 'Expense Lines & Receipts'}
                        </h2>
                        <Button type="button" onClick={addLine} size="sm" variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            {isRtl ? 'إضافة بند مصروف' : 'Add Line'}
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-semibold">
                                <tr>
                                    <th className="py-2.5 px-3 text-start">{isRtl ? 'حساب المصروف (GL)' : 'Expense Account'}</th>
                                    <th className="py-2.5 px-3 text-start">{isRtl ? 'البيان / الوصف' : 'Description'}</th>
                                    <th className="py-2.5 px-3 text-start w-32">{isRtl ? 'رقم الإيصال/الفاتورة' : 'Receipt #'}</th>
                                    <th className="py-2.5 px-3 text-start w-32">{isRtl ? 'تاريخ الفاتورة' : 'Receipt Date'}</th>
                                    <th className="py-2.5 px-3 text-start w-28">{isRtl ? 'المبلغ بدون الضريبة' : 'Amount'}</th>
                                    <th className="py-2.5 px-3 text-start w-24">{isRtl ? 'الضريبة' : 'VAT'}</th>
                                    <th className="py-2.5 px-3 text-start w-32">{isRtl ? 'الإجمالي' : 'Total'}</th>
                                    <th className="py-2.5 px-3 text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {lines.map((line, idx) => {
                                    const lineTax = (line.subtotal || 0) * (line.tax_rate || 0);
                                    const lineTot = (line.subtotal || 0) + lineTax;

                                    return (
                                        <tr key={idx} className="align-top">
                                            <td className="py-2 px-2 min-w-[200px]">
                                                <select
                                                    value={line.expense_account_id}
                                                    onChange={(e) => updateLine(idx, 'expense_account_id', e.target.value)}
                                                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                                                    required
                                                >
                                                    {expenseAccounts.map((acc) => (
                                                        <option key={acc.id} value={acc.id}>
                                                            {acc.code} - {isRtl && acc.name_ar ? acc.name_ar : acc.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-2 px-2 min-w-[180px]">
                                                <Input
                                                    type="text"
                                                    value={line.description}
                                                    placeholder={isRtl ? 'شرح المصروف...' : 'Expense detail...'}
                                                    onChange={(e) => updateLine(idx, 'description', e.target.value)}
                                                    className="text-xs h-8"
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    type="text"
                                                    value={line.receipt_ref}
                                                    placeholder="INV-1234"
                                                    onChange={(e) => updateLine(idx, 'receipt_ref', e.target.value)}
                                                    className="text-xs h-8 font-mono"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    type="date"
                                                    value={line.receipt_date}
                                                    onChange={(e) => updateLine(idx, 'receipt_date', e.target.value)}
                                                    className="text-xs h-8"
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    step="any"
                                                    value={line.subtotal}
                                                    onChange={(e) => updateLine(idx, 'subtotal', parseFloat(e.target.value) || 0)}
                                                    className="text-xs h-8 font-mono"
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <select
                                                    value={line.tax_rate}
                                                    onChange={(e) => updateLine(idx, 'tax_rate', parseFloat(e.target.value))}
                                                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1.5 text-xs"
                                                >
                                                    <option value="0.15">15%</option>
                                                    <option value="0">0%</option>
                                                </select>
                                            </td>
                                            <td className="py-2 px-2 font-mono font-semibold text-neutral-900 dark:text-neutral-100 text-end whitespace-nowrap pt-3">
                                                {lineTot.toFixed(2)}
                                            </td>
                                            <td className="py-2 px-2 text-center pt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeLine(idx)}
                                                    disabled={lines.length <= 1}
                                                    className="text-neutral-400 hover:text-rose-600 h-8 w-8 p-0"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Breakdown Footer */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t dark:border-neutral-800 gap-4">
                        <div className="text-xs text-neutral-500 max-w-sm">
                            <span className="font-semibold">{isRtl ? 'الأثر المحاسبي التلقائي:' : 'Automated GL Impact:'}</span>
                            <br />
                            {isRtl
                                ? 'يتم قيد المصاريف مديناً (حسابات 5xxx) مع إثبات ضريبة المدخلات المستردة (مدين 1150)، ودائن البنك عند الاستعاضة أو دائن حساب العهدة 1030.'
                                : 'Debit respective Expense Accounts & Input VAT (1150). Credit Bank (replenishment) or Custody (1030).'}
                        </div>

                        <div className="w-full sm:w-72 space-y-2 bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm">
                            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                <span>{isRtl ? 'المجموع قبل الضريبة:' : 'Subtotal:'}</span>
                                <span className="font-mono">{subtotal.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                <span>{isRtl ? 'ضريبة القيمة المضافة (15%):' : 'VAT Amount:'}</span>
                                <span className="font-mono">{taxAmount.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-neutral-900 dark:text-neutral-100 border-t pt-2 dark:border-neutral-700">
                                <span>{isRtl ? 'إجمالي السند المطلوب صرفه:' : 'Total Settlement:'}</span>
                                <span className="font-mono text-amber-600 dark:text-amber-400">{total.toFixed(2)} SAR</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes & Submit */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-1/2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            {isRtl ? 'ملاحظات إضافية' : 'Notes'}
                        </label>
                        <Input
                            type="text"
                            placeholder={isRtl ? 'أي تفاصيل عن جهة الصرف أو الغرض من التسوية...' : 'Any details on expenditures...'}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <Button asChild variant="outline">
                            <Link href="/accounting/petty-cash">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px]"
                        >
                            {processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ مسودة السند' : 'Save as Draft')}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
