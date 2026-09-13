import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Calculator, HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface EmployeeItem {
    id: string;
    name: string;
    name_ar?: string;
    employee_number: string;
    basic_salary: string;
    gross_salary: string;
}

interface Props {
    employees: EmployeeItem[];
    branches: Array<{ id: string; name: string }>;
}

export default function CreateLoan({ employees, branches }: Props) {
    const { t, isRtl } = useTranslation();

    const form = useForm({
        employee_id: employees[0]?.id || '',
        branch_id: branches[0]?.id || '',
        total_amount: '5000',
        installments_count: '10',
        start_date: new Date().toISOString().split('T')[0],
        reason: '',
    });

    const selectedEmployee = employees.find((e) => e.id === form.data.employee_id);
    const amountNum = Number(form.data.total_amount) || 0;
    const countNum = Number(form.data.installments_count) || 1;
    const calculatedInstallment = countNum > 0 ? (amountNum / countNum).toFixed(2) : '0.00';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/hr/loans');
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('hr.loans.newLoan', 'تسجيل سلفة موظف جديدة')} />

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Link href="/hr/loans" className="hover:text-zinc-900 dark:hover:text-zinc-100">{t('hr.loans.title', 'سلف وقروض الموظفين')}</Link>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                <span className="text-zinc-900 dark:text-zinc-100 font-medium">{t('hr.loans.newLoan', 'تسجيل سلفة جديدة')}</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <HandCoins className="w-6 h-6 text-indigo-600" />
                        {t('hr.loans.newLoan', 'تسجيل سلفة موظف وتوليد جدول الأقساط')}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {t('hr.loans.newSubtitle', 'سيتم جدولة الأقساط الشهرية وخصمها آلياً من مسير الرواتب الشهري للموظف')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.employee', 'الموظف')}</label>
                            <select
                                value={form.data.employee_id}
                                onChange={(e) => form.setData('employee_id', e.target.value)}
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                required
                            >
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.employee_number}) - {t('hr.gross', 'الراتب')}: {Number(emp.gross_salary).toLocaleString()} SAR
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('common.branch', 'الفرع')}</label>
                            <select
                                value={form.data.branch_id}
                                onChange={(e) => form.setData('branch_id', e.target.value)}
                                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.loans.amount', 'مبلغ السلفة (SAR)')}</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="1"
                                value={form.data.total_amount}
                                onChange={(e) => form.setData('total_amount', e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.loans.installmentsCount', 'عدد الأقساط الشهرية')}</label>
                            <Input
                                type="number"
                                min="1"
                                max="60"
                                value={form.data.installments_count}
                                onChange={(e) => form.setData('installments_count', e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.loans.startDate', 'تاريخ بدء أول قسط')}</label>
                            <Input
                                type="date"
                                value={form.data.start_date}
                                onChange={(e) => form.setData('start_date', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Live Calculation Preview Banner */}
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 text-white rounded-lg">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">{t('hr.loans.monthlyDeduction', 'قيمة القسط الشهري المحسوب')}</div>
                                <div className="text-xs text-indigo-600 dark:text-indigo-400">{t('hr.loans.installmentNote', 'سيتم خصم هذا المبلغ شهرياً من راتب الموظف في مسير الرواتب')}</div>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                            {Number(calculatedInstallment).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR / شهر
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('common.reason', 'سبب السلفة والملاحظات الإدارية')}</label>
                        <textarea
                            value={form.data.reason}
                            onChange={(e) => form.setData('reason', e.target.value)}
                            rows={3}
                            placeholder={t('hr.loans.reasonPlaceholder', 'مثلاً: سلفة زواج، ظرف طارئ، مصاريف علاجية...')}
                            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <Link href="/hr/loans">
                            <Button type="button" variant="outline">{t('common.cancel', 'إلغاء')}</Button>
                        </Link>
                        <Button type="submit" disabled={form.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {t('hr.loans.confirmSave', 'اعتماد السلفة وتوليد الأقساط')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
