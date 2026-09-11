import { Head, Link } from '@inertiajs/react';
import {
    TrendingUp,
    ReceiptText,
    Users,
    Store,
    Boxes,
    CreditCard,
    PlusCircle,
    ArrowUpRight,
    CheckCircle2,
    ShieldCheck,
    FileSpreadsheet,
    Activity,
    Layers,
    Clock,
    FileText,
    FolderKanban,
    Sparkles,
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
    recentInvoices = [],
    recentBills = [],
}: DashboardProps) {
    const { locale, t } = useTranslation();
    const isAr = locale === 'ar';
    const currency = stats.currency || 'SAR';

    return (
        <>
            <Head title={t('app.dashboard', 'لوحة التحكم التنفيذية')} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                {/* 1. Header Banner */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-linear-to-r from-emerald-950/20 via-background to-background dark:from-emerald-950/40 p-6 rounded-2xl border border-emerald-900/20 shadow-xs">
                    <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
                            <Sparkles className="size-3.5" />
                            <span>{isAr ? 'منظومة تخطيط الموارد المؤسسية المتكاملة' : 'Enterprise ERP Platform'}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            {isAr ? 'لوحة التحكم التنفيذية والعمليات' : 'Executive Operations Dashboard'}
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {isAr
                                ? 'نظرة شاملة ولحظية على مؤشرات الأداء المالي، المبيعات، المخزون، ونقاط البيع'
                                : 'Real-time overview of financial indicators, sales, inventory valuation, and retail operations'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium border border-neutral-200 dark:border-neutral-700">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{isAr ? 'النظام متصل ونشط' : 'System Online'}</span>
                        </div>
                        <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-medium shadow-xs">
                            <Link href="/invoices/create">
                                <PlusCircle className="size-4" />
                                <span>{isAr ? 'فاتورة جديدة' : 'New Invoice'}</span>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="gap-1.5 font-medium">
                            <Link href="/retail/terminals">
                                <Store className="size-4 text-emerald-600" />
                                <span>{isAr ? 'نقاط البيع' : 'POS'}</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* 2. Executive KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isAr ? 'إجمالي المبيعات المرحلة' : 'Total Posted Revenue'}
                            </span>
                            <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <TrendingUp className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                {Number(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-xs font-bold text-neutral-400 ms-1.5">{currency}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                    {stats.invoicesCount} {isAr ? 'فاتورة صادرة' : 'Invoices'}
                                </span>
                                <span>• {isAr ? 'معتمدة محاسبياً' : 'Audited'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payables Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isAr ? 'التزامات وفواتير الموردين' : 'Vendor Payables'}
                            </span>
                            <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <CreditCard className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                {Number(stats.totalBills).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-xs font-bold text-neutral-400 ms-1.5">{currency}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                                    {isAr ? 'أوامر التوريد' : 'Procurement'}
                                </span>
                                <span>• {isAr ? 'دورة المشتريات' : 'Procure-to-pay'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customers & Catalog */}
                    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isAr ? 'العملاء ودليل الأصناف' : 'Customers & Catalog'}
                            </span>
                            <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <Users className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                {stats.customersCount}
                                <span className="text-sm font-semibold text-neutral-500 ms-1.5">{isAr ? 'عميل نشط' : 'Clients'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                <Boxes className="size-3.5 text-amber-600" />
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                    {stats.productsCount} {isAr ? 'صنف في المستودعات' : 'Products in stock'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Operations & POS */}
                    <div className="relative overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs transition-all hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isAr ? 'الجلسات والمشاريع الجارية' : 'POS & Operations'}
                            </span>
                            <div className="size-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                <Store className="size-5" />
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-neutral-50 tracking-tight">
                                {stats.posSessionsCount}
                                <span className="text-sm font-semibold text-neutral-500 ms-1.5">{isAr ? 'جلسة كاشير' : 'Sessions'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                <FolderKanban className="size-3.5 text-purple-600" />
                                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                    {stats.projectsCount} {isAr ? 'مشروع قيد الإنجاز' : 'Active projects'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Quick Actions Bar */}
                <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2">
                            <Activity className="size-4 text-emerald-600" />
                            <span>{isAr ? 'الإجراءات السريعة والمباشرة' : 'Quick Operational Actions'}</span>
                        </h2>
                        <span className="text-xs text-neutral-400">{isAr ? 'اختصارات لتسهيل سير العمل' : 'Workflow shortcuts'}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <Link
                            href="/invoices/create"
                            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-center"
                        >
                            <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <ReceiptText className="size-5" />
                            </div>
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{isAr ? 'فاتورة جديدة' : 'New Invoice'}</span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">{isAr ? 'خدمات ومبيعات' : 'Sales'}</span>
                        </Link>

                        <Link
                            href="/customers"
                            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-200 dark:hover:border-blue-800 transition-all text-center"
                        >
                            <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Users className="size-5" />
                            </div>
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{isAr ? 'إدارة العملاء' : 'Customers'}</span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">{isAr ? 'الأطراف والشركاء' : 'Directory'}</span>
                        </Link>

                        <Link
                            href="/purchase-orders/create"
                            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 hover:border-amber-200 dark:hover:border-amber-800 transition-all text-center"
                        >
                            <div className="size-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <FileText className="size-5" />
                            </div>
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{isAr ? 'أمر شراء' : 'Purchase Order'}</span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">{isAr ? 'الموردين والعقود' : 'Vendors'}</span>
                        </Link>

                        <Link
                            href="/retail/terminals"
                            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 hover:border-purple-200 dark:hover:border-purple-800 transition-all text-center"
                        >
                            <div className="size-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Store className="size-5" />
                            </div>
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{isAr ? 'نقاط البيع' : 'Retail POS'}</span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">{isAr ? 'الكاشير والفروع' : 'Terminals'}</span>
                        </Link>

                        <Link
                            href="/inventory/products"
                            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all text-center"
                        >
                            <div className="size-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Boxes className="size-5" />
                            </div>
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{isAr ? 'المستودعات' : 'Inventory'}</span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">{isAr ? 'المنتجات والأرصدة' : 'Stock Items'}</span>
                        </Link>

                        <Link
                            href="/reports/trial-balance"
                            className="group flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 hover:border-cyan-200 dark:hover:border-cyan-800 transition-all text-center"
                        >
                            <div className="size-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <FileSpreadsheet className="size-5" />
                            </div>
                            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{isAr ? 'ميزان المراجعة' : 'Trial Balance'}</span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">{isAr ? 'التقارير المالية' : 'Financials'}</span>
                        </Link>
                    </div>
                </div>

                {/* 4. Two-Column Operational Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Recent Invoices & Transactions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Recent Invoices Table */}
                        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 shadow-xs overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-neutral-200/80 dark:border-neutral-800">
                                <div>
                                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                                        {isAr ? 'أحدث فواتير المبيعات والخدمات' : 'Recent Sales Invoices'}
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
                                                    <td className="px-4 py-3 text-end font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
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
                                                    <td className="px-4 py-3 text-end font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
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

                    {/* Right 1 Col: Compliance, Trust & System Integrity Matrix */}
                    <div className="space-y-6">
                        {/* Compliance Card */}
                        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <ShieldCheck className="size-4 text-emerald-600" />
                                <span>{isAr ? 'الامتثال والأمان المؤسسي' : 'Security & Compliance'}</span>
                            </h3>

                            <div className="space-y-3.5">
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                                            {isAr ? 'هيئة الزكاة والضريبة ZATCA' : 'ZATCA Phase 2 E-Invoicing'}
                                        </div>
                                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                                            {isAr
                                                ? 'رمز الاستجابة السريعة (QR)، التشفير الرقمي والربط اللحظي مفعل'
                                                : 'QR Code, Cryptographic Stamp & Hash Chaining active'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                                    <CheckCircle2 className="size-5 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-blue-950 dark:text-blue-200">
                                            {isAr ? 'عزل المستأجرين (ASVS 4.0)' : 'Strict Multi-Tenant Isolation'}
                                        </div>
                                        <p className="text-[11px] text-blue-800 dark:text-blue-300 mt-0.5">
                                            {isAr
                                                ? 'عزل مشدد لبيانات كل شركة وفرع مع تدقيق أمني عالي'
                                                : 'Company-level scoped queries and zero cross-leakage'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/60">
                                    <CheckCircle2 className="size-5 text-neutral-600 dark:text-neutral-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-200">
                                            {isAr ? 'توازن القيود المحاسبية IFRS' : 'Balanced Double-Entry Ledger'}
                                        </div>
                                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5">
                                            {isAr
                                                ? 'المدين = الدائن 100% بدون أي فوارق حسابية'
                                                : 'Zero discrepancy mathematical journal balance'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Direct Reports Shortcuts */}
                        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-5 shadow-xs">
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 uppercase tracking-wider flex items-center gap-2 mb-3">
                                <Layers className="size-4 text-emerald-600" />
                                <span>{isAr ? 'التقارير التحليلية المباشرة' : 'Executive Reports'}</span>
                            </h3>

                            <div className="space-y-1.5">
                                <Link
                                    href="/reports/trial-balance"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'ميزان المراجعة الشامل' : 'Trial Balance Report'}</span>
                                    <ArrowUpRight className="size-3.5 text-neutral-400" />
                                </Link>
                                <Link
                                    href="/reports/general-ledger"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'دفتر الأستاذ العام' : 'General Ledger'}</span>
                                    <ArrowUpRight className="size-3.5 text-neutral-400" />
                                </Link>
                                <Link
                                    href="/reports/inventory-valuation"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'تقييم المخزون (المتوسط المرجح)' : 'Inventory Valuation (MAC)'}</span>
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
                                    href="/payroll/runs"
                                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-medium text-neutral-700 dark:text-neutral-300"
                                >
                                    <span>{isAr ? 'مسيرات رواتب الموظفين' : 'Payroll Runs'}</span>
                                    <ArrowUpRight className="size-3.5 text-neutral-400" />
                                </Link>
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
