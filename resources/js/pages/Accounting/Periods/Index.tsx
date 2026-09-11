import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Lock, Unlock, Plus, CalendarCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface FiscalPeriod {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_locked: boolean;
}

interface Props {
    periods: FiscalPeriod[];
}

export default function FiscalPeriodsIndex({ periods }: Props) {
    const { t } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const form = useForm({
        name: '',
        start_date: '',
        end_date: '',
    });

    const handleToggleLock = (period: FiscalPeriod) => {
        const action = period.is_locked ? 'unlock' : 'lock';
        if (confirm(`Are you sure you want to ${action} period '${period.name}'?`)) {
            router.post(`/accounting/periods/${period.id}/lock`);
        }
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/accounting/periods', {
            onSuccess: () => {
                form.reset();
                setShowModal(false);
            },
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={t('periods.title', 'Fiscal Periods & Financial Close')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <CalendarCheck className="h-6 w-6 text-indigo-600" />
                        <span>{t('periods.title', 'Fiscal Periods & Close Control')}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('periods.subtitle', 'Period locking controls preventing backdated postings into closed accounts')}
                    </p>
                </div>
                <Button onClick={() => setShowModal(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="h-4 w-4" />
                    <span>{t('periods.newPeriod', 'Create Fiscal Period')}</span>
                </Button>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800/40 dark:text-blue-300 text-xs flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold">Financial Integrity & Backdate Protection:</p>
                    <p className="mt-1">
                        When a fiscal period is locked, the ERP's PostingEngine strictly rejects any transaction (invoices, bills, payroll, receipts, depreciation) whose booking date falls within the closed period.
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-x-auto">
                <table className="w-full text-left text-sm rtl:text-right">
                    <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <tr>
                            <th className="px-4 py-3">{t('periods.name', 'Period Name')}</th>
                            <th className="px-4 py-3">{t('periods.startDate', 'Start Date')}</th>
                            <th className="px-4 py-3">{t('periods.endDate', 'End Date')}</th>
                            <th className="px-4 py-3 text-center">{t('periods.isLocked', 'Lock Status')}</th>
                            <th className="px-4 py-3 text-right rtl:text-left">{t('customers.actions', 'Action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {periods.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-8 text-center text-neutral-500">
                                    No fiscal periods configured.
                                </td>
                            </tr>
                        ) : (
                            periods.map((p) => (
                                <tr key={p.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                        {p.name}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                        {p.start_date?.substring(0, 10)}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                        {p.end_date?.substring(0, 10)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            p.is_locked
                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        }`}>
                                            {p.is_locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                            <span>{p.is_locked ? t('periods.locked', 'Locked / Closed') : t('periods.open', 'Open')}</span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right rtl:text-left">
                                        <Button
                                            size="sm"
                                            variant={p.is_locked ? 'outline' : 'destructive'}
                                            onClick={() => handleToggleLock(p)}
                                            className="gap-1"
                                        >
                                            {p.is_locked ? (
                                                <>
                                                    <Unlock className="h-3.5 w-3.5" />
                                                    <span>{t('periods.unlockPeriod', 'Unlock Period')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="h-3.5 w-3.5" />
                                                    <span>{t('periods.lockPeriod', 'Lock Period')}</span>
                                                </>
                                            )}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Period Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            {t('periods.newPeriod', 'Create Fiscal Period')}
                        </h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Period Name *
                                </label>
                                <Input
                                    required
                                    placeholder="FY-2026-Q1 or FY-2027"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Start Date *
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={form.data.start_date}
                                    onChange={(e) => form.setData('start_date', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    End Date *
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={form.data.end_date}
                                    onChange={(e) => form.setData('end_date', e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={form.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {t('common.save', 'Create Period')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
