import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Scale, CheckCircle2, Clock, AlertTriangle, XCircle, Calendar, Layers, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface CostCenter {
    id: string;
    code: string;
    name: string;
}

interface Budget {
    id: string;
    name: string;
    fiscal_year: number;
    status: 'draft' | 'approved' | 'closed';
    notes?: string;
    created_at: string;
    cost_center?: CostCenter;
}

interface LineVariance {
    line_id: string;
    account_id: string;
    account_code: string;
    account_name: string;
    account_type: string;
    cost_center_name?: string;
    period_month: number;
    planned_amount: number;
    actual_amount: number;
    variance_amount: number;
    utilization_percent: number;
    is_over_budget: boolean;
    notes?: string;
}

interface Summary {
    total_planned: number;
    total_actual: number;
    total_variance: number;
    overall_utilization_percent: number;
    over_budget_lines_count: number;
    is_over_budget_overall: boolean;
}

interface Props {
    budget: Budget;
    summary: Summary;
    lines: LineVariance[];
}

export default function ShowBudget({ budget, summary, lines }: Props) {
    const { t, isRtl } = useTranslation();

    const handleApprove = () => {
        if (confirm(t('budgets.confirmApprove', 'هل تريد بالتأكيد اعتماد هذه الموازنة التقديرية؟'))) {
            router.post(`/accounting/budgets/${budget.id}/approve`);
        }
    };

    const getMonthName = (m: number) => {
        if (m === 0) return t('budgets.annualFullYear', 'كامل السنة');
        return `${t('common.month', 'شهر')} ${m}`;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`${t('budgets.budget', 'موازنة')} ${budget.name}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/budgets">
                        <Button variant="outline" size="icon">
                            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <Scale className="w-6 h-6 text-primary" />
                                {budget.name}
                            </h1>
                            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-muted">
                                {budget.fiscal_year}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {budget.cost_center ? `${t('budgets.costCenter', 'مركز التكلفة')}: ${budget.cost_center.name}` : t('budgets.companyWide', 'موازنة شاملة لكافة فروع الشركة')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {budget.status === 'draft' ? (
                        <Button onClick={handleApprove} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            {t('budgets.approveAction', 'اعتماد الموازنة')}
                        </Button>
                    ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs px-3 py-1 rounded-full font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            {t('budgets.statusApproved', 'معتمدة')}
                        </span>
                    )}
                </div>
            </div>

            {/* KPI Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('budgets.totalPlanned', 'إجمالي المخطط')}</div>
                    <div className="text-2xl font-bold font-mono text-primary mt-1">{summary.total_planned.toLocaleString()} ر.س</div>
                </div>

                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('budgets.totalActual', 'إجمالي الفعلي')}</div>
                    <div className="text-2xl font-bold font-mono mt-1">{summary.total_actual.toLocaleString()} ر.س</div>
                </div>

                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('budgets.netVariance', 'صافي الانحراف (المتبقي)')}</div>
                    <div className={`text-2xl font-bold font-mono mt-1 ${summary.total_variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {summary.total_variance >= 0 ? '+' : ''}{summary.total_variance.toLocaleString()} ر.س
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('budgets.utilizationRate', 'نسبة استهلاك الموازنة')}</div>
                    <div className="text-2xl font-bold font-mono mt-1">{summary.overall_utilization_percent}%</div>
                </div>

                <div className={`border rounded-xl p-4 shadow-sm ${summary.over_budget_lines_count > 0 ? 'bg-red-50/50 border-red-300 text-red-800 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400' : 'bg-card'}`}>
                    <div className="text-xs font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {t('budgets.overBudgetAlerts', 'بنود تجاوزت الموازنة')}
                    </div>
                    <div className="text-2xl font-bold mt-1 font-mono">{summary.over_budget_lines_count}</div>
                </div>
            </div>

            {/* Detailed Variance Table */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden space-y-2">
                <div className="p-4 border-b font-bold text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-primary" />
                        {t('budgets.varianceAnalysisTitle', 'تحليل مقارنة المخطط بالفعلي (Budget vs. Actuals)')}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                        {lines.length} {t('budgets.lineItems', 'بند محاسبي')}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3 text-start">{t('budgets.account', 'الحساب المالي')}</th>
                                <th className="px-4 py-3 text-start">{t('budgets.costCenter', 'مركز التكلفة')}</th>
                                <th className="px-4 py-3 text-center">{t('budgets.period', 'الفترة')}</th>
                                <th className="px-4 py-3 text-end">{t('budgets.planned', 'المخطط')}</th>
                                <th className="px-4 py-3 text-end">{t('budgets.actual', 'الفعلي')}</th>
                                <th className="px-4 py-3 text-end">{t('budgets.variance', 'الانحراف (المتبقي)')}</th>
                                <th className="px-4 py-3 text-center w-36">{t('budgets.utilization', 'الاستهلاك %')}</th>
                                <th className="px-4 py-3 text-center">{t('common.status', 'الحالة')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {lines.map((item) => (
                                <tr key={item.line_id} className={`hover:bg-muted/30 transition-colors ${item.is_over_budget ? 'bg-red-50/20' : ''}`}>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold">{item.account_name}</div>
                                        <div className="text-xs text-muted-foreground font-mono">{item.account_code} ({item.account_type})</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {item.cost_center_name ? (
                                            <span className="font-medium px-2 py-0.5 rounded bg-muted">{item.cost_center_name}</span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs">
                                        {getMonthName(item.period_month)}
                                    </td>
                                    <td className="px-4 py-3 text-end font-mono font-medium">
                                        {item.planned_amount.toLocaleString()} ر.س
                                    </td>
                                    <td className="px-4 py-3 text-end font-mono font-bold">
                                        {item.actual_amount.toLocaleString()} ر.س
                                    </td>
                                    <td className="px-4 py-3 text-end font-mono font-bold">
                                        <span className={item.variance_amount >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                                            {item.variance_amount >= 0 ? '+' : ''}{item.variance_amount.toLocaleString()} ر.س
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="space-y-1">
                                            <div className="text-xs text-center font-mono font-bold">
                                                {item.utilization_percent}%
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-1.5 rounded-full ${item.is_over_budget ? 'bg-red-500' : 'bg-primary'}`}
                                                    style={{ width: `${Math.min(100, item.utilization_percent)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {item.is_over_budget ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-full">
                                                <AlertTriangle className="w-3 h-3" />
                                                {t('budgets.overBudget', 'تجاوز الموازنة')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {t('budgets.withinBudget', 'ضمن الموازنة')}
                                            </span>
                                        )}
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
