import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Cpu, ArrowLeft, Layers, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Bom {
    id: string;
    bom_code: string;
    yield_quantity: string;
    product: {
        id: string;
        name: string;
        name_ar?: string;
        sku: string;
    };
    items?: any[];
}

interface WarehouseModel {
    id: string;
    name: string;
    code: string;
}

interface Props {
    boms: Bom[];
    warehouses: WarehouseModel[];
}

export default function ProductionOrderCreate({ boms, warehouses }: Props) {
    const { t, isRtl } = useTranslation();

    const [form, setForm] = useState({
        order_number: `MO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        bom_id: boms[0]?.id || '',
        source_warehouse_id: warehouses[0]?.id || '',
        destination_warehouse_id: warehouses[0]?.id || '',
        target_quantity: '5.00',
        start_date: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const selectedBom = boms.find(b => b.id === form.bom_id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/manufacturing/orders', form);
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
            <Head title={isRtl ? 'إطلاق أمر إنتاج وتجميع' : 'Create Production Order'} />

            {/* Header */}
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                    <Link href="/manufacturing/orders">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Cpu className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'إطلاق أمر إنتاج وتجميع جديد' : 'Launch New Production Order'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'اختر هيكل المواد (BOM) والكمية المستهدفة ومستودع صرف المكونات واستلام المنتج'
                            : 'Select bill of materials, planned quantity, source components & destination warehouses'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'رقم أمر الإنتاج (Order #)' : 'Production Order #'}
                            </label>
                            <Input
                                required
                                value={form.order_number}
                                onChange={(e) => setForm({ ...form, order_number: e.target.value })}
                                className="mt-1 font-mono uppercase"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'هيكل قائمة المواد (BOM)' : 'Bill of Materials (BOM)'}
                            </label>
                            <select
                                required
                                className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                value={form.bom_id}
                                onChange={(e) => setForm({ ...form, bom_id: e.target.value })}
                            >
                                {boms.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.bom_code} &bull; {isRtl && b.product.name_ar ? b.product.name_ar : b.product.name} ({b.product.sku})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'مستودع صرف المواد الخام (Source Warehouse)' : 'Source Warehouse (Raw Materials)'}
                            </label>
                            <select
                                required
                                className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                value={form.source_warehouse_id}
                                onChange={(e) => setForm({ ...form, source_warehouse_id: e.target.value })}
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'مستودع استلام المنتج النهائي (Destination)' : 'Destination Warehouse (Finished Good)'}
                            </label>
                            <select
                                required
                                className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                value={form.destination_warehouse_id}
                                onChange={(e) => setForm({ ...form, destination_warehouse_id: e.target.value })}
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'الكمية المستهدفة للإنتاج' : 'Target Quantity'}
                            </label>
                            <Input
                                required
                                type="number"
                                step="any"
                                value={form.target_quantity}
                                onChange={(e) => setForm({ ...form, target_quantity: e.target.value })}
                                className="mt-1 font-mono text-base font-bold text-indigo-600"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'تاريخ البدء المخطط' : 'Planned Start Date'}
                            </label>
                            <Input
                                required
                                type="date"
                                value={form.start_date}
                                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                            {isRtl ? 'ملاحظات أمر التجميع' : 'Order Notes'}
                        </label>
                        <textarea
                            rows={2}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-sm"
                            placeholder={isRtl ? 'ملاحظات الإنتاج...' : 'Production instructions...'}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/manufacturing/orders">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isRtl ? 'إطلاق أمر الإنتاج' : 'Launch Order'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
