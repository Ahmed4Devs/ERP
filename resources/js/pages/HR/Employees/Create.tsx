import { useState } from 'react';
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

interface Props {
    departments: Department[];
    designations: Designation[];
    branches: Branch[];
}

export default function CreateEmployee({ departments, designations, branches }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        employee_number: '',
        first_name: '',
        last_name: '',
        first_name_ar: '',
        last_name_ar: '',
        email: '',
        phone: '',
        national_id: '',
        department_id: '',
        designation_id: '',
        branch_id: '',
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
        basic_salary: '',
        housing_allowance: '0',
        transport_allowance: '0',
        other_allowances: '0',
        bank_name: '',
        iban: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hr/employees');
    };

    const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={t('hr.newEmployee', 'Add New Employee')} />

            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/hr/employees">
                        <ArrowIcon className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        <span>{t('hr.title', 'Employees')}</span>
                    </Link>
                </Button>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                        {t('hr.newEmployee', 'Add New Employee Profile')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Enter personal identity, placement, and initial compensation package.
                    </p>
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
                                    {t('hr.employeeNumber', 'Employee ID')} *
                                </label>
                                <Input
                                    required
                                    placeholder="EMP-001"
                                    value={data.employee_number}
                                    onChange={(e) => setData('employee_number', e.target.value)}
                                />
                                {errors.employee_number && <p className="text-xs text-rose-500 mt-1">{errors.employee_number}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    First Name (EN) *
                                </label>
                                <Input
                                    required
                                    placeholder="John"
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
                                    placeholder="Doe"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                />
                                {errors.last_name && <p className="text-xs text-rose-500 mt-1">{errors.last_name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    First Name (AR)
                                </label>
                                <Input
                                    placeholder="الاسم الأول"
                                    value={data.first_name_ar}
                                    onChange={(e) => setData('first_name_ar', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Last Name (AR)
                                </label>
                                <Input
                                    placeholder="اسم العائلة"
                                    value={data.last_name_ar}
                                    onChange={(e) => setData('last_name_ar', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    National ID / Iqama
                                </label>
                                <Input
                                    placeholder="10xxxxxxxx"
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
                                    placeholder="staff@company.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Phone Number
                                </label>
                                <Input
                                    placeholder="+9665xxxxxxxx"
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
                                    placeholder="10000.00"
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
                                    placeholder="e.g. Al-Rajhi Bank"
                                    value={data.bank_name}
                                    onChange={(e) => setData('bank_name', e.target.value)}
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('hr.iban', 'IBAN Account Number')}
                                </label>
                                <Input
                                    placeholder="SA0000000000000000000000"
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
                            <span>{processing ? t('common.loading', 'Saving...') : t('common.save', 'Save Profile')}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
