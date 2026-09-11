import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Search, CreditCard, CheckCircle, ArrowUpRight, Wallet } from 'lucide-react';
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

interface OpenBill {
    id: string;
    bill_number: string;
    vendor_id: string;
    total: string;
    amount_paid: string;
    balance_due: string;
    bill_date: string;
}

interface PaymentAllocation {
    id: string;
    allocated_amount: string;
    vendor_bill?: {
        bill_number: string;
        total: string;
        balance_due: string;
    };
}

interface VendorPayment {
    id: string;
    payment_number: string;
    payment_date: string;
    amount: string;
    unallocated_amount: string;
    payment_method: 'bank_transfer' | 'cash' | 'check';
    notes?: string;
    vendor: VendorProfile;
    bank_account: Account;
    allocations?: PaymentAllocation[];
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    payments: PaginatedData<VendorPayment>;
    vendors: VendorProfile[];
    bankAccounts: Account[];
    openBills: OpenBill[];
    filters: {
        search?: string;
    };
}

export default function VendorPaymentsIndex({
    payments,
    vendors,
    bankAccounts,
    openBills,
    filters,
}: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        vendor_id: vendors[0]?.id || '',
        bank_account_id: bankAccounts[0]?.id || '',
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'bank_transfer',
        notes: '',
        allocations: {} as Record<string, number>,
    });

    const vendorOpenBills = useMemo(() => {
        return openBills.filter((b) => b.vendor_id === form.vendor_id);
    }, [openBills, form.vendor_id]);

    const handleVendorChange = (vendorId: string) => {
        setForm({
            ...form,
            vendor_id: vendorId,
            allocations: {},
        });
    };

    const handleAllocationChange = (billId: string, value: number) => {
        setForm({
            ...form,
            allocations: {
                ...form.allocations,
                [billId]: value,
            },
        });
    };

    const totalAllocated = useMemo(() => {
        return Object.values(form.allocations).reduce((acc, val) => acc + (Number(val) || 0), 0);
    }, [form.allocations]);

    const unallocated = useMemo(() => {
        const totalAmount = parseFloat(form.amount || '0');
        return Math.max(0, totalAmount - totalAllocated);
    }, [form.amount, totalAllocated]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/vendor-payments', { search }, { preserveState: true, replace: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const allocationPayload = Object.entries(form.allocations)
            .filter(([_, amount]) => Number(amount) > 0)
            .map(([bill_id, amount]) => ({
                vendor_bill_id: bill_id,
                amount: Number(amount),
            }));

        const payload = {
            vendor_id: form.vendor_id,
            bank_account_id: form.bank_account_id,
            payment_date: form.payment_date,
            amount: parseFloat(form.amount),
            payment_method: form.payment_method,
            notes: form.notes,
            allocations: allocationPayload,
        };

        router.post('/vendor-payments', payload, {
            onSuccess: () => {
                setIsOpen(false);
                setForm({
                    vendor_id: vendors[0]?.id || '',
                    bank_account_id: bankAccounts[0]?.id || '',
                    payment_date: new Date().toISOString().split('T')[0],
                    amount: '',
                    payment_method: 'bank_transfer',
                    notes: '',
                    allocations: {},
                });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const totalPaymentsAmount = payments.data.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('vendorPayments.title')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('vendorPayments.title')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('vendorPayments.subtitle')}
                    </p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800">
                            <Plus className="h-4 w-4" />
                            <span>{t('vendorPayments.newPayment')}</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-emerald-600" />
                                    <span>{t('vendorPayments.newPayment')}</span>
                                </DialogTitle>
                                <DialogDescription>
                                    {t('vendorPayments.subtitle')}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="pay_vendor">{t('vendorPayments.vendor')} *</Label>
                                    <select
                                        id="pay_vendor"
                                        value={form.vendor_id}
                                        onChange={(e) => handleVendorChange(e.target.value)}
                                        required
                                        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    >
                                        <option value="" disabled>{t('purchaseOrders.selectVendor')}</option>
                                        {vendors.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {isRtl && v.party.name_ar ? v.party.name_ar : v.party.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pay_bank">{t('vendorPayments.bankAccount')} *</Label>
                                    <select
                                        id="pay_bank"
                                        value={form.bank_account_id}
                                        onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })}
                                        required
                                        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    >
                                        {bankAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {isRtl && acc.name_ar ? acc.name_ar : acc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pay_date">{t('vendorPayments.paymentDate')} *</Label>
                                    <Input
                                        id="pay_date"
                                        type="date"
                                        value={form.payment_date}
                                        onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pay_method">{t('vendorPayments.paymentMethod')} *</Label>
                                    <select
                                        id="pay_method"
                                        value={form.payment_method}
                                        onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                                        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    >
                                        <option value="bank_transfer">{isRtl ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                                        <option value="cash">{isRtl ? 'نقداً' : 'Cash'}</option>
                                        <option value="check">{isRtl ? 'شيك' : 'Check'}</option>
                                    </select>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="pay_amount">{t('vendorPayments.amount')} (SAR) *</Label>
                                    <Input
                                        id="pay_amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={form.amount}
                                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        required
                                        placeholder="0.00"
                                        className="font-mono text-lg"
                                    />
                                </div>
                            </div>

                            {/* Open Bills Allocation Section */}
                            {vendorOpenBills.length > 0 && (
                                <div className="mt-4 border-t border-neutral-200 dark:border-neutral-800 pt-4">
                                    <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center justify-between">
                                        <span>{t('vendorPayments.allocations')}</span>
                                        <span className="text-xs font-mono font-normal text-neutral-500">
                                            {t('vendorPayments.unallocated')}: {unallocated.toFixed(2)} SAR
                                        </span>
                                    </h4>

                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {vendorOpenBills.map((bill) => {
                                            const currentAlloc = form.allocations[bill.id] || 0;
                                            return (
                                                <div key={bill.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 text-xs">
                                                    <div>
                                                        <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{bill.bill_number}</span>
                                                        <span className="text-neutral-500 ms-2">({bill.bill_date})</span>
                                                        <p className="text-neutral-500">
                                                            {t('vendorBills.balanceDue')}: <span className="font-mono font-semibold text-amber-600">{Number(bill.balance_due).toFixed(2)} SAR</span>
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-xs h-7 px-2"
                                                            onClick={() => {
                                                                const maxCanAllocate = Math.min(parseFloat(bill.balance_due), unallocated + currentAlloc);
                                                                handleAllocationChange(bill.id, maxCanAllocate);
                                                            }}
                                                        >
                                                            {isRtl ? 'الحد الأقصى' : 'Max'}
                                                        </Button>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max={bill.balance_due}
                                                            className="w-28 text-end font-mono h-8 text-xs"
                                                            value={currentAlloc || ''}
                                                            onChange={(e) => handleAllocationChange(bill.id, parseFloat(e.target.value) || 0)}
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !form.amount || parseFloat(form.amount) <= 0}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800"
                                >
                                    {isSubmitting ? t('common.loading') : t('vendorPayments.savePayment')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Metric card */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('vendorPayments.amount')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">
                            {totalPaymentsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('vendorPayments.title')}</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {payments.total} {isRtl ? 'سند صرف' : 'Payments'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter toolbar */}
            <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-80">
                    <div className="relative w-full">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder={t('customers.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <Button type="submit" variant="secondary">
                        <Search className="h-4 w-4" />
                    </Button>
                </form>
            </div>

            {/* Payments Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs font-semibold uppercase">
                            <tr>
                                <th className="px-6 py-3 text-start">{t('vendorPayments.paymentNumber')}</th>
                                <th className="px-6 py-3 text-start">{t('vendorPayments.vendor')}</th>
                                <th className="px-6 py-3 text-start">{t('vendorPayments.paymentDate')}</th>
                                <th className="px-6 py-3 text-start">{t('vendorPayments.paymentMethod')}</th>
                                <th className="px-6 py-3 text-start">{t('vendorPayments.bankAccount')}</th>
                                <th className="px-6 py-3 text-end">{t('vendorPayments.amount')}</th>
                                <th className="px-6 py-3 text-end">{t('vendorPayments.unallocated')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {payments.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                                        <CreditCard className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        <p>{t('vendorPayments.noPaymentsFound')}</p>
                                    </td>
                                </tr>
                            ) : (
                                payments.data.map((pay) => (
                                    <tr key={pay.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="px-6 py-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                            {pay.payment_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {isRtl && pay.vendor?.party?.name_ar ? pay.vendor.party.name_ar : pay.vendor?.party?.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                            {pay.payment_date}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 capitalize">
                                            {pay.payment_method.replace('_', ' ')}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                            <span className="font-mono text-xs">{pay.bank_account?.code}</span> - {pay.bank_account?.name}
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(pay.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono text-neutral-500">
                                            {Number(pay.unallocated_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
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
