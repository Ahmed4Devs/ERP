import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Truck,
    ArrowLeft,
    Plus,
    Trash2,
    Calendar,
    Users,
    Car,
    Warehouse,
    MapPin,
    Banknote,
    CheckCircle2,
    Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface Driver {
    id: string;
    name: string;
    name_ar?: string;
    phone: string;
    status: string;
}

interface Vehicle {
    id: string;
    plate_number: string;
    model: string;
    max_weight_capacity_kg: string;
}

interface WarehouseItem {
    id: string;
    name: string;
}

interface PendingDelivery {
    id: string;
    delivery_number: string;
    date: string;
    customer: {
        id: string;
        name: string;
        name_ar?: string;
        phone?: string;
        address?: any;
    };
    total_cost: string;
}

interface Props {
    drivers: Driver[];
    vehicles: Vehicle[];
    warehouses: WarehouseItem[];
    pendingDeliveries: PendingDelivery[];
}

export default function DispatchCreate({
    drivers,
    vehicles,
    warehouses,
    pendingDeliveries,
}: Props) {
    const { t } = useTranslation();

    const form = useForm({
        driver_id: drivers[0]?.id || '',
        vehicle_id: vehicles[0]?.id || '',
        departure_warehouse_id: warehouses[0]?.id || '',
        scheduled_date: new Date().toISOString().split('T')[0],
        route_notes: '',
        stops: [] as Array<{
            customer_id: string;
            delivery_note_id?: string;
            destination_address: string;
            recipient_contact_phone?: string;
            cod_amount_due: string;
            customer_name?: string;
        }>,
    });

    const handleAddPendingDelivery = (delivery: PendingDelivery) => {
        // Prevent duplicate
        if (form.data.stops.some((s) => s.delivery_note_id === delivery.id)) {
            return;
        }

        const addressText = typeof delivery.customer.address === 'object' && delivery.customer.address
            ? Object.values(delivery.customer.address).filter(Boolean).join(', ')
            : 'العنوان المسجل لدى العميل';

        const newStop = {
            customer_id: delivery.customer.id,
            delivery_note_id: delivery.id,
            destination_address: addressText || 'الرياض - عنوان العميل',
            recipient_contact_phone: delivery.customer.phone || '',
            cod_amount_due: '0.00',
            customer_name: delivery.customer.name_ar || delivery.customer.name,
        };

        form.setData('stops', [...form.data.stops, newStop]);
    };

    const handleRemoveStop = (index: number) => {
        form.setData(
            'stops',
            form.data.stops.filter((_, i) => i !== index)
        );
    };

    const handleStopFieldChange = (index: number, field: string, value: any) => {
        const updatedStops = [...form.data.stops];
        updatedStops[index] = { ...updatedStops[index], [field]: value };
        form.setData('stops', updatedStops);
    };

    const totalExpectedCod = form.data.stops.reduce(
        (sum, s) => sum + (parseFloat(s.cod_amount_due || '0') || 0),
        0
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/trade/dispatch');
    };

    return (
        <AppLayout>
            <Head title="جدولة وتسيير رحلة توزيع جديدة" />

            <div className="space-y-6 pb-12 max-w-6xl mx-auto">
                {/* Top Nav */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/trade/dispatch"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        <span>العودة لأسطول النقل ورحلات التوزيع</span>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header Card */}
                    <div className="bg-card p-6 md:p-8 rounded-2xl border shadow-sm space-y-6">
                        <div className="border-b pb-4 space-y-1">
                            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                                <Truck className="w-6 h-6 text-blue-600" />
                                جدولة رحلة توزيع وتعيين السائق والمركبة
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                قم بتحديد مسار الرحلة، ومستودع الانطلاق، وتجميع أذونات التسليم للعملاء.
                            </p>
                        </div>

                        {/* Setup Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground">
                                    السائق المكلف <span className="text-destructive">*</span>
                                </label>
                                <select
                                    value={form.data.driver_id}
                                    onChange={(e) => form.setData('driver_id', e.target.value)}
                                    required
                                    className="w-full bg-background border rounded-lg p-2.5 text-sm"
                                >
                                    <option value="">-- اختر السائق --</option>
                                    {drivers.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name_ar || d.name} ({d.phone})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground">
                                    المركبة واللوحة <span className="text-destructive">*</span>
                                </label>
                                <select
                                    value={form.data.vehicle_id}
                                    onChange={(e) => form.setData('vehicle_id', e.target.value)}
                                    required
                                    className="w-full bg-background border rounded-lg p-2.5 text-sm font-mono"
                                >
                                    <option value="">-- اختر المركبة --</option>
                                    {vehicles.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.plate_number} - {v.model}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground">
                                    مستودع الانطلاق والتحميل
                                </label>
                                <select
                                    value={form.data.departure_warehouse_id}
                                    onChange={(e) => form.setData('departure_warehouse_id', e.target.value)}
                                    className="w-full bg-background border rounded-lg p-2.5 text-sm"
                                >
                                    <option value="">-- اختر المستودع --</option>
                                    {warehouses.map((w) => (
                                        <option key={w.id} value={w.id}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-foreground">
                                    تاريخ وتوقيت الجدولة <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    type="date"
                                    value={form.data.scheduled_date}
                                    onChange={(e) => form.setData('scheduled_date', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-foreground">
                                ملاحظات المسار وتعليمات التسليم للسائق
                            </label>
                            <Input
                                placeholder="مثال: يرجى تسليم محطات شمال الرياض أولاً والالتزام بالاتصال المسبق قبل الوصول."
                                value={form.data.route_notes}
                                onChange={(e) => form.setData('route_notes', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Pending Delivery Notes Selector & Stops Sequence */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Column 1: Available Pending Deliveries */}
                        <div className="bg-card p-5 rounded-2xl border shadow-sm space-y-4">
                            <div className="space-y-1 border-b pb-3">
                                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                    <Warehouse className="w-4 h-4 text-indigo-500" />
                                    أذونات شحن وتوصيل جاهزة ({pendingDeliveries.length})
                                </h3>
                                <p className="text-[11px] text-muted-foreground">
                                    انقر على الإذن لإضافته فوراً إلى مسار الرحلة الحالي.
                                </p>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {pendingDeliveries.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-6">
                                        لا توجد أذونات تسليم معلقة حالياً
                                    </p>
                                ) : (
                                    pendingDeliveries.map((del) => {
                                        const isSelected = form.data.stops.some(
                                            (s) => s.delivery_note_id === del.id
                                        );

                                        return (
                                            <div
                                                key={del.id}
                                                className={`p-3 rounded-xl border text-xs space-y-1 transition cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 opacity-60'
                                                        : 'hover:bg-muted/50'
                                                }`}
                                                onClick={() => !isSelected && handleAddPendingDelivery(del)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold font-mono text-foreground">
                                                        {del.delivery_number}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                        {del.date}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-foreground">
                                                    {del.customer.name_ar || del.customer.name}
                                                </p>
                                                <div className="flex justify-between items-center pt-1 text-[11px] text-muted-foreground">
                                                    <span>{del.customer.phone || 'بدون هاتف'}</span>
                                                    {isSelected ? (
                                                        <span className="text-blue-600 font-bold">تمت الإضافة ✓</span>
                                                    ) : (
                                                        <span className="text-primary hover:underline font-medium">
                                                            + إضافة للمسار
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Column 2: Selected Trip Stops Manifest */}
                        <div className="lg:col-span-2 bg-card p-5 rounded-2xl border shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b pb-3">
                                <div className="space-y-0.5">
                                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-500" />
                                        مسار ومحطات التوصيل المجدولة ({form.data.stops.length} محطات)
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground">
                                        تسلسل المحطات وفق خط سير السائق وإدخال مبالغ الدفع عند الاستلام (COD).
                                    </p>
                                </div>

                                <div className="text-left font-mono">
                                    <span className="text-[11px] text-muted-foreground">إجمالي الـ COD المتوقع:</span>
                                    <p className="text-base font-bold text-emerald-600">
                                        {totalExpectedCod.toFixed(2)} ر.س
                                    </p>
                                </div>
                            </div>

                            {form.data.stops.length === 0 ? (
                                <div className="py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                                    <Truck className="w-8 h-8 opacity-40" />
                                    <p>لم يتم تحديد أي محطات تسليم بعد. اختر من القائمة على اليمين.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {form.data.stops.map((stop, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 bg-muted/30 rounded-xl border flex flex-col md:flex-row gap-3 items-start md:items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3 w-full md:w-auto">
                                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
                                                    {idx + 1}
                                                </span>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-sm text-foreground">
                                                        {stop.customer_name || 'عميل'}
                                                    </p>
                                                    <Input
                                                        placeholder="عنوان التسليم بالتفصيل..."
                                                        value={stop.destination_address}
                                                        onChange={(e) =>
                                                            handleStopFieldChange(
                                                                idx,
                                                                'destination_address',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="text-xs h-8 w-64 md:w-80"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-muted-foreground font-semibold">
                                                        المبلغ للدفع عند الاستلام (ر.س)
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={stop.cod_amount_due}
                                                        onChange={(e) =>
                                                            handleStopFieldChange(
                                                                idx,
                                                                'cod_amount_due',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="text-xs h-8 w-28 font-mono"
                                                    />
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveStop(idx)}
                                                    className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 mt-4"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Link href="/trade/dispatch">
                                    <Button type="button" variant="outline">
                                        إلغاء
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={form.processing || form.data.stops.length === 0}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-900/20"
                                >
                                    اعتماد وجدولة الرحلة ({form.data.stops.length} محطات)
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
