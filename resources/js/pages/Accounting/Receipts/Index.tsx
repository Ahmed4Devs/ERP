import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Search, Banknote, CheckCircle, ArrowDownLeft, Wallet, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface OpenInvoice {
    id: string;
    invoice_number: string;
    party_id: string;
    total: string;
    amount_paid: string;
    balance_due: string;
    date: string;
}

interface ReceiptAllocation {
    id: string;
    amount: string;
    invoice?: {
        invoice_number: string;
        total: string;
        balance_due: string;
    };
}

interface Receipt {
    id: string;
    receipt_number: string;
    date: string;
    amount: string;
    unallocated_amount: string;
    payment_method: 'bank_transfer' | 'cash' | 'check';
    notes?: string;
    party?: Party;
    deposit_account?: Account;
    allocations?: ReceiptAllocation[];
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    receipts: PaginatedData<Receipt>;
    customers: Party[];
    depositAccounts: Account[];
    openInvoices: OpenInvoice[];
    filters: {
        search?: string;
    };
}

export default function ReceiptsIndex({ receipts, customers, depositAccounts, openInvoices, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        party_id: customers[0]?.id || '',
        deposit_account_id: depositAccounts[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'bank_transfer',
        notes: '',
        allocations: {} as Record<string, number>,
    });

    // Invoices belonging to currently selected customer in modal
    const customerOpenInvoices = useMemo(() => {
        return openInvoices.filter((inv) => inv.party_id === form.party_id);
    }, [openInvoices, form.party_id]);

    const totalAllocated = useMemo(() => {
        return Object.values(form.allocations).reduce((acc, val) => acc + (Number(val) || 0), 0);
    }, [form.allocations]);

    const receiptAmountNum = Number(form.amount) || 0;
    const remainingToAllocate = Math.max(0, receiptAmountNum - totalAllocated);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/receipts', { search }, { preserveState: true, replace: true });
    };

    const handleAllocationChange = (invoiceId: string, value: number) => {
        const next = { ...form.allocations };
        if (value <= 0) {
            delete next[invoiceId];
        } else {
            next[invoiceId] = value;
        }
        setForm({ ...form, allocations: next });
    };

    const handleAutoAllocate = (invoice: OpenInvoice) => {
        const balance = parseFloat(invoice.balance_due);
        const canAllocate = Math.min(balance, remainingToAllocate + (form.allocations[invoice.id] || 0));
        handleAllocationChange(invoice.id, Math.round(canAllocate * 100) / 100);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const allocationList = Object.entries(form.allocations).map(([service_invoice_id, amount]) => ({
            service_invoice_id,
            amount,
        }));

        router.post(
            '/receipts',
            {
                party_id: form.party_id,
                deposit_account_id: form.deposit_account_id,
                date: form.date,
                amount: form.amount,
                payment_method: form.payment_method,
                notes: form.notes,
                allocations: allocationList,
            },
            {
                onSuccess: () => {
                    setIsOpen(false);
                    setForm({
                        party_id: customers[0]?.id || '',
                        deposit_account_id: depositAccounts[0]?.id || '',
                        date: new Date().toISOString().split('T')[0],
                        amount: '',
                        payment_method: 'bank_transfer',
                        notes: '',
                        allocations: {},
                    });
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const totalReceiptsAmount = receipts.data.reduce((acc, r) => acc + parseFloat(r.amount || '0'), 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('receipts.title')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('receipts.title')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('receipts.subtitle')}
                    </p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800">
                            <Plus className="h-4 w-4" />
                            <span>{t('receipts.newReceipt')}</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>{t('receipts.newReceipt')}</DialogTitle>
                                <DialogDescription>{t('receipts.subtitle')}</DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="receipt_party_id">{t('receipts.customer')} *</Label>
                                        <select
                                            id="receipt_party_id"
                                            required
                                            value={form.party_id}
                                            onChange={(e) => {
                                                setForm({ ...form, party_id: e.target.value, allocations: {} });
                                            }}
                                            className="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors dark:border-neutral-800"
                                        >
                                            {customers.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} {c.name_ar ? `(${c.name_ar})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="receipt_deposit_acc">{t('receipts.depositAccount')} *</Label>
                                        <select
                                            id="receipt_deposit_acc"
                                            required
                                            value={form.deposit_account_id}
                                            onChange={(e) => setForm({ ...form, deposit_account_id: e.target.value })}
                                            className="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors dark:border-neutral-800"
                                        >
                                            {depositAccounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.code} - {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="receipt_date">{t('receipts.date')} *</Label>
                                        <Input
                                            id="receipt_date"
                                            type="date"
                                            required
                                            value={form.date}
                                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="receipt_method">{t('receipts.paymentMethod')} *</Label>
                                        <select
                                            id="receipt_method"
                                            value={form.payment_method}
                                            onChange={(e) => setForm({ ...form, payment_method: e.target.value as any })}
                                            className="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors dark:border-neutral-800"
                                        >
                                            <option value="bank_transfer">{t('receipts.bankTransfer')}</option>
                                            <option value="cash">{t('receipts.cash')}</option>
                                            <option value="check">{t('receipts.check')}</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="receipt_amount">{t('receipts.amount')} *</Label>
                                        <Input
                                            id="receipt_amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            required
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Open Invoices Allocation Section */}
                                <div className="mt-2 rounded-lg border border-neutral-200 p-3.5 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                                            {t('receipts.allocations')}
                                        </h3>
                                        <div className="text-xs font-medium">
                                            <span className="text-neutral-500">Remaining to allocate: </span>
                                            <span className={`font-mono font-bold ${remainingToAllocate > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                {remainingToAllocate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                            </span>
                                        </div>
                                    </div>

                                    {customerOpenInvoices.length === 0 ? (
                                        <p className="text-xs text-neutral-400 py-3 text-center">
                                            No open invoices found for this customer.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {customerOpenInvoices.map((inv) => {
                                                const allocatedVal = form.allocations[inv.id] || '';
                                                return (
                                                    <div
                                                        key={inv.id}
                                                        className="flex items-center justify-between gap-3 rounded bg-white p-2.5 text-xs shadow-xs dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800"
                                                    >
                                                        <div>
                                                            <div className="font-mono font-bold text-neutral-900 dark:text-white">
                                                                {inv.invoice_number}
                                                            </div>
                                                            <div className="text-neutral-400 mt-0.5">
                                                                {t('invoices.date')}: {inv.date} • {t('invoices.balanceDue')}: {Number(inv.balance_due).toLocaleString()} SAR
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleAutoAllocate(inv)}
                                                                className="h-7 text-xs px-2"
                                                            >
                                                                Auto-Fill
                                                            </Button>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max={parseFloat(inv.balance_due)}
                                                                value={allocatedVal}
                                                                onChange={(e) => handleAllocationChange(inv.id, parseFloat(e.target.value) || 0)}
                                                                placeholder="0.00"
                                                                className="h-7 w-28 text-end font-mono text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    {t('customers.cancel')}
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? t('common.loading') : t('receipts.saveReceipt')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('receipts.amount')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">
                            {totalReceiptsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('receipts.title')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">{receipts.total}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                        <ArrowDownLeft className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('invoices.status')}</p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Atomic GL Posting</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                    <Search className={`absolute top-2.5 h-4 w-4 text-neutral-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('customers.searchPlaceholder')}
                        className={isRtl ? 'pr-9' : 'pl-9'}
                    />
                </div>
                <Button type="submit" variant="secondary">
                    {t('common.view')}
                </Button>
            </form>

            {/* Receipts Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 font-semibold">{t('receipts.receiptNumber')}</th>
                                <th className="px-6 py-3 font-semibold">{t('receipts.customer')}</th>
                                <th className="px-6 py-3 font-semibold">{t('receipts.date')}</th>
                                <th className="px-6 py-3 font-semibold">{t('receipts.depositAccount')}</th>
                                <th className="px-6 py-3 font-semibold">{t('receipts.paymentMethod')}</th>
                                <th className="px-6 py-3 font-semibold text-end">{t('receipts.amount')}</th>
                                <th className="px-6 py-3 font-semibold text-end">{t('receipts.unallocated')}</th>
                                <th className="px-6 py-3 font-semibold text-center">{isRtl ? 'طباعة السند' : 'Print'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {receipts.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-neutral-500">
                                        {t('receipts.noReceiptsFound')}
                                    </td>
                                </tr>
                            ) : (
                                receipts.data.map((r) => (
                                    <tr key={r.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {r.receipt_number}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                            <div>{r.party?.name}</div>
                                            {r.party?.name_ar && (
                                                <div className="text-xs text-neutral-500 font-normal mt-0.5">{r.party.name_ar}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {r.date}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-neutral-600 dark:text-neutral-400">
                                            {r.deposit_account ? `${r.deposit_account.code} - ${r.deposit_account.name}` : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium capitalize text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200">
                                                {t(`receipts.${r.payment_method === 'bank_transfer' ? 'bankTransfer' : r.payment_method}`, r.payment_method)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono text-xs text-neutral-500">
                                            {Number(r.unallocated_amount) > 0 ? (
                                                <span className="text-amber-600 font-bold">
                                                    {Number(r.unallocated_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                                </span>
                                            ) : (
                                                <span className="text-neutral-400">0.00</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                                                <a href={`/receipts/${r.id}/print`} target="_blank" rel="noopener noreferrer">
                                                    <Printer className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-300" />
                                                    <span>{isRtl ? 'طباعة' : 'Print'}</span>
                                                </a>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
