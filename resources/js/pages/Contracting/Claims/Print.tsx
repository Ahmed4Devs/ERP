import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Printer, Building2, HardHat, FileCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    tax_id?: string;
    phone?: string;
}

interface Project {
    id: string;
    name: string;
    code?: string;
}

interface ClaimItem {
    id: string;
    work_description: string;
    scheduled_value: string | number;
    previous_percentage: string | number;
    current_percentage: string | number;
    current_amount: string | number;
}

interface ContractingClaim {
    id: string;
    claim_number: string;
    claim_date: string;
    contract_value: string | number;
    previous_billed_amount: string | number;
    current_work_amount: string | number;
    retention_rate: string | number;
    retention_amount: string | number;
    net_claim_amount: string | number;
    tax_amount: string | number;
    total_amount: string | number;
    status: string;
    notes?: string;
    project?: Project;
    customer?: Party;
    items?: ClaimItem[];
    invoice?: {
        invoice_number: string;
    };
}

interface Company {
    name: string;
    legal_name?: string;
    tax_number?: string;
    currency?: string;
}

interface Props {
    claim: ContractingClaim;
    company: Company | null;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function ContractingClaimPrint({ claim, company, qrCodeDataUri, amountInWords }: Props) {
    const { isRtl, locale } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;
    const currency = company?.currency || 'SAR';

    const customerName = locale === 'ar'
        ? (claim.customer?.name_ar || claim.customer?.name || 'العميل الموقر')
        : (claim.customer?.name || claim.customer?.name_ar || 'Valued Client');

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 print:bg-white print:p-0">
            <Head title={`شهادة مستخلص مقاولات - ${claim.claim_number}`} />

            {/* Print Action Toolbar (Hidden in Print) */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-sm print:hidden">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link href={`/contracting/claims/${claim.id}`}>
                            <BackIcon className="h-4 w-4" />
                            <span>{isRtl ? 'العودة للمستخلص' : 'Back to Claim'}</span>
                        </Link>
                    </Button>
                    <span className="text-xs text-neutral-500 font-mono">
                        {claim.claim_number}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة شهادة المستخلص (A4)' : 'Print Claim Certificate'}</span>
                    </Button>
                </div>
            </div>

            {/* A4 Progress Claim Certificate Sheet */}
            <div className="max-w-4xl mx-auto bg-white border border-neutral-200 shadow-md p-8 sm:p-10 rounded-2xl text-neutral-900 print:shadow-none print:border-none print:p-4 print:max-w-full">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-6">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest mb-1">
                            <HardHat className="h-4 w-4" />
                            <span>{company?.name || 'شركة مقاولات الإنشاءات الكبرى'}</span>
                        </div>
                        <h1 className="text-2xl font-black text-neutral-900">
                            {isRtl ? 'شهادة إنجاز ومستخلص مقاولات معتمد' : 'Progress Claim Certificate'}
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
                            <span className="inline-block px-3 py-1 rounded-md font-bold bg-amber-50 border border-amber-300 text-amber-900 text-sm">
                                {claim.claim_number}
                            </span>
                            <p className="text-neutral-500 mt-2">{isRtl ? 'تاريخ المستخلص' : 'Claim Date'}:</p>
                            <p className="font-bold text-neutral-900 text-sm">{claim.claim_date}</p>
                            <p className="text-indigo-700 font-semibold text-[11px] mt-0.5">
                                {claim.invoice ? `فاتورة: ${claim.invoice.invoice_number}` : (claim.status === 'certified' ? 'معتمد ومفوتر' : 'مستخلص قيد الاعتماد')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Project & Client Card */}
                <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 mb-6 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'المشروع الإنشائي' : 'Project'}</span>
                            <p className="font-bold text-sm text-neutral-900 mt-0.5 font-sans">{claim.project?.name || '-'}</p>
                        </div>
                        <div>
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'المالك / العميل' : 'Client / Employer'}</span>
                            <p className="font-bold text-sm text-neutral-900 mt-0.5 font-sans">{customerName}</p>
                            {claim.customer?.tax_id && (
                                <p className="font-mono text-neutral-500 text-[11px] mt-0.5">VAT: {claim.customer.tax_id}</p>
                            )}
                        </div>
                        <div>
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'قيمة العقد الإجمالية' : 'Contract Sum'}</span>
                            <p className="font-mono font-bold text-sm text-neutral-900 mt-0.5">
                                {Number(claim.contract_value).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
                            </p>
                        </div>
                        <div>
                            <span className="text-neutral-400 block uppercase font-semibold">{isRtl ? 'المستخلصات السابقة' : 'Previously Billed'}</span>
                            <p className="font-mono font-bold text-sm text-neutral-700 mt-0.5">
                                {Number(claim.previous_billed_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bill of Quantities / Claim Items Table */}
                <div className="rounded-xl border border-neutral-200 overflow-hidden text-xs mb-6">
                    <div className="bg-neutral-100 px-4 py-2.5 font-bold text-neutral-800 border-b border-neutral-200 flex justify-between items-center">
                        <span>{isRtl ? 'جدول بنود الأعمال المنجزة والنسب المئوية' : 'Work Breakdown & Completed Quantities'}</span>
                        <span className="font-mono text-[11px]">{currency}</span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-neutral-50 text-neutral-600 font-semibold border-b border-neutral-200 text-[11px]">
                            <tr>
                                <th className="py-2.5 px-3">{isRtl ? 'وصف بند الأعمال' : 'Description of Work'}</th>
                                <th className="py-2.5 px-3 text-right">{isRtl ? 'القيمة التقديرية للبند' : 'Scheduled Value'}</th>
                                <th className="py-2.5 px-3 text-center">{isRtl ? 'الإنجاز السابق %' : 'Prev %'}</th>
                                <th className="py-2.5 px-3 text-center font-bold">{isRtl ? 'الإنجاز الحالي %' : 'Curr %'}</th>
                                <th className="py-2.5 px-3 text-right font-bold">{isRtl ? 'مستحق الفترة الحالية' : 'Current Due'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 font-mono">
                            {claim.items && claim.items.length > 0 ? (
                                claim.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-neutral-50/50">
                                        <td className="py-2.5 px-3 font-sans font-medium text-neutral-900">{item.work_description}</td>
                                        <td className="py-2.5 px-3 text-right font-bold text-neutral-800">
                                            {Number(item.scheduled_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2.5 px-3 text-center text-neutral-500">{(Number(item.previous_percentage) * 100).toFixed(1)}%</td>
                                        <td className="py-2.5 px-3 text-center font-bold text-indigo-700">{(Number(item.current_percentage) * 100).toFixed(1)}%</td>
                                        <td className="py-2.5 px-3 text-right font-bold text-neutral-900">
                                            {Number(item.current_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-neutral-400 font-sans">{isRtl ? 'لا توجد بنود مفصلة' : 'No items listed.'}</td>
                                </tr>
                            )}

                            {/* Current Work Subtotal */}
                            <tr className="bg-neutral-50 font-bold border-t border-neutral-300">
                                <td colSpan={4} className="py-2.5 px-3 font-sans text-right">{isRtl ? 'إجمالي قيمة الأعمال المنجزة في الفترة' : 'Total Work Completed in Period'}</td>
                                <td className="py-2.5 px-3 text-right text-sm">
                                    {Number(claim.current_work_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Financial Summary & Deductions Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-xs">
                    {/* Retention, Advance Recovery & Tax Breakdown */}
                    <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50 font-mono flex flex-col justify-between">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-neutral-700">
                                <span className="font-sans">{isRtl ? 'قيمة الأعمال المنجزة' : 'Gross Work Amount'}:</span>
                                <span className="font-bold">{Number(claim.current_work_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}</span>
                            </div>
                            {Number(claim.advance_payment_deduction_amount) > 0 && (
                                <div className="flex justify-between items-center text-amber-700">
                                    <span className="font-sans">{isRtl ? `حسم استرداد الدفعة المقدمة (${(Number(claim.advance_payment_deduction_rate || 0) * 100).toFixed(0)}%)` : 'Advance Recovery Deducted'}:</span>
                                    <span className="font-bold">-{Number(claim.advance_payment_deduction_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}</span>
                                </div>
                            )}
                            {Number(claim.retention_amount) > 0 && (
                                <div className="flex justify-between items-center text-rose-700">
                                    <span className="font-sans">{isRtl ? `حسم ضمان حسن التنفيذ (${(Number(claim.retention_rate) * 100).toFixed(0)}% Retention)` : 'Retention Deducted'}:</span>
                                    <span className="font-bold">-{Number(claim.retention_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-neutral-900 border-t border-neutral-200 pt-2 font-bold">
                                <span className="font-sans">{isRtl ? 'صافي الأعمال الخاضعة للضريبة' : 'Net Taxable Subtotal'}:</span>
                                <span>{Number(claim.net_claim_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}</span>
                            </div>
                            <div className="flex justify-between items-center text-indigo-700">
                                <span className="font-sans">{isRtl ? `ضريبة القيمة المضافة (${(Number(claim.tax_rate || 0.15) * 100).toFixed(0)}% VAT)` : `VAT (${(Number(claim.tax_rate || 0.15) * 100).toFixed(0)}%)`}:</span>
                                <span className="font-bold">+{Number(claim.tax_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}</span>
                            </div>
                        </div>
                    </div>

                    {/* Final Net Certificate Card */}
                    <div className="rounded-xl bg-neutral-900 text-white p-5 flex flex-col justify-between">
                        <div>
                            <span className="text-neutral-400 text-[11px] uppercase tracking-wider block font-sans">
                                {isRtl ? 'صافي قيمة المستخلص المعتمدة للصرف' : 'Certified Net Progress Amount'}
                            </span>
                            <div className="text-3xl font-black font-mono mt-1">
                                {Number(claim.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-sans font-normal text-neutral-300">{currency}</span>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-neutral-800">
                            <p className="text-amber-300 font-bold text-xs font-sans leading-relaxed">{amountInWords.ar}</p>
                            <p className="text-neutral-300 italic font-mono text-[11px] mt-0.5">{amountInWords.en}</p>
                        </div>
                    </div>
                </div>

                {/* Tri-Party Contracting Certification Signatures */}
                <div className="pt-6 border-t-2 border-neutral-900 grid grid-cols-3 gap-6 text-center text-xs">
                    <div>
                        <p className="font-bold text-neutral-900">{isRtl ? 'المقاول العام المنفذ' : 'Contractor Representative'}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{company?.name}</p>
                        <div className="h-16 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[10px] text-neutral-400 mt-1">{isRtl ? 'توقيع وختم المقاول' : 'Signature & Seal'}</p>
                    </div>

                    <div>
                        <p className="font-bold text-neutral-900">{isRtl ? 'المهندس الاستشاري المشرف' : 'Supervising Consultant Engineer'}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{isRtl ? 'المصادقة على دقة الإنجاز الفني' : 'Technical Quality Certification'}</p>
                        <div className="h-16 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[10px] text-neutral-400 mt-1">{isRtl ? 'توقيع واعتماد الاستشاري' : 'Consultant Approval'}</p>
                    </div>

                    <div>
                        <p className="font-bold text-neutral-900">{isRtl ? 'صاحب العمل / المالك' : 'Client / Employer Approval'}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{customerName}</p>
                        <div className="h-16 border-b border-dashed border-neutral-300 mt-2"></div>
                        <p className="text-[10px] text-neutral-400 mt-1">{isRtl ? 'الموافقة النهائية والاعتماد للصرف' : 'Final Approval for Payment'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
