import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Factory, ArrowLeft, Plus, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    name: string;
    name_ar?: string;
    sku: string;
    standard_cost?: string;
    list_price?: string;
}

interface BomLineInput {
    product_id: string;
    quantity: string;
    scrap_percentage: string;
    notes?: string;
}

interface Props {
    products: Product[];
}

export default function BomCreate({ products }: Props) {
    const { t, isRtl } = useTranslation();

    const [form, setForm] = useState({
        bom_code: '',
        product_id: products[0]?.id || '',
        yield_quantity: '1.00',
        version: 'v1.0',
        notes: '',
        items: [
            {
                product_id: products[1]?.id || products[0]?.id || '',
                quantity: '1.00',
                scrap_percentage: '0.00',
                notes: '',
            },
        ] as BomLineInput[],
    });

    const addItem = () => {
        setForm({
            ...form,
            items: [
                ...form.items,
                {
                    product_id: products[0]?.id || '',
                    quantity: '1.00',
                    scrap_percentage: '0.00',
                    notes: '',
                },
            ],
        });
    };

    const removeItem = (index: number) => {
        setForm({
            ...form,
            items: form.items.filter((_, i) => i !== index),
        });
    };

    const updateItem = (index: number, field: keyof BomLineInput, value: string) => {
        const updated = [...form.items];
        updated[index] = { ...updated[index], [field]: value };
        setForm({ ...form, items: updated });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/manufacturing/boms', form);
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={isRtl ? 'إنشاء هيكل قائمة مواد جديدة' : 'Create Bill of Materials'} />

            {/* Header */}
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                    <Link href="/manufacturing/boms">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Factory className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'إنشاء هيكل قائمة مواد (BOM) جديدة' : 'Create New Bill of Materials'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'حدد المنتج المجمع النهائي وقائمة المواد الخام والقطع المطلوبة لتصنيعه'
                            : 'Specify finished assembly product and raw material component items'}
                    </p>
                </div>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 border-b pb-3">
                        {isRtl ? 'بيانات الهيكل العام' : 'General Specification'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'رمز قائمة المواد (BOM Code)' : 'BOM Code'}
                            </label>
                            <Input
                                required
                                placeholder="e.g. BOM-WS-001"
                                value={form.bom_code}
                                onChange={(e) => setForm({ ...form, bom_code: e.target.value })}
                                className="mt-1 font-mono uppercase"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'المنتج النهائي المجمع' : 'Finished Product'}
                            </label>
                            <select
                                required
                                className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                value={form.product_id}
                                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                            >
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {isRtl && p.name_ar ? p.name_ar : p.name} ({p.sku})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                    {isRtl ? 'كمية الإنتاج' : 'Yield Qty'}
                                </label>
                                <Input
                                    required
                                    type="number"
                                    step="any"
                                    value={form.yield_quantity}
                                    onChange={(e) => setForm({ ...form, yield_quantity: e.target.value })}
                                    className="mt-1 font-mono"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                    {isRtl ? 'الإصدار' : 'Version'}
                                </label>
                                <Input
                                    value={form.version}
                                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                                    className="mt-1 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                            {isRtl ? 'ملاحظات وتعليمات التجميع' : 'Assembly Notes & Instructions'}
                        </label>
                        <textarea
                            rows={2}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-sm"
                            placeholder={isRtl ? 'تعليمات التجميع والتركيب...' : 'Assembly guidelines and instructions...'}
                        />
                    </div>
                </div>

                {/* Component Items Card */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-indigo-600" />
                            {isRtl ? 'المكونات والقطع المطلوبة (Components)' : 'Component Items'}
                        </h3>
                        <Button type="button" onClick={addItem} size="sm" variant="outline" className="gap-1 text-xs">
                            <Plus className="h-3.5 w-3.5" />
                            <span>{isRtl ? 'إضافة مكون' : 'Add Component'}</span>
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {form.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                                <div className="flex-1 w-full">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'المكون / المادة الخام' : 'Component / Raw Material'}
                                    </label>
                                    <select
                                        className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs"
                                        value={item.product_id}
                                        onChange={(e) => updateItem(idx, 'product_id', e.target.value)}
                                    >
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {isRtl && p.name_ar ? p.name_ar : p.name} ({p.sku})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="w-full sm:w-32">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'الكمية المطلوبة' : 'Quantity'}
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                        className="mt-1 font-mono text-xs"
                                    />
                                </div>

                                <div className="w-full sm:w-28">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'نسبة الهدر (%)' : 'Scrap %'}
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={item.scrap_percentage}
                                        onChange={(e) => updateItem(idx, 'scrap_percentage', e.target.value)}
                                        className="mt-1 font-mono text-xs"
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={form.items.length <= 1}
                                    onClick={() => removeItem(idx)}
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
                        <Link href="/manufacturing/boms">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isRtl ? 'حفظ وتفعيل هيكل المواد' : 'Save & Activate BOM'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
