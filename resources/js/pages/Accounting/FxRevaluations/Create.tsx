import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Banknote, 
    ArrowLeft, 
    ArrowRight, 
    Calendar, 
    TrendingUp, 
    TrendingDown, 
    Scale, 
    Check, 
    Info, 
    Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface RevaluationLinePreview {
    account_id: string;
    account_code: string;
    account_name: string;
    account_type: string;
    currency: string;
    foreign_balance: number;
    book_exchange_rate: number;
    closing_exchange_rate: number;
    book_amount_sar: number;
    revalued_amount_sar: number;
    adjustment_amount_sar: number;
    gain_loss_type: 'gain' | 'loss' | 'neutral';
}

interface PreviewData {
    date: string;
    lines: RevaluationLinePreview[];
    total_gain: number;
    total_loss: number;
    net_adjustment: number;
}

interface Props {
    preview: PreviewData;
    selectedDate: string;
}

export default function FxRevaluationCreate({ preview, selectedDate }: Props) {
    const { t, isRtl } = useTranslation();
    const [date, setDate] = useState(selectedDate);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        router.get('/accounting/fx-revaluations/create', { date: newDate }, {
            preserveState: true,
        });
    };

    const handlePost = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        router.post('/accounting/fx-revaluations', {
            date,
            notes,
        }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <Head title={t('fx.createTitle', 'إجراء إعادة تقييم العملات الأجنبية')} />

            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/fx-revaluations">
                        <Button variant="ghost" size="icon">
                            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Banknote className="h-6 w-6 text-primary" />
                            {t('fx.createTitle', 'إجراء إعادة تقييم العملات الأجنبية وتوليد قيد التسوية')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('fx.createSubtitle', 'معاينة الفروقات الناتجة عن تذبذب أسعار الصرف وإثبات أرباح وخسائر العملة غير المحققة وفق معيار IAS 21')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Date Selection Box */}
            <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary shrink-0" />
                    <div>
                        <div className="font-semibold text-foreground">{t('fx.selectClosingDate', 'تاريخ الإقفال / التسوية')}</div>
                        <div className="text-xs text-muted-foreground">{t('fx.closingDateHint', 'سيتم استخدام أسعار الصرف الفورية السارية في هذا التاريخ')}</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-48 font-mono"
                    />
                </div>
            </div>

            {/* Preview Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('fx.previewGains', 'إجمالي أرباح التقييم')}</span>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-500 mt-2 font-mono">
                        +{preview.total_gain.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('fx.previewLosses', 'إجمالي خسائر التقييم')}</span>
                        <TrendingDown className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="text-2xl font-bold text-destructive mt-2 font-mono">
                        -{preview.total_loss.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('fx.previewNet', 'صافي تسوية فروقات العملة')}</span>
                        <Scale className="h-4 w-4 text-primary" />
                    </div>
                    <div className={`text-2xl font-bold mt-2 font-mono ${preview.net_adjustment >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        {preview.net_adjustment >= 0 ? '+' : ''}
                        {preview.net_adjustment.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                </div>
            </div>

            {/* Account Revaluation Breakdown Table */}
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden space-y-0">
                <div className="p-4 border-b border-border/60 flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {t('fx.previewTableTitle', 'الأرصدة والبنود النقدية الخاضعة للتقييم')}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                        {preview.lines.length} {t('fx.accountsCount', 'حساب نقدي/ذمم')}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium text-xs">
                            <tr>
                                <th className="p-3.5">{t('accounting.account', 'الحساب')}</th>
                                <th className="p-3.5">{t('fx.currency', 'العملة')}</th>
                                <th className="p-3.5">{t('fx.foreignBalance', 'الرصيد بالعملة الأجنبية')}</th>
                                <th className="p-3.5">{t('fx.bookRate', 'السعر الدفتري')}</th>
                                <th className="p-3.5">{t('fx.closingRate', 'سعر الإقفال')}</th>
                                <th className="p-3.5">{t('fx.bookSar', 'الرصيد الدفتري (SAR)')}</th>
                                <th className="p-3.5">{t('fx.revaluedSar', 'الرصيد المعاد تقييمه (SAR)')}</th>
                                <th className="p-3.5">{t('fx.adjustment', 'فروقات التقييم')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {preview.lines.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                        {t('fx.noForeignAccounts', 'لا توجد أرصدة عملات أجنبية مفتوحة بحاجة إلى إعادة تقييم في هذا التاريخ.')}
                                    </td>
                                </tr>
                            ) : (
                                preview.lines.map((line) => (
                                    <tr key={line.account_id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3.5">
                                            <div className="font-bold text-foreground">{line.account_code} - {line.account_name}</div>
                                            <span className="text-[11px] text-muted-foreground uppercase">{line.account_type}</span>
                                        </td>
                                        <td className="p-3.5 font-mono font-bold text-foreground">
                                            {line.currency}
                                        </td>
                                        <td className="p-3.5 font-mono font-bold">
                                            {line.foreign_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3.5 font-mono text-xs text-muted-foreground">
                                            {line.book_exchange_rate.toFixed(4)}
                                        </td>
                                        <td className="p-3.5 font-mono text-xs font-bold text-primary">
                                            {line.closing_exchange_rate.toFixed(4)}
                                        </td>
                                        <td className="p-3.5 font-mono text-xs">
                                            {line.book_amount_sar.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3.5 font-mono font-bold text-foreground">
                                            {line.revalued_amount_sar.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3.5 font-mono font-bold">
                                            {line.gain_loss_type === 'gain' ? (
                                                <span className="text-emerald-500">
                                                    +{Math.abs(line.adjustment_amount_sar).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR (ربح)
                                                </span>
                                            ) : line.gain_loss_type === 'loss' ? (
                                                <span className="text-destructive">
                                                    -{Math.abs(line.adjustment_amount_sar).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR (خسارة)
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">0.00 SAR</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes and Posting Action */}
            <form onSubmit={handlePost} className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="notes">{t('fx.notesLabel', 'ملاحظات وتفاصيل الدفعة')}</Label>
                    <Input
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('fx.notesPlaceholder', 'مثال: تسوية فروقات العملات الأجنبية لإقفال الربع المالي...')}
                    />
                </div>

                <div className="bg-muted/40 border border-border/80 rounded-xl p-4 flex items-start gap-3 text-xs text-muted-foreground">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold text-foreground">
                            {t('fx.jvExplanationTitle', 'القيد المحاسبي التلقائي الناتج عن التسوية:')}
                        </span>
                        <div className="mt-1 font-mono">
                            يتم قيد الفروقات الدائنة في حـ/ أرباح فروقات أسعار صرف غير محققة (4400) <br />
                            والفروقات المدينة في حـ/ خسائر فروقات أسعار صرف غير محققة (5400) لموازنة الحسابات الأصلية.
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href="/accounting/fx-revaluations">
                        <Button variant="outline" type="button">
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                    </Link>
                    <Button type="submit" disabled={submitting || preview.lines.length === 0} className="min-w-44">
                        {submitting ? t('common.saving', 'جاري الترحيل...') : t('fx.postRevaluationBtn', 'اعتماد وترحيل قيد التسوية')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
