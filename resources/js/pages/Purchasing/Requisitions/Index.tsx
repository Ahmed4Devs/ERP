import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, FileText, CheckCircle2, Clock, Eye, AlertCircle, ShoppingCart, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Department {
    id: string;
    name: string;
    code?: string;
}

interface PurchaseOrder {
    id: string;
    po_number: string;
}

interface PurchaseRequisition {
    id: string;
    requisition_number: string;
    required_date?: string;
    status: 'draft' | 'submitted' | 'approved' | 'converted' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    total_estimated_amount: string;
    notes?: string;
    created_at: string;
    requester?: User;
    approver?: User;
    department?: Department;
    purchase_order?: PurchaseOrder;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    requisitions: PaginatedData<PurchaseRequisition>;
    filters: {
        search?: string;
        status?: string;
        priority?: string;
    };
}

export default function PurchaseRequisitionsIndex({ requisitions, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedPriority, setSelectedPriority] = useState(filters.priority || '');

    const handleFilter = (newStatus?: string, newPriority?: string) => {
        const s = newStatus !== undefined ? newStatus : selectedStatus;
        const p = newPriority !== undefined ? newPriority : selectedPriority;
        setSelectedStatus(s);
        setSelectedPriority(p);
        router.get(
            '/purchase-requisitions',
            {
                search: search || undefined,
                status: s || undefined,
                priority: p || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter();
    };

    const statusBadge = (status: PurchaseRequisition['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
            case 'submitted':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800';
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
            case 'converted':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const priorityBadge = (priority: PurchaseRequisition['priority']) => {
        switch (priority) {
            case 'urgent':
                return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
            case 'high':
                return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
            case 'medium':
                return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
            case 'low':
                return 'text-neutral-600 bg-neutral-50 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700';
            default:
                return 'text-neutral-600';
        }
    };

    const submittedCount = requisitions.data.filter((r) => r.status === 'submitted').length;
    const approvedCount = requisitions.data.filter((r) => r.status === 'approved').length;
    const convertedCount = requisitions.data.filter((r) => r.status === 'converted').length;
    const totalEst = requisitions.data.reduce((acc, r) => acc + parseFloat(r.total_estimated_amount || '0'), 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('purchasing.requisitions.title', 'طلبات الشراء الداخلية (PR)')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        <span>{t('purchasing.requisitions.title', 'طلبات الشراء الداخلية (Purchase Requisitions)')}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {t('purchasing.requisitions.subtitle', 'إدارة دورة طلبات الشراء الداخلية، الموافقات الإدارية والتحويل المباشر لأوامر الشراء')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link href="/purchase-requisitions/create">
                            <Plus className="h-4 w-4" />
                            <span>{t('purchasing.requisitions.create', 'طلب شراء جديد')}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{t('common.total', 'إجمالي الطلبات')}</p>
                        <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{requisitions.total}</p>
                    </div>
                    <div className="h-10 w-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                        <FileText className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('purchasing.requisitions.pendingApproval', 'بانتظار الاعتماد')}</p>
                        <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">{submittedCount}</p>
                    </div>
                    <div className="h-10 w-10 bg-amber-50 dark:bg-amber-950/50 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <Clock className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('purchasing.requisitions.approved', 'معتمدة جاهزة للتحويل')}</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{approvedCount}</p>
                    </div>
                    <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">{t('purchasing.requisitions.converted', 'محولة لأوامر شراء')}</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">{convertedCount}</p>
                    </div>
                    <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/50 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <ShoppingCart className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
                    <Search className={`absolute top-2.5 h-4 w-4 text-neutral-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                    <Input
                        type="text"
                        placeholder={t('common.search', 'البحث بالرقم أو الملاحظات...')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`w-full text-sm ${isRtl ? 'pr-9' : 'pl-9'}`}
                    />
                </form>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <span className="text-xs text-neutral-500 font-medium">{t('common.status', 'الحالة')}:</span>
                    {['', 'draft', 'submitted', 'approved', 'converted', 'rejected'].map((st) => (
                        <button
                            key={st}
                            type="button"
                            onClick={() => handleFilter(st, undefined)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                selectedStatus === st
                                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                            }`}
                        >
                            {st === '' ? t('common.all', 'الكل') : t(`purchasing.requisitions.status.${st}`, st)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-medium text-xs">
                            <tr>
                                <th className="px-6 py-3.5 text-start">{t('purchasing.requisitions.number', 'رقم الطلب')}</th>
                                <th className="px-6 py-3.5 text-start">{t('purchasing.requisitions.requester', 'طالب الشراء')}</th>
                                <th className="px-6 py-3.5 text-start">{t('purchasing.requisitions.department', 'القسم')}</th>
                                <th className="px-6 py-3.5 text-start">{t('purchasing.requisitions.priority', 'الأولوية')}</th>
                                <th className="px-6 py-3.5 text-start">{t('purchasing.requisitions.requiredDate', 'تاريخ الاستحقاق')}</th>
                                <th className="px-6 py-3.5 text-start">{t('common.status', 'الحالة')}</th>
                                <th className="px-6 py-3.5 text-end">{t('purchasing.requisitions.estimatedTotal', 'القيمة التقديرية')}</th>
                                <th className="px-6 py-3.5 text-end">{t('common.actions', 'الإجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {requisitions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p>{t('common.noData', 'لا توجد طلبات شراء مسجلة')}</p>
                                    </td>
                                </tr>
                            ) : (
                                requisitions.data.map((req) => (
                                    <tr key={req.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            <Link href={`/purchase-requisitions/${req.id}`} className="hover:underline text-primary">
                                                {req.requisition_number}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300">
                                            {req.requester?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                            {req.department?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${priorityBadge(req.priority)}`}>
                                                {t(`purchasing.requisitions.priority.${req.priority}`, req.priority)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                            {req.required_date || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusBadge(req.status)}`}>
                                                {t(`purchasing.requisitions.status.${req.status}`, req.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(req.total_estimated_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.purchase_order && (
                                                    <Button asChild variant="outline" size="sm" className="gap-1 text-xs text-blue-600 border-blue-200">
                                                        <Link href={`/purchase-orders/${req.purchase_order.id}`}>
                                                            <ShoppingCart className="h-3 w-3" />
                                                            <span>{req.purchase_order.po_number}</span>
                                                        </Link>
                                                    </Button>
                                                )}
                                                <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 hover:text-neutral-900">
                                                    <Link href={`/purchase-requisitions/${req.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                        <span>{t('common.view', 'عرض')}</span>
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
        </div>
    );
}
