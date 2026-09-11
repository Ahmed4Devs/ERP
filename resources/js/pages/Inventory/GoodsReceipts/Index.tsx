import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Truck, Eye, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface PurchaseOrder {
    id: string;
    po_number: string;
}

interface GoodsReceipt {
    id: string;
    receipt_number: string;
    date: string;
    status: 'draft' | 'posted' | 'reversed';
    total_cost: string;
    warehouse: Warehouse;
    party: Party;
    purchase_order?: PurchaseOrder;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    receipts: PaginatedData<GoodsReceipt>;
    warehouses: Warehouse[];
    filters: {
        search?: string;
        warehouse_id?: string;
        status?: string;
    };
}

export default function GoodsReceiptsIndex({ receipts, warehouses, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory/receipts', {
            search,
            warehouse_id: selectedWarehouse || undefined,
            status: selectedStatus || undefined,
        }, { preserveState: true, replace: true });
    };

    const totalReceiptsValue = receipts.data.reduce((sum, r) => sum + parseFloat(r.total_cost || '0'), 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('inventory.goodsReceiptsTitle')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('inventory.goodsReceiptsTitle')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('inventory.goodsReceiptsSubtitle')}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/inventory/receipts/create">
                        <Plus className="h-4 w-4" />
                        <span>{t('inventory.newReceipt')}</span>
                    </Link>
                </Button>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search by receipt #, vendor, warehouse..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <select
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        aria-label={t('inventory.destinationWarehouse')}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">{t('inventory.destinationWarehouse')}: All</option>
                        {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                    <Button type="submit" variant="secondary">
                        {t('common.view')}
                    </Button>
                </form>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50/80 dark:bg-neutral-800/50 text-xs uppercase font-medium text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3.5 text-start">{t('inventory.receiptNumber')}</th>
                                <th className="px-6 py-3.5 text-start">{t('inventory.vendor')}</th>
                                <th className="px-6 py-3.5 text-start">{t('inventory.destinationWarehouse')}</th>
                                <th className="px-6 py-3.5 text-start">{t('inventory.purchaseOrder')}</th>
                                <th className="px-6 py-3.5 text-start">{t('inventory.receiptDate')}</th>
                                <th className="px-6 py-3.5 text-center">{t('customers.status')}</th>
                                <th className="px-6 py-3.5 text-end">{t('inventory.totalValue')}</th>
                                <th className="px-6 py-3.5 text-end">{t('customers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {receipts.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-500">
                                        <Truck className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        <p>No goods receipts found.</p>
                                    </td>
                                </tr>
                            ) : (
                                receipts.data.map((r) => (
                                    <tr key={r.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {r.receipt_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {isRtl && r.party?.name_ar ? r.party.name_ar : r.party?.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                            <span className="font-mono font-semibold">{r.warehouse?.code}</span> - {r.warehouse?.name}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-neutral-500">
                                            {r.purchase_order ? r.purchase_order.po_number : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                                            {r.date}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                <CheckCircle2 className="h-3 w-3" />
                                                <span className="capitalize">{r.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(r.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <Button asChild variant="ghost" size="sm">
                                                <Link href={`/inventory/receipts/${r.id}`}>
                                                    <Eye className="h-4 w-4 text-neutral-500 hover:text-neutral-900" />
                                                    <span className="ms-1">{t('common.view')}</span>
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
