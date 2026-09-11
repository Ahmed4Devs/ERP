import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, Truck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Vendor {
    id: string;
    name: string;
    name_ar?: string;
}

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
    standard_cost: string;
    moving_average_cost: string;
}

interface POLine {
    id: string;
    product_id?: string;
    description: string;
    quantity: string;
    unit_price: string;
}

interface PurchaseOrder {
    id: string;
    po_number: string;
    party_id: string;
    lines: POLine[];
}

interface Props {
    warehouses: Warehouse[];
    vendors: Vendor[];
    products: Product[];
    purchaseOrders: PurchaseOrder[];
    selectedPoId?: string;
}

interface FormLine {
    product_id: string;
    purchase_order_line_id?: string;
    description: string;
    quantity: string;
    unit_cost: string;
}

export default function GoodsReceiptCreate({
    warehouses,
    vendors,
    products,
    purchaseOrders,
    selectedPoId,
}: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        warehouse_id: warehouses[0]?.id || '',
        party_id: vendors[0]?.id || '',
        purchase_order_id: selectedPoId || '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        lines: [
            {
                product_id: products[0]?.id || '',
                purchase_order_line_id: '',
                description: products[0]?.name || '',
                quantity: '1',
                unit_cost: products[0]?.standard_cost || '0',
            },
        ] as FormLine[],
    });

    // Auto-fill lines if a Purchase Order is selected
    const handlePoChange = (poId: string) => {
        setData('purchase_order_id', poId);
        if (!poId) return;

        const po = purchaseOrders.find((p) => p.id === poId);
        if (po) {
            setData('party_id', po.party_id);
            if (po.lines && po.lines.length > 0) {
                const newLines: FormLine[] = po.lines.map((l) => {
                    const matchedProd = products.find((p) => p.id === l.product_id) || products[0];
                    return {
                        product_id: matchedProd?.id || '',
                        purchase_order_line_id: l.id,
                        description: l.description,
                        quantity: l.quantity,
                        unit_cost: l.unit_price,
                    };
                });
                setData('lines', newLines);
            }
        }
    };

    const addLine = () => {
        const defaultProd = products[0];
        setData('lines', [
            ...data.lines,
            {
                product_id: defaultProd?.id || '',
                purchase_order_line_id: '',
                description: defaultProd?.name || '',
                quantity: '1',
                unit_cost: defaultProd?.standard_cost || '0',
            },
        ]);
    };

    const removeLine = (index: number) => {
        if (data.lines.length === 1) return;
        const newLines = [...data.lines];
        newLines.splice(index, 1);
        setData('lines', newLines);
    };

    const updateLine = (index: number, field: keyof FormLine, value: string) => {
        const newLines = [...data.lines];
        newLines[index] = { ...newLines[index], [field]: value };

        if (field === 'product_id') {
            const prod = products.find((p) => p.id === value);
            if (prod) {
                newLines[index].description = prod.name;
                newLines[index].unit_cost = prod.standard_cost;
            }
        }

        setData('lines', newLines);
    };

    const totalCost = data.lines.reduce((acc, l) => {
        const q = parseFloat(l.quantity || '0');
        const c = parseFloat(l.unit_cost || '0');
        return acc + q * c;
    }, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/receipts');
    };

    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={t('inventory.newReceipt')} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/inventory/receipts">
                            <BackIcon className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            {t('inventory.newReceipt')}
                        </h1>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {t('inventory.goodsReceiptsSubtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Header Fields */}
                <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col gap-5">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-indigo-600" />
                        <span>Receipt Header Information</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="warehouse_id">{t('inventory.destinationWarehouse')} *</Label>
                            <select
                                id="warehouse_id"
                                value={data.warehouse_id}
                                onChange={(e) => setData('warehouse_id', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                required
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                                ))}
                            </select>
                            {errors.warehouse_id && <p className="text-xs text-rose-500 mt-1">{errors.warehouse_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="party_id">{t('inventory.vendor')} *</Label>
                            <select
                                id="party_id"
                                value={data.party_id}
                                onChange={(e) => setData('party_id', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                required
                            >
                                {vendors.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {isRtl && v.name_ar ? v.name_ar : v.name}
                                    </option>
                                ))}
                            </select>
                            {errors.party_id && <p className="text-xs text-rose-500 mt-1">{errors.party_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="po_id">{t('inventory.purchaseOrder')}</Label>
                            <select
                                id="po_id"
                                value={data.purchase_order_id}
                                onChange={(e) => handlePoChange(e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">Direct Receipt (No PO)</option>
                                {purchaseOrders.map((po) => (
                                    <option key={po.id} value={po.id}>{po.po_number}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="receipt_date">{t('inventory.receiptDate')} *</Label>
                            <Input
                                id="receipt_date"
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className="mt-1.5"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Package className="h-4 w-4 text-indigo-600" />
                            <span>Received Items & Valuation</span>
                        </h2>
                        <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Item</span>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50/80 dark:bg-neutral-800/50 text-xs uppercase font-medium text-neutral-500">
                                <tr>
                                    <th className="px-3 py-2 text-start w-1/3">{t('inventory.productName')}</th>
                                    <th className="px-3 py-2 text-start">{t('inventory.receivedQty')}</th>
                                    <th className="px-3 py-2 text-start">{t('inventory.unitCost')} (SAR)</th>
                                    <th className="px-3 py-2 text-end">{t('inventory.totalValue')} (SAR)</th>
                                    <th className="px-3 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {data.lines.map((line, idx) => {
                                    const lTotal = (parseFloat(line.quantity || '0') * parseFloat(line.unit_cost || '0')).toFixed(2);
                                    return (
                                        <tr key={idx}>
                                            <td className="px-3 py-2">
                                                <select
                                                    value={line.product_id}
                                                    onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                                                    className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
                                                    required
                                                >
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.sku} - {isRtl && p.name_ar ? p.name_ar : p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2">
                                                <Input
                                                    type="number"
                                                    step="0.0001"
                                                    min="0.0001"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                                                    className="font-mono"
                                                    required
                                                />
                                            </td>
                                            <td className="px-3 py-2">
                                                <Input
                                                    type="number"
                                                    step="0.0001"
                                                    min="0"
                                                    value={line.unit_cost}
                                                    onChange={(e) => updateLine(idx, 'unit_cost', e.target.value)}
                                                    className="font-mono"
                                                    required
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                                {Number(lTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeLine(idx)}
                                                    className="h-8 w-8 p-0 text-neutral-400 hover:text-rose-600"
                                                    disabled={data.lines.length === 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-neutral-200 dark:border-neutral-800">
                                    <td colSpan={3} className="px-3 py-3 text-end font-bold text-neutral-900 dark:text-neutral-100">
                                        Total Receipt Valuation:
                                    </td>
                                    <td className="px-3 py-3 text-end font-mono font-bold text-lg text-indigo-600 dark:text-indigo-400">
                                        {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Accounting Explanatory Banner */}
                    <div className="rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 p-3.5 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-300">
                        <p className="font-semibold mb-0.5">Automated Double-Entry Accounting on Post:</p>
                        <p>
                            DR <span className="font-mono font-bold">1300 Merchandise Inventory</span> (+{totalCost.toFixed(2)} SAR) |
                            CR <span className="font-mono font-bold">2020 GRNI Clearing</span> (+{totalCost.toFixed(2)} SAR).
                            Weighted-average product cost will be perpetual updated.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/inventory/receipts">{t('common.cancel')}</Link>
                    </Button>
                    <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Save className="h-4 w-4" />
                        <span>{t('inventory.postGrn')}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
