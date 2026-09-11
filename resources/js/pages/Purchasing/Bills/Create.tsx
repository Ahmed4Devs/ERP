import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, Trash2, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    tax_id?: string;
}

interface VendorProfile {
    id: string;
    party: Party;
}

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface POLine {
    description: string;
    quantity: string | number;
    unit_price: string | number;
}

interface PurchaseOrder {
    id: string;
    order_number: string;
    vendor_id: string;
    lines: POLine[];
}

interface BillLineInput {
    description: string;
    quantity: number;
    unit_price: number;
}

interface Props {
    vendors: VendorProfile[];
    expenseAccounts: Account[];
    openOrders: PurchaseOrder[];
    defaultDate: string;
    defaultDueDate: string;
    prefill?: {
        vendor_id?: string;
        purchase_order_id?: string;
        lines?: BillLineInput[];
    };
}

export default function VendorBillsCreate({
    vendors,
    expenseAccounts,
    openOrders,
    defaultDate,
    defaultDueDate,
    prefill,
}: Props) {
    const { t, isRtl } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const initialVendorId = prefill?.vendor_id || vendors[0]?.id || '';
    const initialPoId = prefill?.purchase_order_id || '';
    const initialLines = prefill?.lines && prefill.lines.length > 0
        ? prefill.lines
        : [{ description: '', quantity: 1, unit_price: 0 }];

    const [form, setForm] = useState({
        vendor_id: initialVendorId,
        purchase_order_id: initialPoId,
        vendor_bill_number: '',
        bill_date: defaultDate,
        due_date: defaultDueDate,
        expense_account_id: expenseAccounts[0]?.id || '',
        notes: '',
        lines: initialLines as BillLineInput[],
    });

    const handlePoChange = (poId: string) => {
        const selectedPo = openOrders.find(o => o.id === poId);
        if (selectedPo) {
            setForm({
                ...form,
                purchase_order_id: poId,
                vendor_id: selectedPo.vendor_id,
                lines: selectedPo.lines.map(l => ({
                    description: l.description,
                    quantity: Number(l.quantity) || 1,
                    unit_price: Number(l.unit_price) || 0,
                })),
            });
        } else {
            setForm({
                ...form,
                purchase_order_id: '',
            });
        }
    };

    const addLine = () => {
        setForm({
            ...form,
            lines: [
                ...form.lines,
                {
                    description: '',
                    quantity: 1,
                    unit_price: 0,
                },
            ],
        });
    };

    const removeLine = (index: number) => {
        if (form.lines.length <= 1) return;
        const newLines = [...form.lines];
        newLines.splice(index, 1);
        setForm({ ...form, lines: newLines });
    };

    const updateLine = (index: number, field: keyof BillLineInput, value: any) => {
        const newLines = [...form.lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setForm({ ...form, lines: newLines });
    };

    const subtotal = form.lines.reduce((acc, line) => {
        const lineTotal = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
        return acc + lineTotal;
    }, 0);

    const testTaxRate = 0.10; // 10% test recoverable tax
    const taxAmount = Math.round(subtotal * testTaxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post('/vendor-bills', form, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={t('vendorBills.newBill')} />

            {/* Back link and header */}
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon" className="rounded-full">
                    <Link href="/vendor-bills">
                        {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('vendorBills.newBill')}
                    </h1>
                    <p className="text-sm text-neutral-500">
                        {t('vendorBills.subtitle')}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Header card */}
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="vendor_id">{t('vendorBills.vendor')} *</Label>
                            <select
                                id="vendor_id"
                                value={form.vendor_id}
                                onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
                                required
                                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            >
                                <option value="" disabled>{t('purchaseOrders.selectVendor')}</option>
                                {vendors.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {isRtl && v.party.name_ar ? v.party.name_ar : v.party.name} {v.party.tax_id ? `(${v.party.tax_id})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purchase_order_id">{t('vendorBills.poNumber')}</Label>
                            <select
                                id="purchase_order_id"
                                value={form.purchase_order_id}
                                onChange={(e) => handlePoChange(e.target.value)}
                                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- بدون أمر شراء مرتبط --' : '-- No PO Reference --'}</option>
                                {openOrders.map((po) => (
                                    <option key={po.id} value={po.id}>
                                        {po.order_number}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vendor_bill_number">{t('vendorBills.billNumber')}</Label>
                            <Input
                                id="vendor_bill_number"
                                placeholder="INV-2026-999"
                                value={form.vendor_bill_number}
                                onChange={(e) => setForm({ ...form, vendor_bill_number: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bill_date">{t('vendorBills.billDate')} *</Label>
                            <Input
                                id="bill_date"
                                type="date"
                                value={form.bill_date}
                                onChange={(e) => setForm({ ...form, bill_date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="due_date">{t('vendorBills.dueDate')} *</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={form.due_date}
                                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expense_account_id">{t('vendorBills.expenseAccount')} *</Label>
                            <select
                                id="expense_account_id"
                                value={form.expense_account_id}
                                onChange={(e) => setForm({ ...form, expense_account_id: e.target.value })}
                                required
                                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            >
                                {expenseAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {isRtl && acc.name_ar ? acc.name_ar : acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Line Items Card */}
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span>{t('purchaseOrders.details')}</span>
                        </h2>
                        <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            <span>{t('purchaseOrders.addItem')}</span>
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {form.lines.map((line, index) => {
                            const lineTotal = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                            return (
                                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800">
                                    <div className="flex-1 w-full sm:w-auto">
                                        <Label className="text-xs text-neutral-500 mb-1 block sm:hidden">
                                            {t('purchaseOrders.itemDescription')}
                                        </Label>
                                        <Input
                                            placeholder={t('purchaseOrders.itemDescription')}
                                            value={line.description}
                                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="w-full sm:w-28">
                                        <Label className="text-xs text-neutral-500 mb-1 block sm:hidden">
                                            {t('purchaseOrders.quantity')}
                                        </Label>
                                        <Input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            placeholder={t('purchaseOrders.quantity')}
                                            value={line.quantity}
                                            onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                    </div>

                                    <div className="w-full sm:w-36">
                                        <Label className="text-xs text-neutral-500 mb-1 block sm:hidden">
                                            {t('purchaseOrders.unitPrice')}
                                        </Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder={t('purchaseOrders.unitPrice')}
                                            value={line.unit_price}
                                            onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                    </div>

                                    <div className="w-full sm:w-32 text-end font-mono font-semibold text-neutral-800 dark:text-neutral-200 self-center">
                                        {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLine(index)}
                                        disabled={form.lines.length <= 1}
                                        className="text-neutral-400 hover:text-rose-600 self-center"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary Totals & GL Posting Simulation */}
                    <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-4 grid sm:grid-cols-2 gap-6">
                        {/* GL Posting Preview */}
                        <div className="rounded-lg bg-neutral-50 dark:bg-neutral-800/60 p-4 border border-neutral-200 dark:border-neutral-700 text-xs">
                            <p className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 mb-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                <span>{t('vendorBills.journalEntry')} (Posting Preview)</span>
                            </p>
                            <div className="space-y-1.5 font-mono text-neutral-600 dark:text-neutral-400">
                                <div className="flex justify-between">
                                    <span>DR Expense (5100 / 5200):</span>
                                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{subtotal.toFixed(2)} SAR</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>DR 1150 Input Tax Recoverable (10%):</span>
                                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{taxAmount.toFixed(2)} SAR</span>
                                </div>
                                <div className="flex justify-between border-t border-neutral-300 dark:border-neutral-700 pt-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                    <span>CR 2010 Accounts Payable (A/P):</span>
                                    <span>{totalAmount.toFixed(2)} SAR</span>
                                </div>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="flex flex-col justify-end gap-2 text-sm">
                            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                <span>{t('vendorBills.subtotal')}:</span>
                                <span className="font-mono font-medium">
                                    {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </span>
                            </div>
                            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                <span>{t('vendorBills.taxAmount')}:</span>
                                <span className="font-mono font-medium">
                                    {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-neutral-900 dark:text-neutral-100 border-t border-neutral-200 dark:border-neutral-800 pt-2">
                                <span>{t('vendorBills.totalAmount')}:</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400">
                                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions bar */}
                <div className="flex items-center justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/vendor-bills">{t('common.cancel')}</Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || subtotal <= 0}
                        className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 font-semibold px-6"
                    >
                        {isSubmitting ? t('common.loading') : t('vendorBills.saveAndPost')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
