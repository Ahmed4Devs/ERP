import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, ReceiptText, FileCheck, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    party: Party;
    date: string;
    due_date: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    amount_paid: string;
    balance_due: string;
    status: 'draft' | 'posted' | 'partially_paid' | 'paid' | 'reversed';
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    invoices: PaginatedData<Invoice>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function InvoicesIndex({ invoices, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/invoices', { search, status: selectedStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get('/invoices', { search, status: status || undefined }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: Invoice['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
            case 'posted':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
            case 'partially_paid':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900';
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
            case 'reversed':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    // Calculate totals for currently shown invoices
    const totalInvoiced = invoices.data.reduce((acc, inv) => acc + parseFloat(inv.total || '0'), 0);
    const totalPaid = invoices.data.reduce((acc, inv) => acc + parseFloat(inv.amount_paid || '0'), 0);
    const totalDue = invoices.data.reduce((acc, inv) => acc + parseFloat(inv.balance_due || '0'), 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('invoices.title')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('invoices.title')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('invoices.subtitle')}
                    </p>
                </div>

                <Button asChild className="gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800">
                    <Link href="/invoices/create">
                        <Plus className="h-4 w-4" />
                        <span>{t('invoices.newInvoice')}</span>
                    </Link>
                </Button>
            </div>

            {/* Metric cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <ReceiptText className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('invoices.total')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">
                            {totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('invoices.amountPaid')}</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                        <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('invoices.balanceDue')}</p>
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                            {totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:max-w-md">
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

                <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
                    {[
                        { label: 'All', value: '' },
                        { label: t('invoices.posted'), value: 'posted' },
                        { label: t('invoices.partiallyPaid'), value: 'partially_paid' },
                        { label: t('invoices.paid'), value: 'paid' },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => handleStatusFilter(tab.value)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                selectedStatus === tab.value
                                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 font-semibold">{t('invoices.invoiceNumber')}</th>
                                <th className="px-6 py-3 font-semibold">{t('invoices.customer')}</th>
                                <th className="px-6 py-3 font-semibold">{t('invoices.date')}</th>
                                <th className="px-6 py-3 font-semibold">{t('invoices.dueDate')}</th>
                                <th className="px-6 py-3 font-semibold">{t('invoices.status')}</th>
                                <th className="px-6 py-3 font-semibold text-end">{t('invoices.total')}</th>
                                <th className="px-6 py-3 font-semibold text-end">{t('invoices.balanceDue')}</th>
                                <th className="px-6 py-3 font-semibold text-end">{t('customers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {invoices.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-neutral-500">
                                        {t('invoices.noInvoicesFound')}
                                    </td>
                                </tr>
                            ) : (
                                invoices.data.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {inv.invoice_number}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                            <div>{inv.party?.name}</div>
                                            {inv.party?.name_ar && (
                                                <div className="text-xs text-neutral-500 font-normal mt-0.5">{inv.party.name_ar}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                            {inv.date}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                            {inv.due_date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(inv.status)}`}>
                                                {t(`invoices.${inv.status.replace('_', '')}`, inv.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-amber-600 dark:text-amber-400">
                                            {Number(inv.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900">
                                                <Link href={`/invoices/${inv.id}`}>
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
