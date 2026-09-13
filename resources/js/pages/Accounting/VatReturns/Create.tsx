import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Percent, Calendar, Calculator, CheckCircle2, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Summary {
    standard_sales_amount: string;
    standard_sales_vat: string;
    standard_sales_adjustment: string;
    zero_rated_sales_amount: string;
    exempt_sales_amount: string;
    total_sales_amount: string;
    total_output_vat: string;
    standard_purchases_amount: string;
    standard_purchases_vat: string;
    standard_purchases_adjustment: string;
    imports_vat_amount: string;
    zero_rated_purchases_amount: string;
    exempt_purchases_amount: string;
    total_purchases_amount: string;
    total_input_vat: string;
    net_vat_due: string;
    previous_period_credit: string;
    final_net_payable: string;
}

interface Props {
    periodType: string;
    taxPeriod: string;
    startDate: string;
    endDate: string;
    year: number;
    returnNumber: string;
    aggregated: {
        start_date: string;
        end_date: string;
        summary: Summary;
        sales_details: any[];
        purchases_details: any[];
        gl_tax_balance: string;
    };
}

export default function VatReturnsCreate({
    periodType,
    taxPeriod,
    startDate,
    endDate,
    year,
    returnNumber,
    aggregated,
}: Props) {
    const { isRtl } = useTranslation();

    const [selectedType, setSelectedType] = useState(periodType);
    const [selectedYear, setSelectedYear] = useState(year);
    const [selectedQuarter, setSelectedQuarter] = useState('1');
    const [selectedMonth, setSelectedMonth] = useState('1');

    const handlePeriodChange = (newType: string, newYear: number, q: string, m: string) => {
        router.get('/accounting/vat-returns/create', {
            period_type: newType,
            year: newYear,
            quarter: q,
            month: m,
        }, { preserveState: true, replace: true });
    };

    const summary = aggregated.summary;

    const { data, setData, post, processing } = useForm({
        return_number: returnNumber,
        period_type: selectedType,
        tax_period: taxPeriod,
        start_date: startDate,
        end_date: endDate,
        standard_sales_amount: summary.standard_sales_amount,
        standard_sales_vat: summary.standard_sales_vat,
        standard_sales_adjustment: summary.standard_sales_adjustment,
        zero_rated_sales_amount: summary.zero_rated_sales_amount,
        exempt_sales_amount: summary.exempt_sales_amount,
        total_sales_amount: summary.total_sales_amount,
        total_output_vat: summary.total_output_vat,
        standard_purchases_amount: summary.standard_purchases_amount,
        standard_purchases_vat: summary.standard_purchases_vat,
        standard_purchases_adjustment: summary.standard_purchases_adjustment,
        imports_vat_amount: summary.imports_vat_amount,
        zero_rated_purchases_amount: summary.zero_rated_purchases_amount,
        exempt_purchases_amount: summary.exempt_purchases_amount,
        total_purchases_amount: summary.total_purchases_amount,
        total_input_vat: summary.total_input_vat,
        net_vat_due: summary.net_vat_due,
        previous_period_credit: summary.previous_period_credit,
        final_net_payable: summary.final_net_payable,
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/accounting/vat-returns');
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={isRtl ? 'إعداد إقرار ضريبة القيمة المضافة' : 'Prepare VAT Return'} />

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/accounting/vat-returns">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Percent className="h-6 w-6 text-indigo-600" />
                        <span>{isRtl ? 'إعداد واحتساب إقرار ضريبة القيمة المضافة' : 'Prepare ZATCA VAT Declaration'}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'احتساب آلي مباشر لضريبة المخرجات والمدخلات وصافي الضريبة المستحقة من واقع فواتير النظام'
                            : 'Automated live aggregation of output and input tax directly from posted invoices and bills'}
                    </p>
                </div>
            </div>

            {/* Period Selector Bar */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                        {isRtl ? 'تحديد الفترة الضريبية للاحتساب' : 'Tax Period Selection'}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                            {isRtl ? 'نوع الفترة' : 'Period Type'}
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => {
                                setSelectedType(e.target.value);
                                handlePeriodChange(e.target.value, selectedYear, selectedQuarter, selectedMonth);
                            }}
                            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                        >
                            <option value="quarterly">{isRtl ? 'ربع سنوي (Quarterly)' : 'Quarterly'}</option>
                            <option value="monthly">{isRtl ? 'شهري (Monthly)' : 'Monthly'}</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                            {isRtl ? 'السنة المالية' : 'Tax Year'}
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                const y = parseInt(e.target.value);
                                setSelectedYear(y);
                                handlePeriodChange(selectedType, y, selectedQuarter, selectedMonth);
                            }}
                            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                        >
                            <option value={2026}>2026</option>
                            <option value={2025}>2025</option>
                            <option value={2024}>2024</option>
                        </select>
                    </div>

                    {selectedType === 'quarterly' ? (
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'الربع السنوي' : 'Quarter'}
                            </label>
                            <select
                                value={selectedQuarter}
                                onChange={(e) => {
                                    setSelectedQuarter(e.target.value);
                                    handlePeriodChange(selectedType, selectedYear, e.target.value, selectedMonth);
                                }}
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="1">{isRtl ? 'الربع الأول (يناير - مارس)' : 'Q1 (Jan - Mar)'}</option>
                                <option value="2">{isRtl ? 'الربع الثاني (أبريل - يونيو)' : 'Q2 (Apr - Jun)'}</option>
                                <option value="3">{isRtl ? 'الربع الثالث (يوليو - سبتمبر)' : 'Q3 (Jul - Sep)'}</option>
                                <option value="4">{isRtl ? 'الربع الرابع (أكتوبر - ديسمبر)' : 'Q4 (Oct - Dec)'}</option>
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                                {isRtl ? 'الشهر' : 'Month'}
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value);
                                    handlePeriodChange(selectedType, selectedYear, selectedQuarter, e.target.value);
                                }}
                                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={String(m)}>
                                        {m} - {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col justify-end">
                        <span className="text-xs text-neutral-500 mb-1 font-mono">{startDate} → {endDate}</span>
                        <div className="bg-neutral-100 dark:bg-neutral-800 px-3 py-2 rounded-lg font-bold text-xs text-center font-mono">
                            {taxPeriod}
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 3 Overview Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{isRtl ? 'ضريبة المخرجات (المبيعات)' : 'Total Output VAT'}</span>
                            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="text-2xl font-mono font-black text-emerald-900 dark:text-emerald-200 mt-1">
                            {Number(summary.total_output_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                            {isRtl ? `من مبيعات بقيمة: ${Number(summary.total_sales_amount).toLocaleString()} SAR` : `From sales: ${Number(summary.total_sales_amount).toLocaleString()} SAR`}
                        </p>
                    </div>

                    <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 shadow-xs dark:border-blue-900/50 dark:bg-blue-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{isRtl ? 'ضريبة المدخلات (المشتريات)' : 'Total Input VAT'}</span>
                            <ArrowDownRight className="h-4 w-4 text-blue-600" />
                        </div>
                        <p className="text-2xl font-mono font-black text-blue-900 dark:text-blue-200 mt-1">
                            {Number(summary.total_input_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                            {isRtl ? `من مشتريات بقيمة: ${Number(summary.total_purchases_amount).toLocaleString()} SAR` : `From bills: ${Number(summary.total_purchases_amount).toLocaleString()} SAR`}
                        </p>
                    </div>

                    <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-4 shadow-xs dark:border-indigo-900/50 dark:bg-indigo-950/20">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{isRtl ? 'صافي الضريبة المستحقة للسداد' : 'Net VAT Payable'}</span>
                            <ShieldCheck className="h-4 w-4 text-indigo-600" />
                        </div>
                        <p className="text-2xl font-mono font-black text-indigo-900 dark:text-indigo-200 mt-1">
                            {Number(summary.final_net_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                        <p className="text-xs text-indigo-600 mt-0.5">
                            {isRtl ? 'واجبة السداد لهيئة الزكاة والضريبة والجمارك' : 'Payable to ZATCA'}
                        </p>
                    </div>
                </div>

                {/* ZATCA Official Table Structure Preview */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                        {isRtl ? 'جدول إقرار هيئة الزكاة والضريبة والجمارك (ZATCA)' : 'ZATCA VAT Declaration Form Lines'}
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs border-collapse">
                            <thead>
                                <tr className="border-b-2 border-neutral-900 dark:border-neutral-100 bg-neutral-100 dark:bg-neutral-800 font-bold">
                                    <th className="py-2.5 px-3 text-start w-12">#</th>
                                    <th className="py-2.5 px-3 text-start">{isRtl ? 'البند الضريبي' : 'Tax Line Item'}</th>
                                    <th className="py-2.5 px-3 text-end">{isRtl ? 'المبلغ الخاضع (SAR)' : 'Taxable Amount'}</th>
                                    <th className="py-2.5 px-3 text-end">{isRtl ? 'مبلغ الضريبة (SAR)' : 'VAT Amount'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                                    <td className="py-2.5 px-3 font-bold">1</td>
                                    <td className="py-2.5 px-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">
                                        {isRtl ? 'المبيعات الخاضعة للنسبة الأساسية (Standard Rated Sales)' : 'Standard rated sales'}
                                    </td>
                                    <td className="py-2.5 px-3 text-end font-bold">{Number(summary.standard_sales_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 px-3 text-end font-bold text-emerald-600">{Number(summary.standard_sales_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 font-bold text-neutral-400">6</td>
                                    <td className="py-2 px-3 font-sans font-bold text-neutral-800 dark:text-neutral-200">
                                        {isRtl ? 'إجمالي المبيعات وضريبة المخرجات (Total Sales & Output VAT)' : 'Total Sales & Output VAT'}
                                    </td>
                                    <td className="py-2 px-3 text-end font-black">{Number(summary.total_sales_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2 px-3 text-end font-black text-emerald-600">{Number(summary.total_output_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30">
                                    <td className="py-2.5 px-3 font-bold">7</td>
                                    <td className="py-2.5 px-3 font-sans font-semibold text-neutral-900 dark:text-neutral-100">
                                        {isRtl ? 'المشتريات الخاضعة للنسبة الأساسية (Standard Rated Purchases)' : 'Standard rated purchases'}
                                    </td>
                                    <td className="py-2.5 px-3 text-end font-bold">{Number(summary.standard_purchases_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2.5 px-3 text-end font-bold text-blue-600">{Number(summary.standard_purchases_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-3 font-bold text-neutral-400">11</td>
                                    <td className="py-2 px-3 font-sans font-bold text-neutral-800 dark:text-neutral-200">
                                        {isRtl ? 'إجمالي المشتريات وضريبة المدخلات (Total Purchases & Input VAT)' : 'Total Purchases & Input VAT'}
                                    </td>
                                    <td className="py-2 px-3 text-end font-black">{Number(summary.total_purchases_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="py-2 px-3 text-end font-black text-blue-600">{Number(summary.total_input_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="border-t-2 border-neutral-900 dark:border-neutral-100 bg-indigo-50/50 dark:bg-indigo-950/30 font-black text-sm">
                                    <td className="py-3 px-3">14</td>
                                    <td className="py-3 px-3 font-sans text-indigo-900 dark:text-indigo-200">
                                        {isRtl ? 'صافي الضريبة الواجب سدادها / (المستردة) - Net VAT Payable' : 'Net VAT Payable / (Refundable)'}
                                    </td>
                                    <td></td>
                                    <td className="py-3 px-3 text-end text-indigo-700 dark:text-indigo-300 font-black text-base">
                                        {Number(summary.final_net_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="pt-3">
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 block">
                            {isRtl ? 'ملاحظات الإقرار' : 'Declaration Notes'}
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border border-neutral-200 bg-white p-2.5 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            placeholder={isRtl ? 'أي ملاحظات إضافية على الإقرار...' : 'Optional notes for this tax return...'}
                        />
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/accounting/vat-returns">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-36 shadow-sm"
                    >
                        {processing
                            ? (isRtl ? 'جاري الحفظ...' : 'Saving...')
                            : (isRtl ? 'حفظ وتوليد مسودة الإقرار' : 'Save & Generate Return')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
