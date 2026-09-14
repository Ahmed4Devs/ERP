import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Award,
    Sliders,
    ArrowLeft,
    Plus,
    Trash2,
    Save,
    CheckCircle2,
    Shield,
    Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface Tier {
    id?: string;
    tier_code: string;
    name: string;
    name_ar: string;
    min_points_threshold: number;
    earn_multiplier: string;
    color_hex: string;
    perks_summary_ar?: string;
}

interface LoyaltyProgram {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    description?: string;
    spend_amount_per_point: string;
    point_redeem_value: string;
    min_points_to_redeem: number;
    points_expiry_days?: number;
    is_active: boolean;
    tiers: Tier[];
}

interface Props {
    programs: LoyaltyProgram[];
}

export default function LoyaltyPrograms({ programs }: Props) {
    const { t } = useTranslation();
    const currentProgram = programs[0];

    const form = useForm({
        id: currentProgram?.id || '',
        code: currentProgram?.code || 'REWARDS-STANDARD',
        name: currentProgram?.name || 'Customer Rewards Program',
        name_ar: currentProgram?.name_ar || 'برنامج مكافآت العملاء',
        description: currentProgram?.description || '',
        spend_amount_per_point: currentProgram?.spend_amount_per_point || '10.000000',
        point_redeem_value: currentProgram?.point_redeem_value || '0.050000',
        min_points_to_redeem: currentProgram?.min_points_to_redeem || 100,
        points_expiry_days: currentProgram?.points_expiry_days || 365,
        is_active: currentProgram ? currentProgram.is_active : true,
        tiers: currentProgram?.tiers || [
            {
                tier_code: 'bronze',
                name: 'Bronze',
                name_ar: 'البرونزي',
                min_points_threshold: 0,
                earn_multiplier: '1.0000',
                color_hex: '#cd7f32',
                perks_summary_ar: 'نقطة واحدة لكل 10 ر.س',
            },
            {
                tier_code: 'silver',
                name: 'Silver',
                name_ar: 'الفضي',
                min_points_threshold: 500,
                earn_multiplier: '1.2500',
                color_hex: '#94a3b8',
                perks_summary_ar: 'زيادة 25% في معدل اكتساب النقاط',
            },
            {
                tier_code: 'gold',
                name: 'Gold',
                name_ar: 'الذهبي',
                min_points_threshold: 2000,
                earn_multiplier: '1.5000',
                color_hex: '#eab308',
                perks_summary_ar: 'زيادة 50% وعروض حصرية',
            },
            {
                tier_code: 'platinum',
                name: 'Platinum',
                name_ar: 'البلاتيني VIP',
                min_points_threshold: 5000,
                earn_multiplier: '2.0000',
                color_hex: '#6366f1',
                perks_summary_ar: 'مضاعفة النقاط 200% وأولوية قصوى',
            },
        ],
    });

    const handleTierChange = (index: number, field: string, value: any) => {
        const updatedTiers = [...form.data.tiers];
        updatedTiers[index] = { ...updatedTiers[index], [field]: value };
        form.setData('tiers', updatedTiers);
    };

    const handleAddTier = () => {
        form.setData('tiers', [
            ...form.data.tiers,
            {
                tier_code: `tier_${form.data.tiers.length + 1}`,
                name: 'New Tier',
                name_ar: 'شريحة جديدة',
                min_points_threshold: 10000,
                earn_multiplier: '2.5000',
                color_hex: '#10b981',
                perks_summary_ar: 'مزايا إضافية مخصصة',
            },
        ]);
    };

    const handleRemoveTier = (index: number) => {
        if (form.data.tiers.length <= 1) return;
        form.setData(
            'tiers',
            form.data.tiers.filter((_, i) => i !== index)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/retail/loyalty/programs');
    };

    return (
        <AppLayout>
            <Head title="إعدادات برامج الولاء والشرائح" />

            <div className="space-y-6 pb-12 max-w-5xl mx-auto">
                {/* Top Nav */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/retail/loyalty"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        <span>العودة للوحة تحكم برامج الولاء</span>
                    </Link>
                </div>

                <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm space-y-8">
                    <div className="space-y-2 border-b pb-4">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
                                <Sliders className="w-6 h-6" />
                            </span>
                            <h1 className="text-xl md:text-2xl font-bold text-foreground">
                                تكوين إعدادات برنامج الولاء والشرائح
                            </h1>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            حدد قواعد الاكتساب، ومعادلات التحويل إلى ر.س، وشرائح الترقية التلقائية ومضاعفات النقاط.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground">
                                    رمز البرنامج (Code) <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="text"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground">
                                    اسم البرنامج بالعربية <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="text"
                                    value={form.data.name_ar}
                                    onChange={(e) => form.setData('name_ar', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Financial Conversion Rules */}
                        <div className="p-5 bg-muted/30 rounded-xl border space-y-4">
                            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-600" />
                                معادلات وقواعد احتساب واستبدال النقاط
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground font-medium">
                                        قيمة المشتريات لكل نقطة (ر.س)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.data.spend_amount_per_point}
                                        onChange={(e) =>
                                            form.setData('spend_amount_per_point', e.target.value)
                                        }
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        مثال: 10 يعني نقطة لكل 10 ر.س
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground font-medium">
                                        قيمة الخصم للنقطة الواحدة (ر.س)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        value={form.data.point_redeem_value}
                                        onChange={(e) =>
                                            form.setData('point_redeem_value', e.target.value)
                                        }
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        مثال: 0.05 يعني 100 نقطة = 5 ر.س
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground font-medium">
                                        الحد الأدنى لاستبدال النقاط
                                    </label>
                                    <Input
                                        type="number"
                                        value={form.data.min_points_to_redeem}
                                        onChange={(e) =>
                                            form.setData(
                                                'min_points_to_redeem',
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                        required
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        أقل عدد نقاط مسموح باستبداله
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs text-muted-foreground font-medium">
                                        صلاحية النقاط (أيام)
                                    </label>
                                    <Input
                                        type="number"
                                        value={form.data.points_expiry_days || ''}
                                        onChange={(e) =>
                                            form.setData(
                                                'points_expiry_days',
                                                parseInt(e.target.value) || 0
                                            )
                                        }
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        فارغ = النقاط لا تنتهي صلاحيتها
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tier Definitions */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    شرائح العضوية والترقية ومضاعفات الاكتساب (Membership Tiers)
                                </h3>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={handleAddTier}
                                >
                                    <Plus className="w-4 h-4 ml-1" />
                                    إضافة شريحة جديدة
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {form.data.tiers.map((tier, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 bg-card rounded-xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end"
                                    >
                                        <div className="space-y-1">
                                            <label className="text-[11px] text-muted-foreground font-semibold">
                                                رمز الفئة
                                            </label>
                                            <Input
                                                type="text"
                                                value={tier.tier_code}
                                                onChange={(e) =>
                                                    handleTierChange(idx, 'tier_code', e.target.value)
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] text-muted-foreground font-semibold">
                                                اسم الشريحة (عربي)
                                            </label>
                                            <Input
                                                type="text"
                                                value={tier.name_ar}
                                                onChange={(e) =>
                                                    handleTierChange(idx, 'name_ar', e.target.value)
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] text-muted-foreground font-semibold">
                                                الحد الأدنى للنقاط للترقية
                                            </label>
                                            <Input
                                                type="number"
                                                value={tier.min_points_threshold}
                                                onChange={(e) =>
                                                    handleTierChange(
                                                        idx,
                                                        'min_points_threshold',
                                                        parseInt(e.target.value) || 0
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] text-muted-foreground font-semibold">
                                                مضاعف الاكتساب (Multiplier)
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.05"
                                                value={tier.earn_multiplier}
                                                onChange={(e) =>
                                                    handleTierChange(
                                                        idx,
                                                        'earn_multiplier',
                                                        e.target.value
                                                    )
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[11px] text-muted-foreground font-semibold">
                                                لون الشريحة
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={tier.color_hex}
                                                    onChange={(e) =>
                                                        handleTierChange(idx, 'color_hex', e.target.value)
                                                    }
                                                    className="w-8 h-8 rounded border cursor-pointer p-0"
                                                />
                                                <Input
                                                    type="text"
                                                    value={tier.color_hex}
                                                    onChange={(e) =>
                                                        handleTierChange(idx, 'color_hex', e.target.value)
                                                    }
                                                    className="text-xs font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pb-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                disabled={form.data.tiers.length <= 1}
                                                onClick={() => handleRemoveTier(idx)}
                                                className="text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="w-4 h-4 ml-1" />
                                                حذف
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Link href="/retail/loyalty">
                                <Button type="button" variant="outline">
                                    إلغاء
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20"
                            >
                                <Save className="w-4 h-4 ml-1.5" />
                                حفظ وتحديث إعدادات البرنامج
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
