import { Head, Link } from '@inertiajs/react';
import { Plus, BadgeDollarSign, CheckCircle2, DollarSign, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface PayrollRun {
    id: string;
    run_number: string;
    period_year: number;
    period_month: number;
    payment_date: string;
    total_basic: string;
    total_allowances: string;
    total_deductions: string;
    total_net: string;
    status: 'draft' | 'approved' | 'posted' | 'paid';
    journal_entry_id?: string;
    disbursement_journal_entry_id?: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    runs: PaginatedData<PayrollRun>;
}

export default function PayrollRunsIndex({ runs }: Props) {
    const { t, isRtl } = useTranslation();

    const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('payroll.title', 'Payroll Runs')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('payroll.title', 'Payroll Runs & Compensation')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('payroll.subtitle', 'Monthly payroll generation, automated deductions, and GL postings')}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/payroll/runs/create">
                        <Plus className="h-4 w-4" />
                        <span>{t('payroll.newRun', 'Generate Payroll Run')}</span>
                    </Link>
                </Button>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-x-auto">
                <table className="w-full text-left text-sm rtl:text-right">
                    <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                        <tr>
                            <th className="px-4 py-3">{t('payroll.runNumber', 'Run #')}</th>
                            <th className="px-4 py-3">{t('payroll.period', 'Period')}</th>
                            <th className="px-4 py-3">{t('payroll.paymentDate', 'Payment Date')}</th>
                            <th className="px-4 py-3 text-right rtl:text-left">{t('payroll.totalBasic', 'Basic Total')}</th>
                            <th className="px-4 py-3 text-right rtl:text-left">{t('payroll.totalAllowances', 'Allowances')}</th>
                            <th className="px-4 py-3 text-right rtl:text-left">{t('payroll.totalDeductions', 'Deductions (GOSI)')}</th>
                            <th className="px-4 py-3 text-right rtl:text-left">{t('payroll.totalNet', 'Net Payable')}</th>
                            <th className="px-4 py-3 text-center">{t('payroll.status', 'Status')}</th>
                            <th className="px-4 py-3 text-right rtl:text-left">{t('customers.actions', 'Action')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {runs.data.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-8 text-center text-neutral-500">
                                    No payroll runs generated yet. Click "Generate Payroll Run" to start.
                                </td>
                            </tr>
                        ) : (
                            runs.data.map((run) => (
                                <tr key={run.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                        {run.run_number}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                        {run.period_year} - {String(run.period_month).padStart(2, '0')}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                        {run.payment_date?.substring(0, 10)}
                                    </td>
                                    <td className="px-4 py-3 text-right rtl:text-left font-mono text-neutral-700 dark:text-neutral-300">
                                        {parseFloat(run.total_basic).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right rtl:text-left font-mono text-neutral-700 dark:text-neutral-300">
                                        {parseFloat(run.total_allowances).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right rtl:text-left font-mono text-rose-600 dark:text-rose-400">
                                        -{parseFloat(run.total_deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                        {parseFloat(run.total_net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            run.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                                            run.status === 'posted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                                            'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                                        }`}>
                                            {t(`payroll.${run.status}`, run.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right rtl:text-left">
                                        <Button asChild size="sm" variant="ghost" className="gap-1">
                                            <Link href={`/payroll/runs/${run.id}`}>
                                                <span>{t('common.view', 'Details')}</span>
                                                <ArrowIcon className="h-3.5 w-3.5" />
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
    );
}
