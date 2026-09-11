import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Percent, ArrowLeft, Plus, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    name: string;
    name_ar?: string;
    sku: string;
    list_price: string;
}

interface PriceTierInput {
    product_id: string;
    min_quantity: string;
    price: string;
    discount_percentage: string;
}

interface Props {
    products: Product[];
}

export default function PriceListCreate({ products }: Props) {
    const { t, isRtl } = useTranslation();

    const [form, setForm] = useState({
        code: '',
        name: '',
        name_ar: '',
        currency: 'SAR',
        is_default: false,
        items: [
            {
                product_id: products[0]?.id || '',
                min_quantity: '1.00',
                price: products[0]?.list_price || '100.00',
                discount_percentage: '0.00',
            },
        ] as PriceTierInput[],
    });

    const addTier = () => {
        setForm({
            ...form,
            items: [
                ...form.items,
                {
                    product_id: products[0]?.id || '',
                    min_quantity: '10.00',
                    price: products[0]?.list_price || '100.00',
                    discount_percentage: '5.00',
                },
            ],
        });
    };

    const removeTier = (index: number) => {
        setForm({
            ...form,
            items: form.items.filter((_, i) => i !== index),
        });
    };

    const updateTier = (index: number, field: keyof PriceTierInput, value: string) => {
        const updated = [...form.items];
        updated[index] = { ...updated[index], [field]: value };
        setForm({ ...form, items: updated });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/trade/pricelists', form);
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={isRtl ? 'إنشاء قائمة أسعار جديدة' : 'Create Price List'} />

            {/* Header */}
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                    <Link href="/trade/pricelists">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Percent className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'إنشاء قائمة أسعار وشرائح جملة جديدة' : 'Create New Price List & Tiers'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'حدد رمز القائمة وأسعار المنتجات مع الحد الأدنى للكميات ونسب الخصم المتدرجة'
                            : 'Define price tiers, minimum order quantities, and tiered discount percentages'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 border-b pb-3">
                        {isRtl ? 'البيانات الأساسية' : 'Header Information'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'رمز القائمة (Code)' : 'Price List Code'}
                            </label>
                            <Input
                                required
                                placeholder="e.g. PL-WHOLESALE-VIP"
                                value={form.code}
                                onChange={(e) => setForm({ ...form, code: e.target.value })}
                                className="mt-1 font-mono uppercase"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'الاسم بالإنجليزية' : 'Name (English)'}
                            </label>
                            <Input
                                required
                                placeholder="e.g. VIP Corporate Wholesale Tier"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'الاسم بالعربية' : 'Name (Arabic)'}
                            </label>
                            <Input
                                placeholder="مثال: قائمة أسعار الجملة للشركات"
                                value={form.name_ar}
                                onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                        <div className="flex items-center gap-2">
                            <input
                                id="is_default"
                                type="checkbox"
                                checked={form.is_default}
                                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                                className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="is_default" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {isRtl ? 'تعيين كقائمة أسعار افتراضية للمبيعات' : 'Set as Default Sales Price List'}
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tiers Card */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Tag className="h-5 w-5 text-indigo-600" />
                            {isRtl ? 'الشرائح والأسعار المتدرجة (Quantity Tiers)' : 'Pricing Tiers Table'}
                        </h3>
                        <Button type="button" onClick={addTier} size="sm" variant="outline" className="gap-1 text-xs">
                            <Plus className="h-3.5 w-3.5" />
                            <span>{isRtl ? 'إضافة شريحة' : 'Add Tier'}</span>
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {form.items.map((tier, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                                <div className="flex-1 w-full">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'المنتج المستهدف' : 'Product'}
                                    </label>
                                    <select
                                        className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs"
                                        value={tier.product_id}
                                        onChange={(e) => updateTier(idx, 'product_id', e.target.value)}
                                    >
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {isRtl && p.name_ar ? p.name_ar : p.name} ({p.sku}) &bull; Base: {Number(p.list_price).toFixed(2)} SAR
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="w-full sm:w-28">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'الحد الأدنى للكمية' : 'Min Quantity'}
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={tier.min_quantity}
                                        onChange={(e) => updateTier(idx, 'min_quantity', e.target.value)}
                                        className="mt-1 font-mono text-xs"
                                    />
                                </div>

                                <div className="w-full sm:w-32">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'سعر الوحدة (SAR)' : 'Tier Price'}
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={tier.price}
                                        onChange={(e) => updateTier(idx, 'price', e.target.value)}
                                        className="mt-1 font-mono text-xs"
                                    />
                                </div>

                                <div className="w-full sm:w-24">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'خصم إضافي (%)' : 'Discount %'}
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={tier.discount_percentage}
                                        onChange={(e) => updateTier(idx, 'discount_percentage', e.target.value)}
                                        className="mt-1 font-mono text-xs"
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={form.items.length <= 1}
                                    onClick={() => removeTier(idx)}
                                    className="h-8 w-8 text-neutral-400 hover:text-rose-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/trade/pricelists">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isRtl ? 'حفظ وتفعيل القائمة' : 'Save & Activate Price List'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
