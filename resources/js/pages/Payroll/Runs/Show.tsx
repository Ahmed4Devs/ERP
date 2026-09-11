import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, BadgeDollarSign, BookOpen, CheckCircle, CreditCard, DollarSign, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface BankAccount {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    current_balance: string;
}

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
    designation?: {
        title: string;
        title_ar?: string;
    };
}

interface Payslip {
    id: string;
    employee_id: string;
    basic_salary: string;
    housing_allowance: string;
    transport_allowance: string;
    other_allowances: string;
    overtime_amount: string;
    gross_salary: string;
    social_insurance_deduction: string;
    other_deductions: string;
    total_deductions: string;
    net_salary: string;
    status: string;
    employee: Employee;
}

interface JournalLine {
    id: string;
    debit: string;
    credit: string;
    description?: string;
    account?: {
        code: string;
        name: string;
        name_ar?: string;
    };
}

interface JournalEntry {
    id: string;
    entry_number: string;
    date: string;
    description?: string;
    lines: JournalLine[];
}

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
    notes?: string;
    payslips: Payslip[];
    journal_entry?: JournalEntry;
    disbursement_journal_entry?: JournalEntry;
}

interface Props {
    payrollRun: PayrollRun;
    bankAccounts: BankAccount[];
}

export default function ShowPayrollRun({ payrollRun, bankAccounts }: Props) {
    const { t, isRtl } = useTranslation();
    const [selectedBankId, setSelectedBankId] = useState(bankAccounts[0]?.id || '');
    const [isPosting, setIsPosting] = useState(false);
    const [isDisbursing, setIsDisbursing] = useState(false);
    const [showDisburseModal, setShowDisburseModal] = useState(false);

    const handlePostRun = () => {
        if (confirm('Confirm posting payroll run to General Ledger? This will record expense and liability accounts.')) {
            setIsPosting(true);
            router.post(`/payroll/runs/${payrollRun.id}/post`, {}, {
                onFinish: () => setIsPosting(false),
            });
        }
    };

    const handleDisburse = (e: React.FormEvent) => {
        e.preventDefault();
        setIsDisbursing(true);
        router.post(`/payroll/runs/${payrollRun.id}/disburse`, {
            bank_account_id: selectedBankId,
        }, {
            onFinish: () => {
                setIsDisbursing(false);
                setShowDisburseModal(false);
            },
        });
    };

    const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={`Payroll Run ${payrollRun.run_number}`} />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/payroll/runs">
                            <ArrowIcon className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            <span>{t('payroll.title', 'Payroll Runs')}</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <span>Payroll Run: {payrollRun.run_number}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                payrollRun.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                                payrollRun.status === 'posted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                                'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}>
                                {t(`payroll.${payrollRun.status}`, payrollRun.status)}
                            </span>
                        </h1>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            Period: {payrollRun.period_year} / {String(payrollRun.period_month).padStart(2, '0')} | Value Date: {payrollRun.payment_date?.substring(0, 10)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {payrollRun.status === 'draft' && (
                        <Button
                            onClick={handlePostRun}
                            disabled={isPosting}
                            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Send className="h-4 w-4" />
                            <span>{isPosting ? t('common.loading', 'Posting...') : t('payroll.postToGl', 'Post to General Ledger')}</span>
                        </Button>
                    )}

                    {payrollRun.status === 'posted' && (
                        <Button
                            onClick={() => setShowDisburseModal(true)}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <CreditCard className="h-4 w-4" />
                            <span>{t('payroll.disburse', 'Disburse via Bank')}</span>
                        </Button>
                    )}

                    {payrollRun.status === 'paid' && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg dark:bg-emerald-950/50">
                            <CheckCircle className="h-4 w-4" />
                            <span>Settled via Bank</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-500">{t('payroll.totalBasic', 'Basic Salaries')}</span>
                    <p className="mt-1 text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        {parseFloat(payrollRun.total_basic).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-500">{t('payroll.totalAllowances', 'Allowances & OT')}</span>
                    <p className="mt-1 text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        {parseFloat(payrollRun.total_allowances).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-500">{t('payroll.socialInsurance', 'GOSI Deductions (10%)')}</span>
                    <p className="mt-1 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                        -{parseFloat(payrollRun.total_deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/30">
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{t('payroll.totalNet', 'Net Payable')}</span>
                    <p className="mt-1 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {parseFloat(payrollRun.total_net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Payslips Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {t('payroll.payslips', 'Employee Payslips')} ({payrollRun.payslips.length})
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm rtl:text-right">
                        <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                            <tr>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Department</th>
                                <th className="px-4 py-3 text-right rtl:text-left">Basic</th>
                                <th className="px-4 py-3 text-right rtl:text-left">Housing</th>
                                <th className="px-4 py-3 text-right rtl:text-left">Transport</th>
                                <th className="px-4 py-3 text-right rtl:text-left">Other / OT</th>
                                <th className="px-4 py-3 text-right rtl:text-left">Gross</th>
                                <th className="px-4 py-3 text-right rtl:text-left text-rose-600">GOSI 10%</th>
                                <th className="px-4 py-3 text-right rtl:text-left font-bold text-indigo-600">Net Salary</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {payrollRun.payslips.map((ps) => {
                                const otherTotal = (parseFloat(ps.other_allowances) + parseFloat(ps.overtime_amount)).toFixed(2);

                                return (
                                    <tr key={ps.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                                {isRtl && ps.employee.first_name_ar ? `${ps.employee.first_name_ar} ${ps.employee.last_name_ar || ''}` : `${ps.employee.first_name} ${ps.employee.last_name}`}
                                            </div>
                                            <div className="text-xs font-mono text-neutral-400">{ps.employee.employee_number}</div>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-xs">
                                            {ps.employee.department?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono">
                                            {parseFloat(ps.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono text-neutral-600">
                                            {parseFloat(ps.housing_allowance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono text-neutral-600">
                                            {parseFloat(ps.transport_allowance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono text-neutral-600">
                                            {parseFloat(otherTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono font-medium">
                                            {parseFloat(ps.gross_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono text-rose-600">
                                            -{parseFloat(ps.social_insurance_deduction).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                            {parseFloat(ps.net_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* General Ledger Journal Entry Previews */}
            {payrollRun.journal_entry && (
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
                            {t('payroll.journalEntry', 'General Ledger Journal Entry')} ({payrollRun.journal_entry.entry_number})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs rtl:text-right">
                            <thead className="border-b border-neutral-200 bg-neutral-50/50 uppercase text-neutral-500">
                                <tr>
                                    <th className="px-3 py-2">Account</th>
                                    <th className="px-3 py-2">Line Description</th>
                                    <th className="px-3 py-2 text-right rtl:text-left">Debit (DR)</th>
                                    <th className="px-3 py-2 text-right rtl:text-left">Credit (CR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {payrollRun.journal_entry.lines.map((line) => (
                                    <tr key={line.id}>
                                        <td className="px-3 py-2 font-mono">
                                            {line.account?.code} - {line.account?.name}
                                        </td>
                                        <td className="px-3 py-2 text-neutral-600">{line.description}</td>
                                        <td className="px-3 py-2 text-right rtl:text-left font-mono font-medium">
                                            {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right rtl:text-left font-mono font-medium">
                                            {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Disburse Modal */}
            {showDisburseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                            {t('payroll.disburse', 'Disburse Payroll via Bank')}
                        </h3>
                        <p className="text-xs text-neutral-500 mb-4">
                            Select bank asset account to clear the accrued payroll liability ({parseFloat(payrollRun.total_net).toLocaleString(undefined, { minimumFractionDigits: 2 })}).
                        </p>
                        <form onSubmit={handleDisburse} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Disbursing Bank Account *
                                </label>
                                <select
                                    value={selectedBankId}
                                    onChange={(e) => setSelectedBankId(e.target.value)}
                                    className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                                >
                                    {bankAccounts.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.code} - {isRtl && b.name_ar ? b.name_ar : b.name} (Balance: {parseFloat(b.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowDisburseModal(false)}>
                                    {t('common.cancel', 'Cancel')}
                                </Button>
                                <Button type="submit" disabled={isDisbursing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {isDisbursing ? t('common.loading', 'Processing...') : 'Confirm & Disburse'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
