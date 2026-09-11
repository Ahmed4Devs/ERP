import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface AdjustmentLine {
    id: string;
    type: 'increase' | 'decrease';
    quantity: string;
    unit_cost: string;
    line_total: string;
    product: {
        sku: string;
        name: string;
    };
}

interface StockAdjustment {
    id: string;
    adjustment_number: string;
    date: string;
    reason: string;
    status: string;
    total_cost_impact: string;
    warehouse: Warehouse;
    lines: AdjustmentLine[];
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    adjustments: PaginatedData<StockAdjustment>;
    filters: {
        search?: string;
    };
}

export default function StockAdjustmentsIndex({ adjustments, filters }: Props) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory/adjustments', { search }, { preserveState: true, replace: true });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('inventory.adjustmentsTitle')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('inventory.adjustmentsTitle')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('inventory.adjustmentsSubtitle')}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/inventory/adjustments/create">
                        <Plus className="h-4 w-4" />
                        <span>{t('inventory.newAdjustment')}</span>
                    </Link>
                </Button>
            </div>

            {/* Search */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search by adjustment #..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
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
                                <th className="px-6 py-3.5 text-start">{t('inventory.adjustmentNumber')}</th>
                                <th className="px-6 py-3.5 text-start">{t('inventory.receiptDate')}</th>
                                <th className="px-6 py-3.5 text-start">{t('inventory.destinationWarehouse')}</th>
                                <th className="px-6 py-3.5 text-start">{t('inventory.reason')}</th>
                                <th className="px-6 py-3.5 text-center">Items Count</th>
                                <th className="px-6 py-3.5 text-center">{t('customers.status')}</th>
                                <th className="px-6 py-3.5 text-end">{t('inventory.netImpact')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {adjustments.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                                        <ClipboardCheck className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        <p>No stock adjustments recorded.</p>
                                    </td>
                                </tr>
                            ) : (
                                adjustments.data.map((adj) => {
                                    const net = parseFloat(adj.total_cost_impact || '0');
                                    return (
                                        <tr key={adj.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                            <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {adj.adjustment_number}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                                                {adj.date}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono font-semibold">{adj.warehouse?.code}</span> - {adj.warehouse?.name}
                                            </td>
                                            <td className="px-6 py-4 capitalize font-medium text-neutral-800 dark:text-neutral-200">
                                                {t(`inventory.${adj.reason}`, adj.reason)}
                                            </td>
                                            <td className="px-6 py-4 text-center font-mono">
                                                {adj.lines?.length || 0}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    <span className="capitalize">{adj.status}</span>
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-end font-mono font-bold ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {net >= 0 ? '+' : ''}{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
