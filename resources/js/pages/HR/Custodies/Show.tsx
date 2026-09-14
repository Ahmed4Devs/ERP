import { Head, Link, router } from '@inertiajs/react';
import {
    Wallet,
    ArrowLeft,
    User,
    Building2,
    CheckCircle2,
    Clock,
    Receipt,
    Printer,
    Coins,
    FileText,
    DollarSign,
    CreditCard,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Employee {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    phone?: string;
    iban?: string;
    department?: { name: string };
}

interface ExpenseLine {
    id: string;
    vendor_name: string;
    vendor_tax_number?: string;
    invoice_number?: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    description: string;
    expense_account?: { code: string; name: string };
}

interface Settlement {
    id: string;
    settlement_number: string;
    settlement_date: string;
    total_expenses_amount: string;
    total_tax_amount: string;
    total_claimed_amount: string;
    refund_amount: string;
    reimbursement_amount: string;
    status: string;
    lines: ExpenseLine[];
    journal_entry?: { id: string; entry_number: string };
}

interface Custody {
    id: string;
    custody_number: string;
    type: 'temporary' | 'permanent';
    purpose: string;
    amount: string;
    current_balance: string;
    status: 'draft' | 'approved' | 'disbursed' | 'partially_settled' | 'closed';
    disbursement_method: string;
    disbursed_at?: string;
    created_at: string;
    notes?: string;
    employee?: Employee;
    branch?: { name: string };
    disbursement_account?: { code: string; name: string };
    custody_account?: { code: string; name: string };
    journal_entry?: { id: string; entry_number: string };
    settlements: Settlement[];
}

interface Props {
    custody: Custody;
}

export default function CustodyShow({ custody }: Props) {
    const { isRtl } = useTranslation();

    const formatMoney = (val: number | string) => {
        return Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' SAR';
    };

    const handleDisburse = () => {
        if (confirm(isRtl ? 'هل أنت متأكد من صرف العهدة وترحيل القيد المحاسبي؟' : 'Confirm disbursement and GL posting?')) {
            router.post(`/hr/custodies/${custody.id}/disburse`);
        }
    };

    const isDisbursed = custody.status === 'disbursed' || custody.status === 'partially_settled';
    const isClosed = custody.status === 'closed';

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`Custody - #${custody.custody_number}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                        <Link href="/hr/custodies">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                #{custody.custody_number}
                            </h1>
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    isClosed
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                                        : isDisbursed
                                        ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800'
                                }`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${isDisbursed ? 'bg-amber-500 animate-pulse' : isClosed ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                                {custody.status === 'closed' ? (isRtl ? 'تم إخلاء الطرف والمطابقة' : 'Cleared & Closed') : custody.status === 'disbursed' ? (isRtl ? 'منصرفة قيد العمل' : 'Disbursed') : (isRtl ? 'مسودة' : 'Draft')}
                            </span>

                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                                {custody.type === 'temporary' ? (isRtl ? 'عهدة مؤقتة' : 'Temporary') : (isRtl ? 'عهدة مستديمة' : 'Permanent')}
                            </span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {custody.employee?.first_name} {custody.employee?.last_name} ({custody.employee?.employee_number}) &bull; {custody.branch?.name || 'الفرع الرئيسي'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {custody.status === 'draft' && (
                        <Button onClick={handleDisburse} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                            <CreditCard className="h-4 w-4" />
                            <span>{isRtl ? 'اعتماد وصرف العهدة' : 'Disburse Advance'}</span>
                        </Button>
                    )}

                    {isDisbursed && (
                        <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                            <Link href={`/hr/custodies/${custody.id}/settle`}>
                                <Receipt className="h-4 w-4" />
                                <span>{isRtl ? 'تسوية فواتير العهدة (15% VAT)' : 'Settle Expenses & VAT'}</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Financial Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'مبلغ العهدة المصروف' : 'Disbursed Advance'}</p>
                    <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                        {formatMoney(custody.amount)}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                        {custody.disbursed_at ? new Date(custody.disbursed_at).toLocaleDateString() : (isRtl ? 'لم تصرف بعد' : 'Not disbursed')}
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'الرصيد المتبقي بذمة الموظف' : 'Remaining Balance'}</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${
                        Number(custody.current_balance) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                        {formatMoney(custody.current_balance)}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                        {Number(custody.current_balance) === 0 ? (isRtl ? 'تمت التصفية 100%' : '100% Cleared') : (isRtl ? 'مبالغ قيد التسوية' : 'Pending receipts')}
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'الحساب المحاسبي للعهدة' : 'GL Custody Account'}</p>
                    <p className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                        {custody.custody_account ? `${custody.custody_account.code} - ${custody.custody_account.name}` : '1140 - سلف وعهد موظفين'}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'حساب أصول متداولة مدينة' : 'Current Asset (Debit)'}</p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'قيد اليومية لصرف العهدة' : 'Disbursement Journal'}</p>
                    <p className="text-sm font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                        {custody.journal_entry ? `#${custody.journal_entry.entry_number}` : '-'}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'قيد صرف العهدة التلقائي' : 'Auto disbursement entry'}</p>
                </div>
            </div>

            {/* Custody Info & Purpose Card */}
            <div className="p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    {isRtl ? 'الغرض وتفاصيل العهدة' : 'Custody Purpose & Instructions'}
                </h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800">
                    {custody.purpose}
                </p>
                {custody.notes && (
                    <p className="text-xs text-neutral-500">
                        <span className="font-semibold">{isRtl ? 'ملاحظات: ' : 'Notes: '}</span>
                        {custody.notes}
                    </p>
                )}
            </div>

            {/* Settlements History */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-indigo-600" />
                        {isRtl ? 'سجل تسويات الفواتير والمصروفات' : 'Settlement Vouchers History'}
                        <span className="text-xs font-normal text-neutral-500">({custody.settlements?.length || 0})</span>
                    </h3>

                    {isDisbursed && (
                        <Button asChild size="sm" variant="outline" className="gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                            <Link href={`/hr/custodies/${custody.id}/settle`}>
                                <Receipt className="h-4 w-4" />
                                <span>{isRtl ? 'تسوية جديدة' : 'New Settlement'}</span>
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 text-start">{isRtl ? 'رقم السند' : 'Settlement #'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                <th className="px-6 py-3 text-end font-mono">{isRtl ? 'المصروفات (قبل الضريبة)' : 'Expenses'}</th>
                                <th className="px-6 py-3 text-end font-mono">{isRtl ? '15% VAT' : '15% VAT'}</th>
                                <th className="px-6 py-3 text-end font-mono">{isRtl ? 'إجمالي المطالبة' : 'Total Claimed'}</th>
                                <th className="px-6 py-3 text-end font-mono">{isRtl ? 'المردود للصندوق' : 'Refund'}</th>
                                <th className="px-6 py-3 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {!custody.settlements || custody.settlements.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-neutral-500">
                                        {isRtl ? 'لم يتم تقديم أي سند تسوية بعد لهذه العهدة' : 'No settlements recorded yet for this custody'}
                                    </td>
                                </tr>
                            ) : (
                                custody.settlements.map((st) => (
                                    <tr key={st.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="px-6 py-3.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {st.settlement_number}
                                        </td>
                                        <td className="px-6 py-3.5 text-xs text-neutral-600 dark:text-neutral-400">
                                            {st.settlement_date}
                                        </td>
                                        <td className="px-6 py-3.5 text-end font-mono">
                                            {formatMoney(st.total_expenses_amount)}
                                        </td>
                                        <td className="px-6 py-3.5 text-end font-mono text-indigo-600 dark:text-indigo-400">
                                            {formatMoney(st.total_tax_amount)}
                                        </td>
                                        <td className="px-6 py-3.5 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {formatMoney(st.total_claimed_amount)}
                                        </td>
                                        <td className="px-6 py-3.5 text-end font-mono text-emerald-600">
                                            {Number(st.refund_amount) > 0 ? formatMoney(st.refund_amount) : '-'}
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {isRtl ? 'مرحل ومعتمد' : 'Posted'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-end">
                                            <Button asChild size="sm" variant="ghost" className="gap-1">
                                                <a href={`/hr/custodies/settlements/${st.id}/print`} target="_blank" rel="noreferrer">
                                                    <Printer className="h-3.5 w-3.5" />
                                                    <span>{isRtl ? 'طباعة السند' : 'Print Voucher'}</span>
                                                </a>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
