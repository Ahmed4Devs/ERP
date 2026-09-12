import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Truck, CheckCircle2, FileText, ArrowRightLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface PurchaseOrder {
    id: string;
    po_number: string;
}

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
    unit?: {
        code: string;
    };
}

interface ReceiptLine {
    id: string;
    product: Product;
    description: string;
    quantity: string;
    unit_cost: string;
    line_total: string;
}

interface JournalLine {
    id: string;
    debit: string;
    credit: string;
    description: string;
    account: {
        code: string;
        name: string;
    };
}

interface JournalEntry {
    id: string;
    entry_number: string;
    date: string;
    lines: JournalLine[];
}

interface GoodsReceipt {
    id: string;
    receipt_number: string;
    date: string;
    status: string;
    total_cost: string;
    notes?: string;
    warehouse: Warehouse;
    party: Party;
    purchase_order?: PurchaseOrder;
    lines: ReceiptLine[];
    journal_entry?: JournalEntry;
}

interface Props {
    receipt: GoodsReceipt;
}

export default function GoodsReceiptShow({ receipt }: Props) {
    const { t, isRtl } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={`${t('inventory.receiptNumber')}: ${receipt.receipt_number}`} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/inventory/receipts">
                            <BackIcon className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-neutral-100">
                                {receipt.receipt_number}
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="capitalize">{receipt.status}</span>
                            </span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {receipt.date} • {isRtl && receipt.party?.name_ar ? receipt.party.name_ar : receipt.party?.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="gap-2">
                        <a href={`/inventory/receipts/${receipt.id}/print`} target="_blank" rel="noopener noreferrer">
                            <Printer className="h-4 w-4" />
                            <span>{isRtl ? 'طباعة سند الاستلام / PDF' : 'Print GRN / PDF'}</span>
                        </a>
                    </Button>
                </div>
            </div>

            {/* Receipt Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-400">{t('inventory.destinationWarehouse')}</span>
                    <p className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                        {receipt.warehouse?.name}
                    </p>
                    <span className="font-mono text-xs text-neutral-500">{receipt.warehouse?.code}</span>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-400">{t('inventory.purchaseOrder')}</span>
                    <p className="text-base font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                        {receipt.purchase_order ? receipt.purchase_order.po_number : 'Direct (No PO)'}
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-400">Total Receipt Valuation</span>
                    <p className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                        {Number(receipt.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </p>
                </div>
            </div>

            {/* Received Items Table */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col gap-4">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-indigo-600" />
                    <span>Received Items</span>
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-neutral-50/80 dark:bg-neutral-800/50 text-xs uppercase font-medium text-neutral-500">
                            <tr>
                                <th className="px-4 py-3 text-start">{t('inventory.sku')}</th>
                                <th className="px-4 py-3 text-start">{t('inventory.productName')}</th>
                                <th className="px-4 py-3 text-end">{t('inventory.receivedQty')}</th>
                                <th className="px-4 py-3 text-end">{t('inventory.unitCost')} (SAR)</th>
                                <th className="px-4 py-3 text-end">{t('inventory.totalValue')} (SAR)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {receipt.lines.map((l) => (
                                <tr key={l.id}>
                                    <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {l.product?.sku}
                                    </td>
                                    <td className="px-4 py-3 text-neutral-800 dark:text-neutral-200">
                                        {isRtl && l.product?.name_ar ? l.product.name_ar : l.product?.name}
                                    </td>
                                    <td className="px-4 py-3 text-end font-mono font-semibold">
                                        {Number(l.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })} {l.product?.unit?.code}
                                    </td>
                                    <td className="px-4 py-3 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                        {Number(l.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                    </td>
                                    <td className="px-4 py-3 text-end font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                        {Number(l.line_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* General Ledger Balancing Journal Entry */}
            {receipt.journal_entry && (
                <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span>Linked General Ledger Journal Entry (GRNI Clearing)</span>
                        </h2>
                        <span className="font-mono text-xs text-neutral-500">
                            Entry: {receipt.journal_entry.entry_number}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50/80 dark:bg-neutral-800/50 text-xs uppercase font-medium text-neutral-500">
                                <tr>
                                    <th className="px-4 py-3 text-start">Account Code</th>
                                    <th className="px-4 py-3 text-start">Account Name</th>
                                    <th className="px-4 py-3 text-start">Description</th>
                                    <th className="px-4 py-3 text-end">Debit (DR)</th>
                                    <th className="px-4 py-3 text-end">Credit (CR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                                {receipt.journal_entry.lines.map((jl) => (
                                    <tr key={jl.id}>
                                        <td className="px-4 py-3 font-bold text-neutral-900 dark:text-neutral-100">
                                            {jl.account?.code}
                                        </td>
                                        <td className="px-4 py-3 font-sans text-neutral-800 dark:text-neutral-200">
                                            {jl.account?.name}
                                        </td>
                                        <td className="px-4 py-3 font-sans text-xs text-neutral-500">
                                            {jl.description}
                                        </td>
                                        <td className="px-4 py-3 text-end font-bold text-emerald-600 dark:text-emerald-400">
                                            {parseFloat(jl.debit) > 0 ? Number(jl.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-end font-bold text-blue-600 dark:text-blue-400">
                                            {parseFloat(jl.credit) > 0 ? Number(jl.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
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
