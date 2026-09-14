import { Head } from '@inertiajs/react';
import { Truck, Printer, CheckCircle2, Shield, MapPin, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Stop {
    id: string;
    stop_sequence: number;
    destination_address: string;
    recipient_contact_phone?: string;
    cod_amount_due: string;
    status: string;
    customer: {
        name: string;
        name_ar?: string;
        phone?: string;
    };
    delivery_note?: { delivery_number: string };
}

interface Props {
    trip: {
        id: string;
        trip_number: string;
        scheduled_date: string;
        route_notes?: string;
        total_deliveries_count: number;
        total_cod_expected: string;
        driver: {
            name: string;
            name_ar?: string;
            phone: string;
            code: string;
        };
        vehicle: {
            plate_number: string;
            model: string;
        };
        departure_warehouse?: { name: string };
        stops: Stop[];
    };
    company: {
        name: string;
        name_ar?: string;
        tax_number?: string;
    };
    qrSvg: string;
}

export default function DispatchPrintManifest({ trip, company, qrSvg }: Props) {
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 md:p-8 flex flex-col items-center justify-center print:bg-white print:p-0">
            <Head title={`كشف رحلة التوزيع - ${trip.trip_number}`} />

            {/* Print action toolbar */}
            <div className="mb-6 flex gap-3 print:hidden">
                <Button
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                    <Printer className="w-4 h-4 ml-2" />
                    طباعة كشف أذونات الشحن (A4)
                </Button>
                <Button variant="outline" onClick={() => window.close()}>
                    إغلاق النافذة
                </Button>
            </div>

            {/* A4 Sheet Container */}
            <div className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-xl p-8 md:p-10 border space-y-6 print:shadow-none print:border-none print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-4">
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-slate-900">
                            {company.name_ar || company.name}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            كشف خط سير وتسليمات رحلة التوزيع (Delivery Dispatch Manifest)
                        </p>
                        {company.tax_number && (
                            <p className="text-[11px] font-mono text-slate-400">
                                الرقم الضريبي: {company.tax_number}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-left font-mono text-xs">
                            <span className="text-slate-400 block text-[10px]">رقم الرحلة:</span>
                            <span className="font-bold text-base text-blue-600">{trip.trip_number}</span>
                            <span className="text-slate-500 block text-[10px] mt-0.5">
                                التاريخ: {new Date(trip.scheduled_date).toLocaleDateString('ar-SA')}
                            </span>
                        </div>
                        <div
                            className="p-1 bg-white rounded border"
                            dangerouslySetInnerHTML={{ __html: qrSvg }}
                        />
                    </div>
                </div>

                {/* Driver & Vehicle Metadata Card */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border text-xs">
                    <div>
                        <span className="text-slate-400 block">السائق المسؤول:</span>
                        <strong className="text-slate-800 text-sm">
                            {trip.driver.name_ar || trip.driver.name}
                        </strong>
                        <p className="text-[11px] font-mono text-slate-500">{trip.driver.phone}</p>
                    </div>

                    <div>
                        <span className="text-slate-400 block">المركبة ولوحة الشحن:</span>
                        <strong className="text-slate-800 text-sm font-mono">
                            {trip.vehicle.plate_number}
                        </strong>
                        <p className="text-[11px] text-slate-500">{trip.vehicle.model}</p>
                    </div>

                    <div>
                        <span className="text-slate-400 block">مستودع الانطلاق:</span>
                        <strong className="text-slate-800 text-sm">
                            {trip.departure_warehouse?.name || 'المستودع الرئيسي'}
                        </strong>
                        <p className="text-[11px] font-mono text-emerald-600 font-bold">
                            إجمالي الـ COD: {Number(trip.total_cod_expected).toFixed(2)} ر.س
                        </p>
                    </div>
                </div>

                {/* Deliveries Table */}
                <div className="space-y-2">
                    <h4 className="font-bold text-xs text-slate-800">
                        قائمة محطات وعملاء الرحلة ({trip.stops.length} محطات):
                    </h4>
                    <table className="w-full text-xs text-right border-collapse border border-slate-200">
                        <thead className="bg-slate-100 text-slate-700">
                            <tr>
                                <th className="p-2 border border-slate-200 text-center w-8">#</th>
                                <th className="p-2 border border-slate-200">العميل ورقم التواصل</th>
                                <th className="p-2 border border-slate-200">عنوان التسليم التفصيلي</th>
                                <th className="p-2 border border-slate-200 text-center w-24">إذن الشحن</th>
                                <th className="p-2 border border-slate-200 text-center w-28">المبلغ المطلوب (COD)</th>
                                <th className="p-2 border border-slate-200 text-center w-40">توقيع وختم العميل بالاستلام</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trip.stops.map((stop) => (
                                <tr key={stop.id} className="border-b border-slate-200">
                                    <td className="p-2.5 border border-slate-200 text-center font-bold font-mono">
                                        {stop.stop_sequence}
                                    </td>
                                    <td className="p-2.5 border border-slate-200">
                                        <p className="font-bold text-slate-900">
                                            {stop.customer.name_ar || stop.customer.name}
                                        </p>
                                        <p className="text-[10px] font-mono text-slate-500">
                                            {stop.recipient_contact_phone || stop.customer.phone || '-'}
                                        </p>
                                    </td>
                                    <td className="p-2.5 border border-slate-200 text-[11px] text-slate-600 max-w-xs">
                                        {stop.destination_address}
                                    </td>
                                    <td className="p-2.5 border border-slate-200 text-center font-mono font-semibold">
                                        {stop.delivery_note?.delivery_number || '-'}
                                    </td>
                                    <td className="p-2.5 border border-slate-200 text-center font-mono font-bold text-slate-800">
                                        {Number(stop.cod_amount_due) > 0
                                            ? `${Number(stop.cod_amount_due).toFixed(2)} ر.س`
                                            : 'مدفوع مسبقاً'}
                                    </td>
                                    <td className="p-2 border border-slate-200 text-center">
                                        <div className="h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400">
                                            توقيع المستلم
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Sign-off Footers */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t text-xs text-slate-600">
                    <div className="space-y-4">
                        <p className="font-semibold text-slate-800">مسؤول الحركة والترحيل:</p>
                        <div className="h-10 border-b border-slate-400"></div>
                        <p className="text-[10px] text-slate-400">الاسم والتوقيع</p>
                    </div>

                    <div className="space-y-4">
                        <p className="font-semibold text-slate-800">إقرار وتوقيع السائق المستلم:</p>
                        <div className="h-10 border-b border-slate-400"></div>
                        <p className="text-[10px] text-slate-400">استلمت كامل البضاعة وأذونات الشحن</p>
                    </div>

                    <div className="space-y-4">
                        <p className="font-semibold text-slate-800">أمين الصندوق (توريد الـ COD):</p>
                        <div className="h-10 border-b border-slate-400"></div>
                        <p className="text-[10px] text-slate-400">ختم استلام المبالغ النقدية</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
