import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { TrendingUp, TrendingDown, Printer, FileSpreadsheet, Calendar, Search, DollarSign, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface AccountRow {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    amount: number;
    percentage: number;
}

interface IncomeStatementReport {
    start_date: string;
    end_date: string;
    revenue_accounts: AccountRow[];
    total_revenue: number;
    cogs_accounts: AccountRow[];
    total_cogs: number;
    gross_profit: number;
    gross_profit_margin: number;
    expense_accounts: (AccountRow & { subtype?: string })[];
    total_operating_expenses: number;
    operating_profit: number;
    net_profit: number;
    net_profit_margin: number;
}

interface Company {
    id: string;
    name: string;
    legal_name?: string;
    tax_number?: string;
    currency?: string;
}

interface Props {
    report: IncomeStatementReport;
    filters: {
        start_date?: string;
        end_date?: string;
    };
    company: Company;
}

export default function IncomeStatement({ report, filters, company }: Props) {
    const { isRtl } = useTranslation();

    const [form, setForm] = useState({
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/income-statement', form, { preserveState: true });
    };

    const currency = company?.currency || 'SAR';
    const isProfitable = report.net_profit >= 0;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
            <Head title={isRtl ? 'قائمة الدخل والأرباح والخسائر' : 'Income Statement (P&L)'} />

            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <TrendingUp className="h-7 w-7 text-emerald-600" />
                        <span>{isRtl ? 'قائمة الدخل والأرباح والخسائر' : 'Income Statement (P&L)'}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'تقرير الأداء المالي الختامي الشامل للإيرادات وتكلفة المبيعات ومجمل وصافي الأرباح'
                            : 'Comprehensive financial statement of revenues, cost of sales, gross and net profit'}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button asChild variant="outline" size="sm" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
                        <a href={`/reports/income-statement/export?start_date=${form.start_date}&end_date=${form.end_date}`}>
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
                        </a>
                    </Button>
                    <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة القائمة المالية' : 'Print Statement'}</span>
                    </Button>
                </div>
            </div>

            {/* Filter Selection Bar */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:hidden">
                <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="start_date">{isRtl ? 'من تاريخ' : 'From Date'}</Label>
                        <Input
                            type="date"
                            id="start_date"
                            value={form.start_date}
                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                            className="h-9"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="end_date">{isRtl ? 'إلى تاريخ' : 'To Date'}</Label>
                        <Input
                            type="date"
                            id="end_date"
                            value={form.end_date}
                            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                            className="h-9"
                        />
                    </div>

                    <div>
                        <Button type="submit" size="sm" className="gap-1.5 w-full sm:w-auto">
                            <Search className="h-4 w-4" />
                            <span>{isRtl ? 'تحديث القائمة المالية' : 'Update Statement'}</span>
                        </Button>
                    </div>
                </form>
            </div>

            {/* Printable Financial Statement */}
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
                            {isRtl ? 'قائمة الدخل والأرباح والخسائر الختامية' : 'Official Statement of Profit & Loss'}
                        </span>
                        <p className="text-xs text-neutral-500 font-mono mt-2">
                            {isRtl ? 'عن الفترة المالية المنتهية في' : 'For Period Ending'}: {report.end_date}
                        </p>
                        <p className="text-xs text-neutral-400 font-mono">
                            {isRtl ? 'تاريخ الإعداد' : 'Generated'}: {new Date().toLocaleDateString('en-GB')}
                        </p>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-2">
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/60 dark:bg-neutral-800/40">
                        <span className="text-xs text-neutral-500">{isRtl ? 'إجمالي الإيرادات' : 'Total Revenue'}</span>
                        <div className="text-xl font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                            {Number(report.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">{currency}</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-emerald-50/30 dark:bg-emerald-950/20">
                        <span className="text-xs text-emerald-700 dark:text-emerald-400">{isRtl ? 'مجمل الربح (الهامش)' : 'Gross Profit'}</span>
                        <div className="text-xl font-mono font-bold text-emerald-900 dark:text-emerald-300 mt-1">
                            {Number(report.gross_profit).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">({report.gross_profit_margin}%)</span>
                        </div>
                    </div>

                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 bg-amber-50/30 dark:bg-amber-950/20">
                        <span className="text-xs text-amber-700 dark:text-amber-400">{isRtl ? 'المصروفات التشغيلية' : 'Operating Expenses'}</span>
                        <div className="text-xl font-mono font-bold text-amber-900 dark:text-amber-300 mt-1">
                            {Number(report.total_operating_expenses).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">{currency}</span>
                        </div>
                    </div>

                    <div className={`rounded-xl border p-4 ${
                        isProfitable
                            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40'
                            : 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40'
                    }`}>
                        <span className={`text-xs font-semibold ${isProfitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {isRtl ? 'صافي الربح / (الخسارة)' : 'Net Profit / (Loss)'}
                        </span>
                        <div className={`text-xl font-mono font-black mt-1 ${isProfitable ? 'text-emerald-900 dark:text-emerald-200' : 'text-rose-900 dark:text-rose-200'}`}>
                            {Number(report.net_profit).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">({report.net_profit_margin}%)</span>
                        </div>
                    </div>
                </div>

                {/* Structured Statement Sections */}
                <div className="flex flex-col gap-6 text-sm">
                    {/* 1. Revenues Section */}
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 font-bold text-neutral-800 dark:text-neutral-200 flex justify-between items-center">
                            <span>{isRtl ? '1. الإيرادات التشغيلية والمبيعات (Operating Revenues)' : '1. Operating Revenues'}</span>
                            <span className="text-xs font-mono text-neutral-500">{isRtl ? 'النسبة من الإيراد' : '% of Revenue'}</span>
                        </div>
                        <table className="w-full text-xs">
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                                {report.revenue_accounts.map((acc) => (
                                    <tr key={acc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="py-2.5 px-4 font-bold text-neutral-600 dark:text-neutral-400 w-24">{acc.code}</td>
                                        <td className="py-2.5 px-4 font-sans text-neutral-900 dark:text-neutral-100">
                                            {acc.name_ar ? `${acc.name_ar} - ${acc.name}` : acc.name}
                                        </td>
                                        <td className="py-2.5 px-4 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(acc.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2.5 px-4 text-right text-neutral-500 w-20">{acc.percentage}%</td>
                                    </tr>
                                ))}
                                <tr className="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-900 dark:text-neutral-100 border-t border-neutral-200 dark:border-neutral-700">
                                    <td colSpan={2} className="py-2.5 px-4 font-sans">{isRtl ? 'إجمالي الإيرادات' : 'Total Revenues'}</td>
                                    <td className="py-2.5 px-4 text-right">{Number(report.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 px-4 text-right">100.00%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 2. Cost of Goods Sold & Gross Profit */}
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 font-bold text-neutral-800 dark:text-neutral-200 flex justify-between items-center">
                            <span>{isRtl ? '2. تكلفة البضاعة المباعة والمبيعات (Cost of Goods Sold - COGS)' : '2. Cost of Goods Sold'}</span>
                            <span className="text-xs font-mono text-neutral-500">{isRtl ? 'النسبة من الإيراد' : '% of Revenue'}</span>
                        </div>
                        <table className="w-full text-xs">
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                                {report.cogs_accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-3 px-4 text-center text-neutral-400 font-sans">
                                            {isRtl ? 'لا توجد تكاليف بضاعة مباشرة مسجلة' : 'No COGS transactions recorded.'}
                                        </td>
                                    </tr>
                                ) : (
                                    report.cogs_accounts.map((acc) => (
                                        <tr key={acc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="py-2.5 px-4 font-bold text-neutral-600 dark:text-neutral-400 w-24">{acc.code}</td>
                                            <td className="py-2.5 px-4 font-sans text-neutral-900 dark:text-neutral-100">
                                                {acc.name_ar ? `${acc.name_ar} - ${acc.name}` : acc.name}
                                            </td>
                                            <td className="py-2.5 px-4 text-right text-neutral-800 dark:text-neutral-200">
                                                {Number(acc.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2.5 px-4 text-right text-neutral-500 w-20">{acc.percentage}%</td>
                                        </tr>
                                    ))
                                )}
                                <tr className="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-900 dark:text-neutral-100 border-t border-neutral-200 dark:border-neutral-700">
                                    <td colSpan={2} className="py-2.5 px-4 font-sans">{isRtl ? 'إجمالي تكلفة المبيعات' : 'Total COGS'}</td>
                                    <td className="py-2.5 px-4 text-right text-amber-900 dark:text-amber-300">{Number(report.total_cogs).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 px-4 text-right"></td>
                                </tr>
                                <tr className="bg-emerald-50/80 dark:bg-emerald-950/40 font-black text-emerald-900 dark:text-emerald-200 border-t-2 border-emerald-200 dark:border-emerald-800">
                                    <td colSpan={2} className="py-3 px-4 font-sans text-sm">{isRtl ? 'مجمل الربح (Gross Profit)' : 'Gross Profit'}</td>
                                    <td className="py-3 px-4 text-right text-sm">{Number(report.gross_profit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-3 px-4 text-right text-sm">{report.gross_profit_margin}%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 3. Operating Expenses */}
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 font-bold text-neutral-800 dark:text-neutral-200 flex justify-between items-center">
                            <span>{isRtl ? '3. المصروفات التشغيلية والعمومية (Operating Expenses)' : '3. Operating & Administrative Expenses'}</span>
                            <span className="text-xs font-mono text-neutral-500">{isRtl ? 'النسبة من الإيراد' : '% of Revenue'}</span>
                        </div>
                        <table className="w-full text-xs">
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono">
                                {report.expense_accounts.map((acc) => (
                                    <tr key={acc.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                        <td className="py-2.5 px-4 font-bold text-neutral-600 dark:text-neutral-400 w-24">{acc.code}</td>
                                        <td className="py-2.5 px-4 font-sans text-neutral-900 dark:text-neutral-100">
                                            {acc.name_ar ? `${acc.name_ar} - ${acc.name}` : acc.name}
                                        </td>
                                        <td className="py-2.5 px-4 text-right text-neutral-800 dark:text-neutral-200">
                                            {Number(acc.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2.5 px-4 text-right text-neutral-500 w-20">{acc.percentage}%</td>
                                    </tr>
                                ))}
                                <tr className="bg-neutral-50/80 dark:bg-neutral-800/60 font-bold text-neutral-900 dark:text-neutral-100 border-t border-neutral-200 dark:border-neutral-700">
                                    <td colSpan={2} className="py-2.5 px-4 font-sans">{isRtl ? 'إجمالي المصروفات التشغيلية والإدارية' : 'Total Operating Expenses'}</td>
                                    <td className="py-2.5 px-4 text-right text-amber-900 dark:text-amber-300">{Number(report.total_operating_expenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 px-4 text-right"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Final Net Profit / Loss Banner */}
                    <div className={`rounded-xl p-5 border flex justify-between items-center font-sans ${
                        isProfitable
                            ? 'bg-emerald-500 text-white border-emerald-600 dark:bg-emerald-900 dark:border-emerald-800'
                            : 'bg-rose-500 text-white border-rose-600 dark:bg-rose-900 dark:border-rose-800'
                    }`}>
                        <div>
                            <h3 className="text-lg font-black tracking-wide">
                                {isProfitable ? (isRtl ? 'صافي أرباح الفترة المالية المعتمدة' : 'Net Operating Profit') : (isRtl ? 'صافي خسائر الفترة المالية' : 'Net Operating Loss')}
                            </h3>
                            <p className="text-xs opacity-90 font-mono mt-0.5">
                                {isRtl ? 'الربح التشغيلي بعد خصم جميع المصروفات والتكاليف' : 'Earnings after deduction of all COGS and operating expenses'}
                            </p>
                        </div>
                        <div className="text-right font-mono">
                            <div className="text-2xl font-black">
                                {Number(report.net_profit).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
                            </div>
                            <div className="text-xs opacity-90 font-bold mt-0.5">
                                {isRtl ? 'هامش صافي الربح' : 'Net Margin'}: {report.net_profit_margin}%
                            </div>
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
                        <p className="font-semibold text-neutral-700 dark:text-neutral-300">{isRtl ? 'الرئيس التنفيذي / مجلس الإدارة' : 'CEO / Board Approval'}</p>
                        <div className="h-14 border-b border-dashed border-neutral-300 dark:border-neutral-700 mt-2"></div>
                        <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'الاعتماد النهائي' : 'Final Approval'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
