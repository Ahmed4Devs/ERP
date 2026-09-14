import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Sparkles, Gift, Percent, DollarSign, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
    list_price: string;
}

interface Props {
    products: Product[];
}

export default function CreatePromotion({ products }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        name_ar: '',
        code: '',
        type: 'bogo' as 'bogo' | 'percentage' | 'fixed_amount',
        buy_product_id: '',
        buy_quantity: '1',
        get_product_id: '',
        get_quantity: '1',
        get_discount_percentage: '100',
        min_order_amount: '0',
        discount_rate: '10',
        fixed_discount_amount: '50',
        start_date: '',
        end_date: '',
        apply_automatically: true,
        is_active: true,
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/trade/promotions');
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title="إنشاء عرض ترويجي جديد | New Promotion" />

            {/* Header */}
            <div>
                <Link
                    href="/trade/promotions"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
                >
                    <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                    العودة إلى قائمة العروض
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    إنشاء عرض ترويجي / خصم جديد
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    حدد شروط العرض، فئة المنتجات المشمولة، نسبة أو قيمة الخصم، وفترة سريان العرض.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Basic Info */}
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        البيانات الأساسية للحملة
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name_ar">اسم العرض بالعربية *</Label>
                            <Input
                                id="name_ar"
                                value={data.name_ar}
                                onChange={(e) => setData('name_ar', e.target.value)}
                                placeholder="مثال: عرض يوم التأسيس - اشترِ 2 واحصل على 1"
                                required
                            />
                            {errors.name_ar && <p className="text-xs text-destructive">{errors.name_ar}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="name">اسم العرض بالإنجليزية (اختياري)</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Foundation Day Buy 2 Get 1 Free"
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="code">كود الكوبون الترويجي (اختياري)</Label>
                            <Input
                                id="code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                placeholder="مثال: FOUNDATION94 أو RAMADAN2026"
                                className="font-mono"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                اتركه فارغاً لتطبيق العرض تلقائياً دون الحاجة لإدخال كود.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="type">نوع العرض الترويجي *</Label>
                            <select
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value as any)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="bogo">اشترِ واحصل مجاناً أو بخصم (BOGO)</option>
                                <option value="percentage">خصم نسبة مئوية على السلة (%)</option>
                                <option value="fixed_amount">خصم نقدي مباشر على السلة (ريال)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Type-Specific Rules */}
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
                        {data.type === 'bogo' && <Gift className="w-4 h-4 text-purple-600" />}
                        {data.type === 'percentage' && <Percent className="w-4 h-4 text-blue-600" />}
                        {data.type === 'fixed_amount' && <DollarSign className="w-4 h-4 text-emerald-600" />}
                        قواعد وشروط تطبيق العرض
                    </h3>

                    {/* BOGO Fields */}
                    {data.type === 'bogo' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="buy_product_id">المنتج المشترى (شرط التأهل) *</Label>
                                    <select
                                        id="buy_product_id"
                                        value={data.buy_product_id}
                                        onChange={(e) => setData('buy_product_id', e.target.value)}
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                                        required
                                    >
                                        <option value="">-- اختر المنتج المشترى --</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name_ar || p.name} ({p.sku}) - {parseFloat(p.list_price || '0')} ريال
                                            </option>
                                        ))}
                                    </select>
                                    {errors.buy_product_id && <p className="text-xs text-destructive">{errors.buy_product_id}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="buy_quantity">الكمية المشترطة *</Label>
                                    <Input
                                        id="buy_quantity"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={data.buy_quantity}
                                        onChange={(e) => setData('buy_quantity', e.target.value)}
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">مثلاً: اشترِ 2 قطعة</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="get_product_id">المنتج الممنوح كهدية / خصم</Label>
                                    <select
                                        id="get_product_id"
                                        value={data.get_product_id}
                                        onChange={(e) => setData('get_product_id', e.target.value)}
                                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                                    >
                                        <option value="">(نفس المنتج المشترى أعلاه)</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name_ar || p.name} ({p.sku})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="get_quantity">الكمية الممنوحة *</Label>
                                    <Input
                                        id="get_quantity"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={data.get_quantity}
                                        onChange={(e) => setData('get_quantity', e.target.value)}
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">مثلاً: احصل على 1 قطعة</p>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="get_discount_percentage">نسبة الخصم على المنتج الممنوح *</Label>
                                    <div className="relative">
                                        <Input
                                            id="get_discount_percentage"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={data.get_discount_percentage}
                                            onChange={(e) => setData('get_discount_percentage', e.target.value)}
                                            required
                                        />
                                        <span className="absolute end-3 top-2 text-sm text-muted-foreground font-bold">%</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">100% = مجاناً بالكامل، 50% = بنصف السعر</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Percentage Discount Fields */}
                    {data.type === 'percentage' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="discount_rate">نسبة الخصم المئوية (%) *</Label>
                                <div className="relative">
                                    <Input
                                        id="discount_rate"
                                        type="number"
                                        min="0.1"
                                        max="100"
                                        step="0.1"
                                        value={data.discount_rate}
                                        onChange={(e) => setData('discount_rate', e.target.value)}
                                        required
                                    />
                                    <span className="absolute end-3 top-2 text-sm text-muted-foreground font-bold">%</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="min_order_amount">الحد الأدنى لقيمة السلة لتفعيل الخصم (ريال)</Label>
                                <Input
                                    id="min_order_amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.min_order_amount}
                                    onChange={(e) => setData('min_order_amount', e.target.value)}
                                />
                                <p className="text-[11px] text-muted-foreground">اتركه 0 إذا كان الخصم ينطبق على أي مبلغ.</p>
                            </div>
                        </div>
                    )}

                    {/* Fixed Amount Fields */}
                    {data.type === 'fixed_amount' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="fixed_discount_amount">مبلغ الخصم النقدي (ريال) *</Label>
                                <Input
                                    id="fixed_discount_amount"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    value={data.fixed_discount_amount}
                                    onChange={(e) => setData('fixed_discount_amount', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="min_order_amount">الحد الأدنى لقيمة السلة لتفعيل الخصم (ريال)</Label>
                                <Input
                                    id="min_order_amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.min_order_amount}
                                    onChange={(e) => setData('min_order_amount', e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Timing & Triggers */}
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-semibold text-base border-b pb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        صلاحية العرض وطريقة التطبيق
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="start_date">تاريخ بداية العرض</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="end_date">تاريخ نهاية العرض</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                            />
                            {errors.end_date && <p className="text-xs text-destructive">{errors.end_date}</p>}
                        </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.apply_automatically}
                                onChange={(e) => setData('apply_automatically', e.target.checked)}
                                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                            />
                            <span className="text-sm font-medium">تطبيق العرض تلقائياً بالسلة عند تحقق الشروط (دون اشتراط إدخال الكود)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                            />
                            <span className="text-sm font-medium">تفعيل العرض فور الحفظ</span>
                        </label>
                    </div>
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3">
                    <Link href="/trade/promotions">
                        <Button type="button" variant="outline">
                            إلغاء
                        </Button>
                    </Link>
                    <Button type="submit" disabled={processing} className="min-w-32">
                        {processing ? 'جاري الحفظ...' : 'حفظ ونشر العرض'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
