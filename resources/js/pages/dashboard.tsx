import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    TrendingUp,
    TrendingDown,
    ReceiptText,
    Users,
    Store,
    Boxes,
    CreditCard,
    PlusCircle,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    ShieldCheck,
    FileSpreadsheet,
    Activity,
    Layers,
    Clock,
    FileText,
    FolderKanban,
    Sparkles,
    Landmark,
    Wallet,
    BarChart3,
    Percent,
    Receipt,
    ShoppingBag,
    FileCheck2,
    Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface InvoiceItem {
    id: string;
    invoice_number: string;
    party_name: string;
    party_name_ar?: string | null;
    total: number;
    status: string;
    currency: string;
    date: string;
}

interface BillItem {
    id: string;
    bill_number: string;
    party_name: string;
    party_name_ar?: string | null;
    total: number;
    status: string;
    currency: string;
    date: string;
}

interface FinancialIntelligence {
    working_capital: number;
    current_ratio: number;
    quick_ratio: number;
    cash_ratio: number;
    current_assets: number;
    current_liabilities: number;
    cash_and_bank: number;
    inventory_valuation: number;
    accounts_receivable: number;
    accounts_payable: number;
    dso_days: number;
}

interface MonthlyTrend {
    month_key: string;
    label_en: string;
    label_ar: string;
    revenue: number;
    expenses: number;
    net_profit: number;
}

interface ZatcaCompliance {
    cleared: number;
    reported: number;
    pending: number;
    rejected: number;
    total_invoices: number;
    compliance_rate: number;
}

interface CommercialPipeline {
    confirmed_orders_count: number;
    delivering_orders_count: number;
    unbilled_orders_value: number;
    fully_billed_orders_count: number;
}

interface TopCustomer {
    party_id: string;
    name: string;
    name_ar?: string | null;
    invoices_count: number;
    total_volume: number;
}

interface BiMetrics {
    financial_intelligence: FinancialIntelligence;
    monthly_trends: MonthlyTrend[];
    zatca_compliance: ZatcaCompliance;
    commercial_pipeline: CommercialPipeline;
    top_customers: TopCustomer[];
}

interface DashboardProps {
    stats?: {
        totalRevenue: number;
        totalBills: number;
        invoicesCount: number;
        draftInvoicesCount: number;
        customersCount: number;
        productsCount: number;
        posSessionsCount: number;
        projectsCount: number;
        currency: string;
    };
    biMetrics?: BiMetrics;
    recentInvoices?: InvoiceItem[];
    recentBills?: BillItem[];
}

export default function Dashboard({
    stats = {
        totalRevenue: 0,
        totalBills: 0,
        invoicesCount: 0,
        draftInvoicesCount: 0,
        customersCount: 0,
        productsCount: 0,
        posSessionsCount: 0,
        projectsCount: 0,
        currency: 'SAR',
    },
    biMetrics = {
        financial_intelligence: {
            working_capital: 0,
            current_ratio: 1.0,
            quick_ratio: 1.0,
            cash_ratio: 1.0,
            current_assets: 0,
            current_liabilities: 0,
            cash_and_bank: 0,
            inventory_valuation: 0,
            accounts_receivable: 0,
            accounts_payable: 0,
            dso_days: 0,
        },
        monthly_trends: [],
        zatca_compliance: {
            cleared: 0,
            reported: 0,
            pending: 0,
            rejected: 0,
            total_invoices: 0,
            compliance_rate: 100,
        },
        commercial_pipeline: {
            confirmed_orders_count: 0,
            delivering_orders_count: 0,
            unbilled_orders_value: 0,
            fully_billed_orders_count: 0,
        },
        top_customers: [],
    },
    recentInvoices = [],
    recentBills = [],
}: DashboardProps) {
    const { locale, t } = useTranslation();
    const isAr = locale === 'ar';
    const currency = stats.currency || 'SAR';

    const fi = biMetrics.financial_intelligence;
    const zatca = biMetrics.zatca_compliance;
    const pipeline = biMetrics.commercial_pipeline;
    const trends = biMetrics.monthly_trends;
    const topClients = biMetrics.top_customers;

    // Calculate maximum volume for trend bar charts
    const maxTrendVal = Math.max(
        ...trends.map((m) => Math.max(m.revenue, m.expenses, 1)),
        1000
    );

    return (
        <>
            <Head title={t('app.dashboard', 'لوحة ذكاء الأعمال والقيادة التنفيذية')} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {/* 1. Executive Master Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gradient-to-r from-emerald-950/30 via-background to-background dark:from-emerald-950/50 p-6 rounded-2xl border border-emerald-900/30 shadow-sm">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
                            <Sparkles className="size-3.5" />
                            <span>{isAr ? 'منظومة تخطيط الموارد المؤسسية للشركات السعودية (Enterprise Edition)' : 'Saudi Commercial Enterprise ERP v2026'}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {isAr ? 'مركز القيادة والذكاء المالي التنفيذي' : 'Executive Financial & Operational BI'}
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {isAr
                                ? 'تحليل مباشر لمؤشرات السيولة، رأس المال العامل، الامتثال لـ ZATCA، وخط المبيعات'
                                : 'Live telemetry on working capital, liquidity ratios, ZATCA Phase 2 compliance, and revenue pipeline'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium border border-neutral-200 dark:border-neutral-700">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{isAr ? 'النظام متصل وآمن' : 'System Healthy'}</span>
                        </div>
                        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-medium shadow-sm">
                            <Link href="/invoices/create">
                                <PlusCircle className="size-4" />
                                <span>{isAr ? 'فاتورة ضريبية' : 'New Tax Invoice'}</span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="gap-1.5 font-medium">
                            <Link href="/sales/quotations/create">
                                <Receipt className="size-4 text-emerald-600" />
                                <span>{isAr ? 'عرض سعر / أمر' : 'New Quotation'}</span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="gap-1.5 font-medium">
                            <Link href="/payroll/runs">
                                <Building2 className="size-4 text-blue-600" />
                                <span>{isAr ? 'مسير الرواتب' : 'Payroll Runs'}</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 2. C-Level Financial Intelligence & Liquidity Bar */}
                <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Landmark className="size-5 text-emerald-600 dark:text-emerald-400" />
                            <div>
                                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                                    {isAr ? 'مؤشرات الملاءة والسيولة المالية التنفيذية (Liquidity & Solvency Ratios)' : 'Solvency & Working Capital Ratios'}
                                </h2>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    {isAr ? 'مستخرجة لحظياً من دفتر الأستاذ العام وقائمة المركز المالي IFRS' : 'Derived in real-time from General Ledger & IFRS Balance Sheet'}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            {isAr ? 'معايير المحاسبة الدولية IFRS' : 'IFRS Compliant'}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Working Capital */}
                        <div className="p-4 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
                            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                                <span>{isAr ? 'رأس المال العامل' : 'Working Capital'}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${fi.working_capital >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                                    {fi.working_capital >= 0 ? (isAr ? 'فائض تشغيلي' : 'Positive') : (isAr ? 'عجز تشغيلي' : 'Deficit')}
                                </span>
                            </div>
                            <div className="text-lg md:text-xl font-mono font-black text-neutral-900 dark:text-neutral-100">
                                {Number(fi.working_capital).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                <span className="text-xs font-bold text-neutral-400 ms-1">{currency}</span>
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-1 flex justify-between">
                                <span>{isAr ? 'الأصول المتداولة:' : 'Current Assets:'}</span>
                                <span className="font-mono">{Number(fi.current_assets).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Current Ratio */}
                        <div className="p-4 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
                            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                                <span>{isAr ? 'نسبة التداول (Current Ratio)' : 'Current Ratio'}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${fi.current_ratio >= 1.5 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                                    {fi.current_ratio >= 1.5 ? (isAr ? 'آمن ومثالي' : 'Healthy') : (isAr ? 'مقبول' : 'Moderate')}
                                </span>
                            </div>
                            <div className="text-lg md:text-xl font-mono font-black text-neutral-900 dark:text-neutral-100">
                                {fi.current_ratio}x
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-1 flex justify-between">
                                <span>{isAr ? 'الخصوم المتداولة:' : 'Liabilities:'}</span>
                                <span className="font-mono">{Number(fi.current_liabilities).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Cash & Treasury Liquidity */}
                        <div className="p-4 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
                            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                                <span>{isAr ? 'النقدية والبنوك (Treasury)' : 'Cash & Bank Reserves'}</span>
                                <Wallet className="size-3.5 text-emerald-600" />
                            </div>
                            <div className="text-lg md:text-xl font-mono font-black text-emerald-700 dark:text-emerald-400">
                                {Number(fi.cash_and_bank).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                <span className="text-xs font-bold text-neutral-400 ms-1">{currency}</span>
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-1 flex justify-between">
                                <span>{isAr ? 'نسبة النقد الفوري:' : 'Cash Ratio:'}</span>
                                <span className="font-mono font-bold">{fi.cash_ratio}x</span>
                            </div>
                        </div>

                        {/* DSO (Days Sales Outstanding) */}
                        <div className="p-4 rounded-xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60">
                            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
                                <span>{isAr ? 'متوسط فترة التحصيل (DSO)' : 'Collection Period (DSO)'}</span>
                                <Clock className="size-3.5 text-blue-600" />
                            </div>
                            <div className="text-lg md:text-xl font-mono font-black text-neutral-900 dark:text-neutral-100">
                                {fi.dso_days}
                                <span className="text-xs font-bold text-neutral-500 ms-1.5">{isAr ? 'يوم' : 'Days'}</span>
                            </div>
                            <div className="text-[11px] text-neutral-500 mt-1 flex justify-between">
                                <span>{isAr ? 'الذمم المدينة المستحقة:' : 'Total AR:'}</span>
                                <span className="font-mono">{Number(fi.accounts_receivable).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Primary Financial & Commercial Telemetry Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isAr ? 'إجمالي المبيعات المرحلة' : 'Posted Gross Revenue'}
                            </span>
                            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <TrendingUp className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight font-mono">
                                {Number(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-xs font-bold text-neutral-400 ms-1.5">{currency}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {stats.invoicesCount} {isAr ? 'فاتورة معتمدة' : 'Invoices'}
                                </span>
                                <span>{isAr ? 'شاملة ضريبة القيمة المضافة' : 'Inc. VAT'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payables & Procurement */}
                    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isAr ? 'التزامات ومشتريات الموردين' : 'Vendor Procurement Bills'}
                            </span>
                            <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <CreditCard className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight font-mono">
                                {Number(stats.totalBills).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-xs font-bold text-neutral-400 ms-1.5">{currency}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {isAr ? 'مستحقات معلقة:' : 'Open AP:'} {Number(fi.accounts_payable).toLocaleString()}
                                </span>
                                <span>{isAr ? 'دورة المشتريات' : 'Procure-to-pay'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Commercial Sales Orders Pipeline */}
                    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isAr ? 'خط أوامر البيع والتوريد' : 'Sales Orders Pipeline'}
                            </span>
                            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <ShoppingBag className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight font-mono">
                                {Number(pipeline.unbilled_orders_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                <span className="text-xs font-bold text-neutral-400 ms-1.5">{currency}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <span className="font-semibold text-amber-600 dark:text-amber-400">
                                    {pipeline.confirmed_orders_count} {isAr ? 'أمر بيع جاهز للفوترة' : 'Confirmed Orders'}
                                </span>
                                <span>{pipeline.delivering_orders_count} {isAr ? 'قيد التوريد' : 'Delivering'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stock Valuation & Catalog */}
                    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isAr ? 'تقييم المخزون والمستودعات' : 'Inventory Stock Valuation'}
                            </span>
                            <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <Boxes className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight font-mono">
                                {Number(fi.inventory_valuation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                <span className="text-xs font-bold text-neutral-400 ms-1.5">{currency}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                    {stats.productsCount} {isAr ? 'صنف نشط' : 'Stock Items'}
                                </span>
                                <span>{isAr ? 'متوسط مرجح MAC' : 'Avg Cost'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Financial BI Performance Trends & ZATCA Compliance Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Monthly Trends Chart (2 cols) */}
                    <div className="lg:col-span-2 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="size-5 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                                        {isAr ? 'اتجاه الإيرادات والمصروفات وصافي الأرباح (آخر 6 أشهر)' : 'Monthly Revenue vs Procurement & Net Margin'}
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {isAr ? 'تحليل مقارن لحظي للأداء المالي الفعلي للشركة' : 'Real-time 6-month comparative operational financials'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-medium">
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <span className="size-2.5 rounded-sm bg-emerald-500" />
                                    {isAr ? 'الإيرادات' : 'Revenue'}
                                </span>
                                <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                                    <span className="size-2.5 rounded-sm bg-rose-400" />
                                    {isAr ? 'المشتريات' : 'Expenses'}
                                </span>
                            </div>
                        </div>

                        {trends.length > 0 ? (
                            <div className="space-y-4 pt-2">
                                {trends.map((m) => {
                                    const revPercent = Math.min(100, Math.round((m.revenue / maxTrendVal) * 100));
                                    const expPercent = Math.min(100, Math.round((m.expenses / maxTrendVal) * 100));

                                    return (
                                        <div key={m.month_key} className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-medium">
                                                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                    {isAr ? m.label_ar : m.label_en}
                                                </span>
                                                <div className="flex items-center gap-4 font-mono text-xs">
                                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                                        +{Number(m.revenue).toLocaleString()} {currency}
                                                    </span>
                                                    <span className="text-neutral-400">|</span>
                                                    <span className="text-rose-600 dark:text-rose-400">
                                                        -{Number(m.expenses).toLocaleString()} {currency}
                                                    </span>
                                                    <span className="text-neutral-400">|</span>
                                                    <span className={`font-bold px-1.5 py-0.2 rounded text-[11px] ${m.net_profit >= 0 ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}`}>
                                                        {m.net_profit >= 0 ? '+' : ''}{Number(m.net_profit).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Visual Progress Bar */}
                                            <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex gap-1 p-0.5">
                                                <div
                                                    style={{ width: `${revPercent}%` }}
                                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                    title={`Revenue: ${m.revenue}`}
                                                />
                                                <div
                                                    style={{ width: `${expPercent}%` }}
                                                    className="h-full bg-rose-400 rounded-full transition-all duration-500"
                                                    title={`Expenses: ${m.expenses}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-neutral-400">
                                <Clock className="size-8 mx-auto mb-2 opacity-50" />
                                <p>{isAr ? 'لا توجد بيانات تاريخية كافية بعد' : 'No historical data recorded yet'}</p>
                            </div>
                        )}
                    </div>

                    {/* ZATCA Phase 2 Compliance Live Engine (1 col) */}
                    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                                        {isAr ? 'مؤشر الامتثال لهيئة الزكاة ZATCA' : 'ZATCA Compliance Telemetry'}
                                    </h3>
                                </div>
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                                    Phase 2 (Fatoora)
                                </span>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 mb-4 text-center">
                                <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider mb-1">
                                    {isAr ? 'معدل الامتثال والاعتماد الضريبي' : 'Tax Clearance Success Rate'}
                                </div>
                                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                                    {zatca.compliance_rate}%
                                </div>
                                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                                    {isAr ? 'معتمد ومحمي بالختم التشفيري والـ Cryptographic Stamp' : 'Cryptographically stamped & chain verified'}
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-xs">
                                    <span className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        {isAr ? 'فواتير B2B المعتمدة (Cleared)' : 'Cleared Standard Invoices'}
                                    </span>
                                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{zatca.cleared}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-xs">
                                    <span className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                                        <CheckCircle2 className="size-4 text-blue-600" />
                                        {isAr ? 'فواتير B2C المبسطة (Reported)' : 'Reported Simplified Invoices'}
                                    </span>
                                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{zatca.reported}</span>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-xs">
                                    <span className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                                        <Clock className="size-4 text-amber-500" />
                                        {isAr ? 'فواتير جاهزة للإرسال' : 'Pending Clearance'}
                                    </span>
                                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{zatca.pending}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                            <Button asChild variant="outline" size="sm" className="w-full text-xs font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                                <Link href="/settings/zatca">
                                    <span>{isAr ? 'إدارة شهادات CSID وربط هيئة الزكاة' : 'ZATCA Integration & CSID Portal'}</span>
                                    <ArrowUpRight className="size-3.5 ms-1" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 5. Top 5 Enterprise Clients by Volume */}
                {topClients.length > 0 && (
                    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-3 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                            <div className="flex items-center gap-2">
                                <Users className="size-5 text-indigo-600" />
                                <div>
                                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                                        {isAr ? 'أكبر العملاء والمؤسسات من حيث حجم التعاملات' : 'Top Enterprise Clients by Revenue Volume'}
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {isAr ? 'العملاء الأكثر مساهمة في الإيرادات المرحلة مع فحص الائتمان' : 'High-impact enterprise clients driving posted sales'}
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="text-xs text-indigo-600">
                                <Link href="/customers">
                                    <span>{isAr ? 'دليل العملاء' : 'View Clients'}</span>
                                    <ArrowUpRight className="size-3.5 ms-1" />
                                </Link>
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-start">
                                <thead className="bg-neutral-50/80 dark:bg-neutral-800/50 text-neutral-500 font-semibold border-b border-neutral-200/80 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-4 py-2.5 text-start">{isAr ? 'اسم العميل / المنشأة' : 'Client / Company'}</th>
                                        <th className="px-4 py-2.5 text-center">{isAr ? 'عدد الفواتير' : 'Invoices'}</th>
                                        <th className="px-4 py-2.5 text-end">{isAr ? 'إجمالي المبيعات' : 'Total Volume'}</th>
                                        <th className="px-4 py-2.5 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {topClients.map((client) => (
                                        <tr key={client.party_id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                                            <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">
                                                {isAr && client.name_ar ? client.name_ar : client.name}
                                            </td>
                                            <td className="px-4 py-2.5 text-center font-mono">
                                                {client.invoices_count}
                                            </td>
                                            <td className="px-4 py-2.5 text-end font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                                {Number(client.total_volume).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <Button asChild variant="outline" size="sm" className="h-6 text-[11px] px-2">
                                                    <Link href={`/reports/customer-statement?party_id=${client.party_id}`}>
                                                        {isAr ? 'كشف الحساب' : 'Statement'}
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 6. Two-Column Operational Layout (Recent Invoices & Bills) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Recent Invoices & Bills */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Invoices Table */}
                        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 shadow-xs overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-neutral-200/80 dark:border-neutral-800">
                                <div>
                                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                                        {isAr ? 'أحدث فواتير المبيعات الضريبية' : 'Recent Tax Invoices'}
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        {isAr ? 'الفواتير الصادرة مؤخراً وحالة اعتمادها' : 'Latest issued invoices and posting status'}
                                    </p>
                                </div>
                                <Button asChild variant="ghost" size="sm" className="text-xs text-emerald-600 hover:text-emerald-700">
                                    <Link href="/invoices">
                                        <span>{isAr ? 'عرض الكل' : 'View All'}</span>
                                        <ArrowUpRight className="size-3.5 ms-1" />
                                    </Link>
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-neutral-50/80 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-semibold border-b border-neutral-200/80 dark:border-neutral-800">
                                        <tr>
                                            <th className="px-4 py-3 text-start">{isAr ? 'رقم الفاتورة' : 'Invoice #'}</th>
                                            <th className="px-4 py-3 text-start">{isAr ? 'العميل' : 'Customer'}</th>
                                            <th className="px-4 py-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                                            <th className="px-4 py-3 text-end">{isAr ? 'المبلغ الإجمالي' : 'Total'}</th>
                                            <th className="px-4 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {recentInvoices.length > 0 ? (
                                            recentInvoices.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                                        <Link href={`/invoices/${inv.id}`} className="hover:underline">
                                                            {inv.invoice_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                                                        {isAr && inv.party_name_ar ? inv.party_name_ar : inv.party_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{inv.date}</td>
                                                    <td className="px-4 py-3 text-end font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap font-mono">
                                                        {Number(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} {inv.currency}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                                                inv.status === 'posted'
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                                            }`}
                                                        >
                                                            {inv.status === 'posted' ? (isAr ? 'مرحلة' : 'Posted') : (isAr ? 'مسودة' : 'Draft')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-neutral-400">
                                                    <Clock className="size-6 mx-auto mb-2 opacity-50" />
                                                    <p>{isAr ? 'لا توجد فواتير حديثة مسجلة في هذا النطاق' : 'No recent invoices registered for this entity'}</p>
                                                    <Button asChild size="sm" variant="outline" className="mt-3 text-xs">
                                                        <Link href="/invoices/create">{isAr ? 'إنشاء أول فاتورة' : 'Create First Invoice'}</Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Vendor Bills Table */}
                        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 shadow-xs overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-neutral-200/80 dark:border-neutral-800">
                                <div>
                                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                                        {isAr ? 'أحدث فواتير المشتريات والموردين' : 'Recent Vendor Bills'}
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        {isAr ? 'فواتير التوريد الصادرة من الموردين' : 'Latest procurement bills and payment tracking'}
                                    </p>
                                </div>
                                <Button asChild variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
                                    <Link href="/vendor-bills">
                                        <span>{isAr ? 'عرض الكل' : 'View All'}</span>
                                        <ArrowUpRight className="size-3.5 ms-1" />
                                    </Link>
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-neutral-50/80 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 font-semibold border-b border-neutral-200/80 dark:border-neutral-800">
                                        <tr>
                                            <th className="px-4 py-3 text-start">{isAr ? 'رقم الفاتورة' : 'Bill #'}</th>
                                            <th className="px-4 py-3 text-start">{isAr ? 'المورد' : 'Vendor'}</th>
                                            <th className="px-4 py-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                                            <th className="px-4 py-3 text-end">{isAr ? 'المبلغ الإجمالي' : 'Total'}</th>
                                            <th className="px-4 py-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {recentBills.length > 0 ? (
                                            recentBills.map((bill) => (
                                                <tr key={bill.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-medium text-blue-600 dark:text-blue-400">
                                                        <Link href={`/vendor-bills/${bill.id}`} className="hover:underline">
                                                            {bill.bill_number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                                                        {isAr && bill.party_name_ar ? bill.party_name_ar : bill.party_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">{bill.date}</td>
                                                    <td className="px-4 py-3 text-end font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap font-mono">
                                                        {Number(bill.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} {bill.currency}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                            {bill.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-neutral-400">
                                                    <p>{isAr ? 'لا توجد فواتير موردين مسجلة' : 'No vendor bills registered'}</p>
                                                    <Button asChild size="sm" variant="outline" className="mt-3 text-xs">
                                                        <Link href="/vendor-bills/create">{isAr ? 'تسجيل فاتورة مورد' : 'New Vendor Bill'}</Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right 1 Col: Compliance, Shortcuts & System Integrity Matrix */}
                    <div className="space-y-6">
                        {/* Direct Reports Shortcuts */}
                        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2 mb-3">
                                <Layers className="size-4 text-emerald-600" />
                                <span>{isAr ? 'التقارير التحليلية والمحاسبية' : 'Executive Reports & Statements'}</span>
                            </h3>

                            <div className="space-y-1.5">
                                <Link
                                    href="/reports/balance-sheet"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'قائمة المركز المالي (الميزانية العمومية)' : 'Balance Sheet (Financial Position)'}</span>
                                    <ArrowUpRight className="size-3.5 text-neutral-400" />
                                </Link>
                                <Link
                                    href="/reports/income-statement"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'قائمة الدخل والأرباح والخسائر' : 'Income Statement (P&L)'}</span>
                                    <ArrowUpRight className="size-3.5 text-neutral-400" />
                                </Link>
                                <Link
                                    href="/reports/cash-flow"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'قائمة التدفقات النقدية' : 'Statement of Cash Flows'}</span>
                                    <ArrowUpRight className="size-3.5 text-neutral-400" />
                                </Link>
                                <Link
                                    href="/accounting/vat-returns"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'إقرارات ضريبة القيمة المضافة ZATCA' : 'VAT Returns Portal'}</span>
                                    <ArrowUpRight className="size-3.5 text-neutral-400" />
                                </Link>
                                <Link
                                    href="/payroll/gosi"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'إقرارات واشتراكات التأمينات GOSI' : 'Saudi GOSI Returns Engine'}</span>
                                    <ArrowUpRight className="size-3.5 text-neutral-400" />
                                </Link>
                                <Link
                                    href="/reports/ar-aging"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'أعمار ديون العملاء (AR Aging)' : 'AR Aging Schedule'}</span>
                                    <ArrowUpRight className="size-3.5 text-neutral-400" />
                                </Link>
                                <Link
                                    href="/reports/inventory-valuation"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'تقييم المخزون التراكمي' : 'Inventory Valuation (MAC)'}</span>
                                    <ArrowUpRight className="size-3.5 text-neutral-400" />
                                </Link>
                            </div>
                        </div>

                        {/* Enterprise Architecture Badge */}
                        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2 mb-3">
                                <ShieldCheck className="size-4 text-emerald-600" />
                                <span>{isAr ? 'أمان النظام والتثبيت المستقل' : 'Turnkey Enterprise Architecture'}</span>
                            </h3>
                            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                    <span>{isAr ? 'نسخة مستقلة معزولة لكل عميل (Turnkey Dedicated Instance)' : 'Dedicated Turnkey Database & Cache'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                    <span>{isAr ? 'مطابق لمتطلبات هيئة الزكاة والضريبة والجمارك المرحلة الثانية' : 'ZATCA Phase 2 Fatoora Compliant'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                    <span>{isAr ? 'نظام احتساب التأمينات الاجتماعية وساند GOSI' : 'Saudi Labor & GOSI Statutory Engine'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                    <span>{isAr ? 'رقابة الائتمان التجاري ومنع تجاوز الحدود المالية' : 'Customer Credit Limit Hard Enforcement'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Dashboard',
                href: dashboard(),
            },
        ]}
    >
        {page}
    </AppLayout>
);
