import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, Trash2, RotateCcw, AlertCircle, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    party_id: string;
    total: string;
}

interface Product {
    id: string;
    name: string;
    code: string;
    unit_price: string;
    cost_price: string;
}

interface Warehouse {
    id: string;
    name: string;
}

interface Branch {
    id: string;
    name: string;
}

interface LineItem {
    product_id: string;
    warehouse_id: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
}

interface Props {
    customers: Party[];
    invoices: Invoice[];
    products: Product[];
    warehouses: Warehouse[];
    branches: Branch[];
}

export default function CreditNotesCreate({ customers, invoices, products, warehouses, branches }: Props) {
    const { isRtl } = useTranslation();

    const [lines, setLines] = useState<LineItem[]>([
        {
            product_id: products[0]?.id || '',
            warehouse_id: warehouses[0]?.id || '',
            description: products[0]?.name || '',
            quantity: 1,
            unit_price: parseFloat(products[0]?.unit_price || '0'),
            tax_rate: 0.15,
        },
    ]);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: customers[0]?.id || '',
        invoice_id: '',
        branch_id: branches[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        reason: 'مردودات مبيعات - إرجاع بضاعة من العميل',
        notes: '',
        lines: lines,
    });

    const updateLine = (index: number, field: keyof LineItem, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };

        if (field === 'product_id') {
            const product = products.find((p) => p.id === value);
            if (product) {
                newLines[index].description = product.name;
                newLines[index].unit_price = parseFloat(product.unit_price || '0');
            }
        }

        setLines(newLines);
        setData('lines', newLines);
    };

    const addLine = () => {
        const newLine: LineItem = {
            product_id: products[0]?.id || '',
            warehouse_id: warehouses[0]?.id || '',
            description: products[0]?.name || '',
            quantity: 1,
            unit_price: parseFloat(products[0]?.unit_price || '0'),
            tax_rate: 0.15,
        };
        const updated = [...lines, newLine];
        setLines(updated);
        setData('lines', updated);
    };

    const removeLine = (index: number) => {
        if (lines.length <= 1) return;
        const updated = lines.filter((_, i) => i !== index);
        setLines(updated);
        setData('lines', updated);
    };

    // Calculate totals
    const subtotal = lines.reduce((acc, line) => acc + (line.quantity * line.unit_price), 0);
    const taxAmount = lines.reduce((acc, line) => acc + (line.quantity * line.unit_price * line.tax_rate), 0);
    const total = subtotal + taxAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sales/credit-notes');
    };

    // Filter invoices by selected customer
    const filteredInvoices = data.customer_id
        ? invoices.filter((inv) => inv.party_id === data.customer_id)
        : invoices;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={isRtl ? 'إنشاء إشعار دائن جديد' : 'Create Sales Credit Note'} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <RotateCcw className="h-6 w-6 text-rose-600" />
                        {isRtl ? 'إنشاء إشعار دائن جديد' : 'Create Sales Credit Note'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إصدار إشعار دائن لإرجاع بضاعة مباعة أو تخفيض قيمة فاتورة مع تحديث المخزون وضريبة القيمة المضافة'
                            : 'Issue a credit note for customer returns or price adjustments with GL & stock integration'}
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/sales/credit-notes" className="gap-2">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        {isRtl ? 'رجوع للقائمة' : 'Back to list'}
                    </Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* General Information Card */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b pb-3 dark:border-neutral-800">
                        {isRtl ? 'البيانات الأساسية للإشعار' : 'Note Information'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {isRtl ? 'العميل *' : 'Customer *'}
                            </label>
                            <select
                                value={data.customer_id}
                                onChange={(e) => setData('customer_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                required
                            >
                                <option value="">{isRtl ? '-- اختر العميل --' : '-- Select Customer --'}</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.customer_id && <p className="text-rose-500 text-xs mt-1">{errors.customer_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {isRtl ? 'مرجع الفاتورة الأصلية (اختياري)' : 'Original Invoice (Optional)'}
                            </label>
                            <select
                                value={data.invoice_id}
                                onChange={(e) => setData('invoice_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="">{isRtl ? '-- بدون ربط بفاتورة --' : '-- None / Direct Return --'}</option>
                                {filteredInvoices.map((inv) => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.invoice_number} ({parseFloat(inv.total).toLocaleString()} SAR)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {isRtl ? 'الفرع' : 'Branch'}
                            </label>
                            <select
                                value={data.branch_id}
                                onChange={(e) => setData('branch_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            >
                                <option value="">{isRtl ? '-- المركز الرئيسي --' : '-- Main Office --'}</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {isRtl ? 'تاريخ الإشعار *' : 'Note Date *'}
                            </label>
                            <Input
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                required
                            />
                            {errors.date && <p className="text-rose-500 text-xs mt-1">{errors.date}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {isRtl ? 'سبب الإرجاع / الإشعار' : 'Reason for Return'}
                            </label>
                            <Input
                                type="text"
                                placeholder={isRtl ? 'مثال: عيوب تصنيعية، استرجاع خلال فترة الضمان، خطأ في التسعير' : 'e.g. Defective items, Warranty return, Pricing error'}
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'بنود المردودات والأصناف المرتجعة' : 'Returned Items & Lines'}
                        </h2>
                        <Button type="button" onClick={addLine} size="sm" variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            {isRtl ? 'إضافة بند' : 'Add Line'}
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-semibold">
                                <tr>
                                    <th className="py-2.5 px-3 text-start">{isRtl ? 'الصنف' : 'Product'}</th>
                                    <th className="py-2.5 px-3 text-start">{isRtl ? 'مستودع الاستلام' : 'Warehouse'}</th>
                                    <th className="py-2.5 px-3 text-start">{isRtl ? 'الوصف' : 'Description'}</th>
                                    <th className="py-2.5 px-3 text-start w-24">{isRtl ? 'الكمية' : 'Qty'}</th>
                                    <th className="py-2.5 px-3 text-start w-32">{isRtl ? 'سعر الوحدة' : 'Unit Price'}</th>
                                    <th className="py-2.5 px-3 text-start w-28">{isRtl ? 'الضريبة' : 'Tax'}</th>
                                    <th className="py-2.5 px-3 text-start w-32">{isRtl ? 'الإجمالي' : 'Total'}</th>
                                    <th className="py-2.5 px-3 text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {lines.map((line, idx) => {
                                    const lineSub = line.quantity * line.unit_price;
                                    const lineTax = lineSub * line.tax_rate;
                                    const lineTot = lineSub + lineTax;

                                    return (
                                        <tr key={idx} className="align-top">
                                            <td className="py-2 px-2 min-w-[180px]">
                                                <select
                                                    value={line.product_id}
                                                    onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                                                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                                                >
                                                    <option value="">{isRtl ? '-- خدمة / يدوي --' : '-- Service / Manual --'}</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-2 px-2 min-w-[140px]">
                                                <select
                                                    value={line.warehouse_id}
                                                    onChange={(e) => updateLine(idx, 'warehouse_id', e.target.value)}
                                                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                                                >
                                                    <option value="">{isRtl ? '-- بدون إعادة للمخزن --' : '-- No Restock --'}</option>
                                                    {warehouses.map((w) => (
                                                        <option key={w.id} value={w.id}>{w.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-2 px-2 min-w-[200px]">
                                                <Input
                                                    type="text"
                                                    value={line.description}
                                                    onChange={(e) => updateLine(idx, 'description', e.target.value)}
                                                    className="text-xs h-8"
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    type="number"
                                                    min="0.0001"
                                                    step="any"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="text-xs h-8 font-mono"
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={line.unit_price}
                                                    onChange={(e) => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="text-xs h-8 font-mono"
                                                    required
                                                />
                                            </td>
                                            <td className="py-2 px-2">
                                                <select
                                                    value={line.tax_rate}
                                                    onChange={(e) => updateLine(idx, 'tax_rate', parseFloat(e.target.value))}
                                                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1.5 text-xs"
                                                >
                                                    <option value="0.15">15%</option>
                                                    <option value="0">0%</option>
                                                </select>
                                            </td>
                                            <td className="py-2 px-2 font-mono font-semibold text-neutral-900 dark:text-neutral-100 text-end whitespace-nowrap pt-3">
                                                {lineTot.toFixed(2)}
                                            </td>
                                            <td className="py-2 px-2 text-center pt-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeLine(idx)}
                                                    disabled={lines.length <= 1}
                                                    className="text-neutral-400 hover:text-rose-600 h-8 w-8 p-0"
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t dark:border-neutral-800 gap-4">
                        <div className="text-xs text-neutral-500 max-w-sm">
                            <span className="font-semibold">{isRtl ? 'الأثر المحاسبي التلقائي:' : 'Automated GL Impact:'}</span>
                            <br />
                            {isRtl
                                ? 'يتم عند الترحيل عكس الإيراد (مدين 4100) وتخفيض ضريبة المخرجات (مدين 2150) وتخفيض ذمة العميل (دائن 1200) وإعادة تكلفة البضاعة للمخزن (مدين 1300 / دائن 5000).'
                                : 'Debit Sales Returns & Output VAT, Credit Accounts Receivable. Restocks inventory at cost price.'}
                        </div>

                        <div className="w-full sm:w-72 space-y-2 bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm">
                            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                <span>{isRtl ? 'المجموع قبل الضريبة:' : 'Subtotal:'}</span>
                                <span className="font-mono">{subtotal.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                <span>{isRtl ? 'ضريبة القيمة المضافة (15%):' : 'VAT (15%):'}</span>
                                <span className="font-mono">{taxAmount.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-neutral-900 dark:text-neutral-100 border-t pt-2 dark:border-neutral-700">
                                <span>{isRtl ? 'الإجمالي الصافي للمردود:' : 'Total Credited:'}</span>
                                <span className="font-mono text-rose-600 dark:text-rose-400">{total.toFixed(2)} SAR</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes & Actions */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="w-full sm:w-1/2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            {isRtl ? 'ملاحظات إضافية' : 'Additional Notes'}
                        </label>
                        <Input
                            type="text"
                            placeholder={isRtl ? 'أي تفاصيل أو اشتراطات ملحقة...' : 'Any terms or notes...'}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <Button asChild variant="outline">
                            <Link href="/sales/credit-notes">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-rose-600 hover:bg-rose-700 text-white min-w-[140px]"
                        >
                            {processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ كمسودة' : 'Save as Draft')}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
