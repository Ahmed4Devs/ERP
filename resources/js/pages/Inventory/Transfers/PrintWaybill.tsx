import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, Truck, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransferLine {
    id: string;
    quantity: string;
    dispatched_quantity?: string;
    received_quantity?: string;
    shortage_quantity?: string;
    unit_cost: string;
    line_total: string;
    product: {
        sku: string;
        name: string;
        name_ar?: string;
        unit?: {
            code: string;
        };
    };
}

interface StockTransfer {
    id: string;
    transfer_number: string;
    date: string;
    status: string;
    total_value: string;
    shortage_value: string;
    driver_name?: string;
    vehicle_plate?: string;
    tracking_number?: string;
    dispatched_at?: string;
    received_at?: string;
    from_warehouse: {
        code: string;
        name: string;
    };
    to_warehouse: {
        code: string;
        name: string;
    };
    lines: TransferLine[];
    notes?: string;
}

interface Props {
    transfer: StockTransfer;
}

export default function PrintWaybill({ transfer }: Props) {
    useEffect(() => {
        // Auto print after mount
        const timer = setTimeout(() => {
            window.print();
        }, 600);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-white text-black p-8 max-w-4xl mx-auto font-sans" dir="rtl">
            <Head title={`بوليصة نقل داخلي - ${transfer.transfer_number}`} />

            {/* Print Controls (Hidden when printing) */}
            <div className="mb-6 flex justify-between items-center print:hidden border-b pb-4">
                <span className="text-sm text-neutral-600">معاينة طباعة بوليصة شحن ونقل بضائع داخلية (A4)</span>
                <Button onClick={() => window.print()} className="flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    طباعة البوليصة
                </Button>
            </div>

            {/* Document Header */}
            <div className="border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">شركة الأمل التجارية المحدودة</h1>
                        <p className="text-xs text-neutral-600 mt-0.5">سجل تجاري: 1010123456 | الرقم الضريبي: 300012345600003</p>
                        <p className="text-xs text-neutral-600">المملكة العربية السعودية - الرياض</p>
                    </div>
                    <div className="text-left" dir="ltr">
                        <div className="text-xl font-bold font-mono">INTERNAL WAYBILL</div>
                        <div className="text-sm font-bold font-mono text-neutral-700">{transfer.transfer_number}</div>
                        <div className="text-xs text-neutral-500 mt-1">Date: {transfer.date}</div>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <span className="inline-block border-2 border-black px-6 py-1 text-base font-bold bg-neutral-100">
                        بوليصة نقل وشحن بضائع داخلية بين الفروع
                    </span>
                </div>
            </div>

            {/* Shipping & Route Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="border border-neutral-300 rounded p-3 bg-neutral-50">
                    <div className="font-bold text-xs text-neutral-500 mb-1 border-b pb-1">مستودع المصدر (الشحن)</div>
                    <div className="font-bold">{transfer.from_warehouse?.name}</div>
                    <div className="text-xs font-mono text-neutral-600">رمز المستودع: {transfer.from_warehouse?.code}</div>
                    {transfer.dispatched_at && (
                        <div className="text-xs text-neutral-600 mt-1">تاريخ ووقت الشحن: {transfer.dispatched_at}</div>
                    )}
                </div>

                <div className="border border-neutral-300 rounded p-3 bg-neutral-50">
                    <div className="font-bold text-xs text-neutral-500 mb-1 border-b pb-1">مستودع المقصد (الاستلام)</div>
                    <div className="font-bold">{transfer.to_warehouse?.name}</div>
                    <div className="text-xs font-mono text-neutral-600">رمز المستودع: {transfer.to_warehouse?.code}</div>
                    {transfer.received_at && (
                        <div className="text-xs text-neutral-600 mt-1">تاريخ ووقت الاستلام: {transfer.received_at}</div>
                    )}
                </div>
            </div>

            {/* Carrier & Vehicle Details */}
            <div className="border border-neutral-300 rounded p-3 mb-6 text-sm bg-neutral-50">
                <div className="font-bold text-xs text-neutral-500 mb-2 border-b pb-1">بيانات الناقل والشاحنة</div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <span className="text-xs text-neutral-500 block">اسم السائق / الناقل:</span>
                        <span className="font-bold">{transfer.driver_name || 'غير محدد'}</span>
                    </div>
                    <div>
                        <span className="text-xs text-neutral-500 block">رقم لوحة الشاحنة:</span>
                        <span className="font-mono font-bold">{transfer.vehicle_plate || 'غير محدد'}</span>
                    </div>
                    <div>
                        <span className="text-xs text-neutral-500 block">رقم بوليصة / تتبع الشحنة:</span>
                        <span className="font-mono font-bold">{transfer.tracking_number || transfer.transfer_number}</span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs border border-neutral-300 mb-6">
                <thead className="bg-neutral-100 border-b border-neutral-300">
                    <tr>
                        <th className="p-2 text-right border-l">#</th>
                        <th className="p-2 text-right border-l">رمز الصنف (SKU)</th>
                        <th className="p-2 text-right border-l">بيان الصنف</th>
                        <th className="p-2 text-center border-l">الوحدة</th>
                        <th className="p-2 text-center border-l">الكمية المشحونة</th>
                        <th className="p-2 text-center border-l">الكمية المستلمة</th>
                        <th className="p-2 text-center">ملاحظات / عجز</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                    {transfer.lines?.map((line, idx) => {
                        const dispQty = parseFloat(line.dispatched_quantity || line.quantity);
                        const recQty = line.received_quantity ? parseFloat(line.received_quantity) : null;
                        const shortQty = line.shortage_quantity ? parseFloat(line.shortage_quantity) : 0;

                        return (
                            <tr key={line.id}>
                                <td className="p-2 text-right border-l font-mono">{idx + 1}</td>
                                <td className="p-2 text-right border-l font-mono">{line.product?.sku}</td>
                                <td className="p-2 text-right border-l font-medium">
                                    {line.product?.name_ar || line.product?.name}
                                </td>
                                <td className="p-2 text-center border-l">{line.product?.unit?.code || 'حبة'}</td>
                                <td className="p-2 text-center border-l font-mono font-bold">{dispQty.toLocaleString()}</td>
                                <td className="p-2 text-center border-l font-mono font-bold">{recQty !== null ? recQty.toLocaleString() : '-'}</td>
                                <td className="p-2 text-center font-mono">
                                    {shortQty > 0 ? `عجز: ${shortQty}` : '-'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Signatures & Official Approvals */}
            <div className="border-t-2 border-black pt-4 mt-8">
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                    <div className="border border-neutral-300 p-3 rounded h-28 flex flex-col justify-between">
                        <span className="font-bold">مسؤول مستودع المصدر (الشحن)</span>
                        <div className="border-b border-dashed border-neutral-400 my-2"></div>
                        <span className="text-neutral-500">التوقيع والختم</span>
                    </div>

                    <div className="border border-neutral-300 p-3 rounded h-28 flex flex-col justify-between">
                        <span className="font-bold">السائق الناقل (إقرار بالاستلام)</span>
                        <div className="border-b border-dashed border-neutral-400 my-2"></div>
                        <span className="text-neutral-500">التوقيع ورقم الهوية</span>
                    </div>

                    <div className="border border-neutral-300 p-3 rounded h-28 flex flex-col justify-between">
                        <span className="font-bold">مسؤول مستودع المقصد (الاستلام)</span>
                        <div className="border-b border-dashed border-neutral-400 my-2"></div>
                        <span className="text-neutral-500">التوقيع وتاريخ الفحص</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
