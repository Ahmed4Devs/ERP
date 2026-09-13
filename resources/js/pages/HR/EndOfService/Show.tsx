import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Award, CheckCircle2, FileCheck2, Info, Printer, ShieldCheck, User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Props {
    settlement: {
        id: string;
        settlement_number: string;
        termination_type: 'resignation' | 'contract_end' | 'employer_termination' | 'article_87';
        hire_date: string;
        last_working_date: string;
        service_years: string;
        base_salary_amount: string;
        gratuity_entitlement_rate: string;
        gratuity_amount: string;
        unused_leave_days: string;
        leave_compensation_amount: string;
        other_entitlements: string;
        deductions_amount: string;
        net_settlement_amount: string;
        status: 'draft' | 'approved' | 'settled';
        settled_at?: string;
        notes?: string;
        employee?: {
            id: string;
            first_name: string;
            last_name: string;
            first_name_ar?: string;
            last_name_ar?: string;
            employee_number: string;
            national_id?: string;
            department?: { name: string };
            designation?: { name: string };
        };
        branch?: { name: string };
        journalEntry?: {
            id: string;
            entry_number: string;
            total_debit: string;
            lines: Array<{
                id: string;
                debit: string;
                credit: string;
                description: string;
                account?: { code: string; name: string; name_ar?: string };
            }>;
        };
        preparer?: { name: string };
        approver?: { name: string };
    };
}

export default function ShowEndOfService({ settlement }: Props) {
    const { t, isRtl } = useTranslation();
    const settleForm = useForm();

    const handleSettle = () => {
        if (confirm(t('hr.eos.confirmSettle', 'هل تريد بالتأكيد اعتماد المخالصة وترحيل قيد تسوية مكافأة نهاية الخدمة وتحديث حالة الموظف؟'))) {
            settleForm.post(`/hr/end-of-service/${settlement.id}/settle`);
        }
    };

    const getTerminationLabel = (type: string) => {
        switch (type) {
            case 'resignation':
                return t('hr.eos.resignation', 'استقالة الموظف (المادة 85 من نظام العمل)');
            case 'contract_end':
                return t('hr.eos.contractEnd', 'انتهاء مدة العقد أو اتفاق الطرفين (المادة 84)');
            case 'employer_termination':
                return t('hr.eos.employerTerm', 'إنهاء من المنشأة / فسخ غير مشروع (المادة 77)');
            default:
                return t('hr.eos.art87', 'فسخ عقد لظروف استثنائية أو قوة قاهرة (المادة 87)');
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`${t('hr.eos.details', 'تفاصيل تسوية نهاية الخدمة')} - ${settlement.settlement_number}`} />

            {/* Breadcrumbs & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Link href="/hr/end-of-service" className="hover:text-zinc-900 dark:hover:text-zinc-100">{t('hr.eos.title', 'مكافأة نهاية الخدمة')}</Link>
                    {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">{settlement.settlement_number}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`/hr/end-of-service/${settlement.id}/print`}>
                        <Button variant="outline" className="gap-2">
                            <Printer className="w-4 h-4" />
                            {t('hr.eos.printVoucher', 'طباعة سند المخالصة وإبراء الذمة')}
                        </Button>
                    </Link>

                    {settlement.status !== 'settled' && (
                        <Button
                            onClick={handleSettle}
                            disabled={settleForm.processing}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            {t('hr.eos.settleAction', 'اعتماد وترحيل قيد التسوية')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Status Header Banner */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{settlement.settlement_number}</h1>
                            {settlement.status === 'settled' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                    <CheckCircle2 className="w-4 h-4" />
                                    {t('hr.eos.settled', 'معتمد ومرحل دفترياً')}
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                    {t('common.draft', 'مسودة بانتظار الترحيل')}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {getTerminationLabel(settlement.termination_type)}
                        </p>
                    </div>

                    <div className="text-right rtl:text-left bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <div className="text-xs text-zinc-400">{t('hr.eos.netFinalPayout', 'صافي مبلغ التصفية والمخالصة')}</div>
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {Number(settlement.net_settlement_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </div>
                    </div>
                </div>

                {/* Employee Info Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-sm">
                    <div>
                        <span className="text-zinc-400 text-xs block">{t('hr.employee', 'الموظف')}</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{settlement.employee?.first_name} {settlement.employee?.last_name}</span>
                        <span className="text-xs text-zinc-400 block">{settlement.employee?.employee_number}</span>
                    </div>
                    <div>
                        <span className="text-zinc-400 text-xs block">{t('hr.department', 'القسم / المسمى')}</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{settlement.employee?.department?.name}</span>
                        <span className="text-xs text-zinc-400 block">{settlement.employee?.designation?.name}</span>
                    </div>
                    <div>
                        <span className="text-zinc-400 text-xs block">{t('hr.eos.periodDates', 'الفترة وتاريخ الخدمة')}</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{settlement.hire_date} ← {settlement.last_working_date}</span>
                        <span className="text-xs text-zinc-400 block">{Number(settlement.service_years).toFixed(2)} {t('common.years', 'سنوات')}</span>
                    </div>
                    <div>
                        <span className="text-zinc-400 text-xs block">{t('hr.eos.baseWage', 'أجر الاحتساب (الراتب الأخير)')}</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{Number(settlement.base_salary_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                    </div>
                </div>

                {/* Legal Breakdown Details */}
                <div className="space-y-3">
                    <h2 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-600" />
                        {t('hr.eos.breakdownTitle', 'تفاصيل الاستحقاقات والاستقطاعات القانونية')}
                    </h2>

                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                        <div className="flex justify-between p-3.5">
                            <span className="text-zinc-600 dark:text-zinc-400">
                                {t('hr.eos.gratuityCalculated', 'مكافأة نهاية الخدمة المستحقة')} (نسبة الاستحقاق: {(Number(settlement.gratuity_entitlement_rate) * 100).toFixed(1)}%)
                            </span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {Number(settlement.gratuity_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="flex justify-between p-3.5">
                            <span className="text-zinc-600 dark:text-zinc-400">
                                {t('hr.eos.leaveCompensation', 'بدل رصيد الإجازات غير المستخدمة')} ({Number(settlement.unused_leave_days)} {t('common.days', 'يوم')})
                            </span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {Number(settlement.leave_compensation_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        {Number(settlement.other_entitlements) > 0 && (
                            <div className="flex justify-between p-3.5">
                                <span className="text-zinc-600 dark:text-zinc-400">{t('hr.eos.otherEntitlements', 'مستحقات أو بدلات إضافية')}</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    {Number(settlement.other_entitlements).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </span>
                            </div>
                        )}

                        {Number(settlement.deductions_amount) > 0 && (
                            <div className="flex justify-between p-3.5 bg-rose-50/40 dark:bg-rose-950/20">
                                <span className="text-rose-700 dark:text-rose-400">{t('hr.eos.deductions', 'خصومات / سلف وقروض مستردة')}</span>
                                <span className="font-semibold text-rose-700 dark:text-rose-400">
                                    - {Number(settlement.deductions_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 font-bold text-base">
                            <span className="text-zinc-900 dark:text-zinc-100">{t('hr.eos.netFinalPayout', 'صافي مبلغ التصفية النهائي')}</span>
                            <span className="text-indigo-600 dark:text-indigo-400">
                                {Number(settlement.net_settlement_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* GL Settlement Journal Entry */}
                {settlement.journalEntry && (
                    <div className="space-y-3 pt-2">
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <FileCheck2 className="w-5 h-5 text-emerald-600" />
                            {t('hr.eos.glEntry', 'قيد اليومية لتسوية مكافأة نهاية الخدمة')} ({settlement.journalEntry.entry_number})
                        </h2>

                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left rtl:text-right">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 font-medium border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="p-3">{t('accounting.account', 'الحساب')}</th>
                                        <th className="p-3">{t('common.description', 'البيان')}</th>
                                        <th className="p-3 text-right rtl:text-left">{t('accounting.debit', 'مدين (SAR)')}</th>
                                        <th className="p-3 text-right rtl:text-left">{t('accounting.credit', 'دائن (SAR)')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {settlement.journalEntry.lines.map((line) => (
                                        <tr key={line.id}>
                                            <td className="p-3 font-medium">
                                                {line.account?.code} - {line.account?.name_ar || line.account?.name}
                                            </td>
                                            <td className="p-3 text-zinc-600 dark:text-zinc-400">{line.description}</td>
                                            <td className="p-3 font-mono text-right rtl:text-left font-semibold text-zinc-900 dark:text-zinc-100">
                                                {Number(line.debit) > 0 ? Number(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 font-mono text-right rtl:text-left font-semibold text-zinc-900 dark:text-zinc-100">
                                                {Number(line.credit) > 0 ? Number(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
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
