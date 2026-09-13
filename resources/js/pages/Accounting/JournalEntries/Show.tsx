import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Printer, BookOpen, CheckCircle2, AlertCircle, Calendar, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    type: string;
}

interface JournalLine {
    id: string;
    account_id: string;
    debit: string | number;
    credit: string | number;
    description?: string;
    account?: Account;
}

interface UserSummary {
    id: string;
    name: string;
}

interface JournalEntryDetail {
    id: string;
    entry_number: string;
    date: string;
    description: string;
    status: string;
    source_type?: string;
    source_id?: string;
    posted_at?: string;
    posted_by?: UserSummary;
    lines: JournalLine[];
    reversal_of_id?: string;
}

interface Props {
    entry: JournalEntryDetail;
    totals: {
        total_debit: number;
        total_credit: number;
        is_balanced: boolean;
    };
}

export default function JournalEntryShow({ entry, totals }: Props) {
    const { isRtl } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`قيد محاسبي - ${entry.entry_number}`} />

            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/accounting/journal-entries">
                            <BackIcon className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            <span>{isRtl ? 'العودة لقيود اليومية' : 'Back to Journal Entries'}</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <BookOpen className="h-6 w-6 text-indigo-600" />
                            <span>{entry.entry_number}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                entry.status === 'posted'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                                {entry.status}
                            </span>
                        </h1>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {isRtl ? 'التاريخ' : 'Date'}: {entry.date} | {isRtl ? 'المصدر' : 'Source'}: {entry.source_type || 'Manual'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900">
                        <Link href={`/accounting/journal-entries/${entry.id}/print`}>
                            <Printer className="h-4 w-4" />
                            <span>{isRtl ? 'طباعة سند القيد (A4)' : 'Print Voucher'}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Metadata Card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <span className="text-neutral-400 block">{isRtl ? 'البيان المحاسبي' : 'Description'}</span>
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100 mt-1 font-sans">{entry.description}</p>
                    </div>
                    <div>
                        <span className="text-neutral-400 block">{isRtl ? 'تاريخ القيد' : 'Entry Date'}</span>
                        <p className="font-mono font-bold text-neutral-800 dark:text-neutral-200 mt-1">{entry.date}</p>
                    </div>
                    <div>
                        <span className="text-neutral-400 block">{isRtl ? 'المرحل بواسطة' : 'Posted By'}</span>
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-1 font-sans">{entry.posted_by?.name || '-'}</p>
                    </div>
                    <div>
                        <span className="text-neutral-400 block">{isRtl ? 'تاريخ الترحيل' : 'Posted At'}</span>
                        <p className="font-mono text-neutral-600 dark:text-neutral-400 mt-1">{entry.posted_at || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Journal Lines Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden text-xs">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/50">
                    <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'حسابات وأطراف القيد المحاسبي' : 'Journal Entry Lines'} ({entry.lines.length})
                    </h2>
                    <div className="flex items-center gap-2">
                        {totals.is_balanced ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
                                <CheckCircle2 className="h-4 w-4" />
                                {isRtl ? 'القيد متزن' : 'Balanced'}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold font-sans">
                                <AlertCircle className="h-4 w-4" />
                                {isRtl ? 'القيد غير متزن' : 'Unbalanced'}
                            </span>
                        )}
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                        <tr>
                            <th className="py-2.5 px-4 w-28">{isRtl ? 'رمز الحساب' : 'Account Code'}</th>
                            <th className="py-2.5 px-4">{isRtl ? 'اسم الحساب' : 'Account Name'}</th>
                            <th className="py-2.5 px-4">{isRtl ? 'البيان التوضيحي' : 'Description'}</th>
                            <th className="py-2.5 px-4 text-right w-36">{isRtl ? 'مدين (Debit)' : 'Debit'}</th>
                            <th className="py-2.5 px-4 text-right w-36">{isRtl ? 'دائن (Credit)' : 'Credit'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                        {entry.lines.map((line) => (
                            <tr key={line.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                <td className="py-3 px-4 font-bold text-neutral-600 dark:text-neutral-400">{line.account?.code}</td>
                                <td className="py-3 px-4 font-sans font-medium text-neutral-900 dark:text-neutral-100">
                                    {line.account?.name_ar ? `${line.account.name_ar} - ${line.account.name}` : line.account?.name}
                                </td>
                                <td className="py-3 px-4 font-sans text-neutral-500 text-[11px]">{line.description || '-'}</td>
                                <td className="py-3 px-4 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                    {Number(line.debit) > 0 ? Number(line.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                    {Number(line.credit) > 0 ? Number(line.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                </td>
                            </tr>
                        ))}

                        {/* Totals Row */}
                        <tr className="bg-neutral-100 dark:bg-neutral-800 font-bold border-t-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
                            <td colSpan={3} className="py-3 px-4 font-sans text-right font-bold text-sm">
                                {isRtl ? 'المجموع العام' : 'Grand Total'}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-sm">
                                {Number(totals.total_debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-sm">
                                {Number(totals.total_credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
