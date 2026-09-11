import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Save, User, Building, DollarSign } from 'lucide-react';
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

interface Branch {
    id: string;
    code: string;
    name: string;
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
    national_id?: string;
    department_id?: string;
    designation_id?: string;
    branch_id?: string;
    hire_date: string;
    status: 'active' | 'on_leave' | 'terminated';
    basic_salary: string;
    housing_allowance: string;
    transport_allowance: string;
    other_allowances: string;
    bank_name?: string;
    iban?: string;
}

interface Props {
    employee: Employee;
    departments: Department[];
    designations: Designation[];
    branches: Branch[];
}

export default function EditEmployee({ employee, departments, designations, branches }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, put, processing, errors } = useForm({
        first_name: employee.first_name,
        last_name: employee.last_name,
        first_name_ar: employee.first_name_ar || '',
        last_name_ar: employee.last_name_ar || '',
        email: employee.email || '',
        phone: employee.phone || '',
        national_id: employee.national_id || '',
        department_id: employee.department_id || '',
        designation_id: employee.designation_id || '',
        branch_id: employee.branch_id || '',
        hire_date: employee.hire_date.substring(0, 10),
        status: employee.status,
        basic_salary: employee.basic_salary,
        housing_allowance: employee.housing_allowance,
        transport_allowance: employee.transport_allowance,
        other_allowances: employee.other_allowances,
        bank_name: employee.bank_name || '',
        iban: employee.iban || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/hr/employees/${employee.id}`);
    };

    const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={`Edit Employee - ${employee.employee_number}`} />

            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/hr/employees">
                        <ArrowIcon className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        <span>{t('hr.title', 'Employees')}</span>
                    </Link>
                </Button>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            Edit Employee Profile ({employee.employee_number})
                        </h1>
                        <p className="text-sm text-neutral-500 mt-1">
                            Update contract placement and salary structure.
                        </p>
                    </div>
                    <span className="font-mono text-sm px-3 py-1 bg-neutral-100 rounded-md dark:bg-neutral-800">
                        {employee.employee_number}
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Identification Section */}
                    <div>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
                            <User className="h-4 w-4" /> Personal & Identification Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    First Name (EN) *
                                </label>
                                <Input
                                    required
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                />
                                {errors.first_name && <p className="text-xs text-rose-500 mt-1">{errors.first_name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Last Name (EN) *
                                </label>
                                <Input
                                    required
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                />
                                {errors.last_name && <p className="text-xs text-rose-500 mt-1">{errors.last_name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.status', 'Employment Status')} *
                                </label>
                                <select
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value as any)}
                                    className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                                >
                                    <option value="active">{t('hr.active', 'Active')}</option>
                                    <option value="on_leave">{t('hr.onLeave', 'On Leave')}</option>
                                    <option value="terminated">{t('hr.terminated', 'Terminated')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    First Name (AR)
                                </label>
                                <Input
                                    value={data.first_name_ar}
                                    onChange={(e) => setData('first_name_ar', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Last Name (AR)
                                </label>
                                <Input
                                    value={data.last_name_ar}
                                    onChange={(e) => setData('last_name_ar', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    National ID / Iqama
                                </label>
                                <Input
                                    value={data.national_id}
                                    onChange={(e) => setData('national_id', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Email Address
                                </label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Phone Number
                                </label>
                                <Input
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.hireDate', 'Hire Date')} *
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={data.hire_date}
                                    onChange={(e) => setData('hire_date', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Department & Placement */}
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
                            <Building className="h-4 w-4" /> Placement & Department
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.department', 'Department')}
                                </label>
                                <select
                                    value={data.department_id}
                                    onChange={(e) => setData('department_id', e.target.value)}
                                    className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {isRtl && d.name_ar ? d.name_ar : d.name} ({d.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.designation', 'Designation / Job Title')}
                                </label>
                                <select
                                    value={data.designation_id}
                                    onChange={(e) => setData('designation_id', e.target.value)}
                                    className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                                >
                                    <option value="">Select Designation</option>
                                    {designations.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {isRtl && d.title_ar ? d.title_ar : d.title} ({d.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Branch Location
                                </label>
                                <select
                                    value={data.branch_id}
                                    onChange={(e) => setData('branch_id', e.target.value)}
                                    className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} ({b.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Compensation & Bank */}
                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Compensation & Bank Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.basicSalary', 'Basic Salary')} *
                                </label>
                                <Input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={data.basic_salary}
                                    onChange={(e) => setData('basic_salary', e.target.value)}
                                />
                                {errors.basic_salary && <p className="text-xs text-rose-500 mt-1">{errors.basic_salary}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.housing', 'Housing Allowance')}
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.housing_allowance}
                                    onChange={(e) => setData('housing_allowance', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.transport', 'Transport Allowance')}
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.transport_allowance}
                                    onChange={(e) => setData('transport_allowance', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.otherAllowances', 'Other Allowances')}
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.other_allowances}
                                    onChange={(e) => setData('other_allowances', e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.bank', 'Bank Name')}
                                </label>
                                <Input
                                    value={data.bank_name}
                                    onChange={(e) => setData('bank_name', e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.iban', 'IBAN Account Number')}
                                </label>
                                <Input
                                    value={data.iban}
                                    onChange={(e) => setData('iban', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                        <Button asChild variant="outline">
                            <Link href="/hr/employees">{t('common.cancel', 'Cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Save className="h-4 w-4" />
                            <span>{processing ? t('common.loading', 'Saving...') : t('common.save', 'Update Profile')}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
