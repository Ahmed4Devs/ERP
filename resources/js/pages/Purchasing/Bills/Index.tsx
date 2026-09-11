import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, FileText, CheckCircle2, Clock, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface Vendor {
    id: string;
    party: Party;
}

interface Account {
    id: string;
    code: string;
    name: string;
}

interface PurchaseOrder {
    id: string;
    order_number: string;
}

interface VendorBill {
    id: string;
    bill_number: string;
    vendor_bill_number?: string;
    vendor: Vendor;
    expense_account?: Account;
    purchase_order?: PurchaseOrder;
    bill_date: string;
    due_date: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    amount_paid: string;
    balance_due: string;
    status: 'draft' | 'posted' | 'partially_paid' | 'paid' | 'cancelled';
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    bills: PaginatedData<VendorBill>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function VendorBillsIndex({ bills, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/vendor-bills', { search, status: selectedStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get('/vendor-bills', { search, status: status || undefined }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: VendorBill['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
            case 'posted':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
            case 'partially_paid':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900';
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const totalBilled = bills.data.reduce((acc, b) => acc + parseFloat(b.total || '0'), 0);
    const totalDue = bills.data.reduce((acc, b) => acc + parseFloat(b.balance_due || '0'), 0);
    const totalPaid = bills.data.reduce((acc, b) => acc + parseFloat(b.amount_paid || '0'), 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('vendorBills.title')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('vendorBills.title')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('vendorBills.subtitle')}
                    </p>
                </div>

                <Button asChild className="gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800">
                    <Link href="/vendor-bills/create">
                        <Plus className="h-4 w-4" />
                        <span>{t('vendorBills.newBill')}</span>
                    </Link>
                </Button>
            </div>

            {/* Metrics cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('vendorBills.totalAmount')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">
                            {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('vendorBills.balanceDue')}</p>
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            {totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('invoices.amountPaid')}</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
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

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
                    {['', 'draft', 'posted', 'partially_paid', 'paid', 'cancelled'].map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusFilter(st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                selectedStatus === st
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                        >
                            {st === '' ? (isRtl ? 'الكل' : 'All') : t(`vendorBills.${st === 'partially_paid' ? 'partiallyPaid' : st}`, st)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bills Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs font-semibold uppercase">
                            <tr>
                                <th className="px-6 py-3 text-start">{t('vendorBills.billNumber')}</th>
                                <th className="px-6 py-3 text-start">{t('vendorBills.vendor')}</th>
                                <th className="px-6 py-3 text-start">{t('vendorBills.billDate')}</th>
                                <th className="px-6 py-3 text-start">{t('vendorBills.dueDate')}</th>
                                <th className="px-6 py-3 text-start">{t('vendorBills.status')}</th>
                                <th className="px-6 py-3 text-end">{t('vendorBills.totalAmount')}</th>
                                <th className="px-6 py-3 text-end">{t('vendorBills.balanceDue')}</th>
                                <th className="px-6 py-3 text-end">{t('customers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {bills.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                                        <FileText className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        <p>{t('vendorBills.noBillsFound')}</p>
                                    </td>
                                </tr>
                            ) : (
                                bills.data.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="px-6 py-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                            {bill.bill_number}
                                            {bill.vendor_bill_number && (
                                                <span className="block text-xs font-normal text-neutral-500">
                                                    Ref: {bill.vendor_bill_number}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {isRtl && bill.vendor?.party?.name_ar ? bill.vendor.party.name_ar : bill.vendor?.party?.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                            {bill.bill_date}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                            {bill.due_date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(bill.status)}`}>
                                                {t(`vendorBills.${bill.status === 'partially_paid' ? 'partiallyPaid' : bill.status}`, bill.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(bill.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-amber-600 dark:text-amber-400">
                                            {Number(bill.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900">
                                                <Link href={`/vendor-bills/${bill.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span>{t('common.view')}</span>
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
        </div>
    );
}
