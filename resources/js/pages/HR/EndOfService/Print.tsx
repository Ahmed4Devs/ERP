import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Award, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    settlement: {
        id: string;
        settlement_number: string;
        termination_type: string;
        hire_date: string;
        last_working_date: string;
        service_years: string;
        base_salary_amount: string;
        gratuity_entitlement_rate: string;
        gratuity_amount: string;
        unused_leave_days: string;
        leave_compensation_amount: string;
        other_entitlements: string;
        deductions_amount: string;
        net_settlement_amount: string;
        status: string;
        settled_at?: string;
        notes?: string;
        employee?: {
            first_name: string;
            last_name: string;
            first_name_ar?: string;
            last_name_ar?: string;
            employee_number: string;
            national_id?: string;
            department?: { name: string };
            designation?: { name: string };
            iban?: string;
            bank_name?: string;
        };
        branch?: { name: string };
        preparer?: { name: string };
        approver?: { name: string };
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

export default function PrintEndOfService({ settlement, company, qrCodeDataUri, amountInWords }: Props) {
    useEffect(() => {
        // Auto-open print dialog optionally
    }, []);

    const empName = settlement.employee?.first_name_ar
        ? `${settlement.employee.first_name_ar} ${settlement.employee.last_name_ar}`
        : `${settlement.employee?.first_name} ${settlement.employee?.last_name}`;

    return (
        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 p-4 sm:p-8 print:p-0 print:bg-white text-zinc-900">
            <Head title={`مخالصة وتصفية نهاية خدمة - ${settlement.settlement_number}`} />

            {/* Print toolbar */}
            <div className="max-w-[210mm] mx-auto mb-4 flex justify-between items-center print:hidden">
                <Button variant="outline" onClick={() => window.history.back()} className="text-sm">
                    ← العودة / Back
                </Button>
                <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Printer className="w-4 h-4" />
                    طباعة المستند / Print Document (A4)
                </Button>
            </div>

            {/* Printable A4 Sheet */}
            <div className="max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 sm:p-12 shadow-md print:shadow-none print:m-0 print:p-8 flex flex-col justify-between text-sm leading-relaxed border border-zinc-200 print:border-none font-sans">
                {/* Header */}
                <div>
                    <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-6">
                        <div className="space-y-1 text-right">
                            <h2 className="text-xl font-bold text-zinc-900">{company.name_ar || company.name}</h2>
                            <p className="text-xs text-zinc-600">سجل تجاري: {company.cr_number || '1010000001'}</p>
                            <p className="text-xs text-zinc-600">الرقم الضريبي: {company.vat_number || '300000000000003'}</p>
                            <p className="text-xs text-zinc-600">{company.address || 'المملكة العربية السعودية'}</p>
                        </div>

                        <div className="text-center px-4">
                            <div className="inline-flex p-3 bg-zinc-100 rounded-xl mb-1">
                                <Award className="w-8 h-8 text-indigo-700" />
                            </div>
                            <h1 className="text-lg font-bold text-zinc-900">سند تصفية مستحقات ومخالصة نهائية</h1>
                            <p className="text-xs tracking-wider text-zinc-500 font-serif uppercase">Final Settlement & Clearance Certificate</p>
                        </div>

                        <div className="flex flex-col items-center space-y-1">
                            {qrCodeDataUri && (
                                <img src={qrCodeDataUri} alt="QR Code" className="w-20 h-20 border p-1 rounded" />
                            )}
                            <span className="text-[10px] text-zinc-400 font-mono">التحقق الإلكتروني</span>
                        </div>
                    </div>

                    {/* Settlement Meta Bar */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-b border-zinc-200 text-xs bg-zinc-50 px-3 my-4 rounded">
                        <div>
                            <span className="text-zinc-500 block">رقم المخالصة / Ref:</span>
                            <span className="font-bold font-mono text-zinc-900">{settlement.settlement_number}</span>
                        </div>
                        <div className="text-center">
                            <span className="text-zinc-500 block">تاريخ الإجراء / Date:</span>
                            <span className="font-bold text-zinc-900">{settlement.settled_at ? new Date(settlement.settled_at).toLocaleDateString('en-CA') : new Date().toISOString().split('T')[0]}</span>
                        </div>
                        <div className="text-left">
                            <span className="text-zinc-500 block">الحالة / Status:</span>
                            <span className="font-bold text-emerald-700">معتمد ومسوى / Finalized</span>
                        </div>
                    </div>

                    {/* Employee Profile Box */}
                    <div className="border border-zinc-300 rounded-lg p-4 mb-6">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-700 mb-3 border-b pb-1">
                            بيانات الموظف / Employee Information
                        </h3>
                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                            <div>
                                <span className="text-zinc-500 ml-2">اسم الموظف:</span>
                                <span className="font-bold text-zinc-900">{empName}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 ml-2">الرقم الوظيفي:</span>
                                <span className="font-mono font-semibold">{settlement.employee?.employee_number}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 ml-2">الهوية الوطنية / الإقامة:</span>
                                <span className="font-mono">{settlement.employee?.national_id || '-'}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 ml-2">القسم والمسمى:</span>
                                <span>{settlement.employee?.department?.name} - {settlement.employee?.designation?.name}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 ml-2">تاريخ التعيين:</span>
                                <span className="font-mono">{settlement.hire_date}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 ml-2">تاريخ نهاية الخدمة:</span>
                                <span className="font-mono font-bold">{settlement.last_working_date}</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 ml-2">مدة الخدمة الفعلية:</span>
                                <span className="font-bold">{Number(settlement.service_years).toFixed(2)} سنة</span>
                            </div>
                            <div>
                                <span className="text-zinc-500 ml-2">الأجر الأخير المعتمد:</span>
                                <span className="font-bold font-mono">{Number(settlement.base_salary_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR</span>
                            </div>
                        </div>
                    </div>

                    {/* Settlement Breakdown Table */}
                    <div className="mb-6">
                        <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-700 mb-2">
                            تفاصيل الاحتساب المالي وفق نظام العمل السعودي (المادتين 84 و 85)
                        </h3>
                        <table className="w-full border border-zinc-300 text-xs text-right">
                            <thead className="bg-zinc-100 text-zinc-700 font-bold border-b border-zinc-300">
                                <tr>
                                    <th className="p-2.5 border-l border-zinc-300">البيان / Description</th>
                                    <th className="p-2.5 border-l border-zinc-300 w-32 text-center">الأساس / Base</th>
                                    <th className="p-2.5 w-32 text-left">المبلغ / Amount (SAR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                <tr>
                                    <td className="p-2.5 border-l border-zinc-300">
                                        <div className="font-bold">مكافأة نهاية الخدمة (End of Service Gratuity)</div>
                                        <div className="text-[11px] text-zinc-500">
                                            المادتين 84 و 85 (نسبة الاستحقاق: {(Number(settlement.gratuity_entitlement_rate) * 100).toFixed(1)}%)
                                        </div>
                                    </td>
                                    <td className="p-2.5 border-l border-zinc-300 text-center font-mono">
                                        {Number(settlement.service_years).toFixed(2)} سنوات
                                    </td>
                                    <td className="p-2.5 font-bold font-mono text-left">
                                        {Number(settlement.gratuity_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-2.5 border-l border-zinc-300">
                                        <div className="font-bold">بدل رصيد الإجازات السنوية المستحقة (Unused Leave Compensation)</div>
                                        <div className="text-[11px] text-zinc-500">تعويض نقدي عن أيام الإجازة غير المستنفذة</div>
                                    </td>
                                    <td className="p-2.5 border-l border-zinc-300 text-center font-mono">
                                        {settlement.unused_leave_days} يوم
                                    </td>
                                    <td className="p-2.5 font-bold font-mono text-left">
                                        {Number(settlement.leave_compensation_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                {Number(settlement.other_entitlements) > 0 && (
                                    <tr>
                                        <td className="p-2.5 border-l border-zinc-300">بدلات ومستحقات أخرى (Other Entitlements)</td>
                                        <td className="p-2.5 border-l border-zinc-300 text-center">-</td>
                                        <td className="p-2.5 font-bold font-mono text-left">
                                            {Number(settlement.other_entitlements).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                )}
                                {Number(settlement.deductions_amount) > 0 && (
                                    <tr className="bg-rose-50/50">
                                        <td className="p-2.5 border-l border-zinc-300 text-rose-800">
                                            يخصم: سلف وقروض مستردة والتزامات (Deductions & Loan Clearance)
                                        </td>
                                        <td className="p-2.5 border-l border-zinc-300 text-center text-rose-800 font-mono">خصم</td>
                                        <td className="p-2.5 font-bold font-mono text-left text-rose-800">
                                            - {Number(settlement.deductions_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="border-t-2 border-zinc-900 bg-zinc-100 font-bold">
                                <tr>
                                    <td colSpan={2} className="p-3 border-l border-zinc-300 text-left font-bold text-sm">
                                        صافي المستحق النهائي للصرف / Net Payable:
                                    </td>
                                    <td className="p-3 text-left font-mono text-base font-extrabold text-zinc-900">
                                        {Number(settlement.net_settlement_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Written Amount in Words */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded p-3 text-xs mb-6 space-y-1">
                        <div>
                            <span className="text-zinc-500 font-bold ml-1">المبلغ فقط وقدره:</span>
                            <span className="font-semibold text-zinc-900">{amountInWords.ar} لا غير.</span>
                        </div>
                        <div>
                            <span className="text-zinc-500 font-bold ml-1">In Words:</span>
                            <span className="font-semibold text-zinc-900 font-serif">{amountInWords.en} Only.</span>
                        </div>
                    </div>

                    {/* Legal Discharge Statement */}
                    <div className="border border-zinc-300 p-3 rounded text-[11px] text-zinc-700 leading-relaxed bg-zinc-50/70 mb-6">
                        <strong>إقرار وتعهد إبراء ذمة:</strong> أقر أنا الموظف المذكور أعلاه بأنني قد استلمت كامل مستحقاتي النظامية والمالية الناتجة عن فترة عملي لدى المنشأة، بما في ذلك مكافأة نهاية الخدمة وبدل الإجازات وكافة الرواتب والبدلات، وأبرئ ذمة المنشأة إبراءً شاملاً ونهائياً ومانعاً للجهالة من أي حق أو مطالبة حالية أو مستقبلية تتعلق بخدمتي.
                    </div>
                </div>

                {/* Signatures Footer */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-zinc-900 text-center text-xs">
                    <div className="space-y-8">
                        <div className="font-bold text-zinc-800">إعداد الموارد البشرية<br /><span className="text-[10px] text-zinc-400 font-normal">Prepared by HR</span></div>
                        <div className="border-b border-dotted border-zinc-400 mx-6"></div>
                        <div className="text-[10px] text-zinc-400">{settlement.preparer?.name || 'مسؤول شؤون الموظفين'}</div>
                    </div>

                    <div className="space-y-8">
                        <div className="font-bold text-zinc-800">اعتماد الإدارة المالية<br /><span className="text-[10px] text-zinc-400 font-normal">Finance Approval (CFO)</span></div>
                        <div className="border-b border-dotted border-zinc-400 mx-6"></div>
                        <div className="text-[10px] text-zinc-400">{settlement.approver?.name || 'المدير المالي'}</div>
                    </div>

                    <div className="space-y-8">
                        <div className="font-bold text-zinc-800">توقيع واستلام الموظف<br /><span className="text-[10px] text-zinc-400 font-normal">Employee Signature & Receipt</span></div>
                        <div className="border-b border-dotted border-zinc-400 mx-6"></div>
                        <div className="text-[10px] text-zinc-400">التوقيع والتاريخ وبصمة الإبهام</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
