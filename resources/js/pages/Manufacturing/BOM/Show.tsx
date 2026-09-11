import { Head, Link } from '@inertiajs/react';
import { Factory, ArrowLeft, Layers, Plus, Cpu, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface BomItem {
    id: string;
    product: {
        id: string;
        name: string;
        name_ar?: string;
        sku: string;
        unit?: { code: string };
    };
    quantity: string;
    scrap_percentage: string;
    notes?: string;
}

interface ProductionOrder {
    id: string;
    order_number: string;
    target_quantity: string;
    produced_quantity: string;
    status: string;
    start_date: string;
}

interface BillOfMaterial {
    id: string;
    bom_code: string;
    product: {
        name: string;
        name_ar?: string;
        sku: string;
        unit?: { code: string };
    };
    yield_quantity: string;
    version: string;
    is_active: boolean;
    notes?: string;
    items: BomItem[];
    production_orders?: ProductionOrder[];
}

interface Props {
    bom: BillOfMaterial;
}

export default function BomShow({ bom }: Props) {
    const { t, isRtl } = useTranslation();

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={`BOM - ${bom.bom_code}`} />

            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                        <Link href="/manufacturing/boms">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                                {bom.bom_code}
                            </h1>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                                {bom.version}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                bom.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                                {bom.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {isRtl && bom.product.name_ar ? bom.product.name_ar : bom.product.name} ({bom.product.sku})
                        </p>
                    </div>
                </div>

                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/manufacturing/orders/create">
                        <Cpu className="h-4 w-4" />
                        <span>{isRtl ? 'إطلاق أمر إنتاج' : 'Launch Production Order'}</span>
                    </Link>
                </Button>
            </div>

            {/* BOM Specification Card */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2 border-b pb-3">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    {isRtl ? 'مكونات هيكل التجميع (Bill of Materials Components)' : 'Assembly Components Tree'}
                    <span className="text-xs font-normal text-neutral-500">
                        (Yield: {Number(bom.yield_quantity)} {bom.product.unit?.code || 'Units'})
                    </span>
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="pb-3 text-start">{isRtl ? 'المكون / القطعة' : 'Component Item'}</th>
                                <th className="pb-3 text-start">{isRtl ? 'رمز الصنف (SKU)' : 'SKU'}</th>
                                <th className="pb-3 text-center font-mono">{isRtl ? 'الكمية المطلوبة' : 'Required Qty'}</th>
                                <th className="pb-3 text-center font-mono">{isRtl ? 'نسبة الهدر' : 'Scrap %'}</th>
                                <th className="pb-3 text-start">{isRtl ? 'ملاحظات' : 'Notes'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {bom.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                        {isRtl && item.product.name_ar ? item.product.name_ar : item.product.name}
                                    </td>
                                    <td className="py-3 font-mono text-xs text-neutral-500">
                                        {item.product.sku}
                                    </td>
                                    <td className="py-3 text-center font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(item.quantity)} {item.product.unit?.code || ''}
                                    </td>
                                    <td className="py-3 text-center font-mono text-neutral-500">
                                        {Number(item.scrap_percentage)}%
                                    </td>
                                    <td className="py-3 text-xs text-neutral-500">
                                        {item.notes || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {bom.notes && (
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-600 dark:text-neutral-400 mt-3">
                        <span className="font-bold">{isRtl ? 'تعليمات:' : 'Notes:'}</span> {bom.notes}
                    </div>
                )}
            </div>

            {/* Launched Production Orders */}
            {bom.production_orders && bom.production_orders.length > 0 && (
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2 mb-4">
                        <Cpu className="h-5 w-5 text-indigo-600" />
                        {isRtl ? 'أوامر الإنتاج المرتبطة' : 'Linked Production Orders'}
                    </h3>

                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {bom.production_orders.map((po) => (
                            <div key={po.id} className="py-3 flex items-center justify-between text-sm">
                                <div>
                                    <Link href={`/manufacturing/orders/${po.id}`} className="font-mono font-bold text-indigo-600 hover:underline">
                                        {po.order_number}
                                    </Link>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        Target: {Number(po.target_quantity)} units &bull; Produced: {Number(po.produced_quantity)}
                                    </p>
                                </div>
                                <span className="capitalize text-xs px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium">
                                    {po.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
