import { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Scale, Plus, Trash2, Save, Calendar, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    type: string;
}

interface CostCenter {
    id: string;
    code: string;
    name: string;
}

interface Props {
    accounts: Account[];
    costCenters: CostCenter[];
}

export default function CreateBudget({ accounts, costCenters }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        fiscal_year: new Date().getFullYear(),
        cost_center_id: '',
        notes: '',
        lines: [
            {
                account_id: accounts[0]?.id || '',
                cost_center_id: '',
                period_month: 0,
                planned_amount: '10000',
                notes: '',
            },
        ],
    });

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            {
                account_id: accounts[0]?.id || '',
                cost_center_id: data.cost_center_id || '',
                period_month: 0,
                planned_amount: '0',
                notes: '',
            },
        ]);
    };

    const removeLine = (index: number) => {
        if (data.lines.length <= 1) return;
        setData('lines', data.lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: string, value: any) => {
        const updated = [...data.lines];
        updated[index] = { ...updated[index], [field]: value };
        setData('lines', updated);
    };

    const totalPlanned = useMemo(() => {
        return data.lines.reduce((sum, line) => sum + (parseFloat(line.planned_amount) || 0), 0);
    }, [data.lines]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/accounting/budgets');
    };

    const months = [
        { value: 0, label: t('budgets.annualFullYear', 'كامل السنة المالية (0)') },
        { value: 1, label: t('months.jan', 'يناير (01)') },
        { value: 2, label: t('months.feb', 'فبراير (02)') },
        { value: 3, label: t('months.mar', 'مارس (03)') },
        { value: 4, label: t('months.apr', 'أبريل (04)') },
        { value: 5, label: t('months.may', 'مايو (05)') },
        { value: 6, label: t('months.jun', 'يونيو (06)') },
        { value: 7, label: t('months.jul', 'يوليو (07)') },
        { value: 8, label: t('months.aug', 'أغسطس (08)') },
        { value: 9, label: t('months.sep', 'سبتمبر (09)') },
        { value: 10, label: t('months.oct', 'أكتوبر (10)') },
        { value: 11, label: t('months.nov', 'نوفمبر (11)') },
        { value: 12, label: t('months.dec', 'ديسمبر (12)') },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('budgets.createTitle', 'إعداد موازنة تقديرية جديدة')} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/budgets">
                        <Button variant="outline" size="icon">
                            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Scale className="w-6 h-6 text-primary" />
                            {t('budgets.createTitle', 'إعداد موازنة تقديرية جديدة')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t('budgets.createSubtitle', 'تحديد البنود والحسابات التقديرية وتوزيع المخصصات على مراكز التكلفة والشهور')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                {/* General Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-medium">{t('budgets.name', 'اسم الموازنة')} <span className="text-destructive">*</span></label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="موازنة المصاريف التشغيلية لعام 2026"
                            required
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">{t('budgets.fiscalYear', 'السنة المالية')} <span className="text-destructive">*</span></label>
                        <Input
                            type="number"
                            min="2020"
                            max="2050"
                            value={data.fiscal_year}
                            onChange={(e) => setData('fiscal_year', Number(e.target.value))}
                            required
                        />
                        {errors.fiscal_year && <p className="text-xs text-destructive">{errors.fiscal_year}</p>}
                    </div>

                    <div className="space-y-1.5 sm:col-span-3">
                        <label className="text-sm font-medium">{t('budgets.costCenterOptional', 'مركز التكلفة الرئيسي (اختياري / اتركه فارغاً لموازنة شاملة)')}</label>
                        <select
                            value={data.cost_center_id}
                            onChange={(e) => setData('cost_center_id', e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">-- شامل لكافة فروع ومراكز الشركة --</option>
                            {costCenters.map((cc) => (
                                <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Lines Table */}
                <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-base flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" />
                            {t('budgets.budgetLines', 'بنود وحسابات الموازنة التقديرية')}
                        </h2>
                        <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1">
                            <Plus className="w-3.5 h-3.5" />
                            {t('budgets.addLine', 'إضافة بند حساب')}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {data.lines.map((line, index) => (
                            <div key={index} className="p-3 border rounded-lg bg-muted/20 flex flex-col md:flex-row items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                                    {index + 1}
                                </span>

                                {/* Account */}
                                <div className="flex-1 w-full space-y-1">
                                    <label className="text-[11px] text-muted-foreground">{t('budgets.account', 'الحساب المالي')}</label>
                                    <select
                                        value={line.account_id}
                                        onChange={(e) => updateLine(index, 'account_id', e.target.value)}
                                        className="w-full h-9 px-2 border rounded-md bg-background text-xs"
                                        required
                                    >
                                        {accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name_ar || acc.name} ({acc.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Month */}
                                <div className="w-full md:w-36 space-y-1">
                                    <label className="text-[11px] text-muted-foreground">{t('budgets.periodMonth', 'الفترة / الشهر')}</label>
                                    <select
                                        value={line.period_month}
                                        onChange={(e) => updateLine(index, 'period_month', Number(e.target.value))}
                                        className="w-full h-9 px-2 border rounded-md bg-background text-xs"
                                    >
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cost Center */}
                                <div className="w-full md:w-44 space-y-1">
                                    <label className="text-[11px] text-muted-foreground">{t('budgets.costCenter', 'مركز التكلفة')}</label>
                                    <select
                                        value={line.cost_center_id}
                                        onChange={(e) => updateLine(index, 'cost_center_id', e.target.value)}
                                        className="w-full h-9 px-2 border rounded-md bg-background text-xs"
                                    >
                                        <option value="">-- افتراضي --</option>
                                        {costCenters.map((cc) => (
                                            <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Planned Amount */}
                                <div className="w-full md:w-36 space-y-1">
                                    <label className="text-[11px] text-muted-foreground">{t('budgets.plannedAmount', 'المبلغ المخطط (ر.س)')}</label>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={line.planned_amount}
                                        onChange={(e) => updateLine(index, 'planned_amount', e.target.value)}
                                        required
                                        className="h-9 text-xs font-bold font-mono"
                                    />
                                </div>

                                {data.lines.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLine(index)}
                                        className="text-destructive h-8 w-8 shrink-0 mt-4 md:mt-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Summary Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-xl bg-primary/5">
                    <div>
                        <div className="text-xs text-muted-foreground">{t('budgets.totalPlannedHeader', 'إجمالي الموازنة المخططة المقترحة')}</div>
                        <div className="text-2xl font-bold font-mono text-primary mt-0.5">
                            {totalPlanned.toLocaleString()} ر.س
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/accounting/budgets">
                            <Button type="button" variant="outline">{t('common.cancel', 'إلغاء')}</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="gap-2 font-bold px-6">
                            <Save className="w-4 h-4" />
                            {processing ? t('common.saving', 'جاري الحفظ...') : t('budgets.saveBudget', 'حفظ الموازنة')}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
