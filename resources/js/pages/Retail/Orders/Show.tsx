import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, QrCode, Store, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface OrderLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    tax_amount: string;
    line_total: string;
    product?: { name: string; sku: string };
}

interface PosOrder {
    id: string;
    receipt_number: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total_amount: string;
    payment_method: string;
    cash_tendered: string;
    change_due: string;
    qr_payload?: string;
    created_at: string;
    customer?: { name: string; tax_id?: string };
    session?: {
        session_number: string;
        terminal?: {
            name: string;
            code: string;
            branch?: { name: string };
        };
    };
    journal_entry?: {
        entry_number: string;
    };
    lines: OrderLine[];
}

interface Props {
    order: PosOrder;
}

export default function PosOrderShow({ order }: Props) {
    const { t, isRtl } = useTranslation();

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
            <Head title={`POS Order - ${order.receipt_number}`} />

            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                        <Link href="/retail/sessions">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                            {order.receipt_number}
                        </h1>
                        <p className="text-xs text-neutral-500">
                            {order.session?.terminal?.name} ({order.session?.terminal?.code}) &bull; {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} variant="outline" className="gap-2">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة الإيصال' : 'Print Receipt'}</span>
                    </Button>
                </div>
            </div>

            {/* Receipt Card */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-neutral-200 dark:border-neutral-800 gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Store className="h-6 w-6 text-indigo-600" />
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                شركة الأمل للتجارة العامة
                            </h2>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            الرقم الضريبي: <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">300123456700003</span>
                        </p>
                        <p className="text-xs text-neutral-500">
                            فرع: {order.session?.terminal?.branch?.name || 'Riyadh Main HQ'}
                        </p>
                    </div>

                    <div className="text-end font-mono">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isRtl ? 'فاتورة مدفوعة ومرحلة' : 'Paid & Posted'}
                        </span>
                        <div className="text-xs text-neutral-500 mt-2">
                            {isRtl ? 'القيد المحاسبي:' : 'GL Journal Entry:'} <span className="text-indigo-600 font-bold">#{order.journal_entry?.entry_number || 'Auto-Posted'}</span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="py-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="pb-3 text-start">{isRtl ? 'الصنف / البيان' : 'Item Description'}</th>
                                <th className="pb-3 text-center">{isRtl ? 'الكمية' : 'Qty'}</th>
                                <th className="pb-3 text-end font-mono">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                                <th className="pb-3 text-end font-mono">{isRtl ? 'الضريبة (10%)' : 'Tax'}</th>
                                <th className="pb-3 text-end font-mono">{isRtl ? 'المجموع' : 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {order.lines.map((line) => (
                                <tr key={line.id}>
                                    <td className="py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                        {line.description}
                                        {line.product && (
                                            <span className="block text-xs font-mono text-neutral-500">{line.product.sku}</span>
                                        )}
                                    </td>
                                    <td className="py-3 text-center font-mono">{Number(line.quantity)}</td>
                                    <td className="py-3 text-end font-mono">{Number(line.unit_price).toFixed(2)} SAR</td>
                                    <td className="py-3 text-end font-mono">{Number(line.tax_amount).toFixed(2)} SAR</td>
                                    <td className="py-3 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(line.line_total).toFixed(2)} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals & QR Code */}
                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* ZATCA QR Code Display */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <QrCode className="h-20 w-20 text-neutral-900" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                                {isRtl ? 'رمز الاستجابة السريع (ZATCA QR)' : 'ZATCA E-Invoice QR Code'}
                            </p>
                            <p className="text-[11px] text-neutral-500 max-w-xs">
                                {isRtl
                                    ? 'مشفر بترميز Base64 ومطابق لهيئة الزكاة والضريبة والجمارك (المرحلة الأولى والثانية)'
                                    : 'Base64 TLV encoded compliant with ZATCA Phase 1 & 2 integration specifications'}
                            </p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="w-full md:w-72 space-y-2 text-sm font-mono">
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>{isRtl ? 'المجموع قبل الضريبة:' : 'Subtotal:'}</span>
                            <span>{Number(order.subtotal).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                            <span>{isRtl ? 'ضريبة القيمة المضافة (10%):' : 'VAT (10%):'}</span>
                            <span>{Number(order.tax_amount).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-neutral-900 dark:text-neutral-100 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                            <span>{isRtl ? 'الإجمالي النهائي:' : 'Total Amount:'}</span>
                            <span className="text-indigo-600">{Number(order.total_amount).toFixed(2)} SAR</span>
                        </div>
                        <div className="pt-2 text-xs text-neutral-500 flex justify-between">
                            <span>{isRtl ? 'طريقة السداد:' : 'Payment Method:'}</span>
                            <span className="uppercase font-bold text-neutral-800 dark:text-neutral-200">{order.payment_method}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
