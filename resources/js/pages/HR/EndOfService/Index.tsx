import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    FileText,
    Plus,
    Printer,
    User,
    Wallet,
    Download,
    Calculator,
    BookOpenCheck,
    AlertCircle,
    ArrowUpRight,
    Users,
    Layers,
    Clock,
} from 'lucide-react';
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

interface ScheduleEmployee {
    employee_id: string;
    employee_number: string;
    name: string;
    name_ar?: string | null;
    nationality?: string | null;
    department?: string | null;
    designation?: string | null;
    hire_date: string;
    as_of_date: string;
    service_days: number;
    service_years: number;
    service_formatted: string;
    monthly_wage: number;
    statutory_accrued_liability: number;
    entitlement_percentage: number;
    payable_entitlement: number;
    termination_type: string;
}

interface LiabilitySchedule {
    as_of_date: string;
    total_active_employees: number;
    total_monthly_wage_base: number;
    total_cumulative_ifrs_liability: number;
    total_resignation_liability: number;
    current_gl_provision_balance: number;
    recommended_adjustment: number;
    schedule: ScheduleEmployee[];
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
    liabilitySchedule?: LiabilitySchedule;
    filters: {
        status?: string;
        search?: string;
        as_of_date?: string;
    };
}

export default function EndOfServiceIndex({ settlements, metrics, liabilitySchedule, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [activeTab, setActiveTab] = useState<'schedule' | 'settlements'>('schedule');
    const [isPostingAccrual, setIsPostingAccrual] = useState(false);

    const handlePostAccrual = () => {
        if (!liabilitySchedule || liabilitySchedule.recommended_adjustment <= 0) {
            alert(isRtl ? 'الرصيد الدفتري الحالي يغطي الالتزام المحسوب بالكامل.' : 'Current GL provision already covers calculated liability.');
            return;
        }

        const msg = isRtl
            ? `هل ترغب في ترحيل قيد مخصص نهاية الخدمة الشهري بمبلغ ${Number(liabilitySchedule.recommended_adjustment).toLocaleString()} ريال إلى الدفتر العام؟`
            : `Post monthly EOSB provision accrual of ${Number(liabilitySchedule.recommended_adjustment).toLocaleString()} SAR to General Ledger?`;

        if (window.confirm(msg)) {
            setIsPostingAccrual(true);
            router.post(
                '/hr/end-of-service/accrue',
                {
                    as_of_date: liabilitySchedule.as_of_date,
                    amount: liabilitySchedule.recommended_adjustment,
                },
                {
                    onFinish: () => setIsPostingAccrual(false),
                }
            );
        }
    };

    const getTerminationTypeBadge = (type: string) => {
        switch (type) {
            case 'resignation':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">{isRtl ? 'استقالة (مادة 85)' : 'Resignation (Art 85)'}</span>;
            case 'contract_end':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{isRtl ? 'انتهاء العقد (مادة 84)' : 'Contract End (Art 84)'}</span>;
            case 'employer_termination':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300">{isRtl ? 'إنهاء من المنشأة (مادة 77)' : 'Employer Termination'}</span>;
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">{isRtl ? 'فسخ / قوة قاهرة (مادة 87)' : 'Article 87'}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'settled':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" />{isRtl ? 'تمت التسوية والترحيل' : 'Settled & Posted'}</span>;
            case 'approved':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">{isRtl ? 'معتمد' : 'Approved'}</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">{isRtl ? 'مسودة' : 'Draft'}</span>;
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={isRtl ? 'مكافأة نهاية الخدمة ومخصص الالتزامات (نظام العمل السعودي)' : 'Saudi Labor Law EOSB & Provision Accrual'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/20 via-background to-background p-6 rounded-2xl border border-indigo-900/20 shadow-xs">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 border border-indigo-500/20">
                        <Award className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'نظام العمل السعودي - المادتين 84 و 85 ومعايير IFRS' : 'Saudi Labor Law Articles 84 & 85 & IFRS IAS 19'}</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2.5">
                        {isRtl ? 'مكافأة نهاية الخدمة ومخصص الالتزامات المتراكمة' : 'End of Service Benefits (EOSB) & Provision Hub'}
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {isRtl
                            ? 'احتساب مخصص مكافأة نهاية الخدمة للموظفين النشطين، ترحيل القيود لـ GL، وإصدار وثائق المخالصة والتسوية'
                            : 'Cumulative actuarial liability schedule, GL provision accruals, and final settlement vouchers'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href="/hr/end-of-service/export-schedule" target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 text-neutral-600" />
                            <span>{isRtl ? 'تصدير كشف الالتزامات CSV' : 'Export Schedule CSV'}</span>
                        </a>
                    </Button>

                    {liabilitySchedule && liabilitySchedule.recommended_adjustment > 0 && (
                        <Button
                            onClick={handlePostAccrual}
                            disabled={isPostingAccrual}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            size="sm"
                        >
                            <BookOpenCheck className="w-4 h-4" />
                            <span>
                                {isPostingAccrual
                                    ? (isRtl ? 'جاري الترحيل...' : 'Posting...')
                                    : (isRtl ? 'ترحيل قيد المخصص لـ GL' : 'Post Accrual to GL')}
                            </span>
                        </Button>
                    )}

                    <Link href="/hr/end-of-service/create">
                        <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            <Plus className="w-4 h-4" />
                            <span>{isRtl ? 'تسوية وتصفية موظف' : 'New Settlement'}</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Top Provision & Telemetry Cards */}
            {liabilitySchedule && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Accumulated IFRS Liability */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isRtl ? 'مخصص نهاية الخدمة المتراكم (IFRS)' : 'Accumulated EOSB Liability'}
                            </span>
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <Award className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 text-2xl lg:text-3xl font-mono font-black text-indigo-700 dark:text-indigo-400">
                            {Number(liabilitySchedule.total_cumulative_ifrs_liability).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-xs font-bold text-neutral-400 ms-1.5">SAR</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-2 flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2">
                            <span>{isRtl ? 'استحقاق الاستقالة الفعلي:' : 'Resignation Liability:'}</span>
                            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                {Number(liabilitySchedule.total_resignation_liability).toLocaleString()} SAR
                            </span>
                        </div>
                    </div>

                    {/* Current GL Provision Balance */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isRtl ? 'الرصيد الدفتري الحالي حـ/ 2160' : 'Current GL Provision (Acc 2160)'}
                            </span>
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Wallet className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 text-2xl lg:text-3xl font-mono font-black text-neutral-900 dark:text-neutral-100">
                            {Number(liabilitySchedule.current_gl_provision_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-xs font-bold text-neutral-400 ms-1.5">SAR</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-2 flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2">
                            <span>{isRtl ? 'حساب المخصص:' : 'Provision Account:'}</span>
                            <span className="font-mono">2160 - مخصص نهاية الخدمة</span>
                        </div>
                    </div>

                    {/* Recommended Accrual Adjustment */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isRtl ? 'فارق التسوية والتعديل المطلوب' : 'Required Accrual Adjustment'}
                            </span>
                            <div className={`p-2 rounded-xl ${liabilitySchedule.recommended_adjustment > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                                <Calculator className="w-5 h-5" />
                            </div>
                        </div>
                        <div className={`mt-3 text-2xl lg:text-3xl font-mono font-black ${liabilitySchedule.recommended_adjustment > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {Number(liabilitySchedule.recommended_adjustment).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            <span className="text-xs font-bold text-neutral-400 ms-1.5">SAR</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-2 flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2">
                            <span>{isRtl ? 'حالة التغطية:' : 'Coverage:'}</span>
                            <span className="font-bold">
                                {liabilitySchedule.recommended_adjustment > 0 ? (isRtl ? 'يتطلب ترحيل قيد إضافي' : 'Needs Accrual') : (isRtl ? 'مغطى بالكامل ومطابق' : 'Fully Covered')}
                            </span>
                        </div>
                    </div>

                    {/* Active Employees Covered */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                                {isRtl ? 'الموظفون المشمولون بالمخصص' : 'Active Employees Covered'}
                            </span>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-3 text-2xl lg:text-3xl font-mono font-black text-neutral-900 dark:text-neutral-100">
                            {liabilitySchedule.total_active_employees}
                            <span className="text-sm font-semibold text-neutral-400 ms-1.5">{isRtl ? 'موظف نشط' : 'Employees'}</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-2 flex justify-between border-t border-neutral-100 dark:border-neutral-800 pt-2">
                            <span>{isRtl ? 'إجمالي مسير الأجور الشهري:' : 'Total Monthly Wages:'}</span>
                            <span className="font-mono font-bold">{Number(liabilitySchedule.total_monthly_wage_base).toLocaleString()} SAR</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800">
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-colors ${
                        activeTab === 'schedule'
                            ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>{isRtl ? 'سجل التزامات نهاية الخدمة للموظفين النشطين' : 'Active Employees Liability Schedule'}</span>
                    {liabilitySchedule && (
                        <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                            {liabilitySchedule.total_active_employees}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('settlements')}
                    className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold border-b-2 transition-colors ${
                        activeTab === 'settlements'
                            ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    <span>{isRtl ? 'سجل تسويات ومخالصات نهاية الخدمة المصروفة' : 'Final Settlement Records'}</span>
                    <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-0.5 rounded-full font-mono">
                        {metrics.total_settlements}
                    </span>
                </button>
            </div>

            {/* Tab 1: Company Liability Schedule */}
            {activeTab === 'schedule' && liabilitySchedule && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-neutral-50/50 dark:bg-neutral-800/30">
                        <div>
                            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                {isRtl ? 'كشف المخصص التراكمي الفردي لكل موظف (المادتين 84 و 85)' : 'Employee-by-Employee Cumulative EOSB Liability'}
                            </h3>
                            <p className="text-xs text-neutral-500">
                                {isRtl ? 'محسوب بدقة للأيام والكسور السنوية وفقاً لراتب الموظف وبدلاته الثابتة' : 'Prorated to exact service days based on gross contractual wage'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">{isRtl ? 'تاريخ الاحتساب:' : 'As of Date:'}</span>
                            <span className="font-mono text-xs font-bold bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                                {liabilitySchedule.as_of_date}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="py-3 px-4 text-start">{isRtl ? 'الموظف' : 'Employee'}</th>
                                    <th className="py-3 px-4 text-start">{isRtl ? 'القسم / المسمى' : 'Dept / Title'}</th>
                                    <th className="py-3 px-4 text-start">{isRtl ? 'تاريخ التعيين' : 'Hire Date'}</th>
                                    <th className="py-3 px-4 text-center">{isRtl ? 'مدة الخدمة' : 'Service'}</th>
                                    <th className="py-3 px-4 text-end">{isRtl ? 'الأجر الشهري الأساسي' : 'Monthly Wage'}</th>
                                    <th className="py-3 px-4 text-end">{isRtl ? 'المخصص التراكمي (مادة 84)' : 'Statutory EOSB (Art 84)'}</th>
                                    <th className="py-3 px-4 text-center">{isRtl ? 'نسبة الاستقالة (مادة 85)' : 'Resignation %'}</th>
                                    <th className="py-3 px-4 text-end">{isRtl ? 'استحقاق الاستقالة' : 'Resignation Payout'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {liabilitySchedule.schedule.map((emp) => (
                                    <tr key={emp.employee_id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                                        <td className="py-3 px-4">
                                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                {isRtl && emp.name_ar ? emp.name_ar : emp.name}
                                            </div>
                                            <div className="font-mono text-[10px] text-neutral-400">
                                                {emp.employee_number} • {emp.nationality || 'Saudi'}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                            <div>{emp.department || '-'}</div>
                                            <div className="text-[10px] text-neutral-400">{emp.designation || '-'}</div>
                                        </td>
                                        <td className="py-3 px-4 font-mono text-neutral-600 dark:text-neutral-400">
                                            {emp.hire_date}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                                {emp.service_years} {isRtl ? 'سنة' : 'yrs'}
                                            </span>
                                            <div className="text-[10px] text-neutral-400 font-mono">{emp.service_formatted}</div>
                                        </td>
                                        <td className="py-3 px-4 text-end font-mono text-neutral-700 dark:text-neutral-300">
                                            {Number(emp.monthly_wage).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="py-3 px-4 text-end font-mono font-bold text-indigo-700 dark:text-indigo-400">
                                            {Number(emp.statutory_accrued_liability).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                emp.entitlement_percentage === 100
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                    : emp.entitlement_percentage === 0
                                                    ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                            }`}>
                                                {emp.entitlement_percentage}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(emp.payable_entitlement).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 2: Settlement Records */}
            {activeTab === 'settlements' && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="py-3.5 px-4 text-start">{isRtl ? 'رقم المخالصة' : 'Settlement #'}</th>
                                    <th className="py-3.5 px-4 text-start">{isRtl ? 'الموظف' : 'Employee'}</th>
                                    <th className="py-3.5 px-4 text-start">{isRtl ? 'سبب انتهاء العلاقة' : 'Reason'}</th>
                                    <th className="py-3.5 px-4 text-center">{isRtl ? 'مدة الخدمة' : 'Service'}</th>
                                    <th className="py-3.5 px-4 text-end">{isRtl ? 'المكافأة المحتسبة' : 'Gratuity'}</th>
                                    <th className="py-3.5 px-4 text-end">{isRtl ? 'صافي التصفية' : 'Net Payout'}</th>
                                    <th className="py-3.5 px-4 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                                    <th className="py-3.5 px-4 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {settlements.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-10 text-center text-neutral-400">
                                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p>{isRtl ? 'لا توجد تسويات نهاية خدمة مسجلة' : 'No settlement records found'}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    settlements.data.map((row) => (
                                        <tr key={row.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                                            <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                <Link href={`/hr/end-of-service/${row.id}`} className="hover:underline">
                                                    {row.settlement_number}
                                                </Link>
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                                                <div>{row.employee?.first_name} {row.employee?.last_name}</div>
                                                <div className="text-[10px] text-neutral-400 font-mono">
                                                    {row.employee?.employee_number} - {row.employee?.department?.name}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">{getTerminationTypeBadge(row.termination_type)}</td>
                                            <td className="py-3.5 px-4 text-center font-mono text-neutral-600 dark:text-neutral-400">
                                                {Number(row.service_years).toFixed(2)} {isRtl ? 'سنوات' : 'yrs'}
                                            </td>
                                            <td className="py-3.5 px-4 text-end font-mono text-neutral-800 dark:text-neutral-200">
                                                {Number(row.gratuity_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="py-3.5 px-4 text-end font-mono font-bold text-indigo-700 dark:text-indigo-400">
                                                {Number(row.net_settlement_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="py-3.5 px-4 text-center">{getStatusBadge(row.status)}</td>
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                                                        <Link href={`/hr/end-of-service/${row.id}`}>
                                                            {isRtl ? 'عرض وتصفية' : 'View'}
                                                        </Link>
                                                    </Button>
                                                    <Button asChild size="sm" variant="outline" className="h-7 text-neutral-600 hover:text-neutral-900">
                                                        <Link href={`/hr/end-of-service/${row.id}/print`}>
                                                            <Printer className="w-3.5 h-3.5" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
