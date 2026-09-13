import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Scale, Eye, CheckCircle2, Clock, AlertTriangle, Layers, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    lines_count: number;
    cost_center?: CostCenter;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    budgets: PaginatedData<Budget>;
    metrics: {
        total_budgets: number;
        approved_budgets: number;
        draft_budgets: number;
        total_planned: number;
    };
    filters: {
        fiscal_year?: string;
        status?: string;
        search?: string;
    };
}

export default function BudgetsIndex({ budgets, metrics, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [yearFilter, setYearFilter] = useState(filters.fiscal_year || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/accounting/budgets', {
            search: search || undefined,
            fiscal_year: yearFilter || undefined,
            status: statusFilter || undefined,
        }, { preserveState: true, replace: true });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('budgets.statusApproved', 'معتمدة')}
                    </span>
                );
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        {t('budgets.statusDraft', 'مسودة')}
                    </span>
                );
            default:
                return <span className="bg-muted text-foreground text-xs px-2.5 py-0.5 rounded-full">{status}</span>;
        }
    };

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('budgets.title', 'الموازنات التقديرية (Budgets)')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Scale className="w-7 h-7 text-primary" />
                        {t('budgets.title', 'الموازنات التقديرية (Budgets)')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('budgets.subtitle', 'تخطيط الموازنات المالية السنوية والشهرية ومقارنة الفعلي بالمخطط واحتساب الانحرافات')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/accounting/budgets/create">
                        <Button className="gap-2">
                            <Plus className="w-4 h-4" />
                            {t('budgets.newBudget', 'إعداد موازنة تقديرية')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('budgets.totalBudgets', 'إجمالي الموازنات')}</div>
                    <div className="text-2xl font-bold mt-1">{metrics.total_budgets}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('budgets.approvedBudgets', 'موازنات معتمدة')}</div>
                    <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{metrics.approved_budgets}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">{t('budgets.draftBudgets', 'موازنات قيد التخطيط')}</div>
                    <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{metrics.draft_budgets}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-primary font-medium">{t('budgets.totalPlannedAmount', 'إجمالي المبالغ المخططة')}</div>
                    <div className="text-2xl font-bold mt-1 text-primary">{metrics.total_planned.toLocaleString()} ر.س</div>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearch} className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="relative sm:col-span-2">
                        <Search className="w-4 h-4 absolute top-3 start-3 text-muted-foreground" />
                        <Input
                            placeholder={t('budgets.searchPlaceholder', 'بحث باسم الموازنة أو مركز التكلفة...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">{t('budgets.allStatuses', 'جميع الحالات')}</option>
                            <option value="draft">{t('budgets.statusDraft', 'مسودة')}</option>
                            <option value="approved">{t('budgets.statusApproved', 'معتمدة')}</option>
                        </select>
                    </div>
                    <div>
                        <Button type="submit" className="w-full gap-2">
                            <Search className="w-4 h-4" />
                            {t('common.filter', 'تصفية')}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Table */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3 text-start">{t('budgets.name', 'اسم الموازنة')}</th>
                                <th className="px-4 py-3 text-center">{t('budgets.fiscalYear', 'السنة المالية')}</th>
                                <th className="px-4 py-3 text-start">{t('budgets.costCenter', 'مركز التكلفة المخصص')}</th>
                                <th className="px-4 py-3 text-center">{t('budgets.accountsCount', 'البنود والحسابات')}</th>
                                <th className="px-4 py-3 text-center">{t('common.status', 'الحالة')}</th>
                                <th className="px-4 py-3 text-center">{t('common.actions', 'إجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {budgets.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        {t('budgets.noBudgetsFound', 'لم يتم العثور على أي موازنات تقديرية')}
                                    </td>
                                </tr>
                            ) : (
                                budgets.data.map((b) => (
                                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-primary">{b.name}</div>
                                            {b.notes && <div className="text-xs text-muted-foreground truncate max-w-xs">{b.notes}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold font-mono">
                                            <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-0.5 rounded">
                                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                {b.fiscal_year}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {b.cost_center ? (
                                                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                    {b.cost_center.code} - {b.cost_center.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">{t('budgets.companyWide', 'شامل لكافة الشركة')}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono font-semibold">
                                            {b.lines_count} {t('budgets.lines', 'بند')}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {getStatusBadge(b.status)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Link href={`/accounting/budgets/${b.id}`}>
                                                <Button variant="outline" size="sm" className="h-8 gap-1">
                                                    <Eye className="w-3.5 h-3.5" />
                                                    {t('budgets.viewVariance', 'تقرير الانحراف الفعلي')}
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {budgets.last_page > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {t('common.showing', 'عرض')} {(budgets.current_page - 1) * budgets.per_page + 1} -{' '}
                            {Math.min(budgets.current_page * budgets.per_page, budgets.total)} {t('common.of', 'من')} {budgets.total}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={budgets.current_page === 1}
                                onClick={() => router.get(`/accounting/budgets?page=${budgets.current_page - 1}`, {}, { preserveState: true })}
                            >
                                {t('common.previous', 'السابق')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={budgets.current_page === budgets.last_page}
                                onClick={() => router.get(`/accounting/budgets?page=${budgets.current_page + 1}`, {}, { preserveState: true })}
                            >
                                {t('common.next', 'التالي')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
