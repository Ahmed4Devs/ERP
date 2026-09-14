import { Head, Link } from '@inertiajs/react';
import { Printer, ArrowLeft, Building2, Receipt, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    settlement: any;
    company: any;
    tafqeet: string;
}

export default function CustodySettlementPrint({ settlement, company, tafqeet }: Props) {
    const custody = settlement.custody;
    const employee = custody?.employee;

    const formatMoney = (val: number | string) => {
        return Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' SAR';
    };

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 p-4 sm:p-8 flex flex-col items-center">
            <Head title={`سند تسوية عهدة - ${settlement.settlement_number}`} />

            {/* Action Bar (Hidden in print) */}
            <div className="w-full max-w-4xl mb-6 flex items-center justify-between print:hidden">
                <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href={`/hr/custodies/${custody.id}`}>
                        <ArrowLeft className="h-4 w-4" />
                        <span>الرجوع للعهدة</span>
                    </Link>
                </Button>

                <Button onClick={() => window.print()} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                    <Printer className="h-4 w-4" />
                    <span>طباعة سند التسوية (Print)</span>
                </Button>
            </div>

            {/* Official Voucher Document (A4 Printable) */}
            <div
                className="w-full max-w-4xl bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl p-8 sm:p-12 shadow-xl text-neutral-900 dark:text-neutral-100 print:shadow-none print:border-none print:p-4 print:max-w-none print:w-full"
                dir="rtl"
            >
                {/* Official Letterhead */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 dark:border-neutral-100 pb-6 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            {company?.legal_name || company?.name}
                        </h1>
                        <p className="text-xs text-neutral-500 mt-1 font-mono">
                            الرقم الضريبي: {company?.tax_number} &bull; السجل التجاري: {company?.commercial_registration || 'غير مسجل'}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">{company?.address || 'المملكة العربية السعودية'}</p>
                    </div>

                    <div className="text-start font-mono text-xs space-y-1 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700">
                        <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">رقم السند:</span>
                            <span className="font-bold text-indigo-600">{settlement.settlement_number}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">رقم العهدة:</span>
                            <span className="font-bold">{custody?.custody_number}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">تاريخ السند:</span>
                            <span>{settlement.settlement_date}</span>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center my-6">
                    <h2 className="text-xl font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 inline-block px-6 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-300 dark:border-neutral-700">
                        سند تسوية واعتماد عهدة موظف ومصروفات ضريبية
                    </h2>
                    <p className="text-xs text-neutral-500 font-mono mt-1">
                        EMPLOYEE CUSTODY EXPENSE SETTLEMENT VOUCHER & VAT CLEARANCE
                    </p>
                </div>

                {/* Custodian & Advance Metadata */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-xs mb-6">
                    <div className="space-y-1.5">
                        <p><span className="text-neutral-500">اسم الموظف: </span><span className="font-bold">{employee?.first_name} {employee?.last_name}</span></p>
                        <p><span className="text-neutral-500">الرقم الوظيفي: </span><span className="font-mono">{employee?.employee_number}</span></p>
                        <p><span className="text-neutral-500">القسم / الإدارة: </span><span>{employee?.department?.name || 'الإدارة العامة'}</span></p>
                    </div>
                    <div className="space-y-1.5">
                        <p><span className="text-neutral-500">مبلغ العهدة المصروف: </span><span className="font-mono font-bold">{formatMoney(custody?.amount)}</span></p>
                        <p><span className="text-neutral-500">نوع العهدة: </span><span>{custody?.type === 'temporary' ? 'عهدة مؤقتة لمهمة محددة' : 'عهدة مستديمة'}</span></p>
                        <p><span className="text-neutral-500">الغرض: </span><span className="font-medium">{custody?.purpose}</span></p>
                    </div>
                </div>

                {/* Itemized Invoices Table */}
                <div className="border border-neutral-300 dark:border-neutral-700 rounded-xl overflow-hidden mb-6">
                    <table className="w-full text-xs">
                        <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-300 dark:border-neutral-700">
                            <tr>
                                <th className="px-4 py-2.5 text-start">#</th>
                                <th className="px-4 py-2.5 text-start">اسم المورد / المتجر</th>
                                <th className="px-4 py-2.5 text-start font-mono">الرقم الضريبي للمورد</th>
                                <th className="px-4 py-2.5 text-start font-mono">رقم الفاتورة</th>
                                <th className="px-4 py-2.5 text-start">البيان / الوصف</th>
                                <th className="px-4 py-2.5 text-end font-mono">المبلغ</th>
                                <th className="px-4 py-2.5 text-end font-mono">15% VAT</th>
                                <th className="px-4 py-2.5 text-end font-mono">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                            {settlement.lines?.map((line: any, idx: number) => (
                                <tr key={line.id}>
                                    <td className="px-4 py-2 text-start font-sans">{idx + 1}</td>
                                    <td className="px-4 py-2 text-start font-sans font-medium">{line.vendor_name}</td>
                                    <td className="px-4 py-2 text-start text-[11px] text-neutral-500">{line.vendor_tax_number || '-'}</td>
                                    <td className="px-4 py-2 text-start">{line.invoice_number || '-'}</td>
                                    <td className="px-4 py-2 text-start font-sans text-neutral-600 dark:text-neutral-300 truncate max-w-[180px]">
                                        {line.description}
                                    </td>
                                    <td className="px-4 py-2 text-end">{Number(line.subtotal).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-end text-indigo-600">{Number(line.tax_amount).toFixed(2)}</td>
                                    <td className="px-4 py-2 text-end font-bold">{Number(line.total).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Financial Totals & Tafqeet */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 text-xs mb-8">
                    <div className="space-y-2">
                        <p className="font-semibold text-neutral-700 dark:text-neutral-300">المبلغ كتابة بالحروف (Tafqeet):</p>
                        <p className="font-bold text-sm text-indigo-600 dark:text-indigo-400 bg-white dark:bg-neutral-800 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 font-sans">
                            {tafqeet}
                        </p>
                        {settlement.journal_entry && (
                            <p className="text-neutral-500 font-mono text-[11px] pt-1">
                                مرجع قيد اليومية: #{settlement.journal_entry.entry_number}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between">
                            <span className="font-sans text-neutral-600">صافي المصروفات:</span>
                            <span className="font-bold">{formatMoney(settlement.total_expenses_amount)}</span>
                        </div>
                        <div className="flex justify-between text-indigo-600">
                            <span className="font-sans">ضريبة القيمة المضافة 15%:</span>
                            <span className="font-bold">{formatMoney(settlement.total_tax_amount)}</span>
                        </div>
                        <div className="flex justify-between border-t border-neutral-300 dark:border-neutral-700 pt-1.5 font-bold text-sm">
                            <span className="font-sans">إجمالي الفواتير المسواة:</span>
                            <span className="text-indigo-600">{formatMoney(settlement.total_claimed_amount)}</span>
                        </div>
                        {Number(settlement.refund_amount) > 0 && (
                            <div className="flex justify-between text-emerald-600 pt-1">
                                <span className="font-sans">المبلغ المردود لخزينة الشركة:</span>
                                <span>{formatMoney(settlement.refund_amount)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Official Approvals & Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-neutral-900 dark:border-neutral-100 text-center text-xs">
                    <div>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mb-8">الموظف صاحب العهدة</p>
                        <p className="text-[11px] text-neutral-500">التوقيع: ............................</p>
                    </div>
                    <div>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mb-8">مراجعة المحاسب المالي</p>
                        <p className="text-[11px] text-neutral-500">التوقيع: ............................</p>
                    </div>
                    <div>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200 mb-8">اعتماد الإدارة المالية</p>
                        <p className="text-[11px] text-neutral-500">الختم والتوقيع: ............................</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
