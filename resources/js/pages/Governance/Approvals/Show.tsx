import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, FileCheck2, CheckCircle2, XCircle, Clock, ShieldCheck, User, AlertTriangle, MessageSquare, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface UserInfo {
    id: number;
    name: string;
    email: string;
}

interface RuleLevel {
    id: string;
    level_number: number;
    level_name: string;
    approver_role?: string;
    approverUser?: UserInfo;
}

interface Rule {
    id: string;
    name: string;
    module: string;
    levels: RuleLevel[];
}

interface Action {
    id: string;
    level_number: number;
    action: 'approved' | 'rejected';
    comments?: string;
    action_at: string;
    actor: UserInfo;
}

interface ApprovalRequest {
    id: string;
    document_type: string;
    document_id: string;
    document_number: string;
    amount: string;
    currency: string;
    current_level: number;
    total_levels: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    notes?: string;
    created_at: string;
    approved_at?: string;
    rejected_at?: string;
    requester: UserInfo;
    rule?: Rule;
    actions: Action[];
}

interface Props {
    approvalRequest: ApprovalRequest;
}

export default function ShowApproval({ approvalRequest }: Props) {
    const { t, isRtl } = useTranslation();
    const [showRejectModal, setShowRejectModal] = useState(false);

    const approveForm = useForm({
        comments: '',
    });

    const rejectForm = useForm({
        reason: '',
    });

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        approveForm.post(`/governance/approvals/${approvalRequest.id}/approve`);
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        rejectForm.post(`/governance/approvals/${approvalRequest.id}/reject`, {
            onSuccess: () => setShowRejectModal(false),
        });
    };

    const isPending = approvalRequest.status === 'pending';

    return (
        <div className="max-w-4xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`${t('governance.request', 'طلب اعتماد')} ${approvalRequest.document_number}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/governance/approvals">
                        <Button variant="outline" size="icon">
                            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight font-mono text-foreground flex items-center gap-2">
                                <FileCheck2 className="w-6 h-6 text-primary" />
                                {approvalRequest.document_number}
                            </h1>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                                {approvalRequest.document_type}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t('governance.requestedBy', 'مقدم الطلب')}: {approvalRequest.requester?.name} ({approvalRequest.requester?.email})
                        </p>
                    </div>
                </div>

                <div>
                    {approvalRequest.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3.5 py-1.5 rounded-full text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            {t('governance.statusApproved', 'معتمد نهائياً')}
                        </span>
                    )}
                    {approvalRequest.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-3.5 py-1.5 rounded-full text-sm font-bold">
                            <XCircle className="w-4 h-4" />
                            {t('governance.statusRejected', 'تم رفض الطلب')}
                        </span>
                    )}
                    {approvalRequest.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-3.5 py-1.5 rounded-full text-sm font-bold animate-pulse">
                            <Clock className="w-4 h-4" />
                            {t('governance.statusPendingLevel', 'بانتظار اعتماد المستوى')} {approvalRequest.current_level}
                        </span>
                    )}
                </div>
            </div>

            {/* Financial Overview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('governance.requestedAmount', 'المبلغ المعروض للاعتماد')}</div>
                    <div className="text-2xl font-bold font-mono text-primary mt-1">
                        {parseFloat(approvalRequest.amount).toLocaleString()} {approvalRequest.currency}
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('governance.activeRule', 'قاعدة الحوكمة المطبقة')}</div>
                    <div className="text-base font-semibold mt-1">
                        {approvalRequest.rule?.name || t('governance.standardPolicy', 'سياسة الاعتماد الافتراضية')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {approvalRequest.total_levels} {t('governance.requiredLevelsCount', 'مستويات اعتماد')}
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-5 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('common.createdAt', 'تاريخ تقديم الطلب')}</div>
                    <div className="text-base font-semibold mt-1">
                        {new Date(approvalRequest.created_at).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Multi-Level Workflow Visual Stepper */}
            <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
                <h2 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    {t('governance.approvalChain', 'سلسلة ومراحل الاعتماد (Approval Workflow)')}
                </h2>

                <div className="space-y-4">
                    {approvalRequest.rule?.levels.map((lvl) => {
                        const action = approvalRequest.actions.find((a) => a.level_number === lvl.level_number);
                        const isCurrent = isPending && approvalRequest.current_level === lvl.level_number;
                        const isPast = approvalRequest.current_level > lvl.level_number || approvalRequest.status === 'approved';

                        return (
                            <div
                                key={lvl.id}
                                className={`border rounded-xl p-4 transition-colors ${
                                    action?.action === 'approved'
                                        ? 'bg-emerald-50/40 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800'
                                        : action?.action === 'rejected'
                                        ? 'bg-red-50/40 border-red-300 dark:bg-red-950/20 dark:border-red-800'
                                        : isCurrent
                                        ? 'bg-amber-50/40 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800 ring-2 ring-amber-400/50'
                                        : 'bg-muted/20 opacity-60'
                                }`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                                                action?.action === 'approved'
                                                    ? 'bg-emerald-600 text-white'
                                                    : action?.action === 'rejected'
                                                    ? 'bg-red-600 text-white'
                                                    : isCurrent
                                                    ? 'bg-amber-500 text-white animate-bounce'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {action?.action === 'approved' ? (
                                                <CheckCircle2 className="w-5 h-5" />
                                            ) : action?.action === 'rejected' ? (
                                                <XCircle className="w-5 h-5" />
                                            ) : (
                                                lvl.level_number
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-base">{lvl.level_name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {lvl.approverUser
                                                    ? `${t('governance.designatedApprover', 'المعتمد المحدد')}: ${lvl.approverUser.name}`
                                                    : `${t('governance.designatedRole', 'الدور المعتمد')}: ${lvl.approver_role || 'مدير مالي'}`}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        {action?.action === 'approved' && (
                                            <div className="text-start sm:text-end text-xs text-emerald-700 dark:text-emerald-400">
                                                <div className="font-bold">{t('governance.approvedBy', 'تم الاعتماد بواسطة')}: {action.actor?.name}</div>
                                                <div>{new Date(action.action_at).toLocaleString()}</div>
                                            </div>
                                        )}
                                        {action?.action === 'rejected' && (
                                            <div className="text-start sm:text-end text-xs text-red-700 dark:text-red-400">
                                                <div className="font-bold">{t('governance.rejectedBy', 'تم الرفض بواسطة')}: {action.actor?.name}</div>
                                                <div>{new Date(action.action_at).toLocaleString()}</div>
                                            </div>
                                        )}
                                        {!action && isCurrent && (
                                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2.5 py-1 rounded-full">
                                                {t('governance.currentlyAwaiting', 'المرحلة الحالية قيد الانتظار')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {action?.comments && (
                                    <div className="mt-3 pt-3 border-t text-sm bg-background/50 p-2.5 rounded-md flex items-start gap-2">
                                        <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                                        <div>
                                            <span className="font-medium text-xs text-muted-foreground block">{t('governance.approverComments', 'ملاحظات وتوجيهات المعتمد')}:</span>
                                            <span>{action.comments}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Action Card (For Pending Requests) */}
            {isPending && (
                <div className="bg-card border-2 border-primary/40 rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                        <FileCheck2 className="w-5 h-5 text-primary" />
                        {t('governance.takeActionHeader', 'اتخاذ قرار الاعتماد للمستوى الحالي')} ({approvalRequest.current_level})
                    </h3>

                    <form onSubmit={handleApprove} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">
                                {t('governance.optionalComments', 'ملاحظات الموافقة (اختياري)')}
                            </label>
                            <input
                                type="text"
                                value={approveForm.data.comments}
                                onChange={(e) => approveForm.setData('comments', e.target.value)}
                                placeholder={t('governance.approveCommentsPlaceholder', 'تمت المراجعة والتأكد من مطابقة الأسعار والسيولة...')}
                                className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setShowRejectModal(true)}
                                className="gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                {t('governance.rejectBtn', 'رفض الطلب')}
                            </Button>

                            <Button
                                type="submit"
                                disabled={approveForm.processing}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold px-6"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {approveForm.processing
                                    ? t('governance.approving', 'جاري التسجيل...')
                                    : `${t('governance.approveBtn', 'اعتماد المستوى')} ${approvalRequest.current_level}`}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-card border rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center gap-2 text-destructive font-bold text-lg">
                            <AlertTriangle className="w-5 h-5" />
                            {t('governance.rejectTitle', 'تأكيد رفض طلب الاعتماد')}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t('governance.rejectDesc', 'يرجى توضيح سبب الرفض بالتفصيل. سيتم إيقاف مسار المعاملة وإشعار مقدم الطلب.')}
                        </p>

                        <form onSubmit={handleReject} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">
                                    {t('governance.rejectionReason', 'سبب الرفض')} <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={rejectForm.data.reason}
                                    onChange={(e) => rejectForm.setData('reason', e.target.value)}
                                    placeholder={t('governance.reasonPlaceholder', 'المبلغ يتجاوز الميزانية التقديرية المعتمدة لهذا الشهر...')}
                                    className="w-full p-3 border rounded-md bg-background text-sm resize-none"
                                />
                                {rejectForm.errors.reason && (
                                    <p className="text-xs text-destructive">{rejectForm.errors.reason}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowRejectModal(false)}
                                >
                                    {t('common.cancel', 'إلغاء')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={rejectForm.processing || !rejectForm.data.reason.trim()}
                                >
                                    {rejectForm.processing ? t('common.submitting', 'جاري الرفض...') : t('governance.confirmReject', 'تأكيد الرفض')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
