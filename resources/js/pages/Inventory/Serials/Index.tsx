import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, ShieldCheck, Eye, CheckCircle2, XCircle, Clock, Barcode, Warehouse as WarehouseIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Batch {
    id: string;
    batch_number: string;
    expiry_date?: string;
}

interface Customer {
    id: string;
    name: string;
}

interface Serial {
    id: string;
    serial_number: string;
    status: 'in_stock' | 'reserved' | 'sold' | 'returned' | 'scrapped';
    unit_cost: string;
    warranty_start_date?: string;
    warranty_end_date?: string;
    product: Product;
    warehouse?: Warehouse;
    batch?: Batch;
    customer?: Customer;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    serials: PaginatedData<Serial>;
    metrics: {
        total_serials: number;
        in_stock: number;
        sold: number;
        active_warranty: number;
    };
    warehouses: Warehouse[];
    products: Product[];
    filters: {
        search?: string;
        product_id?: string;
        warehouse_id?: string;
        status?: string;
        warranty_status?: string;
    };
}

export default function SerialsIndex({ serials, metrics, warehouses, products, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedProduct, setSelectedProduct] = useState(filters.product_id || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [warrantyFilter, setWarrantyFilter] = useState(filters.warranty_status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/inventory/serials', {
            search: search || undefined,
            product_id: selectedProduct || undefined,
            warehouse_id: selectedWarehouse || undefined,
            status: selectedStatus || undefined,
            warranty_status: warrantyFilter || undefined,
        }, { preserveState: true, replace: true });
    };

    const getWarrantyBadge = (endDate?: string) => {
        if (!endDate) {
            return <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{t('serials.noWarranty', 'بدون ضمان')}</span>;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(endDate);
        exp.setHours(0, 0, 0, 0);

        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    {t('serials.warrantyExpired', 'ضمان منتهي')}
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('serials.underWarranty', 'ساري الضمان')} ({diffDays} {t('common.days', 'يوم')})
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'in_stock':
                return <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{t('serials.inStock', 'بالمستودع')}</span>;
            case 'sold':
                return <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{t('serials.sold', 'مباع للعميل')}</span>;
            case 'reserved':
                return <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{t('serials.reserved', 'محجوز')}</span>;
            case 'returned':
                return <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{t('serials.returned', 'مرتجع')}</span>;
            case 'scrapped':
                return <span className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-medium">{t('serials.scrapped', 'تالف / خردة')}</span>;
            default:
                return <span className="bg-muted text-foreground text-xs px-2.5 py-0.5 rounded-full font-medium">{status}</span>;
        }
    };

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('serials.title', 'الأرقام التسلسلية وتتبع الضمان')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-primary" />
                        {t('serials.title', 'الأرقام التسلسلية وتتبع الضمان')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('serials.subtitle', 'تسجيل وتتبع الأرقام التسلسلية الفردية للمعدات والأجهزة وإدارة فترات الضمان')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/inventory/serials/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            {t('serials.newSerial', 'تسجيل أرقام تسلسلية')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('serials.totalSerials', 'إجمالي الأرقام المسجلة')}</div>
                    <div className="text-2xl font-bold mt-1">{metrics.total_serials}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('serials.inStockCount', 'متوفر بالمخزون')}</div>
                    <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{metrics.in_stock}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('serials.soldCount', 'مباع للعملاء')}</div>
                    <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{metrics.sold}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-primary font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {t('serials.activeWarranty', 'ساري الضمان حالياً')}
                    </div>
                    <div className="text-2xl font-bold mt-1 text-primary">{metrics.active_warranty}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearch} className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute top-3 start-3 text-muted-foreground" />
                        <Input
                            placeholder={t('serials.searchPlaceholder', 'الرقم التسلسلي، المنتج، العميل...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9 font-mono"
                        />
                    </div>
                    <div>
                        <select
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">{t('serials.allProducts', 'جميع المنتجات')}</option>
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
                            <option value="">{t('serials.allWarehouses', 'جميع المستودعات')}</option>
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
                            <option value="">{t('serials.allStatuses', 'جميع الحالات')}</option>
                            <option value="in_stock">{t('serials.inStock', 'بالمستودع')}</option>
                            <option value="sold">{t('serials.sold', 'مباع للعميل')}</option>
                            <option value="reserved">{t('serials.reserved', 'محجوز')}</option>
                            <option value="returned">{t('serials.returned', 'مرتجع')}</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={warrantyFilter}
                            onChange={(e) => setWarrantyFilter(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">{t('serials.allWarranty', 'حالة الضمان (الكل)')}</option>
                            <option value="active">{t('serials.warrantyActive', 'ضمان ساري')}</option>
                            <option value="expired">{t('serials.warrantyExpired', 'ضمان منتهي')}</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end pt-2 border-t">
                    <Button type="submit" className="gap-2">
                        <Search className="w-4 h-4" />
                        {t('common.filter', 'تصفية وبحث')}
                    </Button>
                </div>
            </form>

            {/* Table */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3 text-start">{t('serials.serialNumber', 'الرقم التسلسلي (S/N)')}</th>
                                <th className="px-4 py-3 text-start">{t('serials.product', 'المنتج')}</th>
                                <th className="px-4 py-3 text-start">{t('serials.location', 'الموقع / العميل')}</th>
                                <th className="px-4 py-3 text-start">{t('serials.batch', 'الدفعة')}</th>
                                <th className="px-4 py-3 text-start">{t('serials.warranty', 'الضمان')}</th>
                                <th className="px-4 py-3 text-center">{t('common.status', 'الحالة')}</th>
                                <th className="px-4 py-3 text-center">{t('common.actions', 'إجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {serials.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        {t('serials.noSerialsFound', 'لم يتم العثور على أي أرقام تسلسلية')}
                                    </td>
                                </tr>
                            ) : (
                                serials.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-primary">
                                            {item.serial_number}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{item.product.name_ar || item.product.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{item.product.sku}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.customer ? (
                                                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>{item.customer.name}</span>
                                                </div>
                                            ) : item.warehouse ? (
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <WarehouseIcon className="w-3.5 h-3.5" />
                                                    <span>{item.warehouse.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.batch ? (
                                                <Link href={`/inventory/batches/${item.batch.id}`} className="font-mono text-xs text-primary hover:underline">
                                                    {item.batch.batch_number}
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getWarrantyBadge(item.warranty_end_date)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Link href={`/inventory/serials/${item.id}`}>
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
                {serials.last_page > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {t('common.showing', 'عرض')} {(serials.current_page - 1) * serials.per_page + 1} -{' '}
                            {Math.min(serials.current_page * serials.per_page, serials.total)} {t('common.of', 'من')} {serials.total}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={serials.current_page === 1}
                                onClick={() => router.get(`/inventory/serials?page=${serials.current_page - 1}`, {}, { preserveState: true })}
                            >
                                {t('common.previous', 'السابق')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={serials.current_page === serials.last_page}
                                onClick={() => router.get(`/inventory/serials?page=${serials.current_page + 1}`, {}, { preserveState: true })}
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
