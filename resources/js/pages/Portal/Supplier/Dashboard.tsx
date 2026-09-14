import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    DollarSign,
    Download,
    ExternalLink,
    FileSpreadsheet,
    FileText,
    Package,
    Receipt,
    RefreshCw,
    Search,
    ShieldCheck,
    Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface VendorInfo {
    id: string;
    name: string;
    name_ar?: string;
    tax_number?: string;
    commercial_register?: string;
    email?: string;
    phone?: string;
    currency: string;
    payment_terms_days?: number;
}

interface CompanyInfo {
    id: string;
    name: string;
    tax_number?: string;
    email?: string;
    phone?: string;
    currency: string;
}

interface Metrics {
    outstanding_balance: number;
    total_invoiced: number;
    total_paid: number;
    open_orders_count: number;
    open_orders_value: number;
}

interface BillItem {
    id: string;
    bill_number: string;
    vendor_invoice_ref?: string;
    date: string;
    due_date: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    amount_paid: number;
    balance_due: number;
    status: string;
}

interface OrderItem {
    id: string;
    po_number: string;
    date: string;
    expected_delivery_date?: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    status: string;
    currency: string;
}

interface StatementTx {
    date: string;
    type: string;
    type_ar: string;
    reference: string;
    debit: number;
    credit: number;
    balance: number;
    notes?: string;
}

interface StatementData {
    start_date: string;
    end_date: string;
    opening_balance: number;
    transactions: StatementTx[];
    total_debit: number;
    total_credit: number;
    closing_balance: number;
}

interface Props {
    vendor: VendorInfo;
    company: CompanyInfo;
    metrics: Metrics;
    bills: BillItem[];
    orders: OrderItem[];
    statement: StatementData;
    dateRange: {
        start_date: string;
        end_date: string;
    };
    portalToken: string;
}

export default function SupplierPortalDashboard({
    vendor,
    company,
    metrics,
    bills,
    orders,
    statement,
    dateRange,
    portalToken,
}: Props) {
    const { t, isRtl } = useTranslation();
    const [activeTab, setActiveTab] = useState<'bills' | 'orders' | 'statement'>('bills');
    const [billSearch, setBillSearch] = useState('');
    const [orderSearch, setOrderSearch] = useState('');
    const [startDate, setStartDate] = useState(dateRange.start_date);
    const [endDate, setEndDate] = useState(dateRange.end_date);
    const [isFilterLoading, setIsFilterLoading] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);

    const handleFilterStatement = (e: React.FormEvent) => {
        e.preventDefault();
        setIsFilterLoading(true);
        router.get(
            `/supplier-portal/${portalToken}`,
            { start_date: startDate, end_date: endDate },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsFilterLoading(false),
            }
        );
    };

    const handleCopyPortalLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2500);
    };

    const filteredBills = bills.filter(b =>
        b.bill_number.toLowerCase().includes(billSearch.toLowerCase()) ||
        (b.vendor_invoice_ref && b.vendor_invoice_ref.toLowerCase().includes(billSearch.toLowerCase()))
    );

    const filteredOrders = orders.filter(o =>
        o.po_number.toLowerCase().includes(orderSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`بوابة الموردين | ${vendor.name_ar || vendor.name}`} />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/20">
                            <Truck className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-50">
                                    {company.name}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    {isRtl ? 'بوابة المورد الرقمية' : 'Supplier Portal'}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {isRtl ? 'الرقم الضريبي للمنشأة' : 'Client VAT'}: {company.tax_number || '300123456700003'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyPortalLink}
                            className="text-xs gap-1.5 border-neutral-300 dark:border-neutral-700"
                        >
                            {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-neutral-500" />}
                            <span>{copiedUrl ? (isRtl ? 'تم النسخ!' : 'Copied!') : (isRtl ? 'نسخ رابط الدخول' : 'Share Link')}</span>
                        </Button>
                        <a
                            href={`/supplier-portal/${portalToken}/statement/export?start_date=${startDate}&end_date=${endDate}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <Button size="sm" className="text-xs gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900">
                                <Download className="h-3.5 w-3.5" />
                                <span>{isRtl ? 'تصدير كشف الحساب' : 'Export Statement'}</span>
                            </Button>
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Vendor Identity & Profile Banner */}
                <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                {isRtl ? 'بيانات الشريك المعتمد' : 'Verified Vendor Partner'}
                            </span>
                            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">
                                {isRtl && vendor.name_ar ? vendor.name_ar : vendor.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
                                {vendor.tax_number && (
                                    <span>
                                        {isRtl ? 'الرقم الضريبي للمورد:' : 'Vendor VAT:'}{' '}
                                        <strong className="font-mono text-neutral-700 dark:text-neutral-300">{vendor.tax_number}</strong>
                                    </span>
                                )}
                                {vendor.commercial_register && (
                                    <span>
                                        {isRtl ? 'السجل التجاري:' : 'CR Number:'}{' '}
                                        <strong className="font-mono text-neutral-700 dark:text-neutral-300">{vendor.commercial_register}</strong>
                                    </span>
                                )}
                                {vendor.payment_terms_days ? (
                                    <span>
                                        {isRtl ? 'أجل السداد:' : 'Payment Terms:'}{' '}
                                        <strong className="text-neutral-700 dark:text-neutral-300">{vendor.payment_terms_days} {isRtl ? 'يوماً' : 'days'}</strong>
                                    </span>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right rtl:text-left sm:text-left rtl:sm:text-right bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                <span className="text-xs font-medium text-neutral-500">{isRtl ? 'العملة المعتمدة' : 'Settlement Currency'}</span>
                                <p className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                                    {vendor.currency || 'SAR'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Financial Overview Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm dark:border-amber-950 dark:bg-amber-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                {isRtl ? 'الرصيد المستحق غير المسدد' : 'Outstanding Payable'}
                            </span>
                            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                                <CreditCard className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black font-mono text-amber-900 dark:text-amber-100">
                            {metrics.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                            <span className="text-xs font-normal font-sans text-amber-700 dark:text-amber-300">SAR</span>
                        </p>
                        <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">
                            {isRtl ? 'إجمالي الفواتير قيد السداد' : 'Pending vendor bills for settlement'}
                        </p>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                {isRtl ? 'إجمالي الفواتير المفوترة' : 'Total Invoiced'}
                            </span>
                            <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                <FileText className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black font-mono text-neutral-900 dark:text-neutral-100">
                            {metrics.total_invoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                            <span className="text-xs font-normal font-sans text-neutral-500">SAR</span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                            {isRtl ? `عبر ${bills.length} فاتورة شراء معتمدة` : `Across ${bills.length} approved bills`}
                        </p>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                {isRtl ? 'إجمالي المبالغ المسددة' : 'Total Paid Out'}
                            </span>
                            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                            {metrics.total_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                            <span className="text-xs font-normal font-sans text-neutral-500">SAR</span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                            {isRtl ? 'دفعات نقدية وبنكية محولة' : 'Bank payments cleared'}
                        </p>
                    </div>

                    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                {isRtl ? 'أوامر الشراء المفتوحة' : 'Open Purchase Orders'}
                            </span>
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                                <Package className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="mt-2 text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                            {metrics.open_orders_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
                            <span className="text-xs font-normal font-sans text-neutral-500">SAR</span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                            {isRtl ? `${metrics.open_orders_count} أوامر قيد التوريد والتنفيذ` : `${metrics.open_orders_count} orders pending fulfillment`}
                        </p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-neutral-200 dark:border-neutral-800">
                    <nav className="flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('bills')}
                            className={`pb-4 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors ${
                                activeTab === 'bills'
                                    ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400'
                            }`}
                        >
                            <FileText className="h-4 w-4" />
                            <span>{isRtl ? 'فواتير المورد والمطالبات' : 'Vendor Bills & Invoices'}</span>
                            <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-300">
                                {bills.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`pb-4 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors ${
                                activeTab === 'orders'
                                    ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400'
                            }`}
                        >
                            <Package className="h-4 w-4" />
                            <span>{isRtl ? 'أوامر الشراء والتوريد' : 'Purchase Orders'}</span>
                            <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-300">
                                {orders.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('statement')}
                            className={`pb-4 px-1 border-b-2 font-semibold text-sm flex items-center gap-2 transition-colors ${
                                activeTab === 'statement'
                                    ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400'
                            }`}
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>{isRtl ? 'كشف الحساب والمطابقة المالية' : 'Statement of Account'}</span>
                        </button>
                    </nav>
                </div>

                {/* Tab 1: Vendor Bills */}
                {activeTab === 'bills' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search className={`absolute top-2.5 h-4 w-4 text-neutral-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                                <Input
                                    value={billSearch}
                                    onChange={(e) => setBillSearch(e.target.value)}
                                    placeholder={isRtl ? 'البحث برقم الفاتورة أو مرجع المورد...' : 'Search by bill # or invoice ref...'}
                                    className={isRtl ? 'pr-9 text-xs' : 'pl-9 text-xs'}
                                />
                            </div>
                            <span className="text-xs text-neutral-500">
                                {isRtl ? `عرض ${filteredBills.length} من أصل ${bills.length} فاتورة` : `Showing ${filteredBills.length} of ${bills.length} bills`}
                            </span>
                        </div>

                        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs rtl:text-right">
                                    <thead className="border-b border-neutral-200 bg-neutral-50/50 uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                                        <tr>
                                            <th className="px-4 py-3">{isRtl ? 'رقم الفاتورة' : 'Bill #'}</th>
                                            <th className="px-4 py-3">{isRtl ? 'مرجع فاتورة المورد' : 'Vendor Ref #'}</th>
                                            <th className="px-4 py-3">{isRtl ? 'التاريخ' : 'Date'}</th>
                                            <th className="px-4 py-3">{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? 'المبلغ قبل الضريبة' : 'Subtotal'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? 'ضريبة 15%' : 'VAT (15%)'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left font-bold">{isRtl ? 'الإجمالي' : 'Total'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left text-emerald-600">{isRtl ? 'المسدد' : 'Paid'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left font-bold text-amber-700 dark:text-amber-400">{isRtl ? 'المتبقي' : 'Balance Due'}</th>
                                            <th className="px-4 py-3 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {filteredBills.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="px-4 py-8 text-center text-neutral-500">
                                                    {isRtl ? 'لا توجد فواتير مطابقة للبحث' : 'No bills found'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredBills.map((b) => (
                                                <tr key={b.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/50">
                                                    <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                        {b.bill_number}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                                                        {b.vendor_invoice_ref || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                        {b.date}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                        {b.due_date}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono">
                                                        {b.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono text-neutral-500">
                                                        {b.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                        {b.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono text-emerald-600 dark:text-emerald-400">
                                                        {b.amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-amber-700 dark:text-amber-400">
                                                        {b.balance_due.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                            b.status === 'paid'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : b.status === 'partially_paid'
                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                                : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                                                        }`}>
                                                            {b.status === 'paid' ? (isRtl ? 'مسددة بالكامل' : 'Paid') :
                                                             b.status === 'partially_paid' ? (isRtl ? 'سداد جزئي' : 'Partially Paid') :
                                                             b.status === 'posted' ? (isRtl ? 'مستحقة السداد' : 'Posted') : b.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 2: Purchase Orders */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="relative flex-1 max-w-sm">
                                <Search className={`absolute top-2.5 h-4 w-4 text-neutral-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                                <Input
                                    value={orderSearch}
                                    onChange={(e) => setOrderSearch(e.target.value)}
                                    placeholder={isRtl ? 'البحث برقم أمر الشراء...' : 'Search by PO #...'}
                                    className={isRtl ? 'pr-9 text-xs' : 'pl-9 text-xs'}
                                />
                            </div>
                            <span className="text-xs text-neutral-500">
                                {isRtl ? `عرض ${filteredOrders.length} من أصل ${orders.length} أمر شراء` : `Showing ${filteredOrders.length} of ${orders.length} orders`}
                            </span>
                        </div>

                        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs rtl:text-right">
                                    <thead className="border-b border-neutral-200 bg-neutral-50/50 uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                                        <tr>
                                            <th className="px-4 py-3">{isRtl ? 'رقم أمر الشراء' : 'PO #'}</th>
                                            <th className="px-4 py-3">{isRtl ? 'تاريخ الأمر' : 'Order Date'}</th>
                                            <th className="px-4 py-3">{isRtl ? 'تاريخ التوريد المتوقع' : 'Delivery Date'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? 'المبلغ قبل الضريبة' : 'Subtotal'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left">{isRtl ? 'ضريبة 15%' : 'VAT (15%)'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left font-bold">{isRtl ? 'الإجمالي' : 'Total'}</th>
                                            <th className="px-4 py-3 text-center">{isRtl ? 'حالة التوريد' : 'Status'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                                                    {isRtl ? 'لا توجد أوامر شراء مطابقة' : 'No purchase orders found'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrders.map((o) => (
                                                <tr key={o.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/50">
                                                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                        {o.po_number}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                        {o.date}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                        {o.expected_delivery_date || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono">
                                                        {o.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono text-neutral-500">
                                                        {o.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                        {o.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} {o.currency}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                            o.status === 'approved' || o.status === 'completed'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : o.status === 'sent'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                                                : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                                                        }`}>
                                                            {o.status === 'approved' ? (isRtl ? 'معتمد للتوريد' : 'Approved') :
                                                             o.status === 'completed' ? (isRtl ? 'مكتمل ومورد' : 'Completed') :
                                                             o.status === 'sent' ? (isRtl ? 'مرسل للمورد' : 'Sent') : o.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab 3: Statement of Account */}
                {activeTab === 'statement' && (
                    <div className="space-y-4">
                        {/* Filter Bar */}
                        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <form onSubmit={handleFilterStatement} className="flex flex-wrap items-end gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                                        {isRtl ? 'من تاريخ' : 'Start Date'}
                                    </label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                                        {isRtl ? 'إلى تاريخ' : 'End Date'}
                                    </label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isFilterLoading}
                                    className="h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    <RefreshCw className={`h-3.5 w-3.5 ${isFilterLoading ? 'animate-spin' : ''}`} />
                                    <span>{isRtl ? 'تحديث الكشف' : 'Filter Ledger'}</span>
                                </Button>
                            </form>
                        </div>

                        {/* Statement Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="rounded-lg border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <span className="text-xs text-neutral-500 font-medium">{isRtl ? 'الرصيد الافتتاحي' : 'Opening Balance'}</span>
                                <p className="mt-1 font-mono font-bold text-base text-neutral-900 dark:text-neutral-100">
                                    {statement.opening_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </p>
                            </div>
                            <div className="rounded-lg border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <span className="text-xs text-neutral-500 font-medium">{isRtl ? 'إجمالي المدين (سدادات)' : 'Total Debits (Payments)'}</span>
                                <p className="mt-1 font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                                    {statement.total_debit.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </p>
                            </div>
                            <div className="rounded-lg border border-neutral-200 bg-white p-3.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <span className="text-xs text-neutral-500 font-medium">{isRtl ? 'إجمالي الدائن (فواتير)' : 'Total Credits (Bills)'}</span>
                                <p className="mt-1 font-mono font-bold text-base text-amber-700 dark:text-amber-400">
                                    {statement.total_credit.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </p>
                            </div>
                            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 shadow-sm dark:border-amber-950 dark:bg-amber-950/30">
                                <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">{isRtl ? 'الرصيد الختامي المستحق' : 'Closing Balance'}</span>
                                <p className="mt-1 font-mono font-bold text-lg text-amber-900 dark:text-amber-100">
                                    {statement.closing_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </p>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs rtl:text-right">
                                    <thead className="border-b border-neutral-200 bg-neutral-50/50 uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                                        <tr>
                                            <th className="px-4 py-3">{isRtl ? 'التاريخ' : 'Date'}</th>
                                            <th className="px-4 py-3">{isRtl ? 'نوع الحركة' : 'Type'}</th>
                                            <th className="px-4 py-3">{isRtl ? 'المرجع' : 'Reference'}</th>
                                            <th className="px-4 py-3">{isRtl ? 'البيان والتفاصيل' : 'Notes / Description'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left text-emerald-600">{isRtl ? 'مدين (سداد)' : 'Debit (Paid)'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left text-amber-700 dark:text-amber-400">{isRtl ? 'دائن (فاتورة)' : 'Credit (Billed)'}</th>
                                            <th className="px-4 py-3 text-right rtl:text-left font-bold">{isRtl ? 'الرصيد الجاري' : 'Running Balance'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {statement.transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                                                    {isRtl ? 'لا توجد حركات مالية خلال هذه الفترة' : 'No transactions found in this period'}
                                                </td>
                                            </tr>
                                        ) : (
                                            statement.transactions.map((tx, idx) => (
                                                <tr key={idx} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/50">
                                                    <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                                                        {tx.date}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                                        {isRtl ? tx.type_ar : tx.type}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-blue-600 dark:text-blue-400">
                                                        {tx.reference}
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                        {tx.notes || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-medium text-emerald-600 dark:text-emerald-400">
                                                        {tx.debit > 0 ? tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-medium text-amber-700 dark:text-amber-400">
                                                        {tx.credit > 0 ? tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                        {tx.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="mt-12 border-t border-neutral-200 py-6 text-center text-xs text-neutral-500 dark:border-neutral-800">
                <p>
                    {isRtl
                        ? `بوابة المورد الرقمية الموحدة — ${company.name}. جميع الحقوق محفوظة.`
                        : `Digital B2B Supplier Portal — ${company.name}. All rights reserved.`}
                </p>
            </footer>
        </div>
    );
}
