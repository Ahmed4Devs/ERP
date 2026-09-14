import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Landmark,
    ShoppingBag,
    Receipt,
    Boxes,
    Users,
    Layers,
    Factory,
    Store,
    HardHat,
    FolderKanban,
    Scale,
    ShieldCheck,
    Sparkles,
    Check,
    CheckCircle2,
    Sliders,
    Building2,
    Info,
    RotateCcw,
    Save,
    Lock,
    PackageCheck,
    Cpu,
    Truck,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/lib/i18n';

interface ModuleItem {
    key: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    category: string;
    category_ar: string;
    is_core: boolean;
    icon: string;
    default_route: string;
}

interface PresetItem {
    key: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    icon: string;
    modules: string[];
}

interface CompanyInfo {
    id: string;
    name: string;
    legal_name?: string;
}

interface Props {
    modules: ModuleItem[];
    presets: PresetItem[];
    enabledModules: string[];
    company?: CompanyInfo | null;
}

const ICON_MAP: Record<string, any> = {
    Landmark,
    ShoppingBag,
    Receipt,
    Boxes,
    Users,
    Layers,
    Factory,
    Store,
    HardHat,
    FolderKanban,
    Scale,
    ShieldCheck,
    Truck,
};

export default function ModulesIndex({
    modules = [],
    presets = [],
    enabledModules = [],
    company,
}: Props) {
    const { t } = useTranslation();
    const [selectedModules, setSelectedModules] = useState<string[]>(enabledModules);
    const [saving, setSaving] = useState(false);
    const [applyingPreset, setApplyingPreset] = useState<string | null>(null);

    const isDirty = JSON.stringify([...selectedModules].sort()) !== JSON.stringify([...enabledModules].sort());

    const toggleModule = (key: string, isCore: boolean) => {
        if (isCore) return; // Core modules cannot be toggled

        setSelectedModules(prev => {
            if (prev.includes(key)) {
                return prev.filter(k => k !== key);
            } else {
                return [...prev, key];
            }
        });
    };

    const handleSave = () => {
        setSaving(true);
        router.post('/settings/modules', {
            enabled_modules: selectedModules,
        }, {
            onFinish: () => setSaving(false),
        });
    };

    const handleApplyPreset = (presetKey: string) => {
        setApplyingPreset(presetKey);
        router.post('/settings/modules/preset', {
            preset: presetKey,
        }, {
            onSuccess: () => {
                const preset = presets.find(p => p.key === presetKey);
                if (preset) {
                    setSelectedModules(preset.modules);
                }
            },
            onFinish: () => setApplyingPreset(null),
        });
    };

    const handleReset = () => {
        setSelectedModules(enabledModules);
    };

    // Group modules by category
    const categories = [
        { key: 'core', title: 'النواة المالية الأساسية', badge: 'إلزامي' },
        { key: 'commerce', title: 'التجارة والمبيعات والمشتريات', badge: 'تجاري' },
        { key: 'logistics', title: 'سلاسل الإمداد والمستودعات', badge: 'لوجستي' },
        { key: 'specialized', title: 'القطاعات التخصصية (تصنيع، مقاولات، كاشير، أصول)', badge: 'تخصصي' },
        { key: 'administration', title: 'الموارد البشرية والرواتب (WPS)', badge: 'إداري' },
        { key: 'services', title: 'المشاريع والخدمات والاستشارات', badge: 'خدمي' },
        { key: 'governance', title: 'الحوكمة ومصفوفة الصلاحيات', badge: 'رقابي' },
    ];

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto pb-24">
            <Head title="إدارة وتفعيل موديولات المنشأة" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                            <Sliders className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                    تفعيل وتعطيل موديولات المنشأة (Modular ERP)
                                </h1>
                                <Badge variant="secondary" className="text-xs">
                                    {selectedModules.length} من أصل {modules.length} مفعّل
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                تخصيص النظام وفق نشاط المنشأة التجاري، إخفاء الأقسام غير المطلوبة من القائمة، وضبط المسارات
                            </p>
                        </div>
                    </div>
                </div>

                {company && (
                    <div className="flex items-center gap-3 bg-muted/40 border border-border/80 rounded-xl px-4 py-2.5">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">المنشأة الحالية</div>
                            <div className="text-sm font-bold text-foreground">{company.name}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Industry Presets Quick Selectors */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            باقات وقوالب الأنشطة الجاهزة (Industry Bundles)
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            تطبيق فوري لتشكيلة الموديولات المناسبة لنشاط شركتك بنقرة زر واحدة
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {presets.map((preset) => {
                        const IconComponent = ICON_MAP[preset.icon] || Sparkles;
                        const isCurrentActive = JSON.stringify([...selectedModules].sort()) === JSON.stringify([...preset.modules].sort());

                        return (
                            <div
                                key={preset.key}
                                className={`rounded-xl border p-4 transition-all relative overflow-hidden flex flex-col justify-between ${
                                    isCurrentActive
                                        ? 'bg-primary/5 border-primary shadow-sm'
                                        : 'bg-card border-border/70 hover:border-primary/40'
                                }`}
                            >
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="p-2 rounded-lg bg-muted text-foreground">
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                        {isCurrentActive && (
                                            <Badge className="bg-primary text-primary-foreground text-[10px] gap-1">
                                                <Check className="h-3 w-3" /> الباقة الحالية
                                            </Badge>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-foreground text-sm">
                                            {preset.name_ar}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                                            {preset.description_ar}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                                    <span className="text-[11px] text-muted-foreground font-medium">
                                        {preset.modules.length} موديولات
                                    </span>
                                    <Button
                                        size="sm"
                                        variant={isCurrentActive ? 'secondary' : 'outline'}
                                        disabled={applyingPreset !== null || isCurrentActive}
                                        onClick={() => handleApplyPreset(preset.key)}
                                        className="text-xs h-8"
                                    >
                                        {applyingPreset === preset.key ? 'جاري التطبيق...' : 'تطبيق الباقة'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modules by Category */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-base font-bold text-foreground">
                        قائمة الموديولات التفصيلية والتحكم المستقل
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        قم بتشغيل أو إيقاف أي موديول بشكل مستقل حسب احتياج أقسام المنشأة
                    </p>
                </div>

                <div className="space-y-6">
                    {categories.map((cat) => {
                        const catModules = modules.filter(m => m.category === cat.key);
                        if (catModules.length === 0) return null;

                        return (
                            <div key={cat.key} className="space-y-3">
                                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                                    <span className="text-sm font-bold text-foreground">{cat.title}</span>
                                    <Badge variant="outline" className="text-[10px] px-2 py-0">
                                        {cat.badge}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                    {catModules.map((mod) => {
                                        const IconComp = ICON_MAP[mod.icon] || Boxes;
                                        const isEnabled = selectedModules.includes(mod.key);

                                        return (
                                            <div
                                                key={mod.key}
                                                onClick={() => !mod.is_core && toggleModule(mod.key, mod.is_core)}
                                                className={`rounded-xl border p-4 transition-all ${
                                                    mod.is_core ? 'cursor-default' : 'cursor-pointer hover:border-primary/40'
                                                } ${
                                                    isEnabled
                                                        ? 'bg-card border-border/80 shadow-sm'
                                                        : 'bg-muted/20 border-dashed border-border/60 opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2.5 rounded-xl ${
                                                            isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            <IconComp className="h-5 w-5" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-sm text-foreground">
                                                                    {mod.name_ar}
                                                                </span>
                                                                {mod.is_core ? (
                                                                    <Badge variant="secondary" className="text-[9px] gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                                                                        <Lock className="h-2.5 w-2.5" /> أساسي
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant={isEnabled ? 'default' : 'secondary'} className="text-[9px]">
                                                                        {isEnabled ? 'مفعّل' : 'معطل'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="text-[11px] text-muted-foreground font-mono">
                                                                {mod.name_en}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <Switch
                                                            checked={isEnabled}
                                                            disabled={mod.is_core}
                                                            onCheckedChange={() => toggleModule(mod.key, mod.is_core)}
                                                        />
                                                    </div>
                                                </div>

                                                <p className="text-xs text-muted-foreground mt-3 leading-relaxed border-t border-border/40 pt-2.5">
                                                    {mod.description_ar}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Floating Action Bar */}
            {isDirty && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-2xl rounded-2xl px-6 py-3.5 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-5">
                    <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                        <Info className="h-4 w-4 text-primary" />
                        <span>لديك تعديلات غير محفوظة في تشكيلة الموديولات</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleReset} disabled={saving}>
                            <RotateCcw className="h-4 w-4 ml-1" />
                            تراجع
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving} className="font-semibold gap-1">
                            <Save className="h-4 w-4" />
                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
