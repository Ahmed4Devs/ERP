import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
    sales_price: string;
}

interface Lead {
    id: string;
    title: string;
    party_id?: string;
}

interface LineItem {
    product_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
}

interface Props {
    customers: Party[];
    products: Product[];
    leads: Lead[];
    defaultIssueDate: string;
    defaultValidUntil: string;
}

export default function QuotationCreate({ customers, products, leads, defaultIssueDate, defaultValidUntil }: Props) {
    const { t, isRtl } = useTranslation();

    const [lines, setLines] = useState<LineItem[]>([
        { product_id: '', description: '', quantity: 1, unit_price: 0, discount_amount: 0 },
    ]);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        lead_id: '',
        issue_date: defaultIssueDate,
        valid_until: defaultValidUntil,
        discount_amount: 0,
        terms_and_conditions: '1. Quotation validity: 30 days.\n2. Payment terms: 50% advance, 50% upon delivery.\n3. Tax: 10% Test Tax applies.',
        notes: '',
        lines: lines,
    });

    const addLine = () => {
        const newLines = [...lines, { product_id: '', description: '', quantity: 1, unit_price: 0, discount_amount: 0 }];
        setLines(newLines);
        setData('lines', newLines);
    };

    const removeLine = (index: number) => {
        if (lines.length === 1) return;
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
        setData('lines', newLines);
    };

    const handleLineChange = (index: number, field: keyof LineItem, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };

        if (field === 'product_id' && value) {
            const prod = products.find(p => p.id === value);
            if (prod) {
                newLines[index].description = isRtl && prod.name_ar ? prod.name_ar : prod.name;
                newLines[index].unit_price = parseFloat(prod.sales_price || '0');
            }
        }

        setLines(newLines);
        setData('lines', newLines);
    };

    // Computations
    const subtotal = lines.reduce((acc, l) => acc + (l.quantity * l.unit_price - (l.discount_amount || 0)), 0);
    const overallDiscount = data.discount_amount || 0;
    const netSubtotal = Math.max(0, subtotal - overallDiscount);
    const taxAmount = netSubtotal * 0.10; // 10% test tax
    const totalAmount = netSubtotal + taxAmount;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sales/quotations');
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={isRtl ? 'إنشاء عرض سعر جديد' : 'New Sales Quotation'} />

            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/sales/quotations">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'إنشاء عرض سعر تجاري' : 'New Sales Quotation'}
                    </h1>
                    <p className="text-sm text-neutral-500">
                        {isRtl ? 'إعداد عرض سعر تفصيلي للعميل مع احتساب الضريبة والخصومات تلقائياً' : 'Create quotation with automatic 10% test tax and line calculations'}
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                {/* Header Information */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        {isRtl ? 'بيانات العرض الأساسية' : 'Quotation Header'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_id">{isRtl ? 'العميل *' : 'Customer *'}</Label>
                            <select
                                id="customer_id"
                                value={data.customer_id}
                                onChange={(e) => setData('customer_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                required
                            >
                                <option value="">{isRtl ? '-- اختر العميل --' : '-- Select Customer --'}</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {isRtl && c.name_ar ? c.name_ar : c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.customer_id && <p className="text-xs text-rose-500">{errors.customer_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lead_id">{isRtl ? 'الفرصة البيعية المرتبطة (اختياري)' : 'Linked CRM Lead (Optional)'}</Label>
                            <select
                                id="lead_id"
                                value={data.lead_id}
                                onChange={(e) => setData('lead_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- بدون ربط --' : '-- None --'}</option>
                                {leads.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="issue_date">{isRtl ? 'تاريخ الإصدار *' : 'Issue Date *'}</Label>
                            <Input
                                id="issue_date"
                                type="date"
                                value={data.issue_date}
                                onChange={(e) => setData('issue_date', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="valid_until">{isRtl ? 'صالح حتى تاريخ *' : 'Valid Until *'}</Label>
                            <Input
                                id="valid_until"
                                type="date"
                                value={data.valid_until}
                                onChange={(e) => setData('valid_until', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'بنود العرض والخدمات' : 'Quotation Line Items'}
                        </h2>
                        <Button type="button" onClick={addLine} variant="outline" size="sm" className="gap-1">
                            <Plus className="h-4 w-4" />
                            <span>{isRtl ? 'إضافة بند' : 'Add Line'}</span>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase">
                                    <th className="pb-2 text-start w-48">{isRtl ? 'المنتج / الصنف' : 'Product / SKU'}</th>
                                    <th className="pb-2 text-start">{isRtl ? 'الوصف *' : 'Description *'}</th>
                                    <th className="pb-2 text-end w-24">{isRtl ? 'الكمية' : 'Qty'}</th>
                                    <th className="pb-2 text-end w-32">{isRtl ? 'السعر' : 'Unit Price'}</th>
                                    <th className="pb-2 text-end w-28">{isRtl ? 'الخصم' : 'Discount'}</th>
                                    <th className="pb-2 text-end w-32">{isRtl ? 'المجموع' : 'Total'}</th>
                                    <th className="pb-2 text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {lines.map((line, idx) => {
                                    const lineTotal = line.quantity * line.unit_price - (line.discount_amount || 0);
                                    return (
                                        <tr key={idx}>
                                            <td className="py-3">
                                                <select
                                                    value={line.product_id}
                                                    onChange={(e) => handleLineChange(idx, 'product_id', e.target.value)}
                                                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                                                >
                                                    <option value="">{isRtl ? '-- صنف مخصص --' : '-- Custom Item --'}</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.sku} - {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-3 px-2">
                                                <Input
                                                    value={line.description}
                                                    onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                                                    placeholder={isRtl ? 'وصف البند أو الخدمة...' : 'Line description...'}
                                                    className="h-8 text-xs"
                                                    required
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={line.quantity}
                                                    onChange={(e) => handleLineChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-xs text-end"
                                                    required
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={line.unit_price}
                                                    onChange={(e) => handleLineChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-xs text-end font-mono"
                                                    required
                                                />
                                            </td>
                                            <td className="py-3 px-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={line.discount_amount}
                                                    onChange={(e) => handleLineChange(idx, 'discount_amount', parseFloat(e.target.value) || 0)}
                                                    className="h-8 text-xs text-end font-mono"
                                                />
                                            </td>
                                            <td className="py-3 px-2 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3 text-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLine(idx)}
                                                    disabled={lines.length === 1}
                                                    className="h-8 w-8 text-rose-500 hover:text-rose-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Summary */}
                    <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-neutral-200 dark:border-neutral-800 gap-6">
                        <div className="w-full sm:w-1/2 space-y-4">
                            <div>
                                <Label htmlFor="terms_and_conditions">{isRtl ? 'الشروط والأحكام' : 'Terms & Conditions'}</Label>
                                <textarea
                                    id="terms_and_conditions"
                                    rows={3}
                                    value={data.terms_and_conditions}
                                    onChange={(e) => setData('terms_and_conditions', e.target.value)}
                                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="notes">{isRtl ? 'ملاحظات إضافية' : 'Internal Notes'}</Label>
                                <textarea
                                    id="notes"
                                    rows={2}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 mt-1"
                                />
                            </div>
                        </div>

                        <div className="w-full sm:w-80 space-y-3 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
                                <span className="font-mono font-medium">{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-neutral-500">{isRtl ? 'خصم إضافي عام' : 'Extra Discount'}</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.discount_amount}
                                    onChange={(e) => setData('discount_amount', parseFloat(e.target.value) || 0)}
                                    className="w-28 h-7 text-xs text-end font-mono"
                                />
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">{isRtl ? 'ضريبة الاختبار (10%)' : 'Test Tax (10%)'}</span>
                                <span className="font-mono font-medium">{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                            </div>
                            <div className="flex justify-between text-base font-bold pt-2 border-t border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
                                <span>{isRtl ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/sales/quotations">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Save className="h-4 w-4" />
                        <span>{processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'إصدار عرض السعر' : 'Issue Quotation')}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
