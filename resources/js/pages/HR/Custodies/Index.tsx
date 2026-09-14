import { Head, Link, router } from '@inertiajs/react';
import {
    Wallet,
    Plus,
    Filter,
    Search,
    Eye,
    CheckCircle2,
    Clock,
    User,
    ArrowUpRight,
    Coins,
    FileCheck,
    Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Employee {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    department?: { name: string; name_ar?: string };
}

interface Custody {
    id: string;
    custody_number: string;
    type: 'temporary' | 'permanent';
    purpose: string;
    amount: string;
    current_balance: string;
    status: 'draft' | 'approved' | 'disbursed' | 'partially_settled' | 'closed';
    created_at: string;
    employee?: Employee;
    branch?: { name: string };
}

interface PaginatedCustodies {
    data: Custody[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Stats {
    total_custodies: number;
    active_custodies: number;
    total_disbursed: number;
    total_outstanding: number;
    total_closed: number;
}

interface Props {
    custodies: PaginatedCustodies;
    employees: Employee[];
    stats: Stats;
    filters: {
        status?: string;
        employee_id?: string;
        type?: string;
    };
}

export default function CustodyIndex({ custodies, employees, stats, filters }: Props) {
    const { t, isRtl } = useTranslation();

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            '/hr/custodies',
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    const formatMoney = (val: number | string) => {
        return Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' SAR';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{isRtl ? 'مسودة' : 'Draft'}</span>;
            case 'approved':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">{isRtl ? 'معتمدة' : 'Approved'}</span>;
            case 'disbursed':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{isRtl ? 'منصرفة قيد العمل' : 'Disbursed'}</span>;
            case 'partially_settled':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">{isRtl ? 'مسواة جزئياً' : 'Partially Settled'}</span>;
            case 'closed':
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">{isRtl ? 'مقفلة ومطهرة' : 'Cleared & Closed'}</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">{status}</span>;
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={isRtl ? 'إدارة عهد وسلف الموظفين' : 'Employee Custodies & Advances'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-indigo-600" />
                        {isRtl ? 'إدارة عهد وسلف الموظفين النقدية' : 'Employee Custodies & Advances'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'صرف العهد المؤقتة والمستديمة، تسوية الفواتير الضريبية (15% VAT)، وإخلاء طرف الموظف محاسبياً'
                            : 'Disburse employee advances, settle tax expense claims with 15% VAT, and reconcile balances'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/hr/custodies/create">
                            <Plus className="h-4 w-4" />
                            <span>{isRtl ? 'طلب وصرف عهدة جديدة' : 'New Custody Advance'}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <div className="flex items-center justify-between text-neutral-500">
                        <span className="text-xs font-medium">{isRtl ? 'إجمالي العهد المنصرفة' : 'Total Disbursed'}</span>
                        <Coins className="h-4 w-4 text-indigo-500" />
                    </div>
                    <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
                        {formatMoney(stats.total_disbursed)}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">{stats.total_custodies} {isRtl ? 'عهدة مسجلة' : 'total custodies'}</p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <div className="flex items-center justify-between text-neutral-500">
                        <span className="text-xs font-medium">{isRtl ? 'الرصيد القائم بذمة الموظفين' : 'Outstanding Balance'}</span>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
                        {formatMoney(stats.total_outstanding)}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'مبالغ لم تتم تسويتها بعد' : 'Unsettled advances'}</p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <div className="flex items-center justify-between text-neutral-500">
                        <span className="text-xs font-medium">{isRtl ? 'العهد النشطة قيد التسوية' : 'Active Custodies'}</span>
                        <FileCheck className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-2">
                        {stats.active_custodies}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'بذمة موظفين حاليين' : 'Currently with employees'}</p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <div className="flex items-center justify-between text-neutral-500">
                        <span className="text-xs font-medium">{isRtl ? 'العهد المصفاة بالكامل' : 'Cleared & Closed'}</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                        {stats.total_closed}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'تم إخلاء طرفها محاسبياً' : 'Fully settled & cleared'}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                <div className="flex-1">
                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2 text-neutral-700 dark:text-neutral-300"
                    >
                        <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                        <option value="draft">{isRtl ? 'مسودة' : 'Draft'}</option>
                        <option value="approved">{isRtl ? 'معتمدة' : 'Approved'}</option>
                        <option value="disbursed">{isRtl ? 'منصرفة' : 'Disbursed'}</option>
                        <option value="partially_settled">{isRtl ? 'مسواة جزئياً' : 'Partially Settled'}</option>
                        <option value="closed">{isRtl ? 'مقفلة ومطهرة' : 'Closed'}</option>
                    </select>
                </div>

                <div className="flex-1">
                    <select
                        value={filters.type || ''}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2 text-neutral-700 dark:text-neutral-300"
                    >
                        <option value="">{isRtl ? 'جميع الأنواع' : 'All Types'}</option>
                        <option value="temporary">{isRtl ? 'عهدة مؤقتة (لمشروع / مهمة)' : 'Temporary Advance'}</option>
                        <option value="permanent">{isRtl ? 'عهدة مستديمة' : 'Permanent Float'}</option>
                    </select>
                </div>

                <div className="flex-1">
                    <select
                        value={filters.employee_id || ''}
                        onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                        className="w-full text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2 text-neutral-700 dark:text-neutral-300"
                    >
                        <option value="">{isRtl ? 'جميع الموظفين' : 'All Employees'}</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.first_name} {emp.last_name} ({emp.employee_number})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Custodies Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'رقم العهدة' : 'Custody #'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'الموظف المستلم' : 'Employee'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'النوع والغرض' : 'Type & Purpose'}</th>
                                <th className="px-6 py-3.5 text-end font-mono">{isRtl ? 'المبلغ المنصرف' : 'Amount'}</th>
                                <th className="px-6 py-3.5 text-end font-mono">{isRtl ? 'الرصيد القائم' : 'Balance'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3.5 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {custodies.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                                        <Wallet className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                                        <p className="font-medium">{isRtl ? 'لا توجد عهد مسجلة تطابق الفلاتر' : 'No custodies match selected filters'}</p>
                                    </td>
                                </tr>
                            ) : (
                                custodies.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {item.custody_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {item.employee?.first_name} {item.employee?.last_name}
                                            </div>
                                            <div className="text-xs text-neutral-500 font-mono">
                                                {item.employee?.employee_number} &bull; {item.employee?.department?.name || 'HR'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                                {item.type === 'temporary' ? (isRtl ? 'عهدة مؤقتة' : 'Temporary') : (isRtl ? 'عهدة مستديمة' : 'Permanent')}
                                            </div>
                                            <div className="text-xs text-neutral-600 dark:text-neutral-300 truncate max-w-[200px]" title={item.purpose}>
                                                {item.purpose}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {formatMoney(item.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold">
                                            <span className={Number(item.current_balance) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                                {formatMoney(item.current_balance)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(item.status)}
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.status === 'disbursed' || item.status === 'partially_settled' ? (
                                                    <Button asChild size="sm" variant="outline" className="gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                                        <Link href={`/hr/custodies/${item.id}/settle`}>
                                                            <Receipt className="h-3.5 w-3.5" />
                                                            <span>{isRtl ? 'تسوية الفواتير' : 'Settle'}</span>
                                                        </Link>
                                                    </Button>
                                                ) : null}

                                                <Button asChild size="sm" variant="ghost" className="gap-1">
                                                    <Link href={`/hr/custodies/${item.id}`}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                        <span>{isRtl ? 'عرض' : 'View'}</span>
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
