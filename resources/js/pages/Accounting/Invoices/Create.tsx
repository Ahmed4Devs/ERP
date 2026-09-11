import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Calculator, CheckCircle } from 'lucide-react';
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

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface InvoiceLineInput {
    description: string;
    quantity: number;
    unit_price: number;
    revenue_account_id: string;
}

interface Props {
    customers: Party[];
    revenueAccounts: Account[];
    defaultDate: string;
    defaultDueDate: string;
}

export default function InvoicesCreate({ customers, revenueAccounts, defaultDate, defaultDueDate }: Props) {
    const { t, isRtl } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        party_id: customers[0]?.id || '',
        date: defaultDate,
        due_date: defaultDueDate,
        notes: '',
        lines: [
            {
                description: '',
                quantity: 1,
                unit_price: 0,
                revenue_account_id: revenueAccounts[0]?.id || '',
            },
        ] as InvoiceLineInput[],
    });

    const addLine = () => {
        setForm({
            ...form,
            lines: [
                ...form.lines,
                {
                    description: '',
                    quantity: 1,
                    unit_price: 0,
                    revenue_account_id: revenueAccounts[0]?.id || '',
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

    const updateLine = (index: number, field: keyof InvoiceLineInput, value: any) => {
        const newLines = [...form.lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setForm({ ...form, lines: newLines });
    };

    // Calculate totals
    const subtotal = form.lines.reduce((acc, line) => {
        const lineTotal = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
        return acc + lineTotal;
    }, 0);

    const testTaxRate = 0.10; // 10% test tax configuration
    const testTaxAmount = Math.round(subtotal * testTaxRate * 100) / 100;
    const totalAmount = Math.round((subtotal + testTaxAmount) * 100) / 100;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post('/invoices', form, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={t('invoices.newInvoice')} />

            {/* Header & Back button */}
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-9 w-9">
                    <Link href="/invoices">
                        <BackIcon className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('invoices.newInvoice')}
                    </h1>
                    <p className="text-sm text-neutral-500">
                        {t('invoices.subtitle')}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* General Invoice Info Card */}
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="party_id">{t('invoices.customer')} *</Label>
                            <select
                                id="party_id"
                                required
                                value={form.party_id}
                                onChange={(e) => setForm({ ...form, party_id: e.target.value })}
                                className="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors dark:border-neutral-800"
                            >
                                <option value="" disabled>Select Customer</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.name_ar ? `(${c.name_ar})` : ''} {c.tax_id ? `- Tax: ${c.tax_id}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="date">{t('invoices.date')} *</Label>
                            <Input
                                id="date"
                                type="date"
                                required
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="due_date">{t('invoices.dueDate')} *</Label>
                            <Input
                                id="due_date"
                                type="date"
                                required
                                value={form.due_date}
                                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Line items section */}
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {t('invoices.lineItems')}
                        </h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addLine}
                            className="gap-1.5 text-xs"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{t('invoices.addLine')}</span>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="pb-3 text-start font-semibold w-2/5">{t('invoices.description')} *</th>
                                    <th className="pb-3 text-start font-semibold w-1/4">{t('invoices.revenueAccount')}</th>
                                    <th className="pb-3 text-start font-semibold w-24">{t('invoices.quantity')}</th>
                                    <th className="pb-3 text-start font-semibold w-28">{t('invoices.unitPrice')}</th>
                                    <th className="pb-3 text-end font-semibold w-28">{t('invoices.lineTotal')}</th>
                                    <th className="pb-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {form.lines.map((line, index) => {
                                    const lineTotal = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
                                    return (
                                        <tr key={index} className="align-top py-2">
                                            <td className="py-2.5 pr-2">
                                                <Input
                                                    required
                                                    value={line.description}
                                                    onChange={(e) => updateLine(index, 'description', e.target.value)}
                                                    placeholder="e.g. IT Advisory Services"
                                                />
                                            </td>
                                            <td className="py-2.5 px-2">
                                                <select
                                                    value={line.revenue_account_id}
                                                    onChange={(e) => updateLine(index, 'revenue_account_id', e.target.value)}
                                                    className="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors dark:border-neutral-800"
                                                >
                                                    {revenueAccounts.map((acc) => (
                                                        <option key={acc.id} value={acc.id}>
                                                            {acc.code} - {acc.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="py-2.5 px-2">
                                                <Input
                                                    type="number"
                                                    step="0.0001"
                                                    min="0.0001"
                                                    required
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td className="py-2.5 px-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    required
                                                    value={line.unit_price}
                                                    onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td className="py-2.5 pl-2 text-end font-mono font-semibold pt-4">
                                                {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2.5 pl-2 text-center pt-3">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={form.lines.length <= 1}
                                                    onClick={() => removeLine(index)}
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
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

                    {/* Summary Totals */}
                    <div className="mt-6 flex justify-end">
                        <div className="w-full sm:max-w-sm rounded-lg bg-neutral-50 p-4 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 flex flex-col gap-2.5">
                            <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                                <span>{t('invoices.subtotal')}</span>
                                <span className="font-mono font-medium text-neutral-900 dark:text-white">
                                    {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </span>
                            </div>

                            <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                                <div className="flex items-center gap-1.5">
                                    <span>{t('invoices.taxAmount')}</span>
                                    <span className="text-xs rounded bg-neutral-200 px-1.5 py-0.5 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">10%</span>
                                </div>
                                <span className="font-mono font-medium text-neutral-900 dark:text-white">
                                    {testTaxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </span>
                            </div>

                            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 flex justify-between text-base font-bold text-neutral-900 dark:text-white">
                                <span>{t('invoices.total')}</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Button asChild type="button" variant="outline">
                        <Link href="/invoices">{t('customers.cancel')}</Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800"
                    >
                        <CheckCircle className="h-4 w-4" />
                        <span>{isSubmitting ? t('common.loading') : t('invoices.saveAndPost')}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
