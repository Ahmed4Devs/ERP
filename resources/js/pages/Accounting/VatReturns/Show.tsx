import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Percent, Printer, Download, CheckCircle2, Clock, ShieldCheck, ArrowUpRight, ArrowDownRight, FileText, ShoppingBag, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface User {
    id: number;
    name: string;
}

interface JournalLine {
    id: string;
    debit: string;
    credit: string;
    description: string;
    account: {
        code: string;
        name: string;
        name_ar?: string;
    };
}

interface JournalEntry {
    id: string;
    entry_number: string;
    date: string;
    lines: JournalLine[];
}

interface VatReturn {
    id: string;
    return_number: string;
    period_type: string;
    tax_period: string;
    start_date: string;
    end_date: string;
    status: 'draft' | 'filed' | 'paid';
    standard_sales_amount: string;
    standard_sales_vat: string;
    standard_sales_adjustment: string;
    zero_rated_sales_amount: string;
    exempt_sales_amount: string;
    total_sales_amount: string;
    total_output_vat: string;
    standard_purchases_amount: string;
    standard_purchases_vat: string;
    standard_purchases_adjustment: string;
    imports_vat_amount: string;
    zero_rated_purchases_amount: string;
    exempt_purchases_amount: string;
    total_purchases_amount: string;
    total_input_vat: string;
    net_vat_due: string;
    previous_period_credit: string;
    final_net_payable: string;
    filing_date?: string;
    filed_by_user?: User;
    journal_entry?: JournalEntry;
    notes?: string;
}

interface Props {
    vatReturn: VatReturn;
    details: {
        sales_details: any[];
        purchases_details: any[];
        gl_tax_balance: string;
    };
}

export default function VatReturnsShow({ vatReturn, details }: Props) {
    const { isRtl } = useTranslation();
    const [activeTab, setActiveTab] = useState<'form' | 'sales' | 'purchases' | 'settlement'>('form');
    const [isFiling, setIsFiling] = useState(false);

    const handleFileReturn = () => {
        if (!confirm(isRtl ? 'هل أنت متأكد من رغبتك في اعتماد وإقفال هذا الإقرار الضريبي وتوليد قيد التسوية؟' : 'Are you sure you want to officially file this VAT return and generate the tax settlement journal entry?')) {
            return;
        }

        setIsFiling(true);
        router.post(`/accounting/vat-returns/${vatReturn.id}/file`, {}, {
            onFinish: () => setIsFiling(false),
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <Head title={`${vatReturn.return_number} - ${isRtl ? 'إقرار ضريبة القيمة المضافة' : 'VAT Return'}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/accounting/vat-returns">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                {vatReturn.return_number}
                            </h1>
                            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                                {vatReturn.tax_period}
                            </span>
                            {vatReturn.status === 'filed' ? (
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {isRtl ? 'مُعتمد ومُقدم' : 'Filed'}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="h-3.5 w-3.5" />
                                    {isRtl ? 'مسودة قيد المراجعة' : 'Draft'}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-neutral-500 font-mono mt-1">
                            {vatReturn.start_date} → {vatReturn.end_date}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="gap-2">
                        <a href={`/accounting/vat-returns/${vatReturn.id}/print`} target="_blank" rel="noopener noreferrer">
                            <Printer className="h-4 w-4" />
                            <span>{isRtl ? 'طباعة نموذج الهيئة / PDF' : 'Print Declaration / PDF'}</span>
                        </a>
                    </Button>
                    <Button asChild variant="outline" className="gap-2">
                        <a href={`/accounting/vat-returns/${vatReturn.id}/export`} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                            <span>{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
                        </a>
                    </Button>
                    {vatReturn.status === 'draft' && (
                        <Button
                            onClick={handleFileReturn}
                            disabled={isFiling}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                            <ShieldCheck className="h-4 w-4" />
                            <span>{isRtl ? 'اعتماد الإقرار وتوليد قيد التسوية' : 'File & Post Settlement'}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{isRtl ? 'ضريبة المخرجات (المبيعات)' : 'Total Output VAT'}</span>
                        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-mono font-black text-emerald-900 dark:text-emerald-200 mt-1">
                        {Number(vatReturn.total_output_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                        {isRtl ? `المبيعات الخاضعة: ${Number(vatReturn.total_sales_amount).toLocaleString()} SAR` : `Taxable Sales: ${Number(vatReturn.total_sales_amount).toLocaleString()} SAR`}
                    </p>
                </div>

                <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 shadow-xs dark:border-blue-900/50 dark:bg-blue-950/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{isRtl ? 'ضريبة المدخلات (المشتريات)' : 'Total Input VAT'}</span>
                        <ArrowDownRight className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-mono font-black text-blue-900 dark:text-blue-200 mt-1">
                        {Number(vatReturn.total_input_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                        {isRtl ? `المشتريات الخاضعة: ${Number(vatReturn.total_purchases_amount).toLocaleString()} SAR` : `Taxable Purchases: ${Number(vatReturn.total_purchases_amount).toLocaleString()} SAR`}
                    </p>
                </div>

                <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-4 shadow-xs dark:border-indigo-900/50 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{isRtl ? 'صافي الضريبة الواجب سدادها' : 'Net VAT Payable'}</span>
                        <ShieldCheck className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-2xl font-mono font-black text-indigo-900 dark:text-indigo-200 mt-1">
                        {Number(vatReturn.final_net_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                        {isRtl ? 'الرصيد المستحق لهيئة الزكاة والضريبة والجمارك' : 'Amount payable to ZATCA'}
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 text-sm">
                <button
                    onClick={() => setActiveTab('form')}
                    className={`pb-3 px-3 font-semibold transition-colors relative ${
                        activeTab === 'form'
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                >
                    {isRtl ? 'بنود نموذج الإقرار الرسمي (14 بند)' : 'ZATCA Declaration Lines'}
                </button>
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`pb-3 px-3 font-semibold transition-colors relative ${
                        activeTab === 'sales'
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                >
                    {isRtl ? `فواتير ومبيعات المخرجات (${details.sales_details.length})` : `Sales Transactions (${details.sales_details.length})`}
                </button>
                <button
                    onClick={() => setActiveTab('purchases')}
                    className={`pb-3 px-3 font-semibold transition-colors relative ${
                        activeTab === 'purchases'
                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                            : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                >
                    {isRtl ? `فواتير ومشتريات المدخلات (${details.purchases_details.length})` : `Purchases Transactions (${details.purchases_details.length})`}
                </button>
                {vatReturn.journal_entry && (
                    <button
                        onClick={() => setActiveTab('settlement')}
                        className={`pb-3 px-3 font-semibold transition-colors relative ${
                            activeTab === 'settlement'
                                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                    >
                        {isRtl ? 'قيد التسوية المحاسبي' : 'Tax Settlement GL Entry'}
                    </button>
                )}
            </div>

            {/* Tab 1: Official ZATCA Declaration Lines */}
            {activeTab === 'form' && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        {isRtl ? 'جدول بنود إقرار ضريبة القيمة المضافة (ZATCA Form 14 Lines)' : 'ZATCA Value Added Tax Declaration Form'}
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs border-collapse">
                            <thead>
                                <tr className="border-b-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 font-bold">
                                    <th className="py-2.5 px-3 text-start w-12">#</th>
                                    <th className="py-2.5 px-3 text-start">{isRtl ? 'البند الضريبي' : 'Tax Line Item'}</th>
                                    <th className="py-2.5 px-3 text-end">{isRtl ? 'المبلغ الخاضع (SAR)' : 'Taxable Amount'}</th>
                                    <th className="py-2.5 px-3 text-end">{isRtl ? 'التعديلات (SAR)' : 'Adjustments'}</th>
                                    <th className="py-2.5 px-3 text-end">{isRtl ? 'مبلغ الضريبة (SAR)' : 'VAT Amount'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                                    <td className="py-2.5 px-3 font-bold">1</td>
                                    <td className="py-2.5 px-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">
                                        {isRtl ? 'المبيعات الخاضعة للنسبة الأساسية (Standard Rated Sales)' : 'Standard rated sales'}
                                    </td>
                                    <td className="py-2.5 px-3 text-end font-bold">{Number(vatReturn.standard_sales_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2.5 px-3 text-end font-bold text-emerald-600">{Number(vatReturn.standard_sales_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 text-neutral-400">2</td>
                                    <td className="py-2 px-3 font-sans text-neutral-600 dark:text-neutral-400">
                                        {isRtl ? 'المبيعات للمواطنين (الخدمات الصحية/التعليمية الخاصة المعفاة)' : 'Sales to citizens (exempt private services)'}
                                    </td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 text-neutral-400">3</td>
                                    <td className="py-2 px-3 font-sans text-neutral-600 dark:text-neutral-400">
                                        {isRtl ? 'المبيعات المحلية الخاضعة لنسبة الصفر' : 'Zero rated domestic sales'}
                                    </td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 text-neutral-400">4</td>
                                    <td className="py-2 px-3 font-sans text-neutral-600 dark:text-neutral-400">
                                        {isRtl ? 'الصادرات' : 'Exports'}
                                    </td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 text-neutral-400">5</td>
                                    <td className="py-2 px-3 font-sans text-neutral-600 dark:text-neutral-400">
                                        {isRtl ? 'المبيعات المعفاة من الضريبة' : 'Exempt sales'}
                                    </td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                </tr>
                                <tr className="border-t border-b-2 border-neutral-300 dark:border-neutral-700 bg-emerald-50/40 dark:bg-emerald-950/20 font-bold">
                                    <td className="py-2.5 px-3">6</td>
                                    <td className="py-2.5 px-3 font-sans text-emerald-900 dark:text-emerald-300">
                                        {isRtl ? 'إجمالي المبيعات وضريبة المخرجات (Total Sales & Output VAT)' : 'Total Sales & Output VAT'}
                                    </td>
                                    <td className="py-2.5 px-3 text-end font-black">{Number(vatReturn.total_sales_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2.5 px-3 text-end font-black text-emerald-700 dark:text-emerald-400">{Number(vatReturn.total_output_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>

                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                                    <td className="py-2.5 px-3 font-bold">7</td>
                                    <td className="py-2.5 px-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">
                                        {isRtl ? 'المشتريات الخاضعة للنسبة الأساسية (Standard Rated Purchases)' : 'Standard rated purchases'}
                                    </td>
                                    <td className="py-2.5 px-3 text-end font-bold">{Number(vatReturn.standard_purchases_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2.5 px-3 text-end font-bold text-blue-600">{Number(vatReturn.standard_purchases_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 text-neutral-400">8</td>
                                    <td className="py-2 px-3 font-sans text-neutral-600 dark:text-neutral-400">
                                        {isRtl ? 'الاستيرادات الخاضعة للضريبة المدفوعة في الجمارك' : 'Imports subject to VAT paid at customs'}
                                    </td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 text-neutral-400">9</td>
                                    <td className="py-2 px-3 font-sans text-neutral-600 dark:text-neutral-400">
                                        {isRtl ? 'الاستيرادات الخاضعة لآلية الاحتساب العكسي' : 'Imports subject to reverse charge mechanism'}
                                    </td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 text-neutral-400">10</td>
                                    <td className="py-2 px-3 font-sans text-neutral-600 dark:text-neutral-400">
                                        {isRtl ? 'المشتريات الخاضعة لنسبة الصفر والمشتريات المعفاة' : 'Zero rated & exempt purchases'}
                                    </td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                </tr>
                                <tr className="border-t border-b-2 border-neutral-300 dark:border-neutral-700 bg-blue-50/40 dark:bg-blue-950/20 font-bold">
                                    <td className="py-2.5 px-3">11</td>
                                    <td className="py-2.5 px-3 font-sans text-blue-900 dark:text-blue-300">
                                        {isRtl ? 'إجمالي المشتريات وضريبة المدخلات (Total Purchases & Input VAT)' : 'Total Purchases & Input VAT'}
                                    </td>
                                    <td className="py-2.5 px-3 text-end font-black">{Number(vatReturn.total_purchases_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 px-3 text-end text-neutral-400">0.00</td>
                                    <td className="py-2.5 px-3 text-end font-black text-blue-700 dark:text-blue-400">{Number(vatReturn.total_input_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>

                                <tr>
                                    <td className="py-2.5 px-3 font-bold">12</td>
                                    <td className="py-2.5 px-3 font-sans font-semibold">
                                        {isRtl ? 'صافي الضريبة المستحقة للفترة الحالية (Net VAT Due)' : 'Net VAT Due for period'}
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td className="py-2.5 px-3 text-end font-black text-sm">{Number(vatReturn.net_vat_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 text-neutral-400">13</td>
                                    <td className="py-2 px-3 font-sans text-neutral-500">
                                        {isRtl ? 'رصيد دائن مرحل من فترات سابقة (Credit Carried Forward)' : 'Previous period credit'}
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td className="py-2 px-3 text-end text-neutral-400">0.00</td>
                                </tr>
                                <tr className="border-t-2 border-neutral-900 dark:border-neutral-100 bg-indigo-50/50 dark:bg-indigo-950/30 font-black text-sm">
                                    <td className="py-3 px-3">14</td>
                                    <td className="py-3 px-3 font-sans text-indigo-900 dark:text-indigo-200">
                                        {isRtl ? 'صافي الضريبة الواجب سدادها / (المستردة) - Net VAT Payable' : 'Total Net VAT Payable / (Refundable)'}
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td className="py-3 px-3 text-end text-indigo-700 dark:text-indigo-300 font-black text-base">
                                        {Number(vatReturn.final_net_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 2: Sales Output Details */}
            {activeTab === 'sales' && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-indigo-600" />
                            <span>{isRtl ? 'حركات وفواتير المبيعات وضريبة المخرجات' : 'Sales Output VAT Transactions'}</span>
                        </h2>
                        <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
                            {details.sales_details.length} {isRtl ? 'عملية' : 'transactions'}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-medium">
                                    <th className="py-2 text-start">{isRtl ? 'النوع' : 'Type'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'رقم الفاتورة / المرجع' : 'Reference #'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'العميل' : 'Customer'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'المبلغ الخاضع' : 'Taxable Amount'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'نسبة الضريبة' : 'Rate'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'مبلغ الضريبة (SAR)' : 'VAT Amount'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                                {details.sales_details.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="py-2.5 font-sans">
                                            <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="py-2.5 font-bold text-neutral-900 dark:text-neutral-100">{item.reference}</td>
                                        <td className="py-2.5 text-neutral-500">{item.date}</td>
                                        <td className="py-2.5 font-sans font-medium text-neutral-800 dark:text-neutral-200">{item.party}</td>
                                        <td className="py-2.5 text-end">{Number(item.taxable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="py-2.5 text-end text-neutral-500">{item.tax_rate}%</td>
                                        <td className="py-2.5 text-end font-bold text-emerald-600">
                                            {Number(item.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 3: Purchases Input Details */}
            {activeTab === 'purchases' && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-600" />
                            <span>{isRtl ? 'فواتير الموردين وضريبة المدخلات' : 'Purchases Input VAT Transactions'}</span>
                        </h2>
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full">
                            {details.purchases_details.length} {isRtl ? 'فاتورة مورد' : 'bills'}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-medium">
                                    <th className="py-2 text-start">{isRtl ? 'رقم الفاتورة' : 'Bill #'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'مرجع المورد' : 'Vendor Ref'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'المورد' : 'Vendor'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'المبلغ الخاضع' : 'Taxable Amount'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'نسبة الضريبة' : 'Rate'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'مبلغ الضريبة (SAR)' : 'VAT Amount'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                                {details.purchases_details.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="py-2.5 font-bold text-neutral-900 dark:text-neutral-100">{item.reference}</td>
                                        <td className="py-2.5 text-neutral-500">{item.vendor_ref || '-'}</td>
                                        <td className="py-2.5 text-neutral-500">{item.date}</td>
                                        <td className="py-2.5 font-sans font-medium text-neutral-800 dark:text-neutral-200">{item.party}</td>
                                        <td className="py-2.5 text-end">{Number(item.taxable_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="py-2.5 text-end text-neutral-500">{item.tax_rate}%</td>
                                        <td className="py-2.5 text-end font-bold text-blue-600">
                                            {Number(item.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 4: Settlement Journal Entry */}
            {activeTab === 'settlement' && vatReturn.journal_entry && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-indigo-600" />
                            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                                {isRtl ? 'قيد اليومية المحاسبي لإقفال وتسوية الضريبة' : 'Tax Settlement GL Journal Entry'}
                            </h2>
                        </div>
                        <span className="font-mono text-xs font-bold text-neutral-600 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                            {vatReturn.journal_entry.entry_number}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-medium">
                                    <th className="py-2 text-start">{isRtl ? 'رقم الحساب' : 'Account #'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'اسم الحساب' : 'Account Name'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'البيان' : 'Description'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'مدين (SAR)' : 'Debit'}</th>
                                    <th className="py-2 text-end">{isRtl ? 'دائن (SAR)' : 'Credit'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                                {vatReturn.journal_entry.lines.map((jl) => (
                                    <tr key={jl.id}>
                                        <td className="py-2.5 font-bold">{jl.account.code}</td>
                                        <td className="py-2.5 font-sans font-medium">{isRtl && jl.account.name_ar ? jl.account.name_ar : jl.account.name}</td>
                                        <td className="py-2.5 font-sans text-neutral-500">{jl.description}</td>
                                        <td className="py-2.5 text-end font-bold">
                                            {parseFloat(jl.debit) > 0 ? Number(jl.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="py-2.5 text-end font-bold">
                                            {parseFloat(jl.credit) > 0 ? Number(jl.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
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
