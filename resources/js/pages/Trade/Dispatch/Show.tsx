import { useState, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Truck,
    ArrowLeft,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Banknote,
    MapPin,
    Car,
    Users,
    Printer,
    FileCheck,
    Navigation,
    XCircle,
    Shield,
    PenTool,
    RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface Customer {
    id: string;
    name: string;
    name_ar?: string;
    phone?: string;
}

interface Stop {
    id: string;
    stop_sequence: number;
    destination_address: string;
    recipient_contact_phone?: string;
    cod_amount_due: string;
    cod_amount_collected: string;
    cod_payment_method?: string;
    status: 'pending' | 'arrived' | 'delivered' | 'failed' | 'returned';
    delivered_at?: string;
    failure_reason?: string;
    recipient_name?: string;
    recipient_national_id?: string;
    recipient_signature_svg?: string;
    gps_latitude?: number;
    gps_longitude?: number;
    pod_notes?: string;
    customer: Customer;
    delivery_note?: { id: string; delivery_number: string };
}

interface Trip {
    id: string;
    trip_number: string;
    scheduled_date: string;
    dispatched_at?: string;
    completed_at?: string;
    status: 'draft' | 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
    total_deliveries_count: number;
    completed_deliveries_count: number;
    total_cod_expected: string;
    total_cod_collected: string;
    cod_settlement_status: 'pending' | 'settled';
    route_notes?: string;
    driver: {
        name: string;
        name_ar?: string;
        phone: string;
        code: string;
    };
    vehicle: {
        plate_number: string;
        model: string;
        max_weight_capacity_kg: string;
    };
    departure_warehouse?: { name: string };
    stops: Stop[];
    settlement_journal_entry?: {
        id: string;
        entry_number: string;
        lines: Array<{
            debit: string;
            credit: string;
            account: { code: string; name_ar: string; name: string };
        }>;
    };
}

interface Props {
    trip: Trip;
}

export default function DispatchShow({ trip }: Props) {
    const { t } = useTranslation();
    const [selectedStopForPod, setSelectedStopForPod] = useState<Stop | null>(null);
    const [showSettleModal, setShowSettleModal] = useState(false);

    // POD Form
    const podForm = useForm({
        success: true,
        recipient_name: '',
        recipient_national_id: '',
        recipient_signature_svg: '',
        gps_latitude: '' as any,
        gps_longitude: '' as any,
        cod_amount_collected: '0.00',
        cod_payment_method: 'cash',
        failure_reason: '',
        pod_notes: '',
    });

    const openPodModal = (stop: Stop) => {
        setSelectedStopForPod(stop);
        podForm.setData({
            success: true,
            recipient_name: stop.customer.name_ar || stop.customer.name,
            recipient_national_id: '',
            recipient_signature_svg: '',
            gps_latitude: 24.7136, // Riyadh default coordinate
            gps_longitude: 46.6753,
            cod_amount_collected: stop.cod_amount_due,
            cod_payment_method: 'cash',
            failure_reason: '',
            pod_notes: '',
        });
    };

    const handlePodSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStopForPod) return;

        podForm.post(`/trade/dispatch/stops/${selectedStopForPod.id}/pod`, {
            onSuccess: () => {
                setSelectedStopForPod(null);
            },
        });
    };

    const handleStartTrip = () => {
        router.post(`/trade/dispatch/trips/${trip.id}/dispatch`);
    };

    const handleSettleCod = () => {
        router.post(`/trade/dispatch/trips/${trip.id}/settle-cod`, {}, {
            onSuccess: () => setShowSettleModal(false),
        });
    };

    const captureCurrentGps = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                podForm.setData({
                    ...podForm.data,
                    gps_latitude: position.coords.latitude,
                    gps_longitude: position.coords.longitude,
                });
            });
        }
    };

    return (
        <AppLayout>
            <Head title={`رحلة التوزيع - ${trip.trip_number}`} />

            <div className="space-y-6 pb-12">
                {/* Top Nav */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/trade/dispatch"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        <span>العودة لأسطول النقل ورحلات التوزيع</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link href={`/trade/dispatch/trips/${trip.id}/manifest`} target="_blank">
                            <Button variant="outline" size="sm">
                                <Printer className="w-4 h-4 ml-1.5" />
                                كشف إذن الشحن (A4)
                            </Button>
                        </Link>

                        {trip.status === 'scheduled' && (
                            <Button
                                size="sm"
                                onClick={handleStartTrip}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                            >
                                <Navigation className="w-4 h-4 ml-1.5" />
                                بدء انطلاق الرحلة
                            </Button>
                        )}

                        {trip.cod_settlement_status === 'pending' && parseFloat(trip.total_cod_collected) > 0 && (
                            <Button
                                size="sm"
                                onClick={() => setShowSettleModal(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                            >
                                <Banknote className="w-4 h-4 ml-1.5" />
                                تسوية متحصلات السائق النقدية (COD)
                            </Button>
                        )}
                    </div>
                </div>

                {/* Trip Header Banner */}
                <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-2xl font-bold text-foreground">
                                    {trip.trip_number}
                                </span>
                                {trip.status === 'scheduled' && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                        مجدولة
                                    </span>
                                )}
                                {trip.status === 'in_transit' && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 animate-pulse">
                                        في الطريق (In-Transit)
                                    </span>
                                )}
                                {trip.status === 'completed' && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                        مكتملة ومسلمة
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                                تاريخ الجدولة: {new Date(trip.scheduled_date).toLocaleDateString('ar-SA')}
                                {trip.dispatched_at && (
                                    <span> • انطلقت: {new Date(trip.dispatched_at).toLocaleTimeString('ar-SA')}</span>
                                )}
                            </p>
                        </div>

                        {/* Financial COD Settlement Badge */}
                        <div className="text-left font-mono">
                            <span className="text-xs text-muted-foreground">حالة تسوية المتحصلات:</span>
                            <div className="pt-0.5">
                                {trip.cod_settlement_status === 'settled' ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        تم توريد النقدية وقيد اليومية
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                                        <Clock className="w-3.5 h-3.5" />
                                        بانتظار تسوية الصندوق
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                <Users className="w-3.5 h-3.5 text-blue-500" />
                                السائق المكلف
                            </span>
                            <p className="font-bold text-sm text-foreground">
                                {trip.driver.name_ar || trip.driver.name}
                            </p>
                            <p className="font-mono text-muted-foreground">{trip.driver.phone}</p>
                        </div>

                        <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                <Car className="w-3.5 h-3.5 text-indigo-500" />
                                المركبة ولوحة الشحن
                            </span>
                            <p className="font-bold text-sm text-foreground font-mono">
                                {trip.vehicle.plate_number}
                            </p>
                            <p className="text-muted-foreground">{trip.vehicle.model}</p>
                        </div>

                        <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                                إجمالي مبالغ الـ COD
                            </span>
                            <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                                {Number(trip.total_cod_collected).toFixed(2)} / {Number(trip.total_cod_expected).toFixed(2)} ر.س
                            </p>
                            <p className="text-muted-foreground">تم تحصيله من العملاء</p>
                        </div>

                        <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
                            <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                                نسبة إنجاز التسليم
                            </span>
                            <p className="font-bold text-sm text-foreground font-mono">
                                {trip.completed_deliveries_count} من {trip.total_deliveries_count} محطة
                            </p>
                            <p className="text-muted-foreground">
                                {trip.total_deliveries_count > 0
                                    ? Math.round((trip.completed_deliveries_count / trip.total_deliveries_count) * 100)
                                    : 0}
                                % نسبة النجاح
                            </p>
                        </div>
                    </div>

                    {trip.route_notes && (
                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
                            <strong>تعليمات المسار:</strong> {trip.route_notes}
                        </div>
                    )}
                </div>

                {/* Stops Timeline & Deliveries Table */}
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden space-y-4">
                    <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            محطات التسليم وإثبات التسليم الإلكتروني (e-POD Stops)
                        </h3>
                        <span className="text-xs text-muted-foreground font-mono">
                            {trip.stops.length} محطات مجدولة
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-muted/50 text-muted-foreground text-xs border-b">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">المحطة</th>
                                    <th className="py-3 px-4 font-semibold">العميل</th>
                                    <th className="py-3 px-4 font-semibold">العنوان وجهة التسليم</th>
                                    <th className="py-3 px-4 font-semibold">المبلغ المطلوب (COD)</th>
                                    <th className="py-3 px-4 font-semibold">المبلغ المحصل</th>
                                    <th className="py-3 px-4 font-semibold">حالة التسليم</th>
                                    <th className="py-3 px-4 font-semibold">بيانات المستلم والتوقيع</th>
                                    <th className="py-3 px-4 font-semibold text-center">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {trip.stops.map((stop) => (
                                    <tr key={stop.id} className="hover:bg-muted/30 transition">
                                        <td className="py-3.5 px-4 font-mono font-bold">
                                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex items-center justify-center text-xs">
                                                {stop.stop_sequence}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    {stop.customer.name_ar || stop.customer.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {stop.recipient_contact_phone || stop.customer.phone || '-'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs truncate">
                                            {stop.destination_address}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-semibold">
                                            {Number(stop.cod_amount_due).toFixed(2)} ر.س
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                                            {Number(stop.cod_amount_collected).toFixed(2)} ر.س
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {stop.status === 'delivered' && (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full dark:bg-emerald-950/50 dark:text-emerald-300">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    تم التسليم
                                                </span>
                                            )}
                                            {stop.status === 'failed' && (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full dark:bg-rose-950/50 dark:text-rose-300">
                                                    <XCircle className="w-3 h-3" />
                                                    فشل التسليم
                                                </span>
                                            )}
                                            {stop.status === 'pending' && (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-300">
                                                    بانتظار الوصول
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs">
                                            {stop.status === 'delivered' ? (
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-foreground">
                                                        المستلم: {stop.recipient_name || 'العميل'}
                                                    </p>
                                                    {stop.delivered_at && (
                                                        <p className="text-[10px] text-muted-foreground font-mono">
                                                            {new Date(stop.delivered_at).toLocaleTimeString('ar-SA')}
                                                        </p>
                                                    )}
                                                    {stop.gps_latitude && (
                                                        <p className="text-[10px] text-blue-600 font-mono">
                                                            📍 تم تسجيل الإحداثيات
                                                        </p>
                                                    )}
                                                </div>
                                            ) : stop.status === 'failed' ? (
                                                <span className="text-xs text-rose-600">
                                                    السبب: {stop.failure_reason || 'غير متوفر'}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            {stop.status === 'pending' ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => openPodModal(stop)}
                                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                                >
                                                    إثبات التسليم POD
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openPodModal(stop)}
                                                    className="h-8 text-xs"
                                                >
                                                    عرض / تعديل
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal: Record Electronic Proof of Delivery (e-POD) */}
                {selectedStopForPod && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-5">
                            <div className="flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                                        <FileCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-foreground">
                                            إثبات التسليم الإلكتروني (e-POD)
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            المحطة #{selectedStopForPod.stop_sequence}: {selectedStopForPod.customer.name_ar || selectedStopForPod.customer.name}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedStopForPod(null)}
                                    className="text-muted-foreground text-sm font-semibold"
                                >
                                    إلغاء
                                </button>
                            </div>

                            <form onSubmit={handlePodSubmit} className="space-y-4">
                                {/* Success or Failure Toggle */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => podForm.setData('success', true)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                            podForm.data.success
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        تم التسليم بنجاح
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => podForm.setData('success', false)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                            !podForm.data.success
                                                ? 'bg-rose-600 text-white shadow-sm'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        تعذر أو فشل التسليم
                                    </button>
                                </div>

                                {podForm.data.success ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold">
                                                اسم المستلم الفعلي <span className="text-destructive">*</span>
                                            </label>
                                            <Input
                                                value={podForm.data.recipient_name}
                                                onChange={(e) => podForm.setData('recipient_name', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold">هوية أو جوال المستلم</label>
                                                <Input
                                                    placeholder="10xxxxxxxx"
                                                    value={podForm.data.recipient_national_id}
                                                    onChange={(e) =>
                                                        podForm.setData('recipient_national_id', e.target.value)
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold">المبلغ المحصل نقداً (ر.س)</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={podForm.data.cod_amount_collected}
                                                    onChange={(e) =>
                                                        podForm.setData('cod_amount_collected', e.target.value)
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* GPS location field */}
                                        <div className="p-3 bg-muted/40 rounded-xl border text-xs flex justify-between items-center">
                                            <div>
                                                <span className="font-semibold text-foreground">إحداثيات الموقع (GPS):</span>
                                                <p className="font-mono text-muted-foreground text-[11px]">
                                                    {podForm.data.gps_latitude}, {podForm.data.gps_longitude}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={captureCurrentGps}
                                                className="text-xs"
                                            >
                                                تحديد موقعي الآن 📍
                                            </Button>
                                        </div>

                                        {/* Digital Signature */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold flex items-center gap-1.5">
                                                <PenTool className="w-3.5 h-3.5 text-blue-500" />
                                                توقيع المستلم الرقمي (Digital Signature)
                                            </label>
                                            <div className="p-3 bg-white text-slate-900 rounded-xl border-2 border-dashed border-slate-300 text-center font-cursive text-xl font-bold select-none cursor-pointer">
                                                {podForm.data.recipient_name || 'توقيع المستلم بالاستلام الفعلي'}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                يتم تثبيت التوقيع مع الإحداثيات وتاريخ الاستلام كإثبات تسليم نظامي.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-destructive">
                                                سبب تعذر التسليم <span className="text-destructive">*</span>
                                            </label>
                                            <select
                                                value={podForm.data.failure_reason}
                                                onChange={(e) =>
                                                    podForm.setData('failure_reason', e.target.value)
                                                }
                                                required
                                                className="w-full bg-background border rounded-lg p-2.5 text-xs"
                                            >
                                                <option value="">-- اختر السبب --</option>
                                                <option value="العميل غير متواجد / لا يرد على الاتصال">
                                                    العميل غير متواجد / لا يرد على الاتصال
                                                </option>
                                                <option value="رفض العميل استلام الطلبية أو الدفع">
                                                    رفض العميل استلام الطلبية أو الدفع
                                                </option>
                                                <option value="العنوان غير صحيح أو خارج نطاق التغطية">
                                                    العنوان غير صحيح أو خارج نطاق التغطية
                                                </option>
                                                <option value="طلب العميل تأجيل موعد التسليم">
                                                    طلب العميل تأجيل موعد التسليم
                                                </option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold">ملاحظات إضافية من السائق</label>
                                            <Input
                                                placeholder="تفاصيل المحاولة..."
                                                value={podForm.data.pod_notes}
                                                onChange={(e) => podForm.setData('pod_notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-3 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setSelectedStopForPod(null)}
                                    >
                                        إغلاق
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={podForm.processing}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        تثبيت إثبات التسليم
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal: Driver COD Settlement */}
                {showSettleModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-5">
                            <div className="flex items-center justify-between border-b pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <Banknote className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-foreground">
                                        تسوية وتوريد متحصلات السائق النقدية
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowSettleModal(false)}
                                    className="text-muted-foreground text-sm"
                                >
                                    إلغاء
                                </button>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="p-4 bg-muted/40 rounded-xl border space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">السائق المسؤول:</span>
                                        <span className="font-bold text-foreground">
                                            {trip.driver.name_ar || trip.driver.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">المبلغ المحصل نقداً:</span>
                                        <span className="font-bold font-mono text-emerald-600 text-sm">
                                            {Number(trip.total_cod_collected).toFixed(2)} ر.س
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2">
                                        <span className="text-muted-foreground">خزينة الإيداع:</span>
                                        <span className="font-bold text-foreground">
                                            الصندوق والخزينة الرئيسية (حـ/ 1010)
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300">
                                    سيتم توليد قيد اليومية المحاسبي المزدوج آلياً:
                                    <br />
                                    <strong>مدين:</strong> حـ/ 1010 (الصندوق والخزينة النقدية)
                                    <br />
                                    <strong>دائن:</strong> حـ/ 1030 (المدينون التجاريون - تسوية فواتير العملاء)
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowSettleModal(false)}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleSettleCod}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                >
                                    تأكيد استلام النقدية والترحيل لدفتر الأستاذ
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
