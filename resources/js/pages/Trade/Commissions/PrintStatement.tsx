import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { HandCoins, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    run: {
        id: string;
        run_number: string;
        period_start: string;
        period_end: string;
        basis: string;
        status: string;
    };
    line: {
        id: string;
        sales_target: string;
        achieved_sales: string;
        achievement_rate: string;
        commission_amount: string;
        bonus_amount: string;
        deductions_amount: string;
        net_payable: string;
        representative?: {
            id: string;
            code: string;
            name: string;
            name_ar?: string;
            phone?: string;
            email?: string;
            plan?: { name: string; basis: string };
            branch?: { name: string };
        };
    };
    company: {
        name: string;
        name_ar?: string;
        vat_number?: string;
        cr_number?: string;
        phone?: string;
        email?: string;
        address?: string;
    };
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function PrintCommissionStatement({ run, line, company, qrCodeDataUri, amountInWords }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-4 sm:p-8 print:p-0 print:bg-white" dir="rtl">
            <Head title={`سند استحقاق عمولة - ${line.representative?.name} - ${run.run_number}`} />

            {/* Print action header (Hidden on print) */}
            <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between print:hidden">
                <button
                    onClick={() => window.history.back()}
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
                >
                    &larr; العودة إلى تفاصيل المسير
                </button>

                <Button onClick={handlePrint} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                    <Printer className="w-4 h-4" />
                    طباعة إشعار الاستحقاق (A4)
                </Button>
            </div>

            {/* Official A4 Voucher Sheet */}
            <div className="max-w-[210mm] mx-auto bg-white text-zinc-900 border border-zinc-200 shadow-lg p-10 print:shadow-none print:border-none print:p-8 space-y-8 font-sans">
                {/* Header with Organization & QR */}
                <div className="flex items-start justify-between border-b-2 border-zinc-900 pb-6">
                    <div className="space-y-1 text-start">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-950">{company.name_ar || company.name}</h1>
                        <p className="text-xs text-zinc-500 font-mono">
                            {company.cr_number && `س.ت: ${company.cr_number} • `}
                            {company.vat_number && `الرقم الضريبي: ${company.vat_number}`}
                        </p>
                        <p className="text-xs text-zinc-500">{company.address || 'المملكة العربية السعودية'}</p>
                    </div>

                    <div className="flex flex-col items-center">
                        {qrCodeDataUri ? (
                            <img src={qrCodeDataUri} alt="Commission QR" className="w-24 h-24 border border-zinc-200 rounded p-1" />
                        ) : (
                            <div className="w-24 h-24 bg-zinc-100 flex items-center justify-center text-xs font-mono">QR</div>
                        )}
                        <span className="text-[10px] font-mono text-zinc-400 mt-1">وثيقة إلكترونية موثقة</span>
                    </div>
                </div>

                {/* Title and Run Reference */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm font-bold">
                        <HandCoins className="w-4 h-4" />
                        سند استحقاق ومخالصة عمولات مبيعات دورية
                    </div>
                    <p className="text-xs font-mono text-zinc-500">
                        رقم المسير: <strong>{run.run_number}</strong> • الفترة من <strong>{run.period_start}</strong> إلى <strong>{run.period_end}</strong>
                    </p>
                </div>

                {/* Representative Info Card */}
                <div className="grid grid-cols-2 gap-4 border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 text-xs">
                    <div>
                        <span className="text-zinc-500">اسم مندوب المبيعات:</span>
                        <div className="font-bold text-sm text-zinc-900 mt-0.5">{line.representative?.name_ar || line.representative?.name}</div>
                    </div>
                    <div>
                        <span className="text-zinc-500">كود المندوب:</span>
                        <div className="font-bold text-sm font-mono text-zinc-900 mt-0.5">{line.representative?.code}</div>
                    </div>
                    <div>
                        <span className="text-zinc-500">الفرع التابع له:</span>
                        <div className="font-medium text-zinc-800 mt-0.5">{line.representative?.branch?.name || 'المركز الرئيسي'}</div>
                    </div>
                    <div>
                        <span className="text-zinc-500">خطة العمولات المعتمدة:</span>
                        <div className="font-medium text-zinc-800 mt-0.5">{line.representative?.plan?.name || 'Standard Tier'}</div>
                    </div>
                </div>

                {/* Performance & Commission Table */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-start divide-y divide-zinc-200">
                        <thead className="bg-zinc-100 text-zinc-700 font-semibold">
                            <tr>
                                <th className="p-3 text-start">البند / البيان المالي</th>
                                <th className="p-3 text-end">القيمة (ريال سعودي)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 font-mono">
                            <tr>
                                <td className="p-3 font-sans text-zinc-700">المستهدف البيعي للفترة (Sales Target)</td>
                                <td className="p-3 text-end font-semibold">{Number(line.sales_target).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-sans text-zinc-700">المبيعات / التحصيلات المحققة الفعلية (Achieved Sales)</td>
                                <td className="p-3 text-end font-bold text-indigo-700">{Number(line.achieved_sales).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-sans text-zinc-700">نسبة تحقيق المستهدف البيعي (%)</td>
                                <td className="p-3 text-end font-bold">{Number(line.achievement_rate).toFixed(2)} %</td>
                            </tr>
                            <tr className="bg-zinc-50/50">
                                <td className="p-3 font-sans text-zinc-800">قيمة العمولة الأساسية المحسوبة طبقاً للشرائح</td>
                                <td className="p-3 text-end font-bold text-zinc-900">{Number(line.commission_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR</td>
                            </tr>
                            {Number(line.bonus_amount) > 0 && (
                                <tr className="bg-purple-50/40">
                                    <td className="p-3 font-sans text-purple-900">بونص وحافز تحقيق الهدف 100%+</td>
                                    <td className="p-3 text-end font-bold text-purple-700">+{Number(line.bonus_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR</td>
                                </tr>
                            )}
                            {Number(line.deductions_amount) > 0 && (
                                <tr className="bg-rose-50/40">
                                    <td className="p-3 font-sans text-rose-900">استقطاعات وتسويات سابقة</td>
                                    <td className="p-3 text-end font-bold text-rose-700">-{Number(line.deductions_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR</td>
                                </tr>
                            )}
                            <tr className="bg-emerald-50 text-emerald-950 font-bold text-sm">
                                <td className="p-3.5 font-sans">صافي مستحقات العمولة القابلة للصرف (Net Payable)</td>
                                <td className="p-3.5 text-end text-emerald-700 font-mono text-base">{Number(line.net_payable).toLocaleString('en-US', { minimumFractionDigits: 2 })} SAR</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Amount in Words (Tafqeet) */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                    <span className="font-semibold text-zinc-600">المبلغ المستحق كتابةً:</span>
                    <div className="font-bold text-zinc-900 text-sm">{amountInWords.ar}</div>
                    <div className="text-zinc-500 font-mono text-[11px]">{amountInWords.en}</div>
                </div>

                {/* Signatures & Declarations */}
                <div className="grid grid-cols-3 gap-6 pt-10 border-t border-zinc-200 text-center text-xs">
                    <div className="space-y-8">
                        <span className="text-zinc-500">إعداد / مدير المبيعات</span>
                        <div className="border-b border-zinc-300 w-32 mx-auto"></div>
                        <span className="text-zinc-400">التوقيع والختم</span>
                    </div>

                    <div className="space-y-8">
                        <span className="text-zinc-500">تدقيق / الإدارة المالية</span>
                        <div className="border-b border-zinc-300 w-32 mx-auto"></div>
                        <span className="text-zinc-400">التوقيع والاعتماد</span>
                    </div>

                    <div className="space-y-8">
                        <span className="text-zinc-500">استلام مندوب المبيعات</span>
                        <div className="border-b border-zinc-300 w-32 mx-auto"></div>
                        <span className="text-zinc-400">الاسم والتوقيع</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
