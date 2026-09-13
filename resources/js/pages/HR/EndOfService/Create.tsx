import { useState, useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Award, Calculator, Calendar, FileText, Info, ShieldAlert, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface EmployeeItem {
    id: string;
    name: string;
    name_ar?: string;
    employee_number: string;
    hire_date: string;
    gross_salary: string;
    department?: string;
    designation?: string;
}

interface Props {
    employees: EmployeeItem[];
    branches: Array<{ id: string; name: string }>;
}

export default function CreateEndOfService({ employees, branches }: Props) {
    const { t, isRtl } = useTranslation();

    const form = useForm({
        employee_id: employees[0]?.id || '',
        branch_id: branches[0]?.id || '',
        termination_type: 'resignation', // resignation, contract_end, employer_termination, article_87
        last_working_date: new Date().toISOString().split('T')[0],
        unused_leave_days: '0',
        other_entitlements: '0',
        deductions_amount: '0',
        notes: '',
    });

    const selectedEmp = employees.find((e) => e.id === form.data.employee_id) || employees[0];

    // Dynamic Live Calculation
    const calc = useMemo(() => {
        if (!selectedEmp || !selectedEmp.hire_date) {
            return null;
        }

        const hire = new Date(selectedEmp.hire_date);
        const last = new Date(form.data.last_working_date);
        const diffMs = Math.max(0, last.getTime() - hire.getTime());
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const serviceYears = Number((totalDays / 365.25).toFixed(4));

        const grossSalary = Number(selectedEmp.gross_salary) || 0;
        const dailyWage = grossSalary / 30;

        // Article 84: 0.5 month wage for first 5 years, 1.0 month wage for each subsequent year
        const first5Years = Math.min(5, serviceYears);
        const remainingYears = Math.max(0, serviceYears - 5);

        const firstPeriodGratuity = 0.5 * grossSalary * first5Years;
        const secondPeriodGratuity = 1.0 * grossSalary * remainingYears;
        const fullGratuity = firstPeriodGratuity + secondPeriodGratuity;

        // Article 85: Entitlement rate for resignation
        let rate = 1.0;
        let rateExplanation = '';

        if (form.data.termination_type === 'resignation') {
            if (serviceYears < 2) {
                rate = 0.0;
                rateExplanation = t('hr.eos.resignUnder2', 'أقل من سنتين خدمة: لا يستحق مكافأة (المادة 85)');
            } else if (serviceYears < 5) {
                rate = 1 / 3;
                rateExplanation = t('hr.eos.resign2to5', 'من سنتين إلى 5 سنوات: يستحق ثلث المكافأة (33.3%) بموجب المادة 85');
            } else if (serviceYears < 10) {
                rate = 2 / 3;
                rateExplanation = t('hr.eos.resign5to10', 'من 5 إلى 10 سنوات: يستحق ثلثي المكافأة (66.7%) بموجب المادة 85');
            } else {
                rate = 1.0;
                rateExplanation = t('hr.eos.resign10Plus', '10 سنوات فأكثر: يستحق المكافأة كاملة (100%) بموجب المادة 85');
            }
        } else {
            rate = 1.0;
            rateExplanation = t('hr.eos.fullEntitlement', 'استحقاق كامل بنسبة 100% بموجب المادة 84 / 87');
        }

        const payableGratuity = fullGratuity * rate;
        const leaveDays = Number(form.data.unused_leave_days) || 0;
        const leaveComp = leaveDays * dailyWage;
        const otherEnt = Number(form.data.other_entitlements) || 0;
        const deductions = Number(form.data.deductions_amount) || 0;

        const netPayout = Math.max(0, payableGratuity + leaveComp + otherEnt - deductions);

        return {
            totalDays,
            serviceYears,
            grossSalary,
            dailyWage,
            first5Years,
            remainingYears,
            fullGratuity,
            rate,
            rateExplanation,
            payableGratuity,
            leaveComp,
            netPayout,
        };
    }, [selectedEmp, form.data.last_working_date, form.data.termination_type, form.data.unused_leave_days, form.data.other_entitlements, form.data.deductions_amount]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/hr/end-of-service');
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('hr.eos.createTitle', 'احتساب وتصفية مكافأة نهاية الخدمة')} />

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Link href="/hr/end-of-service" className="hover:text-zinc-900 dark:hover:text-zinc-100">{t('hr.eos.title', 'مكافأة نهاية الخدمة')}</Link>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">{t('hr.eos.createTitle', 'احتساب جديد')}</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Award className="w-6 h-6 text-indigo-600" />
                        {t('hr.eos.createHeading', 'احتساب مكافأة نهاية الخدمة وفق نظام العمل السعودي')}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {t('hr.eos.createSub', 'المادتين 84 و 85: احتساب فترات الخدمة، نسب الاستحقاق، التعويض عن رصيد الإجازات، والخصومات')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.employee', 'الموظف المراد تصفية مستحقاته')}</label>
                            <select
                                value={form.data.employee_id}
                                onChange={(e) => form.setData('employee_id', e.target.value)}
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.employee_number}) - {emp.department}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.eos.termType', 'سبب انتهاء العلاقة العمالية')}</label>
                            <select
                                value={form.data.termination_type}
                                onChange={(e) => form.setData('termination_type', e.target.value as any)}
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="resignation">{t('hr.eos.resignationOpt', 'استقالة الموظف (المادة 85)')}</option>
                                <option value="contract_end">{t('hr.eos.contractEndOpt', 'انتهاء مدة العقد المحدد / اتفاق الطرفين (المادة 84)')}</option>
                                <option value="employer_termination">{t('hr.eos.employerTermOpt', 'إنهاء من صاحب العمل / فسخ لسبب غير مشروع (المادة 77)')}</option>
                                <option value="article_87">{t('hr.eos.art87Opt', 'ترك العمل لظروف استثنائية أو قوة قاهرة (المادة 87)')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.eos.lastWorkingDate', 'تاريخ آخر يوم عمل (تاريخ نهاية الخدمة)')}</label>
                            <Input
                                type="date"
                                value={form.data.last_working_date}
                                onChange={(e) => form.setData('last_working_date', e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.eos.unusedLeaves', 'رصيد الإجازات السنوية غير المستخدمة (بالأيام)')}</label>
                            <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={form.data.unused_leave_days}
                                onChange={(e) => form.setData('unused_leave_days', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.eos.otherEntitlements', 'مستحقات أو بدلات إضافية (SAR)')}</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.other_entitlements}
                                onChange={(e) => form.setData('other_entitlements', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.eos.deductions', 'استقطاعات / سلف متبقية / عهد (SAR)')}</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.deductions_amount}
                                onChange={(e) => form.setData('deductions_amount', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Live Calculation Card */}
                    {calc && (
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-zinc-800/70 dark:to-zinc-800/40 border border-indigo-200 dark:border-zinc-700 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-zinc-700 pb-3">
                                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
                                    <Calculator className="w-5 h-5 text-indigo-600" />
                                    <span>{t('hr.eos.calcSummary', 'ملخص الاحتساب القانوني المباشر')}</span>
                                </div>
                                <span className="text-xs font-mono bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-zinc-700">
                                    {t('hr.eos.hireDate', 'تاريخ التعيين')}: {selectedEmp.hire_date}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div className="bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-indigo-100 dark:border-zinc-700">
                                    <span className="text-xs text-zinc-400 block">{t('hr.eos.serviceDuration', 'مدة الخدمة الفعلية')}</span>
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{calc.serviceYears} {t('common.years', 'سنة')}</span>
                                    <span className="text-xs text-zinc-400 block">({calc.totalDays} {t('common.days', 'يوم')})</span>
                                </div>

                                <div className="bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-indigo-100 dark:border-zinc-700">
                                    <span className="text-xs text-zinc-400 block">{t('hr.eos.baseWage', 'أجر الاحتساب (الراتب الأخير)')}</span>
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{calc.grossSalary.toLocaleString()} SAR</span>
                                    <span className="text-xs text-zinc-400 block">{calc.dailyWage.toFixed(2)} SAR/{t('common.day', 'يوم')}</span>
                                </div>

                                <div className="bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-indigo-100 dark:border-zinc-700">
                                    <span className="text-xs text-zinc-400 block">{t('hr.eos.baseGratuity', 'المكافأة قبل نسبة الاستحقاق')}</span>
                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{calc.fullGratuity.toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR</span>
                                </div>

                                <div className="bg-white dark:bg-zinc-800/80 p-3 rounded-xl border border-indigo-100 dark:border-zinc-700">
                                    <span className="text-xs text-zinc-400 block">{t('hr.eos.entitlementRate', 'نسبة الاستحقاق القانوني')}</span>
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{(calc.rate * 100).toFixed(1)}%</span>
                                </div>
                            </div>

                            {/* Alert Explanation */}
                            <div className="flex items-start gap-2 text-xs bg-white/70 dark:bg-zinc-800/50 p-3 rounded-xl border border-indigo-100 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                <span>{calc.rateExplanation}</span>
                            </div>

                            {/* Final Totals Breakdown */}
                            <div className="border-t border-indigo-200 dark:border-zinc-700 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                                    <div>{t('hr.eos.gratuityPayable', 'مكافأة نهاية الخدمة المستحقة')}: <strong className="text-zinc-900 dark:text-zinc-100">{calc.payableGratuity.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</strong></div>
                                    <div>{t('hr.eos.leavePayout', 'بدل رصيد الإجازات المستحق')}: <strong className="text-zinc-900 dark:text-zinc-100">{calc.leaveComp.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</strong></div>
                                </div>

                                <div className="text-right rtl:text-left bg-white dark:bg-zinc-800 p-4 rounded-xl border border-indigo-200 dark:border-zinc-700">
                                    <div className="text-xs text-zinc-400">{t('hr.eos.netFinalPayout', 'صافي مبلغ التصفية الإجمالي')}</div>
                                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {calc.netPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('common.notes', 'ملاحظات إضافية')}</label>
                        <textarea
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            rows={3}
                            placeholder={t('hr.eos.notesPlaceholder', 'أي تسويات خاصة أو تفاصيل إبراء الذمة...')}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <Link href="/hr/end-of-service">
                            <Button type="button" variant="outline">{t('common.cancel', 'إلغاء')}</Button>
                        </Link>
                        <Button type="submit" disabled={form.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {t('hr.eos.saveRecord', 'حفظ سجل المخالصة')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
