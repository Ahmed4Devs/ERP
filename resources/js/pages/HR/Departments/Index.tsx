import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Building2, Briefcase, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface EmployeeSimple {
    id: string;
    first_name: string;
    last_name: string;
    first_name_ar?: string;
    last_name_ar?: string;
}

interface Department {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    manager?: EmployeeSimple;
    employees_count: number;
}

interface Designation {
    id: string;
    code: string;
    title: string;
    title_ar?: string;
    description?: string;
    employees_count: number;
}

interface Props {
    departments: Department[];
    designations: Designation[];
    employees: EmployeeSimple[];
}

export default function DepartmentsIndex({ departments, designations, employees }: Props) {
    const { t, isRtl } = useTranslation();
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [showDesigModal, setShowDesigModal] = useState(false);

    const deptForm = useForm({
        code: '',
        name: '',
        name_ar: '',
        manager_id: '',
    });

    const desigForm = useForm({
        code: '',
        title: '',
        title_ar: '',
        description: '',
    });

    const handleCreateDept = (e: React.FormEvent) => {
        e.preventDefault();
        deptForm.post('/hr/departments', {
            onSuccess: () => {
                deptForm.reset();
                setShowDeptModal(false);
            },
        });
    };

    const handleCreateDesig = (e: React.FormEvent) => {
        e.preventDefault();
        desigForm.post('/hr/designations', {
            onSuccess: () => {
                desigForm.reset();
                setShowDesigModal(false);
            },
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('hr.departmentsTitle', 'Departments & Positions')} />

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    {t('hr.departmentsTitle', 'Departments & Designations')}
                </h1>
                <p className="text-sm text-neutral-500 mt-1">
                    {t('hr.departmentsSubtitle', 'Organizational structure, job hierarchies, and department headcount')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Departments Column */}
                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {t('hr.department', 'Departments')} ({departments.length})
                            </h2>
                        </div>
                        <Button size="sm" onClick={() => setShowDeptModal(true)} className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="h-4 w-4" />
                            <span>{t('hr.addDepartment', 'Add Department')}</span>
                        </Button>
                    </div>

                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {departments.length === 0 ? (
                            <p className="p-6 text-center text-sm text-neutral-500">No departments configured yet.</p>
                        ) : (
                            departments.map(d => (
                                <div key={d.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                                                {d.code}
                                            </span>
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {isRtl && d.name_ar ? d.name_ar : d.name}
                                            </span>
                                        </div>
                                        {d.manager && (
                                            <p className="text-xs text-neutral-500 mt-1">
                                                {t('hr.manager', 'Manager')}: {d.manager.first_name} {d.manager.last_name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>{d.employees_count} {t('hr.staffCount', 'Employees')}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Designations Column */}
                <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-purple-600" />
                            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {t('hr.designation', 'Designations / Job Titles')} ({designations.length})
                            </h2>
                        </div>
                        <Button size="sm" onClick={() => setShowDesigModal(true)} variant="outline" className="gap-1">
                            <Plus className="h-4 w-4" />
                            <span>{t('hr.addDesignation', 'Add Designation')}</span>
                        </Button>
                    </div>

                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {designations.length === 0 ? (
                            <p className="p-6 text-center text-sm text-neutral-500">No designations configured yet.</p>
                        ) : (
                            designations.map(d => (
                                <div key={d.id} className="p-4 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded">
                                                {d.code}
                                            </span>
                                            <span className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {isRtl && d.title_ar ? d.title_ar : d.title}
                                            </span>
                                        </div>
                                        {d.description && (
                                            <p className="text-xs text-neutral-500 mt-1">{d.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-full">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>{d.employees_count} {t('hr.staffCount', 'Employees')}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create Department Modal */}
            {showDeptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            {t('hr.addDepartment', 'Add Department')}
                        </h3>
                        <form onSubmit={handleCreateDept} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Department Code *
                                </label>
                                <Input
                                    required
                                    placeholder="DEP-FIN"
                                    value={deptForm.data.code}
                                    onChange={(e) => deptForm.setData('code', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Name (English) *
                                </label>
                                <Input
                                    required
                                    placeholder="Finance & Accounts"
                                    value={deptForm.data.name}
                                    onChange={(e) => deptForm.setData('name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Name (Arabic)
                                </label>
                                <Input
                                    placeholder="قسم المالية والحسابات"
                                    value={deptForm.data.name_ar}
                                    onChange={(e) => deptForm.setData('name_ar', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Department Manager
                                </label>
                                <select
                                    value={deptForm.data.manager_id}
                                    onChange={(e) => deptForm.setData('manager_id', e.target.value)}
                                    className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                                >
                                    <option value="">None</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>
                                            {e.first_name} {e.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowDeptModal(false)}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={deptForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {t('common.save', 'Save Department')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Designation Modal */}
            {showDesigModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            {t('hr.addDesignation', 'Add Designation')}
                        </h3>
                        <form onSubmit={handleCreateDesig} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Designation Code *
                                </label>
                                <Input
                                    required
                                    placeholder="DES-ACC"
                                    value={desigForm.data.code}
                                    onChange={(e) => desigForm.setData('code', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Title (English) *
                                </label>
                                <Input
                                    required
                                    placeholder="Senior Accountant"
                                    value={desigForm.data.title}
                                    onChange={(e) => desigForm.setData('title', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Title (Arabic)
                                </label>
                                <Input
                                    placeholder="محاسب أول"
                                    value={desigForm.data.title_ar}
                                    onChange={(e) => desigForm.setData('title_ar', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Job Description
                                </label>
                                <Input
                                    placeholder="Brief role responsibilities"
                                    value={desigForm.data.description}
                                    onChange={(e) => desigForm.setData('description', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowDesigModal(false)}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={desigForm.processing} className="bg-purple-600 hover:bg-purple-700 text-white">
                                    {t('common.save', 'Save Designation')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
