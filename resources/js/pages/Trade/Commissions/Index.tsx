import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Award,
    Plus,
    Calendar,
    Users,
    CheckCircle2,
    Clock,
    FileText,
    Percent,
    TrendingUp,
    DollarSign,
    Layers,
    ShieldCheck,
    ChevronRight,
    HandCoins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Representative {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    phone?: string;
    email?: string;
    monthly_target: string;
    is_active: boolean;
    plan?: { id: string; name: string; basis: string };
    branch?: { name: string };
}

interface CommissionPlan {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    basis: string;
    tiers?: Array<{ min: number; max: number | null; rate: number }>;
    target_bonus_rate: string;
    is_active: boolean;
    representatives_count?: number;
}

interface CommissionRun {
    id: string;
    run_number: string;
    period_start: string;
    period_end: string;
    basis: string;
    status: 'draft' | 'approved' | 'settled' | 'cancelled';
    total_eligible_sales: string;
    total_commission_amount: string;
    total_bonus_amount: string;
    total_deductions: string;
    total_net_payable: string;
    created_at: string;
    approver?: { name: string };
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    runs: PaginatedData<CommissionRun>;
    representatives: Representative[];
    plans: CommissionPlan[];
    metrics: {
        total_runs: number;
        settled_runs: number;
        total_commissions_paid: number;
        active_representatives: number;
    };
    filters: { status?: string };
}

export default function CommissionsIndex({
    runs,
    representatives,
    plans,
    metrics,
    filters,
}: Props) {
    const { t, isRtl } = useTranslation();
    const [activeTab, setActiveTab] = useState<'runs' | 'reps' | 'plans'>('runs');
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [showRepModal, setShowRepModal] = useState(false);

    const planForm = useForm({
        code: '',
        name: '',
        name_ar: '',
        basis: 'invoiced_sales',
        target_bonus_rate: '1.0',
        tiers: [
            { min: 0, max: 50000, rate: 2.0 },
            { min: 50000, max: 100000, rate: 3.5 },
            { min: 100000, max: null, rate: 5.0 },
        ],
        notes: '',
    });

    const repForm = useForm({
        code: '',
        name: '',
        name_ar: '',
        phone: '',
        email: '',
        commission_plan_id: plans[0]?.id || '',
        monthly_target: '50000',
        notes: '',
    });

    const handleCreatePlan = (e: React.FormEvent) => {
        e.preventDefault();
        planForm.post('/trade/commissions/plans', {
            onSuccess: () => {
                setShowPlanModal(false);
                planForm.reset();
            },
        });
    };

    const handleCreateRep = (e: React.FormEvent) => {
        e.preventDefault();
        repForm.post('/trade/commissions/representatives', {
            onSuccess: () => {
                setShowRepModal(false);
                repForm.reset();
            },
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('trade.commissions.title', 'عمولات ومستحقات مندوبي المبيعات')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                        <HandCoins className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                        {t('trade.commissions.title', 'عمولات ومستحقات مندوبي المبيعات')}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {t(
                            'trade.commissions.subtitle',
                            'إدارة المناديب، خطط الشرائح المتدرجة، احتساب العمولات الآلية، والترحيل لدفتر الأستاذ'
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowRepModal(true)}
                        className="gap-2"
                    >
                        <Users className="w-4 h-4" />
                        {t('trade.commissions.addRep', 'إضافة مندوب')}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => setShowPlanModal(true)}
                        className="gap-2"
                    >
                        <Layers className="w-4 h-4" />
                        {t('trade.commissions.addPlan', 'خطة عمولات')}
                    </Button>

                    <Link href="/trade/commissions/create">
                        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            <Plus className="w-4 h-4" />
                            {t('trade.commissions.newRun', 'احتساب مسير جديد')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            {t('trade.commissions.totalPaid', 'إجمالي العمولات المصروفة')}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                            {metrics.total_commissions_paid.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })}
                        </span>
                        <span className="text-xs font-semibold text-zinc-400">SAR</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            {t('trade.commissions.activeReps', 'مندوبو المبيعات النشطون')}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                            {metrics.active_representatives}
                        </span>
                        <span className="text-xs text-zinc-400 ms-1.5">{t('common.active', 'مندوب')}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            {t('trade.commissions.settledRuns', 'المسيرات المعتمدة')}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                            {metrics.settled_runs}
                        </span>
                        <span className="text-xs text-zinc-400 ms-1.5">
                            / {metrics.total_runs} {t('trade.commissions.runsCount', 'مسير')}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            {t('trade.commissions.plansCount', 'خطط العمولات المتاحة')}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Award className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                            {plans.length}
                        </span>
                        <span className="text-xs text-zinc-400 ms-1.5">{t('trade.commissions.activePlans', 'خطة')}</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={() => setActiveTab('runs')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'runs'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                >
                    {t('trade.commissions.tabRuns', 'مسيرات العمولات')} ({runs.total})
                </button>
                <button
                    onClick={() => setActiveTab('reps')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'reps'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                >
                    {t('trade.commissions.tabReps', 'مندوبو المبيعات')} ({representatives.length})
                </button>
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'plans'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                >
                    {t('trade.commissions.tabPlans', 'خطط وقواعد العمولات')} ({plans.length})
                </button>
            </div>

            {/* Tab 1: Runs Table */}
            {activeTab === 'runs' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 text-xs uppercase font-medium border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-5 py-3.5 text-start">{t('trade.commissions.runNumber', 'رقم المسير')}</th>
                                    <th className="px-5 py-3.5 text-start">{t('trade.commissions.period', 'الفترة المالية')}</th>
                                    <th className="px-5 py-3.5 text-start">{t('trade.commissions.basis', 'أساس الاحتساب')}</th>
                                    <th className="px-5 py-3.5 text-end">{t('trade.commissions.eligibleSales', 'المبيعات المؤهلة')}</th>
                                    <th className="px-5 py-3.5 text-end">{t('trade.commissions.netCommission', 'صافي العمولات')}</th>
                                    <th className="px-5 py-3.5 text-center">{t('common.status', 'الحالة')}</th>
                                    <th className="px-5 py-3.5 text-end">{t('common.actions', 'الإجراءات')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {runs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                                            {t('trade.commissions.noRuns', 'لم يتم إنشاء أي مسيرات عمولات حتى الآن.')}
                                        </td>
                                    </tr>
                                ) : (
                                    runs.data.map((run) => (
                                        <tr key={run.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                                            <td className="px-5 py-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                                                <Link href={`/trade/commissions/${run.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">
                                                    {run.run_number}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                                                {run.period_start} <span className="text-zinc-400">إلى</span> {run.period_end}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                    {run.basis === 'invoiced_sales'
                                                        ? t('trade.commissions.invoiced', 'فواتير المبيعات')
                                                        : t('trade.commissions.collected', 'التحصيل النقدي')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-end font-mono font-medium text-zinc-700 dark:text-zinc-300">
                                                {Number(run.total_eligible_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="px-5 py-4 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {Number(run.total_net_payable).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {run.status === 'settled' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        {t('trade.commissions.settled', 'معتمد ومرحل')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {t('trade.commissions.draft', 'مسودة')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-end">
                                                <Link href={`/trade/commissions/${run.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                                        {t('common.details', 'التفاصيل')}
                                                        <ChevronRight className="w-3.5 h-3.5" />
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
            )}

            {/* Tab 2: Representatives Table */}
            {activeTab === 'reps' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 text-xs uppercase font-medium border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-5 py-3.5 text-start">{t('trade.commissions.repCode', 'كود المندوب')}</th>
                                    <th className="px-5 py-3.5 text-start">{t('trade.commissions.repName', 'اسم المندوب')}</th>
                                    <th className="px-5 py-3.5 text-start">{t('trade.commissions.repPhone', 'الهاتف')}</th>
                                    <th className="px-5 py-3.5 text-start">{t('trade.commissions.assignedPlan', 'خطة العمولات')}</th>
                                    <th className="px-5 py-3.5 text-end">{t('trade.commissions.monthlyTarget', 'المستهدف الشهري')}</th>
                                    <th className="px-5 py-3.5 text-center">{t('common.status', 'الحالة')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {representatives.map((rep) => (
                                    <tr key={rep.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                                        <td className="px-5 py-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                                            {rep.code}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                                            {isRtl ? (rep.name_ar || rep.name) : rep.name}
                                        </td>
                                        <td className="px-5 py-4 font-mono text-zinc-500 text-xs">
                                            {rep.phone || '-'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                                {rep.plan?.name || 'Standard'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-end font-mono font-medium text-zinc-700 dark:text-zinc-300">
                                            {Number(rep.monthly_target).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {rep.is_active ? (
                                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium">
                                                    {t('common.active', 'نشط')}
                                                </span>
                                            ) : (
                                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
                                                    {t('common.inactive', 'غير نشط')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 3: Plans Cards */}
            {activeTab === 'plans' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        {plan.code}
                                    </span>
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                                        {isRtl ? (plan.name_ar || plan.name) : plan.name}
                                    </h3>
                                </div>
                                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-medium">
                                    {plan.basis === 'invoiced_sales' ? 'المبيعات' : 'التحصيل'}
                                </span>
                            </div>

                            {/* Tiers List */}
                            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                    {t('trade.commissions.tierBreakdown', 'شرائح العمولات المتدرجة')}
                                </span>
                                <div className="space-y-1.5">
                                    {plan.tiers?.map((tier, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg font-mono">
                                            <span>
                                                {Number(tier.min).toLocaleString()} {tier.max ? `إلى ${Number(tier.max).toLocaleString()}` : '+'} SAR
                                            </span>
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{tier.rate}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                <span>{t('trade.commissions.targetBonus', 'بونص تحقيق الهدف')}: <strong className="text-zinc-900 dark:text-zinc-100">{plan.target_bonus_rate}%</strong></span>
                                <span>{plan.representatives_count || 0} {t('trade.commissions.assignedReps', 'مندوب')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: New Representative */}
            {showRepModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-lg shadow-xl space-y-4">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {t('trade.commissions.addRepTitle', 'إضافة مندوب مبيعات جديد')}
                        </h2>

                        <form onSubmit={handleCreateRep} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">كود المندوب</label>
                                    <Input
                                        value={repForm.data.code}
                                        onChange={(e) => repForm.setData('code', e.target.value)}
                                        placeholder="REP-001"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">المستهدف الشهري (SAR)</label>
                                    <Input
                                        type="number"
                                        value={repForm.data.monthly_target}
                                        onChange={(e) => repForm.setData('monthly_target', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">اسم المندوب (EN)</label>
                                <Input
                                    value={repForm.data.name}
                                    onChange={(e) => repForm.setData('name', e.target.value)}
                                    placeholder="Sales Rep Name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">اسم المندوب (عربي)</label>
                                <Input
                                    value={repForm.data.name_ar}
                                    onChange={(e) => repForm.setData('name_ar', e.target.value)}
                                    placeholder="اسم المندوب بالعربية"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">الهاتف</label>
                                    <Input
                                        value={repForm.data.phone}
                                        onChange={(e) => repForm.setData('phone', e.target.value)}
                                        placeholder="05xxxxxxxx"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">خطة العمولات</label>
                                    <select
                                        value={repForm.data.commission_plan_id}
                                        onChange={(e) => repForm.setData('commission_plan_id', e.target.value)}
                                        className="w-full text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5"
                                        required
                                    >
                                        {plans.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <Button type="button" variant="outline" onClick={() => setShowRepModal(false)}>
                                    {t('common.cancel', 'إلغاء')}
                                </Button>
                                <Button type="submit" disabled={repForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {t('common.save', 'حفظ')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: New Commission Plan */}
            {showPlanModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-lg shadow-xl space-y-4">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {t('trade.commissions.addPlanTitle', 'إضافة خطة عمولات جديدة')}
                        </h2>

                        <form onSubmit={handleCreatePlan} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">كود الخطة</label>
                                    <Input
                                        value={planForm.data.code}
                                        onChange={(e) => planForm.setData('code', e.target.value)}
                                        placeholder="PLAN-STANDARD"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">أساس الاحتساب</label>
                                    <select
                                        value={planForm.data.basis}
                                        onChange={(e) => planForm.setData('basis', e.target.value)}
                                        className="w-full text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5"
                                    >
                                        <option value="invoiced_sales">فواتير المبيعات المعتمدة</option>
                                        <option value="collected_cash">التحصيل والمبالغ المقبوضة فعلياً</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">اسم الخطة (EN)</label>
                                <Input
                                    value={planForm.data.name}
                                    onChange={(e) => planForm.setData('name', e.target.value)}
                                    placeholder="Tiered Wholesale Commission"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">بونص إضافي عند تحقيق 100% من الهدف (%)</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={planForm.data.target_bonus_rate}
                                    onChange={(e) => planForm.setData('target_bonus_rate', e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <Button type="button" variant="outline" onClick={() => setShowPlanModal(false)}>
                                    {t('common.cancel', 'إلغاء')}
                                </Button>
                                <Button type="submit" disabled={planForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {t('common.save', 'حفظ الخطة')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
