import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Sparkles,
    Plus,
    Search,
    Tag,
    CheckCircle2,
    XCircle,
    Calendar,
    ArrowRightLeft,
    Percent,
    Gift,
    DollarSign,
    Trash2,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
}

interface Promotion {
    id: string;
    code?: string;
    name: string;
    name_ar?: string;
    type: 'bogo' | 'percentage' | 'fixed_amount';
    buy_product?: Product;
    buy_quantity: string;
    get_product?: Product;
    get_quantity: string;
    get_discount_percentage: string;
    min_order_amount: string;
    discount_rate: string;
    fixed_discount_amount: string;
    start_date?: string;
    end_date?: string;
    apply_automatically: boolean;
    is_active: boolean;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    promotions: PaginatedData<Promotion>;
    filters: {
        search?: string;
        type?: string;
        status?: string;
    };
}

export default function PromotionsIndex({ promotions, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/trade/promotions', {
            search: search || undefined,
            type: selectedType || undefined,
            status: selectedStatus || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleToggleStatus = (promoId: string) => {
        router.post(`/trade/promotions/${promoId}/toggle`, {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (promoId: string, name: string) => {
        if (confirm(`هل أنت متأكد من حذف العرض الترويجي (${name})؟`)) {
            router.delete(`/trade/promotions/${promoId}`);
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'bogo':
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2.5 py-1 rounded-full border border-purple-300 dark:border-purple-800">
                        <Gift className="w-3.5 h-3.5 text-purple-600" />
                        اشترِ واحصل (BOGO)
                    </span>
                );
            case 'percentage':
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-300 dark:border-blue-800">
                        <Percent className="w-3.5 h-3.5 text-blue-600" />
                        خصم مئوي %
                    </span>
                );
            case 'fixed_amount':
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        خصم نقدي مباشر
                    </span>
                );
            default:
                return <span className="text-xs bg-muted px-2 py-0.5 rounded">{type}</span>;
        }
    };

    const getOfferSummary = (promo: Promotion) => {
        if (promo.type === 'bogo') {
            const buyName = promo.buy_product?.name_ar || promo.buy_product?.name || 'صنف محدد';
            const getName = promo.get_product?.name_ar || promo.get_product?.name || buyName;
            const discount = parseFloat(promo.get_discount_percentage);
            const rewardLabel = discount >= 100 ? 'مجاناً' : `بخصم ${discount}%`;

            return (
                <div className="text-xs font-medium space-y-0.5">
                    <div className="text-foreground">
                        اشترِ <span className="font-bold text-primary">{parseFloat(promo.buy_quantity)}</span> من ({buyName})
                    </div>
                    <div className="text-muted-foreground">
                        واحصل على <span className="font-bold text-purple-600 dark:text-purple-400">{parseFloat(promo.get_quantity)}</span> من ({getName}) <span className="font-bold text-emerald-600">{rewardLabel}</span>
                    </div>
                </div>
            );
        }

        if (promo.type === 'percentage') {
            return (
                <div className="text-xs font-medium">
                    خصم <span className="font-bold text-blue-600 text-sm">{parseFloat(promo.discount_rate)}%</span> على إجمالي السلة
                    {parseFloat(promo.min_order_amount) > 0 && (
                        <span className="text-muted-foreground block">
                            (للطلبات فوق {parseFloat(promo.min_order_amount).toLocaleString()} ريال)
                        </span>
                    )}
                </div>
            );
        }

        if (promo.type === 'fixed_amount') {
            return (
                <div className="text-xs font-medium">
                    خصم <span className="font-bold text-emerald-600 text-sm">{parseFloat(promo.fixed_discount_amount).toLocaleString()} ريال</span> نقداً
                    {parseFloat(promo.min_order_amount) > 0 && (
                        <span className="text-muted-foreground block">
                            (للطلبات فوق {parseFloat(promo.min_order_amount).toLocaleString()} ريال)
                        </span>
                    )}
                </div>
            );
        }

        return '-';
    };

    // Quick stats
    const totalPromos = promotions.total;
    const activePromos = promotions.data.filter((p) => p.is_active).length;
    const bogoCount = promotions.data.filter((p) => p.type === 'bogo').length;

    return (
        <div className="flex flex-col gap-6 p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title="العروض والخصومات الترويجية | Promotions & Campaigns" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Sparkles className="h-7 w-7 text-primary" />
                        العروض والخصومات الترويجية (Promotions Engine)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        إدارة عروض BOGO (اشترِ واحصل مجاناً)، خصومات السلة، أكواد الكوبونات، وتطبيقها الفوري بنقاط البيع والفواتير.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/trade/promotions/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            إنشاء عرض ترويجي جديد
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">إجمالي العروض المسجلة</div>
                    <div className="text-2xl font-bold mt-1">{totalPromos}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">عروض سارية ونشطة</div>
                    <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{activePromos}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">عروض BOGO (اشترِ واحصل)</div>
                    <div className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">{bogoCount}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">التطبيق التلقائي بالكاشير</div>
                    <div className="text-2xl font-bold mt-1 text-primary">مفعل ⚡</div>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleFilter} className="bg-card border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute top-3 start-3 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث باسم العرض، الكود، أو الصنف..."
                        className="ps-9"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <select
                        value={selectedType}
                        onChange={(e) => {
                            setSelectedType(e.target.value);
                        }}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">جميع أنواع العروض</option>
                        <option value="bogo">BOGO (اشترِ واحصل)</option>
                        <option value="percentage">خصم مئوي %</option>
                        <option value="fixed_amount">خصم نقدي مباشر</option>
                    </select>
                </div>
                <div className="w-full sm:w-40">
                    <select
                        value={selectedStatus}
                        onChange={(e) => {
                            setSelectedStatus(e.target.value);
                        }}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">جميع الحالات</option>
                        <option value="active">ساري / نشط</option>
                        <option value="inactive">معطل</option>
                    </select>
                </div>
                <Button type="submit" variant="secondary" size="sm" className="w-full sm:w-auto">
                    تصفية
                </Button>
            </form>

            {/* Promotions Table */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                            <tr>
                                <th className="px-4 py-3 text-start">اسم العرض / الكود</th>
                                <th className="px-4 py-3 text-start">نوع العرض</th>
                                <th className="px-4 py-3 text-start">قاعدة العرض والمكافأة</th>
                                <th className="px-4 py-3 text-start">فترة الصلاحية</th>
                                <th className="px-4 py-3 text-center">التطبيق التلقائي</th>
                                <th className="px-4 py-3 text-center">الحالة</th>
                                <th className="px-4 py-3 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {promotions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Tag className="w-8 h-8 text-muted-foreground/60" />
                                            <p className="text-base font-medium">لا توجد عروض ترويجية مسجلة حالياً</p>
                                            <p className="text-xs">ابدأ بإنشاء أول عرض ترويجي أو خصم كمية لتنشيط المبيعات</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                promotions.data.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-muted/40 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            <div className="text-foreground font-semibold">
                                                {promo.name_ar || promo.name}
                                            </div>
                                            {promo.code && (
                                                <span className="inline-block mt-0.5 text-[11px] font-mono font-bold bg-muted px-2 py-0.5 rounded text-primary border">
                                                    كود: {promo.code}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getTypeBadge(promo.type)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getOfferSummary(promo)}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                            {promo.start_date || promo.end_date ? (
                                                <div className="space-y-0.5">
                                                    <div>من: {promo.start_date || 'غير محدد'}</div>
                                                    <div>إلى: {promo.end_date || 'غير محدد'}</div>
                                                </div>
                                            ) : (
                                                <span className="text-emerald-600 font-medium">دائم ومستمر</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {promo.apply_automatically ? (
                                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                    تلقائي بالسلة ⚡
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                    يتطلب إدخال الكود
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(promo.id)}
                                                className="inline-flex items-center gap-1 text-xs font-medium cursor-pointer"
                                                title="انقر للتبديل"
                                            >
                                                {promo.is_active ? (
                                                    <span className="text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                                                        نشط
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                                                        معطل
                                                    </span>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(promo.id, promo.name_ar || promo.name)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {promotions.last_page > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            عرض {promotions.data.length} من أصل {promotions.total} عرض
                        </span>
                        <div className="flex items-center gap-1">
                            {promotions.links.map((link, idx) => (
                                <Button
                                    key={idx}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
