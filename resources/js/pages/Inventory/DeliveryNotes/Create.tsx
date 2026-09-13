import { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, PackageCheck, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Customer {
    id: string;
    name: string;
    name_ar?: string;
    phone?: string;
    address?: string;
}

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
}

interface SalesOrderLine {
    id: string;
    product_id?: string;
    description: string;
    quantity: string;
    product?: Product;
}

interface SalesOrder {
    id: string;
    order_number: string;
    customer_id: string;
    customer: Customer;
    lines: SalesOrderLine[];
}

interface Props {
    warehouses: Warehouse[];
    customers: Customer[];
    products: Product[];
    salesOrders: SalesOrder[];
    selectedSalesOrderId?: string;
}

export default function DeliveryNotesCreate({
    warehouses,
    customers,
    products,
    salesOrders,
    selectedSalesOrderId,
}: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        warehouse_id: warehouses[0]?.id || '',
        customer_id: '',
        sales_order_id: selectedSalesOrderId || '',
        date: new Date().toISOString().split('T')[0],
        driver_name: '',
        vehicle_plate: '',
        tracking_number: '',
        recipient_name: '',
        recipient_phone: '',
        shipping_address: '',
        notes: '',
        lines: [
            {
                product_id: '',
                sales_order_line_id: '',
                description: '',
                quantity: '1',
            },
        ],
    });

    // When sales order changes, automatically populate customer and line items
    const handleSalesOrderSelect = (soId: string) => {
        setData((prev) => {
            if (!soId) {
                return { ...prev, sales_order_id: '' };
            }

            const so = salesOrders.find((o) => o.id === soId);
            if (!so) {
                return { ...prev, sales_order_id: soId };
            }

            const newLines = so.lines
                .filter((l) => l.product_id)
                .map((l) => ({
                    product_id: l.product_id || '',
                    sales_order_line_id: l.id,
                    description: l.description,
                    quantity: String(parseFloat(l.quantity) || 1),
                }));

            return {
                ...prev,
                sales_order_id: soId,
                customer_id: so.customer_id,
                shipping_address: so.customer.address || prev.shipping_address,
                recipient_phone: so.customer.phone || prev.recipient_phone,
                lines: newLines.length > 0 ? newLines : prev.lines,
            };
        });
    };

    useEffect(() => {
        if (selectedSalesOrderId) {
            handleSalesOrderSelect(selectedSalesOrderId);
        }
    }, [selectedSalesOrderId]);

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            {
                product_id: '',
                sales_order_line_id: '',
                description: '',
                quantity: '1',
            },
        ]);
    };

    const removeLine = (index: number) => {
        if (data.lines.length <= 1) return;
        const newLines = [...data.lines];
        newLines.splice(index, 1);
        setData('lines', newLines);
    };

    const updateLine = (index: number, field: string, value: any) => {
        const newLines = [...data.lines];
        newLines[index] = { ...newLines[index], [field]: value };

        // If product selected, auto-fill description
        if (field === 'product_id') {
            const prod = products.find((p) => p.id === value);
            if (prod && !newLines[index].description) {
                newLines[index].description = isRtl && prod.name_ar ? prod.name_ar : prod.name;
            }
        }

        setData('lines', newLines);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/delivery-notes');
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={isRtl ? 'إنشاء سند تسليم وإخراج بضاعة' : 'Create Goods Delivery Note'} />

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/inventory/delivery-notes">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <PackageCheck className="h-6 w-6 text-indigo-600" />
                        <span>{isRtl ? 'إنشاء سند تسليم وإخراج بضاعة جديد' : 'New Goods Delivery Note'}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إصدار سند إخراج وتسليم البضاعة من المستودع وخصم الكميات من المخزون فورياً'
                            : 'Dispatch goods from warehouse, relieving physical stock and linking with sales order'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Info Card */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        {isRtl ? 'البيانات الأساسية للمستند' : 'General Information'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Sales Order Reference */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                                <ShoppingBag className="h-3.5 w-3.5 text-indigo-600" />
                                <span>{isRtl ? 'أمر البيع المرتبط (اختياري)' : 'Linked Sales Order (Optional)'}</span>
                            </label>
                            <select
                                value={data.sales_order_id}
                                onChange={(e) => handleSalesOrderSelect(e.target.value)}
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- تسليم مباشر بدون أمر بيع --' : '-- Direct Delivery (No Order) --'}</option>
                                {salesOrders.map((so) => (
                                    <option key={so.id} value={so.id}>
                                        {so.order_number} - {isRtl && so.customer?.name_ar ? so.customer.name_ar : so.customer?.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Customer */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'العميل المستلم *' : 'Customer Party *'}
                            </label>
                            <select
                                value={data.customer_id}
                                onChange={(e) => setData('customer_id', e.target.value)}
                                required
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- اختر العميل --' : '-- Select Customer --'}</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {isRtl && c.name_ar ? c.name_ar : c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.customer_id && <p className="text-xs text-red-600 mt-1">{errors.customer_id}</p>}
                        </div>

                        {/* Source Warehouse */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'المستودع المصدر *' : 'Source Warehouse *'}
                            </label>
                            <select
                                value={data.warehouse_id}
                                onChange={(e) => setData('warehouse_id', e.target.value)}
                                required
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- اختر المستودع --' : '-- Select Warehouse --'}</option>
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.code} - {w.name}
                                    </option>
                                ))}
                            </select>
                            {errors.warehouse_id && <p className="text-xs text-red-600 mt-1">{errors.warehouse_id}</p>}
                        </div>

                        {/* Delivery Date */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'تاريخ التسليم *' : 'Delivery Date *'}
                            </label>
                            <Input
                                type="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                required
                            />
                            {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
                        </div>

                        {/* Driver Name */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'اسم السائق' : 'Driver Name'}
                            </label>
                            <Input
                                placeholder={isRtl ? 'مثال: محمد عبدالله' : 'e.g. John Doe'}
                                value={data.driver_name}
                                onChange={(e) => setData('driver_name', e.target.value)}
                            />
                        </div>

                        {/* Vehicle Plate */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'رقم لوحة المركبة' : 'Vehicle Plate #'}
                            </label>
                            <Input
                                placeholder={isRtl ? 'مثال: أ ب ج 1234' : 'e.g. ABC 1234'}
                                value={data.vehicle_plate}
                                onChange={(e) => setData('vehicle_plate', e.target.value)}
                            />
                        </div>

                        {/* Recipient Name */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'اسم المستلم في الموقع' : 'Recipient Person'}
                            </label>
                            <Input
                                placeholder={isRtl ? 'الشخص المستلم' : 'Receiver name'}
                                value={data.recipient_name}
                                onChange={(e) => setData('recipient_name', e.target.value)}
                            />
                        </div>

                        {/* Recipient Phone */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'هاتف المستلم' : 'Recipient Phone'}
                            </label>
                            <Input
                                placeholder={isRtl ? '05XXXXXXXX' : 'Phone number'}
                                value={data.recipient_phone}
                                onChange={(e) => setData('recipient_phone', e.target.value)}
                            />
                        </div>

                        {/* Tracking # */}
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'رقم التتبع / البوليصة' : 'Tracking / Waybill #'}
                            </label>
                            <Input
                                placeholder={isRtl ? 'رقم الشحنة' : 'Waybill number'}
                                value={data.tracking_number}
                                onChange={(e) => setData('tracking_number', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Shipping Address & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'عنوان وموقع التسليم' : 'Shipping / Delivery Address'}
                            </label>
                            <textarea
                                value={data.shipping_address}
                                onChange={(e) => setData('shipping_address', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                placeholder={isRtl ? 'المدينة، الحي، اسم الشارع، رقم المبنى...' : 'Street address, city, site notes...'}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'ملاحظات إضافية' : 'Internal Notes'}
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={2}
                                className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                placeholder={isRtl ? 'أي تعليمات خاصة بالسائق أو التخزين...' : 'Special handling notes...'}
                            />
                        </div>
                    </div>
                </div>

                {/* Items Card */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {isRtl ? 'الأصناف المراد تسليمها وإخراجها' : 'Delivery Item Lines'}
                        </h2>
                        <Button type="button" onClick={addLine} variant="outline" size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            <span>{isRtl ? 'إضافة سطر صنف' : 'Add Item'}</span>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-800 text-neutral-500 text-xs">
                                    <th className="py-2 text-start w-1/3">{isRtl ? 'المنتج / الصنف *' : 'Product *'}</th>
                                    <th className="py-2 text-start">{isRtl ? 'الوصف والبيان' : 'Description'}</th>
                                    <th className="py-2 text-start w-32">{isRtl ? 'الكمية المسلمة *' : 'Quantity *'}</th>
                                    <th className="py-2 text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {data.lines.map((line, index) => (
                                    <tr key={index}>
                                        <td className="py-2 pe-2">
                                            <select
                                                value={line.product_id}
                                                onChange={(e) => updateLine(index, 'product_id', e.target.value)}
                                                required
                                                className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                            >
                                                <option value="">{isRtl ? '-- اختر الصنف --' : '-- Select Product --'}</option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.sku} - {isRtl && p.name_ar ? p.name_ar : p.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-2 px-2">
                                            <Input
                                                value={line.description}
                                                onChange={(e) => updateLine(index, 'description', e.target.value)}
                                                placeholder={isRtl ? 'وصف الصنف' : 'Description'}
                                                className="h-9"
                                            />
                                        </td>
                                        <td className="py-2 px-2">
                                            <Input
                                                type="number"
                                                step="any"
                                                min="0.000001"
                                                value={line.quantity}
                                                onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                                                required
                                                className="h-9 font-mono font-bold"
                                            />
                                        </td>
                                        <td className="py-2 text-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                disabled={data.lines.length <= 1}
                                                onClick={() => removeLine(index)}
                                                className="h-8 w-8 text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/inventory/delivery-notes">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-32 shadow-sm"
                    >
                        {processing
                            ? (isRtl ? 'جاري الإصدار والخصم...' : 'Processing...')
                            : (isRtl ? 'إصدار سند التسليم وخصم المخزون' : 'Post & Dispatch Delivery')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
