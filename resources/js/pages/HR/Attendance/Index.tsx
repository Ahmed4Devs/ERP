import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { CalendarCheck, Clock, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Employee {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    first_name_ar?: string;
    last_name_ar?: string;
    department?: {
        name: string;
        name_ar?: string;
    };
}

interface Attendance {
    id: string;
    employee_id: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'leave' | 'half_day';
    hours_worked: string;
    overtime_hours: string;
    notes?: string;
    employee?: Employee;
}

interface Props {
    attendances: Attendance[];
    employees: Employee[];
    selectedDate: string;
}

export default function AttendanceIndex({ attendances, employees, selectedDate }: Props) {
    const { t, isRtl } = useTranslation();
    const [date, setDate] = useState(selectedDate);
    const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

    const form = useForm({
        employee_id: '',
        date: selectedDate,
        status: 'present',
        hours_worked: '8.00',
        overtime_hours: '0.00',
        notes: '',
    });

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        router.get('/hr/attendances', { date: newDate }, { preserveState: true });
    };

    const handleOpenModal = (emp: Employee, att?: Attendance) => {
        setSelectedEmp(emp);
        form.setData({
            employee_id: emp.id,
            date: date,
            status: att?.status || 'present',
            hours_worked: att?.hours_worked || '8.00',
            overtime_hours: att?.overtime_hours || '0.00',
            notes: att?.notes || '',
        });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/hr/attendances', {
            onSuccess: () => {
                setSelectedEmp(null);
            },
        });
    };

    const attendanceMap = new Map(attendances.map(a => [a.employee_id, a]));

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('hr.attendanceTitle', 'Attendance & Working Hours')} />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('hr.attendanceTitle', 'Daily Attendance & Timesheet')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('hr.attendanceSubtitle', 'Log employee daily presence and overtime hours for payroll calculations')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Date:</label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-44"
                    />
                </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-x-auto">
                <table className="w-full text-left text-sm rtl:text-right">
                    <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <tr>
                            <th className="px-4 py-3">{t('hr.employeeNumber', 'ID')}</th>
                            <th className="px-4 py-3">{t('hr.name', 'Employee Name')}</th>
                            <th className="px-4 py-3">{t('hr.department', 'Department')}</th>
                            <th className="px-4 py-3 text-center">{t('hr.status', 'Attendance Status')}</th>
                            <th className="px-4 py-3 text-center">Regular Hours</th>
                            <th className="px-4 py-3 text-center">Overtime (OT)</th>
                            <th className="px-4 py-3 text-right rtl:text-left">{t('customers.actions', 'Action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {employees.map((emp) => {
                            const att = attendanceMap.get(emp.id);

                            return (
                                <tr key={emp.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                    <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                        {emp.employee_number}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                        {isRtl && emp.first_name_ar ? `${emp.first_name_ar} ${emp.last_name_ar || ''}` : `${emp.first_name} ${emp.last_name}`}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                        {emp.department ? (isRtl && emp.department.name_ar ? emp.department.name_ar : emp.department.name) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {att ? (
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                att.status === 'present' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                                                att.status === 'absent' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                                                att.status === 'late' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                                                'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                                            }`}>
                                                {att.status.toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-neutral-400">Not recorded</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono">
                                        {att ? `${parseFloat(att.hours_worked).toFixed(1)} hrs` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono">
                                        {att && parseFloat(att.overtime_hours) > 0 ? (
                                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                                +{parseFloat(att.overtime_hours).toFixed(1)} hrs
                                            </span>
                                        ) : (
                                            att ? '0.0 hrs' : '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right rtl:text-left">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleOpenModal(emp, att)}
                                        >
                                            {att ? 'Edit' : 'Log Presence'}
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selectedEmp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                            Log Attendance: {selectedEmp.first_name} {selectedEmp.last_name}
                        </h3>
                        <p className="text-xs text-neutral-500 mb-4">Date: {date}</p>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Attendance Status *
                                </label>
                                <select
                                    value={form.data.status}
                                    onChange={(e) => form.setData('status', e.target.value as any)}
                                    className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                                >
                                    <option value="present">Present (حاضر)</option>
                                    <option value="absent">Absent (غائب)</option>
                                    <option value="late">Late (متأخر)</option>
                                    <option value="leave">Leave / Vacation (إجازة)</option>
                                    <option value="half_day">Half Day (نصف يوم)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Hours Worked
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        value={form.data.hours_worked}
                                        onChange={(e) => form.setData('hours_worked', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Overtime (Hours)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        value={form.data.overtime_hours}
                                        onChange={(e) => form.setData('overtime_hours', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Notes
                                </label>
                                <Input
                                    placeholder="Optional remark"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setSelectedEmp(null)}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={form.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {t('common.save', 'Save')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
