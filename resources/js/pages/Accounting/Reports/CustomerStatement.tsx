import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { UserCheck, Printer, FileSpreadsheet, Calendar, Search, ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    tax_id?: string;
    phone?: string;
}

interface StatementTransaction {
    date: string;
    type: string;
    type_ar: string;
    reference: string;
    debit: number;
    credit: number;
    balance: number;
    notes?: string;
}

interface StatementReport {
    customer: Party | null;
    start_date: string;
    end_date: string;
    opening_balance: number;
    transactions: StatementTransaction[];
    total_debit: number;
    total_credit: number;
    closing_balance: number;
}

interface Company {
    id: string;
    name: string;
    legal_name?: string;
    tax_number?: string;
    currency?: string;
}

interface Props {
    report: StatementReport | null;
    customers: Party[];
    filters: {
        customer_id?: string;
        start_date?: string;
        end_date?: string;
    };
    company: Company;
}

export default function CustomerStatement({ report, customers, filters, company }: Props) {
    const { isRtl } = useTranslation();

    const [form, setForm] = useState({
        customer_id: filters.customer_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/reports/customer-statement', form, { preserveState: true });
    };

    const currency = company?.currency || 'SAR';

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
            <Head title={isRtl ? 'كشف حساب عميل تفصيلي' : 'Customer Statement of Account'} />

            {/* Header Toolbar (Hidden in Print) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <UserCheck className="h-7 w-7 text-indigo-600" />
                        <span>{isRtl ? 'كشف حساب عميل تفصيلي' : 'Customer Statement of Account'}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'استخراج الحركات المدينة والدائنة والرصيد التراكمي اللحظي للعميل خلال فترة محددة'
                            : 'Detailed chronological customer debit/credit transactions with running balance'}
                    </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {report && report.customer && (
                        <Button asChild variant="outline" size="sm" className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400">
                            <a href={`/reports/customer-statement/export?customer_id=${form.customer_id}&start_date=${form.start_date}&end_date=${form.end_date}`}>
                                <FileSpreadsheet className="h-4 w-4" />
                                <span>{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
                            </a>
                        </Button>
                    )}
                    <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900">
                        <Printer className="h-4 w-4" />
                        <span>{isRtl ? 'طباعة الكشف الرسمي' : 'Print Statement'}</span>
                    </Button>
                </div>
            </div>

            {/* Filter Selection (Hidden in Print) */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 print:hidden">
                <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <Label htmlFor="cust_select">{isRtl ? 'العميل المعتمد' : 'Select Customer'}</Label>
                        <select
                            id="cust_select"
                            value={form.customer_id}
                            onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                            className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
                        >
                            <option value="">{isRtl ? '-- اختر العميل --' : '-- Select Customer --'}</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name_ar ? `${c.name_ar} (${c.name})` : c.name} {c.tax_id ? `| ${c.tax_id}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="start_date">{isRtl ? 'من تاريخ' : 'From Date'}</Label>
                        <Input
                            type="date"
                            id="start_date"
                            value={form.start_date}
                            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                            className="h-9"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="end_date">{isRtl ? 'إلى تاريخ' : 'To Date'}</Label>
                        <Input
                            type="date"
                            id="end_date"
                            value={form.end_date}
                            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                            className="h-9"
                        />
                    </div>

                    <div className="sm:col-span-4 flex justify-end">
                        <Button type="submit" size="sm" className="gap-1.5">
                            <Search className="h-4 w-4" />
                            <span>{isRtl ? 'عرض كشف الحساب' : 'Generate Statement'}</span>
                        </Button>
                    </div>
                </form>
            </div>

            {/* Printable Statement Document */}
            {report && report.customer ? (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm flex flex-col gap-6 print:border-none print:shadow-none print:p-0">
                    {/* Official Document Header */}
                    <div className="flex justify-between items-start border-b border-neutral-200 dark:border-neutral-800 pb-6">
                        <div>
                            <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                                {company?.name}
                            </h2>
                            <p className="text-xs text-neutral-500 font-mono mt-0.5">
                                {company?.legal_name || company?.name}
                            </p>
                            {company?.tax_number && (
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono mt-1">
                                    {isRtl ? 'الرقم الضريبي' : 'VAT / Tax No'}: {company?.tax_number}
                                </p>
                            )}
                        </div>

                        <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold rounded-md text-sm border border-indigo-200 dark:border-indigo-800">
                                {isRtl ? 'كشف حساب مالي رسمي' : 'Statement of Account'}
                            </span>
                            <p className="text-xs text-neutral-500 font-mono mt-2">
                                {isRtl ? 'الفترة من' : 'Period'}: {report.start_date} {isRtl ? 'إلى' : 'to'} {report.end_date}
                            </p>
                            <p className="text-xs text-neutral-400 font-mono">
                                {isRtl ? 'تاريخ الاستخراج' : 'Generated'}: {new Date().toLocaleDateString('en-GB')}
                            </p>
                        </div>
                    </div>

                    {/* Customer Info Card */}
                    <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between gap-4 text-sm">
                        <div>
                            <span className="text-xs font-semibold text-neutral-400 uppercase">{isRtl ? 'السيد / العميل الموقر' : 'Customer Account'}</span>
                            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                                {report.customer.name_ar ? `${report.customer.name_ar} - ${report.customer.name}` : report.customer.name}
                            </h3>
                            {report.customer.phone && (
                                <p className="text-xs text-neutral-500 mt-1">{isRtl ? 'الهاتف' : 'Phone'}: {report.customer.phone}</p>
                            )}
                        </div>
                        {report.customer.tax_id && (
                            <div className="sm:text-right">
                                <span className="text-xs font-semibold text-neutral-400 uppercase">{isRtl ? 'الرقم الضريبي للعميل' : 'Customer Tax ID'}</span>
                                <p className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{report.customer.tax_id}</p>
                            </div>
                        )}
                    </div>

                    {/* Summary Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-2">
                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 bg-neutral-50/50 dark:bg-neutral-900/50">
                            <span className="text-xs text-neutral-500">{isRtl ? 'رصيد افتتاحي سابق' : 'Opening Balance'}</span>
                            <div className="text-lg font-mono font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                                {Number(report.opening_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">{currency}</span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 bg-amber-50/30 dark:bg-amber-950/20">
                            <span className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                <span>{isRtl ? 'إجمالي الفواتير (مدين)' : 'Total Invoices (Debit)'}</span>
                            </span>
                            <div className="text-lg font-mono font-bold text-amber-900 dark:text-amber-300 mt-1">
                                {Number(report.total_debit).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">{currency}</span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3.5 bg-emerald-50/30 dark:bg-emerald-950/20">
                            <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                                <span>{isRtl ? 'إجمالي السدادات (دائن)' : 'Total Payments (Credit)'}</span>
                            </span>
                            <div className="text-lg font-mono font-bold text-emerald-900 dark:text-emerald-300 mt-1">
                                {Number(report.total_credit).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">{currency}</span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/40">
                            <span className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold">{isRtl ? 'الرصيد النهائي المستحق' : 'Closing Balance'}</span>
                            <div className="text-lg font-mono font-black text-indigo-900 dark:text-indigo-200 mt-1">
                                {Number(report.closing_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">{currency}</span>
                            </div>
                        </div>
                    </div>

                    {/* Chronological Movements Table */}
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th className="py-2.5 px-3">{isRtl ? 'التاريخ' : 'Date'}</th>
                                    <th className="py-2.5 px-3">{isRtl ? 'نوع الحركة' : 'Type'}</th>
                                    <th className="py-2.5 px-3">{isRtl ? 'رقم المرجع' : 'Reference'}</th>
                                    <th className="py-2.5 px-3 text-right">{isRtl ? 'مدين (+)' : 'Debit (+)'}</th>
                                    <th className="py-2.5 px-3 text-right">{isRtl ? 'دائن (-)' : 'Credit (-)'}</th>
                                    <th className="py-2.5 px-3 text-right font-bold">{isRtl ? 'الرصيد التراكمي' : 'Balance'}</th>
                                    <th className="py-2.5 px-3">{isRtl ? 'البيان والملاحظات' : 'Notes'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                                {/* Opening Balance Row */}
                                <tr className="bg-neutral-50/70 dark:bg-neutral-900/70 font-semibold italic text-neutral-600 dark:text-neutral-400">
                                    <td className="py-2 px-3">{report.start_date}</td>
                                    <td className="py-2 px-3 font-sans" colSpan={2}>
                                        {isRtl ? 'رصيد افتتاحي سابق للفترة' : 'Previous Period Opening Balance'}
                                    </td>
                                    <td className="py-2 px-3 text-right">-</td>
                                    <td className="py-2 px-3 text-right">-</td>
                                    <td className="py-2 px-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(report.opening_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2 px-3 font-sans text-neutral-400">-</td>
                                </tr>

                                {report.transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-neutral-400 font-sans">
                                            {isRtl ? 'لا توجد حركات مالية مسجلة خلال هذه الفترة' : 'No transactions recorded during this period.'}
                                        </td>
                                    </tr>
                                ) : (
                                    report.transactions.map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                                            <td className="py-2 px-3 text-neutral-700 dark:text-neutral-300">{tx.date}</td>
                                            <td className="py-2 px-3 font-sans">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                                    tx.debit > 0
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                }`}>
                                                    {isRtl ? tx.type_ar : tx.type}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 font-bold text-neutral-900 dark:text-neutral-100">{tx.reference}</td>
                                            <td className="py-2 px-3 text-right text-neutral-800 dark:text-neutral-200">
                                                {tx.debit > 0 ? Number(tx.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="py-2 px-3 text-right text-emerald-700 dark:text-emerald-400">
                                                {tx.credit > 0 ? Number(tx.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="py-2 px-3 text-right font-bold text-indigo-950 dark:text-indigo-200 bg-neutral-50/30 dark:bg-neutral-800/20">
                                                {Number(tx.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-2 px-3 font-sans text-neutral-500 text-[11px] truncate max-w-xs">{tx.notes || '-'}</td>
                                        </tr>
                                    ))
                                )}

                                {/* Grand Totals Footer Row */}
                                <tr className="bg-neutral-100 dark:bg-neutral-800 font-bold border-t-2 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
                                    <td colSpan={3} className="py-2.5 px-3 font-sans text-right">
                                        {isRtl ? 'إجمالي حركات الفترة والرصيد النهائي' : 'Total Movements & Closing Balance'}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                        {Number(report.total_debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">
                                        {Number(report.total_credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-black text-indigo-700 dark:text-indigo-400 text-sm">
                                        {Number(report.closing_balance).toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}
                                    </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Official Signatures Block */}
                    <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-800 grid grid-cols-3 gap-8 text-center text-xs">
                        <div>
                            <p className="font-semibold text-neutral-700 dark:text-neutral-300">{isRtl ? 'إعداد المحاسب' : 'Prepared By'}</p>
                            <div className="h-14 border-b border-dashed border-neutral-300 dark:border-neutral-700 mt-2"></div>
                            <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'التوقيع والتاريخ' : 'Signature & Date'}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-neutral-700 dark:text-neutral-300">{isRtl ? 'المدير المالي المعتمد' : 'Financial Manager'}</p>
                            <div className="h-14 border-b border-dashed border-neutral-300 dark:border-neutral-700 mt-2"></div>
                            <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'الاعتماد والختم' : 'Approval & Stamp'}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-neutral-700 dark:text-neutral-300">{isRtl ? 'ختم ومصادقة العميل' : 'Customer Acceptance'}</p>
                            <div className="h-14 border-b border-dashed border-neutral-300 dark:border-neutral-700 mt-2"></div>
                            <p className="text-[11px] text-neutral-400 mt-1">{isRtl ? 'المصادقة على صحة الرصيد' : 'Balance Confirmation'}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
                    <UserCheck className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                    <p>{isRtl ? 'يرجى اختيار العميل وتحديد الفترة لاستعراض كشف الحساب' : 'Please select a customer and period to generate the statement.'}</p>
                </div>
            )}
        </div>
    );
}
