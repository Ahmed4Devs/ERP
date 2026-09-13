import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    HardHat,
    ArrowLeft,
    CheckCircle2,
    FileText,
    ReceiptText,
    DollarSign,
    Layers,
    Lock,
    ExternalLink,
    Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface ClaimItem {
    id: string;
    work_description: string;
    scheduled_value: string;
    previous_percentage: string;
    current_percentage: string;
    current_amount: string;
}

interface ContractingClaim {
    id: string;
    claim_number: string;
    claim_date: string;
    contract_value: string;
    previous_billed_amount: string;
    current_work_amount: string;
    retention_rate: string;
    retention_amount: string;
    net_claim_amount: string;
    tax_amount: string;
    total_amount: string;
    status: 'draft' | 'certified' | 'billed' | 'rejected';
    notes?: string;
    project?: { name: string };
    customer?: { name: string; name_ar?: string; tax_id?: string };
    invoice?: { id: string; invoice_number: string; total: string; status: string };
    items: ClaimItem[];
}

interface Props {
    claim: ContractingClaim;
}

export default function ContractingClaimShow({ claim }: Props) {
    const { t, isRtl } = useTranslation();
    const [isBilling, setIsBilling] = useState(false);

    const isBilled = claim.status === 'billed';

    const handleBill = () => {
        if (!confirm(isRtl ? 'هل تؤكد اعتماد المستخلص وتوليد فاتورة المبيعات الرسمية؟' : 'Confirm certifying this progress claim and generating an official Service Invoice?')) {
            return;
        }

        setIsBilling(true);
        router.post(`/contracting/claims/${claim.id}/bill`, {}, {
            onFinish: () => setIsBilling(false),
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={`Progress Claim - ${claim.claim_number}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                        <Link href="/contracting/claims">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                                {claim.claim_number}
                            </h1>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                isBilled
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${isBilled ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'}`} />
                                {claim.status}
                            </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                            {claim.project?.name} &bull; {isRtl && claim.customer?.name_ar ? claim.customer.name_ar : claim.customer?.name} &bull; Date: {claim.claim_date}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" className="gap-2">
                        <Link href={`/contracting/claims/${claim.id}/print`}>
                            <Printer className="h-4 w-4" />
                            <span>{isRtl ? 'طباعة شهادة المستخلص' : 'Print Certificate'}</span>
                        </Link>
                    </Button>

                    {!isBilled ? (
                        <Button
                            disabled={isBilling}
                            onClick={handleBill}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{isBilling ? (isRtl ? 'جارٍ الفوترة...' : 'Generating Invoice...') : (isRtl ? 'اعتماد المستخلص وإصدار الفاتورة' : 'Certify & Generate Invoice')}</span>
                        </Button>
                    ) : (
                        claim.invoice && (
                            <Button asChild variant="outline" className="gap-2 border-indigo-200 text-indigo-700 dark:text-indigo-400">
                                <Link href={`/invoices/${claim.invoice.id}`}>
                                    <ReceiptText className="h-4 w-4" />
                                    <span>{isRtl ? 'عرض الفاتورة الرسمية' : 'View Service Invoice'} (#{claim.invoice.invoice_number})</span>
                                    <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                        )
                    )}
                </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'إجمالي الأعمال المنجزة' : 'Certified Current Work'}</p>
                    <p className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                        {Number(claim.current_work_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'حسم الضمان التعاقدي (5%)' : 'Retention Withheld (5%)'}</p>
                    <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                        -{Number(claim.retention_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'ضريبة القيمة المضافة (10%)' : 'VAT (10% Test Rate)'}</p>
                    <p className="text-xl font-bold font-mono text-neutral-700 dark:text-neutral-300 mt-1">
                        +{Number(claim.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs text-neutral-500">{isRtl ? 'صافي المستحق للمقاول' : 'Total Claim Amount'}</p>
                    <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                        {Number(claim.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </p>
                </div>
            </div>

            {/* Milestones Breakdown */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2 border-b pb-3 mb-4">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    {isRtl ? 'جدول الكميات والإنجاز (Work Progress Schedule)' : 'Work Progress Breakdown'}
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="pb-3 text-start">{isRtl ? 'بند الأعمال' : 'Work Description'}</th>
                                <th className="pb-3 text-end font-mono">{isRtl ? 'القيمة التعاقدية' : 'Scheduled Value'}</th>
                                <th className="pb-3 text-center font-mono">{isRtl ? 'الإنجاز السابق' : 'Prev %'}</th>
                                <th className="pb-3 text-center font-mono">{isRtl ? 'الإنجاز الحالي' : 'Current %'}</th>
                                <th className="pb-3 text-end font-mono">{isRtl ? 'مستحق الفترة الحالية' : 'Current Amount'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {claim.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                        {item.work_description}
                                    </td>
                                    <td className="py-3 text-end font-mono text-neutral-600 dark:text-neutral-400">
                                        {Number(item.scheduled_value).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                    <td className="py-3 text-center font-mono text-neutral-500">
                                        {(Number(item.previous_percentage) * 100).toFixed(1)}%
                                    </td>
                                    <td className="py-3 text-center font-mono font-bold text-indigo-600">
                                        {(Number(item.current_percentage) * 100).toFixed(1)}%
                                    </td>
                                    <td className="py-3 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(item.current_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {claim.notes && (
                    <div className="mt-4 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-xs text-neutral-600 dark:text-neutral-400">
                        <span className="font-bold">{isRtl ? 'ملاحظات المستخلص:' : 'Notes:'}</span> {claim.notes}
                    </div>
                )}
            </div>
        </div>
    );
}
