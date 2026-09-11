import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Users, Briefcase, Building2, UserCheck, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Department {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface Designation {
    id: string;
    code: string;
    title: string;
    title_ar?: string;
}

interface Employee {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    first_name_ar?: string;
    last_name_ar?: string;
    email?: string;
    phone?: string;
    status: 'active' | 'on_leave' | 'terminated';
    hire_date: string;
    basic_salary: string;
    housing_allowance: string;
    transport_allowance: string;
    other_allowances: string;
    department?: Department;
    designation?: Designation;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    employees: PaginatedData<Employee>;
    departments: Department[];
    filters: {
        search?: string;
        department_id?: string;
        status?: string;
    };
}

export default function EmployeesIndex({ employees, departments, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [departmentId, setDepartmentId] = useState(filters.department_id || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/hr/employees', {
            search: search || undefined,
            department_id: departmentId || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`${t('common.confirm')}: ${t('common.delete')} [${name}]?`)) {
            router.delete(`/hr/employees/${id}`);
        }
    };

    const activeCount = employees.data.filter(e => e.status === 'active').length;
    const totalPayrollLiability = employees.data.reduce((acc, e) => {
        const gross = parseFloat(e.basic_salary || '0') +
            parseFloat(e.housing_allowance || '0') +
            parseFloat(e.transport_allowance || '0') +
            parseFloat(e.other_allowances || '0');
        return acc + gross;
    }, 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('hr.title', 'Employees & Workforce')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('hr.title', 'Employees & Workforce Management')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('hr.subtitle', 'Human resources directory, positions, contracts, and compensation')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" className="gap-2">
                        <Link href="/hr/departments">
                            <Building2 className="h-4 w-4" />
                            <span>{t('hr.departmentsTitle', 'Departments')}</span>
                        </Link>
                    </Button>
                    <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/hr/employees/create">
                            <Plus className="h-4 w-4" />
                            <span>{t('hr.newEmployee', 'Add Employee')}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-500">{t('hr.staffCount', 'Total Employees')}</span>
                        <div className="rounded-lg bg-indigo-50 p-2.5 dark:bg-indigo-950/50">
                            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{employees.total}</p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-500">{t('hr.active', 'Active Employees')}</span>
                        <div className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/50">
                            <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-500">{t('hr.grossSalary', 'Monthly Gross Commitment')}</span>
                        <div className="rounded-lg bg-purple-50 p-2.5 dark:bg-purple-950/50">
                            <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {totalPayrollLiability.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 rtl:left-auto rtl:right-3" />
                        <Input
                            placeholder={t('customers.searchPlaceholder', 'Search employee number, name, email...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 rtl:pl-3 rtl:pr-9"
                        />
                    </div>
                    <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700"
                    >
                        <option value="">{t('hr.department', 'All Departments')}</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                                {isRtl && d.name_ar ? d.name_ar : d.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700"
                    >
                        <option value="">{t('hr.status', 'All Statuses')}</option>
                        <option value="active">{t('hr.active', 'Active')}</option>
                        <option value="on_leave">{t('hr.onLeave', 'On Leave')}</option>
                        <option value="terminated">{t('hr.terminated', 'Terminated')}</option>
                    </select>
                    <Button type="submit" variant="secondary" size="sm">
                        {t('common.view', 'Filter')}
                    </Button>
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm rtl:text-right">
                        <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                            <tr>
                                <th className="px-4 py-3">{t('hr.employeeNumber', 'ID')}</th>
                                <th className="px-4 py-3">{t('hr.name', 'Employee Name')}</th>
                                <th className="px-4 py-3">{t('hr.department', 'Department')}</th>
                                <th className="px-4 py-3">{t('hr.designation', 'Designation')}</th>
                                <th className="px-4 py-3 text-right rtl:text-left">{t('hr.basicSalary', 'Basic Salary')}</th>
                                <th className="px-4 py-3 text-right rtl:text-left">{t('hr.grossSalary', 'Gross Salary')}</th>
                                <th className="px-4 py-3 text-center">{t('hr.status', 'Status')}</th>
                                <th className="px-4 py-3 text-right rtl:text-left">{t('customers.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {employees.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-neutral-500">
                                        No employee profiles found.
                                    </td>
                                </tr>
                            ) : (
                                employees.data.map((emp) => {
                                    const gross = (
                                        parseFloat(emp.basic_salary) +
                                        parseFloat(emp.housing_allowance) +
                                        parseFloat(emp.transport_allowance) +
                                        parseFloat(emp.other_allowances)
                                    ).toFixed(2);

                                    return (
                                        <tr key={emp.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                {emp.employee_number}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                    {isRtl && emp.first_name_ar ? `${emp.first_name_ar} ${emp.last_name_ar || ''}` : `${emp.first_name} ${emp.last_name}`}
                                                </div>
                                                <div className="text-xs text-neutral-500">{emp.email || emp.phone || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                {emp.department ? (isRtl && emp.department.name_ar ? emp.department.name_ar : emp.department.name) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                {emp.designation ? (isRtl && emp.designation.title_ar ? emp.designation.title_ar : emp.designation.title) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right rtl:text-left font-mono font-medium text-neutral-800 dark:text-neutral-200">
                                                {parseFloat(emp.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                {parseFloat(gross).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    emp.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                        : emp.status === 'on_leave'
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                        : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                                                }`}>
                                                    {t(`hr.${emp.status === 'on_leave' ? 'onLeave' : emp.status}`, emp.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right rtl:text-left">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <Link href={`/hr/employees/${emp.id}/edit`}>
                                                            <Edit2 className="h-4 w-4 text-neutral-500 hover:text-neutral-900" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700"
                                                        onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
