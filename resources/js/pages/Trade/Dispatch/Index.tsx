import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Truck,
    Plus,
    Users,
    Calendar,
    Search,
    MapPin,
    Clock,
    CheckCircle2,
    AlertCircle,
    Banknote,
    FileText,
    ArrowUpRight,
    Car,
    Shield,
    Sliders,
    Navigation,
    Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface Driver {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    phone: string;
    license_type: string;
    status: 'available' | 'on_trip' | 'off_duty';
}

interface Vehicle {
    id: string;
    plate_number: string;
    model: string;
    vehicle_type: string;
    max_weight_capacity_kg: string;
    status: 'active' | 'maintenance' | 'inactive';
}

interface Trip {
    id: string;
    trip_number: string;
    scheduled_date: string;
    status: 'draft' | 'scheduled' | 'in_transit' | 'completed' | 'cancelled';
    total_deliveries_count: number;
    completed_deliveries_count: number;
    total_cod_expected: string;
    total_cod_collected: string;
    cod_settlement_status: 'pending' | 'settled';
    driver: Driver;
    vehicle: Vehicle;
    departure_warehouse?: { name: string };
    stops: Array<{ id: string; customer: { name: string; name_ar?: string } }>;
}

interface PaginatedData<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    metrics: {
        active_trips_count: number;
        completed_today_count: number;
        active_vehicles_count: number;
        pending_cod_total: string;
    };
    trips: PaginatedData<Trip>;
    vehicles: Vehicle[];
    drivers: Driver[];
    filters: { status?: string; search?: string };
}

export default function DispatchIndex({
    metrics,
    trips,
    vehicles,
    drivers,
    filters,
}: Props) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'trips' | 'vehicles' | 'drivers'>('trips');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showDriverModal, setShowDriverModal] = useState(false);

    // Vehicle Form
    const vehicleForm = useForm({
        plate_number: '',
        model: '',
        vehicle_type: 'van',
        max_weight_capacity_kg: '1500',
        max_volume_capacity_cbm: '12',
        notes: '',
    });

    // Driver Form
    const driverForm = useForm({
        code: `DRV-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        name_ar: '',
        phone: '',
        license_number: '',
        license_type: 'light',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/trade/dispatch', {
            search: searchTerm,
            status: statusFilter,
        }, { preserveState: true });
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        router.get('/trade/dispatch', {
            search: searchTerm,
            status,
        }, { preserveState: true });
    };

    const handleVehicleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        vehicleForm.post('/trade/dispatch/vehicles', {
            onSuccess: () => {
                setShowVehicleModal(false);
                vehicleForm.reset();
            },
        });
    };

    const handleDriverSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        driverForm.post('/trade/dispatch/drivers', {
            onSuccess: () => {
                setShowDriverModal(false);
                driverForm.reset();
            },
        });
    };

    return (
        <AppLayout>
            <Head title="جدولة التوزيع وأسطول النقل | Fleet Dispatch & POD" />

            <div className="space-y-6 pb-12">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-l from-slate-900 via-blue-950 to-indigo-950 p-6 md:p-8 rounded-2xl text-white shadow-xl">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-blue-500/20 backdrop-blur rounded-xl border border-blue-400/30">
                                <Truck className="w-6 h-6 text-blue-300" />
                            </span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                لوجستيات التجارة والتوزيع (Logistics & Fleet)
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            جدولة وتسيير رحلات التوزيع وإثبات التسليم (e-POD)
                        </h1>
                        <p className="text-sm text-blue-200/80 max-w-2xl">
                            إدارة أسطول النقل، وتجميع أذونات الشحن في رحلات توزيع ذكية، وإثبات التسليم الإلكتروني بالتوقيع والإحداثيات مع تسوية التحصيل النقدي (COD).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            onClick={() => setShowVehicleModal(true)}
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
                        >
                            <Car className="w-4 h-4 ml-2" />
                            إضافة مركبة
                        </Button>

                        <Button
                            onClick={() => setShowDriverModal(true)}
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
                        >
                            <Users className="w-4 h-4 ml-2" />
                            تسجيل سائق
                        </Button>

                        <Link href="/trade/dispatch/create">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30 font-semibold">
                                <Plus className="w-4 h-4 ml-2" />
                                جدولة رحلة توزيع جديدة
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">الرحلات النشطة الجارية</p>
                            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {metrics.active_trips_count}
                            </h3>
                            <p className="text-xs text-muted-foreground">رحلات مجدولة وفي الطريق</p>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                            <Navigation className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">رحلات مكتملة اليوم</p>
                            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {metrics.completed_today_count}
                            </h3>
                            <p className="text-xs text-emerald-600 font-medium">تم إثبات التسليم POD</p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">مركبات الأسطول الجاهزة</p>
                            <h3 className="text-2xl font-bold text-foreground">
                                {metrics.active_vehicles_count}
                            </h3>
                            <p className="text-xs text-muted-foreground">شاحنة وسيارات توصيل</p>
                        </div>
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
                            <Car className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">متحصلات COD معلقة بالسائقين</p>
                            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {Number(metrics.pending_cod_total).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                <span className="text-xs font-normal text-muted-foreground">ر.س</span>
                            </h3>
                            <p className="text-xs text-amber-600 font-medium">بانتظار الإيداع بالخزينة</p>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                            <Banknote className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Tabs Header */}
                <div className="flex border-b text-sm font-medium">
                    <button
                        type="button"
                        onClick={() => setActiveTab('trips')}
                        className={`pb-3 px-4 font-bold border-b-2 transition ${
                            activeTab === 'trips'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        رحلات وأذونات التوزيع ({trips.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('vehicles')}
                        className={`pb-3 px-4 font-bold border-b-2 transition ${
                            activeTab === 'vehicles'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        مركبات وسيارات الأسطول ({vehicles.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('drivers')}
                        className={`pb-3 px-4 font-bold border-b-2 transition ${
                            activeTab === 'drivers'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        السائقين والمناديب ({drivers.length})
                    </button>
                </div>

                {/* TAB 1: Trips Table */}
                {activeTab === 'trips' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="ابحث برقم الرحلة، اسم السائق، رقم اللوحة..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pr-9"
                                    />
                                </div>
                                <Button type="submit" variant="secondary">
                                    بحث
                                </Button>
                            </form>

                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                {[
                                    { id: '', label: 'الكل' },
                                    { id: 'scheduled', label: 'مجدولة' },
                                    { id: 'in_transit', label: 'في الطريق' },
                                    { id: 'completed', label: 'مكتملة' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleStatusFilter(tab.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                            statusFilter === tab.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-accent'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Trips Table */}
                        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-muted/50 text-muted-foreground text-xs border-b">
                                        <tr>
                                            <th className="py-3.5 px-4 font-semibold">رقم الرحلة</th>
                                            <th className="py-3.5 px-4 font-semibold">تاريخ الجدولة</th>
                                            <th className="py-3.5 px-4 font-semibold">السائق</th>
                                            <th className="py-3.5 px-4 font-semibold">المركبة واللوحة</th>
                                            <th className="py-3.5 px-4 font-semibold">المحطات والتسليمات</th>
                                            <th className="py-3.5 px-4 font-semibold">التحصيل النقدي المتوقع</th>
                                            <th className="py-3.5 px-4 font-semibold">حالة الرحلة</th>
                                            <th className="py-3.5 px-4 font-semibold text-center">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {trips.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <Truck className="w-8 h-8 text-muted-foreground/40" />
                                                        <p>لا توجد رحلات توزيع مسجلة مطابقة لمعايير البحث</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            trips.data.map((trip) => {
                                                const completionRate = trip.total_deliveries_count > 0
                                                    ? Math.round((trip.completed_deliveries_count / trip.total_deliveries_count) * 100)
                                                    : 0;

                                                return (
                                                    <tr key={trip.id} className="hover:bg-muted/30 transition">
                                                        <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="w-4 h-4 text-blue-500" />
                                                                <span>{trip.trip_number}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-xs font-mono text-muted-foreground">
                                                            {new Date(trip.scheduled_date).toLocaleDateString('ar-SA')}
                                                        </td>
                                                        <td className="py-3.5 px-4 font-semibold text-foreground">
                                                            {trip.driver.name_ar || trip.driver.name}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="text-xs">
                                                                <p className="font-semibold text-foreground">{trip.vehicle.plate_number}</p>
                                                                <p className="text-muted-foreground">{trip.vehicle.model}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between text-xs font-medium">
                                                                    <span>
                                                                        {trip.completed_deliveries_count} من {trip.total_deliveries_count} مكتملة
                                                                    </span>
                                                                    <span className="font-mono text-muted-foreground">
                                                                        {completionRate}%
                                                                    </span>
                                                                </div>
                                                                <div className="w-28 bg-muted rounded-full h-1.5 overflow-hidden">
                                                                    <div
                                                                        className="bg-blue-600 h-full rounded-full"
                                                                        style={{ width: `${completionRate}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 font-semibold text-foreground">
                                                            {Number(trip.total_cod_expected).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                            })}{' '}
                                                            <span className="text-xs text-muted-foreground font-normal">
                                                                ر.س
                                                            </span>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            {trip.status === 'scheduled' && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                                                    مجدولة
                                                                </span>
                                                            )}
                                                            {trip.status === 'in_transit' && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                                                    في الطريق
                                                                </span>
                                                            )}
                                                            {trip.status === 'completed' && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                                    مكتملة
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Link href={`/trade/dispatch/trips/${trip.id}`}>
                                                                    <Button size="sm" variant="outline" className="h-8 text-xs">
                                                                        التفاصيل والـ POD
                                                                    </Button>
                                                                </Link>
                                                                <Link
                                                                    href={`/trade/dispatch/trips/${trip.id}/manifest`}
                                                                    target="_blank"
                                                                >
                                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="كشف أذونات الشحن">
                                                                        <Printer className="w-4 h-4 text-muted-foreground" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: Fleet Vehicles */}
                {activeTab === 'vehicles' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vehicles.map((v) => (
                            <div key={v.id} className="bg-card p-5 rounded-xl border shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Car className="w-4 h-4 text-blue-500" />
                                            <h4 className="font-bold text-foreground font-mono">{v.plate_number}</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{v.model}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            v.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                : 'bg-rose-50 text-rose-700'
                                        }`}
                                    >
                                        {v.status === 'active' ? 'جاهزة' : 'صيانة'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                                    <div>
                                        <span className="text-muted-foreground">نوع المركبة:</span>
                                        <p className="font-semibold">{v.vehicle_type}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">الحمولة القصوى:</span>
                                        <p className="font-semibold font-mono">{Number(v.max_weight_capacity_kg).toLocaleString()} كجم</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB 3: Drivers */}
                {activeTab === 'drivers' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {drivers.map((d) => (
                            <div key={d.id} className="bg-card p-5 rounded-xl border shadow-sm space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-indigo-500" />
                                            <h4 className="font-bold text-foreground">{d.name_ar || d.name}</h4>
                                        </div>
                                        <p className="text-xs font-mono text-muted-foreground">{d.phone}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            d.status === 'available'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                : d.status === 'on_trip'
                                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                                : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        {d.status === 'available' ? 'متاح' : d.status === 'on_trip' ? 'في رحلة' : 'إجازة'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                                    <div>
                                        <span className="text-muted-foreground">كود السائق:</span>
                                        <p className="font-semibold font-mono">{d.code}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">رخصة القيادة:</span>
                                        <p className="font-semibold capitalize">{d.license_type}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal: Add Vehicle */}
                {showVehicleModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-5">
                            <div className="flex items-center justify-between border-b pb-3">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <Car className="w-5 h-5 text-blue-500" />
                                    إضافة مركبة جديدة للأسطول
                                </h3>
                                <button type="button" onClick={() => setShowVehicleModal(false)} className="text-muted-foreground text-sm">
                                    إلغاء
                                </button>
                            </div>
                            <form onSubmit={handleVehicleSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold">رقم اللوحة <span className="text-destructive">*</span></label>
                                    <Input
                                        placeholder="مثال: أ ب ج 1234"
                                        value={vehicleForm.data.plate_number}
                                        onChange={(e) => vehicleForm.setData('plate_number', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold">موديل المركبة <span className="text-destructive">*</span></label>
                                    <Input
                                        placeholder="مثال: Isuzu NPR 2024"
                                        value={vehicleForm.data.model}
                                        onChange={(e) => vehicleForm.setData('model', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">نوع المركبة</label>
                                        <select
                                            value={vehicleForm.data.vehicle_type}
                                            onChange={(e) => vehicleForm.setData('vehicle_type', e.target.value)}
                                            className="w-full bg-background border rounded-lg p-2 text-xs"
                                        >
                                            <option value="van">فان (Van)</option>
                                            <option value="pickup">وانيت / بيك آب</option>
                                            <option value="truck_medium">شاحنة متوسطة</option>
                                            <option value="truck_heavy">شاحنة ثقيلة (تريلا)</option>
                                            <option value="motorcycle">دراجة نارية</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">الحمولة القصوى (كجم)</label>
                                        <Input
                                            type="number"
                                            value={vehicleForm.data.max_weight_capacity_kg}
                                            onChange={(e) => vehicleForm.setData('max_weight_capacity_kg', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-3 border-t">
                                    <Button type="button" variant="outline" onClick={() => setShowVehicleModal(false)}>
                                        إغلاق
                                    </Button>
                                    <Button type="submit" disabled={vehicleForm.processing} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        حفظ المركبة
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal: Add Driver */}
                {showDriverModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-5">
                            <div className="flex items-center justify-between border-b pb-3">
                                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    تسجيل سائق / مندوب توصيل
                                </h3>
                                <button type="button" onClick={() => setShowDriverModal(false)} className="text-muted-foreground text-sm">
                                    إلغاء
                                </button>
                            </div>
                            <form onSubmit={handleDriverSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">كود السائق <span className="text-destructive">*</span></label>
                                        <Input
                                            value={driverForm.data.code}
                                            onChange={(e) => driverForm.setData('code', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold">رقم الجوال <span className="text-destructive">*</span></label>
                                        <Input
                                            placeholder="+9665..."
                                            value={driverForm.data.phone}
                                            onChange={(e) => driverForm.setData('phone', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold">اسم السائق (عربي) <span className="text-destructive">*</span></label>
                                    <Input
                                        placeholder="مثال: أحمد محمد الزهراني"
                                        value={driverForm.data.name_ar}
                                        onChange={(e) => {
                                            driverForm.setData('name_ar', e.target.value);
                                            if (!driverForm.data.name) driverForm.setData('name', e.target.value);
                                        }}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold">فئة رخصة القيادة</label>
                                    <select
                                        value={driverForm.data.license_type}
                                        onChange={(e) => driverForm.setData('license_type', e.target.value)}
                                        className="w-full bg-background border rounded-lg p-2 text-xs"
                                    >
                                        <option value="light">خصوصي / خفيف</option>
                                        <option value="medium">نقل متوسط</option>
                                        <option value="heavy">نقل ثقيل / عمومي</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2 pt-3 border-t">
                                    <Button type="button" variant="outline" onClick={() => setShowDriverModal(false)}>
                                        إغلاق
                                    </Button>
                                    <Button type="submit" disabled={driverForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        تسجيل السائق
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
