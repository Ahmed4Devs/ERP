import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Printer, CheckCircle2, AlertCircle, FileText, Layers, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    code: string;
    name: string;
    name_ar?: string;
}

interface JournalLine {
    id: string;
    debit: string;
    credit: string;
    account: Account;
}

interface JournalEntry {
    entry_number: string;
    date: string;
    description: string;
    status: string;
    lines: JournalLine[];
}

interface InvoiceLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    revenueAccount?: Account;
}

interface Allocation {
    id: string;
    amount: string;
    allocated_at: string;
    receipt?: {
        receipt_number: string;
        date: string;
        payment_method: string;
    };
}

interface Invoice {
    id: string;
    invoice_number: string;
    date: string;
    due_date: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    amount_paid: string;
    balance_due: string;
    status: 'draft' | 'posted' | 'partially_paid' | 'paid' | 'reversed';
    notes?: string;
    party: {
        id: string;
        name: string;
        name_ar?: string;
        tax_id?: string;
        email?: string;
        phone?: string;
    };
    lines: InvoiceLine[];
    journal_entry?: JournalEntry;
    allocations?: Allocation[];
}

interface Props {
    invoice: Invoice;
}

export default function InvoicesShow({ invoice }: Props) {
    const { t, isRtl } = useTranslation();

    const handlePrint = () => {
        window.print();
    };

    const statusBadge = (status: Invoice['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
            case 'posted':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
            case 'partially_paid':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900';
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
            case 'reversed':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${t('invoices.title')} - ${invoice.invoice_number}`} />

            {/* Action Bar (hidden when printing) */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon" className="h-9 w-9">
                        <Link href="/invoices">
                            <BackIcon className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                {invoice.invoice_number}
                            </h1>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(invoice.status)}`}>
                                {t(`invoices.${invoice.status.replace('_', '')}`, invoice.status)}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {t('invoices.date')}: {invoice.date} • {t('invoices.dueDate')}: {invoice.due_date}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="gap-2 border-neutral-300 dark:border-neutral-700"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{t('invoices.printInvoice')}</span>
                    </Button>
                </div>
            </div>

            {/* Printable Invoice Card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:border-none print:shadow-none print:p-0">
                {/* Header: Company & Invoice Info */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-neutral-200 pb-6 dark:border-neutral-800 gap-6">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm dark:bg-white dark:text-neutral-900">
                                ERP
                            </div>
                            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                {t('app.name')}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                            Enterprise Service & Financial Ledger
                        </p>
                    </div>

                    <div className="text-start sm:text-end">
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                            {t('invoices.title')}
                        </h2>
                        <p className="font-mono text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-1">
                            {invoice.invoice_number}
                        </p>
                        <div className="mt-2 text-xs text-neutral-500 space-y-0.5">
                            <div><span className="font-medium">{t('invoices.date')}:</span> {invoice.date}</div>
                            <div><span className="font-medium">{t('invoices.dueDate')}:</span> {invoice.due_date}</div>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                            {t('invoices.customer')}
                        </h3>
                        <p className="text-base font-bold text-neutral-900 dark:text-white">
                            {invoice.party?.name}
                        </p>
                        {invoice.party?.name_ar && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                                {invoice.party?.name_ar}
                            </p>
                        )}
                        {invoice.party?.tax_id && (
                            <p className="text-xs font-mono text-neutral-500 mt-1">
                                {t('customers.taxId')}: {invoice.party.tax_id}
                            </p>
                        )}
                    </div>

                    <div className="sm:text-end text-xs text-neutral-500 space-y-1">
                        {invoice.party?.email && <div>{invoice.party.email}</div>}
                        {invoice.party?.phone && <div className="font-mono">{invoice.party.phone}</div>}
                    </div>
                </div>

                {/* Lines Table */}
                <div className="py-6">
                    <table className="w-full text-sm">
                        <thead className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-800">
                            <tr>
                                <th className="pb-3 text-start font-semibold">{t('invoices.description')}</th>
                                <th className="pb-3 text-start font-semibold">{t('invoices.revenueAccount')}</th>
                                <th className="pb-3 text-center font-semibold">{t('invoices.quantity')}</th>
                                <th className="pb-3 text-end font-semibold">{t('invoices.unitPrice')}</th>
                                <th className="pb-3 text-end font-semibold">{t('invoices.lineTotal')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {invoice.lines.map((line) => (
                                <tr key={line.id}>
                                    <td className="py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                        {line.description}
                                    </td>
                                    <td className="py-3 text-xs text-neutral-500">
                                        {line.revenueAccount ? `${line.revenueAccount.code} - ${line.revenueAccount.name}` : '—'}
                                    </td>
                                    <td className="py-3 text-center font-mono text-xs">
                                        {Number(line.quantity).toLocaleString()}
                                    </td>
                                    <td className="py-3 text-end font-mono text-xs">
                                        {Number(line.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-3 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                        {Number(line.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="w-full sm:max-w-sm space-y-2.5">
                        <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                            <span>{t('invoices.subtotal')}</span>
                            <span className="font-mono font-medium text-neutral-900 dark:text-white">
                                {Number(invoice.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                            <div className="flex items-center gap-1.5">
                                <span>{t('invoices.taxAmount')}</span>
                                <span className="text-xs rounded bg-neutral-100 px-1.5 py-0.2 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                    {(Number(invoice.tax_rate) * 100).toFixed(0)}%
                                </span>
                            </div>
                            <span className="font-mono font-medium text-neutral-900 dark:text-white">
                                {Number(invoice.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 flex justify-between text-base font-bold text-neutral-900 dark:text-white">
                            <span>{t('invoices.total')}</span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                {Number(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400">
                            <span>{t('invoices.amountPaid')}</span>
                            <span className="font-mono text-neutral-900 dark:text-white">
                                {Number(invoice.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>

                        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 flex justify-between text-sm font-bold text-amber-600 dark:text-amber-400">
                            <span>{t('invoices.balanceDue')}</span>
                            <span className="font-mono">
                                {Number(invoice.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Allocations & Payment History (if any) */}
            {invoice.allocations && invoice.allocations.length > 0 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:hidden">
                    <div className="flex items-center gap-2 mb-4">
                        <Banknote className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                            {t('receipts.allocations')}
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="pb-2 text-start font-semibold">{t('receipts.receiptNumber')}</th>
                                    <th className="pb-2 text-start font-semibold">{t('receipts.date')}</th>
                                    <th className="pb-2 text-start font-semibold">{t('receipts.paymentMethod')}</th>
                                    <th className="pb-2 text-end font-semibold">{t('receipts.allocateAmount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {invoice.allocations.map((alloc) => (
                                    <tr key={alloc.id}>
                                        <td className="py-2.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {alloc.receipt?.receipt_number}
                                        </td>
                                        <td className="py-2.5 text-xs text-neutral-500 font-mono">
                                            {alloc.receipt?.date}
                                        </td>
                                        <td className="py-2.5 text-xs capitalize text-neutral-600 dark:text-neutral-400">
                                            {alloc.receipt?.payment_method?.replace('_', ' ')}
                                        </td>
                                        <td className="py-2.5 text-end font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                            {Number(alloc.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* General Ledger Journal Entry Breakdown */}
            {invoice.journal_entry && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            <div>
                                <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                                    {t('invoices.journalBreakdown')}
                                </h2>
                                <p className="text-xs text-neutral-500 font-mono">
                                    {t('invoices.entryNumber')}: {invoice.journal_entry.entry_number} • {invoice.journal_entry.date}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Balanced Entry</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                                <tr>
                                    <th className="px-4 py-2.5 text-start font-semibold">{t('accounting.code')}</th>
                                    <th className="px-4 py-2.5 text-start font-semibold">{t('accounting.accountName')}</th>
                                    <th className="px-4 py-2.5 text-end font-semibold">{t('invoices.debit')}</th>
                                    <th className="px-4 py-2.5 text-end font-semibold">{t('invoices.credit')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {invoice.journal_entry.lines.map((jl) => (
                                    <tr key={jl.id}>
                                        <td className="px-4 py-2.5 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {jl.account.code}
                                        </td>
                                        <td className="px-4 py-2.5 font-medium text-neutral-900 dark:text-neutral-100">
                                            {jl.account.name} {jl.account.name_ar ? `(${jl.account.name_ar})` : ''}
                                        </td>
                                        <td className="px-4 py-2.5 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                            {Number(jl.debit) > 0 ? Number(jl.debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                        </td>
                                        <td className="px-4 py-2.5 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                            {Number(jl.credit) > 0 ? Number(jl.credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
