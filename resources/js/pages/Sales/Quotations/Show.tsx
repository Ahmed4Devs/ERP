import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ShoppingCart, FileText, CheckCircle2, Calendar, User, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
}

interface Product {
    id: string;
    sku: string;
    name: string;
}

interface QuotationLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    discount_amount: string;
    tax_amount: string;
    line_total: string;
    product?: Product;
}

interface SalesOrder {
    id: string;
    order_number: string;
}

interface Quotation {
    id: string;
    quote_number: string;
    customer: Party;
    issue_date: string;
    valid_until: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    discount_amount: string;
    total_amount: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
    terms_and_conditions?: string;
    notes?: string;
    lines: QuotationLine[];
    sales_order?: SalesOrder;
}

interface Props {
    quotation: Quotation;
}

export default function QuotationShow({ quotation }: Props) {
    const { t, isRtl } = useTranslation();

    const handleConvertToOrder = () => {
        if (confirm(isRtl ? 'هل ترغب في اعتماد وتحويل عرض السعر إلى أمر بيع رسمي؟' : 'Convert this quotation into an official Sales Order?')) {
            router.post(`/sales/quotations/${quotation.id}/convert`);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${quotation.quote_number} - ${isRtl ? 'عرض سعر' : 'Quotation'}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/sales/quotations">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                {quotation.quote_number}
                            </h1>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {quotation.status}
                            </span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-1">
                            {isRtl && quotation.customer?.name_ar ? quotation.customer.name_ar : quotation.customer?.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {quotation.status !== 'converted' ? (
                        <Button onClick={handleConvertToOrder} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                            <ShoppingCart className="h-4 w-4" />
                            <span>{isRtl ? 'تحويل لأمر بيع' : 'Convert to Sales Order'}</span>
                        </Button>
                    ) : quotation.sales_order ? (
                        <Button asChild variant="outline" className="gap-2 border-indigo-200 text-indigo-600">
                            <Link href={`/sales/orders/${quotation.sales_order.id}`}>
                                <ShoppingCart className="h-4 w-4" />
                                <span>{isRtl ? `أمر البيع: ${quotation.sales_order.order_number}` : `Order: ${quotation.sales_order.order_number}`}</span>
                            </Link>
                        </Button>
                    ) : null}
                </div>
            </div>

            {/* Document Details Card */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                        <p className="text-xs text-neutral-500 mb-1">{isRtl ? 'العميل' : 'Customer'}</p>
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">
                            {isRtl && quotation.customer?.name_ar ? quotation.customer.name_ar : quotation.customer?.name}
                        </p>
                        {quotation.customer?.tax_id && (
                            <p className="text-xs text-neutral-500 font-mono mt-0.5">{isRtl ? 'الرقم الضريبي: ' : 'Tax ID: '}{quotation.customer.tax_id}</p>
                        )}
                        {quotation.customer?.email && (
                            <p className="text-xs text-neutral-500 mt-0.5">{quotation.customer.email}</p>
                        )}
                    </div>

                    <div>
                        <p className="text-xs text-neutral-500 mb-1">{isRtl ? 'تاريخ الإصدار' : 'Issue Date'}</p>
                        <p className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {quotation.issue_date}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-neutral-500 mb-1">{isRtl ? 'صلاحية العرض حتى' : 'Valid Until'}</p>
                        <p className="font-mono text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {quotation.valid_until}
                        </p>
                    </div>
                </div>

                {/* Lines Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase">
                                <th className="pb-3 text-start">{isRtl ? 'البند والوصف' : 'Item & Description'}</th>
                                <th className="pb-3 text-end">{isRtl ? 'الكمية' : 'Quantity'}</th>
                                <th className="pb-3 text-end">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                                <th className="pb-3 text-end">{isRtl ? 'الخصم' : 'Discount'}</th>
                                <th className="pb-3 text-end">{isRtl ? 'الضريبة (10%)' : 'Tax (10%)'}</th>
                                <th className="pb-3 text-end">{isRtl ? 'الإجمالي' : 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {quotation.lines.map((line) => (
                                <tr key={line.id}>
                                    <td className="py-4">
                                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{line.description}</p>
                                        {line.product && (
                                            <p className="text-xs text-neutral-500 font-mono mt-0.5">SKU: {line.product.sku}</p>
                                        )}
                                    </td>
                                    <td className="py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                        {parseFloat(line.quantity).toLocaleString()}
                                    </td>
                                    <td className="py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                        {Number(line.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                        {Number(line.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                        {Number(line.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(line.line_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals & Terms */}
                <div className="flex flex-col sm:flex-row justify-between items-start pt-6 border-t border-neutral-200 dark:border-neutral-800 gap-6">
                    <div className="w-full sm:w-1/2 space-y-4">
                        {quotation.terms_and_conditions && (
                            <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{isRtl ? 'الشروط والأحكام' : 'Terms & Conditions'}</p>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{quotation.terms_and_conditions}</p>
                            </div>
                        )}
                        {quotation.notes && (
                            <div>
                                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</p>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{quotation.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 space-y-2 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
                            <span className="font-mono font-medium">{Number(quotation.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                        </div>
                        {parseFloat(quotation.discount_amount) > 0 && (
                            <div className="flex justify-between text-sm text-rose-600">
                                <span>{isRtl ? 'الخصم' : 'Discount'}</span>
                                <span className="font-mono">- {Number(quotation.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">{isRtl ? 'ضريبة الاختبار (10%)' : 'Test Tax (10%)'}</span>
                            <span className="font-mono font-medium">{Number(quotation.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                        </div>
                        <div className="flex justify-between text-base font-bold pt-2 border-t border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
                            <span>{isRtl ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                            <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                {Number(quotation.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
