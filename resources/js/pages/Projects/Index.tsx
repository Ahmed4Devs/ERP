import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, FolderKanban, Clock, DollarSign, CheckCircle2, Eye, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
}

interface Project {
    id: string;
    project_number: string;
    name: string;
    name_ar?: string;
    customer: Party;
    manager?: Employee;
    start_date: string;
    end_date?: string;
    budget_cost: string;
    budget_revenue: string;
    status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    projects: PaginatedData<Project>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function ProjectsIndex({ projects, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/projects', { search, status: selectedStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get('/projects', { search, status: status || undefined }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: Project['status']) => {
        switch (status) {
            case 'planning':
                return 'bg-neutral-100 text-neutral-700';
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'on_hold':
                return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 border border-rose-200';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const totalBudgetRevenue = projects.data.reduce((acc, p) => acc + parseFloat(p.budget_revenue || '0'), 0);
    const activeProjectsCount = projects.data.filter(p => p.status === 'in_progress').length;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'المشاريع والخدمات المهنية' : 'Projects & Professional Services'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'المشاريع وساعات العمل والربحية' : 'Projects & Timesheets'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدارة المشاريع الاستشارية والتقنية، تتبع تكاليف العمالة المباشرة، وحساب هوامش الربحية'
                            : 'Track project milestones, employee timesheets, direct labor costing, and profit margins'}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/projects/create">
                        <Plus className="h-4 w-4" />
                        <span>{isRtl ? 'مشروع جديد' : 'New Project'}</span>
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي الميزانية التقديرية للإيرادات' : 'Total Planned Revenue'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {totalBudgetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </h3>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
                        <DollarSign className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'المشاريع قيد التنفيذ' : 'In Progress Projects'}</p>
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
                            {activeProjectsCount}
                        </h3>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
                        <Clock className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي المشاريع' : 'Total Projects'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {projects.total}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                        <FolderKanban className="h-5 w-5" />
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
                            placeholder={isRtl ? 'بحث برقم المشروع أو الاسم...' : 'Search project # or name...'}
                            className={`${isRtl ? 'pr-9' : 'pl-9'}`}
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                        {isRtl ? 'بحث' : 'Search'}
                    </Button>
                </form>

                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                    {['', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'].map((status) => (
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
                                <th className="px-6 py-3 text-start">{isRtl ? 'رقم المشروع' : 'Project #'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'اسم المشروع' : 'Project Name'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'العميل' : 'Customer'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'مدير المشروع' : 'Manager'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الفترة' : 'Timeline'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'ميزانية الإيرادات' : 'Budget Revenue'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {projects.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                                        <FolderKanban className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        {isRtl ? 'لا توجد مشاريع مسجلة' : 'No projects found'}
                                    </td>
                                </tr>
                            ) : (
                                projects.data.map((project) => (
                                    <tr key={project.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {project.project_number}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                            {isRtl && project.name_ar ? project.name_ar : project.name}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                            {isRtl && project.customer?.name_ar ? project.customer.name_ar : project.customer?.name}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                            {project.manager ? `${project.manager.first_name} ${project.manager.last_name}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {project.start_date} {project.end_date ? `→ ${project.end_date}` : ''}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(project.status)}`}>
                                                {project.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(project.budget_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900">
                                                <Link href={`/projects/${project.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span>{isRtl ? 'عرض والربحية' : 'View & Margin'}</span>
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
