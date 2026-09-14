import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Building2,
    FileText,
    Receipt,
    CreditCard,
    DollarSign,
    Download,
    Printer,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ShieldCheck,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ExternalLink,
    Landmark,
    Copy,
    Check,
    Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface CustomerInfo {
    id: string;
    name: string;
    name_ar?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
    address?: any;
    currency: string;
    payment_terms_days: number;
}

interface CompanyInfo {
    name: string;
    legal_name?: string;
    tax_number?: string;
    currency: string;
    settings?: {
        cr_number?: string;
        address?: string;
        phone?: string;
        email?: string;
        iban?: string;
        bank_name?: string;
        swift?: string;
    };
}

interface Metrics {
    credit_limit: number;
    outstanding_balance: number;
    available_credit: number;
    total_invoiced: number;
    total_paid: number;
    invoices_count: number;
    orders_count: number;
}

interface InvoiceItem {
    id: string;
    invoice_number: string;
    date: string;
    due_date: string;
    subtotal: number;
    tax_amount: number;
    total: number;
    amount_paid: number;
    balance_due: number;
    status: string;
    zatca_status?: string;
    has_xml: boolean;
}

interface OrderItem {
    id: string;
    order_number: string;
    order_date: string;
    delivery_date?: string;
    total_amount: number;
    status: string;
    invoicing_status: string;
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
    customer?: any;
    start_date: string;
    end_date: string;
    opening_balance: number;
    transactions: StatementTx[];
    total_debit: number;
    total_credit: number;
    closing_balance: number;
}

interface Props {
    portalToken: string;
    customer: CustomerInfo;
    company: CompanyInfo;
    metrics: Metrics;
    invoices: InvoiceItem[];
    orders: OrderItem[];
    statement: StatementData;
    statementFilters: {
        start_date: string;
        end_date: string;
    };
}

export default function CustomerPortalDashboard({
    portalToken,
    customer,
    company,
    metrics,
    invoices,
    orders,
    statement,
    statementFilters,
}: Props) {
    const { isRtl } = useTranslation();
    const [activeTab, setActiveTab] = useState<'invoices' | 'statement' | 'orders' | 'banking'>('invoices');
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [startDate, setStartDate] = useState(statementFilters.start_date || '');
    const [endDate, setEndDate] = useState(statementFilters.end_date || '');
    const [copiedIban, setCopiedIban] = useState(false);

    const currency = customer.currency || company.currency || 'SAR';

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(isRtl ? 'ar-SA' : 'en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(val);
    };

    const handleFilterStatement = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            `/portal/${portalToken}`,
            {
                start_date: startDate,
                end_date: endDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleCopyIban = (iban: string) => {
        navigator.clipboard.writeText(iban);
        setCopiedIban(true);
        setTimeout(() => setCopiedIban(false), 2500);
    };

    const filteredInvoices = invoices.filter((inv) => {
        if (!invoiceSearch) return true;
        const q = invoiceSearch.toLowerCase();
        return inv.invoice_number.toLowerCase().includes(q) || inv.date.includes(q);
    });

    const creditUtilizationPct = metrics.credit_limit > 0
        ? Math.min(100, Math.round((metrics.outstanding_balance / metrics.credit_limit) * 100))
        : 0;

    const companyDisplayName = isRtl
        ? (company.legal_name || company.name)
        : (company.name || company.legal_name);

    const customerDisplayName = isRtl
        ? (customer.name_ar || customer.name)
        : (customer.name || customer.name_ar);

    const defaultIban = company.settings?.iban || 'SA4420000001234567890123';
    const defaultBank = company.settings?.bank_name || (isRtl ? 'مصرف الراجحي' : 'Al Rajhi Bank');
    const defaultSwift = company.settings?.swift || 'RJHISARI';

    return (
        <div className={`min-h-screen bg-neutral-950 text-neutral-100 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`${customerDisplayName} - ${isRtl ? 'بوابة العملاء الإلكترونية' : 'Customer Portal'}`} />

            {/* Top Brand Banner */}
            <header className="border-b border-neutral-800/80 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-bold text-xl">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg text-white tracking-tight">{companyDisplayName}</span>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                    {isRtl ? 'بوابة العملاء الرسمية' : 'Verified B2B Portal'}
                                </span>
                            </div>
                            <div className="text-xs text-neutral-400 flex items-center gap-3 mt-0.5">
                                {company.tax_number && (
                                    <span>
                                        {isRtl ? 'الرقم الضريبي:' : 'VAT ID:'} <span className="font-mono text-neutral-300">{company.tax_number}</span>
                                    </span>
                                )}
                                {company.settings?.cr_number && (
                                    <span>
                                        {isRtl ? 'س.ت:' : 'CR:'} <span className="font-mono text-neutral-300">{company.settings.cr_number}</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-end hidden sm:block">
                        <div className="text-sm font-semibold text-white">{customerDisplayName}</div>
                        <div className="text-xs text-neutral-400 flex items-center justify-end gap-2">
                            {customer.tax_id && (
                                <span>{isRtl ? 'ضريبة العميل:' : 'Customer VAT:'} <span className="font-mono text-neutral-300">{customer.tax_id}</span></span>
                            )}
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            <span className="text-emerald-400 font-medium">{isRtl ? 'متصل' : 'Authorized'}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Welcome Card & Key Telemetry */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                    {/* Outstanding Balance */}
                    <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-sm relative overflow-hidden group hover:border-neutral-700 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                {isRtl ? 'الرصيد المستحق القائم' : 'Outstanding Balance'}
                            </span>
                            <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-white tracking-tight">
                                {formatCurrency(metrics.outstanding_balance)}
                            </span>
                            <span className="text-xs text-neutral-400 font-medium">{currency}</span>
                        </div>
                        <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                            <span>
                                {isRtl
                                    ? `فترة سداد معتمدة: ${customer.payment_terms_days || 30} يوم`
                                    : `Payment Terms: ${customer.payment_terms_days || 30} days`}
                            </span>
                        </div>
                    </div>

                    {/* Available Credit */}
                    <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-sm relative overflow-hidden group hover:border-neutral-700 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                {isRtl ? 'الائتمان المتاح' : 'Available Credit'}
                            </span>
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                <CreditCard className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-white tracking-tight">
                                {formatCurrency(metrics.available_credit)}
                            </span>
                            <span className="text-xs text-neutral-400 font-medium">{currency}</span>
                        </div>
                        <div className="mt-2">
                            <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={`h-1.5 rounded-full ${
                                        creditUtilizationPct > 80 ? 'bg-red-500' : creditUtilizationPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${creditUtilizationPct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
                                <span>{isRtl ? 'الحد المعتمد:' : 'Limit:'} {formatCurrency(metrics.credit_limit)}</span>
                                <span>{creditUtilizationPct}% {isRtl ? 'مستغل' : 'Used'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Invoiced */}
                    <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-sm relative overflow-hidden group hover:border-neutral-700 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                {isRtl ? 'إجمالي الفواتير الصادرة' : 'Total Invoiced'}
                            </span>
                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-white tracking-tight">
                                {formatCurrency(metrics.total_invoiced)}
                            </span>
                            <span className="text-xs text-neutral-400 font-medium">{currency}</span>
                        </div>
                        <div className="mt-2 text-xs text-neutral-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>
                                {isRtl
                                    ? `${metrics.invoices_count} فاتورة معتمدة لدى زاتكا`
                                    : `${metrics.invoices_count} ZATCA-compliant invoices`}
                            </span>
                        </div>
                    </div>

                    {/* Total Settled Payments */}
                    <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-sm relative overflow-hidden group hover:border-neutral-700 transition">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                {isRtl ? 'إجمالي المدفوعات المسددة' : 'Total Paid / Settled'}
                            </span>
                            <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                                <Receipt className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-white tracking-tight">
                                {formatCurrency(metrics.total_paid)}
                            </span>
                            <span className="text-xs text-neutral-400 font-medium">{currency}</span>
                        </div>
                        <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                                {isRtl ? 'سجل مالي متوافق ومحدث آلياً' : 'Reconciled financial history'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-neutral-800 flex items-center gap-2 overflow-x-auto pb-px">
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                            activeTab === 'invoices'
                                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                                : 'border-transparent text-neutral-400 hover:text-neutral-200'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        <span>{isRtl ? 'الفواتير الضريبية الإلكترونية' : 'E-Invoices'}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                            {invoices.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('statement')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                            activeTab === 'statement'
                                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                                : 'border-transparent text-neutral-400 hover:text-neutral-200'
                        }`}
                    >
                        <Receipt className="w-4 h-4" />
                        <span>{isRtl ? 'كشف الحساب التفاعلي' : 'Statement of Account'}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                            activeTab === 'orders'
                                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                                : 'border-transparent text-neutral-400 hover:text-neutral-200'
                        }`}
                    >
                        <Briefcase className="w-4 h-4" />
                        <span>{isRtl ? 'أوامر البيع والطلبات' : 'Sales Orders'}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                            {orders.length}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('banking')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                            activeTab === 'banking'
                                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                                : 'border-transparent text-neutral-400 hover:text-neutral-200'
                        }`}
                    >
                        <Landmark className="w-4 h-4" />
                        <span>{isRtl ? 'معلومات التحويل البنكي والسداد' : 'Payment & Bank Info'}</span>
                    </button>
                </div>

                {/* TAB 1: E-INVOICES */}
                {activeTab === 'invoices' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="relative w-full sm:w-80">
                                <Search className="w-4 h-4 absolute top-3 left-3 text-neutral-500" />
                                <Input
                                    value={invoiceSearch}
                                    onChange={(e) => setInvoiceSearch(e.target.value)}
                                    placeholder={isRtl ? 'بحث برقم الفاتورة أو التاريخ...' : 'Search by invoice # or date...'}
                                    className="pl-9 bg-neutral-900 border-neutral-800 text-sm"
                                />
                            </div>
                            <span className="text-xs text-neutral-400">
                                {isRtl
                                    ? `عرض ${filteredInvoices.length} من أصل ${invoices.length} فاتورة`
                                    : `Showing ${filteredInvoices.length} of ${invoices.length} invoices`}
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-sm">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-neutral-800/60 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800">
                                    <tr>
                                        <th className="px-5 py-3.5 text-start">{isRtl ? 'رقم الفاتورة' : 'Invoice #'}</th>
                                        <th className="px-4 py-3.5 text-start">{isRtl ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                                        <th className="px-4 py-3.5 text-start">{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                                        <th className="px-4 py-3.5 text-end">{isRtl ? 'المجموع شامل الضريبة' : 'Total (Incl. VAT)'}</th>
                                        <th className="px-4 py-3.5 text-end">{isRtl ? 'المتبقي للسداد' : 'Balance Due'}</th>
                                        <th className="px-4 py-3.5 text-center">{isRtl ? 'حالة السداد' : 'Status'}</th>
                                        <th className="px-4 py-3.5 text-center">{isRtl ? 'حالة زاتكا' : 'ZATCA'}</th>
                                        <th className="px-5 py-3.5 text-end">{isRtl ? 'الإجراءات والتحميل' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/80">
                                    {filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                                                {isRtl ? 'لا توجد فواتير مطابقة' : 'No invoices found matching criteria.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInvoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-neutral-800/30 transition">
                                                <td className="px-5 py-4 font-mono font-medium text-white">
                                                    {inv.invoice_number}
                                                </td>
                                                <td className="px-4 py-4 text-neutral-300 whitespace-nowrap">
                                                    {inv.date}
                                                </td>
                                                <td className="px-4 py-4 text-neutral-400 whitespace-nowrap">
                                                    {inv.due_date}
                                                </td>
                                                <td className="px-4 py-4 text-end font-semibold text-white whitespace-nowrap">
                                                    {formatCurrency(inv.total)} <span className="text-xs text-neutral-400">{currency}</span>
                                                </td>
                                                <td className="px-4 py-4 text-end font-bold whitespace-nowrap">
                                                    {inv.balance_due > 0 ? (
                                                        <span className="text-red-400">{formatCurrency(inv.balance_due)} {currency}</span>
                                                    ) : (
                                                        <span className="text-emerald-400">{isRtl ? 'مسددة بالكامل' : 'Paid in Full'}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        inv.status === 'paid'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : inv.status === 'partially_paid'
                                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                    }`}>
                                                        {inv.status === 'paid'
                                                            ? (isRtl ? 'مسددة' : 'Paid')
                                                            : inv.status === 'partially_paid'
                                                            ? (isRtl ? 'سداد جزئي' : 'Partially Paid')
                                                            : (isRtl ? 'مستحقة' : 'Unpaid')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                                        inv.zatca_status === 'cleared'
                                                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                            : inv.zatca_status === 'reported'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : 'bg-neutral-800 text-neutral-400'
                                                    }`}>
                                                        <ShieldCheck className="w-3 h-3" />
                                                        <span>{inv.zatca_status ? inv.zatca_status.toUpperCase() : (isRtl ? 'معتمدة' : 'COMPLIANT')}</span>
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-end whitespace-nowrap space-x-2 rtl:space-x-reverse">
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 gap-1.5 bg-neutral-900 border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                                                    >
                                                        <a href={`/portal/${portalToken}/invoices/${inv.id}/print`} target="_blank" rel="noreferrer">
                                                            <Printer className="w-3.5 h-3.5" />
                                                            <span>{isRtl ? 'طباعة الفاتورة' : 'Print / View'}</span>
                                                        </a>
                                                    </Button>

                                                    {inv.has_xml && (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 gap-1.5 bg-neutral-900 border-neutral-700 hover:bg-neutral-800 text-neutral-300"
                                                        >
                                                            <a href={`/portal/${portalToken}/invoices/${inv.id}/xml`} download>
                                                                <Download className="w-3.5 h-3.5" />
                                                                <span>XML</span>
                                                            </a>
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 2: STATEMENT OF ACCOUNT */}
                {activeTab === 'statement' && (
                    <div className="space-y-6">
                        {/* Filter Bar */}
                        <form onSubmit={handleFilterStatement} className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-neutral-400 font-medium">{isRtl ? 'من تاريخ:' : 'From:'}</label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-9 w-40 bg-neutral-950 border-neutral-800 text-xs"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-neutral-400 font-medium">{isRtl ? 'إلى تاريخ:' : 'To:'}</label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-9 w-40 bg-neutral-950 border-neutral-800 text-xs"
                                    />
                                </div>
                                <Button type="submit" size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white">
                                    {isRtl ? 'تحديث الكشف' : 'Apply Filter'}
                                </Button>
                            </div>

                            <div>
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="h-9 gap-2 bg-neutral-900 border-neutral-700 hover:bg-neutral-800 text-neutral-200"
                                >
                                    <a href={`/portal/${portalToken}/statement/export?start_date=${startDate}&end_date=${endDate}`} download>
                                        <Download className="w-4 h-4" />
                                        <span>{isRtl ? 'تصدير كشف الحساب (CSV)' : 'Export Statement (CSV)'}</span>
                                    </a>
                                </Button>
                            </div>
                        </form>

                        {/* Statement Financial Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
                                <span className="text-xs text-neutral-400 block">{isRtl ? 'الرصيد الافتتاحي' : 'Opening Balance'}</span>
                                <span className="text-xl font-bold text-white mt-1 block">
                                    {formatCurrency(statement.opening_balance)} <span className="text-xs text-neutral-400">{currency}</span>
                                </span>
                            </div>
                            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
                                <span className="text-xs text-neutral-400 block">{isRtl ? 'إجمالي المدين (الفواتير)' : 'Total Debits (Invoices)'}</span>
                                <span className="text-xl font-bold text-red-400 mt-1 block">
                                    +{formatCurrency(statement.total_debit)} <span className="text-xs text-neutral-400">{currency}</span>
                                </span>
                            </div>
                            <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
                                <span className="text-xs text-neutral-400 block">{isRtl ? 'إجمالي الدائن (السدادات)' : 'Total Credits (Receipts)'}</span>
                                <span className="text-xl font-bold text-emerald-400 mt-1 block">
                                    -{formatCurrency(statement.total_credit)} <span className="text-xs text-neutral-400">{currency}</span>
                                </span>
                            </div>
                            <div className="p-4 rounded-xl bg-neutral-900/80 border border-emerald-500/30">
                                <span className="text-xs text-emerald-400 font-semibold block">{isRtl ? 'الرصيد الختامي المستحق' : 'Closing Balance Due'}</span>
                                <span className="text-xl font-extrabold text-white mt-1 block">
                                    {formatCurrency(statement.closing_balance)} <span className="text-xs text-neutral-400">{currency}</span>
                                </span>
                            </div>
                        </div>

                        {/* Statement Ledger Table */}
                        <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-sm">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-neutral-800/60 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800">
                                    <tr>
                                        <th className="px-5 py-3.5 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                        <th className="px-4 py-3.5 text-start">{isRtl ? 'نوع الحركة' : 'Type'}</th>
                                        <th className="px-4 py-3.5 text-start">{isRtl ? 'المرجع' : 'Reference'}</th>
                                        <th className="px-4 py-3.5 text-end">{isRtl ? 'مدين (+)' : 'Debit (+)'}</th>
                                        <th className="px-4 py-3.5 text-end">{isRtl ? 'دائن (-)' : 'Credit (-)'}</th>
                                        <th className="px-4 py-3.5 text-end">{isRtl ? 'الرصيد الجاري' : 'Running Balance'}</th>
                                        <th className="px-5 py-3.5 text-start">{isRtl ? 'بيان / ملاحظات' : 'Notes'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/80 font-mono text-xs">
                                    {statement.transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 font-sans text-sm">
                                                {isRtl ? 'لا توجد حركات مالية خلال الفترة المحددة' : 'No transactions found in this period.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        statement.transactions.map((tx, idx) => (
                                            <tr key={idx} className="hover:bg-neutral-800/30 transition">
                                                <td className="px-5 py-3.5 text-neutral-300 whitespace-nowrap font-sans">
                                                    {tx.date}
                                                </td>
                                                <td className="px-4 py-3.5 font-sans font-medium text-white">
                                                    {isRtl ? tx.type_ar : tx.type}
                                                </td>
                                                <td className="px-4 py-3.5 text-neutral-300">
                                                    {tx.reference}
                                                </td>
                                                <td className="px-4 py-3.5 text-end text-red-400 font-semibold">
                                                    {tx.debit > 0 ? formatCurrency(tx.debit) : '-'}
                                                </td>
                                                <td className="px-4 py-4 text-end text-emerald-400 font-semibold">
                                                    {tx.credit > 0 ? formatCurrency(tx.credit) : '-'}
                                                </td>
                                                <td className="px-4 py-3.5 text-end font-bold text-white">
                                                    {formatCurrency(tx.balance)} {currency}
                                                </td>
                                                <td className="px-5 py-3.5 text-neutral-400 font-sans truncate max-w-xs">
                                                    {tx.notes || '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 3: SALES ORDERS */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/60 shadow-sm">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-neutral-800/60 text-xs font-semibold text-neutral-400 uppercase border-b border-neutral-800">
                                    <tr>
                                        <th className="px-5 py-3.5 text-start">{isRtl ? 'رقم أمر البيع' : 'Order #'}</th>
                                        <th className="px-4 py-3.5 text-start">{isRtl ? 'تاريخ الطلب' : 'Order Date'}</th>
                                        <th className="px-4 py-3.5 text-start">{isRtl ? 'تاريخ التسليم' : 'Delivery Date'}</th>
                                        <th className="px-4 py-3.5 text-end">{isRtl ? 'إجمالي الطلب' : 'Total Amount'}</th>
                                        <th className="px-4 py-3.5 text-center">{isRtl ? 'حالة الطلب' : 'Order Status'}</th>
                                        <th className="px-4 py-3.5 text-center">{isRtl ? 'حالة الفوترة' : 'Billing Status'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/80">
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                                                {isRtl ? 'لا توجد أوامر بيع مسجلة' : 'No sales orders found.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((ord) => (
                                            <tr key={ord.id} className="hover:bg-neutral-800/30 transition">
                                                <td className="px-5 py-4 font-mono font-semibold text-white">
                                                    {ord.order_number}
                                                </td>
                                                <td className="px-4 py-4 text-neutral-300">
                                                    {ord.order_date}
                                                </td>
                                                <td className="px-4 py-4 text-neutral-400">
                                                    {ord.delivery_date || '-'}
                                                </td>
                                                <td className="px-4 py-4 text-end font-bold text-white">
                                                    {formatCurrency(ord.total_amount)} <span className="text-xs text-neutral-400">{currency}</span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                                                        {ord.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        ord.invoicing_status === 'fully_billed'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                            : ord.invoicing_status === 'partially_billed'
                                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                                                    }`}>
                                                        {ord.invoicing_status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 4: BANKING & PAYMENT DETAILS */}
                {activeTab === 'banking' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                    <Landmark className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base">
                                        {isRtl ? 'الحساب البنكي المعتمد للتحويلات' : 'Official Bank Account Details'}
                                    </h3>
                                    <span className="text-xs text-neutral-400">
                                        {isRtl ? 'يرجى استخدام الحساب أدناه لسداد الفواتير المستحقة' : 'Use the details below to settle open balances'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                                    <div className="text-xs text-neutral-400">{isRtl ? 'اسم المستفيد (الشركة):' : 'Beneficiary Name:'}</div>
                                    <div className="font-bold text-sm text-white mt-0.5">{companyDisplayName}</div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                                    <div className="text-xs text-neutral-400">{isRtl ? 'اسم البنك:' : 'Bank Name:'}</div>
                                    <div className="font-bold text-sm text-white mt-0.5">{defaultBank}</div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-neutral-400">{isRtl ? 'رقم الآيبان (IBAN):' : 'IBAN Number:'}</div>
                                        <div className="font-mono font-bold text-sm text-emerald-400 mt-0.5">{defaultIban}</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCopyIban(defaultIban)}
                                        className="h-8 gap-1.5 bg-neutral-900 border-neutral-700 hover:bg-neutral-800 text-xs"
                                    >
                                        {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copiedIban ? (isRtl ? 'تم النسخ' : 'Copied') : (isRtl ? 'نسخ الآيبان' : 'Copy IBAN')}</span>
                                    </Button>
                                </div>

                                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
                                    <div className="text-xs text-neutral-400">{isRtl ? 'رمز السويفت (SWIFT / BIC):' : 'SWIFT / BIC Code:'}</div>
                                    <div className="font-mono font-bold text-sm text-neutral-200 mt-0.5">{defaultSwift}</div>
                                </div>
                            </div>
                        </div>

                        {/* Remittance & Support Advisory */}
                        <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-base">
                                            {isRtl ? 'تعليمات تسريع مطابقة السداد' : 'Remittance Instructions'}
                                        </h3>
                                        <span className="text-xs text-neutral-400">
                                            {isRtl ? 'لضمان قيد السداد في حسابكم فوراً' : 'To ensure immediate payment allocation'}
                                        </span>
                                    </div>
                                </div>

                                <ul className="space-y-3 text-xs text-neutral-300 list-disc list-inside">
                                    <li>
                                        {isRtl
                                            ? 'يرجى تدوين رقم الفاتورة أو رقم كود العميل في خانة الغرض من التحويل البنكي.'
                                            : 'Please include the invoice number or customer code in the wire transfer description.'}
                                    </li>
                                    <li>
                                        {isRtl
                                            ? 'يتم إصدار سند قبض رسمي وإرسال إشعار آلي فور وصول الحوالة البنكية.'
                                            : 'An official payment receipt will be generated automatically upon bank clearance.'}
                                    </li>
                                    <li>
                                        {isRtl
                                            ? 'جميع الفواتير معتمدة من هيئة الزكاة والضريبة والجمارك (ZATCA Phase 2).'
                                            : 'All e-invoices are fully accredited under ZATCA Phase 2 E-Invoicing.'}
                                    </li>
                                </ul>
                            </div>

                            <div className="pt-4 border-t border-neutral-800 text-xs text-neutral-400">
                                <div className="font-semibold text-neutral-200 mb-1">
                                    {isRtl ? 'للتواصل والاستفسارات المالية:' : 'Financial Support & Inquiries:'}
                                </div>
                                <div>{company.settings?.email || 'accounts@company.sa'} | {company.settings?.phone || '+966 11 000 0000'}</div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Subtle Footer */}
            <footer className="border-t border-neutral-800/60 mt-16 py-6 text-center text-xs text-neutral-500">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div>
                        © {new Date().getFullYear()} {companyDisplayName}. {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-neutral-400 font-mono text-[11px]">ZATCA Fatoora Phase 2 Verified</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
