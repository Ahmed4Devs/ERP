import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ShieldCheck,
    Search,
    Download,
    Eye,
    Filter,
    Calendar,
    User as UserIcon,
    Layers,
    Clock,
    Activity,
    X,
    CheckCircle2,
    AlertTriangle,
    Database,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface User {
    id: number;
    name: string;
    email: string;
}

interface AuditLog {
    id: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    user?: User;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    logs: PaginatedData<AuditLog>;
    metrics: {
        total_last_30_days: number;
        active_users_count: number;
        filtered_count: number;
    };
    filters: {
        search?: string;
        action?: string;
        entity_type?: string;
        user_id?: string;
        from_date?: string;
        to_date?: string;
    };
    availableActions: string[];
    availableEntities: string[];
    users: User[];
}

export default function AuditLogsIndex({
    logs,
    metrics,
    filters,
    availableActions,
    availableEntities,
    users,
}: Props) {
    const { t, isRtl } = useTranslation();

    const [search, setSearch] = useState(filters.search || '');
    const [action, setAction] = useState(filters.action || '');
    const [entityType, setEntityType] = useState(filters.entity_type || '');
    const [userId, setUserId] = useState(filters.user_id || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');

    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const applyFilters = () => {
        router.get(
            '/audit-logs',
            {
                search: search || undefined,
                action: action || undefined,
                entity_type: entityType || undefined,
                user_id: userId || undefined,
                from_date: fromDate || undefined,
                to_date: toDate || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleReset = () => {
        setSearch('');
        setAction('');
        setEntityType('');
        setUserId('');
        setFromDate('');
        setToDate('');
        router.get('/audit-logs', {}, { replace: true });
    };

    const getExportUrl = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (action) params.set('action', action);
        if (entityType) params.set('entity_type', entityType);
        if (userId) params.set('user_id', userId);
        if (fromDate) params.set('from_date', fromDate);
        if (toDate) params.set('to_date', toDate);
        return `/audit-logs/export?${params.toString()}`;
    };

    const getActionBadge = (act: string) => {
        const lower = act.toLowerCase();
        if (lower.includes('create') || lower.includes('store') || lower.includes('generate')) {
            return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
        }
        if (lower.includes('update') || lower.includes('edit') || lower.includes('adjust')) {
            return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
        }
        if (lower.includes('delete') || lower.includes('destroy') || lower.includes('reject') || lower.includes('reverse')) {
            return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
        }
        if (lower.includes('post') || lower.includes('approve') || lower.includes('reconcile') || lower.includes('close')) {
            return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800';
        }
        return 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('audit.title', 'سجل الرقابة والتدقيق (Audit Trail)')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                        <span>{t('audit.title', 'سجل الرقابة وتتبع النشاطات (Audit Trail & Activity Center)')}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {t('audit.subtitle', 'سجل أمني مركزي يسجل كافة العمليات والتعديلات وحركات القيود والاعتمادات لمطابقة متطلبات الامتثال والرقابة')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <a href={getExportUrl()} target="_blank" rel="noreferrer">
                        <Button variant="outline" className="gap-2 text-xs font-semibold">
                            <Download className="h-4 w-4" />
                            <span>{t('audit.exportCsv', 'تصدير التقرير (CSV)')}</span>
                        </Button>
                    </a>
                </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('audit.totalLast30Days', 'حركات آخر 30 يوماً')}</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{metrics.total_last_30_days.toLocaleString()}</p>
                    </div>
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Activity className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('audit.activeUsers', 'مستخدمين نشطين بالعمليات')}</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{metrics.active_users_count}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/50 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <UserIcon className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('audit.filteredMatches', 'مطابقة الفلتر الحالي')}</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{metrics.filtered_count.toLocaleString()}</p>
                    </div>
                    <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    {/* Search */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                            {t('common.search', 'البحث السريع')}
                        </label>
                        <div className="relative">
                            <Search className={`absolute top-2.5 h-4 w-4 text-neutral-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                            <Input
                                type="text"
                                placeholder={t('audit.searchPlaceholder', 'إجراء، كيان، مستخدم، أو IP...')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`text-xs ${isRtl ? 'pr-9' : 'pl-9'}`}
                            />
                        </div>
                    </div>

                    {/* Action Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                            {t('audit.action', 'نوع العملية')}
                        </label>
                        <select
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2 py-2 text-xs text-neutral-900 dark:text-neutral-100"
                        >
                            <option value="">-- {t('common.all', 'كافة العمليات')} --</option>
                            {availableActions.map((act) => (
                                <option key={act} value={act}>
                                    {act}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Entity Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                            {t('audit.entityType', 'الكيان المتأثر')}
                        </label>
                        <select
                            value={entityType}
                            onChange={(e) => setEntityType(e.target.value)}
                            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2 py-2 text-xs text-neutral-900 dark:text-neutral-100"
                        >
                            <option value="">-- {t('common.all', 'كافة الكيانات')} --</option>
                            {availableEntities.map((ent) => (
                                <option key={ent} value={ent}>
                                    {ent.split('\\').pop()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* User Filter */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                            {t('audit.user', 'المستخدم')}
                        </label>
                        <select
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2 py-2 text-xs text-neutral-900 dark:text-neutral-100"
                        >
                            <option value="">-- {t('common.all', 'كافة المستخدمين')} --</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit / Reset Actions */}
                    <div className="flex items-end gap-2">
                        <Button type="submit" size="sm" className="bg-primary text-primary-foreground text-xs flex-1">
                            <Filter className="h-3.5 w-3.5 me-1" />
                            <span>{t('common.filter', 'تطبيق')}</span>
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleReset} className="text-xs">
                            <span>{t('common.reset', 'إلغاء')}</span>
                        </Button>
                    </div>
                </form>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-medium text-xs">
                            <tr>
                                <th className="px-5 py-3.5 text-start">{t('audit.timestamp', 'التوقيت')}</th>
                                <th className="px-5 py-3.5 text-start">{t('audit.user', 'المستخدم')}</th>
                                <th className="px-5 py-3.5 text-start">{t('audit.action', 'الإجراء')}</th>
                                <th className="px-5 py-3.5 text-start">{t('audit.entity', 'الكيان المعني')}</th>
                                <th className="px-5 py-3.5 text-start">{t('audit.ipAddress', 'عنوان IP')}</th>
                                <th className="px-5 py-3.5 text-end">{t('common.details', 'التفاصيل والبيانات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {logs.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                                        <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p>{t('audit.noLogs', 'لا توجد سجلات تدقيق مطابقة للبحث')}</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                                        {/* Timestamp */}
                                        <td className="px-5 py-3.5 text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                                            <div>{log.created_at?.slice(0, 10)}</div>
                                            <div className="text-[10px] text-neutral-400">{log.created_at?.slice(11, 19)}</div>
                                        </td>

                                        {/* User */}
                                        <td className="px-5 py-3.5">
                                            {log.user ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                        {log.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-neutral-900 dark:text-neutral-100 text-xs">{log.user.name}</p>
                                                        <p className="text-[10px] text-neutral-400">{log.user.email}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-neutral-400 italic">System / Job</span>
                                            )}
                                        </td>

                                        {/* Action Badge */}
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono ${getActionBadge(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>

                                        {/* Entity */}
                                        <td className="px-5 py-3.5 text-xs">
                                            {log.entity_type ? (
                                                <div>
                                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                        {log.entity_type.split('\\').pop()}
                                                    </span>
                                                    {log.entity_id && (
                                                        <span className="block text-[10px] text-neutral-400 font-mono">
                                                            ID: {log.entity_id.slice(0, 8)}...
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-neutral-400">-</span>
                                            )}
                                        </td>

                                        {/* IP */}
                                        <td className="px-5 py-3.5 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                                            {log.ip_address || '-'}
                                        </td>

                                        {/* Details button */}
                                        <td className="px-5 py-3.5 text-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedLog(log)}
                                                className="gap-1 text-xs text-primary hover:bg-primary/10"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                <span>{t('audit.viewDiff', 'مقارنة التغييرات')}</span>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Field-Level Diff Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                <div>
                                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 font-mono">
                                        {selectedLog.action}
                                    </h2>
                                    <p className="text-xs text-neutral-500">
                                        {selectedLog.entity_type || 'General'} | {selectedLog.created_at}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} className="h-8 w-8 text-neutral-500">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pe-1 text-xs">
                            {/* Metadata snippet */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-lg text-xs">
                                <div>
                                    <span className="text-neutral-400 block text-[10px]">المستخدم</span>
                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{selectedLog.user?.name || 'System'}</span>
                                </div>
                                <div>
                                    <span className="text-neutral-400 block text-[10px]">عنوان IP</span>
                                    <span className="font-mono text-neutral-800 dark:text-neutral-200">{selectedLog.ip_address || '-'}</span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-neutral-400 block text-[10px]">معرف المتصفح / العميل</span>
                                    <span className="text-[10px] text-neutral-600 dark:text-neutral-400 truncate block">{selectedLog.user_agent || '-'}</span>
                                </div>
                            </div>

                            {/* Old vs New Values Side-by-Side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Old Values */}
                                <div className="border border-rose-200 dark:border-rose-900/50 rounded-lg overflow-hidden">
                                    <div className="bg-rose-50 dark:bg-rose-950/30 px-3 py-2 font-semibold text-rose-700 dark:text-rose-400 border-b border-rose-200 dark:border-rose-900/50">
                                        {t('audit.oldValues', 'القيم السابقة (Before)')}
                                    </div>
                                    <div className="p-3 bg-neutral-900 text-neutral-100 font-mono text-[11px] overflow-x-auto min-h-36">
                                        {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 ? (
                                            <pre className="whitespace-pre-wrap leading-relaxed">
                                                {JSON.stringify(selectedLog.old_values, null, 2)}
                                            </pre>
                                        ) : (
                                            <span className="text-neutral-500 italic">-- لا توجد بيانات سابقة (إنشاء جديد) --</span>
                                        )}
                                    </div>
                                </div>

                                {/* New Values */}
                                <div className="border border-emerald-200 dark:border-emerald-900/50 rounded-lg overflow-hidden">
                                    <div className="bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 font-semibold text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-900/50">
                                        {t('audit.newValues', 'القيم الجديدة المحدثة (After)')}
                                    </div>
                                    <div className="p-3 bg-neutral-900 text-neutral-100 font-mono text-[11px] overflow-x-auto min-h-36">
                                        {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 ? (
                                            <pre className="whitespace-pre-wrap leading-relaxed text-emerald-400">
                                                {JSON.stringify(selectedLog.new_values, null, 2)}
                                            </pre>
                                        ) : (
                                            <span className="text-neutral-500 italic">-- لا توجد قيم جديدة (عملية حذف) --</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t dark:border-neutral-800 flex justify-end">
                            <Button onClick={() => setSelectedLog(null)} variant="outline" size="sm">
                                {t('common.close', 'إغلاق')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
