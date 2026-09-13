import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock,
    FileText,
    Send,
    XCircle,
    ShoppingCart,
    AlertCircle,
    UserCheck,
    Building2,
    Calendar,
    DollarSign,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AttachmentManager from '@/components/erp/AttachmentManager';

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

interface Branch {
    id: string;
    name: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
}

interface Line {
    id: string;
    description: string;
    quantity: string;
    estimated_unit_cost: string;
    estimated_total: string;
    notes?: string;
    product?: Product;
}

interface PurchaseOrder {
    id: string;
    po_number: string;
    total: string;
    status: string;
}

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    tax_id?: string;
}

interface PurchaseRequisition {
    id: string;
    requisition_number: string;
    status: 'draft' | 'submitted' | 'approved' | 'converted' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    total_estimated_amount: string;
    required_date?: string;
    approved_at?: string;
    rejection_reason?: string;
    notes?: string;
    created_at: string;
    requester?: User;
    approver?: User;
    department?: Department;
    branch?: Branch;
    purchase_order?: PurchaseOrder;
    lines: Line[];
    attachments?: any[];
}

interface Props {
    requisition: PurchaseRequisition;
    vendors: Party[];
}

export default function ShowPurchaseRequisition({ requisition, vendors }: Props) {
    const { t, isRtl } = useTranslation();

    const [isConverting, setIsConverting] = useState(false);
    const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
    const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(requisition.required_date || '');

    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const [loadingAction, setLoadingAction] = useState(false);

    const handleSubmit = () => {
        if (!confirm(t('purchasing.requisitions.confirmSubmit', 'هل أنت متأكد من رفع طلب الشراء للاعتماد؟'))) return;
        setLoadingAction(true);
        router.post(`/purchase-requisitions/${requisition.id}/submit`, {}, {
            onFinish: () => setLoadingAction(false),
        });
    };

    const handleApprove = () => {
        if (!confirm(t('purchasing.requisitions.confirmApprove', 'هل أنت متأكد من اعتماد طلب الشراء هذا؟'))) return;
        setLoadingAction(true);
        router.post(`/purchase-requisitions/${requisition.id}/approve`, {}, {
            onFinish: () => setLoadingAction(false),
        });
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        router.post(`/purchase-requisitions/${requisition.id}/reject`, { reason: rejectionReason }, {
            onFinish: () => {
                setLoadingAction(false);
                setIsRejecting(false);
            },
        });
    };

    const handleConvertToPo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVendorId) {
            alert(t('purchasing.requisitions.selectVendorAlert', 'يرجى تحديد المورد لإصدار أمر الشراء له.'));
            return;
        }

        setLoadingAction(true);
        router.post(
            `/purchase-requisitions/${requisition.id}/convert-to-po`,
            {
                vendor_party_id: selectedVendorId,
                expected_delivery_date: expectedDeliveryDate || undefined,
            },
            {
                onFinish: () => {
                    setLoadingAction(false);
                    setIsConverting(false);
                },
            }
        );
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

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
            <Head title={`PR ${requisition.requisition_number}`} />

            {/* Top Bar Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="icon" className="h-9 w-9">
                        <Link href="/purchase-requisitions">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                {requisition.requisition_number}
                            </h1>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusBadge(requisition.status)}`}>
                                {t(`purchasing.requisitions.status.${requisition.status}`, requisition.status)}
                            </span>
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${priorityBadge(requisition.priority)}`}>
                                {t(`purchasing.requisitions.priority.${requisition.priority}`, requisition.priority)}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            {t('purchasing.requisitions.createdDate', 'تاريخ الإنشاء')}: {requisition.created_at?.slice(0, 10)}
                        </p>
                    </div>
                </div>

                {/* Workflow Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Draft -> Submit */}
                    {requisition.status === 'draft' && (
                        <Button
                            onClick={handleSubmit}
                            disabled={loadingAction}
                            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                        >
                            <Send className="h-3.5 w-3.5" />
                            <span>{t('purchasing.requisitions.submit', 'رفع للاعتماد')}</span>
                        </Button>
                    )}

                    {/* Submitted -> Approve or Reject */}
                    {requisition.status === 'submitted' && (
                        <>
                            <Button
                                onClick={handleApprove}
                                disabled={loadingAction}
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>{t('purchasing.requisitions.approve', 'اعتماد الطلب')}</span>
                            </Button>
                            <Button
                                onClick={() => setIsRejecting(true)}
                                disabled={loadingAction}
                                variant="outline"
                                className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold"
                            >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>{t('purchasing.requisitions.reject', 'رفض الطلب')}</span>
                            </Button>
                        </>
                    )}

                    {/* Approved -> 1-Click Convert to PO */}
                    {requisition.status === 'approved' && !requisition.purchase_order && (
                        <Button
                            onClick={() => setIsConverting(true)}
                            disabled={loadingAction}
                            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm"
                        >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            <span>{t('purchasing.requisitions.convertToPo', 'تحويل مباشر لأمر شراء (Convert to PO)')}</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* If Already Converted Banner */}
            {requisition.purchase_order && (
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-300">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200">
                                {t('purchasing.requisitions.convertedTitle', 'تم تحويل هذا الطلب إلى أمر شراء رسمي')}
                            </h3>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                                {t('purchasing.requisitions.convertedDesc', 'رقم أمر الشراء:')}{' '}
                                <span className="font-mono font-bold">{requisition.purchase_order.po_number}</span>
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold">
                        <Link href={`/purchase-orders/${requisition.purchase_order.id}`}>
                            <span>{t('purchasing.requisitions.viewPo', 'عرض أمر الشراء')}</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
            )}

            {/* If Rejected Banner */}
            {requisition.status === 'rejected' && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                            {t('purchasing.requisitions.rejectedTitle', 'تم رفض طلب الشراء')}
                        </h3>
                        {requisition.rejection_reason && (
                            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                                {t('purchasing.requisitions.rejectionReason', 'سبب الرفض:')} {requisition.rejection_reason}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Details Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Items Table & Notes */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Items Table Card */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b dark:border-neutral-800 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-primary" />
                                <span>{t('purchasing.requisitions.items', 'الأصناف والبنود المطلوبة')}</span>
                            </h2>
                            <span className="text-xs text-neutral-500 font-mono">
                                {requisition.lines.length} {t('purchasing.requisitions.lines', 'بنود')}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs font-medium">
                                    <tr>
                                        <th className="px-4 py-3 text-start">{t('purchasing.requisitions.description', 'الوصف')}</th>
                                        <th className="px-4 py-3 text-center w-24">{t('purchasing.requisitions.qty', 'الكمية')}</th>
                                        <th className="px-4 py-3 text-end w-32">{t('purchasing.requisitions.estUnitCost', 'سعر تقديري')}</th>
                                        <th className="px-4 py-3 text-end w-32">{t('purchasing.requisitions.estLineTotal', 'الإجمالي التقديري')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {requisition.lines.map((line) => (
                                        <tr key={line.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                                            <td className="px-4 py-3.5">
                                                <p className="font-medium text-neutral-900 dark:text-neutral-100">{line.description}</p>
                                                {line.product && (
                                                    <p className="text-xs text-neutral-400 font-mono mt-0.5">
                                                        SKU: {line.product.sku}
                                                    </p>
                                                )}
                                                {line.notes && (
                                                    <p className="text-xs text-neutral-500 mt-1 italic">{line.notes}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-center font-mono font-medium text-neutral-800 dark:text-neutral-200">
                                                {Number(line.quantity).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3.5 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                                {Number(line.estimated_unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="px-4 py-3.5 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {Number(line.estimated_total).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-neutral-50 dark:bg-neutral-800/40 font-bold border-t dark:border-neutral-800">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-end text-neutral-700 dark:text-neutral-300">
                                            {t('purchasing.requisitions.totalEstimated', 'إجمالي القيمة التقديرية:')}
                                        </td>
                                        <td className="px-4 py-3 text-end font-mono text-primary text-base">
                                            {Number(requisition.total_estimated_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Notes Card */}
                    {requisition.notes && (
                        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                                {t('purchasing.requisitions.justification', 'مبررات الشراء والملاحظات')}
                            </h3>
                            <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap">
                                {requisition.notes}
                            </p>
                        </div>
                    )}

                    {/* DMS Attachments Integration */}
                    <AttachmentManager
                        attachableType="purchase_requisition"
                        attachableId={requisition.id}
                    />
                </div>

                {/* Right 1 Col: Summary & Governance Information */}
                <div className="space-y-6">
                    {/* Information Summary Card */}
                    <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 border-b pb-3 dark:border-neutral-800">
                            {t('purchasing.requisitions.governance', 'بيانات الحوكمة والطلب')}
                        </h2>

                        <div className="space-y-3.5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-500 flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>{t('purchasing.requisitions.department', 'القسم')}</span>
                                </span>
                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {requisition.department?.name || '-'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-neutral-500 flex items-center gap-1.5">
                                    <UserCheck className="h-3.5 w-3.5" />
                                    <span>{t('purchasing.requisitions.requester', 'طالب الشراء')}</span>
                                </span>
                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {requisition.requester?.name || '-'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-neutral-500 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>{t('purchasing.requisitions.requiredDate', 'تاريخ الاستحقاق')}</span>
                                </span>
                                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                    {requisition.required_date || '-'}
                                </span>
                            </div>

                            {requisition.approver && (
                                <div className="flex items-center justify-between pt-2 border-t dark:border-neutral-800">
                                    <span className="text-neutral-500 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>{t('purchasing.requisitions.approvedBy', 'معتمد من')}</span>
                                    </span>
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                        {requisition.approver.name}
                                    </span>
                                </div>
                            )}

                            {requisition.approved_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-neutral-500 flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                                        <span>{t('purchasing.requisitions.approvedAt', 'تاريخ الاعتماد')}</span>
                                    </span>
                                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                                        {requisition.approved_at?.slice(0, 16)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Convert to PO Modal */}
            {isConverting && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-base">
                            <ShoppingCart className="h-5 w-5" />
                            <span>{t('purchasing.requisitions.convertModalTitle', 'تحويل طلب الشراء إلى أمر شراء رسمي')}</span>
                        </div>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                            {t('purchasing.requisitions.convertModalDesc', 'سيتم تلقائياً إنشاء أمر شراء (Purchase Order) وحساب الضريبة، ونسخ كافة البنود المعتمدة.')}
                        </p>

                        <form onSubmit={handleConvertToPo} className="space-y-4 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('purchasing.requisitions.selectVendor', 'اختر المورد المراد إرسال الطلب إليه')} *
                                </label>
                                <select
                                    value={selectedVendorId}
                                    onChange={(e) => setSelectedVendorId(e.target.value)}
                                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary"
                                    required
                                >
                                    <option value="">-- {t('common.selectVendor', 'اختر المورد')} --</option>
                                    {vendors.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name} {v.tax_id ? `(${v.tax_id})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('purchasing.requisitions.expectedDelivery', 'تاريخ التوريد المتوقع')}
                                </label>
                                <Input
                                    type="date"
                                    value={expectedDeliveryDate}
                                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-neutral-800">
                                <Button type="button" variant="outline" onClick={() => setIsConverting(false)}>
                                    {t('common.cancel', 'إلغاء')}
                                </Button>
                                <Button type="submit" disabled={loadingAction} className="bg-primary text-primary-foreground">
                                    {loadingAction ? t('common.processing', 'جاري التحويل...') : t('purchasing.requisitions.confirmConvert', 'تأكيد التحويل الآن')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {isRejecting && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                        <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                            <XCircle className="h-5 w-5" />
                            <span>{t('purchasing.requisitions.rejectTitle', 'رفض طلب الشراء')}</span>
                        </div>
                        <p className="text-xs text-neutral-500">
                            {t('purchasing.requisitions.rejectDesc', 'يرجى كتابة سبب رفض الطلب ليتم إبلاغ طالب الشراء به.')}
                        </p>

                        <form onSubmit={handleReject} className="space-y-4 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('purchasing.requisitions.reason', 'سبب الرفض')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder={t('purchasing.requisitions.reasonPlaceholder', 'مثال: الميزانية غير كافية، يتوفر بديل في المستودع...')}
                                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-neutral-800">
                                <Button type="button" variant="outline" onClick={() => setIsRejecting(false)}>
                                    {t('common.cancel', 'إلغاء')}
                                </Button>
                                <Button type="submit" disabled={loadingAction} className="bg-rose-600 hover:bg-rose-700 text-white">
                                    {t('purchasing.requisitions.confirmReject', 'تأكيد الرفض')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
