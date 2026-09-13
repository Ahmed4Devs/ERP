import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Lock, CheckCircle2, AlertTriangle, Eye, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface PreviewData {
    fiscal_year: number;
    start_date: string;
    end_date: string;
    total_revenue: number;
    total_expenses: number;
    net_profit_loss: number;
    revenue_lines: Array<{ account_id: string; code: string; name: string; name_ar?: string; balance: number }>;
    expense_lines: Array<{ account_id: string; code: string; name: string; name_ar?: string; balance: number }>;
    retained_earnings_account?: { id: string; code: string; name: string };
}

interface Props {
    preview: PreviewData;
    selectedYear: number;
}

export default function YearEndClosingCreate({ preview, selectedYear }: Props) {
    const { t, isRtl } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    const [year, setYear] = useState(selectedYear);

    const handleYearChange = (newYear: number) => {
        setYear(newYear);
        router.get('/accounting/year-end-closing/create', { year: newYear }, { preserveState: true });
    };

    const { data, setData, post, processing } = useForm({
        fiscal_year: selectedYear,
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (confirm(t('yearEndClosing.confirmPrompt', `هل أنت متأكد من إقفال السنة المالية ${data.fiscal_year}؟ سيتم إنشاء قيد الإقفال السنوي وتصفير حسابات الإيرادات والمصروفات وترحيل الصافي للأرباح المبقاة وقفل جميع فترات السنة.`))) {
            post('/accounting/year-end-closing');
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.accounting', 'المحاسبة المالية'), href: '/accounting' },
            { title: t('nav.yearEndClosing', 'إقفال السنة المالية'), href: '/accounting/year-end-closing' },
            { title: t('common.execute', 'تنفيذ الإقفال'), href: '/accounting/year-end-closing/create' }
        ]}>
            <Head title={t('yearEndClosing.createTitle', 'تنفيذ إقفال السنة المالية')} />

            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/year-end-closing">
                        <Button variant="ghost" size="icon">
                            <BackIcon className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {t('yearEndClosing.createTitle', 'معاينة وتنفيذ إقفال السنة المالية')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('yearEndClosing.createSubtitle', 'مراجعة أرصدة الإيرادات والمصروفات وقيد الإقفال المقترح قبل الترحيل النهائي')}
                        </p>
                    </div>
                </div>

                {/* Year Selector */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">{t('yearEndClosing.selectYear', 'اختر السنة المالية المراد إقفالها')}</label>
                        <select
                            className="h-10 rounded-lg border border-input bg-background px-3 font-mono font-bold text-base text-foreground shadow-sm"
                            value={data.fiscal_year}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setData('fiscal_year', val);
                                handleYearChange(val);
                            }}
                        >
                            {[2024, 2025, 2026, 2027].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    <div className="text-end">
                        <p className="text-xs text-muted-foreground">{t('yearEndClosing.retainedAccount', 'حساب الأرباح المبقاة المستهدف')}</p>
                        <p className="font-mono font-bold text-sm text-foreground">
                            {preview.retained_earnings_account ? `${preview.retained_earnings_account.code} - ${preview.retained_earnings_account.name}` : 'غير معرف!'}
                        </p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('accounting.revenue', 'إجمالي الإيرادات المراد تصفيرها')}</p>
                        <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                            {preview.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('accounting.expenses', 'إجمالي المصروفات المراد تصفيرها')}</p>
                        <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                            {preview.total_expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('accounting.netProfitLoss', 'صافي النتيجة (ترحيل لـ 3200)')}</p>
                        <p className={`text-2xl font-bold font-mono mt-1 ${preview.net_profit_loss >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {preview.net_profit_loss >= 0 ? '+' : ''}{preview.net_profit_loss.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                {/* Account Tables Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Revenues */}
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            {t('accounting.revenueAccounts', 'حسابات الإيرادات (تُقفل بجعلها مدينة)')}
                        </h3>
                        <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                            <table className="w-full text-xs text-start">
                                <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                                    <tr>
                                        <th className="py-2 px-3 text-start">الحساب</th>
                                        <th className="py-2 px-3 text-end">الرصيد الدائن</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {preview.revenue_lines.length === 0 ? (
                                        <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">لا توجد حركات إيرادات مسجلة</td></tr>
                                    ) : (
                                        preview.revenue_lines.map((r) => (
                                            <tr key={r.account_id}>
                                                <td className="py-2 px-3"><span className="font-mono font-medium">{r.code}</span> - {isRtl ? (r.name_ar || r.name) : r.name}</td>
                                                <td className="py-2 px-3 text-end font-mono font-semibold text-emerald-600 dark:text-emerald-400">{r.balance.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                            {t('accounting.expenseAccounts', 'حسابات المصروفات (تُقفل بجعلها دائنة)')}
                        </h3>
                        <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                            <table className="w-full text-xs text-start">
                                <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                                    <tr>
                                        <th className="py-2 px-3 text-start">الحساب</th>
                                        <th className="py-2 px-3 text-end">الرصيد المدين</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {preview.expense_lines.length === 0 ? (
                                        <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">لا توجد حركات مصروفات مسجلة</td></tr>
                                    ) : (
                                        preview.expense_lines.map((e) => (
                                            <tr key={e.account_id}>
                                                <td className="py-2 px-3"><span className="font-mono font-medium">{e.code}</span> - {isRtl ? (e.name_ar || e.name) : e.name}</td>
                                                <td className="py-2 px-3 text-end font-mono font-semibold text-rose-600 dark:text-rose-400">{e.balance.toFixed(2)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Execution Form */}
                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">{t('common.notes', 'ملاحظات إقفال السنة المالية')}</label>
                        <Input
                            placeholder={t('yearEndClosing.notesPlaceholder', 'مثال: إقفال حسابات السنة المالية 2025 بعد انتهاء المراجعة الخارجية')}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Link href="/accounting/year-end-closing">
                            <Button type="button" variant="outline">
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-amber-600 hover:bg-amber-500 text-white gap-2 shadow-sm"
                        >
                            <Lock className="w-4 h-4" />
                            {processing ? t('common.processing', 'جاري الإقفال...') : t('yearEndClosing.submitBtn', 'تأكيد وترحيل إقفال السنة المالية')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
