import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    Clock,
    Flame,
    ShieldCheck,
    Trash2,
    Warehouse as WarehouseIcon,
    ArrowLeft,
    CheckCircle2,
    Calendar,
    DollarSign,
    Boxes,
    FileSpreadsheet,
    AlertOctagon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Batch {
    id: string;
    batch_number: string;
    supplier_batch_number?: string;
    manufacture_date?: string;
    expiry_date?: string;
    current_qty: string;
    unit_cost: string;
    status: string;
    product?: Product;
    warehouse?: Warehouse;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface KPIs {
    expired_count: number;
    expired_value_sar: number;
    expiring_30_count: number;
    expiring_30_value_sar: number;
    expiring_60_count: number;
    expiring_60_value_sar: number;
    safe_count: number;
    safe_value_sar: number;
    total_risk_sar: number;
}

interface Props {
    batches: PaginatedData<Batch>;
    kpis: KPIs;
    warehouses: Warehouse[];
    filters: {
        urgency?: string;
        warehouse_id?: string;
    };
}

export default function ExpiryDashboard({ batches, kpis, warehouses, filters }: Props) {
    const { t, isRtl } = useTranslation();

    const [selectedUrgency, setSelectedUrgency] = useState(filters.urgency || '');
    const [selectedWarehouse, setSelectedWarehouse] = useState(filters.warehouse_id || '');

    // Write-off modal state
    const [writeOffModalOpen, setWriteOffModalOpen] = useState(false);
    const [targetBatch, setTargetBatch] = useState<Batch | null>(null);
    const [writeOffQty, setWriteOffQty] = useState('');
    const [reason, setReason] = useState('انتهاء تاريخ الصلاحية / Expired stock');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const applyFilter = (urgencyVal?: string, warehouseVal?: string) => {
        const u = urgencyVal !== undefined ? urgencyVal : selectedUrgency;
        const w = warehouseVal !== undefined ? warehouseVal : selectedWarehouse;
        router.get('/inventory/batches/expiry/dashboard', {
            urgency: u || undefined,
            warehouse_id: w || undefined,
        }, { preserveState: true, replace: true });
    };

    const handleUrgencyClick = (urgency: string) => {
        const next = selectedUrgency === urgency ? '' : urgency;
        setSelectedUrgency(next);
        applyFilter(next, undefined);
    };

    const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedWarehouse(val);
        applyFilter(undefined, val);
    };

    const openWriteOffModal = (batch: Batch) => {
        setTargetBatch(batch);
        setWriteOffQty(parseFloat(batch.current_qty).toString());
        setReason('انتهاء تاريخ الصلاحية / Expired stock');
        setNotes('');
        setWriteOffModalOpen(true);
    };

    const handleWriteOffSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetBatch) return;

        setIsSubmitting(true);
        router.post(`/inventory/batches/${targetBatch.id}/write-off`, {
            quantity: writeOffQty ? parseFloat(writeOffQty) : undefined,
            reason,
            notes,
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setWriteOffModalOpen(false);
                setTargetBatch(null);
            },
        });
    };

    const calculateDaysLeft = (expiryDate?: string) => {
        if (!expiryDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(expiryDate);
        exp.setHours(0, 0, 0, 0);
        const diffMs = exp.getTime() - today.getTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    };

    const getUrgencyBadge = (days: number | null) => {
        if (days === null) {
            return <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">غير محدد</span>;
        }
        if (days < 0) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-2.5 py-1 rounded-full border border-red-300 dark:border-red-800 animate-pulse">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    منتهي منذ {Math.abs(days)} يوم
                </span>
            );
        }
        if (days <= 30) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800">
                    <Flame className="w-3.5 h-3.5 text-amber-600" />
                    حرج: متبقي {days} يوم
                </span>
            );
        }
        if (days <= 60) {
            return (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 px-2.5 py-1 rounded-full border border-yellow-300 dark:border-yellow-800">
                    <Clock className="w-3.5 h-3.5 text-yellow-600" />
                    تحذير: متبقي {days} يوم
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                آمن: متبقي {days} يوم
            </span>
        );
    };

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title="لوحة مراقبة مخاطر انتهاء الصلاحية والشطب (FEFO) | Expiry Risk Dashboard" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/inventory/batches" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium">
                            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                            العودة إلى سجل الدفعات
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
                        لوحة مخاطر انتهاء الصلاحية وإتلاف المخزون (FEFO & Expiry)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        متابعة القيمة المالية للمخزون المعرض للتلف، وتطبيق مبدأ FEFO، وإجراء محاضر الشطب المحاسبي الآلي للمخزون المنتهي.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-card border rounded-lg px-4 py-2 text-end">
                        <div className="text-xs text-muted-foreground">إجمالي القيمة المعرضة للخطر</div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            {kpis.total_risk_sar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Risk KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Expired Stock Card */}
                <div
                    onClick={() => handleUrgencyClick('expired')}
                    className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all ${
                        selectedUrgency === 'expired'
                            ? 'ring-2 ring-red-500 bg-red-100/50 dark:bg-red-950/40 border-red-400'
                            : 'bg-card hover:border-red-300 dark:hover:border-red-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                            <AlertOctagon className="w-4 h-4" />
                            منتهية الصلاحية (شطب فوري)
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold">
                            {kpis.expired_count} دفعة
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-red-600 dark:text-red-400">
                            {kpis.expired_value_sar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-muted-foreground ms-1">ريال</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            خسارة محققة تستوجب محضر إتلاف محاسبي
                        </div>
                    </div>
                </div>

                {/* Expiring in 30 Days Card */}
                <div
                    onClick={() => handleUrgencyClick('30_days')}
                    className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all ${
                        selectedUrgency === '30_days'
                            ? 'ring-2 ring-amber-500 bg-amber-100/50 dark:bg-amber-950/40 border-amber-400'
                            : 'bg-card hover:border-amber-300 dark:hover:border-amber-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <Flame className="w-4 h-4" />
                            تنتهي خلال 30 يوم (أولوية صرف FEFO)
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                            {kpis.expiring_30_count} دفعة
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                            {kpis.expiring_30_value_sar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-muted-foreground ms-1">ريال</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            خطر داهم يستلزم عروض ترويجية أو تسريع بيع
                        </div>
                    </div>
                </div>

                {/* Expiring in 30-60 Days Card */}
                <div
                    onClick={() => handleUrgencyClick('60_days')}
                    className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all ${
                        selectedUrgency === '60_days'
                            ? 'ring-2 ring-yellow-500 bg-yellow-100/50 dark:bg-yellow-950/40 border-yellow-400'
                            : 'bg-card hover:border-yellow-300 dark:hover:border-yellow-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            تنتهي خلال 30-60 يوم (تحذير مبكر)
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 font-bold">
                            {kpis.expiring_60_count} دفعة
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                            {kpis.expiring_60_value_sar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-muted-foreground ms-1">ريال</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            تحت المراقبة لتوجيه طلبات الشحن نحوها
                        </div>
                    </div>
                </div>

                {/* Safe Stock (> 60 Days) */}
                <div
                    onClick={() => handleUrgencyClick('')}
                    className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all ${
                        selectedUrgency === ''
                            ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-400'
                            : 'bg-card hover:border-emerald-300 dark:hover:border-emerald-800'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            رصيد آمن (&gt; 60 يوم)
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                            {kpis.safe_count} دفعة
                        </span>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                            {kpis.safe_value_sar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span className="text-xs font-normal text-muted-foreground ms-1">ريال</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            فترة صلاحية كافية للدورة الطبيعية
                        </div>
                    </div>
                </div>
            </div>

            {/* Warehouse and Urgency Filter Bar */}
            <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">التصفية حسب المخاطر:</span>
                    <Button
                        type="button"
                        size="sm"
                        variant={selectedUrgency === '' ? 'default' : 'outline'}
                        onClick={() => handleUrgencyClick('')}
                    >
                        الكل
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={selectedUrgency === 'expired' ? 'destructive' : 'outline'}
                        onClick={() => handleUrgencyClick('expired')}
                    >
                        المنتهية فقط ({kpis.expired_count})
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={selectedUrgency === '30_days' ? 'default' : 'outline'}
                        className={selectedUrgency === '30_days' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'text-amber-700 border-amber-300'}
                        onClick={() => handleUrgencyClick('30_days')}
                    >
                        أقل من 30 يوم ({kpis.expiring_30_count})
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={selectedUrgency === '60_days' ? 'default' : 'outline'}
                        className={selectedUrgency === '60_days' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'text-yellow-700 border-yellow-300'}
                        onClick={() => handleUrgencyClick('60_days')}
                    >
                        30 إلى 60 يوم ({kpis.expiring_60_count})
                    </Button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <WarehouseIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedWarehouse}
                        onChange={handleWarehouseChange}
                        className="w-full sm:w-56 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        <option value="">جميع المستودعات</option>
                        {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                                {w.name} ({w.code})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Batches Expiry Table */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-primary" />
                        سجل الدفعات ومؤشرات الصلاحية الحالية ({batches.total} دفعة)
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                            <tr>
                                <th className="px-4 py-3 text-start">رقم الدفعة</th>
                                <th className="px-4 py-3 text-start">المنتج</th>
                                <th className="px-4 py-3 text-start">المستودع</th>
                                <th className="px-4 py-3 text-start">تاريخ الصلاحية</th>
                                <th className="px-4 py-3 text-start">حالة الخطر / الأيام</th>
                                <th className="px-4 py-3 text-end">الرصيد المتاح</th>
                                <th className="px-4 py-3 text-end">تكلفة الوحدة</th>
                                <th className="px-4 py-3 text-end">القيمة الإجمالية</th>
                                <th className="px-4 py-3 text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {batches.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                                            <p className="text-base font-medium">لا توجد دفعات مطابقة لمعايير التصفية الحالية</p>
                                            <p className="text-xs">المخزون ضمن المستويات الآمنة أو لا تنطبق شروط الخطر المحددة</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                batches.data.map((batch) => {
                                    const daysLeft = calculateDaysLeft(batch.expiry_date);
                                    const qty = parseFloat(batch.current_qty) || 0;
                                    const unitCost = parseFloat(batch.unit_cost) || 0;
                                    const totalCost = qty * unitCost;
                                    const isExpired = daysLeft !== null && daysLeft < 0;

                                    return (
                                        <tr
                                            key={batch.id}
                                            className={`hover:bg-muted/40 transition-colors ${
                                                isExpired ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-3 font-mono font-medium">
                                                <Link
                                                    href={`/inventory/batches/${batch.id}`}
                                                    className="text-primary hover:underline"
                                                >
                                                    {batch.batch_number}
                                                </Link>
                                                {batch.supplier_batch_number && (
                                                    <div className="text-xs text-muted-foreground">
                                                        المورد: {batch.supplier_batch_number}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">
                                                    {batch.product?.name_ar || batch.product?.name || '-'}
                                                </div>
                                                <div className="text-xs font-mono text-muted-foreground">
                                                    {batch.product?.sku}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {batch.warehouse?.name || '-'}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {batch.expiry_date ? (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                        {batch.expiry_date}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">غير محدد</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getUrgencyBadge(daysLeft)}
                                            </td>
                                            <td className="px-4 py-3 text-end font-mono font-semibold">
                                                {qty.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-end font-mono text-xs text-muted-foreground">
                                                {unitCost.toFixed(2)} ريال
                                            </td>
                                            <td className="px-4 py-3 text-end font-mono font-bold text-foreground">
                                                {totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={isExpired ? 'destructive' : 'outline'}
                                                    className="h-8 text-xs font-medium flex items-center gap-1.5 mx-auto"
                                                    onClick={() => openWriteOffModal(batch)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    إتلاف وشطب محاسبي
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {batches.last_page > 1 && (
                    <div className="p-4 border-t flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            عرض {batches.data.length} من أصل {batches.total} دفعة
                        </span>
                        <div className="flex items-center gap-1">
                            {batches.links.map((link, idx) => (
                                <Button
                                    key={idx}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Write-off Dialog */}
            <Dialog open={writeOffModalOpen} onOpenChange={setWriteOffModalOpen}>
                <DialogContent className="sm:max-w-lg" dir={isRtl ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="w-5 h-5 text-destructive" />
                            إتلاف وشطب مخزون منتهي / تالف
                        </DialogTitle>
                        <DialogDescription>
                            سيتم تنزيل الكمية المشطوبة من رصيد المستودع، وإنشاء حركة مخزنية، وترحيل قيد محاسبي مزدوج تلقائياً.
                        </DialogDescription>
                    </DialogHeader>

                    {targetBatch && (
                        <form onSubmit={handleWriteOffSubmit} className="space-y-4 py-2">
                            {/* Batch Info Summary */}
                            <div className="bg-muted/60 p-3 rounded-lg border text-sm space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">رقم الدفعة:</span>
                                    <span className="font-mono font-bold">{targetBatch.batch_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">المنتج:</span>
                                    <span className="font-medium">{targetBatch.product?.name_ar || targetBatch.product?.name} ({targetBatch.product?.sku})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">المستودع:</span>
                                    <span>{targetBatch.warehouse?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">تاريخ الصلاحية:</span>
                                    <span className="font-mono text-destructive font-semibold">{targetBatch.expiry_date || 'غير محدد'}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1.5 mt-1.5">
                                    <span className="text-muted-foreground">الرصيد المتاح حالياً:</span>
                                    <span className="font-mono font-bold text-foreground">{parseFloat(targetBatch.current_qty).toLocaleString()} وحدة</span>
                                </div>
                            </div>

                            {/* Write-off Quantity */}
                            <div className="space-y-1.5">
                                <Label htmlFor="writeOffQty" className="text-xs font-semibold">
                                    الكمية المراد إتلافها وشطبها *
                                </Label>
                                <Input
                                    id="writeOffQty"
                                    type="number"
                                    step="0.0001"
                                    min="0.0001"
                                    max={parseFloat(targetBatch.current_qty)}
                                    value={writeOffQty}
                                    onChange={(e) => setWriteOffQty(e.target.value)}
                                    required
                                />
                                <span className="text-[11px] text-muted-foreground">
                                    الحد الأقصى هو الرصيد المتاح بالكامل ({parseFloat(targetBatch.current_qty)}).
                                </span>
                            </div>

                            {/* Estimated Loss */}
                            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center justify-between text-xs">
                                <span className="text-red-700 dark:text-red-400 font-medium">الخسارة المالية التقديرية (القيد المحاسبي):</span>
                                <span className="font-mono font-bold text-red-700 dark:text-red-400 text-sm">
                                    {(
                                        (parseFloat(writeOffQty) || 0) * (parseFloat(targetBatch.unit_cost) || 0)
                                    ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                    ريال
                                </span>
                            </div>

                            {/* Reason */}
                            <div className="space-y-1.5">
                                <Label htmlFor="reason" className="text-xs font-semibold">
                                    سبب الإتلاف والشطب *
                                </Label>
                                <Input
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="مثال: انتهاء فترة الصلاحية أو كسر في العبوة..."
                                    required
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <Label htmlFor="notes" className="text-xs font-semibold">
                                    ملاحظات محضر اللجنة / رقم قرار الإتلاف
                                </Label>
                                <textarea
                                    id="notes"
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="أدخل تفاصيل محضر الإتلاف ورقم الإذن الإداري..."
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            {/* Accounting Warning */}
                            <div className="text-[11px] p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                                <strong>تنويه محاسبي نظامي:</strong> سيتم قيد العملية تلقائياً في دفتر اليومية العامة:
                                <br />• <strong>مدين:</strong> حساب 5250 (خسائر بضاعة تالفة ومنتهية الصلاحية)
                                <br />• <strong>دائن:</strong> حساب 1300 (بضاعة المخزون)
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setWriteOffModalOpen(false)}
                                    disabled={isSubmitting}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={isSubmitting || !writeOffQty || parseFloat(writeOffQty) <= 0}
                                >
                                    {isSubmitting ? 'جاري ترحيل القيد...' : 'تأكيد الشطب وترحيل القيد'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
