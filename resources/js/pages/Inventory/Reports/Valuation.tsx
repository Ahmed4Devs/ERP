import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Search, BarChart3, CheckCircle2, AlertTriangle, Layers, Building2, Package, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Category {
    id: string;
    code: string;
    name: string;
}

interface ValuationItem {
    product_id: string;
    sku: string;
    name: string;
    name_ar?: string;
    category_name?: string;
    unit_code?: string;
    warehouse_id: string;
    warehouse_name: string;
    warehouse_code: string;
    quantity_on_hand: string;
    quantity_reserved: string;
    quantity_available: string;
    moving_average_cost: string;
    total_value: string;
}

interface ValuationReport {
    items: ValuationItem[];
    total_valuation: string;
    total_items_count: number;
    gl_inventory_balance: string;
    valuation_variance: string;
}

interface Props {
    report: ValuationReport;
    warehouses: Warehouse[];
    categories: Category[];
    filters: {
        warehouse_id?: string;
        category_id?: string;
        search?: string;
    };
}

export default function InventoryValuationReport({ report, warehouses, categories, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/inventory-valuation', {
            search: search || undefined,
            warehouse_id: selectedWarehouse || undefined,
            category_id: selectedCategory || undefined,
        }, { preserveState: true, replace: true });
    };

    const varianceNum = parseFloat(report.valuation_variance || '0');
    const isReconciled = Math.abs(varianceNum) < 0.0001;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('inventory.valuationReportTitle')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('inventory.valuationReportTitle')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('inventory.valuationReportSubtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
                        <a href={`/reports/inventory-valuation/export?warehouse_id=${selectedWarehouse}&category_id=${selectedCategory}&search=${encodeURIComponent(search)}`}>
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>{isRtl ? 'تصدير Excel' : 'Export Excel'}</span>
                        </a>
                    </Button>
                </div>
            </div>

            {/* Executive KPIs & GL Reconciliation Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-neutral-500">Subledger Inventory Value</p>
                            <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                                {Number(report.total_valuation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-neutral-500">{t('inventory.glBalance')}</p>
                            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                {Number(report.gl_inventory_balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${isReconciled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50'}`}>
                            {isReconciled ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div>
                            <p className="text-xs font-medium text-neutral-500">{t('inventory.variance')}</p>
                            <div className="flex items-center gap-2">
                                <p className={`text-xl font-bold font-mono ${isReconciled ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                                    {varianceNum.toFixed(2)} SAR
                                </p>
                                {isReconciled && (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                        Reconciled
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-neutral-500">Stocked Lines Count</p>
                            <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                                {report.total_items_count}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleFilter} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search by SKU, product name..."
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
                        <option value="">{t('inventory.filterByWarehouse')}: All</option>
                        {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        aria-label={t('inventory.category')}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">{t('inventory.filterByCategory')}: All</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                    <Button type="submit" variant="secondary">
                        {t('common.view')}
                    </Button>
                </form>
            </div>

            {/* Subledger Valuation Table */}
            <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50/80 dark:bg-neutral-800/50 text-xs uppercase font-medium text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-5 py-3.5 text-start">{t('inventory.sku')}</th>
                                <th className="px-5 py-3.5 text-start">{t('inventory.productName')}</th>
                                <th className="px-5 py-3.5 text-start">{t('inventory.category')}</th>
                                <th className="px-5 py-3.5 text-start">{t('inventory.destinationWarehouse')}</th>
                                <th className="px-5 py-3.5 text-end">{t('inventory.onHand')}</th>
                                <th className="px-5 py-3.5 text-end">{t('inventory.reserved')}</th>
                                <th className="px-5 py-3.5 text-end">{t('inventory.available')}</th>
                                <th className="px-5 py-3.5 text-end">{t('inventory.movingAvgCost')}</th>
                                <th className="px-5 py-3.5 text-end">{t('inventory.totalValue')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {report.items.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                                        <Package className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        <p>No inventory levels found for current filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                report.items.map((item) => (
                                    <tr key={`${item.warehouse_id}-${item.product_id}`} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="px-5 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {item.sku}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {isRtl && item.name_ar ? item.name_ar : item.name}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-neutral-600 dark:text-neutral-400">
                                            {item.category_name || '-'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                                                {item.warehouse_code}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(item.quantity_on_hand).toLocaleString(undefined, { minimumFractionDigits: 2 })} {item.unit_code}
                                        </td>
                                        <td className="px-5 py-4 text-end font-mono text-neutral-500">
                                            {Number(item.quantity_reserved).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-4 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {Number(item.quantity_available).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-5 py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                            {Number(item.moving_average_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SAR
                                        </td>
                                        <td className="px-5 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(item.total_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-800/30">
                                <td colSpan={8} className="px-5 py-4 text-end font-bold text-neutral-900 dark:text-neutral-100">
                                    Total Subledger Inventory Valuation:
                                </td>
                                <td className="px-5 py-4 text-end font-mono font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                    {Number(report.total_valuation).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
