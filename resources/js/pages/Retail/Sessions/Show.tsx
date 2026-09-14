import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Receipt,
    ArrowLeft,
    CheckCircle2,
    Clock,
    DollarSign,
    Lock,
    Eye,
    Store,
    AlertCircle,
    Printer,
    FileText,
    CreditCard,
    Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface PosOrderLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
}

interface PosOrder {
    id: string;
    receipt_number: string;
    customer?: { name: string };
    total_amount: string;
    payment_method: string;
    created_at: string;
    lines: PosOrderLine[];
}

interface PosSession {
    id: string;
    session_number: string;
    z_report_number?: string;
    z_report_sequence?: number;
    status: 'open' | 'closed';
    opening_cash: string;
    closing_cash?: string;
    expected_cash: string;
    cash_difference: string;
    total_orders_count?: number;
    total_gross_sales?: string;
    total_discounts?: string;
    total_net_sales?: string;
    total_tax?: string;
    total_cash_sales?: string;
    total_card_sales?: string;
    difference_journal_entry_id?: string;
    difference_journal_entry?: { id: string; entry_number: string };
    opened_at: string;
    closed_at?: string;
    notes?: string;
    terminal: {
        id: string;
        name: string;
        code: string;
        warehouse?: { name: string };
        branch?: { name: string };
    };
    user?: { name: string };
    closed_by_user?: { name: string };
    orders: PosOrder[];
}

interface Props {
    posSession: PosSession;
    reportPreview?: any;
}

export default function PosSessionShow({ posSession }: Props) {
    const { t, isRtl } = useTranslation();
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [countedCash, setCountedCash] = useState(posSession.expected_cash);
    const [notes, setNotes] = useState('');

    const isOpen = posSession.status === 'open';

    const handleCloseShift = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(`/retail/sessions/${posSession.id}/close`, {
            closing_cash: countedCash,
            notes,
        }, {
            onSuccess: () => setIsCloseModalOpen(false),
        });
    };

    const countedNum = parseFloat(countedCash || '0');
    const expectedNum = parseFloat(posSession.expected_cash || '0');
    const previewDiff = countedNum - expectedNum;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`POS Session - #${posSession.session_number}`} />

            {/* Back & Title Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                        <Link href="/retail/sessions">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                #{posSession.session_number}
                            </h1>
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    isOpen
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                }`}
                            >
                                <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-emerald-600 animate-pulse' : 'bg-neutral-400'}`} />
                                {isOpen ? (isRtl ? 'وردية مفتوحة نشطة' : 'Active Open Shift') : (isRtl ? 'مقفلة ومرحلة مالياً' : 'Closed & Reconciled')}
                            </span>

                            {posSession.z_report_number && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800">
                                    <FileText className="h-3 w-3" />
                                    {posSession.z_report_number}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {posSession.terminal?.name} ({posSession.terminal?.code}) &bull; {posSession.user?.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {isOpen ? (
                        <>
                            <Button asChild variant="outline" className="gap-2">
                                <a href={`/retail/sessions/${posSession.id}/x-report`} target="_blank" rel="noreferrer">
                                    <Printer className="h-4 w-4" />
                                    <span>{isRtl ? 'قراءة الوردية (X-Report)' : 'View X-Report'}</span>
                                </a>
                            </Button>
                            <Button asChild variant="outline" className="gap-2">
                                <Link href={`/retail/pos/${posSession.terminal.id}`}>
                                    <Store className="h-4 w-4" />
                                    <span>{isRtl ? 'شاشة الكاشير والبيع' : 'Open Register'}</span>
                                </Link>
                            </Button>
                            <Button
                                onClick={() => setIsCloseModalOpen(true)}
                                className="gap-2 bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                <Lock className="h-4 w-4" />
                                <span>{isRtl ? 'جرد وإقفال الوردية (Z-Report)' : 'Reconcile & Close (Z-Report)'}</span>
                            </Button>
                        </>
                    ) : (
                        <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <a href={`/retail/sessions/${posSession.id}/z-report`} target="_blank" rel="noreferrer">
                                <Printer className="h-4 w-4" />
                                <span>{isRtl ? 'طباعة تقرير الإغلاق المالي (Z-Report)' : 'Print Fiscal Z-Report'}</span>
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Reconciliation & Drawer Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'العهدة الافتتاحية للصندوق' : 'Opening Float'}</p>
                    <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                        {Number(posSession.opening_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">{new Date(posSession.opened_at).toLocaleTimeString()}</p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'النقدية المتوقعة في الدرج' : 'Expected Drawer Cash'}</p>
                    <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                        {Number(posSession.expected_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'العهدة + المبيعات النقدية' : 'Float + Cash Orders'}</p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'النقدية الفعلية المحصورة' : 'Counted Closing Cash'}</p>
                    <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                        {posSession.closing_cash ? `${Number(posSession.closing_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR` : (isRtl ? 'قيد العمل' : 'In Progress')}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                        {posSession.closed_at ? new Date(posSession.closed_at).toLocaleTimeString() : '-'}
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'فروقات الصندوق (عجز / زيادة)' : 'Cash Difference'}</p>
                    <p className={`text-xl font-bold font-mono mt-1 ${
                        Number(posSession.cash_difference) < 0
                            ? 'text-rose-600'
                            : Number(posSession.cash_difference) > 0
                            ? 'text-emerald-600'
                            : 'text-neutral-700 dark:text-neutral-300'
                    }`}>
                        {Number(posSession.cash_difference).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                        {Number(posSession.cash_difference) === 0 ? (isRtl ? 'مطابق تماماً' : 'Balanced') : (isRtl ? 'تم ترحيل الفرق محاسبياً' : 'GL Variance posted')}
                    </p>
                </div>
            </div>

            {/* Financial Performance Summary (Net, VAT 15%, Cash vs Card) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Coins className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500">{isRtl ? 'المبيعات النقدية (Cash)' : 'Cash Sales'}</p>
                        <p className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                            {Number(posSession.total_cash_sales ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500">{isRtl ? 'مبيعات الشبكة ومدى (Card)' : 'Card / Mada Sales'}</p>
                        <p className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                            {Number(posSession.total_card_sales ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500">{isRtl ? 'ضريبة القيمة المضافة المحصلة (15% VAT)' : '15% VAT Collected'}</p>
                        <p className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100">
                            {Number(posSession.total_tax ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>
            </div>

            {/* Orders Executed in Session */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-indigo-600" />
                        {isRtl ? 'المبيعات المنفذة خلال الوردية' : 'Orders Completed During Session'}
                        <span className="text-xs font-normal text-neutral-500">({posSession.orders?.length || 0} orders)</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 text-start">{isRtl ? 'رقم الإيصال' : 'Receipt #'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'العميل' : 'Customer'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'طريقة الدفع' : 'Payment Method'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الوقت' : 'Time'}</th>
                                <th className="px-6 py-3 text-end font-mono">{isRtl ? 'الإجمالي' : 'Total'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {!posSession.orders || posSession.orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                                        {isRtl ? 'لم يتم إجراء عمليات بيع بعد في هذه الوردية' : 'No sales registered yet in this session'}
                                    </td>
                                </tr>
                            ) : (
                                posSession.orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="px-6 py-3.5 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {order.receipt_number}
                                        </td>
                                        <td className="px-6 py-3.5 text-neutral-700 dark:text-neutral-300">
                                            {order.customer?.name || (isRtl ? 'عميل نقدي عام' : 'Walk-in Customer')}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className="capitalize px-2 py-0.5 rounded text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-800">
                                                {order.payment_method === 'cash' ? (isRtl ? 'نقداً Cash' : 'Cash') : (isRtl ? 'شبكة / مدى' : 'Card')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-xs font-mono text-neutral-500">
                                            {new Date(order.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-3.5 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-3.5 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 hover:text-neutral-900">
                                                <Link href={`/retail/orders/${order.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span>{isRtl ? 'عرض الإيصال' : 'View Receipt'}</span>
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Close Shift Modal */}
            {isCloseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Lock className="text-rose-600" />
                            {isRtl ? 'مطابقة وإقفال وردية الكاشير (Z-Report)' : 'Reconcile & Close Shift'}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-1">
                            {isRtl
                                ? 'أدخل النقدية الفعلية الموجودة في الصندوق لإجراء المطابقة، توليد تقرير Z-Report، والترحيل المحاسبي النهائي'
                                : 'Enter counted cash in drawer to reconcile, generate Z-Report, and close shift permanently'}
                        </p>

                        <form onSubmit={handleCloseShift} className="mt-4 space-y-4">
                            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 flex justify-between items-center text-sm">
                                <span className="text-neutral-600 dark:text-neutral-400">{isRtl ? 'النقدية المتوقعة بالنظام' : 'Expected Drawer Cash'}</span>
                                <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                    {Number(posSession.expected_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                    {isRtl ? 'النقدية الفعلية المحصورة (جرد الصندوق)' : 'Counted Physical Cash (SAR)'}
                                </label>
                                <Input
                                    required
                                    type="number"
                                    step="any"
                                    value={countedCash}
                                    onChange={(e) => setCountedCash(e.target.value)}
                                    className="mt-1 font-mono text-lg"
                                />
                            </div>

                            <div className={`p-3 rounded-xl flex justify-between items-center text-sm ${
                                previewDiff < 0
                                    ? 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                                    : previewDiff > 0
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                                    : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                            }`}>
                                <span className="font-medium">{isRtl ? 'فرق المطابقة المتوقع:' : 'Calculated Variance:'}</span>
                                <span className="font-mono font-bold">
                                    {previewDiff > 0 ? `+${previewDiff.toFixed(2)}` : previewDiff.toFixed(2)} SAR
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                    {isRtl ? 'ملاحظات وتفسير الفروقات (إن وجدت)' : 'Reconciliation Notes'}
                                </label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-xs"
                                    placeholder={isRtl ? 'مثال: تم إيداع نقدية في الخزينة الرئيسية...' : 'e.g. Excess cash deposited to main vault...'}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCloseModalOpen(false)}
                                    className="flex-1"
                                >
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold"
                                >
                                    {isRtl ? 'تأكيد الإقفال وإصدار Z-Report' : 'Confirm Close & Issue Z-Report'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
