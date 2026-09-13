import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Banknote, 
    Plus, 
    ArrowDownUp, 
    TrendingUp, 
    TrendingDown, 
    Scale, 
    Calendar, 
    Eye, 
    RotateCcw,
    BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';

interface JournalEntry {
    id: string;
    entry_number: string;
}

interface FxRevaluation {
    id: string;
    revaluation_number: string;
    date: string;
    status: 'draft' | 'posted' | 'reversed';
    total_gain: string;
    total_loss: string;
    net_adjustment: string;
    notes?: string;
    journal_entry?: JournalEntry;
    reversal_journal_entry?: JournalEntry;
    creator?: { name: string };
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    revaluations: PaginatedData<FxRevaluation>;
    metrics: {
        total_gain_all_time: number;
        total_loss_all_time: number;
        net_adjustment_all_time: number;
        batches_count: number;
    };
}

export default function FxRevaluationsIndex({ revaluations, metrics }: Props) {
    const { t, isRtl } = useTranslation();

    const handleReverse = (reval: FxRevaluation) => {
        if (confirm(t('fx.confirmReverse', `هل أنت متأكد من عكس قيد تسوية فروقات العملة للدفعة ${reval.revaluation_number}؟`))) {
            router.post(`/accounting/fx-revaluations/${reval.id}/reverse`);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'posted':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t('common.posted', 'مرحّل بالدفاتر')}</Badge>;
            case 'reversed':
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{t('common.reversed', 'تم العكس')}</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <Head title={t('fx.revaluationsTitle', 'إعادة تقييم العملات الأجنبية وفروقات الصرف (IAS 21)')} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Banknote className="h-7 w-7 text-primary" />
                        {t('fx.revaluationsTitle', 'إعادة تقييم العملات الأجنبية وفروقات الصرف (IAS 21)')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('fx.revaluationsSubtitle', 'تسوية أرصدة البنوك والعملاء والموردين بالعملات الأجنبية بسعر الإقفال الفوري وتوليد القيود المحاسبية التلقائية')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/accounting/fx-rates">
                        <Button variant="outline" className="flex items-center gap-2">
                            <ArrowDownUp className="h-4 w-4" />
                            {t('fx.viewRates', 'أسعار الصرف')}
                        </Button>
                    </Link>
                    <Link href="/accounting/fx-revaluations/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            {t('fx.newRevaluation', 'إجراء تسوية جديدة')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('fx.cumulativeGain', 'إجمالي أرباح العملة المسجلة')}</span>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold text-emerald-500 mt-2 font-mono">
                        +{metrics.total_gain_all_time.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {t('fx.gainDesc', 'أرباح فروقات أسعار صرف غير محققة (حـ/ 4400)')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('fx.cumulativeLoss', 'إجمالي خسائر العملة المسجلة')}</span>
                        <TrendingDown className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="text-xl font-bold text-destructive mt-2 font-mono">
                        -{metrics.total_loss_all_time.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {t('fx.lossDesc', 'خسائر فروقات أسعار صرف غير محققة (حـ/ 5400)')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('fx.netImpact', 'صافي أثر فروقات الصرف')}</span>
                        <Scale className="h-4 w-4 text-primary" />
                    </div>
                    <div className={`text-xl font-bold mt-2 font-mono ${metrics.net_adjustment_all_time >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        {metrics.net_adjustment_all_time >= 0 ? '+' : ''}
                        {metrics.net_adjustment_all_time.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {t('fx.incomeStatementEffect', 'الأثر في قائمة الدخل')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('fx.totalBatches', 'عدد دورات التقييم')}</span>
                        <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xl font-bold text-foreground mt-2 font-mono">
                        {metrics.batches_count}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {t('fx.batchesCountDesc', 'تسويات شهرية وسنوية')}
                    </div>
                </div>
            </div>

            {/* Revaluations Table */}
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4">{t('fx.batchNumber', 'رقم الدفعة')}</th>
                                <th className="p-4">{t('fx.date', 'تاريخ التقييم')}</th>
                                <th className="p-4">{t('fx.gains', 'أرباح التقييم')}</th>
                                <th className="p-4">{t('fx.losses', 'خسائر التقييم')}</th>
                                <th className="p-4">{t('fx.netAdjustment', 'صافي التسوية')}</th>
                                <th className="p-4">{t('fx.linkedJv', 'السند المحاسبي')}</th>
                                <th className="p-4">{t('fx.status', 'الحالة')}</th>
                                <th className="p-4 text-center">{t('common.actions', 'الإجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {revaluations.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                        {t('fx.noRevaluations', 'لا توجد تسويات تقييم عملة مسجلة بعد. اضغط "إجراء تسوية جديدة" للبدء.')}
                                    </td>
                                </tr>
                            ) : (
                                revaluations.data.map((reval) => (
                                    <tr key={reval.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4 font-mono font-bold text-foreground">
                                            {reval.revaluation_number}
                                        </td>
                                        <td className="p-4 font-mono text-xs">
                                            {reval.date}
                                        </td>
                                        <td className="p-4 font-mono font-bold text-emerald-500">
                                            +{parseFloat(reval.total_gain).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="p-4 font-mono font-bold text-destructive">
                                            -{parseFloat(reval.total_loss).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className={`p-4 font-mono font-bold ${parseFloat(reval.net_adjustment) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                                            {parseFloat(reval.net_adjustment) >= 0 ? '+' : ''}
                                            {parseFloat(reval.net_adjustment).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="p-4">
                                            {reval.journal_entry ? (
                                                <div className="flex items-center gap-1.5 font-mono text-xs text-primary">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                    <span>{reval.journal_entry.entry_number}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(reval.status)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Link href={`/accounting/fx-revaluations/${reval.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {reval.status === 'posted' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                                                        onClick={() => handleReverse(reval)}
                                                    >
                                                        <RotateCcw className="h-3 w-3 mr-1" />
                                                        {t('fx.reverseBtn', 'عكس القيد')}
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
