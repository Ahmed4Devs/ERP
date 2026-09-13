import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Barcode, Eye, AlertTriangle, CheckCircle2, Clock, XCircle, Boxes, Warehouse as WarehouseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
    shelf_life_days?: number;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Batch {
    id: string;
    batch_number: string;
    supplier_batch_number?: string;
    manufacture_date?: string;
    expiry_date?: string;
    received_qty: string;
    current_qty: string;
    unit_cost: string;
    status: 'active' | 'expired' | 'depleted' | 'quarantined';
    product: Product;
    warehouse: Warehouse;
    serials_count?: number;
    days_until_expiry?: number;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    batches: PaginatedData<Batch>;
    metrics: {
        total_batches: number;
        active_batches: number;
        expiring_30_days: number;
        expired_batches: number;
        total_units_in_batches: number;
    };
    warehouses: Warehouse[];
    products: Product[];
    filters: {
        search?: string;
        warehouse_id?: string;
        product_id?: string;
        status?: string;
        expiring_soon?: boolean;
        expired?: boolean;
    };
}

export default function BatchesIndex({ batches, metrics, warehouses, products, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');
    const [selectedProduct, setSelectedProduct] = useState(filters.product_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [expiringSoon, setExpiringSoon] = useState(filters.expiring_soon || false);
    const [expired, setExpired] = useState(filters.expired || false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory/batches', {
            search: search || undefined,
            warehouse_id: selectedWarehouse || undefined,
            product_id: selectedProduct || undefined,
            status: selectedStatus || undefined,
            expiring_soon: expiringSoon ? true : undefined,
            expired: expired ? true : undefined,
        }, { preserveState: true, replace: true });
    };

    const getExpiryBadge = (expiryDate?: string) => {
        if (!expiryDate) {
            return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{t('batches.noExpiry', 'لا ينتهي')}</span>;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(expiryDate);
        exp.setHours(0, 0, 0, 0);

        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2.5 py-1 rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    {t('batches.expired', 'منتهي الصلاحية')} ({Math.abs(diffDays)} {t('common.daysAgo', 'يوم مضت')})
                </span>
            );
        }

        if (diffDays <= 30) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 px-2.5 py-1 rounded-full animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t('batches.expiringSoon', 'ينتهي قريباً')} ({diffDays} {t('common.daysLeft', 'يوم متبقي')})
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {expiryDate} ({diffDays} {t('common.days', 'يوم')})
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{t('batches.statusActive', 'نشط')}</span>;
            case 'depleted':
                return <span className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{t('batches.statusDepleted', 'منتهي الرصيد')}</span>;
            case 'quarantined':
                return <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{t('batches.statusQuarantined', 'حجر صحي/فحص')}</span>;
            default:
                return <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{status}</span>;
        }
    };

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('batches.title', 'تتبع الدفعات وتواريخ الصلاحية (FEFO)')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Barcode className="w-7 h-7 text-primary" />
                        {t('batches.title', 'إدارة الدفعات وتواريخ الصلاحية (FEFO)')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('batches.subtitle', 'نظام الوارد أولاً ينتهي أولاً، ضبط تواريخ انتهاء الصلاحية وتتبع المخزون لكل دفعة')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/inventory/batches/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            {t('batches.newBatch', 'تسجيل دفعة جديدة')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('batches.totalBatches', 'إجمالي الدفعات')}</div>
                    <div className="text-2xl font-bold mt-1">{metrics.total_batches}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('batches.activeBatches', 'دفعات نشطة بالرصيد')}</div>
                    <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{metrics.active_batches}</div>
                </div>
                <div className="bg-card border border-amber-300 dark:border-amber-800 rounded-xl p-4 shadow-sm bg-amber-50/50 dark:bg-amber-950/20">
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {t('batches.expiringIn30', 'تنتهي خلال 30 يوم')}
                    </div>
                    <div className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">{metrics.expiring_30_days}</div>
                </div>
                <div className="bg-card border border-red-300 dark:border-red-900 rounded-xl p-4 shadow-sm bg-red-50/50 dark:bg-red-950/20">
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        {t('batches.expiredWithStock', 'منتهية وبها رصيد')}
                    </div>
                    <div className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{metrics.expired_batches}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('batches.totalUnits', 'إجمالي الكمية بالدفعات')}</div>
                    <div className="text-2xl font-bold mt-1">{metrics.total_units_in_batches.toLocaleString()}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearch} className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute top-3 start-3 text-muted-foreground" />
                        <Input
                            placeholder={t('batches.searchPlaceholder', 'رقم الدفعة أو اسم المنتج...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <div>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">{t('batches.allProducts', 'جميع المنتجات')}</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.sku} - {p.name_ar || p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={selectedWarehouse}
                            onChange={(e) => setSelectedWarehouse(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">{t('batches.allWarehouses', 'جميع المستودعات')}</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name} ({w.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">{t('batches.allStatuses', 'جميع الحالات')}</option>
                            <option value="active">{t('batches.statusActive', 'نشط')}</option>
                            <option value="depleted">{t('batches.statusDepleted', 'منتهي الرصيد')}</option>
                            <option value="quarantined">{t('batches.statusQuarantined', 'حجر فحص')}</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="submit" className="w-full">
                            {t('common.filter', 'تصفية')}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={expiringSoon}
                            onChange={(e) => setExpiringSoon(e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                        />
                        <span className="text-amber-700 dark:text-amber-400 font-medium">
                            {t('batches.onlyExpiringSoon', 'عرض الدفعات التي تنتهي قريباً (30 يوم)')}
                        </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={expired}
                            onChange={(e) => setExpired(e.target.checked)}
                            className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                        />
                        <span className="text-red-700 dark:text-red-400 font-medium">
                            {t('batches.onlyExpired', 'عرض الدفعات المنتهية فقط')}
                        </span>
                    </label>
                </div>
            </form>

            {/* Table */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3 text-start">{t('batches.batchNumber', 'رقم الدفعة')}</th>
                                <th className="px-4 py-3 text-start">{t('batches.product', 'المنتج')}</th>
                                <th className="px-4 py-3 text-start">{t('batches.warehouse', 'المستودع')}</th>
                                <th className="px-4 py-3 text-end">{t('batches.currentQty', 'الرصيد المتوفر')}</th>
                                <th className="px-4 py-3 text-start">{t('batches.expiryDate', 'تاريخ الانتهاء')}</th>
                                <th className="px-4 py-3 text-center">{t('batches.serials', 'أرقام تسلسلية')}</th>
                                <th className="px-4 py-3 text-center">{t('common.status', 'الحالة')}</th>
                                <th className="px-4 py-3 text-center">{t('common.actions', 'إجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {batches.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                        {t('batches.noBatchesFound', 'لم يتم العثور على أي دفعات مطابقة')}
                                    </td>
                                </tr>
                            ) : (
                                batches.data.map((batch) => (
                                    <tr key={batch.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-primary font-mono">{batch.batch_number}</div>
                                            {batch.supplier_batch_number && (
                                                <div className="text-xs text-muted-foreground">
                                                    {t('batches.supplierRef', 'المورد')}: {batch.supplier_batch_number}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{batch.product.name_ar || batch.product.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{batch.product.sku}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <WarehouseIcon className="w-4 h-4" />
                                                <span>{batch.warehouse.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-end">
                                            <div className="font-bold text-base">{parseFloat(batch.current_qty).toLocaleString()}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {t('batches.received', 'الوارد')}: {parseFloat(batch.received_qty).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getExpiryBadge(batch.expiry_date)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {batch.serials_count && batch.serials_count > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-semibold">
                                                    {batch.serials_count}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(batch.status)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Link href={`/inventory/batches/${batch.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 gap-1">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {t('common.view', 'عرض')}
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {batches.last_page > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {t('common.showing', 'عرض')} {(batches.current_page - 1) * batches.per_page + 1} -{' '}
                            {Math.min(batches.current_page * batches.per_page, batches.total)} {t('common.of', 'من')} {batches.total}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={batches.current_page === 1}
                                onClick={() => router.get(`/inventory/batches?page=${batches.current_page - 1}`, {}, { preserveState: true })}
                            >
                                {t('common.previous', 'السابق')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={batches.current_page === batches.last_page}
                                onClick={() => router.get(`/inventory/batches?page=${batches.current_page + 1}`, {}, { preserveState: true })}
                            >
                                {t('common.next', 'التالي')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
