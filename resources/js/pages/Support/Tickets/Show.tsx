import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    LifeBuoy,
    Send,
    CheckCircle2,
    Clock,
    User,
    Building2,
    FolderKanban,
    AlertTriangle,
    MessageSquare,
    Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    email?: string;
    phone?: string;
}

interface Project {
    id: string;
    project_number: string;
    name: string;
}

interface UserData {
    id: number;
    name: string;
}

interface TicketMessage {
    id: string;
    sender_type: 'agent' | 'customer';
    sender_name: string;
    message: string;
    created_at: string;
    user?: UserData;
}

interface SupportTicket {
    id: string;
    ticket_number: string;
    subject: string;
    description: string;
    contact_name: string;
    contact_email?: string;
    customer: Party;
    project?: Project;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
    assigned_user?: UserData;
    resolved_at?: string;
    created_at: string;
    messages: TicketMessage[];
}

interface Props {
    ticket: SupportTicket;
}

export default function TicketShow({ ticket }: Props) {
    const { t, isRtl } = useTranslation();
    const [showResolveModal, setShowResolveModal] = useState(false);

    // Reply Form
    const replyForm = useForm({
        message: '',
    });

    // Resolve Form
    const resolveForm = useForm({
        resolution_message: '',
    });

    const submitReply = (e: React.FormEvent) => {
        e.preventDefault();
        replyForm.post(`/support/tickets/${ticket.id}/reply`, {
            onSuccess: () => replyForm.reset(),
        });
    };

    const submitResolve = (e: React.FormEvent) => {
        e.preventDefault();
        resolveForm.post(`/support/tickets/${ticket.id}/resolve`, {
            onSuccess: () => setShowResolveModal(false),
        });
    };

    const priorityBadge = (priority: SupportTicket['priority']) => {
        switch (priority) {
            case 'urgent':
                return 'text-rose-600 font-bold bg-rose-50 border border-rose-200';
            case 'high':
                return 'text-amber-600 font-bold bg-amber-50 border border-amber-200';
            case 'medium':
                return 'text-blue-600 bg-blue-50 border border-blue-200';
            default:
                return 'text-neutral-600 bg-neutral-100';
        }
    };

    const statusBadge = (status: SupportTicket['status']) => {
        switch (status) {
            case 'open':
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'in_progress':
                return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'waiting_customer':
                return 'bg-purple-50 text-purple-700 border border-purple-200';
            case 'resolved':
            case 'closed':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${ticket.ticket_number} - ${ticket.subject}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/support/tickets">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-neutral-500">{ticket.ticket_number}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs capitalize ${priorityBadge(ticket.priority)}`}>
                                {ticket.priority}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
                            {ticket.subject}
                        </h1>
                        <p className="text-sm text-neutral-500">
                            {isRtl && ticket.customer?.name_ar ? ticket.customer.name_ar : ticket.customer?.name} • {ticket.contact_name}
                        </p>
                    </div>
                </div>

                {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <Button onClick={() => setShowResolveModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isRtl ? 'حل وإغلاق التذكرة' : 'Resolve Ticket'}</span>
                    </Button>
                )}
            </div>

            {/* Content Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Messages Thread */}
                <div className="md:col-span-2 space-y-6">
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                            <MessageSquare className="h-5 w-5 text-neutral-500" />
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                {isRtl ? 'سجل المحادثة والمراسلات' : 'Conversation History'}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {ticket.messages && ticket.messages.map((msg) => {
                                const isAgent = msg.sender_type === 'agent';
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col p-4 rounded-xl border ${
                                            isAgent
                                                ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/50 ms-4'
                                                : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-800 me-4'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {isAgent ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                                                        <Shield className="h-3.5 w-3.5" />
                                                        {msg.sender_name} ({isRtl ? 'الدعم الفني' : 'Agent'})
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                                        <User className="h-3.5 w-3.5 text-neutral-400" />
                                                        {msg.sender_name} ({isRtl ? 'العميل' : 'Customer'})
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-mono text-xs text-neutral-400">
                                                {msg.created_at?.slice(0, 16).replace('T', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                                            {msg.message}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reply Box */}
                        {ticket.status !== 'resolved' && ticket.status !== 'closed' ? (
                            <form onSubmit={submitReply} className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                                <Label htmlFor="reply_message">{isRtl ? 'إضافة رد أو تحديث للعميل' : 'Post Agent Response'}</Label>
                                <textarea
                                    id="reply_message"
                                    rows={3}
                                    value={replyForm.data.message}
                                    onChange={(e) => replyForm.setData('message', e.target.value)}
                                    placeholder={isRtl ? 'اكتب ردك أو التوجيهات الفنية هنا...' : 'Type response or technical steps here...'}
                                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                    required
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={replyForm.processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                                        <Send className="h-4 w-4" />
                                        <span>{isRtl ? 'إرسال الرد' : 'Send Response'}</span>
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                <span>{isRtl ? `تم إغلاق وحل هذه التذكرة بنجاح في ${ticket.resolved_at || ''}` : `Ticket resolved on ${ticket.resolved_at || ''}`}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Meta Info */}
                <div className="space-y-6">
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                            {isRtl ? 'تفاصيل التذكرة' : 'Ticket Metadata'}
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-xs text-neutral-500 mb-0.5">{isRtl ? 'العميل' : 'Customer'}</p>
                                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                    {isRtl && ticket.customer?.name_ar ? ticket.customer.name_ar : ticket.customer?.name}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-neutral-500 mb-0.5">{isRtl ? 'صاحب البلاغ' : 'Contact Person'}</p>
                                <p className="font-medium">{ticket.contact_name}</p>
                                {ticket.contact_email && <p className="text-xs text-neutral-400">{ticket.contact_email}</p>}
                            </div>

                            <div>
                                <p className="text-xs text-neutral-500 mb-0.5">{isRtl ? 'المسؤول' : 'Assigned Agent'}</p>
                                <p className="font-medium">{ticket.assigned_user?.name || (isRtl ? 'غير محدد' : 'Unassigned')}</p>
                            </div>

                            {ticket.project && (
                                <div>
                                    <p className="text-xs text-neutral-500 mb-0.5">{isRtl ? 'المشروع المرتبط' : 'Linked Project'}</p>
                                    <Link href={`/projects/${ticket.project.id}`} className="text-xs font-medium text-indigo-600 hover:underline">
                                        {ticket.project.project_number} - {ticket.project.name}
                                    </Link>
                                </div>
                            )}

                            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                <p className="text-xs text-neutral-500">{isRtl ? 'تاريخ الإنشاء' : 'Created'}</p>
                                <p className="font-mono text-xs">{ticket.created_at?.slice(0, 10)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Resolve Ticket */}
            {showResolveModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'إغلاق وحل التذكرة' : 'Resolve Support Ticket'}
                        </h3>
                        <p className="text-xs text-neutral-500">
                            {isRtl
                                ? 'سيتم تغيير حالة التذكرة إلى تم الحل وتسجيل تاريخ الإغلاق'
                                : 'Mark ticket as resolved and post final closing response'}
                        </p>
                        <form onSubmit={submitResolve} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="res_notes">{isRtl ? 'ملاحظات الحل النهائي (اختياري)' : 'Resolution Notes'}</Label>
                                <textarea
                                    id="res_notes"
                                    rows={3}
                                    value={resolveForm.data.resolution_message}
                                    onChange={(e) => resolveForm.setData('resolution_message', e.target.value)}
                                    placeholder={isRtl ? 'اكتب ملخص الحل أو الإجراءات المتخذة...' : 'Summarize steps taken to resolve...'}
                                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowResolveModal(false)}>
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button type="submit" disabled={resolveForm.processing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {isRtl ? 'تأكيد الحل والإغلاق' : 'Confirm Resolution'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
