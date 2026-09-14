import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Award,
    BookOpen,
    CheckCircle2,
    Clock,
    DollarSign,
    HandCoins,
    Printer,
    ShieldCheck,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface RunLine {
    id: string;
    sales_representative_id: string;
    sales_target: string;
    achieved_sales: string;
    achievement_rate: string;
    commission_amount: string;
    bonus_amount: string;
    deductions_amount: string;
    net_payable: string;
    representative?: {
        id: string;
        code: string;
        name: string;
        name_ar?: string;
        phone?: string;
        plan?: { name: string };
        branch?: { name: string };
    };
}

interface Props {
    run: {
        id: string;
        run_number: string;
        period_start: string;
        period_end: string;
        basis: 'invoiced_sales' | 'collected_cash';
        status: 'draft' | 'approved' | 'settled' | 'cancelled';
        total_eligible_sales: string;
        total_commission_amount: string;
        total_bonus_amount: string;
        total_deductions: string;
        total_net_payable: string;
        settled_at?: string;
        notes?: string;
        creator?: { name: string };
        approver?: { name: string };
        lines: RunLine[];
        journalEntry?: {
            id: string;
            entry_number: string;
            lines: Array<{
                id: string;
                debit: string;
                credit: string;
                description: string;
                account?: { code: string; name: string; name_ar?: string };
            }>;
        };
        paymentJournal?: {
            id: string;
            entry_number: string;
            lines: Array<{
                id: string;
                debit: string;
                credit: string;
                description: string;
                account?: { code: string; name: string; name_ar?: string };
            }>;
        };
    };
}

export default function ShowCommissionRun({ run }: Props) {
    const { t, isRtl } = useTranslation();
    const settleForm = useForm({
        disburse_from_bank: true,
    });

    const handleSettle = () => {
        if (confirm(t('trade.commissions.confirmSettle', 'هل تريد بالتأكيد اعتماد مسير العمولات وترحيل قيود اليومية العامة لدفتر الأستاذ؟'))) {
            settleForm.post(`/trade/commissions/${run.id}/settle`);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`${t('trade.commissions.title', 'مسير العمولات')} - ${run.run_number}`} />

            {/* Breadcrumb & Top Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Link href="/trade/commissions" className="hover:text-zinc-900 dark:hover:text-zinc-100">
                        {t('trade.commissions.title', 'عمولات المبيعات')}
                    </Link>
                    {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">{run.run_number}</span>
                </div>

                <div className="flex items-center gap-3">
                    {run.status !== 'settled' && (
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 font-medium cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settleForm.data.disburse_from_bank}
                                    onChange={(e) => settleForm.setData('disburse_from_bank', e.target.checked)}
                                    className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                {t('trade.commissions.directDisburse', 'الصرف الفوري من البنك (حـ/ 1020)')}
                            </label>

                            <Button
                                onClick={handleSettle}
                                disabled={settleForm.processing}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                {t('trade.commissions.settleAction', 'اعتماد وترحيل المسير للدفتر العام')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Header Status Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{run.run_number}</h1>
                            {run.status === 'settled' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {t('trade.commissions.settledBadge', 'معتمد ومرحل دفترياً')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                    <Clock className="w-4 h-4" />
                                    {t('trade.commissions.draftBadge', 'مسودة قيد المراجعة')}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-zinc-500 mt-1 font-mono">
                            {t('trade.commissions.period', 'الفترة')}: {run.period_start} إلى {run.period_end} • {run.basis === 'invoiced_sales' ? 'أساس المبيعات المفوترة' : 'أساس التحصيل النقدي'}
                        </p>
                    </div>

                    <div className="text-end">
                        <span className="text-xs text-zinc-400 uppercase font-semibold">{t('trade.commissions.netPayableTotal', 'صافي العمولات المعتمدة')}</span>
                        <div className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {Number(run.total_net_payable).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            <span className="text-sm font-sans font-normal ms-1 text-zinc-500">SAR</span>
                        </div>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                        <span className="text-xs text-zinc-500">{t('trade.commissions.eligibleSales', 'إجمالي المبيعات')}</span>
                        <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                            {Number(run.total_eligible_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                        <span className="text-xs text-zinc-500">{t('trade.commissions.baseCommissions', 'العمولات الأساسية')}</span>
                        <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                            {Number(run.total_commission_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                        <span className="text-xs text-zinc-500">{t('trade.commissions.targetBonus', 'بونص المستهدف')}</span>
                        <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                            {Number(run.total_bonus_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40">
                        <span className="text-xs text-zinc-500">{t('trade.commissions.repsCount', 'عدد المناديب')}</span>
                        <div className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                            {run.lines.length} {t('trade.commissions.repUnit', 'مندوب')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Lines Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm space-y-4">
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        {t('trade.commissions.repBreakdown', 'كشف عمولات المندوبين المفصل')}
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 text-xs uppercase font-medium border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-5 py-3 text-start">{t('trade.commissions.rep', 'المندوب')}</th>
                                <th className="px-5 py-3 text-end">{t('trade.commissions.target', 'المستهدف')}</th>
                                <th className="px-5 py-3 text-end">{t('trade.commissions.achieved', 'المحقق')}</th>
                                <th className="px-5 py-3 text-center">{t('trade.commissions.rate', 'الإنجاز')}</th>
                                <th className="px-5 py-3 text-end">{t('trade.commissions.comm', 'العمولة')}</th>
                                <th className="px-5 py-3 text-end">{t('trade.commissions.bonus', 'البونص')}</th>
                                <th className="px-5 py-3 text-end">{t('trade.commissions.net', 'الصافي')}</th>
                                <th className="px-5 py-3 text-end">{t('common.print', 'السند')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
                            {run.lines.map((line) => (
                                <tr key={line.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                                    <td className="px-5 py-3.5 font-sans font-medium text-zinc-900 dark:text-zinc-100">
                                        {line.representative?.name}
                                        <span className="block text-xs font-mono text-zinc-400">{line.representative?.code}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-end text-zinc-600 dark:text-zinc-400">
                                        {Number(line.sales_target).toLocaleString()} SAR
                                    </td>
                                    <td className="px-5 py-3.5 text-end font-semibold text-zinc-900 dark:text-zinc-100">
                                        {Number(line.achieved_sales).toLocaleString()} SAR
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
                                            Number(line.achievement_rate) >= 100
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                        }`}>
                                            {Number(line.achievement_rate).toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-end text-zinc-900 dark:text-zinc-100">
                                        {Number(line.commission_amount).toLocaleString()} SAR
                                    </td>
                                    <td className="px-5 py-3.5 text-end text-purple-600 dark:text-purple-400 font-semibold">
                                        {Number(line.bonus_amount).toLocaleString()} SAR
                                    </td>
                                    <td className="px-5 py-3.5 text-end text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                        {Number(line.net_payable).toLocaleString()} SAR
                                    </td>
                                    <td className="px-5 py-3.5 text-end">
                                        <Link href={`/trade/commissions/${run.id}/lines/${line.id}/print`}>
                                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-indigo-600">
                                                <Printer className="w-3.5 h-3.5" />
                                                {t('common.print', 'كشف')}
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* General Ledger Journal Entries (Double-Entry Verification) */}
            {(run.journalEntry || run.paymentJournal) && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        {t('trade.commissions.glTitle', 'قيود اليومية العامة المرحلة (General Ledger Entries)')}
                    </h3>

                    {/* Accrual Journal */}
                    {run.journalEntry && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                    قيد الاستحقاق (Accrual Journal): {run.journalEntry.entry_number}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">Posted</span>
                            </div>

                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                                <table className="w-full text-xs font-mono text-start">
                                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500">
                                        <tr>
                                            <th className="p-3 text-start">الحساب / Account</th>
                                            <th className="p-3 text-end">مدين / Debit</th>
                                            <th className="p-3 text-end">دائن / Credit</th>
                                            <th className="p-3 text-start">البيان / Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {run.journalEntry.lines.map((l) => (
                                            <tr key={l.id}>
                                                <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">
                                                    {l.account?.code} - {isRtl ? (l.account?.name_ar || l.account?.name) : l.account?.name}
                                                </td>
                                                <td className="p-3 text-end font-bold text-emerald-600">
                                                    {Number(l.debit) > 0 ? `${Number(l.debit).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR` : '-'}
                                                </td>
                                                <td className="p-3 text-end font-bold text-indigo-600">
                                                    {Number(l.credit) > 0 ? `${Number(l.credit).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR` : '-'}
                                                </td>
                                                <td className="p-3 text-zinc-500 font-sans">{l.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Payment Journal */}
                    {run.paymentJournal && (
                        <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between text-xs font-mono">
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                                    قيد الصرف البنكي (Bank Payment Journal): {run.paymentJournal.entry_number}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">Posted</span>
                            </div>

                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                                <table className="w-full text-xs font-mono text-start">
                                    <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500">
                                        <tr>
                                            <th className="p-3 text-start">الحساب / Account</th>
                                            <th className="p-3 text-end">مدين / Debit</th>
                                            <th className="p-3 text-end">دائن / Credit</th>
                                            <th className="p-3 text-start">البيان / Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {run.paymentJournal.lines.map((l) => (
                                            <tr key={l.id}>
                                                <td className="p-3 font-semibold text-zinc-900 dark:text-zinc-100">
                                                    {l.account?.code} - {isRtl ? (l.account?.name_ar || l.account?.name) : l.account?.name}
                                                </td>
                                                <td className="p-3 text-end font-bold text-emerald-600">
                                                    {Number(l.debit) > 0 ? `${Number(l.debit).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR` : '-'}
                                                </td>
                                                <td className="p-3 text-end font-bold text-indigo-600">
                                                    {Number(l.credit) > 0 ? `${Number(l.credit).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR` : '-'}
                                                </td>
                                                <td className="p-3 text-zinc-500 font-sans">{l.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
