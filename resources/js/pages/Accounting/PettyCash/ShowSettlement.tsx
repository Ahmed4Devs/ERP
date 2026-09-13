import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Printer, CheckCircle2, Clock, HandCoins, ShieldCheck, Building2, User, Landmark, Wallet } from 'lucide-react';
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

interface SettlementLine {
    id: string;
    description: string;
    receipt_ref?: string;
    receipt_date?: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    expense_account?: Account;
}

interface PettyCashFund {
    id: string;
    name: string;
    code: string;
    current_balance: string;
    fund_limit: string;
    custodian?: {
        name: string;
        email: string;
    };
}

interface PettyCashSettlement {
    id: string;
    settlement_number: string;
    date: string;
    reimbursement_type: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    status: 'draft' | 'posted';
    notes?: string;
    fund?: PettyCashFund;
    branch?: {
        name: string;
    };
    bank_account?: Account;
    lines: SettlementLine[];
    journal_entry?: JournalEntry;
}

interface Props {
    settlement: PettyCashSettlement;
}

export default function ShowSettlement({ settlement }: Props) {
    const { isRtl } = useTranslation();

    const handlePost = () => {
        if (confirm(isRtl ? 'هل أنت متأكد من ترحيل سند التسوية وإثبات قيود المصاريف وضريبة القيمة المضافة؟' : 'Are you sure you want to post this settlement voucher?')) {
            router.post(`/accounting/petty-cash/settlements/${settlement.id}/post`);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${isRtl ? 'سند تسوية عهدة' : 'Settlement Voucher'} ${settlement.settlement_number}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <Link href="/accounting/petty-cash">
                            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                                {settlement.settlement_number}
                            </h1>
                            {settlement.status === 'posted' ? (
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
                            {isRtl ? 'تاريخ التحرير:' : 'Date:'} {settlement.date}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/accounting/petty-cash/settlements/${settlement.id}/print`}>
                            <Printer className="h-4 w-4" />
                            {isRtl ? 'طباعة السند الرسمي' : 'Print Voucher'}
                        </Link>
                    </Button>

                    {settlement.status === 'draft' && (
                        <Button
                            onClick={handlePost}
                            className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            {isRtl ? 'اعتماد وترحيل السند' : 'Approve & Post'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5" />
                        {isRtl ? 'صندوق العهدة' : 'Petty Fund'}
                    </span>
                    <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {settlement.fund?.name} ({settlement.fund?.code})
                    </div>
                    <div className="text-xs text-neutral-500">
                        {isRtl ? 'أمين العهدة:' : 'Custodian:'} {settlement.fund?.custodian?.name || '—'}
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {isRtl ? 'طريقة الاستعاضة والفرع' : 'Reimbursement'}
                    </span>
                    <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {settlement.reimbursement_type === 'replenish_bank'
                            ? (isRtl ? 'استعاضة بنكية مباشرة' : 'Bank Replenishment')
                            : (isRtl ? 'تخفيض من رصيد العهدة' : 'Custody Deduction')}
                    </div>
                    <div className="text-xs text-neutral-500">
                        {settlement.branch?.name || (isRtl ? 'المركز الرئيسي' : 'HQ')}
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                        <HandCoins className="h-3.5 w-3.5 text-amber-600" />
                        {isRtl ? 'إجمالي السند المطلوب' : 'Settlement Total'}
                    </span>
                    <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                        {parseFloat(settlement.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-neutral-500">{isRtl ? 'ر.س' : 'SAR'}</span>
                    </div>
                    <div className="text-xs text-neutral-500">
                        {isRtl ? 'يشمل ضريبة:' : 'Inc. VAT:'} {parseFloat(settlement.tax_amount).toFixed(2)} SAR
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'تفاصيل بنود المصروفات والإيصالات المرفقة' : 'Expenses & Receipt Details'}
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="py-3 px-4 text-start">#</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'حساب المصروف' : 'Expense Account'}</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'البيان / الوصف' : 'Description'}</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'رقم الإيصال' : 'Receipt Ref'}</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'المبلغ بدون الضريبة' : 'Subtotal'}</th>
                                <th className="py-3 px-4 text-start">{isRtl ? 'الضريبة المستردة' : 'VAT'}</th>
                                <th className="py-3 px-4 text-end">{isRtl ? 'الإجمالي' : 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {settlement.lines.map((line, idx) => (
                                <tr key={line.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                                    <td className="py-3 px-4 text-neutral-400">{idx + 1}</td>
                                    <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                                        {line.expense_account ? `${line.expense_account.code} - ${isRtl && line.expense_account.name_ar ? line.expense_account.name_ar : line.expense_account.name}` : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                                        {line.description}
                                    </td>
                                    <td className="py-3 px-4 font-mono text-neutral-500">
                                        {line.receipt_ref || '—'}
                                    </td>
                                    <td className="py-3 px-4 font-mono">
                                        {parseFloat(line.subtotal).toFixed(2)}
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

                {/* Subtotals Footer */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                    <div className="w-full sm:w-72 space-y-2 text-sm">
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>{isRtl ? 'إجمالي المصروفات قبل الضريبة:' : 'Subtotal Excl. VAT:'}</span>
                            <span className="font-mono">{parseFloat(settlement.subtotal).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>{isRtl ? 'ضريبة القيمة المضافة المستردة:' : 'Recoverable VAT:'}</span>
                            <span className="font-mono">{parseFloat(settlement.tax_amount).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-neutral-900 dark:text-neutral-100 border-t pt-2 dark:border-neutral-700">
                            <span>{isRtl ? 'صافي المبلغ المصروف:' : 'Total Disbursed:'}</span>
                            <span className="font-mono text-amber-600 dark:text-amber-400">{parseFloat(settlement.total).toFixed(2)} SAR</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accounting GL Impact (if posted) */}
            {settlement.status === 'posted' && settlement.journal_entry && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b pb-3 dark:border-neutral-800">
                        <Landmark className="h-5 w-5 text-indigo-600" />
                        <span>{isRtl ? 'قيود اليومية الآلية (الأثر المالي المحاسبي)' : 'Automated GL Journal Entries'}</span>
                        <span className="text-xs font-mono font-normal text-neutral-400">({settlement.journal_entry.entry_number})</span>
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
                                {settlement.journal_entry.lines.map((jl) => (
                                    <tr key={jl.id}>
                                        <td className="py-2 px-3 font-mono font-medium text-indigo-600">{jl.account?.code}</td>
                                        <td className="py-2 px-3 font-medium text-neutral-800 dark:text-neutral-200">
                                            {isRtl && jl.account?.name_ar ? jl.account.name_ar : jl.account?.name}
                                        </td>
                                        <td className="py-2 px-3 text-neutral-500">{jl.description}</td>
                                        <td className="py-2 px-3 font-mono text-end font-semibold text-emerald-600">
                                            {parseFloat(jl.debit) > 0 ? parseFloat(jl.debit).toFixed(2) : '—'}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-end font-semibold text-amber-600">
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
