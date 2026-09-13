import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ClipboardCheck, Warehouse as WarehouseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
}

interface Props {
    warehouses: Warehouse[];
    categories: Category[];
}

export default function StocktakesCreate({ warehouses, categories }: Props) {
    const { t, isRtl } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    const { data, setData, post, processing, errors } = useForm({
        warehouse_id: warehouses[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        count_type: 'full',
        category_ids: [] as string[],
        notes: '',
    });

    const toggleCategory = (id: string) => {
        const list = [...data.category_ids];
        const idx = list.indexOf(id);
        if (idx > -1) {
            list.splice(idx, 1);
        } else {
            list.push(id);
        }
        setData('category_ids', list);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/stocktakes');
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.stocktakes', 'الجرد الفعلي للمخزون'), href: '/inventory/stocktakes' },
            { title: t('common.create', 'بدء جلسة جرد'), href: '/inventory/stocktakes/create' }
        ]}>
            <Head title={t('stocktake.createTitle', 'بدء جلسة جرد فعلي')} />

            <div className="p-6 space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center gap-3">
                    <Link href="/inventory/stocktakes">
                        <Button variant="ghost" size="icon">
                            <BackIcon className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {t('stocktake.createTitle', 'بدء جلسة جرد فعلي للمخزون')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('stocktake.createSubtitle', 'تحديد المستودع وتثبيت لقطة الأرصدة الدفترية لبدء الفحص والعد')}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            {t('warehouse.title', 'المستودع المراد جرده')} *
                        </label>
                        <select
                            className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-teal-500"
                            value={data.warehouse_id}
                            onChange={(e) => setData('warehouse_id', e.target.value)}
                            required
                        >
                            <option value="">{t('warehouse.select', 'اختر المستودع...')}</option>
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name} ({w.code})
                                </option>
                            ))}
                        </select>
                        {errors.warehouse_id && <p className="text-xs text-rose-500 mt-1">{errors.warehouse_id}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1">
                                {t('common.date', 'تاريخ الجرد')} *
                            </label>
                            <Input
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                required
                            />
                            {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-1">
                                {t('stocktake.type', 'نطاق الجرد')} *
                            </label>
                            <select
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm"
                                value={data.count_type}
                                onChange={(e) => setData('count_type', e.target.value)}
                            >
                                <option value="full">{t('stocktake.fullCount', 'جرد كلي لجميع أصناف المستودع')}</option>
                                <option value="selective">{t('stocktake.selective', 'جرد انتقائي لفئات محددة (Cycle Count)')}</option>
                            </select>
                        </div>
                    </div>

                    {data.count_type === 'selective' && (
                        <div>
                            <label className="block text-xs font-semibold text-foreground mb-2">
                                {t('stocktake.selectCategories', 'اختر الفئات المستهدفة بالجرد')}
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-muted/40 border border-border rounded-lg max-h-48 overflow-y-auto">
                                {categories.map((cat) => {
                                    const checked = data.category_ids.includes(cat.id);
                                    return (
                                        <label key={cat.id} className="flex items-center gap-2 text-xs cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleCategory(cat.id)}
                                                className="rounded border-input text-teal-600 focus:ring-teal-500"
                                            />
                                            <span className="truncate">{cat.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                            {t('common.notes', 'ملاحظات وتوجيهات فريق الجرد')}
                        </label>
                        <Input
                            placeholder={t('stocktake.notesPlaceholder', 'مثال: جرد ربع سنوي Q3 - فريق المستودع الشرقي')}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end gap-3">
                        <Link href="/inventory/stocktakes">
                            <Button type="button" variant="outline">
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || !data.warehouse_id}
                            className="bg-teal-600 hover:bg-teal-500 text-white gap-2"
                        >
                            <ClipboardCheck className="w-4 h-4" />
                            {processing ? t('common.creating', 'جاري الإنشاء...') : t('stocktake.initializeSession', 'إنشاء الجلسة وحفظ لقطة الرصيد')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
