import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Calendar, Check, Clock, Plus, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface LeaveRequest {
    id: string;
    employee_id: string;
    leave_type: 'annual' | 'sick' | 'unpaid' | 'emergency' | 'maternity';
    start_date: string;
    end_date: string;
    days_count: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    reason?: string;
    rejection_reason?: string;
    approved_at?: string;
    employee?: {
        id: string;
        first_name: string;
        last_name: string;
        first_name_ar?: string;
        last_name_ar?: string;
        employee_number: string;
        department?: { name: string };
        designation?: { name: string };
    };
    approver?: {
        name: string;
    };
}

interface Props {
    leaveRequests: {
        data: LeaveRequest[];
        links: any[];
    };
    employees: Array<{ id: string; first_name: string; last_name: string; employee_number: string }>;
    metrics: {
        total_requests: number;
        pending_count: number;
        approved_days: number;
    };
    filters: {
        status?: string;
        leave_type?: string;
    };
}

export default function LeavesIndex({ leaveRequests, employees, metrics, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const form = useForm({
        employee_id: employees[0]?.id || '',
        leave_type: 'annual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: '',
    });

    const rejectForm = useForm({
        rejection_reason: '',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/hr/leaves', {
            onSuccess: () => {
                setIsCreateOpen(false);
                form.reset();
            },
        });
    };

    const handleApprove = (id: string) => {
        if (confirm(t('hr.leaves.confirmApprove', 'هل تريد بالتأكيد اعتماد طلب الإجازة؟'))) {
            form.post(`/hr/leaves/${id}/approve`);
        }
    };

    const handleReject = (e: React.FormEvent, id: string) => {
        e.preventDefault();
        rejectForm.post(`/hr/leaves/${id}/reject`, {
            onSuccess: () => {
                setRejectingId(null);
                rejectForm.reset();
            },
        });
    };

    const getLeaveTypeBadge = (type: string) => {
        switch (type) {
            case 'annual':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">{t('hr.leaves.annual', 'سنوية')}</span>;
            case 'sick':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{t('hr.leaves.sick', 'مرضية')}</span>;
            case 'emergency':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">{t('hr.leaves.emergency', 'اضطرارية')}</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300">{type}</span>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">{t('common.approved', 'معتمدة')}</span>;
            case 'rejected':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">{t('common.rejected', 'مرفوضة')}</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{t('common.pending', 'قيد الانتظار')}</span>;
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('hr.leaves.title', 'إدارة الإجازات والأرصدة')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {t('hr.leaves.title', 'إدارة الإجازات والأرصدة')}
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t('hr.leaves.subtitle', 'تقديم ومتابعة طلبات الإجازات السنوية والمرضية والاضطرارية واعتمادها')}
                    </p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="w-4 h-4" />
                    {t('hr.leaves.newRequest', 'تقديم طلب إجازة')}
                </Button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('hr.leaves.totalRequests', 'إجمالي الطلبات')}</span>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{metrics.total_requests}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('hr.leaves.pendingRequests', 'طلبات بانتظار الاعتماد')}</span>
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">{metrics.pending_count}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t('hr.leaves.approvedDays', 'إجمالي الأيام المعتمدة')}</span>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Check className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{Number(metrics.approved_days).toFixed(1)} {t('common.days', 'يوم')}</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="py-3.5 px-4">{t('hr.employee', 'الموظف')}</th>
                                <th className="py-3.5 px-4">{t('hr.leaves.type', 'نوع الإجازة')}</th>
                                <th className="py-3.5 px-4">{t('hr.leaves.period', 'الفترة')}</th>
                                <th className="py-3.5 px-4">{t('hr.leaves.days', 'الأيام')}</th>
                                <th className="py-3.5 px-4">{t('common.status', 'الحالة')}</th>
                                <th className="py-3.5 px-4">{t('common.reason', 'السبب / الملاحظات')}</th>
                                <th className="py-3.5 px-4 text-center">{t('common.actions', 'الإجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {leaveRequests.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-zinc-500 dark:text-zinc-400">
                                        {t('common.noData', 'لا توجد طلبات إجازة مسجلة')}
                                    </td>
                                </tr>
                            ) : (
                                leaveRequests.data.map((req) => (
                                    <tr key={req.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                        <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div>{req.employee?.first_name} {req.employee?.last_name}</div>
                                                    <div className="text-xs text-zinc-400">{req.employee?.employee_number} - {req.employee?.department?.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">{getLeaveTypeBadge(req.leave_type)}</td>
                                        <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                                            {req.start_date} <span className="text-zinc-400">←</span> {req.end_date}
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                                            {req.days_count} {t('common.days', 'أيام')}
                                        </td>
                                        <td className="py-3.5 px-4">{getStatusBadge(req.status)}</td>
                                        <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                                            {req.reason || req.rejection_reason || '-'}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleApprove(req.id)} className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/40 dark:hover:bg-emerald-900/20">
                                                        <Check className="w-4 h-4 mr-1" />
                                                        {t('common.approve', 'اعتماد')}
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => setRejectingId(req.id)} className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-900/20">
                                                        <X className="w-4 h-4 mr-1" />
                                                        {t('common.reject', 'رفض')}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-400">
                                                    {req.approver ? `${t('hr.approvedBy', 'بواسطة')}: ${req.approver.name}` : '-'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b pb-3 border-zinc-100 dark:border-zinc-800">
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{t('hr.leaves.newRequest', 'تقديم طلب إجازة جديد')}</h3>
                            <button onClick={() => setIsCreateOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.employee', 'الموظف')}</label>
                                <select
                                    value={form.data.employee_id}
                                    onChange={(e) => form.setData('employee_id', e.target.value)}
                                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.employee_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.leaves.type', 'نوع الإجازة')}</label>
                                <select
                                    value={form.data.leave_type}
                                    onChange={(e) => form.setData('leave_type', e.target.value as any)}
                                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="annual">{t('hr.leaves.annual', 'إجازة سنوية اعتيادية')}</option>
                                    <option value="sick">{t('hr.leaves.sick', 'إجازة مرضية')}</option>
                                    <option value="emergency">{t('hr.leaves.emergency', 'إجازة اضطرارية')}</option>
                                    <option value="unpaid">{t('hr.leaves.unpaid', 'إجازة بدون راتب')}</option>
                                    <option value="maternity">{t('hr.leaves.maternity', 'إجازة وضع / أمومة')}</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('common.startDate', 'تاريخ البدء')}</label>
                                    <Input
                                        type="date"
                                        value={form.data.start_date}
                                        onChange={(e) => form.setData('start_date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('common.endDate', 'تاريخ الانتهاء')}</label>
                                    <Input
                                        type="date"
                                        value={form.data.end_date}
                                        onChange={(e) => form.setData('end_date', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('common.reason', 'سبب الإجازة والملاحظات')}</label>
                                <textarea
                                    value={form.data.reason}
                                    onChange={(e) => form.setData('reason', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>{t('common.cancel', 'إلغاء')}</Button>
                                <Button type="submit" disabled={form.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">{t('common.save', 'تقديم الطلب')}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {rejectingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{t('hr.leaves.rejectTitle', 'رفض طلب الإجازة')}</h3>
                        <form onSubmit={(e) => handleReject(e, rejectingId)} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">{t('hr.leaves.rejectionReason', 'سبب الرفض')}</label>
                                <textarea
                                    value={rejectForm.data.rejection_reason}
                                    onChange={(e) => rejectForm.setData('rejection_reason', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-sm focus:ring-2 focus:ring-rose-500"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setRejectingId(null)}>{t('common.cancel', 'إلغاء')}</Button>
                                <Button type="submit" disabled={rejectForm.processing} className="bg-rose-600 hover:bg-rose-700 text-white">{t('common.reject', 'تأكيد الرفض')}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
