import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { TrendingDown, Plus, Calculator, BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface DepreciationEntry {
    id: string;
    amount: string;
    fixed_asset?: {
        asset_tag: string;
        name: string;
        name_ar?: string;
    };
}

interface DepreciationRun {
    id: string;
    run_number: string;
    period_year: number;
    period_month: number;
    date: string;
    total_depreciation: string;
    status: string;
    notes?: string;
    entries?: DepreciationEntry[];
    journal_entry?: {
        entry_number: string;
    };
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    runs: PaginatedData<DepreciationRun>;
}

export default function AssetDepreciationIndex({ runs }: Props) {
    const { t, isRtl } = useTranslation();
    const [showModal, setShowModal] = useState(false);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const form = useForm({
        period_year: currentYear,
        period_month: currentMonth,
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const handleRun = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/assets/depreciation', {
            onSuccess: () => {
                setShowModal(false);
            },
        });
    };

    const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('assets.depreciationRuns', 'Asset Depreciation Runs')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <TrendingDown className="h-6 w-6 text-indigo-600" />
                        <span>{t('assets.depreciationRuns', 'Asset Depreciation Runs')}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('assets.depreciationSubtitle', 'Automated monthly straight-line depreciation journal entries')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline">
                        <Link href="/assets/register">
                            <ArrowIcon className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            <span>{t('assets.title', 'Asset Register')}</span>
                        </Link>
                    </Button>
                    <Button onClick={() => setShowModal(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Calculator className="h-4 w-4" />
                        <span>{t('assets.postDepreciation', 'Execute Depreciation Run')}</span>
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-x-auto">
                <table className="w-full text-left text-sm rtl:text-right">
                    <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <tr>
                            <th className="px-4 py-3">{t('assets.runNumber', 'Run #')}</th>
                            <th className="px-4 py-3">Period (Year / Month)</th>
                            <th className="px-4 py-3">{t('assets.date', 'Execution Date')}</th>
                            <th className="px-4 py-3 text-right rtl:text-left">{t('assets.totalDepreciation', 'Total Depreciated')}</th>
                            <th className="px-4 py-3">GL Journal Entry</th>
                            <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {runs.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-neutral-500">
                                    No depreciation runs executed yet. Click "Execute Depreciation Run" to post monthly depreciation.
                                </td>
                            </tr>
                        ) : (
                            runs.data.map((run) => (
                                <tr key={run.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                        {run.run_number}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                        {run.period_year} / {String(run.period_month).padStart(2, '0')}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                                        {run.date?.substring(0, 10)}
                                    </td>
                                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-rose-600 dark:text-rose-400">
                                        {parseFloat(run.total_depreciation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                                        {run.journal_entry ? run.journal_entry.entry_number : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                            POSTED
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Execute Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                            {t('assets.postDepreciation', 'Execute Asset Depreciation')}
                        </h3>
                        <p className="text-xs text-neutral-500 mb-4">
                            Computes monthly straight-line depreciation across all active in-service assets and posts DR 5300 (Depreciation Expense) vs CR 1590 (Accumulated Depreciation).
                        </p>

                        <form onSubmit={handleRun} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Year *
                                    </label>
                                    <Input
                                        type="number"
                                        required
                                        min="2020"
                                        max="2050"
                                        value={form.data.period_year}
                                        onChange={(e) => form.setData('period_year', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Month *
                                    </label>
                                    <select
                                        value={form.data.period_month}
                                        onChange={(e) => form.setData('period_month', parseInt(e.target.value))}
                                        className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                            <option key={m} value={m}>
                                                Month {String(m).padStart(2, '0')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Value / Booking Date *
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={form.data.date}
                                    onChange={(e) => form.setData('date', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Notes
                                </label>
                                <Input
                                    placeholder="Monthly straight-line run"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={form.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {form.processing ? t('common.loading', 'Processing...') : 'Calculate & Post'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
