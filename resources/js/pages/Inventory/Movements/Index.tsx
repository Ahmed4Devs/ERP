import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Search, ArrowDownUp, ArrowDownRight, ArrowUpRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    unit?: {
        code: string;
    };
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface StockMovement {
    id: string;
    movement_number: string;
    movement_type: string;
    direction: 'in' | 'out';
    quantity: string;
    unit_cost: string;
    total_cost: string;
    pre_movement_qty: string;
    post_movement_qty: string;
    pre_movement_avg_cost: string;
    post_movement_avg_cost: string;
    date: string;
    notes?: string;
    product: Product;
    warehouse: Warehouse;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    movements: PaginatedData<StockMovement>;
    warehouses: Warehouse[];
    products: Product[];
    filters: {
        search?: string;
        product_id?: string;
        warehouse_id?: string;
        movement_type?: string;
        direction?: string;
    };
}

export default function MovementsIndex({ movements, warehouses, products, filters }: Props) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedProduct, setSelectedProduct] = useState(filters.product_id || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');
    const [selectedDirection, setSelectedDirection] = useState(filters.direction || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory/movements', {
            search,
            product_id: selectedProduct || undefined,
            warehouse_id: selectedWarehouse || undefined,
            direction: selectedDirection || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('inventory.movementsTitle')} />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {t('inventory.movementsTitle')}
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                    {t('inventory.movementsSubtitle')}
                </p>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search movement #, SKU, warehouse..."
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
                        <option value="">Warehouse: All</option>
                        {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        aria-label={t('inventory.productName')}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">Product: All</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                        ))}
                    </select>
                    <select
                        value={selectedDirection}
                        onChange={(e) => setSelectedDirection(e.target.value)}
                        aria-label={t('inventory.direction')}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">Direction: All</option>
                        <option value="in">Inbound (+)</option>
                        <option value="out">Outbound (-)</option>
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
                                <th className="px-4 py-3.5 text-start">{t('inventory.movementNumber')}</th>
                                <th className="px-4 py-3.5 text-start">{t('inventory.receiptDate')}</th>
                                <th className="px-4 py-3.5 text-start">{t('inventory.sku')}</th>
                                <th className="px-4 py-3.5 text-start">{t('inventory.destinationWarehouse')}</th>
                                <th className="px-4 py-3.5 text-center">{t('inventory.direction')}</th>
                                <th className="px-4 py-3.5 text-end">Qty Delta</th>
                                <th className="px-4 py-3.5 text-end">On-Hand Transition</th>
                                <th className="px-4 py-3.5 text-end">{t('inventory.unitCost')}</th>
                                <th className="px-4 py-3.5 text-end">Avg Cost Transition</th>
                                <th className="px-4 py-3.5 text-end">{t('inventory.totalValue')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono text-xs">
                            {movements.data.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-neutral-500 font-sans text-sm">
                                        <ArrowDownUp className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        <p>No stock movements recorded yet.</p>
                                    </td>
                                </tr>
                            ) : (
                                movements.data.map((m) => {
                                    const isIn = m.direction === 'in';
                                    return (
                                        <tr key={m.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                            <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                                                {m.movement_number}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500">
                                                {m.date}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                                                {m.product?.sku}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-sans">
                                                {m.warehouse?.code}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                    isIn
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                                }`}>
                                                    {isIn ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                                                    <span>{isIn ? 'IN (+)' : 'OUT (-)'}</span>
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-end font-bold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {isIn ? '+' : '-'}{Number(m.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-end text-neutral-600 dark:text-neutral-400">
                                                {Number(m.pre_movement_qty).toFixed(2)} → <span className="font-bold text-neutral-900 dark:text-neutral-100">{Number(m.post_movement_qty).toFixed(2)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-end text-neutral-600 dark:text-neutral-400">
                                                {Number(m.unit_cost).toFixed(4)}
                                            </td>
                                            <td className="px-4 py-3 text-end text-neutral-600 dark:text-neutral-400">
                                                {Number(m.pre_movement_avg_cost).toFixed(4)} → <span className="font-bold text-indigo-600 dark:text-indigo-400">{Number(m.post_movement_avg_cost).toFixed(4)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-end font-bold text-neutral-900 dark:text-neutral-100">
                                                {Number(m.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
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
