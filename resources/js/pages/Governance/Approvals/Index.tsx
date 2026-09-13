import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, FileCheck2, Eye, Clock, CheckCircle2, XCircle, DollarSign, Scale, User, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Requester {
    id: number;
    name: string;
    email: string;
}

interface ApprovalRequest {
    id: string;
    document_type: string;
    document_number: string;
    amount: string;
    currency: string;
    current_level: number;
    total_levels: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    created_at: string;
    requester: Requester;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    requests: PaginatedData<ApprovalRequest>;
    metrics: {
        pending_count: number;
        approved_count: number;
        rejected_count: number;
        pending_total_amount: number;
    };
    filters: {
        status?: string;
        document_type?: string;
        search?: string;
    };
}

export default function ApprovalsIndex({ requests, metrics, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [selectedDocType, setSelectedDocType] = useState(filters.document_type || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/governance/approvals', {
            search: search || undefined,
            status: selectedStatus || undefined,
            document_type: selectedDocType || undefined,
        }, { preserveState: true, replace: true });
    };

    const getDocumentTypeLabel = (type: string) => {
        switch (type) {
            case 'vendor_bill':
                return { label: t('governance.vendorBill', 'فاتورة مورد'), color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
            case 'vendor_payment':
                return { label: t('governance.vendorPayment', 'سند صرف مورد'), color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
            case 'journal_entry':
                return { label: t('governance.journalEntry', 'قيد محاسبي يدوي'), color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
            case 'petty_cash_settlement':
                return { label: t('governance.pettyCash', 'تسوية صندوق عهدة'), color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
            case 'employee_loan':
                return { label: t('governance.employeeLoan', 'طلب سلفة موظف'), color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' };
            case 'fixed_asset_disposal':
                return { label: t('governance.assetDisposal', 'استبعاد/بيع أصل ثابت'), color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
            default:
                return { label: type, color: 'bg-muted text-foreground' };
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs px-2.5 py-1 rounded-full font-semibold animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        {t('governance.statusPending', 'بانتظار الاعتماد')}
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('governance.statusApproved', 'معتمد نهائياً')}
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        {t('governance.statusRejected', 'مرفوض')}
                    </span>
                );
            default:
                return <span className="bg-muted text-foreground text-xs px-2.5 py-0.5 rounded-full">{status}</span>;
        }
    };

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('governance.title', 'مركز الموافقات والحوكمة المالية')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <FileCheck2 className="w-7 h-7 text-primary" />
                        {t('governance.title', 'مركز الموافقات والحوكمة المالية')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('governance.subtitle', 'سلاسل الاعتماد متعددة المستويات ومصفوفة الصلاحيات (DOA) للعمليات المالية الحرجة')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/governance/rules">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Scale className="w-4 h-4" />
                            {t('governance.doaRulesBtn', 'مصفوفة الصلاحيات (DOA)')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-amber-300 dark:border-amber-800 rounded-xl p-4 shadow-sm bg-amber-50/50 dark:bg-amber-950/20">
                    <div className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {t('governance.pendingRequests', 'طلبات بانتظار الاعتماد')}
                    </div>
                    <div className="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-400">{metrics.pending_count}</div>
                </div>

                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('governance.pendingTotalAmount', 'إجمالي مبالغ الطلبات المعلقة')}</div>
                    <div className="text-2xl font-bold mt-1 text-primary">{metrics.pending_total_amount.toLocaleString()} ر.س</div>
                </div>

                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('governance.approvedCount', 'طلبات مكتملة الاعتماد')}</div>
                    <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{metrics.approved_count}</div>
                </div>

                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">{t('governance.rejectedCount', 'طلبات مرفوضة')}</div>
                    <div className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{metrics.rejected_count}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearch} className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute top-3 start-3 text-muted-foreground" />
                        <Input
                            placeholder={t('governance.searchPlaceholder', 'رقم المستند أو اسم مقدم الطلب...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">{t('governance.allStatuses', 'جميع الحالات')}</option>
                            <option value="pending">{t('governance.statusPending', 'بانتظار الاعتماد')}</option>
                            <option value="approved">{t('governance.statusApproved', 'معتمد')}</option>
                            <option value="rejected">{t('governance.statusRejected', 'مرفوض')}</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={selectedDocType}
                            onChange={(e) => setSelectedDocType(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">{t('governance.allDocTypes', 'جميع أنواع المستندات')}</option>
                            <option value="vendor_bill">{t('governance.vendorBill', 'فواتير الموردين')}</option>
                            <option value="vendor_payment">{t('governance.vendorPayment', 'سندات صرف الموردين')}</option>
                            <option value="journal_entry">{t('governance.journalEntry', 'القيود اليومية')}</option>
                            <option value="petty_cash_settlement">{t('governance.pettyCash', 'تسويات العهد النقدية')}</option>
                            <option value="employee_loan">{t('governance.employeeLoan', 'سلف وقروض الموظفين')}</option>
                            <option value="fixed_asset_disposal">{t('governance.assetDisposal', 'استبعاد وبيع الأصول')}</option>
                        </select>
                    </div>
                    <div>
                        <Button type="submit" className="w-full gap-2">
                            <Search className="w-4 h-4" />
                            {t('common.filter', 'بحث وتصفية')}
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
                                <th className="px-4 py-3 text-start">{t('governance.docNumber', 'رقم المستند')}</th>
                                <th className="px-4 py-3 text-start">{t('governance.docType', 'النوع / الوحدة')}</th>
                                <th className="px-4 py-3 text-start">{t('governance.requester', 'مقدم الطلب')}</th>
                                <th className="px-4 py-3 text-end">{t('governance.amount', 'المبلغ المطلوب')}</th>
                                <th className="px-4 py-3 text-center">{t('governance.progress', 'مسار الاعتماد')}</th>
                                <th className="px-4 py-3 text-center">{t('common.status', 'الحالة')}</th>
                                <th className="px-4 py-3 text-center">{t('common.actions', 'إجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {requests.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                        {t('governance.noRequestsFound', 'لا توجد طلبات موافقة مطابقة')}
                                    </td>
                                </tr>
                            ) : (
                                requests.data.map((req) => {
                                    const docType = getDocumentTypeLabel(req.document_type);
                                    const progressPercent = Math.min(100, Math.round(((req.status === 'approved' ? req.total_levels : req.current_level - 1) / req.total_levels) * 100));

                                    return (
                                        <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-mono font-bold text-primary">{req.document_number}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2.5 py-1 rounded font-medium ${docType.color}`}>
                                                    {docType.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{req.requester?.name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-end font-bold font-mono text-base">
                                                {parseFloat(req.amount).toLocaleString()} {req.currency}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="max-w-[140px] mx-auto space-y-1 text-center">
                                                    <div className="text-xs font-medium text-muted-foreground">
                                                        {req.status === 'approved' ? (
                                                            <span>{t('governance.allLevelsApproved', 'اكتملت جميع المستويات')} ({req.total_levels}/{req.total_levels})</span>
                                                        ) : (
                                                            <span>{t('governance.level', 'المستوى')} {req.current_level} {t('common.of', 'من')} {req.total_levels}</span>
                                                        )}
                                                    </div>
                                                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-2 rounded-full ${req.status === 'rejected' ? 'bg-red-500' : 'bg-primary'}`}
                                                            style={{ width: `${progressPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Link href={`/governance/approvals/${req.id}`}>
                                                    <Button variant="outline" size="sm" className="h-8 gap-1">
                                                        <Eye className="w-3.5 h-3.5" />
                                                        {t('common.review', 'مراجعة واعتماد')}
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {requests.last_page > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            {t('common.showing', 'عرض')} {(requests.current_page - 1) * requests.per_page + 1} -{' '}
                            {Math.min(requests.current_page * requests.per_page, requests.total)} {t('common.of', 'من')} {requests.total}
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={requests.current_page === 1}
                                onClick={() => router.get(`/governance/approvals?page=${requests.current_page - 1}`, {}, { preserveState: true })}
                            >
                                {t('common.previous', 'السابق')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={requests.current_page === requests.last_page}
                                onClick={() => router.get(`/governance/approvals?page=${requests.current_page + 1}`, {}, { preserveState: true })}
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
