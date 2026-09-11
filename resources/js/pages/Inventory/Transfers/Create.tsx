import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Save, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Product {
    id: string;
    sku: string;
    name: string;
    moving_average_cost: string;
    unit?: {
        code: string;
    };
    inventory_levels?: Array<{
        warehouse_id: string;
        quantity_on_hand: string;
        moving_average_cost: string;
    }>;
}

interface Props {
    warehouses: Warehouse[];
    products: Product[];
}

interface TransferFormLine {
    product_id: string;
    quantity: string;
}

export default function StockTransferCreate({ warehouses, products }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        from_warehouse_id: warehouses[0]?.id || '',
        to_warehouse_id: warehouses[1]?.id || '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        lines: [
            {
                product_id: products[0]?.id || '',
                quantity: '1',
            },
        ] as TransferFormLine[],
    });

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            {
                product_id: products[0]?.id || '',
                quantity: '1',
            },
        ]);
    };

    const removeLine = (index: number) => {
        if (data.lines.length === 1) return;
        const newLines = [...data.lines];
        newLines.splice(index, 1);
        setData('lines', newLines);
    };

    const updateLine = (index: number, field: keyof TransferFormLine, value: string) => {
        const newLines = [...data.lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setData('lines', newLines);
    };

    const getAvailableQty = (productId: string, whId: string): string => {
        const prod = products.find((p) => p.id === productId);
        const lvl = prod?.inventory_levels?.find((l) => l.warehouse_id === whId);
        return lvl ? Number(lvl.quantity_on_hand).toFixed(2) : '0.00';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/transfers');
    };

    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={t('inventory.newTransfer')} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/inventory/transfers">
                            <BackIcon className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            {t('inventory.newTransfer')}
                        </h1>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {t('inventory.transfersSubtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col gap-5">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-indigo-600" />
                        <span>Transfer Warehouses & Schedule</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="from_wh">{t('inventory.fromWarehouse')} *</Label>
                            <select
                                id="from_wh"
                                value={data.from_warehouse_id}
                                onChange={(e) => setData('from_warehouse_id', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                required
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                                ))}
                            </select>
                            {errors.from_warehouse_id && <p className="text-xs text-rose-500 mt-1">{errors.from_warehouse_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="to_wh">{t('inventory.toWarehouse')} *</Label>
                            <select
                                id="to_wh"
                                value={data.to_warehouse_id}
                                onChange={(e) => setData('to_warehouse_id', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                required
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.code} - {w.name}</option>
                                ))}
                            </select>
                            {errors.to_warehouse_id && <p className="text-xs text-rose-500 mt-1">{errors.to_warehouse_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="date">{t('inventory.transferDate')} *</Label>
                            <Input
                                id="date"
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className="mt-1.5"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Transfer Items */}
                <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            Transfer Items
                        </h2>
                        <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1">
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add Product</span>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-50/80 dark:bg-neutral-800/50 text-xs uppercase font-medium text-neutral-500">
                                <tr>
                                    <th className="px-3 py-2 text-start w-1/2">{t('inventory.productName')}</th>
                                    <th className="px-3 py-2 text-start">Available in Source</th>
                                    <th className="px-3 py-2 text-start">Quantity to Transfer</th>
                                    <th className="px-3 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {data.lines.map((line, idx) => {
                                    const avail = getAvailableQty(line.product_id, data.from_warehouse_id);
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
                                                            {p.sku} - {p.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-3 py-2 font-mono text-xs text-neutral-500">
                                                <span className="font-bold text-neutral-900 dark:text-neutral-100">{avail}</span> units
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
                        </table>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/inventory/transfers">{t('common.cancel')}</Link>
                    </Button>
                    <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Save className="h-4 w-4" />
                        <span>{t('inventory.postTransfer')}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
