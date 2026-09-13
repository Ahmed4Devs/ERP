import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Barcode, Save, Sparkles, Calendar, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
    standard_cost: string;
    moving_average_cost: string;
    shelf_life_days?: number;
    tracking_type?: string;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Props {
    products: Product[];
    warehouses: Warehouse[];
}

export default function CreateBatch({ products, warehouses }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        product_id: '',
        warehouse_id: warehouses[0]?.id || '',
        batch_number: '',
        supplier_batch_number: '',
        manufacture_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        quantity: '1',
        unit_cost: '0',
        notes: '',
    });

    const selectedProduct = products.find((p) => p.id === data.product_id);

    const handleProductChange = (productId: string) => {
        const prod = products.find((p) => p.id === productId);
        setData((prev) => {
            const updated = {
                ...prev,
                product_id: productId,
                unit_cost: prod?.moving_average_cost || prod?.standard_cost || '0',
            };

            if (prod?.shelf_life_days && prev.manufacture_date) {
                const mDate = new Date(prev.manufacture_date);
                mDate.setDate(mDate.getDate() + prod.shelf_life_days);
                updated.expiry_date = mDate.toISOString().split('T')[0];
            }

            return updated;
        });
    };

    const handleManufactureDateChange = (dateStr: string) => {
        setData((prev) => {
            const updated = { ...prev, manufacture_date: dateStr };
            if (selectedProduct?.shelf_life_days && dateStr) {
                const mDate = new Date(dateStr);
                mDate.setDate(mDate.getDate() + selectedProduct.shelf_life_days);
                updated.expiry_date = mDate.toISOString().split('T')[0];
            }
            return updated;
        });
    };

    const generateBatchNumber = () => {
        const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        setData('batch_number', `LOT-${datePart}-${rand}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/batches');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('batches.createTitle', 'تسجيل دفعة جديدة (Batch/Lot)')} />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/inventory/batches">
                        <Button variant="outline" size="icon">
                            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Barcode className="w-6 h-6 text-primary" />
                            {t('batches.createTitle', 'تسجيل دفعة جديدة (Batch/Lot)')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t('batches.createSubtitle', 'إدخال بيانات الدفعة، تاريخ التصنيع، تاريخ الصلاحية والرصيد الأولي')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t('batches.product', 'المنتج')} <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={data.product_id}
                            onChange={(e) => handleProductChange(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                            required
                        >
                            <option value="">{t('batches.selectProduct', '-- اختر المنتج --')}</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.sku} - {p.name_ar || p.name}
                                </option>
                            ))}
                        </select>
                        {selectedProduct?.shelf_life_days && (
                            <p className="text-xs text-primary font-medium">
                                {t('batches.shelfLifeHint', 'فترة الصلاحية المحددة للصنف')}: {selectedProduct.shelf_life_days} {t('common.days', 'يوم')}
                            </p>
                        )}
                        {errors.product_id && <p className="text-xs text-destructive">{errors.product_id}</p>}
                    </div>

                    {/* Warehouse */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t('batches.warehouse', 'المستودع')} <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={data.warehouse_id}
                            onChange={(e) => setData('warehouse_id', e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                            required
                        >
                            {warehouses.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name} ({w.code})
                                </option>
                            ))}
                        </select>
                        {errors.warehouse_id && <p className="text-xs text-destructive">{errors.warehouse_id}</p>}
                    </div>

                    {/* Batch Number */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                                {t('batches.batchNumber', 'رقم الدفعة / التشغيلة')} <span className="text-destructive">*</span>
                            </label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={generateBatchNumber}
                                className="h-6 text-xs text-primary gap-1"
                            >
                                <Sparkles className="w-3 h-3" />
                                {t('batches.generate', 'توليد تلقائي')}
                            </Button>
                        </div>
                        <Input
                            value={data.batch_number}
                            onChange={(e) => setData('batch_number', e.target.value)}
                            placeholder="LOT-2026-001"
                            required
                            className="font-mono uppercase"
                        />
                        {errors.batch_number && <p className="text-xs text-destructive">{errors.batch_number}</p>}
                    </div>

                    {/* Supplier Batch Number */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t('batches.supplierBatchNumber', 'رقم دفعة المورد / الشركة المصنعة')}
                        </label>
                        <Input
                            value={data.supplier_batch_number}
                            onChange={(e) => setData('supplier_batch_number', e.target.value)}
                            placeholder={t('batches.supplierBatchPlaceholder', 'اختياري...')}
                        />
                        {errors.supplier_batch_number && <p className="text-xs text-destructive">{errors.supplier_batch_number}</p>}
                    </div>

                    {/* Manufacture Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {t('batches.manufactureDate', 'تاريخ الإنتاج / التصنيع')}
                        </label>
                        <Input
                            type="date"
                            value={data.manufacture_date}
                            onChange={(e) => handleManufactureDateChange(e.target.value)}
                        />
                        {errors.manufacture_date && <p className="text-xs text-destructive">{errors.manufacture_date}</p>}
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            {t('batches.expiryDate', 'تاريخ انتهاء الصلاحية')}
                        </label>
                        <Input
                            type="date"
                            value={data.expiry_date}
                            onChange={(e) => setData('expiry_date', e.target.value)}
                            className="border-amber-200 dark:border-amber-800"
                        />
                        {errors.expiry_date && <p className="text-xs text-destructive">{errors.expiry_date}</p>}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t('batches.quantity', 'الكمية المستلمة')} <span className="text-destructive">*</span>
                        </label>
                        <Input
                            type="number"
                            step="any"
                            min="0.0001"
                            value={data.quantity}
                            onChange={(e) => setData('quantity', e.target.value)}
                            required
                            className="text-lg font-bold"
                        />
                        {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
                    </div>

                    {/* Unit Cost */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t('batches.unitCost', 'تكلفة الوحدة (ر.س)')}
                        </label>
                        <Input
                            type="number"
                            step="any"
                            min="0"
                            value={data.unit_cost}
                            onChange={(e) => setData('unit_cost', e.target.value)}
                        />
                        {errors.unit_cost && <p className="text-xs text-destructive">{errors.unit_cost}</p>}
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">
                        {t('common.notes', 'ملاحظات وتفاصيل الدفعة')}
                    </label>
                    <textarea
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        rows={3}
                        className="w-full p-3 border rounded-md bg-background text-sm resize-none"
                        placeholder={t('batches.notesPlaceholder', 'أي ملاحظات حول التخزين أو شهادة التحليل أو الفحص المخبري...')}
                    />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Link href="/inventory/batches">
                        <Button type="button" variant="outline">
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                    </Link>
                    <Button type="submit" disabled={processing} className="gap-2">
                        <Save className="w-4 h-4" />
                        {processing ? t('common.saving', 'جاري الحفظ...') : t('batches.saveBatch', 'تسجيل الدفعة')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
