import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, UserPlus, TrendingUp, CheckCircle2, XCircle, ArrowRight, Eye } from 'lucide-react';
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

interface Lead {
    id: string;
    lead_number: string;
    title: string;
    party?: Party;
    contact_name: string;
    email?: string;
    phone?: string;
    company_name?: string;
    source: string;
    status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
    estimated_value: string;
    probability_percent: number;
    assigned_user?: User;
    converted_at?: string;
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
    leads: PaginatedData<Lead>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function LeadsIndex({ leads, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/crm/leads', { search, status: selectedStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get('/crm/leads', { search, status: status || undefined }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: Lead['status']) => {
        switch (status) {
            case 'new':
                return 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-200 dark:border-sky-900';
            case 'contacted':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border border-purple-200 dark:border-purple-900';
            case 'qualified':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900';
            case 'proposal':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
            case 'won':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
            case 'lost':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const totalPipelineValue = leads.data.reduce((acc, l) => acc + parseFloat(l.estimated_value || '0'), 0);
    const wonCount = leads.data.filter(l => l.status === 'won').length;
    const qualifiedCount = leads.data.filter(l => l.status === 'qualified' || l.status === 'proposal').length;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'العملاء المحتملون والفرص (CRM)' : 'CRM Leads & Pipeline'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'إدارة الفرص والعملاء المحتملين (CRM)' : 'CRM Leads & Pipeline'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'متابعة مسار المبيعات، احتمالات الإغلاق، وتحويل الفرص المؤهلة إلى عملاء وعروض أسعار'
                            : 'Track sales pipeline, conversion probabilities, and convert qualified opportunities'}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/crm/leads/create">
                        <Plus className="h-4 w-4" />
                        <span>{isRtl ? 'إضافة فرصة جديدة' : 'New Lead / Opportunity'}</span>
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'قيمة خط المبيعات الإجمالي' : 'Total Pipeline Value'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {totalPipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </h3>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'الفرص المؤهلة والعروض' : 'Qualified & Proposals'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {qualifiedCount}
                        </h3>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
                        <UserPlus className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'الصفقات المكتسبة (Won)' : 'Won Deals'}</p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                            {wonCount}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                        <CheckCircle2 className="h-5 w-5" />
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
                            placeholder={isRtl ? 'بحث بالاسم، الشركة، البريد...' : 'Search by title, contact, company...'}
                            className={`${isRtl ? 'pr-9' : 'pl-9'}`}
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                        {isRtl ? 'بحث' : 'Search'}
                    </Button>
                </form>

                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                    {['', 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                selectedStatus === status
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            {status === '' ? (isRtl ? 'الكل' : 'All') : status.toUpperCase()}
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
                                <th className="px-6 py-3 text-start">{isRtl ? 'رقم الفرصة' : 'Lead #'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'عنوان الفرصة / العميل' : 'Title & Contact'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'المصدر' : 'Source'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الاحتمالية' : 'Probability'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'القيمة المتوقعة' : 'Estimated Value'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {leads.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                                        <UserPlus className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        {isRtl ? 'لا توجد فرص مطابقة للبحث' : 'No CRM leads found'}
                                    </td>
                                </tr>
                            ) : (
                                leads.data.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {lead.lead_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">{lead.title}</div>
                                            <div className="text-xs text-neutral-500">
                                                {lead.contact_name} {lead.company_name ? `• ${lead.company_name}` : ''}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 capitalize text-neutral-600 dark:text-neutral-400 text-xs">
                                            {lead.source}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5">
                                                    <div
                                                        className="bg-indigo-600 h-1.5 rounded-full"
                                                        style={{ width: `${lead.probability_percent}%` }}
                                                    />
                                                </div>
                                                <span>{lead.probability_percent}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(lead.estimated_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900">
                                                <Link href={`/crm/leads/${lead.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span>{isRtl ? 'عرض' : 'View'}</span>
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
