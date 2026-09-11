import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    FolderKanban,
    TrendingUp,
    Clock,
    DollarSign,
    CheckCircle2,
    Plus,
    Calendar,
    Users,
    AlertCircle,
    FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    first_name_ar?: string;
    last_name_ar?: string;
    basic_salary?: string;
}

interface SalesOrder {
    id: string;
    order_number: string;
    total_amount: string;
}

interface ProjectTask {
    id: string;
    title: string;
    estimated_hours: string;
    actual_hours: string;
    status: 'todo' | 'in_progress' | 'review' | 'done';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: string;
}

interface ProjectTimesheet {
    id: string;
    date: string;
    hours: string;
    hourly_cost: string;
    hourly_billing_rate: string;
    total_cost: string;
    total_billable: string;
    is_billable: boolean;
    is_billed: boolean;
    notes?: string;
    employee: Employee;
    task?: { id: string; title: string };
}

interface Profitability {
    project_id: string;
    project_number: string;
    name: string;
    budget_cost: string;
    budget_revenue: string;
    planned_margin: string;
    planned_margin_percent: string;
    actual_labor_cost: string;
    actual_billable_revenue: string;
    actual_billed_revenue: string;
    unbilled_revenue: string;
    actual_margin: string;
    actual_margin_percent: string;
    cost_variance: string;
    total_hours: string;
    billable_hours: string;
    non_billable_hours: string;
}

interface Project {
    id: string;
    project_number: string;
    name: string;
    name_ar?: string;
    customer: Party;
    manager?: Employee;
    sales_order?: SalesOrder;
    start_date: string;
    end_date?: string;
    budget_cost: string;
    budget_revenue: string;
    status: string;
    notes?: string;
    tasks: ProjectTask[];
    timesheets: ProjectTimesheet[];
}

interface Props {
    project: Project;
    profitability: Profitability;
    employees: Employee[];
}

export default function ProjectShow({ project, profitability, employees }: Props) {
    const { t, isRtl } = useTranslation();
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'timesheets'>('overview');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showTimesheetModal, setShowTimesheetModal] = useState(false);

    // Task Form
    const taskForm = useForm({
        title: '',
        estimated_hours: 8,
        status: 'todo',
        priority: 'medium',
        due_date: '',
    });

    // Timesheet Form
    const timesheetForm = useForm({
        employee_id: employees[0]?.id || '',
        task_id: '',
        date: new Date().toISOString().slice(0, 10),
        hours: 8,
        hourly_billing_rate: 250,
        is_billable: true,
        notes: '',
    });

    const submitTask = (e: React.FormEvent) => {
        e.preventDefault();
        taskForm.post(`/projects/${project.id}/tasks`, {
            onSuccess: () => {
                setShowTaskModal(false);
                taskForm.reset();
            },
        });
    };

    const submitTimesheet = (e: React.FormEvent) => {
        e.preventDefault();
        timesheetForm.post(`/projects/${project.id}/timesheets`, {
            onSuccess: () => {
                setShowTimesheetModal(false);
                timesheetForm.reset();
            },
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
            <Head title={`${project.project_number} - ${project.name}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/projects">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-neutral-500">{project.project_number}</span>
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-blue-50 text-blue-700 border border-blue-200">
                                {project.status.replace('_', ' ')}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
                            {isRtl && project.name_ar ? project.name_ar : project.name}
                        </h1>
                        <p className="text-sm text-neutral-500">
                            {isRtl && project.customer?.name_ar ? project.customer.name_ar : project.customer?.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={() => setShowTaskModal(true)} variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        <span>{isRtl ? 'إضافة مهمة' : 'Add Task'}</span>
                    </Button>
                    <Button onClick={() => setShowTimesheetModal(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Clock className="h-4 w-4" />
                        <span>{isRtl ? 'تسجيل ساعات عمل' : 'Log Timesheet'}</span>
                    </Button>
                </div>
            </div>

            {/* Profitability KPI Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue Actual vs Planned */}
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs font-medium text-neutral-500">{isRtl ? 'الإيراد الفعلي / المقدر' : 'Billable / Planned Revenue'}</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                        {Number(profitability.actual_billable_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                        {isRtl ? 'الميزانية: ' : 'Planned: '}
                        <span className="font-mono font-medium">{Number(profitability.budget_revenue).toLocaleString()} SAR</span>
                    </p>
                </div>

                {/* Direct Labor Cost */}
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs font-medium text-neutral-500">{isRtl ? 'تكلفة العمالة الفعلية (Direct Labor)' : 'Actual Labor Cost'}</p>
                    <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                        {Number(profitability.actual_labor_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                        {isRtl ? 'الميزانية: ' : 'Planned: '}
                        <span className="font-mono font-medium">{Number(profitability.budget_cost).toLocaleString()} SAR</span>
                    </p>
                </div>

                {/* Net Margin & % */}
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs font-medium text-neutral-500">{isRtl ? 'هامش الربح الفعلي (%)' : 'Net Margin & %'}</p>
                    <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                        {profitability.actual_margin_percent}%
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                        {isRtl ? 'الربح الصافي: ' : 'Net Margin: '}
                        <span className="font-mono font-bold">{Number(profitability.actual_margin).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR</span>
                    </p>
                </div>

                {/* Hours Breakdown */}
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي الساعات المسجلة' : 'Total Hours Logged'}</p>
                    <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                        {profitability.total_hours} hrs
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                        {isRtl ? 'ساعات مفوترة: ' : 'Billable: '}
                        <span className="font-mono font-medium">{profitability.billable_hours} hrs</span>
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-4">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        activeTab === 'overview'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    {isRtl ? 'نظرة عامة والتحليل المالي' : 'Profitability Overview'}
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        activeTab === 'tasks'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    {isRtl ? `المهام (${project.tasks?.length || 0})` : `Tasks (${project.tasks?.length || 0})`}
                </button>
                <button
                    onClick={() => setActiveTab('timesheets')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        activeTab === 'timesheets'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    {isRtl ? `سجل ساعات العمل (${project.timesheets?.length || 0})` : `Timesheets (${project.timesheets?.length || 0})`}
                </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                                {isRtl ? 'مقارنة الميزانية التقديرية مقابل الفعلي' : 'Planned vs. Actual Performance'}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 space-y-2">
                                    <p className="text-xs font-semibold text-neutral-500 uppercase">{isRtl ? 'مؤشرات الإيرادات' : 'Revenue Metrics'}</p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">{isRtl ? 'الميزانية التقديرية' : 'Planned Budget'}:</span>
                                        <span className="font-mono font-medium">{Number(profitability.budget_revenue).toLocaleString()} SAR</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">{isRtl ? 'الإيراد الفعلي المفوتر' : 'Billed to Date'}:</span>
                                        <span className="font-mono font-medium text-emerald-600">{Number(profitability.actual_billed_revenue).toLocaleString()} SAR</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">{isRtl ? 'إيرادات قيد الفوترة' : 'Unbilled WIP'}:</span>
                                        <span className="font-mono font-medium text-indigo-600">{Number(profitability.unbilled_revenue).toLocaleString()} SAR</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 space-y-2">
                                    <p className="text-xs font-semibold text-neutral-500 uppercase">{isRtl ? 'مؤشرات تكلفة العمالة المباشرة' : 'Labor Cost Metrics'}</p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">{isRtl ? 'الميزانية التقديرية' : 'Planned Budget'}:</span>
                                        <span className="font-mono font-medium">{Number(profitability.budget_cost).toLocaleString()} SAR</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">{isRtl ? 'التكلفة الفعلية المصروفة' : 'Actual Labor Incurred'}:</span>
                                        <span className="font-mono font-medium text-amber-600">{Number(profitability.actual_labor_cost).toLocaleString()} SAR</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">{isRtl ? 'انحراف الميزانية (Variance)' : 'Cost Variance'}:</span>
                                        <span className={`font-mono font-medium ${parseFloat(profitability.cost_variance) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {Number(profitability.cost_variance).toLocaleString()} SAR
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {project.notes && (
                                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                    <p className="text-xs font-medium text-neutral-500 mb-1">{isRtl ? 'نطاق العمل وملاحظات' : 'Scope Notes'}</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{project.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                                {isRtl ? 'معلومات المشروع' : 'Project Details'}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">{isRtl ? 'مدير المشروع' : 'Manager'}</span>
                                    <span className="font-medium">{project.manager ? `${project.manager.first_name} ${project.manager.last_name}` : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">{isRtl ? 'تاريخ البدء' : 'Start Date'}</span>
                                    <span className="font-mono text-xs">{project.start_date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">{isRtl ? 'تاريخ الانتهاء' : 'End Date'}</span>
                                    <span className="font-mono text-xs">{project.end_date || '-'}</span>
                                </div>
                                {project.sales_order && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">{isRtl ? 'أمر البيع' : 'Sales Order'}</span>
                                        <Link href={`/sales/orders/${project.sales_order.id}`} className="font-mono text-xs text-indigo-600 hover:underline">
                                            {project.sales_order.order_number}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab 2: Tasks */}
            {activeTab === 'tasks' && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs font-semibold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="px-6 py-3 text-start">{isRtl ? 'عنوان المهمة' : 'Task Title'}</th>
                                    <th className="px-6 py-3 text-start">{isRtl ? 'الأولوية' : 'Priority'}</th>
                                    <th className="px-6 py-3 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                    <th className="px-6 py-3 text-end">{isRtl ? 'الساعات التقديرية' : 'Est. Hours'}</th>
                                    <th className="px-6 py-3 text-end">{isRtl ? 'الساعات الفعلية' : 'Actual Hours'}</th>
                                    <th className="px-6 py-3 text-end">{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {project.tasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                                            {isRtl ? 'لا توجد مهام مسجلة لهذا المشروع بعد' : 'No tasks created yet'}
                                        </td>
                                    </tr>
                                ) : (
                                    project.tasks.map((task) => (
                                        <tr key={task.id}>
                                            <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                                {task.title}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-neutral-100 text-neutral-700">
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize bg-blue-50 text-blue-700">
                                                    {task.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                                {task.estimated_hours} hrs
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {task.actual_hours} hrs
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                {task.due_date || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tab 3: Timesheets */}
            {activeTab === 'timesheets' && (
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs font-semibold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="px-6 py-3 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                    <th className="px-6 py-3 text-start">{isRtl ? 'الموظف' : 'Employee'}</th>
                                    <th className="px-6 py-3 text-start">{isRtl ? 'المهمة / الملاحظات' : 'Task / Notes'}</th>
                                    <th className="px-6 py-3 text-end">{isRtl ? 'الساعات' : 'Hours'}</th>
                                    <th className="px-6 py-3 text-end">{isRtl ? 'تكلفة الساعة' : 'Hourly Cost'}</th>
                                    <th className="px-6 py-3 text-end">{isRtl ? 'إجمالي التكلفة' : 'Total Labor Cost'}</th>
                                    <th className="px-6 py-3 text-end">{isRtl ? 'القيمة المفوترة' : 'Billable Total'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {project.timesheets.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                                            {isRtl ? 'لا توجد ساعات عمل مسجلة بعد' : 'No timesheets logged yet'}
                                        </td>
                                    </tr>
                                ) : (
                                    project.timesheets.map((ts) => (
                                        <tr key={ts.id}>
                                            <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                {ts.date}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                                {ts.employee?.first_name} {ts.employee?.last_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium">{ts.task?.title || '-'}</p>
                                                {ts.notes && <p className="text-xs text-neutral-500">{ts.notes}</p>}
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                {ts.hours} hrs
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono text-neutral-600 dark:text-neutral-400 text-xs">
                                                {Number(ts.hourly_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono font-medium text-amber-600">
                                                {Number(ts.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="px-6 py-4 text-end font-mono font-bold text-emerald-600">
                                                {ts.is_billable
                                                    ? `${Number(ts.total_billable).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR`
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Add Task */}
            {showTaskModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'إضافة مهمة جديدة' : 'Add New Task'}
                        </h3>
                        <form onSubmit={submitTask} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="task_title">{isRtl ? 'عنوان المهمة *' : 'Task Title *'}</Label>
                                <Input
                                    id="task_title"
                                    value={taskForm.data.title}
                                    onChange={(e) => taskForm.setData('title', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="est_hours">{isRtl ? 'الساعات المقدرة' : 'Est. Hours'}</Label>
                                    <Input
                                        id="est_hours"
                                        type="number"
                                        step="0.5"
                                        value={taskForm.data.estimated_hours}
                                        onChange={(e) => taskForm.setData('estimated_hours', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="priority">{isRtl ? 'الأولوية' : 'Priority'}</Label>
                                    <select
                                        id="priority"
                                        value={taskForm.data.priority}
                                        onChange={(e) => taskForm.setData('priority', e.target.value as any)}
                                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="due_date">{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={taskForm.data.due_date}
                                    onChange={(e) => taskForm.setData('due_date', e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowTaskModal(false)}>
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button type="submit" disabled={taskForm.processing} className="bg-indigo-600 text-white">
                                    {isRtl ? 'حفظ المهمة' : 'Save Task'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Log Timesheet */}
            {showTimesheetModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-lg w-full p-6 shadow-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'تسجيل ساعات عمل جديدة' : 'Log Project Timesheet'}
                        </h3>
                        <p className="text-xs text-neutral-500">
                            {isRtl
                                ? 'يتم احتساب تكلفة الساعة آلياً بناءً على الراتب الأساسي (الراتب / 240 ساعة)'
                                : 'Labor cost is calculated automatically: basic salary / 240 monthly hours'}
                        </p>
                        <form onSubmit={submitTimesheet} className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="ts_employee">{isRtl ? 'الموظف *' : 'Employee *'}</Label>
                                <select
                                    id="ts_employee"
                                    value={timesheetForm.data.employee_id}
                                    onChange={(e) => timesheetForm.setData('employee_id', e.target.value)}
                                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                                    required
                                >
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.first_name} {emp.last_name} {emp.basic_salary ? `(Salary: ${Number(emp.basic_salary).toLocaleString()} SAR)` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="ts_task">{isRtl ? 'المهمة (اختياري)' : 'Task (Optional)'}</Label>
                                <select
                                    id="ts_task"
                                    value={timesheetForm.data.task_id}
                                    onChange={(e) => timesheetForm.setData('task_id', e.target.value)}
                                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                                >
                                    <option value="">{isRtl ? '-- عام / بدون مهمة محددة --' : '-- General Project Work --'}</option>
                                    {project.tasks.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="ts_date">{isRtl ? 'التاريخ' : 'Date'}</Label>
                                    <Input
                                        id="ts_date"
                                        type="date"
                                        value={timesheetForm.data.date}
                                        onChange={(e) => timesheetForm.setData('date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="ts_hours">{isRtl ? 'عدد الساعات' : 'Hours'}</Label>
                                    <Input
                                        id="ts_hours"
                                        type="number"
                                        step="0.25"
                                        min="0.25"
                                        max="24"
                                        value={timesheetForm.data.hours}
                                        onChange={(e) => timesheetForm.setData('hours', parseFloat(e.target.value) || 0)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="ts_rate">{isRtl ? 'سعر الفوترة للساعة (SAR)' : 'Billing Rate / hr'}</Label>
                                    <Input
                                        id="ts_rate"
                                        type="number"
                                        step="0.01"
                                        value={timesheetForm.data.hourly_billing_rate}
                                        onChange={(e) => timesheetForm.setData('hourly_billing_rate', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox"
                                        id="ts_billable"
                                        checked={timesheetForm.data.is_billable}
                                        onChange={(e) => timesheetForm.setData('is_billable', e.target.checked)}
                                        className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                    />
                                    <Label htmlFor="ts_billable">{isRtl ? 'قابلة للفوترة للعميل' : 'Billable to Client'}</Label>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="ts_notes">{isRtl ? 'تفاصيل الإنجاز' : 'Work Description'}</Label>
                                <textarea
                                    id="ts_notes"
                                    rows={2}
                                    value={timesheetForm.data.notes}
                                    onChange={(e) => timesheetForm.setData('notes', e.target.value)}
                                    className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
                                    placeholder={isRtl ? 'وصف المهام والأنشطة المنجزة...' : 'Describe completed tasks...'}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowTimesheetModal(false)}>
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button type="submit" disabled={timesheetForm.processing} className="bg-indigo-600 text-white">
                                    {isRtl ? 'تسجيل الساعات' : 'Log Timesheet'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
