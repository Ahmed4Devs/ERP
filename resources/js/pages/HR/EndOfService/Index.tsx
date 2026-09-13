import { Head, Link } from '@inertiajs/react';
import { Award, CheckCircle2, FileText, Plus, Printer, User, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Settlement {
    id: string;
    settlement_number: string;
    termination_type: 'resignation' | 'contract_end' | 'employer_termination' | 'article_87';
    hire_date: string;
    last_working_date: string;
    service_years: string;
    gratuity_amount: string;
    net_settlement_amount: string;
    status: 'draft' | 'approved' | 'settled';
    employee?: {
        first_name: string;
        last_name: string;
        employee_number: string;
        department?: { name: string };
        designation?: { name: string };
    };
    branch?: { name: string };
}

interface Props {
    settlements: {
        data: Settlement[];
        links: any[];
    };
    metrics: {
        total_settlements: number;
        settled_count: number;
        total_payout: string | number;
    };
    filters: {
        status?: string;
        search?: string;
    };
}

export default function EndOfServiceIndex({ settlements, metrics, filters }: Props) {
    const { t, isRtl } = useTranslation();

    const getTerminationTypeBadge = (type: string) => {
        switch (type) {
            case 'resignation':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">{t('hr.eos.resignation', 'استقالة (مادة 85)')}</span>;
            case 'contract_end':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t('hr.eos.contractEnd', 'انتهاء العقد')}</span>;
            case 'employer_termination':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">{t('hr.eos.employerTerm', 'إنهاء من المنشأة (مادة 77)')}</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">{t('hr.eos.art87', 'فسخ / قوة قاهرة (مادة 87)')}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'settled':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" />{t('hr.eos.settled', 'تمت التسوية والترحيل')}</span>;
            case 'approved':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">{t('common.approved', 'معتمد')}</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">{t('common.draft', 'مسودة')}</span>;
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('hr.eos.title', 'مكافأة نهاية الخدمة والمخالصة النهائية')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                        <Award className="w-7 h-7 text-indigo-600" />
                        {t('hr.eos.title', 'مكافأة نهاية الخدمة وتصفية المستحقات')}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {t('hr.eos.subtitle', 'احتساب مكافأة نهاية الخدمة وفق المادتين 84 و 85 من نظام العمل السعودي، وإصدار وثيقة المخالصة وقيد التسوية')}
                    </p>
                </div>
                <Link href="/hr/end-of-service/create">
                    <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4" />
                        {t('hr.eos.createBtn', 'احتساب وتصفية مستحقات')}
                    </Button>
                </Link>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('hr.eos.totalCases', 'إجمالي التسويات')}</span>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{metrics.total_settlements}</div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('hr.eos.settledCases', 'التسويات المرحلة')}</span>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.settled_count}</div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('hr.eos.totalPayout', 'إجمالي مبالغ التصفية المدفوعة')}</span>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <Wallet className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {Number(metrics.total_payout).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="py-3.5 px-4">{t('hr.eos.number', 'رقم المخالصة')}</th>
                                <th className="py-3.5 px-4">{t('hr.employee', 'الموظف')}</th>
                                <th className="py-3.5 px-4">{t('hr.eos.reason', 'سبب انتهاء العلاقة')}</th>
                                <th className="py-3.5 px-4">{t('hr.eos.serviceYears', 'مدة الخدمة')}</th>
                                <th className="py-3.5 px-4">{t('hr.eos.gratuity', 'المكافأة')}</th>
                                <th className="py-3.5 px-4">{t('hr.eos.netPayout', 'صافي التصفية')}</th>
                                <th className="py-3.5 px-4">{t('common.status', 'الحالة')}</th>
                                <th className="py-3.5 px-4 text-center">{t('common.actions', 'الإجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {settlements.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                                        {t('common.noData', 'لا توجد تسويات نهاية خدمة مسجلة')}
                                    </td>
                                </tr>
                            ) : (
                                settlements.data.map((row) => (
                                    <tr key={row.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                        <td className="py-3.5 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                                            <Link href={`/hr/end-of-service/${row.id}`} className="hover:underline">{row.settlement_number}</Link>
                                        </td>
                                        <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                                            <div>{row.employee?.first_name} {row.employee?.last_name}</div>
                                            <div className="text-xs text-zinc-400">{row.employee?.employee_number} - {row.employee?.department?.name}</div>
                                        </td>
                                        <td className="py-3.5 px-4">{getTerminationTypeBadge(row.termination_type)}</td>
                                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                                            {Number(row.service_years).toFixed(2)} {t('common.years', 'سنوات')}
                                        </td>
                                        <td className="py-3.5 px-4 text-zinc-900 dark:text-zinc-100">
                                            {Number(row.gratuity_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                                            {Number(row.net_settlement_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="py-3.5 px-4">{getStatusBadge(row.status)}</td>
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link href={`/hr/end-of-service/${row.id}`}>
                                                    <Button size="sm" variant="outline" className="h-8">
                                                        {t('common.view', 'عرض وتصفية')}
                                                    </Button>
                                                </Link>
                                                <Link href={`/hr/end-of-service/${row.id}/print`}>
                                                    <Button size="sm" variant="outline" className="h-8 text-zinc-600 hover:text-zinc-900">
                                                        <Printer className="w-3.5 h-3.5" />
                                                    </Button>
                                                </Link>
                                            </div>
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
