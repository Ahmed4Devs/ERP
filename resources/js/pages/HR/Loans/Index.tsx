import { Head, Link } from '@inertiajs/react';
import { BadgeCheck, Banknote, Calendar, CreditCard, HandCoins, Plus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface EmployeeLoan {
    id: string;
    loan_number: string;
    total_amount: string;
    monthly_installment: string;
    installments_count: number;
    paid_amount: string;
    remaining_amount: string;
    start_date: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    reason?: string;
    employee?: {
        first_name: string;
        last_name: string;
        employee_number: string;
        department?: { name: string };
        designation?: { name: string };
    };
}

interface Props {
    loans: {
        data: EmployeeLoan[];
        links: any[];
    };
    metrics: {
        total_loans: number;
        active_loans: number;
        total_disbursed: string | number;
        total_repaid: string | number;
        total_remaining: string | number;
    };
    filters: {
        status?: string;
    };
}

export default function LoansIndex({ loans, metrics, filters }: Props) {
    const { t, isRtl } = useTranslation();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">{t('hr.loans.completed', 'مسددة بالكامل')}</span>;
            case 'active':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">{t('hr.loans.active', 'نشطة / قيد الخصم')}</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{status}</span>;
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('hr.loans.title', 'سلف وقروض الموظفين')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {t('hr.loans.title', 'سلف وقروض الموظفين')}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t('hr.loans.subtitle', 'إدارة طلبات السلف النقدية، جدولة الأقساط، والخصم التلقائي من مسيرات الرواتب')}
                    </p>
                </div>
                <Link href="/hr/loans/create">
                    <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4" />
                        {t('hr.loans.create', 'تسجيل سلفة جديدة')}
                    </Button>
                </Link>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('hr.loans.activeCount', 'السلف النشطة')}</span>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                            <HandCoins className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{metrics.active_loans} <span className="text-xs text-zinc-400 font-normal">من أصل {metrics.total_loans}</span></div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('hr.loans.totalDisbursed', 'إجمالي المصروف')}</span>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Banknote className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{Number(metrics.total_disbursed).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('hr.loans.totalRepaid', 'إجمالي المسدد')}</span>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <BadgeCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{Number(metrics.total_repaid).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('hr.loans.totalRemaining', 'الرصيد المتبقي')}</span>
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                            <CreditCard className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">{Number(metrics.total_remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="py-3.5 px-4">{t('hr.loans.number', 'رقم السلفة')}</th>
                                <th className="py-3.5 px-4">{t('hr.employee', 'الموظف')}</th>
                                <th className="py-3.5 px-4">{t('hr.loans.total', 'المبلغ الإجمالي')}</th>
                                <th className="py-3.5 px-4">{t('hr.loans.installment', 'القسط الشهري')}</th>
                                <th className="py-3.5 px-4">{t('hr.loans.progress', 'السداد / الأقساط')}</th>
                                <th className="py-3.5 px-4">{t('hr.loans.remaining', 'المتبقي')}</th>
                                <th className="py-3.5 px-4">{t('common.status', 'الحالة')}</th>
                                <th className="py-3.5 px-4 text-center">{t('common.actions', 'الإجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {loans.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                                        {t('common.noData', 'لا توجد سلف مسجلة')}
                                    </td>
                                </tr>
                            ) : (
                                loans.data.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                        <td className="py-3.5 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                                            <Link href={`/hr/loans/${loan.id}`} className="hover:underline">{loan.loan_number}</Link>
                                        </td>
                                        <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                                            <div>{loan.employee?.first_name} {loan.employee?.last_name}</div>
                                            <div className="text-xs text-zinc-400">{loan.employee?.employee_number} - {loan.employee?.department?.name}</div>
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                                            {Number(loan.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                                            {Number(loan.monthly_installment).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR / شهر
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="w-36">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>{Number(loan.paid_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR</span>
                                                    <span>{Number(loan.total_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR</span>
                                                </div>
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="bg-indigo-600 h-full rounded-full"
                                                        style={{ width: `${Math.min(100, (Number(loan.paid_amount) / (Number(loan.total_amount) || 1)) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400">
                                            {Number(loan.remaining_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="py-3.5 px-4">{getStatusBadge(loan.status)}</td>
                                        <td className="py-3.5 px-4 text-center">
                                            <Link href={`/hr/loans/${loan.id}`}>
                                                <Button size="sm" variant="outline" className="h-8">
                                                    {t('common.details', 'التفاصيل والجدول')}
                                                </Button>
                                            </Link>
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
