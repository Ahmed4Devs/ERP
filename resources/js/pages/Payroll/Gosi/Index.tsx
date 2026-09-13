import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ShieldCheck,
    Download,
    BookOpen,
    Users,
    CheckCircle2,
    DollarSign,
    Calendar,
    ArrowLeft,
    ArrowRight,
    Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface PayrollRunRef {
    id: string;
    run_number: string;
    period_year: number;
    period_month: number;
    status: string;
    total_net: string;
}

interface GosiEmployeeItem {
    payslip_id: string;
    employee_id: string;
    employee_number: string;
    employee_name: string;
    national_id?: string;
    gosi_number?: string;
    is_saudi: boolean;
    nationality: string;
    basic_salary: string;
    housing_allowance: string;
    contributory_wage: string;
    employee_rate_percent: number;
    employer_rate_percent: number;
    employee_deduction: string;
    employer_contribution: string;
    total_remittance: string;
}

interface GosiSummary {
    run_id: string;
    run_number: string;
    period_year: number;
    period_month: number;
    total_saudi_employees: number;
    total_non_saudi_employees: number;
    total_employees: number;
    total_contributory_wage: string;
    total_employee_deductions: string;
    total_employer_contributions: string;
    grand_total_payable: string;
    details: GosiEmployeeItem[];
}

interface Props {
    runs: PayrollRunRef[];
    selectedRunId?: string;
    selectedRun?: PayrollRunRef;
    gosiData?: GosiSummary;
}

export default function GosiReportIndex({
    runs,
    selectedRunId,
    selectedRun,
    gosiData,
}: Props) {
    const { t, isRtl } = useTranslation();
    const [posting, setPosting] = useState(false);

    const handleRunChange = (runId: string) => {
        router.get('/payroll/gosi', { run_id: runId }, { preserveState: true, replace: true });
    };

    const handlePostEmployerContribution = () => {
        if (!selectedRunId) return;
        if (!confirm(t('payroll.gosi.confirmPost', 'هل أنت متأكد من ترحيل قيد حصة صاحب العمل في التأمينات الاجتماعية إلى دفتر الأستاذ العام؟'))) {
            return;
        }

        setPosting(true);
        router.post(`/payroll/gosi/${selectedRunId}/post-employer`, {}, {
            onFinish: () => setPosting(false),
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('payroll.gosi.title', 'كشف التأمينات الاجتماعية والاشتراكات الشهرية')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <ShieldCheck className="h-6 w-6 text-emerald-600" />
                        <span>{t('payroll.gosi.title', 'نظام التأمينات الاجتماعية والاشتراكات الشهرية (Saudi GOSI Returns)')}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {t('payroll.gosi.subtitle', 'احتساب حصة الموظف وحصة المنشأة، الأجور الخاضعة للاشتراك بسقف 45 ألف ريال، وتوليد ملفات البوابة المعتمدة')}
                    </p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                    {selectedRunId && (
                        <>
                            <a href={`/payroll/gosi/export?run_id=${selectedRunId}`} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
                                    <Download className="h-4 w-4" />
                                    <span>{t('payroll.gosi.exportCsv', 'تصدير ملف التأمينات (CSV)')}</span>
                                </Button>
                            </a>

                            <Button
                                onClick={handlePostEmployerContribution}
                                disabled={posting}
                                size="sm"
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                                <BookOpen className="h-4 w-4" />
                                <span>{posting ? t('common.posting', 'جاري الترحيل...') : t('payroll.gosi.postGl', 'ترحيل حصة المنشأة لدفتر الأستاذ')}</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Run Selection Card */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Calendar className="h-5 w-5 text-neutral-400" />
                    <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {t('payroll.gosi.selectRun', 'اختر مسير الرواتب المعتمد:')}
                    </span>
                    <select
                        value={selectedRunId || ''}
                        onChange={(e) => handleRunChange(e.target.value)}
                        className="rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-1.5 text-sm font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        {runs.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.run_number} ({r.period_year}/{r.period_month}) - {r.status}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedRun && (
                    <div className="text-xs text-neutral-500 font-mono">
                        {t('payroll.gosi.activeRunNumber', 'رقم المسير:')}{' '}
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">{selectedRun.run_number}</span>
                    </div>
                )}
            </div>

            {/* KPI Cards */}
            {gosiData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Insured Saudis */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                {t('payroll.gosi.saudiEmployees', 'الموظفين السعوديين (معاشات + ساند)')}
                            </p>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                                {gosiData.total_saudi_employees} <span className="text-xs font-normal text-neutral-400">موظف (21.5%)</span>
                            </p>
                        </div>
                        <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg flex items-center justify-center text-emerald-600">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>

                    {/* Insured Non-Saudis */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                {t('payroll.gosi.nonSaudiEmployees', 'الموظفين غير السعوديين (أخطار مهنية)')}
                            </p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                                {gosiData.total_non_saudi_employees} <span className="text-xs font-normal text-neutral-400">موظف (2%)</span>
                            </p>
                        </div>
                        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/50 rounded-lg flex items-center justify-center text-blue-600">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>

                    {/* Employer Share */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                {t('payroll.gosi.employerShare', 'مساهمة المنشأة (صاحب العمل)')}
                            </p>
                            <p className="text-xl font-bold font-mono text-purple-700 dark:text-purple-300 mt-1">
                                {Number(gosiData.total_employer_contributions).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </p>
                        </div>
                        <div className="h-10 w-10 bg-purple-50 dark:bg-purple-950/50 rounded-lg flex items-center justify-center text-purple-600">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>

                    {/* Total Remittance */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/60 shadow-sm flex items-center justify-between bg-emerald-50/20">
                        <div>
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                {t('payroll.gosi.grandTotal', 'إجمالي السداد المستحق للتأمينات')}
                            </p>
                            <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                                {Number(gosiData.grand_total_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </p>
                        </div>
                        <div className="h-10 w-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b dark:border-neutral-800 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>{t('payroll.gosi.breakdownTitle', 'كشف تفاصيل اشتراكات الموظفين الخاضعين للتأمينات')}</span>
                    </h2>
                    {gosiData && (
                        <span className="text-xs text-neutral-500 font-mono">
                            {gosiData.details.length} {t('payroll.gosi.subscribersCount', 'مشترك')}
                        </span>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-medium text-xs">
                            <tr>
                                <th className="px-4 py-3 text-start">{t('payroll.gosi.employee', 'الموظف')}</th>
                                <th className="px-4 py-3 text-start">{t('payroll.gosi.idNumber', 'رقم الهوية / الإقامة')}</th>
                                <th className="px-4 py-3 text-start">{t('payroll.gosi.nationality', 'الجنسية')}</th>
                                <th className="px-4 py-3 text-end">{t('payroll.gosi.contributoryWage', 'الأجر الخاضع (سقف 45 ألف)')}</th>
                                <th className="px-4 py-3 text-end">{t('payroll.gosi.employeeShare', 'حصة الموظف')}</th>
                                <th className="px-4 py-3 text-end">{t('payroll.gosi.employerShare', 'حصة المنشأة')}</th>
                                <th className="px-4 py-3 text-end">{t('payroll.gosi.totalRemittance', 'إجمالي الاشتراك')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {!gosiData || gosiData.details.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                                        <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p>{t('payroll.gosi.noData', 'يرجى اختيار مسير رواتب معتمد لعرض كشف التأمينات')}</p>
                                    </td>
                                </tr>
                            ) : (
                                gosiData.details.map((item) => (
                                    <tr key={item.payslip_id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">
                                                {item.employee_name}
                                            </p>
                                            <p className="text-[10px] text-neutral-400 font-mono">
                                                {item.employee_number}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs font-mono text-neutral-700 dark:text-neutral-300">
                                            {item.national_id || '-'}
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span
                                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                                                    item.is_saudi
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                                        : 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                                                }`}
                                            >
                                                {item.nationality}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-end font-mono text-neutral-900 dark:text-neutral-100 font-semibold text-xs">
                                            {Number(item.contributory_wage).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-4 py-3.5 text-end font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            <div>{Number(item.employee_deduction).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</div>
                                            <div className="text-[10px] text-neutral-400">({item.employee_rate_percent}%)</div>
                                        </td>
                                        <td className="px-4 py-3.5 text-end font-mono text-xs text-purple-700 dark:text-purple-400 font-medium">
                                            <div>{Number(item.employer_contribution).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</div>
                                            <div className="text-[10px] text-purple-500">({item.employer_rate_percent}%)</div>
                                        </td>
                                        <td className="px-4 py-3.5 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100 text-xs">
                                            {Number(item.total_remittance).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {gosiData && gosiData.details.length > 0 && (
                            <tfoot className="bg-neutral-50 dark:bg-neutral-800/50 font-bold border-t dark:border-neutral-800 text-xs">
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 text-end text-neutral-700 dark:text-neutral-300">
                                        {t('common.total', 'الإجمالي العام:')}
                                    </td>
                                    <td className="px-4 py-3 text-end font-mono text-neutral-900 dark:text-neutral-100">
                                        {Number(gosiData.total_contributory_wage).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                    <td className="px-4 py-3 text-end font-mono text-neutral-700 dark:text-neutral-300">
                                        {Number(gosiData.total_employee_deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                    <td className="px-4 py-3 text-end font-mono text-purple-700 dark:text-purple-300">
                                        {Number(gosiData.total_employer_contributions).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                    <td className="px-4 py-3 text-end font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                                        {Number(gosiData.grand_total_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
