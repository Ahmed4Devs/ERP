import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Percent, Plus, Search, Eye, Tag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface PriceList {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    currency: string;
    is_default: boolean;
    is_active: boolean;
    items_count: number;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    priceLists: PaginatedData<PriceList>;
    filters: {
        search?: string;
    };
}

export default function PriceListsIndex({ priceLists, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/trade/pricelists', { search }, { preserveState: true, replace: true });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'قوائم الأسعار وشرائح الجملة' : 'Price Lists & Tiers'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Percent className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'قوائم أسعار الجملة والشرائح الكمية' : 'Price Lists & Wholesale Tiers'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدارة أسعار الجملة المتدرجة، خصومات الكمية، وربط الشرائح التلقائية بنقاط البيع والفواتير'
                            : 'Configure tiered wholesale pricing, volume quantity discounts, and automated tier resolution'}
                    </p>
                </div>
                <div>
                    <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/trade/pricelists/create">
                            <Plus className="h-4 w-4" />
                            <span>{isRtl ? 'إنشاء قائمة أسعار جديدة' : 'New Price List'}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder={isRtl ? 'بحث باسم القائمة أو الرمز...' : 'Search by price list name or code...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <Button type="submit" variant="secondary">
                        {isRtl ? 'بحث' : 'Search'}
                    </Button>
                </form>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'رمز القائمة' : 'Code'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'اسم قائمة الأسعار' : 'Price List Name'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'العملة' : 'Currency'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'عدد الشرائح' : 'Tiers Count'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'الافتراضية' : 'Default'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3.5 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {priceLists.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                                        <Tag className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        {isRtl ? 'لا توجد قوائم أسعار معرفة' : 'No price lists found'}
                                    </td>
                                </tr>
                            ) : (
                                priceLists.data.map((list) => (
                                    <tr key={list.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {list.code}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {isRtl && list.name_ar ? list.name_ar : list.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono font-medium">
                                            {list.currency}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-indigo-600 font-bold">
                                            {list.items_count} tiers
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {list.is_default ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    {isRtl ? 'نعم (افتراضية)' : 'Yes (Default)'}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-neutral-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                list.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-600'
                                            }`}>
                                                {list.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 hover:text-neutral-900">
                                                <Link href={`/trade/pricelists/${list.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span>{isRtl ? 'عرض الشرائح' : 'View Tiers'}</span>
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
