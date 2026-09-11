import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Factory, Plus, Search, Eye, Layers, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
}

interface BillOfMaterial {
    id: string;
    bom_code: string;
    product: Product;
    yield_quantity: string;
    version: string;
    is_active: boolean;
    items?: any[];
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
    boms: PaginatedData<BillOfMaterial>;
    filters: {
        search?: string;
    };
}

export default function BomIndex({ boms, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/manufacturing/boms', { search }, { preserveState: true, replace: true });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'قوائم المواد والتصنيع' : 'Bills of Materials (BOM)'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Factory className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'قوائم المواد وهياكل التصنيع (BOM)' : 'Bills of Materials (BOM)'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'تعريف مكونات المنتجات المجمعة، نسب الهدر، ومعدلات إنتاج التجميع الخفيف'
                            : 'Define multi-level product assemblies, component ratios, scrap factors, and yields'}
                    </p>
                </div>
                <div>
                    <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/manufacturing/boms/create">
                            <Plus className="h-4 w-4" />
                            <span>{isRtl ? 'إنشاء قائمة مواد جديدة' : 'Create BOM'}</span>
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
                            placeholder={isRtl ? 'بحث برمز القائمة أو اسم المنتج النهائي...' : 'Search by BOM code or finished product...'}
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

            {/* BOM Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'رمز القائمة' : 'BOM Code'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'المنتج النهائي المجمع' : 'Finished Product'}</th>
                                <th className="px-6 py-3.5 text-center font-mono">{isRtl ? 'كمية الإنتاج' : 'Yield Qty'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'الإصدار' : 'Version'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'عدد المكونات' : 'Components'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3.5 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {boms.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                                        <Layers className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        {isRtl ? 'لا توجد قوائم مواد معرفة' : 'No Bills of Materials found'}
                                    </td>
                                </tr>
                            ) : (
                                boms.data.map((bom) => (
                                    <tr key={bom.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {bom.bom_code}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {isRtl && bom.product?.name_ar ? bom.product.name_ar : bom.product?.name}
                                            </div>
                                            <div className="text-xs font-mono text-neutral-500">
                                                {bom.product?.sku}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono font-medium">
                                            {Number(bom.yield_quantity)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                                {bom.version}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-neutral-700 dark:text-neutral-300">
                                            {bom.items?.length || 0}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                bom.is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-neutral-100 text-neutral-600'
                                            }`}>
                                                {bom.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 hover:text-neutral-900">
                                                <Link href={`/manufacturing/boms/${bom.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span>{isRtl ? 'عرض الهيكل' : 'View Structure'}</span>
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
