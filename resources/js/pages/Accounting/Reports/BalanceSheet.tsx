import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Scale, CheckCircle2, AlertCircle, Printer, FileSpreadsheet, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface AccountBalance {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    subtype?: string;
    balance: number;
}

interface BalanceSheetReport {
    as_of_date: string;
    assets: AccountBalance[];
    total_assets: number;
    liabilities: AccountBalance[];
    total_liabilities: number;
    equity_accounts: AccountBalance[];
    retained_or_current_earnings: number;
    total_equity: number;
    total_liabilities_and_equity: number;
    is_balanced: boolean;
    discrepancy: number;
}

interface Company {
    id: string;
    name: string;
    legal_name?: string;
    tax_number?: string;
    currency?: string;
}

interface Props {
    report: BalanceSheetReport;
    filters: {
        as_of_date?: string;
    };
    company: Company;
}

export default function BalanceSheet({ report, filters, company }: Props) {
    const { isRtl } = useTranslation();

    const [asOfDate, setAsOfDate] = useState(filters.as_of_date || new Date().toISOString().split('T')[0]);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/balance-sheet', { as_of_date: asOfDate }, { preserveState: true });
    };

    const currency = company?.currency || 'SAR';

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
            <Head title={isRtl ? 'الميزانية العمومية وقائمة المركز المالي' : 'Balance Sheet'} />

            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Scale className="h-7 w-7 text-indigo-600" />
                        <span>{isRtl ? 'الميزانية العمومية وقائمة المركز المالي' : 'Statement of Financial Position (Balance Sheet)'}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'تقرير المركز المالي الختامي: الأصول = الالتزامات + حقوق الملكية'
                            : 'Statement of financial position showing assets, liabilities, and equity balance'}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button asChild variant="outline" size="sm" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
                        <a href={`/reports/balance-sheet/export?as_of_date=${asOfDate}`}>
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
                        </a>
                    </Button>
                    <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة الميزانية' : 'Print Balance Sheet'}</span>
                    </Button>
                </div>
            </div>

            {/* Filter Selection Bar */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:hidden">
                <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex flex-col gap-1.5 w-full sm:w-64">
                        <Label htmlFor="as_of_date">{isRtl ? 'كما في تاريخ (As of Date)' : 'As of Date'}</Label>
                        <Input
                            type="date"
                            id="as_of_date"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
                            className="h-9"
                        />
                    </div>

                    <Button type="submit" size="sm" className="gap-1.5">
                        <Search className="h-4 w-4" />
                        <span>{isRtl ? 'عرض الميزانية' : 'Generate Balance Sheet'}</span>
                    </Button>
                </form>
            </div>

            {/* Printable Balance Sheet Document */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm flex flex-col gap-6 print:border-none print:shadow-none print:p-0">
                {/* Official Header */}
                <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-800 pb-6">
                    <div>
                        <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                            {company?.name}
                        </h2>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {company?.legal_name || company?.name}
                        </p>
                        {company?.tax_number && (
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono mt-1">
                                {isRtl ? 'الرقم الضريبي' : 'Tax ID'}: {company?.tax_number}
                            </p>
                        )}
                    </div>

                    <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-bold rounded-md text-sm border border-neutral-300 dark:border-neutral-700">
                            {isRtl ? 'الميزانية العمومية الرسمية' : 'Balance Sheet Statement'}
                        </span>
                        <p className="text-xs text-neutral-500 font-mono mt-2">
                            {isRtl ? 'كما في تاريخ' : 'As of'}: {report.as_of_date}
                        </p>
                        <p className="text-xs text-neutral-400 font-mono">
                            {isRtl ? 'العملة المحاسبية' : 'Currency'}: {currency}
                        </p>
                    </div>
                </div>

                {/* Accounting Equation Balance Status Alert */}
                <div className={`rounded-xl p-4 flex items-center justify-between border ${
                    report.is_balanced
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}>
                    <div className="flex items-center gap-2.5">
                        {report.is_balanced ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                        )}
                        <span className="text-sm font-bold">
                            {report.is_balanced
                                ? (isRtl ? 'المعادلة المحاسبية متزنة تماماً (الأصول = الخصوم + حقوق الملكية)' : 'Accounting Equation Perfectly Balanced (Assets = Liabilities + Equity)')
                                : (isRtl ? `تنبيه: يوجد فارق محاسبي غير متزن بمقدار: ${report.discrepancy} ${currency}` : `Discrepancy detected: ${report.discrepancy} ${currency}`)}
                        </span>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/60 dark:bg-black/20">
                        {report.total_assets.toLocaleString('en-US', { minimumFractionDigits: 2 })} = {report.total_liabilities_and_equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                </div>

                {/* Executive Totals Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-2">
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 bg-neutral-50/60 dark:bg-neutral-800/40">
                        <span className="text-xs text-neutral-500">{isRtl ? 'إجمالي الأصول' : 'Total Assets'}</span>
                        <div className="text-lg font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                            {Number(report.total_assets).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">{currency}</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 bg-neutral-50/60 dark:bg-neutral-800/40">
                        <span className="text-xs text-neutral-500">{isRtl ? 'إجمالي الالتزامات' : 'Total Liabilities'}</span>
                        <div className="text-lg font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                            {Number(report.total_liabilities).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">{currency}</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 bg-neutral-50/60 dark:bg-neutral-800/40">
                        <span className="text-xs text-neutral-500">{isRtl ? 'أرباح الفترة الحالية' : 'Current Period Profit'}</span>
                        <div className={`text-lg font-mono font-bold mt-1 ${report.retained_or_current_earnings >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {Number(report.retained_or_current_earnings).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">{currency}</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/40">
                        <span className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold">{isRtl ? 'إجمالي حقوق الملكية' : 'Total Equity'}</span>
                        <div className="text-lg font-mono font-black text-indigo-900 dark:text-indigo-200 mt-1">
                            {Number(report.total_equity).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">{currency}</span>
                        </div>
                    </div>
                </div>

                {/* 2-Column Side-by-Side Balance Sheet Presentation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-xs">
                    {/* Left Column: Assets */}
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 font-bold text-neutral-800 dark:text-neutral-200 flex justify-between items-center">
                            <span>{isRtl ? 'الأصول والموجودات (Assets)' : 'Assets'}</span>
                            <span className="font-mono text-xs">{currency}</span>
                        </div>
                        <table className="w-full">
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                                {report.assets.map((acc) => (
                                    <tr key={acc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="py-2.5 px-3 font-bold text-neutral-500 dark:text-neutral-400 w-16">{acc.code}</td>
                                        <td className="py-2.5 px-3 font-sans text-neutral-900 dark:text-neutral-100">
                                            {acc.name_ar ? `${acc.name_ar} - ${acc.name}` : acc.name}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                                            {Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-neutral-100 dark:bg-neutral-800 font-black text-neutral-900 dark:text-neutral-100 border-t-2 border-neutral-300 dark:border-neutral-700 text-sm">
                                    <td colSpan={2} className="py-3 px-3 font-sans">{isRtl ? 'مجموع الأصول' : 'Total Assets'}</td>
                                    <td className="py-3 px-3 text-right">{Number(report.total_assets).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Right Column: Liabilities & Equity */}
                    <div className="flex flex-col gap-6">
                        {/* Liabilities Table */}
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                            <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 font-bold text-neutral-800 dark:text-neutral-200 flex justify-between items-center">
                                <span>{isRtl ? 'الخصوم والالتزامات (Liabilities)' : 'Liabilities'}</span>
                                <span className="font-mono text-xs">{currency}</span>
                            </div>
                            <table className="w-full">
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                                    {report.liabilities.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="py-2.5 px-3 font-bold text-neutral-500 dark:text-neutral-400 w-16">{acc.code}</td>
                                            <td className="py-2.5 px-3 font-sans text-neutral-900 dark:text-neutral-100">
                                                {acc.name_ar ? `${acc.name_ar} - ${acc.name}` : acc.name}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                                                {Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100 border-t border-neutral-300 dark:border-neutral-700">
                                        <td colSpan={2} className="py-2.5 px-3 font-sans">{isRtl ? 'مجموع الالتزامات' : 'Total Liabilities'}</td>
                                        <td className="py-2.5 px-3 text-right">{Number(report.total_liabilities).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Equity Table */}
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                            <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 font-bold text-neutral-800 dark:text-neutral-200 flex justify-between items-center">
                                <span>{isRtl ? 'حقوق الملكية ورأس المال (Equity)' : 'Equity'}</span>
                                <span className="font-mono text-xs">{currency}</span>
                            </div>
                            <table className="w-full">
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                                    {report.equity_accounts.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="py-2.5 px-3 font-bold text-neutral-500 dark:text-neutral-400 w-16">{acc.code}</td>
                                            <td className="py-2.5 px-3 font-sans text-neutral-900 dark:text-neutral-100">
                                                {acc.name_ar ? `${acc.name_ar} - ${acc.name}` : acc.name}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-neutral-800 dark:text-neutral-200">
                                                {Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Current Period Net Income / Retained Row */}
                                    <tr className="bg-indigo-50/40 dark:bg-indigo-950/20 font-semibold text-indigo-950 dark:text-indigo-200">
                                        <td className="py-2.5 px-3 font-bold text-indigo-500 w-16">P&L</td>
                                        <td className="py-2.5 px-3 font-sans">
                                            {isRtl ? 'أرباح / (خسائر) الفترة الحالية التراكمية' : 'Current Period Net Earnings'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold">
                                            {Number(report.retained_or_current_earnings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                    <tr className="bg-neutral-100 dark:bg-neutral-800 font-bold text-neutral-900 dark:text-neutral-100 border-t border-neutral-300 dark:border-neutral-700">
                                        <td colSpan={2} className="py-2.5 px-3 font-sans">{isRtl ? 'مجموع حقوق الملكية' : 'Total Equity'}</td>
                                        <td className="py-2.5 px-3 text-right">{Number(report.total_equity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Combined Liabilities + Equity Total */}
                        <div className="rounded-xl border-2 border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 p-3.5 flex justify-between items-center text-sm font-black text-neutral-900 dark:text-neutral-100">
                            <span>{isRtl ? 'مجموع الخصوم وحقوق الملكية' : 'Total Liabilities & Equity'}</span>
                            <span className="font-mono text-base">{Number(report.total_liabilities_and_equity).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}</span>
                        </div>
                    </div>
                </div>

                {/* Signatures for Financial Statements */}
                <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-3 gap-8 text-center text-xs">
                    <div>
                        <p className="font-semibold text-neutral-700 dark:text-neutral-300">{isRtl ? 'رئيس الحسابات' : 'Chief Accountant'}</p>
                        <div className="h-14 border-b border-dashed border-neutral-300 dark:border-neutral-700 mt-2"></div>
                        <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-neutral-700 dark:text-neutral-300">{isRtl ? 'المدير المالي التنفيذي (CFO)' : 'Chief Financial Officer'}</p>
                        <div className="h-14 border-b border-dashed border-neutral-300 dark:border-neutral-700 mt-2"></div>
                        <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'الاعتماد والمصادقة' : 'Approval & Stamp'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-neutral-700 dark:text-neutral-300">{isRtl ? 'المراجع القانوني / مجلس الإدارة' : 'Auditor / Board Approval'}</p>
                        <div className="h-14 border-b border-dashed border-neutral-300 dark:border-neutral-700 mt-2"></div>
                        <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'المصادقة النظامية' : 'Statutory Certification'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
