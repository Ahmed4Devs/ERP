import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Printer, X, HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Account {
    code: string;
    name: string;
    name_ar?: string;
}

interface SettlementLine {
    id: string;
    description: string;
    receipt_ref?: string;
    receipt_date?: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    expense_account?: Account;
}

interface Company {
    name: string;
    name_ar?: string;
    tax_number?: string;
    address?: string;
}

interface PettyCashSettlement {
    id: string;
    settlement_number: string;
    date: string;
    reimbursement_type: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    status: string;
    fund?: {
        name: string;
        code: string;
        custodian?: {
            name: string;
        };
    };
    branch?: {
        name: string;
    };
    lines: SettlementLine[];
}

interface Props {
    settlement: PettyCashSettlement;
    company: Company;
    qrCodeDataUri: string;
    amountInWords: {
        ar: string;
        en: string;
    };
}

export default function PrintSettlement({
    settlement,
    company,
    qrCodeDataUri,
    amountInWords,
}: Props) {
    const { isRtl } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-8 px-4 sm:px-6 print:p-0 print:bg-white text-neutral-900">
            <Head title={`${settlement.settlement_number} - ${isRtl ? 'سند تسوية عهدة رسمية' : 'Petty Cash Voucher'}`} />

            {/* Print Controls */}
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                    <Button onClick={() => window.print()} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                        <Printer className="h-4 w-4" />
                        {isRtl ? 'طباعة سند التسوية' : 'Print Voucher'}
                    </Button>
                    <Button variant="outline" onClick={() => window.close()}>
                        <X className="h-4 w-4" />
                        {isRtl ? 'إغلاق' : 'Close'}
                    </Button>
                </div>
                <div className="text-xs text-neutral-500">
                    {isRtl ? 'سند تسوية واستعاضة عهدة نقدية معتمد محاسبياً' : 'Official Petty Cash Settlement Voucher'}
                </div>
            </div>

            {/* A4 Sheet */}
            <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-lg shadow-sm border border-neutral-200 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-6">
                    <div className="space-y-1 text-start">
                        <h1 className="text-xl sm:text-2xl font-black text-neutral-900">
                            {company.name_ar || company.name}
                        </h1>
                        <p className="text-sm font-semibold text-neutral-600">
                            {company.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                            {company.address}
                        </p>
                        <div className="text-xs font-mono font-medium pt-1">
                            {isRtl ? 'الرقم الضريبي:' : 'VAT No:'} <span className="font-bold">{company.tax_number || '300000000000003'}</span>
                        </div>
                    </div>

                    <div className="text-center flex flex-col items-center">
                        <div className="inline-block border-2 border-amber-600 text-amber-700 px-4 py-1 font-black text-base sm:text-lg uppercase tracking-wider rounded">
                            {isRtl ? 'سند تسوية عهدة نقدية' : 'PETTY CASH VOUCHER'}
                        </div>
                        <div className="text-xs font-mono text-neutral-500 mt-1">
                            {settlement.settlement_number}
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        {qrCodeDataUri && (
                            <img
                                src={qrCodeDataUri}
                                alt="Voucher QR"
                                className="w-24 h-24 sm:w-28 sm:h-28 border border-neutral-300 p-1 rounded"
                            />
                        )}
                        <span className="text-[10px] text-neutral-400 mt-1 font-mono">
                            Enterprise Audit Code
                        </span>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-6 bg-neutral-50 p-4 rounded border border-neutral-200 text-xs mb-6">
                    <div className="space-y-1.5 text-start">
                        <div className="font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-200 pb-1 mb-1">
                            {isRtl ? 'بيانات صندوق العهدة والأمين' : 'Fund & Custodian Details'}
                        </div>
                        <div>{isRtl ? 'اسم الصندوق:' : 'Fund Name:'} <span className="font-semibold text-neutral-900">{settlement.fund?.name} ({settlement.fund?.code})</span></div>
                        <div>{isRtl ? 'أمين العهدة المستلم:' : 'Custodian:'} <span className="font-semibold">{settlement.fund?.custodian?.name || '—'}</span></div>
                        <div>{isRtl ? 'الفرع:' : 'Branch:'} <span>{settlement.branch?.name || (isRtl ? 'المركز الرئيسي' : 'HQ')}</span></div>
                    </div>

                    <div className="space-y-1.5 text-start">
                        <div className="font-bold text-neutral-700 uppercase tracking-wider border-b border-neutral-200 pb-1 mb-1">
                            {isRtl ? 'بيانات السند المالي' : 'Voucher Details'}
                        </div>
                        <div>{isRtl ? 'رقم السند:' : 'Voucher #:'} <span className="font-mono font-bold">{settlement.settlement_number}</span></div>
                        <div>{isRtl ? 'تاريخ السند:' : 'Issue Date:'} <span className="font-mono">{settlement.date}</span></div>
                        <div>{isRtl ? 'نوع المعالجة:' : 'Type:'} <span>{settlement.reimbursement_type === 'replenish_bank' ? (isRtl ? 'استعاضة بنكية فورية' : 'Bank Replenishment') : (isRtl ? 'تخفيض من رصيد العهدة' : 'Custody Reduction')}</span></div>
                    </div>
                </div>

                {/* Line Items */}
                <table className="w-full text-xs text-start mb-6 border border-neutral-300">
                    <thead className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-700">
                        <tr>
                            <th className="py-2.5 px-3 text-start border-e border-neutral-300">#</th>
                            <th className="py-2.5 px-3 text-start border-e border-neutral-300">{isRtl ? 'حساب المصروف' : 'Account'}</th>
                            <th className="py-2.5 px-3 text-start border-e border-neutral-300">{isRtl ? 'بيان المصروف' : 'Description'}</th>
                            <th className="py-2.5 px-3 text-center border-e border-neutral-300 w-24">{isRtl ? 'رقم الفاتورة' : 'Receipt #'}</th>
                            <th className="py-2.5 px-3 text-end border-e border-neutral-300 w-28">{isRtl ? 'المبلغ الصافي' : 'Subtotal'}</th>
                            <th className="py-2.5 px-3 text-end border-e border-neutral-300 w-24">{isRtl ? 'الضريبة (15%)' : 'VAT (15%)'}</th>
                            <th className="py-2.5 px-3 text-end w-32">{isRtl ? 'الإجمالي' : 'Total (SAR)'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {settlement.lines.map((line, idx) => (
                            <tr key={line.id}>
                                <td className="py-2 px-3 text-center border-e border-neutral-200 text-neutral-400">{idx + 1}</td>
                                <td className="py-2 px-3 border-e border-neutral-200 font-mono">
                                    {line.expense_account?.code}
                                </td>
                                <td className="py-2 px-3 border-e border-neutral-200 font-medium text-neutral-800">
                                    {line.description}
                                </td>
                                <td className="py-2 px-3 text-center font-mono border-e border-neutral-200 text-neutral-500">
                                    {line.receipt_ref || '—'}
                                </td>
                                <td className="py-2 px-3 text-end font-mono border-e border-neutral-200">
                                    {parseFloat(line.subtotal).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-end font-mono border-e border-neutral-200">
                                    {parseFloat(line.tax_amount).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-end font-mono font-bold">
                                    {parseFloat(line.total).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Breakdown & Tafqeet */}
                <div className="grid grid-cols-2 gap-4 items-start mb-8">
                    <div className="border border-neutral-200 p-3 rounded text-xs space-y-1">
                        <div className="font-bold text-neutral-700">{isRtl ? 'المبلغ بالحروف (تفقيط):' : 'Amount in Words:'}</div>
                        <div className="text-neutral-800 font-medium">{amountInWords.ar}</div>
                        <div className="text-neutral-500 italic font-sans">{amountInWords.en}</div>
                    </div>

                    <div className="border border-neutral-300 rounded overflow-hidden text-xs">
                        <div className="flex justify-between py-2 px-3 border-b border-neutral-200">
                            <span className="text-neutral-600">{isRtl ? 'إجمالي المصروفات قبل الضريبة:' : 'Subtotal Excl. VAT:'}</span>
                            <span className="font-mono font-semibold">{parseFloat(settlement.subtotal).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between py-2 px-3 border-b border-neutral-200">
                            <span className="text-neutral-600">{isRtl ? 'ضريبة القيمة المضافة المستردة (15%):' : 'Total Recoverable VAT:'}</span>
                            <span className="font-mono font-semibold">{parseFloat(settlement.tax_amount).toFixed(2)} SAR</span>
                        </div>
                        <div className="flex justify-between py-2.5 px-3 bg-neutral-100 font-bold text-sm">
                            <span className="text-neutral-900">{isRtl ? 'صافي المبلغ المصروف للاستعاضة:' : 'Total Settlement Payable:'}</span>
                            <span className="font-mono text-amber-700">{parseFloat(settlement.total).toFixed(2)} SAR</span>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-6 pt-6 border-t-2 border-neutral-200 text-center text-xs">
                    <div>
                        <div className="text-neutral-500 mb-10">{isRtl ? 'أمين العهدة (المستلم)' : 'Custodian Signature'}</div>
                        <div className="border-t border-neutral-400 pt-1 font-medium">{isRtl ? 'التوقيع / التاريخ' : 'Signature / Date'}</div>
                    </div>
                    <div>
                        <div className="text-neutral-500 mb-10">{isRtl ? 'مراجعة وتدقيق الحسابات' : 'Internal Audit / Accountant'}</div>
                        <div className="border-t border-neutral-400 pt-1 font-medium">{isRtl ? 'التوقيع / الختم' : 'Signature / Stamp'}</div>
                    </div>
                    <div>
                        <div className="text-neutral-500 mb-10">{isRtl ? 'اعتماد المدير المالي (CFO)' : 'CFO / Financial Approval'}</div>
                        <div className="border-t border-neutral-400 pt-1 font-medium">{isRtl ? 'الاعتماد / الصرف' : 'Approval / Disbursed'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
