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
    RotateCcw, 
    BookOpen, 
    FileText,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface JournalLine {
    id: string;
    account: Account;
    debit: string;
    credit: string;
    description?: string;
}

interface JournalEntry {
    id: string;
    entry_number: string;
    date: string;
    description: string;
    lines: JournalLine[];
}

interface FxRevaluationLine {
    id: string;
    account: Account;
    currency: string;
    foreign_balance: string;
    book_exchange_rate: string;
    closing_exchange_rate: string;
    book_amount_sar: string;
    revalued_amount_sar: string;
    adjustment_amount_sar: string;
    gain_loss_type: 'gain' | 'loss' | 'neutral';
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
    creator?: { name: string };
    lines: FxRevaluationLine[];
    journal_entry?: JournalEntry;
    reversal_journal_entry?: JournalEntry;
    created_at: string;
}

interface Props {
    revaluation: FxRevaluation;
}

export default function FxRevaluationShow({ revaluation }: Props) {
    const { t, isRtl } = useTranslation();

    const handleReverse = () => {
        if (confirm(t('fx.confirmReverse', `هل أنت متأكد من عكس قيد تسوية فروقات العملة للدفعة ${revaluation.revaluation_number}؟`))) {
            router.post(`/accounting/fx-revaluations/${revaluation.id}/reverse`);
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
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <Head title={`${t('fx.batch', 'دفعة تقييم عملة')} #${revaluation.revaluation_number}`} />

            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/fx-revaluations">
                        <Button variant="ghost" size="icon">
                            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                                #{revaluation.revaluation_number}
                            </h1>
                            {getStatusBadge(revaluation.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t('fx.showSubtitle', 'تسوية فروقات أسعار الصرف غير المحققة لشهر')} {revaluation.date}
                        </p>
                    </div>
                </div>

                {revaluation.status === 'posted' && (
                    <Button 
                        variant="outline" 
                        className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                        onClick={handleReverse}
                    >
                        <RotateCcw className="h-4 w-4 mr-1.5" />
                        {t('fx.reverseBtn', 'عكس قيد التسوية بالكامل')}
                    </Button>
                )}
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('fx.totalGain', 'إجمالي أرباح التقييم')}</span>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-500 mt-2 font-mono">
                        +{parseFloat(revaluation.total_gain).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('fx.totalLoss', 'إجمالي خسائر التقييم')}</span>
                        <TrendingDown className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="text-2xl font-bold text-destructive mt-2 font-mono">
                        -{parseFloat(revaluation.total_loss).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('fx.netAdjustment', 'صافي التسوية')}</span>
                        <Scale className="h-4 w-4 text-primary" />
                    </div>
                    <div className={`text-2xl font-bold mt-2 font-mono ${parseFloat(revaluation.net_adjustment) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                        {parseFloat(revaluation.net_adjustment) >= 0 ? '+' : ''}
                        {parseFloat(revaluation.net_adjustment).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                </div>
            </div>

            {/* Breakdown Lines Table */}
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border/60">
                    <h2 className="text-base font-bold text-foreground">
                        {t('fx.linesTitle', 'تفاصيل الحسابات وفروقات التقييم')}
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium text-xs">
                            <tr>
                                <th className="p-3.5">{t('accounting.account', 'الحساب')}</th>
                                <th className="p-3.5">{t('fx.currency', 'العملة')}</th>
                                <th className="p-3.5">{t('fx.foreignBalance', 'الرصيد بالعملة')}</th>
                                <th className="p-3.5">{t('fx.bookRate', 'السعر الدفتري')}</th>
                                <th className="p-3.5">{t('fx.closingRate', 'سعر الإقفال')}</th>
                                <th className="p-3.5">{t('fx.bookSar', 'الرصيد الدفتري (SAR)')}</th>
                                <th className="p-3.5">{t('fx.revaluedSar', 'الرصيد بعد التقييم (SAR)')}</th>
                                <th className="p-3.5">{t('fx.adjustment', 'الأثر / الفارق')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {revaluation.lines?.map((line) => (
                                <tr key={line.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-3.5">
                                        <div className="font-bold text-foreground">{line.account?.code} - {line.account?.name_ar || line.account?.name}</div>
                                    </td>
                                    <td className="p-3.5 font-mono font-bold text-foreground">
                                        {line.currency}
                                    </td>
                                    <td className="p-3.5 font-mono font-bold">
                                        {parseFloat(line.foreign_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3.5 font-mono text-xs text-muted-foreground">
                                        {parseFloat(line.book_exchange_rate).toFixed(4)}
                                    </td>
                                    <td className="p-3.5 font-mono text-xs font-bold text-primary">
                                        {parseFloat(line.closing_exchange_rate).toFixed(4)}
                                    </td>
                                    <td className="p-3.5 font-mono text-xs">
                                        {parseFloat(line.book_amount_sar).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3.5 font-mono font-bold text-foreground">
                                        {parseFloat(line.revalued_amount_sar).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3.5 font-mono font-bold">
                                        {line.gain_loss_type === 'gain' ? (
                                            <span className="text-emerald-500">
                                                +{Math.abs(parseFloat(line.adjustment_amount_sar)).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR (ربح)
                                            </span>
                                        ) : line.gain_loss_type === 'loss' ? (
                                            <span className="text-destructive">
                                                -{Math.abs(parseFloat(line.adjustment_amount_sar)).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR (خسارة)
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">0.00 SAR</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Linked Journal Entries */}
            <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-foreground">
                        {t('fx.journalAuditTitle', 'القيود المحاسبية التلقائية المترتبة على إعادة التقييم')}
                    </h2>
                </div>

                {/* Initial Revaluation Entry */}
                {revaluation.journal_entry && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                                <Badge variant="secondary">{t('fx.revalEntryLabel', 'قيد تسوية فروقات أسعار الصرف')}</Badge>
                                <span className="font-mono font-bold text-primary">{revaluation.journal_entry.entry_number}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{revaluation.journal_entry.date}</div>
                        </div>
                        <div className="border border-border/60 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-muted/40 text-muted-foreground text-xs">
                                    <tr>
                                        <th className="p-3">{t('accounting.account', 'الحساب')}</th>
                                        <th className="p-3">{t('accounting.debit', 'مدين')}</th>
                                        <th className="p-3">{t('accounting.credit', 'دائن')}</th>
                                        <th className="p-3">{t('accounting.description', 'البيان')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {revaluation.journal_entry.lines?.map((line) => (
                                        <tr key={line.id}>
                                            <td className="p-3 font-medium">
                                                {line.account?.code} - {line.account?.name_ar || line.account?.name}
                                            </td>
                                            <td className="p-3 font-mono font-bold">
                                                {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 font-mono font-bold">
                                                {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 text-xs text-muted-foreground">{line.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Reversal Entry */}
                {revaluation.reversal_journal_entry && (
                    <div className="space-y-3 pt-4 border-t border-border/60">
                        <div className="flex items-center justify-between text-sm">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                                <Badge variant="secondary">{t('fx.reversalEntryLabel', 'قيد عكس تسوية العملة')}</Badge>
                                <span className="font-mono font-bold text-primary">{revaluation.reversal_journal_entry.entry_number}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{revaluation.reversal_journal_entry.date}</div>
                        </div>
                        <div className="border border-border/60 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-muted/40 text-muted-foreground text-xs">
                                    <tr>
                                        <th className="p-3">{t('accounting.account', 'الحساب')}</th>
                                        <th className="p-3">{t('accounting.debit', 'مدين')}</th>
                                        <th className="p-3">{t('accounting.credit', 'دائن')}</th>
                                        <th className="p-3">{t('accounting.description', 'البيان')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {revaluation.reversal_journal_entry.lines?.map((line) => (
                                        <tr key={line.id}>
                                            <td className="p-3 font-medium">
                                                {line.account?.code} - {line.account?.name_ar || line.account?.name}
                                            </td>
                                            <td className="p-3 font-mono font-bold">
                                                {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 font-mono font-bold">
                                                {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 text-xs text-muted-foreground">{line.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
