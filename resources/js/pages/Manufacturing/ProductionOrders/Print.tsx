import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Printer, Factory, Boxes, CheckSquare, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Unit {
    code: string;
    name?: string;
    name_ar?: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    unit?: Unit;
}

interface Warehouse {
    id: string;
    name: string;
    code?: string;
}

interface OrderItem {
    id: string;
    product_id: string;
    planned_quantity: string | number;
    consumed_quantity: string | number;
    product?: Product;
}

interface ProductionOrder {
    id: string;
    order_number: string;
    target_quantity: string | number;
    produced_quantity: string | number;
    status: string;
    start_date: string;
    notes?: string;
    finishedProduct?: Product;
    bom?: {
        bom_number: string;
        yield_quantity: string | number;
    };
    sourceWarehouse?: Warehouse;
    destinationWarehouse?: Warehouse;
    items?: OrderItem[];
}

interface Company {
    name: string;
    legal_name?: string;
    tax_number?: string;
    currency?: string;
}

interface Props {
    order: ProductionOrder;
    company: Company | null;
    qrCodeDataUri: string;
}

export default function ProductionOrderPrint({ order, company, qrCodeDataUri }: Props) {
    const { isRtl } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 print:bg-white print:p-0">
            <Head title={`بطاقة أمر إنتاج وتشغيل - ${order.order_number}`} />

            {/* Print Action Toolbar (Hidden in Print) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/manufacturing/orders/${order.id}`}>
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة لأمر الإنتاج' : 'Back to Order'}</span>
                        </Link>
                    </Button>
                    <span className="text-xs text-neutral-500 font-mono">
                        {order.order_number}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة بطاقة التشغيل (A4)' : 'Print Job Card'}</span>
                    </Button>
                </div>
            </div>

            {/* A4 Job Card Traveler Sheet */}
            <div className="max-w-4xl mx-auto bg-white border border-neutral-200 shadow-md p-8 sm:p-10 rounded-2xl text-neutral-900 print:shadow-none print:border-none print:p-4 print:max-w-full">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest mb-1">
                            <Factory className="h-4 w-4" />
                            <span>{company?.name || 'مجمع الصناعات المتقدمة'}</span>
                        </div>
                        <h1 className="text-2xl font-black text-neutral-900">
                            {isRtl ? 'بطاقة أمر تشغيل وإنتاج (Job Card)' : 'Production Work Order Traveler'}
                        </h1>
                        <p className="text-xs text-neutral-500 font-mono mt-0.5">
                            {company?.legal_name} {company?.tax_number ? `| VAT: ${company.tax_number}` : ''}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                        {qrCodeDataUri && (
                            <img
                                src={qrCodeDataUri}
                                alt="Verification QR Code"
                                className="h-20 w-20 border border-neutral-200 rounded p-1 bg-white"
                            />
                        )}
                        <div className="text-xs font-mono">
                            <span className="inline-block px-3 py-1 rounded-md font-bold bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm">
                                {order.order_number}
                            </span>
                            <p className="text-neutral-500 mt-2">{isRtl ? 'تاريخ البدء' : 'Start Date'}:</p>
                            <p className="font-bold text-neutral-900 text-sm">{order.start_date}</p>
                            <p className="text-emerald-700 font-semibold text-[11px] mt-0.5 uppercase">
                                {order.status}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Production Specifications Block */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 mb-6 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2">
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'المنتج التام المستهدف' : 'Finished Product Target'}</span>
                            <h3 className="font-bold text-base text-neutral-900 mt-0.5 font-sans">
                                {order.finishedProduct?.name}
                            </h3>
                            <p className="font-mono text-neutral-500 text-xs">SKU: {order.finishedProduct?.sku}</p>
                        </div>

                        <div>
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'الكمية المستهدفة' : 'Target Quantity'}</span>
                            <p className="font-mono font-bold text-lg text-indigo-700 mt-0.5">
                                {Number(order.target_quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })} {order.finishedProduct?.unit?.code || 'PCS'}
                            </p>
                        </div>

                        <div>
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'الكمية المنجزة فعلياً' : 'Produced Quantity'}</span>
                            <p className="font-mono font-bold text-lg text-emerald-700 mt-0.5">
                                {Number(order.produced_quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })} {order.finishedProduct?.unit?.code || 'PCS'}
                            </p>
                        </div>

                        <div>
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'وصفة التصنيع المعتمدة' : 'BOM Reference'}</span>
                            <p className="font-mono font-semibold text-neutral-800 mt-0.5">{order.bom?.bom_number || '-'}</p>
                        </div>

                        <div>
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'مستودع سحب المواد الخام' : 'Source Warehouse'}</span>
                            <p className="font-semibold text-neutral-800 mt-0.5">{order.sourceWarehouse?.name || '-'}</p>
                        </div>

                        <div className="sm:col-span-2">
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'مستودع تسليم المنتجات التامة' : 'Destination Warehouse'}</span>
                            <p className="font-semibold text-neutral-800 mt-0.5">{order.destinationWarehouse?.name || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Raw Materials Required (BOM Components) Table */}
                <div className="rounded-xl border border-neutral-200 overflow-hidden text-xs mb-6">
                    <div className="bg-neutral-100 px-4 py-2.5 font-bold text-neutral-800 border-b border-neutral-200 flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-indigo-600" />
                            <span>{isRtl ? 'قائمة المواد الخام والمكونات المقررة للتشغيل (BOM Components)' : 'Required Raw Materials'}</span>
                        </span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 text-[11px]">
                            <tr>
                                <th className="py-2.5 px-3">{isRtl ? 'رمز المادة' : 'SKU'}</th>
                                <th className="py-2.5 px-3">{isRtl ? 'اسم المادة الخام / المكون' : 'Material Description'}</th>
                                <th className="py-2.5 px-3 text-center">{isRtl ? 'الوحدة' : 'UOM'}</th>
                                <th className="py-2.5 px-3 text-right font-bold">{isRtl ? 'الكمية المقررة صرفها' : 'Planned Qty'}</th>
                                <th className="py-2.5 px-3 text-right font-bold">{isRtl ? 'الكمية المستهلكة فعلياً' : 'Consumed Qty'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-mono">
                            {order.items && order.items.length > 0 ? (
                                order.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-neutral-50/50">
                                        <td className="py-2.5 px-3 font-bold text-neutral-600">{item.product?.sku}</td>
                                        <td className="py-2.5 px-3 font-sans font-medium text-neutral-900">{item.product?.name}</td>
                                        <td className="py-2.5 px-3 text-center text-neutral-500">{item.product?.unit?.code || 'pc'}</td>
                                        <td className="py-2.5 px-3 text-right font-bold text-neutral-800">
                                            {Number(item.planned_quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                                            {Number(item.consumed_quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-neutral-400 font-sans">{isRtl ? 'لا توجد مكونات مسجلة' : 'No components.'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Production Routing & Quality Check Stages */}
                <div className="rounded-xl border border-neutral-200 overflow-hidden text-xs mb-8">
                    <div className="bg-neutral-100 px-4 py-2 font-bold text-neutral-800 border-b border-neutral-200 flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-indigo-600" />
                        <span>{isRtl ? 'مراحل ومسارات التشغيل والتحقق الفني (Quality & Routing Checklist)' : 'Operations & QC Routing'}</span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 text-neutral-600 text-[11px] border-b border-neutral-200">
                            <tr>
                                <th className="py-2 px-3 w-12 text-center">#</th>
                                <th className="py-2 px-3">{isRtl ? 'المرحلة التشغيلية' : 'Routing Stage'}</th>
                                <th className="py-2 px-3">{isRtl ? 'معايير الفحص والضبط الفني' : 'Quality Inspection Standards'}</th>
                                <th className="py-2 px-3 text-center w-28">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="py-2 px-3 text-center w-32">{isRtl ? 'توقيع الفني' : 'Technician Sign'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-sans">
                            <tr>
                                <td className="py-2.5 px-3 font-mono text-center font-bold">1</td>
                                <td className="py-2.5 px-3 font-semibold text-neutral-900">{isRtl ? 'صرف ومعاينة المواد الخام' : 'Material Picking & Verification'}</td>
                                <td className="py-2.5 px-3 text-neutral-600">{isRtl ? 'مطابقة أرقام التشغيلات والباركود وسلامة التغليف' : 'Batch, barcode, and packaging integrity'}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">[ OK ]</td>
                                <td className="py-2.5 px-3 border-b border-dashed"></td>
                            </tr>
                            <tr>
                                <td className="py-2.5 px-3 font-mono text-center font-bold">2</td>
                                <td className="py-2.5 px-3 font-semibold text-neutral-900">{isRtl ? 'إعداد وضبط خط التصنيع' : 'Machine Setup & Calibration'}</td>
                                <td className="py-2.5 px-3 text-neutral-600">{isRtl ? 'معايرة القوالب ودرجات الحرارة وضغط التشغيل' : 'Mold calibration, temperatures, and pressure'}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">[ OK ]</td>
                                <td className="py-2.5 px-3 border-b border-dashed"></td>
                            </tr>
                            <tr>
                                <td className="py-2.5 px-3 font-mono text-center font-bold">3</td>
                                <td className="py-2.5 px-3 font-semibold text-neutral-900">{isRtl ? 'فحص الجودة وضبط الأبعاد' : 'In-Process Quality Inspection'}</td>
                                <td className="py-2.5 px-3 text-neutral-600">{isRtl ? 'فحص العينات العشوائية ومطابقة الأوزان والمواصفات' : 'Random sampling, weights, and dimensional checks'}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">[ OK ]</td>
                                <td className="py-2.5 px-3 border-b border-dashed"></td>
                            </tr>
                            <tr>
                                <td className="py-2.5 px-3 font-mono text-center font-bold">4</td>
                                <td className="py-2.5 px-3 font-semibold text-neutral-900">{isRtl ? 'التعبئة والتغليف والاستلام النهائي' : 'Packaging & Final Warehouse Receipt'}</td>
                                <td className="py-2.5 px-3 text-neutral-600">{isRtl ? 'إيداع المنتجات التامة بالمستودع وطباعة الملصقات' : 'Barcode tagging and transfer to warehouse'}</td>
                                <td className="py-2.5 px-3 text-center font-mono text-emerald-700 font-bold">[ OK ]</td>
                                <td className="py-2.5 px-3 border-b border-dashed"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Signatures Block */}
                <div className="pt-6 border-t-2 border-neutral-900 grid grid-cols-3 gap-6 text-center text-xs">
                    <div>
                        <p className="font-bold text-neutral-900">{isRtl ? 'مهندس / مشرف الإنتاج' : 'Production Supervisor'}</p>
                        <div className="h-16 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[10px] text-neutral-400 mt-1">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                    </div>

                    <div>
                        <p className="font-bold text-neutral-900">{isRtl ? 'مراقب ضبط الجودة (QC)' : 'Quality Control Inspector'}</p>
                        <div className="h-16 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[10px] text-neutral-400 mt-1">{isRtl ? 'اعتماد الجودة والمواصفات' : 'QC Acceptance Stamp'}</p>
                    </div>

                    <div>
                        <p className="font-bold text-neutral-900">{isRtl ? 'أمين مستودع المنتجات التامة' : 'Finished Goods Warehouse Keeper'}</p>
                        <div className="h-16 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[10px] text-neutral-400 mt-1">{isRtl ? 'توقيع استلام الكمية الفعلية' : 'Receipt Confirmation'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
