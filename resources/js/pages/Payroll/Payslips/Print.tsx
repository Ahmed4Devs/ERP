import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ArrowLeft, Printer, ShieldCheck, User, Building2, Banknote, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Department {
    name: string;
    name_ar?: string;
}

interface Designation {
    name: string;
    name_ar?: string;
}

interface Employee {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    first_name_ar?: string;
    last_name_ar?: string;
    national_id?: string;
    bank_name?: string;
    iban?: string;
    department?: Department;
    designation?: Designation;
}

interface PayrollRun {
    id: string;
    run_number: string;
    period_year: number;
    period_month: number;
    payment_date: string;
}

interface Payslip {
    id: string;
    payroll_run_id: string;
    basic_salary: string | number;
    housing_allowance: string | number;
    transport_allowance: string | number;
    other_allowances: string | number;
    overtime_amount: string | number;
    gross_salary: string | number;
    social_insurance_deduction: string | number;
    other_deductions: string | number;
    total_deductions: string | number;
    net_salary: string | number;
    status: string;
    employee?: Employee;
    payroll_run?: PayrollRun;
}

interface Company {
    name: string;
    legal_name?: string;
    tax_number?: string;
    currency?: string;
}

interface Props {
    payslip: Payslip;
    company: Company | null;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function PayslipPrint({ payslip, company, qrCodeDataUri, amountInWords }: Props) {
    const { isRtl, locale } = useTranslation();

    const BackIcon = isRtl ? ArrowRight : ArrowLeft;
    const employee = payslip.employee;
    const run = payslip.payroll_run;
    const currency = company?.currency || 'SAR';

    const employeeName = locale === 'ar'
        ? trim(`${employee?.first_name_ar || employee?.first_name || ''} ${employee?.last_name_ar || employee?.last_name || ''}`)
        : trim(`${employee?.first_name || ''} ${employee?.last_name || ''}`);

    const departmentName = locale === 'ar'
        ? (employee?.department?.name_ar || employee?.department?.name || '-')
        : (employee?.department?.name || employee?.department?.name_ar || '-');

    const designationName = locale === 'ar'
        ? (employee?.designation?.name_ar || employee?.designation?.name || '-')
        : (employee?.designation?.name || employee?.designation?.name_ar || '-');

    function trim(str: string) {
        return str.trim();
    }

    const monthNames = [
        'يناير (January)', 'فبراير (February)', 'مارس (March)', 'أبريل (April)',
        'مايو (May)', 'يونيو (June)', 'يوليو (July)', 'أغسطس (August)',
        'سبتمبر (September)', 'أكتوبر (October)', 'نوفمبر (November)', 'ديسمبر (December)',
    ];

    const periodLabel = run ? `${monthNames[run.period_month - 1] || run.period_month} ${run.period_year}` : '';

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 print:bg-white print:p-0">
            <Head title={`قسيمة راتب - ${employee?.employee_number} - ${employeeName}`} />

            {/* Print Action Toolbar */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/payroll/runs/${payslip.payroll_run_id}`}>
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة لمسير الرواتب' : 'Back to Payroll Run'}</span>
                        </Link>
                    </Button>
                    <span className="text-xs text-neutral-500 font-mono">
                        {run?.run_number} / {employee?.employee_number}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة قسيمة الراتب' : 'Print Payslip'}</span>
                    </Button>
                </div>
            </div>

            {/* A4 Payslip Document */}
            <div className="max-w-4xl mx-auto bg-white border border-neutral-200 shadow-md p-8 sm:p-10 rounded-2xl text-neutral-900 print:shadow-none print:border-none print:p-4 print:max-w-full">
                {/* Official Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest mb-1">
                            <Building2 className="h-4 w-4" />
                            <span>{company?.name || 'مؤسسة الأعمال المتقدمة'}</span>
                        </div>
                        <h1 className="text-2xl font-black text-neutral-900">
                            {isRtl ? 'قسيمة راتب شهرية رسمية' : 'Official Employee Payslip'}
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
                            <span className="inline-block px-2.5 py-0.5 rounded font-bold bg-neutral-100 border border-neutral-300 text-neutral-800">
                                {run?.run_number}
                            </span>
                            <p className="text-neutral-500 mt-1.5">{isRtl ? 'الفترة المالية' : 'Period'}:</p>
                            <p className="font-bold text-neutral-900 text-xs">{periodLabel}</p>
                            <p className="text-neutral-400 text-[11px] mt-0.5">{run?.payment_date}</p>
                        </div>
                    </div>
                </div>

                {/* Employee Information Block */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 mb-6 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <span className="text-neutral-400 block">{isRtl ? 'الرقم الوظيفي' : 'Employee ID'}</span>
                            <span className="font-mono font-bold text-sm text-neutral-900">{employee?.employee_number}</span>
                        </div>
                        <div>
                            <span className="text-neutral-400 block">{isRtl ? 'اسم الموظف' : 'Employee Name'}</span>
                            <span className="font-bold text-sm text-neutral-900">{employeeName}</span>
                        </div>
                        <div>
                            <span className="text-neutral-400 block">{isRtl ? 'الإدارة / القسم' : 'Department'}</span>
                            <span className="font-semibold text-neutral-800">{departmentName}</span>
                        </div>
                        <div>
                            <span className="text-neutral-400 block">{isRtl ? 'المسمى الوظيفي' : 'Designation'}</span>
                            <span className="font-semibold text-neutral-800">{designationName}</span>
                        </div>

                        <div>
                            <span className="text-neutral-400 block">{isRtl ? 'الهوية / الإقامة' : 'National ID / Iqama'}</span>
                            <span className="font-mono font-semibold text-neutral-800">{employee?.national_id || '-'}</span>
                        </div>
                        <div>
                            <span className="text-neutral-400 block">{isRtl ? 'المصرف المحول له' : 'Bank'}</span>
                            <span className="font-semibold text-neutral-800">{employee?.bank_name || '-'}</span>
                        </div>
                        <div className="sm:col-span-2">
                            <span className="text-neutral-400 block">{isRtl ? 'رقم الآيبان الدولي (IBAN)' : 'IBAN'}</span>
                            <span className="font-mono font-bold text-xs text-neutral-900 tracking-wider">{employee?.iban || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Left: Gross Earnings */}
                    <div className="rounded-xl border border-neutral-200 overflow-hidden text-xs">
                        <div className="bg-emerald-50 text-emerald-900 px-4 py-2.5 font-bold border-b border-neutral-200 flex justify-between items-center">
                            <span>{isRtl ? 'المستحقات والبدلات (Earnings)' : 'Earnings'}</span>
                            <span className="font-mono text-[11px]">{currency}</span>
                        </div>
                        <table className="w-full">
                            <tbody className="divide-y divide-neutral-100 font-mono">
                                <tr>
                                    <td className="py-2.5 px-4 font-sans text-neutral-700">{isRtl ? 'الراتب الأساسي' : 'Basic Salary'}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-neutral-900">
                                        {Number(payslip.basic_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-4 font-sans text-neutral-700">{isRtl ? 'بدل السكن' : 'Housing Allowance'}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-neutral-900">
                                        {Number(payslip.housing_allowance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-4 font-sans text-neutral-700">{isRtl ? 'بدل النقل والمواصلات' : 'Transport Allowance'}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-neutral-900">
                                        {Number(payslip.transport_allowance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-4 font-sans text-neutral-700">{isRtl ? 'بدلات ومزايا أخرى' : 'Other Allowances'}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-neutral-900">
                                        {Number(payslip.other_allowances).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-4 font-sans text-neutral-700">{isRtl ? 'العمل الإضافي' : 'Overtime'}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-neutral-900">
                                        {Number(payslip.overtime_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="bg-emerald-50/70 font-bold border-t border-neutral-300">
                                    <td className="py-2.5 px-4 font-sans text-emerald-950">{isRtl ? 'إجمالي الراتب المستحق' : 'Gross Earnings'}</td>
                                    <td className="py-2.5 px-4 text-right text-emerald-950 font-black">
                                        {Number(payslip.gross_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Right: Deductions */}
                    <div className="rounded-xl border border-neutral-200 overflow-hidden text-xs">
                        <div className="bg-rose-50 text-rose-900 px-4 py-2.5 font-bold border-b border-neutral-200 flex justify-between items-center">
                            <span>{isRtl ? 'الاستقطاعات والخصومات (Deductions)' : 'Deductions'}</span>
                            <span className="font-mono text-[11px]">{currency}</span>
                        </div>
                        <table className="w-full">
                            <tbody className="divide-y divide-neutral-100 font-mono">
                                <tr>
                                    <td className="py-2.5 px-4 font-sans text-neutral-700">{isRtl ? 'التأمينات الاجتماعية (GOSI حصة الموظف)' : 'GOSI (Employee Share)'}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-rose-700">
                                        {Number(payslip.social_insurance_deduction).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2.5 px-4 font-sans text-neutral-700">{isRtl ? 'استقطاعات وجزاءات أخرى' : 'Other Deductions'}</td>
                                    <td className="py-2.5 px-4 text-right font-bold text-rose-700">
                                        {Number(payslip.other_deductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                                <tr className="bg-rose-50/70 font-bold border-t border-neutral-300">
                                    <td className="py-2.5 px-4 font-sans text-rose-950">{isRtl ? 'إجمالي الاستقطاعات' : 'Total Deductions'}</td>
                                    <td className="py-2.5 px-4 text-right text-rose-950 font-black">
                                        {Number(payslip.total_deductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Net Salary Payable & Tafqeet Card */}
                <div className="rounded-xl bg-neutral-900 text-white p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <span className="text-xs text-neutral-400 font-semibold tracking-wider uppercase">
                            {isRtl ? 'صافي الراتب المستحق للتحويل' : 'Net Salary Payable'}
                        </span>
                        <div className="text-3xl font-black font-mono tracking-tight text-white mt-1">
                            {Number(payslip.net_salary).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-sans font-normal text-neutral-300">{currency}</span>
                        </div>
                    </div>

                    <div className="sm:text-right max-w-md">
                        <span className="text-[11px] text-neutral-400 block mb-1">{isRtl ? 'المبلغ كتابة بالحروف' : 'Amount in Words'}:</span>
                        <p className="text-xs font-bold text-amber-300 leading-relaxed font-sans">
                            {amountInWords.ar}
                        </p>
                        <p className="text-[11px] text-neutral-300 italic font-mono mt-0.5">
                            {amountInWords.en}
                        </p>
                    </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 border-t border-neutral-200 grid grid-cols-3 gap-8 text-center text-xs">
                    <div>
                        <p className="font-semibold text-neutral-800">{isRtl ? 'إعداد قسم الرواتب' : 'Prepared by Payroll'}</p>
                        <div className="h-14 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-neutral-800">{isRtl ? 'اعتماد الموارد البشرية والمالية' : 'HR & Finance Approval'}</p>
                        <div className="h-14 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'التوقيع والختم' : 'Stamp & Signature'}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-neutral-800">{isRtl ? 'إقرار واستلام الموظف' : 'Employee Acceptance'}</p>
                        <div className="h-14 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'توقيع المستلم' : 'Receiver Signature'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
