import { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ShieldCheck, Save, Calendar, Barcode, HelpCircle } from 'lucide-react';
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
    warranty_months?: number;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Batch {
    id: string;
    product_id: string;
    batch_number: string;
    expiry_date?: string;
}

interface Props {
    products: Product[];
    warehouses: Warehouse[];
    batches: Batch[];
    selectedProductId?: string;
}

export default function CreateSerials({ products, warehouses, batches, selectedProductId }: Props) {
    const { t, isRtl } = useTranslation();

    const initialProduct = products.find((p) => p.id === selectedProductId) || products[0];

    const { data, setData, post, processing, errors } = useForm({
        product_id: initialProduct?.id || '',
        warehouse_id: warehouses[0]?.id || '',
        batch_id: '',
        serial_numbers: '',
        warranty_start_date: new Date().toISOString().split('T')[0],
        warranty_end_date: '',
        warranty_months: initialProduct?.warranty_months || 12,
        warranty_notes: '',
        unit_cost: initialProduct?.moving_average_cost || initialProduct?.standard_cost || '0',
        notes: '',
    });

    // Auto calculate warranty end date on mount if initial product has warranty_months
    useState(() => {
        if (data.warranty_start_date && data.warranty_months) {
            const start = new Date(data.warranty_start_date);
            start.setMonth(start.getMonth() + Number(data.warranty_months));
            data.warranty_end_date = start.toISOString().split('T')[0];
        }
    });

    const parsedSerialCount = useMemo(() => {
        return data.serial_numbers
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0).length;
    }, [data.serial_numbers]);

    const handleProductChange = (productId: string) => {
        const prod = products.find((p) => p.id === productId);
        setData((prev) => {
            const months = prod?.warranty_months || 12;
            let endDate = prev.warranty_end_date;
            if (prev.warranty_start_date) {
                const s = new Date(prev.warranty_start_date);
                s.setMonth(s.getMonth() + Number(months));
                endDate = s.toISOString().split('T')[0];
            }

            return {
                ...prev,
                product_id: productId,
                batch_id: '',
                unit_cost: prod?.moving_average_cost || prod?.standard_cost || '0',
                warranty_months: months,
                warranty_end_date: endDate,
            };
        });
    };

    const handleWarrantyChange = (months: number, startDateStr: string) => {
        let endDate = '';
        if (startDateStr && months > 0) {
            const s = new Date(startDateStr);
            s.setMonth(s.getMonth() + Number(months));
            endDate = s.toISOString().split('T')[0];
        }
        setData((prev) => ({
            ...prev,
            warranty_months: months,
            warranty_start_date: startDateStr,
            warranty_end_date: endDate,
        }));
    };

    const availableBatches = batches.filter((b) => b.product_id === data.product_id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/serials');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('serials.createTitle', 'تسجيل أرقام تسلسلية جديدة')} />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/inventory/serials">
                        <Button variant="outline" size="icon">
                            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            {t('serials.createTitle', 'تسجيل أرقام تسلسلية وتعيين الضمان')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t('serials.createSubtitle', 'إدخال أرقام تسلسلية فردية أو مجمعة وربطها بالضمان والدفعة والمستودع')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t('serials.product', 'المنتج')} <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={data.product_id}
                            onChange={(e) => handleProductChange(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                            required
                        >
                            <option value="">{t('serials.selectProduct', '-- اختر المنتج --')}</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.sku} - {p.name_ar || p.name}
                                </option>
                            ))}
                        </select>
                        {errors.product_id && <p className="text-xs text-destructive">{errors.product_id}</p>}
                    </div>

                    {/* Warehouse */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t('serials.warehouse', 'المستودع المستلم')} <span className="text-destructive">*</span>
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

                    {/* Batch Association (Optional) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t('serials.batchOptional', 'ربط بدفعة محددة (اختياري)')}
                        </label>
                        <select
                            value={data.batch_id}
                            onChange={(e) => setData('batch_id', e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">{t('serials.noBatch', '-- بدون ربط بدفعة --')}</option>
                            {availableBatches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.batch_number} {b.expiry_date ? `(ينتهي: ${b.expiry_date})` : ''}
                                </option>
                            ))}
                        </select>
                        {errors.batch_id && <p className="text-xs text-destructive">{errors.batch_id}</p>}
                    </div>

                    {/* Unit Cost */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {t('serials.unitCost', 'تكلفة الوحدة (ر.س)')}
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

                {/* Serial Numbers Input Textarea */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Barcode className="w-4 h-4 text-primary" />
                            <span>{t('serials.inputList', 'قائمة الأرقام التسلسلية (رقم بكل سطر)')}</span>
                            <span className="text-destructive">*</span>
                        </label>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {t('serials.count', 'العدد المكتشف')}: {parsedSerialCount} {t('serials.units', 'جهاز')}
                        </span>
                    </div>
                    <textarea
                        value={data.serial_numbers}
                        onChange={(e) => setData('serial_numbers', e.target.value)}
                        rows={6}
                        required
                        className="w-full p-3 font-mono text-sm border rounded-md bg-background uppercase focus:ring-2 focus:ring-primary"
                        placeholder="SN-2026-0001&#10;SN-2026-0002&#10;SN-2026-0003"
                    />
                    <p className="text-xs text-muted-foreground">
                        {t('serials.bulkHint', 'يمكنك مسح الأرقام باستخدام قارئ الباركود أو لصق قائمة أرقام تسلسلية مباشرة.')}
                    </p>
                    {errors.serial_numbers && <p className="text-xs text-destructive">{errors.serial_numbers}</p>}
                </div>

                {/* Warranty Configuration Card */}
                <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        {t('serials.warrantySettings', 'إعدادات وسياسة الضمان')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                {t('serials.warrantyMonths', 'مدة الضمان (بالأشهر)')}
                            </label>
                            <Input
                                type="number"
                                min="1"
                                value={data.warranty_months}
                                onChange={(e) => handleWarrantyChange(Number(e.target.value), data.warranty_start_date)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                {t('serials.warrantyStart', 'تاريخ بدء الضمان')}
                            </label>
                            <Input
                                type="date"
                                value={data.warranty_start_date}
                                onChange={(e) => handleWarrantyChange(Number(data.warranty_months), e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                {t('serials.warrantyEnd', 'تاريخ انتهاء الضمان (محسوب)')}
                            </label>
                            <Input
                                type="date"
                                value={data.warranty_end_date}
                                onChange={(e) => setData('warranty_end_date', e.target.value)}
                                className="font-semibold text-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            {t('serials.warrantyTerms', 'شروط وبنود الضمان المرفقة')}
                        </label>
                        <Input
                            value={data.warranty_notes}
                            onChange={(e) => setData('warranty_notes', e.target.value)}
                            placeholder={t('serials.warrantyTermsPlaceholder', 'ضمان شامل للقطع والعيوب المصنعية لمدة سنتين...')}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Link href="/inventory/serials">
                        <Button type="button" variant="outline">
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                    </Link>
                    <Button type="submit" disabled={processing || parsedSerialCount === 0} className="gap-2">
                        <Save className="w-4 h-4" />
                        {processing
                            ? t('common.saving', 'جاري التسجيل...')
                            : `${t('serials.submitBtn', 'تسجيل')} (${parsedSerialCount}) ${t('serials.serialsCount', 'رقم تسلسلي')}`}
                    </Button>
                </div>
            </form>
        </div>
    );
}
