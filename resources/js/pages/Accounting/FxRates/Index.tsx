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
    Landmark
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

interface Props {
    rates: PaginatedData<ExchangeRate>;
    latestRates: Record<string, number>;
    popularCurrencies: string[];
    filters: {
        currency: string;
    };
}

export default function FxRatesIndex({ rates, latestRates, popularCurrencies, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        from_currency: 'USD',
        rate: '',
        effective_date: new Date().toISOString().split('T')[0],
        source: 'manual',
    });

    const handleQuickRate = (curr: string) => {
        setForm(prev => ({
            ...prev,
            from_currency: curr,
            rate: latestRates[curr] ? latestRates[curr].toString() : '',
        }));
        setModalOpen(true);
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
                    effective_date: new Date().toISOString().split('T')[0],
                    source: 'manual',
                });
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <Head title={t('fx.ratesTitle', 'أسعار صرف العملات الأجنبية')} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ArrowDownUp className="h-7 w-7 text-primary" />
                        {t('fx.ratesTitle', 'أسعار صرف العملات الأجنبية مقابل الريال (SAR)')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('fx.ratesSubtitle', 'تحديث وإدارة الأسعار الفورية للعملات الأجنبية المستخدمة في القيود وإعادة التقييم الدوري')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => setModalOpen(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {t('fx.newRate', 'تسجيل سعر صرف جديد')}
                    </Button>
                </div>
            </div>

            {/* Popular Currencies Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                {popularCurrencies.map((curr) => (
                    <div 
                        key={curr}
                        onClick={() => handleQuickRate(curr)}
                        className="bg-card border border-border/60 hover:border-primary/50 cursor-pointer rounded-xl p-3.5 shadow-sm transition-all group"
                    >
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground group-hover:text-primary transition-colors">{curr}</span>
                            <Badge variant="secondary" className="text-[10px]">SAR</Badge>
                        </div>
                        <div className="text-lg font-bold font-mono text-foreground mt-2">
                            {latestRates[curr]?.toFixed(4)}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-emerald-500" />
                            <span>1 {curr} = {latestRates[curr]} SAR</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rates Table */}
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden space-y-0">
                <div className="p-4 border-b border-border/60 flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        {t('fx.historyTitle', 'سجل أسعار الصرف التاريخية')}
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4">{t('fx.currency', 'العملة')}</th>
                                <th className="p-4">{t('fx.baseCurrency', 'العملة الأساس')}</th>
                                <th className="p-4">{t('fx.rate', 'سعر الصرف')}</th>
                                <th className="p-4">{t('fx.effectiveDate', 'تاريخ السريان')}</th>
                                <th className="p-4">{t('fx.source', 'المصدر')}</th>
                                <th className="p-4">{t('fx.recordedAt', 'تاريخ التسجيل')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {rates.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                        {t('fx.noRates', 'لا توجد أسعار صرف مسجلة بعد.')}
                                    </td>
                                </tr>
                            ) : (
                                rates.data.map((r) => (
                                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4 font-bold text-foreground font-mono">
                                            {r.from_currency}
                                        </td>
                                        <td className="p-4 text-muted-foreground font-mono">
                                            {r.to_currency}
                                        </td>
                                        <td className="p-4 font-bold font-mono text-primary">
                                            {parseFloat(r.rate).toFixed(6)}
                                        </td>
                                        <td className="p-4 font-mono text-xs">
                                            {r.effective_date}
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className="text-xs">
                                                {r.source}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-xs text-muted-foreground font-mono">
                                            {new Date(r.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('fx.modalTitle', 'تسجيل سعر صرف عملة أجنبية')}</DialogTitle>
                        <DialogDescription>
                            {t('fx.modalDesc', 'تحديد سعر الإقفال الفوري للعملة مقابل الريال السعودي')}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>{t('fx.selectCurrency', 'العملة الأجنبية')}</Label>
                            <select
                                value={form.from_currency}
                                onChange={(e) => setForm(prev => ({ ...prev, from_currency: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-mono font-bold"
                            >
                                {popularCurrencies.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
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
                                placeholder="البنك المركزي السعودي (SAMA) / إدخال يدوي"
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? t('common.saving', 'جاري الحفظ...') : t('common.save', 'حفظ السعر')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
