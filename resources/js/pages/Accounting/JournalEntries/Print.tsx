import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Printer, Building2, CheckCircle2, ShieldCheck, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    code: string;
    name: string;
    name_ar?: string;
}

interface JournalLine {
    id: string;
    debit: string | number;
    credit: string | number;
    description?: string;
    account?: Account;
}

interface JournalEntryDetail {
    id: string;
    entry_number: string;
    date: string;
    description: string;
    status: string;
    source_type?: string;
    lines: JournalLine[];
}

interface Company {
    name: string;
    legal_name?: string;
    tax_number?: string;
    currency?: string;
}

interface Props {
    entry: JournalEntryDetail;
    company: Company | null;
    totals: {
        total_debit: number;
        total_credit: number;
        is_balanced: boolean;
    };
    amountInWords: {
        ar: string;
        en: string;
    };
    qrCodeDataUri: string;
}

export default function JournalEntryPrint({ entry, company, totals, amountInWords, qrCodeDataUri }: Props) {
    const { isRtl } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;
    const currency = company?.currency || 'SAR';

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 print:bg-white print:p-0">
            <Head title={`سند قيد محاسبي - ${entry.entry_number}`} />

            {/* Print Action Toolbar (Hidden in Print) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/accounting/journal-entries/${entry.id}`}>
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة للقيد' : 'Back to Entry'}</span>
                        </Link>
                    </Button>
                    <span className="text-xs text-neutral-500 font-mono">
                        {entry.entry_number}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة سند القيد (A4)' : 'Print Voucher'}</span>
                    </Button>
                </div>
            </div>

            {/* A4 Journal Voucher Sheet */}
            <div className="max-w-4xl mx-auto bg-white border border-neutral-200 shadow-md p-8 sm:p-10 rounded-2xl text-neutral-900 print:shadow-none print:border-none print:p-4 print:max-w-full">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest mb-1">
                            <Building2 className="h-4 w-4" />
                            <span>{company?.name || 'مؤسسة الأعمال المتقدمة'}</span>
                        </div>
                        <h1 className="text-2xl font-black text-neutral-900">
                            {isRtl ? 'سند قيد محاسبي معتمد' : 'Approved Journal Voucher'}
                        </h1>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {company?.legal_name} {company?.tax_number ? `| VAT: ${company.tax_number}` : ''}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                        {qrCodeDataUri && (
                            <img
                                src={qrCodeDataUri}
                                alt="Verification QR Code"
                                className="h-20 w-20 border border-neutral-200 rounded p-1 bg-white"
                            />
                        )}
                        <div className="text-xs font-mono">
                            <span className="inline-block px-3 py-1 rounded-md font-bold bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm">
                                {entry.entry_number}
                            </span>
                            <p className="text-neutral-500 mt-2">{isRtl ? 'تاريخ السند' : 'Date'}:</p>
                            <p className="font-bold text-neutral-900 text-sm">{entry.date}</p>
                            <p className="text-emerald-700 font-semibold text-[11px] mt-0.5">{isRtl ? 'مرحل لدفتر الأستاذ' : 'Posted to GL'}</p>
                        </div>
                    </div>
                </div>

                {/* Voucher General Description */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 mb-6 text-xs flex justify-between items-center">
                    <div>
                        <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'البيان العام للقيد المحاسبي' : 'Voucher General Narrative'}</span>
                        <p className="text-sm font-bold text-neutral-900 mt-0.5 font-sans">{entry.description}</p>
                    </div>
                    {entry.source_type && (
                        <div className="text-right">
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'نوع العملية المصدرية' : 'Source Document'}</span>
                            <span className="font-mono text-xs font-bold text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-200 inline-block mt-0.5">
                                {entry.source_type.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>

                {/* Voucher Accounts Table */}
                <div className="rounded-xl border border-neutral-200 overflow-hidden text-xs mb-6">
                    <table className="w-full text-left">
                        <thead className="bg-neutral-100 text-neutral-800 font-bold border-b border-neutral-200">
                            <tr>
                                <th className="py-2.5 px-3 w-28">{isRtl ? 'رمز الحساب' : 'Account Code'}</th>
                                <th className="py-2.5 px-3">{isRtl ? 'اسم الحساب المحاسبي' : 'Account Name'}</th>
                                <th className="py-2.5 px-3">{isRtl ? 'البيان والتفصيل' : 'Line Description'}</th>
                                <th className="py-2.5 px-3 text-right w-36">{isRtl ? 'مدين (DR)' : 'Debit (DR)'}</th>
                                <th className="py-2.5 px-3 text-right w-36">{isRtl ? 'دائن (CR)' : 'Credit (CR)'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-mono">
                            {entry.lines.map((line) => (
                                <tr key={line.id} className="hover:bg-neutral-50/50">
                                    <td className="py-3 px-3 font-bold text-neutral-700">{line.account?.code}</td>
                                    <td className="py-3 px-3 font-sans font-medium text-neutral-900">
                                        {line.account?.name_ar ? `${line.account.name_ar} - ${line.account.name}` : line.account?.name}
                                    </td>
                                    <td className="py-3 px-3 font-sans text-neutral-500 text-[11px]">{line.description || '-'}</td>
                                    <td className="py-3 px-3 text-right font-bold text-neutral-900">
                                        {Number(line.debit) > 0 ? Number(line.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="py-3 px-3 text-right font-bold text-neutral-900">
                                        {Number(line.credit) > 0 ? Number(line.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                </tr>
                            ))}

                            {/* Total Balance Row */}
                            <tr className="bg-neutral-100 font-bold border-t-2 border-neutral-900 text-neutral-900">
                                <td colSpan={3} className="py-3 px-3 font-sans text-right font-bold text-sm">
                                    {isRtl ? 'المجموع المتوازن (Total Balanced)' : 'Total Balanced Amount'}
                                </td>
                                <td className="py-3 px-3 text-right font-black text-sm">
                                    {Number(totals.total_debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-3 text-right font-black text-sm">
                                    {Number(totals.total_credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Amount in Words (Tafqeet) */}
                <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4 mb-8 text-xs flex justify-between items-center">
                    <div>
                        <span className="text-neutral-400 block mb-0.5">{isRtl ? 'المبلغ كتابة وتفقيطاً' : 'Total Amount in Words'}:</span>
                        <p className="font-bold text-indigo-950 font-sans text-sm">{amountInWords.ar}</p>
                        <p className="text-neutral-500 italic font-mono text-[11px] mt-0.5">{amountInWords.en}</p>
                    </div>
                    <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                            <CheckCircle2 className="h-4 w-4" />
                            {isRtl ? 'القيد متزن محاسبياً' : 'Balanced Entry'}
                        </span>
                    </div>
                </div>

                {/* Official Signatures Block */}
                <div className="pt-6 border-t border-neutral-200 grid grid-cols-3 gap-8 text-center text-xs">
                    <div>
                        <p className="font-semibold text-neutral-800">{isRtl ? 'إعداد المحاسب المسؤول' : 'Prepared By'}</p>
                        <div className="h-14 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-neutral-800">{isRtl ? 'تدقيق ومراجعة الحسابات' : 'Audited By'}</p>
                        <div className="h-14 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'توقيع المدقق' : 'Auditor Signature'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-neutral-800">{isRtl ? 'اعتماد المدير المالي' : 'Chief Financial Officer'}</p>
                        <div className="h-14 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'الختم والاعتماد' : 'Stamp & Approval'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
