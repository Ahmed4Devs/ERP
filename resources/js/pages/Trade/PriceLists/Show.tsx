import { Head, Link } from '@inertiajs/react';
import { Percent, ArrowLeft, Tag, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface PriceListItem {
    id: string;
    product: {
        name: string;
        name_ar?: string;
        sku: string;
        list_price: string;
        unit?: { code: string };
    };
    min_quantity: string;
    price: string;
    discount_percentage: string;
}

interface PriceList {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    currency: string;
    is_default: boolean;
    is_active: boolean;
    items: PriceListItem[];
}

interface Props {
    priceList: PriceList;
}

export default function PriceListShow({ priceList }: Props) {
    const { t, isRtl } = useTranslation();

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={`Price List - ${priceList.code}`} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                        <Link href="/trade/pricelists">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                                {priceList.code}
                            </h1>
                            {priceList.is_default && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {isRtl ? 'قائمة افتراضية' : 'Default'}
                                </span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                priceList.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                                {priceList.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                            </span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {isRtl && priceList.name_ar ? priceList.name_ar : priceList.name} &bull; Currency: {priceList.currency}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tiers Table Card */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2 border-b pb-3 mb-4">
                    <Tag className="h-5 w-5 text-indigo-600" />
                    {isRtl ? 'جدول الشرائح والأسعار المعرفة' : 'Configured Pricing Tiers'}
                    <span className="text-xs font-normal text-neutral-500">({priceList.items.length} tiers)</span>
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="pb-3 text-start">{isRtl ? 'المنتج' : 'Product'}</th>
                                <th className="pb-3 text-start">{isRtl ? 'الرمز (SKU)' : 'SKU'}</th>
                                <th className="pb-3 text-center font-mono">{isRtl ? 'الحد الأدنى للكمية' : 'Min Order Qty'}</th>
                                <th className="pb-3 text-end font-mono">{isRtl ? 'السعر الأساسي للشريحة' : 'Tier Base Price'}</th>
                                <th className="pb-3 text-center font-mono">{isRtl ? 'نسبة الخصم' : 'Discount %'}</th>
                                <th className="pb-3 text-end font-mono">{isRtl ? 'السعر النهائي الفعلي' : 'Effective Net Price'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {priceList.items.map((item) => {
                                const base = parseFloat(item.price || '0');
                                const disc = parseFloat(item.discount_percentage || '0');
                                const effective = base * (1 - disc / 100);

                                return (
                                    <tr key={item.id}>
                                        <td className="py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                            {isRtl && item.product.name_ar ? item.product.name_ar : item.product.name}
                                        </td>
                                        <td className="py-3 font-mono text-xs text-neutral-500">
                                            {item.product.sku}
                                        </td>
                                        <td className="py-3 text-center font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(item.min_quantity)} {item.product.unit?.code || ''}
                                        </td>
                                        <td className="py-3 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                            {base.toFixed(2)} {priceList.currency}
                                        </td>
                                        <td className="py-3 text-center font-mono text-amber-600 font-semibold">
                                            {disc > 0 ? `${disc.toFixed(1)}%` : '-'}
                                        </td>
                                        <td className="py-3 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {effective.toFixed(2)} {priceList.currency}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
