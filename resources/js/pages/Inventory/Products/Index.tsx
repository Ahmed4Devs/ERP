import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Boxes, Edit2, Trash2, Tag, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Category {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface Unit {
    id: string;
    code: string;
    name: string;
    symbol?: string;
}

interface InventoryLevel {
    id: string;
    warehouse_id: string;
    quantity_on_hand: string;
    moving_average_cost: string;
    total_value: string;
    warehouse?: {
        code: string;
        name: string;
    };
}

interface Product {
    id: string;
    sku: string;
    barcode?: string;
    name: string;
    name_ar?: string;
    type: 'storable' | 'consumable' | 'service';
    standard_cost: string;
    moving_average_cost: string;
    list_price: string;
    tax_rate: string;
    is_active: boolean;
    category?: Category;
    unit: Unit;
    inventory_levels?: InventoryLevel[];
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    products: PaginatedData<Product>;
    categories: Category[];
    filters: {
        search?: string;
        category_id?: string;
        type?: string;
    };
}

export default function ProductsIndex({ products, categories, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category_id || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory/products', {
            search,
            category_id: selectedCategory || undefined,
            type: selectedType || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`${t('common.confirm')}: ${t('common.delete')} [${name}]?`)) {
            router.delete(`/inventory/products/${id}`);
        }
    };

    const totalProducts = products.total;
    const storableCount = products.data.filter(p => p.type === 'storable').length;
    const totalInventoryValue = products.data.reduce((acc, p) => {
        const productVal = p.inventory_levels?.reduce((sum, lvl) => sum + parseFloat(lvl.total_value || '0'), 0) || 0;
        return acc + productVal;
    }, 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('inventory.productsTitle')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('inventory.productsTitle')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('inventory.productsSubtitle')}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/inventory/products/create">
                        <Plus className="h-4 w-4" />
                        <span>{t('inventory.newProduct')}</span>
                    </Link>
                </Button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                            <Boxes className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-neutral-500">{t('inventory.productsTitle')}</p>
                            <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">{totalProducts}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-neutral-500">{t('inventory.storable')}</p>
                            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{storableCount}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                            <Tag className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-neutral-500">{t('inventory.totalValue')}</p>
                            <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                                {totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder={t('customers.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        aria-label={t('inventory.category')}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">{t('inventory.category')}: {t('common.view')}</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {isRtl && c.name_ar ? c.name_ar : c.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        aria-label={t('inventory.type')}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">{t('inventory.type')}: {t('common.view')}</option>
                        <option value="storable">{t('inventory.storable')}</option>
                        <option value="consumable">{t('inventory.consumable')}</option>
                        <option value="service">{t('inventory.service')}</option>
                    </select>
                    <Button type="submit" variant="secondary">
                        {t('common.view')}
                    </Button>
                </form>
            </div>

            {/* Products Table */}
            <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50/80 dark:bg-neutral-800/50 text-xs uppercase font-medium text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3.5 text-start">{t('inventory.sku')}</th>
                                <th className="px-6 py-3.5 text-start">{t('inventory.productName')}</th>
                                <th className="px-6 py-3.5 text-start">{t('inventory.category')}</th>
                                <th className="px-6 py-3.5 text-start">{t('inventory.unit')}</th>
                                <th className="px-6 py-3.5 text-end">{t('inventory.movingAvgCost')}</th>
                                <th className="px-6 py-3.5 text-end">{t('inventory.listPrice')}</th>
                                <th className="px-6 py-3.5 text-end">{t('inventory.onHand')}</th>
                                <th className="px-6 py-3.5 text-center">{t('inventory.type')}</th>
                                <th className="px-6 py-3.5 text-end">{t('customers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {products.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                                        <Boxes className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        <p>No products found.</p>
                                    </td>
                                </tr>
                            ) : (
                                products.data.map((p) => {
                                    const totalOnHand = p.inventory_levels?.reduce((sum, lvl) => sum + parseFloat(lvl.quantity_on_hand || '0'), 0) || 0;
                                    return (
                                        <tr key={p.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                            <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {p.sku}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                    {isRtl && p.name_ar ? p.name_ar : p.name}
                                                </div>
                                                {p.barcode && (
                                                    <span className="text-xs text-neutral-400 font-mono">
                                                        {p.barcode}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                                {p.category ? (isRtl && p.category.name_ar ? p.category.name_ar : p.category.name) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                                    {p.unit?.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                                {Number(p.moving_average_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SAR
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                                {Number(p.list_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                {totalOnHand.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {p.unit?.code}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                    p.type === 'storable' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' : 'bg-neutral-100 text-neutral-700'
                                                }`}>
                                                    {t(`inventory.${p.type}`, p.type)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-end">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <Link href={`/inventory/products/${p.id}/edit`}>
                                                            <Edit2 className="h-4 w-4 text-neutral-500 hover:text-neutral-900" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700"
                                                        onClick={() => handleDelete(p.id, p.name)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
