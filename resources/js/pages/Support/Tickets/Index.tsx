import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, LifeBuoy, CheckCircle2, Clock, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface User {
    id: number;
    name: string;
}

interface SupportTicket {
    id: string;
    ticket_number: string;
    subject: string;
    contact_name: string;
    customer: Party;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
    assigned_user?: User;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    tickets: PaginatedData<SupportTicket>;
    filters: {
        search?: string;
        status?: string;
        priority?: string;
    };
}

export default function TicketsIndex({ tickets, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/support/tickets', { search, status: selectedStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get('/support/tickets', { search, status: status || undefined }, { preserveState: true, replace: true });
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

    const openCount = tickets.data.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const urgentCount = tickets.data.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'تذاكر الدعم الفني وخدمة العملاء' : 'Helpdesk Support Tickets'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'مركز المساعدة وتذاكر الدعم الفني' : 'Helpdesk & Support Tickets'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدارة بلاغات واستفسارات العملاء، متابعة أولويات الاستجابة، وتوثيق الحلول'
                            : 'Track client inquiries, manage SLAs and priorities, and resolve support requests'}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/support/tickets/create">
                        <Plus className="h-4 w-4" />
                        <span>{isRtl ? 'تذكرة جديدة' : 'New Ticket'}</span>
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'التذاكر النشطة المفتوحة' : 'Active Open Tickets'}</p>
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                            {openCount}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
                        <Clock className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'تذاكر عالية وعاجلة الأهمية' : 'High & Urgent Priority'}</p>
                        <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                            {urgentCount}
                        </h3>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-lg">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي التذاكر' : 'Total Tickets'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {tickets.total}
                        </h3>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
                        <LifeBuoy className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-80">
                    <div className="relative flex-1">
                        <Search className={`absolute top-2.5 h-4 w-4 text-neutral-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={isRtl ? 'بحث برقم التذكرة أو الموضوع...' : 'Search ticket # or subject...'}
                            className={`${isRtl ? 'pr-9' : 'pl-9'}`}
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                        {isRtl ? 'بحث' : 'Search'}
                    </Button>
                </form>

                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                    {['', 'open', 'in_progress', 'waiting_customer', 'resolved'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                selectedStatus === status
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            {status === '' ? (isRtl ? 'الكل' : 'All') : status.replace('_', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs font-semibold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 text-start">{isRtl ? 'رقم التذكرة' : 'Ticket #'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الموضوع والعميل' : 'Subject & Customer'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الأولوية' : 'Priority'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'المسؤول' : 'Assigned Agent'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'تاريخ الإنشاء' : 'Created At'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {tickets.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                                        <LifeBuoy className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        {isRtl ? 'لا توجد تذاكر دعم مطابقة' : 'No support tickets found'}
                                    </td>
                                </tr>
                            ) : (
                                tickets.data.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {ticket.ticket_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">{ticket.subject}</div>
                                            <div className="text-xs text-neutral-500">
                                                {ticket.contact_name} • {isRtl && ticket.customer?.name_ar ? ticket.customer.name_ar : ticket.customer?.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs capitalize ${priorityBadge(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(ticket.status)}`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-neutral-600 dark:text-neutral-400">
                                            {ticket.assigned_user?.name || (isRtl ? 'غير معين' : 'Unassigned')}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {ticket.created_at?.slice(0, 10)}
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900">
                                                <Link href={`/support/tickets/${ticket.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span>{isRtl ? 'عرض ومتابعة' : 'View & Reply'}</span>
                                                </Link>
                                            </Button>
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
