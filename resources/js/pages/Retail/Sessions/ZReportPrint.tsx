import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft, Store, Calendar, Clock, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopProduct {
    name: string;
    sku: string;
    quantity: string;
    total: string;
}

interface ReportData {
    report_type: 'X' | 'Z';
    report_title_ar: string;
    report_title_en: string;
    report_number: string;
    z_sequence?: number;
    company: {
        name: string;
        tax_number: string;
        cr_number?: string;
        address?: string;
        currency: string;
    };
    terminal: {
        id: string;
        name: string;
        code: string;
        warehouse?: string;
        branch?: string;
    };
    session: {
        id: string;
        session_number: string;
        status: string;
        cashier_name?: string;
        opened_at?: string;
        closed_at?: string;
        closed_by_name?: string;
        notes?: string;
    };
    sales: {
        orders_count: number;
        gross_sales: number;
        discounts: number;
        net_sales: number;
        tax_rate: string;
        tax_amount: number;
        total_amount: number;
    };
    payments: {
        cash_sales: number;
        card_sales: number;
        total_collected: number;
    };
    drawer: {
        opening_float: number;
        cash_sales: number;
        expected_cash: number;
        counted_cash?: number;
        difference?: number;
        status: 'open' | 'balanced' | 'shortage' | 'surplus';
    };
    top_products: TopProduct[];
    generated_at: string;
}

interface Props {
    report: ReportData;
}

export default function ZReportPrint({ report }: Props) {
    const isZ = report.report_type === 'Z';
    const curr = report.company.currency || 'SAR';

    const formatMoney = (val?: number) => {
        if (val === undefined || val === null) return '0.00';
        return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (isoStr?: string) => {
        if (!isoStr) return '-';
        return new Date(isoStr).toLocaleString('ar-SA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 p-4 sm:p-8 flex flex-col items-center">
            <Head title={`${report.report_title_ar} - ${report.report_number}`} />

            {/* Action Bar (Hidden during printing) */}
            <div className="w-full max-w-md mb-6 flex items-center justify-between print:hidden">
                <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href={`/retail/sessions/${report.session.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                        <span>الرجوع للوردية</span>
                    </Link>
                </Button>

                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Printer className="h-4 w-4" />
                        <span>طباعة التقرير (Print)</span>
                    </Button>
                </div>
            </div>

            {/* Printable Receipt Card (80mm Styled) */}
            <div
                className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl text-neutral-900 dark:text-neutral-100 text-sm font-sans print:shadow-none print:border-none print:p-2 print:max-w-none print:w-[350px]"
                dir="rtl"
            >
                {/* Header */}
                <div className="text-center border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-4 mb-4">
                    <div className="flex justify-center mb-2">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Store className="h-5 w-5" />
                        </div>
                    </div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                        {report.company.name}
                    </h2>
                    {report.terminal.branch && (
                        <p className="text-xs text-neutral-500">{report.terminal.branch}</p>
                    )}
                    <div className="mt-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 space-y-0.5">
                        <p>الرقم الضريبي: {report.company.tax_number}</p>
                        {report.company.cr_number && <p>السجل التجاري: {report.company.cr_number}</p>}
                    </div>

                    <div className="mt-3 inline-block px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full border border-neutral-200 dark:border-neutral-700">
                        <span className="font-bold text-xs text-neutral-800 dark:text-neutral-200">
                            {report.report_title_ar}
                        </span>
                    </div>
                    <p className="text-[11px] font-mono text-neutral-500 mt-1">{report.report_title_en}</p>
                </div>

                {/* Session & Terminal Info */}
                <div className="border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-3 mb-3 text-xs space-y-1.5">
                    <div className="flex justify-between">
                        <span className="text-neutral-500">رقم التقرير:</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{report.report_number}</span>
                    </div>
                    {report.z_sequence && (
                        <div className="flex justify-between">
                            <span className="text-neutral-500">الرقم التسلسلي Z-Sequence:</span>
                            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">#{report.z_sequence}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-neutral-500">رقم الوردية:</span>
                        <span className="font-mono">#{report.session.session_number}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-neutral-500">نقطة البيع (الكاشير):</span>
                        <span>{report.terminal.name} ({report.terminal.code})</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-neutral-500">أمين الصندوق:</span>
                        <span className="font-medium">{report.session.cashier_name || 'كاشير عام'}</span>
                    </div>
                    {report.session.closed_by_name && isZ && (
                        <div className="flex justify-between">
                            <span className="text-neutral-500">تم الإغلاق بواسطة:</span>
                            <span>{report.session.closed_by_name}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-neutral-500">وقت فتح الوردية:</span>
                        <span className="font-mono text-[11px]">{formatDate(report.session.opened_at)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-neutral-500">{isZ ? 'وقت الإغلاق المالي:' : 'وقت إصدار التقرير:'}</span>
                        <span className="font-mono text-[11px]">{formatDate(report.session.closed_at)}</span>
                    </div>
                </div>

                {/* Sales Summary */}
                <div className="border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-3 mb-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 mb-2">
                        ملخص المبيعات المالية (Sales Summary)
                    </h3>
                    <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                            <span>عدد الفواتير المنفذة:</span>
                            <span className="font-mono font-bold">{report.sales.orders_count}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>إجمالي المبيعات (Gross):</span>
                            <span className="font-mono">{formatMoney(report.sales.gross_sales)} {curr}</span>
                        </div>
                        {report.sales.discounts > 0 && (
                            <div className="flex justify-between text-rose-600">
                                <span>إجمالي الخصومات (Discounts):</span>
                                <span className="font-mono">-{formatMoney(report.sales.discounts)} {curr}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold">
                            <span>صافي المبيعات (Net Sales):</span>
                            <span className="font-mono">{formatMoney(report.sales.net_sales)} {curr}</span>
                        </div>
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>ضريبة القيمة المضافة (15% VAT):</span>
                            <span className="font-mono">{formatMoney(report.sales.tax_amount)} {curr}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-200 dark:border-neutral-800">
                            <span className="text-indigo-600 dark:text-indigo-400">المجموع النهائي (Grand Total):</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                {formatMoney(report.sales.total_amount)} {curr}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payments Breakdown */}
                <div className="border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-3 mb-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 mb-2">
                        طرق التحصيل والدفع (Payment Methods)
                    </h3>
                    <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                النقدية المحصلة (Cash Sales):
                            </span>
                            <span className="font-mono font-medium">{formatMoney(report.payments.cash_sales)} {curr}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-sky-500" />
                                البطاقات ومدى (Mada / Cards):
                            </span>
                            <span className="font-mono font-medium">{formatMoney(report.payments.card_sales)} {curr}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1 border-t border-neutral-200 dark:border-neutral-800">
                            <span>إجمالي المبالغ المحصلة:</span>
                            <span className="font-mono">{formatMoney(report.payments.total_collected)} {curr}</span>
                        </div>
                    </div>
                </div>

                {/* Drawer Cash Reconciliation */}
                <div className="border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-3 mb-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 mb-2">
                        تسوية ومطابقة صندوق الكاشير (Cash Drawer Audit)
                    </h3>
                    <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                            <span>العهدة الافتتاحية (Opening Float):</span>
                            <span className="font-mono">{formatMoney(report.drawer.opening_float)} {curr}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>+ مبيعات الكاش النقدية:</span>
                            <span className="font-mono">{formatMoney(report.drawer.cash_sales)} {curr}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-1 border-t border-neutral-200 dark:border-neutral-800">
                            <span>النقدية المتوقعة بالدرج (Expected Cash):</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                {formatMoney(report.drawer.expected_cash)} {curr}
                            </span>
                        </div>
                        <div className="flex justify-between font-semibold">
                            <span>النقدية الفعلية المحصورة (Counted Cash):</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                {report.drawer.counted_cash !== undefined && report.drawer.counted_cash !== null
                                    ? `${formatMoney(report.drawer.counted_cash)} ${curr}`
                                    : (isZ ? '0.00 SAR' : 'قيد الجرد')}
                            </span>
                        </div>

                        {report.drawer.difference !== undefined && report.drawer.difference !== null && (
                            <div className={`flex justify-between font-bold text-xs p-2 rounded-lg mt-2 ${
                                report.drawer.difference === 0
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                                    : report.drawer.difference < 0
                                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                            }`}>
                                <span>
                                    {report.drawer.difference === 0
                                        ? 'حالة الصندوق: مطابق تماماً'
                                        : report.drawer.difference < 0
                                        ? 'عجز الصندوق (Shortage):'
                                        : 'زيادة الصندوق (Surplus):'}
                                </span>
                                <span className="font-mono">
                                    {formatMoney(Math.abs(report.drawer.difference))} {curr}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Sold Products */}
                {report.top_products && report.top_products.length > 0 && (
                    <div className="border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-3 mb-4">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500 mb-2">
                            الأصناف الأكثر مبيعاً في الوردية
                        </h3>
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-neutral-500 border-b border-neutral-200 dark:border-neutral-800 pb-1">
                                    <th className="text-start font-normal">الصنف</th>
                                    <th className="text-center font-normal">الكمية</th>
                                    <th className="text-end font-normal">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                                {report.top_products.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="py-1 font-sans text-neutral-700 dark:text-neutral-300 truncate max-w-[150px]">
                                            {item.name}
                                        </td>
                                        <td className="py-1 text-center text-neutral-600 dark:text-neutral-400">
                                            {Number(item.quantity).toFixed(0)}
                                        </td>
                                        <td className="py-1 text-end font-semibold">
                                            {formatMoney(Number(item.total))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Signatures */}
                <div className="pt-2 text-xs text-neutral-500 space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                            <p className="font-medium text-neutral-700 dark:text-neutral-300">توقيع أمين الصندوق</p>
                            <p className="text-[10px] text-neutral-400 mt-4">...................................</p>
                        </div>
                        <div className="border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                            <p className="font-medium text-neutral-700 dark:text-neutral-300">توقيع مشرف الوردية</p>
                            <p className="text-[10px] text-neutral-400 mt-4">...................................</p>
                        </div>
                    </div>

                    <div className="text-center text-[10px] text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800 font-mono">
                        نظام إدارة موارد المنشأة المتكامل &bull; وقت الطباعة: {new Date().toLocaleTimeString('ar-SA')}
                    </div>
                </div>
            </div>
        </div>
    );
}
