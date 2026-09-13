import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Clock, HandCoins, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Installment {
    id: string;
    installment_number: number;
    period_year: number;
    period_month: number;
    amount: string;
    status: 'pending' | 'deducted' | 'waived';
    deducted_at?: string;
    payslip?: {
        id: string;
        payroll_run_id: string;
    };
}

interface Props {
    loan: {
        id: string;
        loan_number: string;
        total_amount: string;
        monthly_installment: string;
        installments_count: number;
        paid_amount: string;
        remaining_amount: string;
        start_date: string;
        status: string;
        reason?: string;
        employee?: {
            id: string;
            first_name: string;
            last_name: string;
            employee_number: string;
            department?: { name: string };
            designation?: { name: string };
        };
        branch?: { name: string };
        installments: Installment[];
    };
}

export default function ShowLoan({ loan }: Props) {
    const { t, isRtl } = useTranslation();

    const paidPercent = Math.min(100, (Number(loan.paid_amount) / (Number(loan.total_amount) || 1)) * 100);

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`${t('hr.loans.loanDetails', 'تفاصيل السلفة')} - ${loan.loan_number}`} />

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Link href="/hr/loans" className="hover:text-zinc-900 dark:hover:text-zinc-100">{t('hr.loans.title', 'سلف وقروض الموظفين')}</Link>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                <span className="text-zinc-900 dark:text-zinc-100 font-mono font-medium">{loan.loan_number}</span>
            </div>

            {/* Main Details Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">{loan.loan_number}</h1>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                {loan.status}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {t('hr.employee', 'الموظف')}: {loan.employee?.first_name} {loan.employee?.last_name} ({loan.employee?.employee_number}) - {loan.employee?.department?.name}
                        </p>
                    </div>

                    <div className="text-right rtl:text-left">
                        <div className="text-xs text-zinc-400">{t('hr.loans.totalAmount', 'إجمالي مبلغ السلفة')}</div>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                            {Number(loan.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400">
                            {t('hr.loans.paid', 'المسدد')}: {Number(loan.paid_amount).toLocaleString()} SAR ({paidPercent.toFixed(1)}%)
                        </span>
                        <span className="text-amber-600 dark:text-amber-400">
                            {t('hr.loans.remaining', 'المتبقي')}: {Number(loan.remaining_amount).toLocaleString()} SAR
                        </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${paidPercent}%` }}
                        />
                    </div>
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl text-sm">
                    <div>
                        <span className="text-zinc-400 text-xs block">{t('hr.loans.monthlyInstallment', 'القسط الشهري')}</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{Number(loan.monthly_installment).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                    </div>
                    <div>
                        <span className="text-zinc-400 text-xs block">{t('hr.loans.installmentsCount', 'عدد الأقساط')}</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{loan.installments_count} {t('hr.loans.installmentsUnit', 'قسط')}</span>
                    </div>
                    <div>
                        <span className="text-zinc-400 text-xs block">{t('hr.loans.startDate', 'تاريخ البدء')}</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{loan.start_date}</span>
                    </div>
                    <div>
                        <span className="text-zinc-400 text-xs block">{t('common.branch', 'الفرع')}</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{loan.branch?.name || '-'}</span>
                    </div>
                </div>

                {loan.reason && (
                    <div className="text-sm">
                        <span className="text-xs text-zinc-400 block mb-1">{t('common.reason', 'سبب السلفة وملاحظات الإدارة')}</span>
                        <p className="text-zinc-700 dark:text-zinc-300 p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg">{loan.reason}</p>
                    </div>
                )}
            </div>

            {/* Installments Schedule Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="font-bold text-zinc-900 dark:text-zinc-100">{t('hr.loans.scheduleTitle', 'جدول الأقساط الشهرية وتتبع الخصم من الرواتب')}</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="py-3 px-4">{t('hr.loans.instNo', 'رقم القسط')}</th>
                                <th className="py-3 px-4">{t('hr.loans.period', 'فترة المسير (الشهر/السنة)')}</th>
                                <th className="py-3 px-4">{t('hr.loans.amount', 'مبلغ القسط')}</th>
                                <th className="py-3 px-4">{t('common.status', 'حالة السداد')}</th>
                                <th className="py-3 px-4">{t('hr.loans.deductedDate', 'تاريخ وتأكيد الخصم')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {loan.installments.map((inst) => (
                                <tr key={inst.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                    <td className="py-3.5 px-4 font-bold text-zinc-700 dark:text-zinc-300">
                                        #{inst.installment_number}
                                    </td>
                                    <td className="py-3.5 px-4 font-mono">
                                        {inst.period_year} - {String(inst.period_month).padStart(2, '0')}
                                    </td>
                                    <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                                        {Number(inst.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                    <td className="py-3.5 px-4">
                                        {inst.status === 'deducted' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {t('hr.loans.deducted', 'تم الخصم')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                <Clock className="w-3.5 h-3.5" />
                                                {t('hr.loans.pending', 'بانتظار مسير الراتب')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-xs text-zinc-500 dark:text-zinc-400">
                                        {inst.deducted_at ? new Date(inst.deducted_at).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
