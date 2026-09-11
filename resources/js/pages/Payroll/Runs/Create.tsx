import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, BadgeDollarSign, Calculator, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

export default function CreatePayrollRun() {
    const { t, isRtl } = useTranslation();

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const { data, setData, post, processing, errors } = useForm({
        period_year: currentYear,
        period_month: currentMonth,
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/payroll/runs');
    };

    const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto">
            <Head title={t('payroll.newRun', 'Generate Payroll Run')} />

            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/payroll/runs">
                        <ArrowIcon className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        <span>{t('payroll.title', 'Payroll Runs')}</span>
                    </Link>
                </Button>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-50 p-2.5 dark:bg-indigo-950/50">
                        <BadgeDollarSign className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            {t('payroll.newRun', 'Generate Monthly Payroll Run')}
                        </h1>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Compiles payslips for all active company employees with synthetic 10% social insurance deductions.
                        </p>
                    </div>
                </div>

                <div className="mb-6 rounded-lg bg-amber-50 p-4 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">Automatic Calculations:</p>
                        <p className="mt-1">
                            Gross salary includes basic + housing + transport + other allowances + attendance overtime. Deductions apply the 10% Social Insurance / GOSI test rate automatically.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Period Year *
                            </label>
                            <Input
                                required
                                type="number"
                                min="2020"
                                max="2050"
                                value={data.period_year}
                                onChange={(e) => setData('period_year', parseInt(e.target.value))}
                            />
                            {errors.period_year && <p className="text-xs text-rose-500 mt-1">{errors.period_year}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Period Month *
                            </label>
                            <select
                                value={data.period_month}
                                onChange={(e) => setData('period_month', parseInt(e.target.value))}
                                className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>
                                        Month {String(m).padStart(2, '0')}
                                    </option>
                                ))}
                            </select>
                            {errors.period_month && <p className="text-xs text-rose-500 mt-1">{errors.period_month}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            {t('payroll.paymentDate', 'Payment / Value Date')} *
                        </label>
                        <Input
                            required
                            type="date"
                            value={data.payment_date}
                            onChange={(e) => setData('payment_date', e.target.value)}
                        />
                        {errors.payment_date && <p className="text-xs text-rose-500 mt-1">{errors.payment_date}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Notes / Memo
                        </label>
                        <Input
                            placeholder="Optional payroll run comments"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                        <Button asChild variant="outline">
                            <Link href="/payroll/runs">{t('common.cancel', 'Cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Calculator className="h-4 w-4" />
                            <span>{processing ? t('common.loading', 'Processing...') : 'Generate Payslips'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
