import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Printer, CheckCircle2, Clock, Archive, TrendingUp, TrendingDown, ShieldCheck, Building2, Landmark, Tag } from 'lucide-react';
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

interface FixedAsset {
    id: string;
    name: string;
    name_ar?: string;
    asset_tag: string;
    serial_number?: string;
    category?: {
        name: string;
    };
}

interface FixedAssetDisposal {
    id: string;
    disposal_number: string;
    disposal_date: string;
    disposal_type: 'sale' | 'scrap' | 'donation' | 'stolen';
    acquisition_cost: string;
    accumulated_depreciation: string;
    net_book_value: string;
    proceeds: string;
    tax_amount: string;
    gain_loss_amount: string;
    gain_loss_type: 'gain' | 'loss' | 'none';
    buyer_name?: string;
    reason?: string;
    notes?: string;
    status: 'draft' | 'posted';
    posted_at?: string;
    asset?: FixedAsset;
    branch?: {
        name: string;
    };
    bank_account?: Account;
    journal_entry?: JournalEntry;
}

interface Props {
    disposal: FixedAssetDisposal;
}

export default function DisposalsShow({ disposal }: Props) {
    const { isRtl } = useTranslation();

    const handlePost = () => {
        if (confirm(isRtl ? 'هل أنت متأكد من ترحيل عملية استبعاد الأصل وعكس مجمع الإهلاك وإثبات الأرباح/الخسائر الرأسمالية؟' : 'Are you sure you want to post this asset disposal?')) {
            router.post(`/assets/disposals/${disposal.id}/post`);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${isRtl ? 'استبعاد أصل' : 'Asset Disposal'} ${disposal.disposal_number}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0">
                        <Link href="/assets/disposals">
                            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                                {disposal.disposal_number}
                            </h1>
                            {disposal.status === 'posted' ? (
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
                            {isRtl ? 'تاريخ العملية:' : 'Disposal Date:'} {disposal.disposal_date}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/assets/disposals/${disposal.id}/print`}>
                            <Printer className="h-4 w-4" />
                            {isRtl ? 'طباعة محضر الاستبعاد' : 'Print Certificate'}
                        </Link>
                    </Button>

                    {disposal.status === 'draft' && (
                        <Button
                            onClick={handlePost}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            {isRtl ? 'ترحيل الاستبعاد وإثبات القيود' : 'Post & Update GL'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Top Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        {isRtl ? 'بيانات الأصل الثابت' : 'Fixed Asset'}
                    </span>
                    <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {disposal.asset?.name}
                    </div>
                    <div className="text-xs font-mono text-neutral-500">
                        {disposal.asset?.asset_tag} {disposal.asset?.serial_number ? `| SN: ${disposal.asset.serial_number}` : ''}
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {isRtl ? 'نوع العملية والفرع' : 'Type & Branch'}
                    </span>
                    <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100 uppercase">
                        {disposal.disposal_type === 'sale' ? (isRtl ? 'بيع أصل' : 'Sale') : (isRtl ? 'تخريد وشطب' : 'Scrap')}
                    </div>
                    <div className="text-xs text-neutral-500">
                        {disposal.branch?.name || (isRtl ? 'المركز الرئيسي' : 'HQ')}
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                    <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                        <Archive className="h-3.5 w-3.5 text-indigo-600" />
                        {isRtl ? 'الأثر المالي المحقق' : 'Net Capital Result'}
                    </span>
                    {disposal.gain_loss_type === 'gain' ? (
                        <div className="text-lg font-bold font-mono text-emerald-600 flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            +{parseFloat(disposal.gain_loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            <span className="text-xs font-normal text-neutral-500">({isRtl ? 'ربح رأسمالي' : 'Gain'})</span>
                        </div>
                    ) : disposal.gain_loss_type === 'loss' ? (
                        <div className="text-lg font-bold font-mono text-rose-600 flex items-center gap-1">
                            <TrendingDown className="h-4 w-4" />
                            -{parseFloat(disposal.gain_loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            <span className="text-xs font-normal text-neutral-500">({isRtl ? 'خسارة استبعاد' : 'Loss'})</span>
                        </div>
                    ) : (
                        <div className="text-lg font-bold font-mono text-neutral-600">
                            0.00 SAR ({isRtl ? 'بدون ربح/خسارة' : 'Break-even'})
                        </div>
                    )}
                    <div className="text-xs text-neutral-500">
                        {isRtl ? 'حصيلة البيع:' : 'Proceeds:'} {parseFloat(disposal.proceeds).toLocaleString()} SAR
                    </div>
                </div>
            </div>

            {/* Financial Ledger Balance Comparison */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b pb-3 dark:border-neutral-800">
                    {isRtl ? 'جدول تسوية حسابات الأصل والقيمة الدفترية' : 'Ledger Reconciliation & Net Book Value'}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500 block mb-1">{isRtl ? 'التكلفة التاريخية' : 'Acquisition Cost'}</span>
                        <span className="font-mono text-base font-bold text-neutral-900 dark:text-neutral-100">
                            {parseFloat(disposal.acquisition_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </span>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500 block mb-1">{isRtl ? 'مجمع الإهلاك' : 'Acc. Depreciation'}</span>
                        <span className="font-mono text-base font-bold text-rose-600">
                            {parseFloat(disposal.accumulated_depreciation).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </span>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500 block mb-1">{isRtl ? 'القيمة الدفترية (NBV)' : 'Net Book Value'}</span>
                        <span className="font-mono text-base font-bold text-neutral-900 dark:text-neutral-100">
                            {parseFloat(disposal.net_book_value).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </span>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <span className="text-xs text-neutral-500 block mb-1">{isRtl ? 'المحصل من البيع' : 'Proceeds'}</span>
                        <span className="font-mono text-base font-bold text-blue-600">
                            {parseFloat(disposal.proceeds).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </span>
                    </div>
                </div>

                {disposal.reason && (
                    <div className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/30 p-3 rounded-lg">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{isRtl ? 'سبب الاستبعاد:' : 'Reason:'}</span> {disposal.reason}
                    </div>
                )}
            </div>

            {/* Accounting GL Impact (if posted) */}
            {disposal.status === 'posted' && disposal.journal_entry && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b pb-3 dark:border-neutral-800">
                        <Landmark className="h-5 w-5 text-indigo-600" />
                        <span>{isRtl ? 'قيود اليومية الآلية لاستبعاد الأصل' : 'Automated GL Journal Entries'}</span>
                        <span className="text-xs font-mono font-normal text-neutral-400">({disposal.journal_entry.entry_number})</span>
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
                                {disposal.journal_entry.lines.map((jl) => (
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
