import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Layers, TrendingDown, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface AssetCategory {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface FixedAsset {
    id: string;
    asset_tag: string;
    name: string;
    name_ar?: string;
    serial_number?: string;
    purchase_date: string;
    in_service_date: string;
    acquisition_cost: string;
    salvage_value: string;
    useful_life_months: number;
    accumulated_depreciation: string;
    net_book_value: string;
    status: 'active' | 'fully_depreciated' | 'disposed';
    category?: AssetCategory;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    assets: PaginatedData<FixedAsset>;
    categories: AssetCategory[];
    filters: {
        search?: string;
        category_id?: string;
        status?: string;
    };
}

export default function FixedAssetsIndex({ assets, categories, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/assets/register', {
            search: search || undefined,
            category_id: categoryId || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    const totalCost = assets.data.reduce((acc, a) => acc + parseFloat(a.acquisition_cost || '0'), 0);
    const totalAccum = assets.data.reduce((acc, a) => acc + parseFloat(a.accumulated_depreciation || '0'), 0);
    const totalNBV = assets.data.reduce((acc, a) => acc + parseFloat(a.net_book_value || '0'), 0);

    const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('assets.title', 'Fixed Assets Register')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('assets.title', 'Fixed Assets Register')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('assets.subtitle', 'Capitalized equipment, vehicles, and real-time net book value tracking')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/assets/depreciation">
                            <TrendingDown className="h-4 w-4" />
                            <span>{t('assets.depreciationRuns', 'Depreciation Runs')}</span>
                        </Link>
                    </Button>
                    <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/assets/register/create">
                            <Plus className="h-4 w-4" />
                            <span>{t('assets.newAsset', 'Register Asset')}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-500">{t('assets.cost', 'Total Historical Cost')}</span>
                    <p className="mt-1 text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-500">{t('assets.accumulated', 'Accumulated Depreciation')}</span>
                    <p className="mt-1 text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                        -{totalAccum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/30">
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{t('assets.bookValue', 'Total Net Book Value')}</span>
                    <p className="mt-1 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {totalNBV.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Table & Filters */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 rtl:left-auto rtl:right-3" />
                        <Input
                            placeholder="Search tag, asset name, serial number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 rtl:pl-3 rtl:pr-9"
                        />
                    </div>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>
                                {isRtl && c.name_ar ? c.name_ar : c.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="fully_depreciated">Fully Depreciated</option>
                        <option value="disposed">Disposed</option>
                    </select>
                    <Button type="submit" variant="secondary" size="sm">
                        Filter
                    </Button>
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm rtl:text-right">
                        <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                            <tr>
                                <th className="px-4 py-3">{t('assets.tag', 'Asset Tag')}</th>
                                <th className="px-4 py-3">{t('assets.name', 'Asset Name')}</th>
                                <th className="px-4 py-3">{t('assets.category', 'Category')}</th>
                                <th className="px-4 py-3">In-Service Date</th>
                                <th className="px-4 py-3 text-right rtl:text-left">{t('assets.cost', 'Cost')}</th>
                                <th className="px-4 py-3 text-right rtl:text-left">{t('assets.accumulated', 'Accum. Depr')}</th>
                                <th className="px-4 py-3 text-right rtl:text-left font-bold">{t('assets.bookValue', 'Net Book Value')}</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right rtl:text-left">{t('customers.actions', 'Action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {assets.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-neutral-500">
                                        No fixed assets found.
                                    </td>
                                </tr>
                            ) : (
                                assets.data.map((asset) => (
                                    <tr key={asset.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="px-4 py-3 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                            {asset.asset_tag}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                            {isRtl && asset.name_ar ? asset.name_ar : asset.name}
                                            {asset.serial_number && (
                                                <div className="text-xs font-mono text-neutral-400">S/N: {asset.serial_number}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                            {asset.category ? (isRtl && asset.category.name_ar ? asset.category.name_ar : asset.category.name) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {asset.in_service_date?.substring(0, 10)}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono">
                                            {parseFloat(asset.acquisition_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono text-rose-600">
                                            -{parseFloat(asset.accumulated_depreciation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                            {parseFloat(asset.net_book_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                asset.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                                                asset.status === 'fully_depreciated' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                                                'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                                            }`}>
                                                {asset.status === 'fully_depreciated' ? 'Fully Depr' : asset.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left">
                                            <Button asChild size="sm" variant="ghost" className="gap-1">
                                                <Link href={`/assets/register/${asset.id}`}>
                                                    <span>Details</span>
                                                    <ArrowIcon className="h-3.5 w-3.5" />
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
