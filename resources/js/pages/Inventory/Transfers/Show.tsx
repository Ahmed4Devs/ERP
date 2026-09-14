import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Truck,
    CheckCircle2,
    Clock,
    Printer,
    FileText,
    AlertTriangle,
    Boxes,
    ArrowRightLeft,
    Send,
    PackageCheck,
    Calendar,
    UserCheck,
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

interface Warehouse {
    id: string;
    code: string;
    name: string;
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

interface TransferLine {
    id: string;
    product_id: string;
    product: Product;
    quantity: string;
    dispatched_quantity?: string;
    received_quantity?: string;
    shortage_quantity?: string;
    shortage_reason?: string;
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
        name_ar?: string;
    };
}

interface JournalEntry {
    id: string;
    entry_number: string;
    date: string;
    description: string;
    lines: JournalLine[];
}

interface StockTransfer {
    id: string;
    transfer_number: string;
    date: string;
    status: 'draft' | 'requested' | 'in_transit' | 'completed' | 'cancelled';
    total_value: string;
    shortage_value: string;
    from_warehouse: Warehouse;
    to_warehouse: Warehouse;
    lines: TransferLine[];
    driver_name?: string;
    vehicle_plate?: string;
    tracking_number?: string;
    dispatched_at?: string;
    received_at?: string;
    dispatched_by_user?: {
        id: number;
        name: string;
        email: string;
    };
    received_by_user?: {
        id: number;
        name: string;
        email: string;
    };
    in_transit_journal?: JournalEntry;
    receipt_journal?: JournalEntry;
    notes?: string;
}

interface Props {
    transfer: StockTransfer;
}

export default function StockTransferShow({ transfer }: Props) {
    const { t, isRtl } = useTranslation();

    // Dispatch modal state
    const [dispatchOpen, setDispatchOpen] = useState(false);
    const [driverName, setDriverName] = useState(transfer.driver_name || '');
    const [vehiclePlate, setVehiclePlate] = useState(transfer.vehicle_plate || '');
    const [trackingNumber, setTrackingNumber] = useState(transfer.tracking_number || '');
    const [isDispatching, setIsDispatching] = useState(false);

    // Receive modal state
    const [receiveOpen, setReceiveOpen] = useState(false);
    const [receivedQuantities, setReceivedQuantities] = useState<Record<string, string>>(() => {
        const init: Record<string, string> = {};
        transfer.lines.forEach((l) => {
            init[l.id] = (parseFloat(l.dispatched_quantity || l.quantity)).toString();
        });
        return init;
    });
    const [shortageReasons, setShortageReasons] = useState<Record<string, string>>({});
    const [isReceiving, setIsReceiving] = useState(false);

    const handleDispatchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsDispatching(true);
        router.post(`/inventory/transfers/${transfer.id}/dispatch`, {
            driver_name: driverName,
            vehicle_plate: vehiclePlate,
            tracking_number: trackingNumber,
        }, {
            onFinish: () => {
                setIsDispatching(false);
                setDispatchOpen(false);
            },
        });
    };

    const handleReceiveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsReceiving(true);

        const linesPayload = transfer.lines.map((l) => ({
            line_id: l.id,
            received_quantity: parseFloat(receivedQuantities[l.id] || '0'),
            shortage_reason: shortageReasons[l.id] || null,
        }));

        router.post(`/inventory/transfers/${transfer.id}/receive`, {
            lines: linesPayload,
        }, {
            onFinish: () => {
                setIsReceiving(false);
                setReceiveOpen(false);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
            case 'requested':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-full border">
                        <Clock className="w-3.5 h-3.5" />
                        مسودة / بانتظار الشحن
                    </span>
                );
            case 'in_transit':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800 animate-pulse">
                        <Truck className="w-3.5 h-3.5 text-amber-600" />
                        بالطريق بين الفروع (In-Transit)
                    </span>
                );
            case 'completed':
            case 'received':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        تم الاستلام والتدقيق
                    </span>
                );
            default:
                return <span className="text-xs bg-muted px-3 py-1 rounded-full">{status}</span>;
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`التحويل المخزني ${transfer.transfer_number} | Stock Transfer`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <Link
                        href="/inventory/transfers"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        العودة إلى سجل التحويلات المخزنية
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ArrowRightLeft className="w-7 h-7 text-primary" />
                            تحويل مخزني: <span className="font-mono text-primary">{transfer.transfer_number}</span>
                        </h1>
                        {getStatusBadge(transfer.status)}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={`/inventory/transfers/${transfer.id}/print-waybill`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Button variant="outline" className="flex items-center gap-2">
                            <Printer className="w-4 h-4" />
                            طباعة بوليصة الشحن الداخلي
                        </Button>
                    </a>

                    {(transfer.status === 'draft' || transfer.status === 'requested') && (
                        <Button
                            onClick={() => setDispatchOpen(true)}
                            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            <Send className="w-4 h-4" />
                            اعتماد وشحن البضاعة بالطريق
                        </Button>
                    )}

                    {transfer.status === 'in_transit' && (
                        <Button
                            onClick={() => setReceiveOpen(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <PackageCheck className="w-4 h-4" />
                            تأكيد استلام وفحص الشحنة
                        </Button>
                    )}
                </div>
            </div>

            {/* Route & Progress Stepper */}
            <div className="bg-card border rounded-xl p-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="p-4 rounded-lg bg-muted/40 border">
                        <div className="text-xs text-muted-foreground">مستودع المصدر (الشحن)</div>
                        <div className="text-lg font-bold text-foreground mt-1">
                            {transfer.from_warehouse?.name}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                            رمز: {transfer.from_warehouse?.code}
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center gap-2 text-primary">
                            <Truck className="w-6 h-6 animate-bounce" />
                        </div>
                        <div className="text-xs font-semibold text-muted-foreground mt-1">
                            {transfer.status === 'in_transit'
                                ? 'الشحنة جارية الآن على الطريق 🚚'
                                : transfer.status === 'completed'
                                ? 'وصلت واستقرت بالمستودع الهدف ✅'
                                : 'بانتظار انطلاق الشاحنة ⏳'}
                        </div>
                        {transfer.driver_name && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                السائق: {transfer.driver_name} {transfer.vehicle_plate ? `(${transfer.vehicle_plate})` : ''}
                            </div>
                        )}
                    </div>

                    <div className="p-4 rounded-lg bg-muted/40 border">
                        <div className="text-xs text-muted-foreground">مستودع المقصد (الاستلام)</div>
                        <div className="text-lg font-bold text-foreground mt-1">
                            {transfer.to_warehouse?.name}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                            رمز: {transfer.to_warehouse?.code}
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Metrics Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">تاريخ أمر التحويل</div>
                    <div className="text-lg font-bold mt-1 font-mono">{transfer.date}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">إجمالي القيمة المنقولة</div>
                    <div className="text-lg font-bold mt-1 text-primary font-mono">
                        {parseFloat(transfer.total_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">عجز وتلف الشحن المحسوب</div>
                    <div className={`text-lg font-bold mt-1 font-mono ${parseFloat(transfer.shortage_value) > 0 ? 'text-destructive' : 'text-emerald-600'}`}>
                        {parseFloat(transfer.shortage_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال
                    </div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">إجمالي عدد الأصناف</div>
                    <div className="text-lg font-bold mt-1 font-mono">{transfer.lines?.length || 0} صنف</div>
                </div>
            </div>

            {/* Transfer Lines Table */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                        <Boxes className="w-5 h-5 text-primary" />
                        الأصناف والكميات المنقولة
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b">
                            <tr>
                                <th className="px-4 py-3 text-start">المنتج / الصنف</th>
                                <th className="px-4 py-3 text-end">الكمية المطلوبة</th>
                                <th className="px-4 py-3 text-end">الكمية المشحونة</th>
                                <th className="px-4 py-3 text-end">الكمية المستلمة</th>
                                <th className="px-4 py-3 text-end">العجز / التلف</th>
                                <th className="px-4 py-3 text-end">تكلفة الوحدة</th>
                                <th className="px-4 py-3 text-end">القيمة الإجمالية</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {transfer.lines.map((line) => {
                                const reqQty = parseFloat(line.quantity);
                                const dispQty = parseFloat(line.dispatched_quantity || line.quantity);
                                const recQty = line.received_quantity ? parseFloat(line.received_quantity) : null;
                                const shortQty = line.shortage_quantity ? parseFloat(line.shortage_quantity) : 0;

                                return (
                                    <tr key={line.id} className="hover:bg-muted/40 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">
                                                {line.product?.name_ar || line.product?.name}
                                            </div>
                                            <div className="text-xs font-mono text-muted-foreground">
                                                {line.product?.sku}
                                            </div>
                                            {line.shortage_reason && (
                                                <div className="text-[11px] text-destructive mt-0.5">
                                                    سبب العجز: {line.shortage_reason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-end font-mono font-medium">
                                            {reqQty.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-end font-mono font-medium text-amber-700 dark:text-amber-400">
                                            {transfer.status !== 'draft' ? dispQty.toLocaleString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-end font-mono font-bold text-emerald-600">
                                            {recQty !== null ? recQty.toLocaleString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-end font-mono">
                                            {shortQty > 0 ? (
                                                <span className="text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded">
                                                    {shortQty.toLocaleString()}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-end font-mono text-xs text-muted-foreground">
                                            {parseFloat(line.unit_cost).toFixed(2)} ريال
                                        </td>
                                        <td className="px-4 py-3 text-end font-mono font-semibold">
                                            {parseFloat(line.line_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Double-Entry GL Journal Entries Section */}
            {(transfer.in_transit_journal || transfer.receipt_journal) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* In-Transit Journal */}
                    {transfer.in_transit_journal && (
                        <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="font-semibold text-sm flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                                    <FileText className="w-4 h-4" />
                                    قيد الشحن (بضاعة بالطريق ح/1350)
                                </span>
                                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded font-bold">
                                    {transfer.in_transit_journal.entry_number}
                                </span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                {transfer.in_transit_journal.lines?.map((line) => (
                                    <div key={line.id} className="flex justify-between font-mono">
                                        <span>
                                            {parseFloat(line.debit) > 0 ? 'مدين' : 'دائن'} ({line.account?.code}) {line.account?.name_ar || line.account?.name}
                                        </span>
                                        <span className="font-bold">
                                            {(parseFloat(line.debit) || parseFloat(line.credit)).toFixed(2)} ريال
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Receipt & Shortage Journal */}
                    {transfer.receipt_journal && (
                        <div className="bg-card border rounded-xl p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                                <span className="font-semibold text-sm flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2 className="w-4 h-4" />
                                    قيد الاستلام وتسوية العجز (ح/5260)
                                </span>
                                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded font-bold">
                                    {transfer.receipt_journal.entry_number}
                                </span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                                {transfer.receipt_journal.lines?.map((line) => (
                                    <div key={line.id} className="flex justify-between font-mono">
                                        <span>
                                            {parseFloat(line.debit) > 0 ? 'مدين' : 'دائن'} ({line.account?.code}) {line.account?.name_ar || line.account?.name}
                                        </span>
                                        <span className="font-bold">
                                            {(parseFloat(line.debit) || parseFloat(line.credit)).toFixed(2)} ريال
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dispatch Modal */}
            <Dialog open={dispatchOpen} onOpenChange={setDispatchOpen}>
                <DialogContent className="sm:max-w-md" dir={isRtl ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-700">
                            <Truck className="w-5 h-5 text-amber-600" />
                            اعتماد شحن التحويل المخزني
                        </DialogTitle>
                        <DialogDescription>
                            سيتم خصم الكميات من مستودع المصدر وترحيل قيد محاسبي إلى حساب (1350 بضاعة بالطريق).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDispatchSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="driver_name">اسم السائق / شركة الشحن *</Label>
                            <Input
                                id="driver_name"
                                value={driverName}
                                onChange={(e) => setDriverName(e.target.value)}
                                placeholder="مثال: شركة النقل السريع أو محمد عبد الله"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="vehicle_plate">رقم لوحة الشاحنة</Label>
                            <Input
                                id="vehicle_plate"
                                value={vehiclePlate}
                                onChange={(e) => setVehiclePlate(e.target.value)}
                                placeholder="مثال: أ ب ج 1234"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="tracking_number">رقم بوليصة / تتبع الشحنة</Label>
                            <Input
                                id="tracking_number"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="مثال: TRK-9847123"
                            />
                        </div>

                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                            <strong>القيد المحاسبي المزدوج التلقائي:</strong>
                            <br />• <strong>مدين:</strong> حساب 1350 (بضاعة بالطريق بين الفروع)
                            <br />• <strong>دائن:</strong> حساب 1300 (بضاعة المخزون) بمبلغ ({parseFloat(transfer.total_value).toLocaleString()} ريال)
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDispatchOpen(false)}
                                disabled={isDispatching}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                disabled={isDispatching}
                            >
                                {isDispatching ? 'جاري ترحيل القيد...' : 'تأكيد الشحن وترحيل القيد'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Receive Modal */}
            <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
                <DialogContent className="sm:max-w-xl" dir={isRtl ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-700">
                            <PackageCheck className="w-5 h-5 text-emerald-600" />
                            تأكيد استلام الشحنة وتدقيق الفروقات
                        </DialogTitle>
                        <DialogDescription>
                            أدخل الكمية المستلمة فعلياً لكل صنف. في حال وجود نقص أو كسر سيتم قيد العجز آلياً بحساب (5260 خسائر وتلف شحن).
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleReceiveSubmit} className="space-y-4 py-2">
                        <div className="space-y-3 max-h-72 overflow-y-auto pe-1">
                            {transfer.lines.map((line) => {
                                const maxQty = parseFloat(line.dispatched_quantity || line.quantity);
                                const enteredQty = parseFloat(receivedQuantities[line.id] || '0');
                                const hasShortage = enteredQty < maxQty;

                                return (
                                    <div key={line.id} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-foreground">
                                                {line.product?.name_ar || line.product?.name} ({line.product?.sku})
                                            </span>
                                            <span className="font-mono text-muted-foreground">
                                                المشحون: {maxQty}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-[11px]">الكمية المستلمة فعلياً *</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={maxQty}
                                                    step="0.0001"
                                                    value={receivedQuantities[line.id] || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setReceivedQuantities((prev) => ({ ...prev, [line.id]: val }));
                                                    }}
                                                    required
                                                />
                                            </div>

                                            {hasShortage && (
                                                <div>
                                                    <Label className="text-[11px] text-destructive">سبب العجز / النقص</Label>
                                                    <Input
                                                        value={shortageReasons[line.id] || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setShortageReasons((prev) => ({ ...prev, [line.id]: val }));
                                                        }}
                                                        placeholder="مثال: كسر عبوة أثناء النقل"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                            <strong>التسوية المحاسبية التلقائية:</strong>
                            <br />• <strong>مدين:</strong> حساب 1300 (بضاعة المستودع المستلم)
                            <br />• <strong>مدين:</strong> حساب 5260 (خسائر وتلف شحن بين الفروع) في حال وجود عجز
                            <br />• <strong>دائن:</strong> إقفال حساب 1350 (بضاعة بالطريق)
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setReceiveOpen(false)}
                                disabled={isReceiving}
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isReceiving}
                            >
                                {isReceiving ? 'جاري إثبات الاستلام...' : 'تأكيد الاستلام وتسوية العجز'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
