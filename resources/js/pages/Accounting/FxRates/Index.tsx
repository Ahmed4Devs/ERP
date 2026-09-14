import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    ArrowDownUp, 
    Plus, 
    TrendingUp, 
    Calendar, 
    Globe2, 
    Filter, 
    Check, 
    History,
    Landmark,
    RefreshCw,
    Calculator,
    ShieldCheck,
    ArrowRightLeft,
    Sparkles,
    Building2,
    CheckCircle2,
    AlertCircle,
    Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

interface ExchangeRate {
    id: string;
    from_currency: string;
    to_currency: string;
    rate: string;
    effective_date: string;
    source: string;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
}

interface SamaCurrencyMeta {
    code: string;
    name_ar: string;
    name_en: string;
    symbol: string;
    flag: string;
    country_ar: string;
    region: string;
    is_statutory_peg: boolean;
    base_rate: number;
    statutory_decree?: string | null;
}

interface Props {
    rates: PaginatedData<ExchangeRate>;
    latestRates: Record<string, number>;
    popularCurrencies: string[];
    samaCurrencies?: Record<string, SamaCurrencyMeta>;
    isSamaSyncedToday?: boolean;
    latestSamaSync?: string | null;
    todayDate?: string;
    filters: {
        currency: string;
    };
}

export default function FxRatesIndex({
    rates,
    latestRates,
    popularCurrencies,
    samaCurrencies = {},
    isSamaSyncedToday = false,
    latestSamaSync = null,
    todayDate = new Date().toISOString().split('T')[0],
    filters,
}: Props) {
    const { t, isRtl } = useTranslation();
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [syncingSama, setSyncingSama] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'GCC' | 'Major' | 'Other'>('all');

    // Live Currency Calculator State
    const [calcAmount, setCalcAmount] = useState<string>('1000');
    const [calcFrom, setCalcFrom] = useState<string>('USD');
    const [calcTo, setCalcTo] = useState<string>('SAR');

    const [form, setForm] = useState({
        from_currency: 'USD',
        rate: '',
        effective_date: todayDate,
        source: 'manual',
    });

    const handleQuickRate = (curr: string) => {
        setForm(prev => ({
            ...prev,
            from_currency: curr,
            rate: latestRates[curr] ? latestRates[curr].toString() : '',
            effective_date: todayDate,
        }));
        setModalOpen(true);
    };

    const handleSyncSama = () => {
        setSyncingSama(true);
        router.post('/accounting/fx-rates/sync-sama', {
            effective_date: todayDate,
        }, {
            onFinish: () => setSyncingSama(false),
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        router.post('/accounting/fx-rates', {
            ...form,
            rate: parseFloat(form.rate),
        }, {
            onSuccess: () => {
                setModalOpen(false);
                setForm({
                    from_currency: 'USD',
                    rate: '',
                    effective_date: todayDate,
                    source: 'manual',
                });
            },
            onFinish: () => setSubmitting(false),
        });
    };

    // Calculate live conversion
    const computeConversion = () => {
        const amt = parseFloat(calcAmount) || 0;
        const rateFromToSar = calcFrom === 'SAR' ? 1.0 : (latestRates[calcFrom] || 1.0);
        const rateToToSar = calcTo === 'SAR' ? 1.0 : (latestRates[calcTo] || 1.0);

        const sarValue = amt * rateFromToSar;
        const finalValue = rateToToSar > 0 ? (sarValue / rateToToSar) : 0;
        const crossRate = rateToToSar > 0 ? (rateFromToSar / rateToToSar) : 0;

        return {
            finalValue: finalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
            crossRate: crossRate.toFixed(6),
            sarValue: sarValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        };
    };

    const conversionResult = computeConversion();

    const swapCurrencies = () => {
        setCalcFrom(calcTo);
        setCalcTo(calcFrom);
    };

    // Filter currencies by tab
    const filteredCurrencies = popularCurrencies.filter(curr => {
        if (activeTab === 'all') return true;
        const meta = samaCurrencies[curr];
        if (!meta) return true;
        if (activeTab === 'GCC') return meta.region === 'GCC';
        if (activeTab === 'Major') return meta.region === 'Major';
        if (activeTab === 'Other') return meta.region === 'Asia' || meta.region === 'Arab';
        return true;
    });

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <Head title={t('fx.ratesTitle', 'أسعار صرف العملات - البنك المركزي السعودي (SAMA)')} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                            <Landmark className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                {t('fx.ratesTitle', 'نشرة أسعار صرف العملات الرسمية (SAMA)')}
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs px-2.5 py-0.5">
                                    البنك المركزي السعودي
                                </Badge>
                            </h1>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                إدارة أسعار الصرف الرسمية، التقييم الدوري بالريال السعودي (SAR)، ومزامنة نشرة البنك المركزي اليومية
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button 
                        onClick={handleSyncSama} 
                        disabled={syncingSama}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm font-semibold"
                    >
                        <RefreshCw className={`h-4 w-4 ${syncingSama ? 'animate-spin' : ''}`} />
                        {syncingSama ? 'جاري مزامنة SAMA...' : 'مزامنة أسعار SAMA اليومية'}
                    </Button>

                    <Button onClick={() => setModalOpen(true)} variant="outline" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {t('fx.newRate', 'تسجيل سعر صرف مخصص')}
                    </Button>
                </div>
            </div>

            {/* SAMA Status & Statutory Peg Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* SAMA Sync Status Card */}
                <div className="bg-card border border-emerald-500/30 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                {isSamaSyncedToday ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                )}
                                <h3 className="text-sm font-bold text-foreground">
                                    حالة نشرة البنك المركزي اليومية
                                </h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isSamaSyncedToday 
                                    ? `تمت المزامنة بنجاح لنشرة اليوم (${todayDate})`
                                    : (latestSamaSync ? `آخر مزامنة رسمية: ${latestSamaSync}` : 'لم تتم المزامنة بعد لهذا اليوم')}
                            </p>
                        </div>
                        <Badge variant={isSamaSyncedToday ? 'default' : 'secondary'} className={isSamaSyncedToday ? 'bg-emerald-600' : 'bg-amber-500/10 text-amber-700 border-amber-500/20'}>
                            {isSamaSyncedToday ? 'محدثة اليوم' : 'تتطلب مزامنة'}
                        </Badge>
                    </div>
                </div>

                {/* USD Statutory Peg Card */}
                <div className="bg-gradient-to-r from-emerald-950/10 via-background to-background border border-emerald-600/30 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                    <span>الدولار الأمريكي (USD)</span>
                                    <span className="text-xs font-normal text-muted-foreground">🇺🇸</span>
                                </h3>
                                <Badge className="bg-emerald-600 text-white text-[11px] font-mono">
                                    3.750000 SAR
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                مثبت رسمياً بمرسوم ملكي سامي وسياسة ربط النقد الرسمية للبنك المركزي السعودي
                            </p>
                        </div>
                    </div>
                </div>

                {/* GCC Currencies Peg Policy */}
                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Globe2 className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-foreground">
                                    عملات دول مجلس التعاون (GCC)
                                </h3>
                                <Badge variant="secondary" className="text-[10px]">
                                    5 عملات خليجية
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                خاضعة لاتفاقية التوحيد النقدي والربط غير المباشر بالدولار الأمريكي ونشرات التبادل
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SAMA Live Currency Calculator / Converter */}
            <div className="bg-gradient-to-br from-card via-card to-emerald-950/5 border border-border/80 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-base font-bold text-foreground">
                            حاسبة وتحويل العملات الفورية بنشرة البنك المركزي (SAMA FX Converter)
                        </h2>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                        محدث بأسعار الإقفال الفورية
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Amount Input */}
                    <div className="md:col-span-3 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">المبلغ المراد تحويله</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={calcAmount}
                                onChange={(e) => setCalcAmount(e.target.value)}
                                className="font-mono text-base font-bold pl-8"
                                placeholder="1,000"
                            />
                            <Coins className="h-4 w-4 text-muted-foreground absolute left-2.5 top-3" />
                        </div>
                    </div>

                    {/* From Currency */}
                    <div className="md:col-span-3 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">من عملة</Label>
                        <select
                            value={calcFrom}
                            onChange={(e) => setCalcFrom(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-semibold"
                        >
                            <option value="SAR">🇸🇦 SAR - الريال السعودي (الأساس)</option>
                            {popularCurrencies.map((c) => {
                                const meta = samaCurrencies[c];
                                return (
                                    <option key={c} value={c}>
                                        {meta?.flag || '🌐'} {c} - {meta?.name_ar || c}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Swap Button */}
                    <div className="md:col-span-1 flex justify-center pt-5">
                        <Button 
                            type="button" 
                            size="icon" 
                            variant="ghost" 
                            onClick={swapCurrencies}
                            className="rounded-full hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
                        >
                            <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* To Currency */}
                    <div className="md:col-span-3 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">إلى عملة</Label>
                        <select
                            value={calcTo}
                            onChange={(e) => setCalcTo(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-semibold"
                        >
                            <option value="SAR">🇸🇦 SAR - الريال السعودي (الأساس)</option>
                            {popularCurrencies.map((c) => {
                                const meta = samaCurrencies[c];
                                return (
                                    <option key={c} value={c}>
                                        {meta?.flag || '🌐'} {c} - {meta?.name_ar || c}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Result Card */}
                    <div className="md:col-span-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                            الناتج بالـ {calcTo}
                        </div>
                        <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                            {conversionResult.finalValue}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            1 {calcFrom} = {conversionResult.crossRate} {calcTo}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs for Currencies */}
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'all'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                >
                    جميع أسعار الصرف ({popularCurrencies.length})
                </button>
                <button
                    onClick={() => setActiveTab('GCC')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'GCC'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                >
                    دول مجلس التعاون (GCC)
                </button>
                <button
                    onClick={() => setActiveTab('Major')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'Major'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                >
                    العملات العالمية الكبرى
                </button>
                <button
                    onClick={() => setActiveTab('Other')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === 'Other'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                >
                    العملات الإقليمية (مصر والهند)
                </button>
            </div>

            {/* Popular & SAMA Currencies Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {filteredCurrencies.map((curr) => {
                    const meta = samaCurrencies[curr];
                    const rate = latestRates[curr] || 0;
                    const inverse = rate > 0 ? (1 / rate) : 0;

                    return (
                        <div 
                            key={curr}
                            onClick={() => handleQuickRate(curr)}
                            className="bg-card border border-border/60 hover:border-emerald-500/50 cursor-pointer rounded-xl p-4 shadow-sm transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{meta?.flag || '🌐'}</span>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-foreground group-hover:text-emerald-600 transition-colors font-mono">
                                                {curr}
                                            </span>
                                            {meta?.is_statutory_peg && (
                                                <Badge className="bg-emerald-600 text-white text-[9px] px-1 py-0">
                                                    مرسوم ملكي
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[130px]">
                                            {meta?.name_ar || curr}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="text-[10px] font-mono">
                                    SAR
                                </Badge>
                            </div>

                            <div className="mt-3.5 flex items-baseline justify-between">
                                <div className="text-xl font-bold font-mono text-foreground">
                                    {rate.toFixed(4)}
                                </div>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                    1 SAR = {inverse.toFixed(4)} {curr}
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                                    <span>نشرة SAMA</span>
                                </span>
                                <span className="text-[10px] group-hover:text-emerald-600 transition-colors">
                                    تحديث السعر ←
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Rates History Table */}
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden space-y-0">
                <div className="p-4 border-b border-border/60 flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <History className="h-4 w-4 text-emerald-600" />
                        {t('fx.historyTitle', 'سجل أسعار الصرف التاريخية المعتمدة')}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        إجمالي السجلات: {rates.total}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4">{t('fx.currency', 'العملة')}</th>
                                <th className="p-4">{t('fx.baseCurrency', 'العملة الأساس')}</th>
                                <th className="p-4">{t('fx.rate', 'سعر الصرف (SAR)')}</th>
                                <th className="p-4">{t('fx.effectiveDate', 'تاريخ السريان')}</th>
                                <th className="p-4">{t('fx.source', 'المصدر')}</th>
                                <th className="p-4">{t('fx.recordedAt', 'تاريخ التسجيل')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {rates.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                        {t('fx.noRates', 'لا توجد أسعار صرف مسجلة بعد. اضغط على زر "مزامنة أسعار SAMA" لجلب الأسعار الرسمية.')}
                                    </td>
                                </tr>
                            ) : (
                                rates.data.map((r) => {
                                    const meta = samaCurrencies[r.from_currency];
                                    const isSamaSource = r.source?.includes('SAMA');

                                    return (
                                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-bold text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <span>{meta?.flag || '🌐'}</span>
                                                    <span className="font-mono">{r.from_currency}</span>
                                                    <span className="text-xs text-muted-foreground font-normal">
                                                        ({meta?.name_ar || r.from_currency})
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-muted-foreground font-mono">
                                                {r.to_currency}
                                            </td>
                                            <td className="p-4 font-bold font-mono text-emerald-600 dark:text-emerald-400 text-base">
                                                {parseFloat(r.rate).toFixed(6)}
                                            </td>
                                            <td className="p-4 font-mono text-xs">
                                                {r.effective_date}
                                            </td>
                                            <td className="p-4">
                                                {isSamaSource ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 text-xs">
                                                        {r.source}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">
                                                        {r.source}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs text-muted-foreground font-mono">
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custom Rate Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('fx.modalTitle', 'تسجيل أو تعديل سعر صرف عملة أجنبية')}</DialogTitle>
                        <DialogDescription>
                            {t('fx.modalDesc', 'تحديد سعر الإقفال الفوري للعملة مقابل الريال السعودي (SAR)')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>{t('fx.selectCurrency', 'العملة الأجنبية')}</Label>
                            <select
                                value={form.from_currency}
                                onChange={(e) => setForm(prev => ({ ...prev, from_currency: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-semibold"
                            >
                                {popularCurrencies.map((c) => {
                                    const meta = samaCurrencies[c];
                                    return (
                                        <option key={c} value={c}>
                                            {meta?.flag || '🌐'} {c} - {meta?.name_ar || c}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="rate">{t('fx.rateLabel', 'سعر الصرف مقابل 1 SAR')}</Label>
                            <Input
                                id="rate"
                                type="number"
                                step="0.000001"
                                min="0.000001"
                                value={form.rate}
                                onChange={(e) => setForm(prev => ({ ...prev, rate: e.target.value }))}
                                placeholder="3.750000"
                                className="font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="effective_date">{t('fx.effectiveDate', 'تاريخ السريان')}</Label>
                            <Input
                                id="effective_date"
                                type="date"
                                value={form.effective_date}
                                onChange={(e) => setForm(prev => ({ ...prev, effective_date: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="source">{t('fx.sourceLabel', 'مصدر التسعيرة')}</Label>
                            <Input
                                id="source"
                                value={form.source}
                                onChange={(e) => setForm(prev => ({ ...prev, source: e.target.value }))}
                                placeholder="البنك المركزي السعودي (SAMA) / تسعيرة بنكية معتمدة"
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                {submitting ? t('common.saving', 'جاري الحفظ...') : t('common.save', 'حفظ السعر')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
