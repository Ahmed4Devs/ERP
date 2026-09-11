import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, FileText, CheckCircle2, ShieldCheck, Printer, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
}

interface VendorProfile {
    id: string;
    party: Party;
}

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface BillLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
}

interface JournalLine {
    id: string;
    account: Account;
    debit: string;
    credit: string;
    description?: string;
}

interface JournalEntry {
    id: string;
    entry_number: string;
    date: string;
    description?: string;
    lines: JournalLine[];
}

interface VendorPayment {
    id: string;
    payment_number: string;
    payment_date: string;
    payment_method: string;
    amount: string;
}

interface Allocation {
    id: string;
    allocated_amount: string;
    created_at: string;
    vendor_payment?: VendorPayment;
}

interface PurchaseOrder {
    id: string;
    order_number: string;
}

interface VendorBill {
    id: string;
    bill_number: string;
    vendor_bill_number?: string;
    vendor: VendorProfile;
    expense_account?: Account;
    purchase_order?: PurchaseOrder;
    bill_date: string;
    due_date: string;
    subtotal: string;
    tax_rate: string;
    tax_amount: string;
    total: string;
    amount_paid: string;
    balance_due: string;
    status: 'draft' | 'posted' | 'partially_paid' | 'paid' | 'cancelled';
    notes?: string;
    lines: BillLine[];
    journal_entry?: JournalEntry;
    allocations: Allocation[];
}

interface Props {
    bill: VendorBill;
}

export default function VendorBillsShow({ bill }: Props) {
    const { t, isRtl } = useTranslation();

    const statusBadge = (status: VendorBill['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
            case 'posted':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-900';
            case 'partially_paid':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-900';
            case 'paid':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900';
            case 'cancelled':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-900';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${t('vendorBills.title')} - ${bill.bill_number}`} />

            {/* Back link & actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" size="icon" className="rounded-full">
                        <Link href="/vendor-bills">
                            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
                                {bill.bill_number}
                            </h1>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(bill.status)}`}>
                                {t(`vendorBills.${bill.status === 'partially_paid' ? 'partiallyPaid' : bill.status}`, bill.status)}
                            </span>
                        </div>
                        <p className="text-sm text-neutral-500">
                            {bill.vendor_bill_number ? `Vendor Ref: ${bill.vendor_bill_number}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة' : 'Print'}</span>
                    </Button>

                    {parseFloat(bill.balance_due) > 0 && (
                        <Button asChild className="gap-1.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800">
                            <Link href="/vendor-payments">
                                <CreditCard className="h-4 w-4" />
                                <span>{t('vendorPayments.newPayment')}</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Printable Bill Sheet */}
            <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                {/* Header info */}
                <div className="grid gap-6 sm:grid-cols-2 pb-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                            {t('vendorBills.vendor')}
                        </p>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            {isRtl && bill.vendor.party.name_ar ? bill.vendor.party.name_ar : bill.vendor.party.name}
                        </h2>
                        {bill.vendor.party.tax_id && (
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                                {t('customers.taxId')}: <span className="font-mono">{bill.vendor.party.tax_id}</span>
                            </p>
                        )}
                        {bill.vendor.party.email && (
                            <p className="text-sm text-neutral-500">{bill.vendor.party.email}</p>
                        )}
                    </div>

                    <div className="sm:text-end space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                        <p>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{t('vendorBills.billDate')}:</span>{' '}
                            <span className="font-mono">{bill.bill_date}</span>
                        </p>
                        <p>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{t('vendorBills.dueDate')}:</span>{' '}
                            <span className="font-mono">{bill.due_date}</span>
                        </p>
                        {bill.purchase_order && (
                            <p>
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">{t('vendorBills.poNumber')}:</span>{' '}
                                <Link href={`/purchase-orders/${bill.purchase_order.id}`} className="font-mono text-blue-600 hover:underline">
                                    {bill.purchase_order.order_number}
                                </Link>
                            </p>
                        )}
                    </div>
                </div>

                {/* Items Table */}
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs font-semibold uppercase">
                            <tr>
                                <th className="py-3 text-start">#</th>
                                <th className="py-3 text-start">{t('purchaseOrders.itemDescription')}</th>
                                <th className="py-3 text-center">{t('purchaseOrders.quantity')}</th>
                                <th className="py-3 text-end">{t('purchaseOrders.unitPrice')}</th>
                                <th className="py-3 text-end">{t('purchaseOrders.lineTotal')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {bill.lines.map((line, idx) => (
                                <tr key={line.id}>
                                    <td className="py-3 text-neutral-400 font-mono text-xs">{idx + 1}</td>
                                    <td className="py-3 font-medium text-neutral-900 dark:text-neutral-100">{line.description}</td>
                                    <td className="py-3 text-center font-mono">{Number(line.quantity).toFixed(2)}</td>
                                    <td className="py-3 text-end font-mono">
                                        {Number(line.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </td>
                                    <td className="py-3 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                        {Number(line.line_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Breakdown */}
                <div className="mt-8 border-t border-neutral-200 dark:border-neutral-800 pt-4 flex flex-col items-end gap-2 text-sm">
                    <div className="flex justify-between w-72 text-neutral-600 dark:text-neutral-400">
                        <span>{t('vendorBills.subtotal')}:</span>
                        <span className="font-mono font-medium">
                            {Number(bill.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </span>
                    </div>
                    <div className="flex justify-between w-72 text-neutral-600 dark:text-neutral-400">
                        <span>{t('vendorBills.taxAmount')}:</span>
                        <span className="font-mono font-medium">
                            {Number(bill.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </span>
                    </div>
                    <div className="flex justify-between w-72 text-base font-bold text-neutral-900 dark:text-neutral-100 border-t border-neutral-200 dark:border-neutral-800 pt-2">
                        <span>{t('vendorBills.totalAmount')}:</span>
                        <span className="font-mono text-neutral-900 dark:text-white">
                            {Number(bill.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </span>
                    </div>
                    <div className="flex justify-between w-72 text-sm text-emerald-600 dark:text-emerald-400">
                        <span>{t('invoices.amountPaid')}:</span>
                        <span className="font-mono font-semibold">
                            {Number(bill.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </span>
                    </div>
                    <div className="flex justify-between w-72 text-base font-bold text-amber-600 dark:text-amber-400 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                        <span>{t('vendorBills.balanceDue')}:</span>
                        <span className="font-mono">
                            {Number(bill.balance_due).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </span>
                    </div>
                </div>
            </div>

            {/* General Ledger Journal Entry Breakdown */}
            {bill.journal_entry && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-emerald-600" />
                            <span>{t('vendorBills.journalEntry')}</span>
                            <span className="font-mono text-xs text-neutral-400">({bill.journal_entry.entry_number})</span>
                        </h3>
                        <span className="text-xs font-mono text-neutral-500">{bill.journal_entry.date}</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 uppercase">
                                <tr>
                                    <th className="px-4 py-2 text-start">{t('accounting.code')}</th>
                                    <th className="px-4 py-2 text-start">{t('accounting.accountName')}</th>
                                    <th className="px-4 py-2 text-end">{t('reports.debitTotal')}</th>
                                    <th className="px-4 py-2 text-end">{t('reports.creditTotal')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {bill.journal_entry.lines.map((jl) => (
                                    <tr key={jl.id}>
                                        <td className="px-4 py-2.5 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                            {jl.account.code}
                                        </td>
                                        <td className="px-4 py-2.5 text-neutral-700 dark:text-neutral-300">
                                            {isRtl && jl.account.name_ar ? jl.account.name_ar : jl.account.name}
                                        </td>
                                        <td className="px-4 py-2.5 text-end font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {parseFloat(jl.debit) > 0 ? Number(jl.debit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-4 py-2.5 text-end font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {parseFloat(jl.credit) > 0 ? Number(jl.credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment Allocations Table */}
            {bill.allocations && bill.allocations.length > 0 && (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:hidden">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                        <span>{t('vendorPayments.allocations')}</span>
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-2 text-start">{t('vendorPayments.paymentNumber')}</th>
                                    <th className="px-4 py-2 text-start">{t('vendorPayments.paymentDate')}</th>
                                    <th className="px-4 py-2 text-start">{t('vendorPayments.paymentMethod')}</th>
                                    <th className="px-4 py-2 text-end">{t('vendorPayments.allocateAmount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {bill.allocations.map((alloc) => (
                                    <tr key={alloc.id}>
                                        <td className="px-4 py-3 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {alloc.vendor_payment?.payment_number || '-'}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {alloc.vendor_payment?.payment_date || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 capitalize">
                                            {alloc.vendor_payment?.payment_method || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {Number(alloc.allocated_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
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
