import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Landmark, FileCheck2, Printer, CheckCircle2, Clock, AlertCircle, Wand2, Link2, Unlink, Upload, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    current_balance: string;
}

interface StatementLine {
    id: string;
    line_date: string;
    description: string;
    reference_number?: string;
    type: 'deposit' | 'withdrawal';
    amount: string;
    is_reconciled: boolean;
    matched_journal_entry_line_id?: string;
    matched_journal_line?: {
        id: string;
        journal_entry?: {
            entry_number: string;
            date: string;
        };
    };
}

interface GLTransaction {
    id: string;
    journal_entry_id: string;
    entry_number: string;
    date: string;
    description: string;
    debit: number;
    credit: number;
    amount: number;
    type: 'deposit' | 'withdrawal';
    is_matched: boolean;
    is_matched_in_this: boolean;
    is_matched_elsewhere: boolean;
}

interface BankReconciliation {
    id: string;
    statement_number: string;
    statement_date: string;
    start_date: string;
    end_date: string;
    opening_balance: string;
    closing_balance: string;
    cleared_balance: string;
    difference: string;
    status: 'draft' | 'in_progress' | 'reconciled';
    notes?: string;
    bank_account: Account;
    statement_lines: StatementLine[];
}

interface Props {
    reconciliation: BankReconciliation;
    glTransactions: GLTransaction[];
}

export default function BankReconciliationShow({ reconciliation, glTransactions }: Props) {
    const { isRtl } = useTranslation();

    const [selectedStatementLineId, setSelectedStatementLineId] = useState<string | null>(null);
    const [selectedGlLineId, setSelectedGlLineId] = useState<string | null>(null);
    const [stmtFilter, setStmtFilter] = useState<'all' | 'unmatched' | 'matched'>('all');
    const [glFilter, setGlFilter] = useState<'all' | 'unmatched' | 'matched'>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isFinalized = reconciliation.status === 'reconciled';
    const differenceVal = parseFloat(reconciliation.difference || '0');
    const isZeroDifference = Math.abs(differenceVal) < 0.005;

    // Filter statement lines
    const filteredStatementLines = reconciliation.statement_lines.filter((l) => {
        if (stmtFilter === 'unmatched') return !l.is_reconciled;
        if (stmtFilter === 'matched') return l.is_reconciled;
        return true;
    });

    // Filter GL lines
    const filteredGlLines = glTransactions.filter((l) => {
        if (glFilter === 'unmatched') return !l.is_matched;
        if (glFilter === 'matched') return l.is_matched;
        return true;
    });

    // Handle Auto-Match
    const handleAutoMatch = () => {
        setIsSubmitting(true);
        router.post(`/accounting/bank-reconciliation/${reconciliation.id}/auto-match`, {}, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Handle Manual Match
    const handleManualMatch = () => {
        if (!selectedStatementLineId || !selectedGlLineId) return;

        setIsSubmitting(true);
        router.post(`/accounting/bank-reconciliation/${reconciliation.id}/match`, {
            statement_line_id: selectedStatementLineId,
            journal_line_id: selectedGlLineId,
        }, {
            onSuccess: () => {
                setSelectedStatementLineId(null);
                setSelectedGlLineId(null);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Handle Unmatch
    const handleUnmatch = (statementLineId: string) => {
        setIsSubmitting(true);
        router.post(`/accounting/bank-reconciliation/${reconciliation.id}/unmatch`, {
            statement_line_id: statementLineId,
        }, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Handle Finalize
    const handleFinalize = () => {
        if (!confirm(isRtl ? 'هل أنت متأكد من رغبتك في اعتماد وإقفال التسوية البنكية؟' : 'Are you sure you want to finalize and lock this reconciliation?')) {
            return;
        }

        setIsSubmitting(true);
        router.post(`/accounting/bank-reconciliation/${reconciliation.id}/finalize`, {}, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <Head title={`${reconciliation.statement_number} - ${isRtl ? 'ورشة التسوية البنكية' : 'Bank Reconciliation Workbench'}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/accounting/bank-reconciliation">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                {reconciliation.statement_number}
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                <Landmark className="h-3.5 w-3.5" />
                                {reconciliation.bank_account?.code} - {isRtl && reconciliation.bank_account?.name_ar ? reconciliation.bank_account.name_ar : reconciliation.bank_account?.name}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 font-mono mt-1">
                            {isRtl ? 'الفترة:' : 'Period:'} {reconciliation.start_date} → {reconciliation.end_date}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="gap-2">
                        <a href={`/accounting/bank-reconciliation/${reconciliation.id}/print`} target="_blank" rel="noopener noreferrer">
                            <Printer className="h-4 w-4" />
                            <span>{isRtl ? 'طباعة مذكرة التسوية / PDF' : 'Print Statement / PDF'}</span>
                        </a>
                    </Button>

                    {!isFinalized && (
                        <>
                            <Button
                                onClick={handleAutoMatch}
                                disabled={isSubmitting}
                                variant="outline"
                                className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            >
                                <Wand2 className="h-4 w-4" />
                                <span>{isRtl ? 'مطابقة تلقائية بالذكاء (Auto-Match)' : 'Auto-Match'}</span>
                            </Button>

                            <Button
                                onClick={handleFinalize}
                                disabled={isSubmitting || !isZeroDifference}
                                className={`gap-2 text-white ${isZeroDifference ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-neutral-400 cursor-not-allowed'}`}
                            >
                                <ShieldCheck className="h-4 w-4" />
                                <span>{isRtl ? 'اعتماد وإقفال التسوية' : 'Finalize & Seal'}</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Reconciliation Live Status Board */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs text-neutral-500">{isRtl ? 'رصيد كشف الحساب البنكي' : 'Statement Ending Balance'}</p>
                    <p className="text-xl font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                        {Number(reconciliation.closing_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs text-neutral-500">{isRtl ? 'إجمالي الحركات المطابقة (Cleared)' : 'Cleared Balance'}</p>
                    <p className="text-xl font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                        {Number(reconciliation.cleared_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                </div>

                <div className={`rounded-xl border p-4 shadow-xs sm:col-span-2 ${
                    isZeroDifference
                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                        : 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
                }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-xs font-semibold ${isZeroDifference ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                                {isRtl ? 'الفارق بين البنك والدفاتر (Difference)' : 'Reconciliation Discrepancy'}
                            </p>
                            <p className={`text-2xl font-mono font-black mt-1 ${isZeroDifference ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                {Number(reconciliation.difference).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </p>
                        </div>
                        <div className="text-end">
                            {isZeroDifference ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1.5 rounded-full">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {isRtl ? 'مطابق 100% وجاهز للإقفال' : 'Balanced & Ready to Seal'}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-3 py-1.5 rounded-full">
                                    <AlertCircle className="h-4 w-4" />
                                    {isRtl ? 'يوجد فارق يتطلب المطابقة' : 'Unbalanced Discrepancy'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Manual Match Action Banner when items selected */}
            {selectedStatementLineId && selectedGlLineId && !isFinalized && (
                <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-md flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        <span className="font-semibold text-sm">
                            {isRtl ? 'تم تحديد سطر من كشف البنك وقيد من الأستاذ العام للمطابقة اليدوية' : 'Statement Line & GL Line selected for manual match'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setSelectedStatementLineId(null);
                                setSelectedGlLineId(null);
                            }}
                        >
                            {isRtl ? 'إلغاء التحديد' : 'Deselect'}
                        </Button>
                        <Button
                            onClick={handleManualMatch}
                            disabled={isSubmitting}
                            size="sm"
                            className="bg-white text-indigo-700 hover:bg-neutral-100 font-bold"
                        >
                            {isRtl ? 'تأكيد المطابقة الآن' : 'Confirm Match'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Workbench Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Bank Statement Lines */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Landmark className="h-5 w-5 text-indigo-600" />
                            <h2 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                                {isRtl ? 'حركات كشف حساب البنك' : 'Bank Statement Transactions'}
                            </h2>
                            <span className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-mono">
                                {reconciliation.statement_lines.length}
                            </span>
                        </div>

                        {/* Filter tabs */}
                        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
                            <button
                                onClick={() => setStmtFilter('all')}
                                className={`px-2.5 py-1 rounded-md ${stmtFilter === 'all' ? 'bg-white dark:bg-neutral-900 font-bold shadow-xs' : 'text-neutral-500'}`}
                            >
                                {isRtl ? 'الكل' : 'All'}
                            </button>
                            <button
                                onClick={() => setStmtFilter('unmatched')}
                                className={`px-2.5 py-1 rounded-md ${stmtFilter === 'unmatched' ? 'bg-white dark:bg-neutral-900 font-bold shadow-xs text-amber-600' : 'text-neutral-500'}`}
                            >
                                {isRtl ? 'غير مطابق' : 'Unmatched'}
                            </button>
                            <button
                                onClick={() => setStmtFilter('matched')}
                                className={`px-2.5 py-1 rounded-md ${stmtFilter === 'matched' ? 'bg-white dark:bg-neutral-900 font-bold shadow-xs text-emerald-600' : 'text-neutral-500'}`}
                            >
                                {isRtl ? 'مطابق' : 'Matched'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-start text-xs">
                            <thead className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500">
                                    <th className="py-2 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'البيان والوصف' : 'Description'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'المبلغ (SAR)' : 'Amount'}</th>
                                    <th className="py-2 text-center w-16">{isRtl ? 'الحالة' : 'Status'}</th>
                                    <th className="py-2 text-end w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredStatementLines.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-neutral-400">
                                            {isRtl ? 'لا توجد حركات مطابقة للفلتر' : 'No statement lines'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStatementLines.map((line) => {
                                        const isSelected = selectedStatementLineId === line.id;
                                        return (
                                            <tr
                                                key={line.id}
                                                onClick={() => {
                                                    if (isFinalized || line.is_reconciled) return;
                                                    setSelectedStatementLineId(isSelected ? null : line.id);
                                                }}
                                                className={`transition-colors cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                                                        : line.is_reconciled
                                                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                                                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                                }`}
                                            >
                                                <td className="py-2.5 font-mono text-neutral-600 dark:text-neutral-400">
                                                    {line.line_date}
                                                </td>
                                                <td className="py-2.5">
                                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{line.description}</p>
                                                    {line.reference_number && (
                                                        <span className="text-[10px] text-neutral-400 font-mono">Ref: {line.reference_number}</span>
                                                    )}
                                                    {line.matched_journal_line?.journal_entry && (
                                                        <span className="block text-[10px] text-emerald-600 font-mono mt-0.5">
                                                            ✓ Matched GL: {line.matched_journal_line.journal_entry.entry_number}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 text-end font-mono font-bold">
                                                    <span className={line.type === 'deposit' ? 'text-emerald-600' : 'text-neutral-900 dark:text-neutral-100'}>
                                                        {line.type === 'deposit' ? '+' : '-'}{Number(line.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-center">
                                                    {line.is_reconciled ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            مطابق
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                                            غير مطابق
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 text-end">
                                                    {line.is_reconciled && !isFinalized && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleUnmatch(line.id);
                                                            }}
                                                            title={isRtl ? 'إلغاء المطابقة' : 'Unmatch'}
                                                            className="text-neutral-400 hover:text-red-600 p-1"
                                                        >
                                                            <Unlink className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Column 2: GL Book Entries */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <div className="flex items-center gap-2">
                            <FileCheck2 className="h-5 w-5 text-indigo-600" />
                            <h2 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                                {isRtl ? 'قيود دفتر الأستاذ العام (GL)' : 'General Ledger Bank Entries'}
                            </h2>
                            <span className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full font-mono">
                                {glTransactions.length}
                            </span>
                        </div>

                        {/* Filter tabs */}
                        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs">
                            <button
                                onClick={() => setGlFilter('all')}
                                className={`px-2.5 py-1 rounded-md ${glFilter === 'all' ? 'bg-white dark:bg-neutral-900 font-bold shadow-xs' : 'text-neutral-500'}`}
                            >
                                {isRtl ? 'الكل' : 'All'}
                            </button>
                            <button
                                onClick={() => setGlFilter('unmatched')}
                                className={`px-2.5 py-1 rounded-md ${glFilter === 'unmatched' ? 'bg-white dark:bg-neutral-900 font-bold shadow-xs text-amber-600' : 'text-neutral-500'}`}
                            >
                                {isRtl ? 'غير مطابق' : 'Unmatched'}
                            </button>
                            <button
                                onClick={() => setGlFilter('matched')}
                                className={`px-2.5 py-1 rounded-md ${glFilter === 'matched' ? 'bg-white dark:bg-neutral-900 font-bold shadow-xs text-emerald-600' : 'text-neutral-500'}`}
                            >
                                {isRtl ? 'مطابق' : 'Matched'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-start text-xs">
                            <thead className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500">
                                    <th className="py-2 text-start">{isRtl ? 'رقم القيد' : 'Entry #'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'البيان' : 'Description'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'مدين/دائن (SAR)' : 'Debit / Credit'}</th>
                                    <th className="py-2 text-center w-16">{isRtl ? 'الحالة' : 'Status'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {filteredGlLines.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-neutral-400">
                                            {isRtl ? 'لا توجد قيود أستاذ عام مطابقة للفلتر' : 'No GL entries'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredGlLines.map((gl) => {
                                        const isSelected = selectedGlLineId === gl.id;
                                        return (
                                            <tr
                                                key={gl.id}
                                                onClick={() => {
                                                    if (isFinalized || gl.is_matched) return;
                                                    setSelectedGlLineId(isSelected ? null : gl.id);
                                                }}
                                                className={`transition-colors cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                                                        : gl.is_matched
                                                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10'
                                                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                                }`}
                                            >
                                                <td className="py-2.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                    {gl.entry_number}
                                                </td>
                                                <td className="py-2.5 font-mono text-neutral-600 dark:text-neutral-400">
                                                    {gl.date}
                                                </td>
                                                <td className="py-2.5">
                                                    <p className="text-neutral-800 dark:text-neutral-200 line-clamp-1">{gl.description}</p>
                                                </td>
                                                <td className="py-2.5 text-end font-mono font-bold">
                                                    <span className={gl.debit > 0 ? 'text-emerald-600' : 'text-neutral-900 dark:text-neutral-100'}>
                                                        {gl.debit > 0 ? `+${gl.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `-${gl.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 text-center">
                                                    {gl.is_matched ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                            مطابق
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                                            معلق
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
