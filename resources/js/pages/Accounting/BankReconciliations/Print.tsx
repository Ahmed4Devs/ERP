import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, X, FileCheck2, Landmark, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    code: string;
    name: string;
    name_ar?: string;
    current_balance: string;
}

interface Company {
    name: string;
    name_ar?: string;
    legal_name?: string;
    tax_number?: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface UnreconciledItem {
    id: string;
    entry_number?: string;
    date?: string;
    description: string;
    debit: string;
    credit: string;
    journal_entry?: {
        entry_number: string;
        date: string;
    };
}

interface BankReconciliation {
    statement_number: string;
    statement_date: string;
    start_date: string;
    end_date: string;
    opening_balance: string;
    closing_balance: string;
    cleared_balance: string;
    difference: string;
    status: string;
    notes?: string;
    bank_account: Account;
}

interface Props {
    reconciliation: BankReconciliation;
    company: Company;
    depositsInTransit: UnreconciledItem[];
    outstandingChecks: UnreconciledItem[];
    totalDepositsInTransit: number;
    totalOutstandingChecks: number;
    adjustedBankBalance: number;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function BankReconciliationPrint({
    reconciliation,
    company,
    depositsInTransit,
    outstandingChecks,
    totalDepositsInTransit,
    totalOutstandingChecks,
    adjustedBankBalance,
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

    const bankClosing = parseFloat(reconciliation.closing_balance || '0');
    const bookBalance = parseFloat(reconciliation.bank_account?.current_balance || '0');
    const difference = Math.abs(parseFloat(reconciliation.difference || '0'));

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 sm:px-6 print:bg-white print:p-0 print:m-0">
            <Head title={`Print-Recon-${reconciliation.statement_number}`} />

            {/* Print Action Bar */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-xs border border-neutral-200 dark:border-neutral-800 print:hidden">
                <div className="flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-indigo-600" />
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {isRtl ? 'معاينة وطباعة مذكرة التسوية والمطابقة البنكية' : 'Bank Reconciliation Statement Print Preview'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة التقرير / PDF' : 'Print / Save PDF'}</span>
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
                        <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 space-y-0.5">
                            {company.tax_number && (
                                <p>{isRtl ? `الرقم الضريبي: ${company.tax_number}` : `VAT: ${company.tax_number}`}</p>
                            )}
                            {company.address && <p>{company.address}</p>}
                        </div>
                    </div>

                    <div className="text-end">
                        <div className="inline-block bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-1.5 rounded-sm font-bold text-base tracking-wider uppercase mb-3">
                            مذكرة التسوية البنكية
                            <span className="block text-[11px] font-normal tracking-normal text-neutral-300 dark:text-neutral-600">
                                BANK RECONCILIATION STATEMENT
                            </span>
                        </div>
                        <p className="font-mono font-bold text-base text-neutral-900 dark:text-white">
                            {reconciliation.statement_number}
                        </p>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {isRtl ? `التاريخ: ${reconciliation.statement_date}` : `Date: ${reconciliation.statement_date}`}
                        </p>
                    </div>
                </div>

                {/* Bank Account Info Strip */}
                <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 mb-6 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <span className="text-neutral-500 block mb-0.5">{isRtl ? 'الحساب البنكي:' : 'Bank Account:'}</span>
                            <span className="font-bold text-sm text-neutral-900 dark:text-white">
                                {reconciliation.bank_account?.code} - {isRtl && reconciliation.bank_account?.name_ar ? reconciliation.bank_account.name_ar : reconciliation.bank_account?.name}
                            </span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block mb-0.5">{isRtl ? 'فترة التسوية:' : 'Reconciliation Period:'}</span>
                            <span className="font-mono font-semibold">
                                {reconciliation.start_date} → {reconciliation.end_date}
                            </span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block mb-0.5">{isRtl ? 'رصيد كشف البنك:' : 'Bank Ending Balance:'}</span>
                            <span className="font-mono font-bold text-sm">
                                {bankClosing.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                        <div>
                            <span className="text-neutral-500 block mb-0.5">{isRtl ? 'حالة المطابقة:' : 'Reconciliation Status:'}</span>
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {reconciliation.status === 'reconciled' ? (isRtl ? 'معتمدة ومقفلة' : 'Reconciled & Sealed') : (isRtl ? 'قيد المراجعة' : 'In Progress')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Structured Reconciliation Table */}
                <div className="mb-6 space-y-6">
                    <table className="w-full text-start text-xs border-collapse">
                        <thead>
                            <tr className="border-y-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-800 dark:text-neutral-200">
                                <th className="py-2.5 px-3 text-start">{isRtl ? 'البيان / البند المحاسبي' : 'Item / Description'}</th>
                                <th className="py-2.5 px-3 text-end w-44">{isRtl ? 'المبلغ الجزئي (SAR)' : 'Subtotal (SAR)'}</th>
                                <th className="py-2.5 px-3 text-end w-44">{isRtl ? 'المبلغ الإجمالي (SAR)' : 'Total (SAR)'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {/* 1. Bank Ending Balance */}
                            <tr className="bg-neutral-50/50 dark:bg-neutral-800/20 font-bold">
                                <td className="py-2.5 px-3 text-sm">
                                    {isRtl ? '1. رصيد الحساب كما هو وارد في كشف البنك (Ending Balance per Bank)' : '1. Ending Balance per Bank Statement'}
                                </td>
                                <td></td>
                                <td className="py-2.5 px-3 text-end font-mono text-sm">
                                    {bankClosing.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>

                            {/* 2. Add: Deposits in Transit */}
                            <tr className="font-semibold text-neutral-700 dark:text-neutral-300">
                                <td colSpan={3} className="py-2 px-3 pt-3 text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                    {isRtl ? 'يضاف: إيداعات بالطريق ومقبوضات دفتريّة لم تُقيد بالبنك (Deposits in Transit)' : 'Add: Deposits in Transit (Recorded in Books, not on Bank Statement)'}
                                </td>
                            </tr>
                            {depositsInTransit.length === 0 ? (
                                <tr>
                                    <td className="py-1.5 px-6 text-neutral-400 italic">
                                        {isRtl ? 'لا توجد إيداعات معلقة بالطريق' : 'None'}
                                    </td>
                                    <td className="py-1.5 px-3 text-end font-mono">0.00</td>
                                    <td></td>
                                </tr>
                            ) : (
                                depositsInTransit.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-1.5 px-6 font-mono text-neutral-600 dark:text-neutral-400">
                                            {item.journal_entry?.entry_number || ''} - {item.description} ({item.journal_entry?.date || ''})
                                        </td>
                                        <td className="py-1.5 px-3 text-end font-mono">
                                            +{Number(item.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td></td>
                                    </tr>
                                ))
                            )}
                            <tr className="border-b border-dashed border-neutral-300 dark:border-neutral-700 font-medium">
                                <td className="py-1.5 px-3 text-end text-neutral-500">{isRtl ? 'إجمالي الإيداعات المعلقة:' : 'Total Deposits in Transit:'}</td>
                                <td></td>
                                <td className="py-1.5 px-3 text-end font-mono font-bold text-emerald-600">
                                    +{totalDepositsInTransit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>

                            {/* 3. Deduct: Outstanding Checks */}
                            <tr className="font-semibold text-neutral-700 dark:text-neutral-300">
                                <td colSpan={3} className="py-2 px-3 pt-3 text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    {isRtl ? 'يخصم: شيكات ومسحوبات صادرة لم تُقدم للصرف بعد (Outstanding Checks / Payments)' : 'Less: Outstanding Checks / Disbursals (Issued in Books, not yet cleared by Bank)'}
                                </td>
                            </tr>
                            {outstandingChecks.length === 0 ? (
                                <tr>
                                    <td className="py-1.5 px-6 text-neutral-400 italic">
                                        {isRtl ? 'لا توجد شيكات أو مسحوبات معلقة' : 'None'}
                                    </td>
                                    <td className="py-1.5 px-3 text-end font-mono">0.00</td>
                                    <td></td>
                                </tr>
                            ) : (
                                outstandingChecks.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-1.5 px-6 font-mono text-neutral-600 dark:text-neutral-400">
                                            {item.journal_entry?.entry_number || ''} - {item.description} ({item.journal_entry?.date || ''})
                                        </td>
                                        <td className="py-1.5 px-3 text-end font-mono text-red-600">
                                            -{Number(item.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td></td>
                                    </tr>
                                ))
                            )}
                            <tr className="border-b border-dashed border-neutral-300 dark:border-neutral-700 font-medium">
                                <td className="py-1.5 px-3 text-end text-neutral-500">{isRtl ? 'إجمالي الشيكات والمسحوبات المعلقة:' : 'Total Outstanding Checks:'}</td>
                                <td></td>
                                <td className="py-1.5 px-3 text-end font-mono font-bold text-red-600">
                                    -{totalOutstandingChecks.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>

                            {/* 4. Adjusted Bank Balance */}
                            <tr className="border-y-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 font-bold text-sm">
                                <td className="py-2.5 px-3">
                                    {isRtl ? '2. رصيد البنك المعدل (Adjusted Bank Balance)' : '2. Adjusted Bank Balance'}
                                </td>
                                <td></td>
                                <td className="py-2.5 px-3 text-end font-mono text-base font-black text-indigo-700 dark:text-indigo-400">
                                    {adjustedBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>

                            {/* 5. Book Balance */}
                            <tr className="border-b border-neutral-200 dark:border-neutral-800 font-bold text-sm bg-neutral-50/50 dark:bg-neutral-800/20">
                                <td className="py-2.5 px-3">
                                    {isRtl ? '3. رصيد الحساب الدفتري في الأستاذ العام (Ending Balance per Books)' : '3. Ending Balance per General Ledger Books'}
                                </td>
                                <td></td>
                                <td className="py-2.5 px-3 text-end font-mono text-base font-black">
                                    {Number(reconciliation.cleared_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>

                            {/* 6. Discrepancy / Variance */}
                            <tr className="font-bold text-sm bg-emerald-50/50 dark:bg-emerald-950/20">
                                <td className="py-2.5 px-3 text-emerald-800 dark:text-emerald-300">
                                    {isRtl ? 'الفارق بين الرصيدين (Discrepancy / Variance)' : 'Reconciliation Variance'}
                                </td>
                                <td></td>
                                <td className="py-2.5 px-3 text-end font-mono text-base text-emerald-700 dark:text-emerald-400">
                                    {difference.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Amount in words & Notes */}
                <div className="flex justify-between items-end border-t border-neutral-200 dark:border-neutral-800 pt-4 mb-12 text-xs">
                    <div className="max-w-lg space-y-1.5">
                        <div>
                            <span className="text-neutral-500">{isRtl ? 'المبلغ كتابة (بالريال السعودي):' : 'Amount in Words:'}</span>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">
                                {isRtl ? amountInWords.ar : amountInWords.en}
                            </p>
                        </div>
                        {reconciliation.notes && (
                            <div>
                                <span className="text-neutral-500">{isRtl ? 'ملاحظات التسوية:' : 'Notes:'}</span>
                                <p className="italic text-neutral-700 dark:text-neutral-300">{reconciliation.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center">
                        <img src={qrCodeDataUri} alt="QR Verification" className="w-24 h-24 border border-neutral-200 dark:border-neutral-700 p-1 rounded" />
                        <span className="text-[10px] text-neutral-400 font-mono mt-1">الاعتماد البنكي الإلكتروني</span>
                    </div>
                </div>

                {/* Formal 3-Column Accounting Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-neutral-900 dark:border-neutral-100 text-center text-xs">
                    <div className="space-y-8">
                        <p className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            {isRtl ? 'إعداد المحاسب' : 'Prepared by Accountant'}
                        </p>
                        <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                        <p className="text-neutral-500">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                    </div>

                    <div className="space-y-8">
                        <p className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            {isRtl ? 'مراجعة رئيس الحسابات' : 'Reviewed by Chief Accountant'}
                        </p>
                        <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                        <p className="text-neutral-500">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                    </div>

                    <div className="space-y-8">
                        <p className="font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                            {isRtl ? 'اعتماد المدير المالي (CFO)' : 'Approved by Finance Director'}
                        </p>
                        <div className="border-b border-neutral-400 w-3/4 mx-auto"></div>
                        <p className="text-neutral-500">{isRtl ? 'التوقيع والختم' : 'Signature & Stamp'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
