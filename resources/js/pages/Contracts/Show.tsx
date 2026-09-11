import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, FileCheck2, Calendar, RefreshCw, DollarSign, Receipt, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    tax_id?: string;
    email?: string;
}

interface Project {
    id: string;
    project_number: string;
    name: string;
}

interface ContractLine {
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
}

interface Contract {
    id: string;
    contract_number: string;
    title: string;
    title_ar?: string;
    customer: Party;
    project?: Project;
    start_date: string;
    end_date: string;
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
    recurring_amount: string;
    tax_rate: string;
    next_billing_date: string;
    last_billed_at?: string;
    status: 'draft' | 'active' | 'suspended' | 'expired' | 'terminated';
    auto_renew: boolean;
    notes?: string;
    lines: ContractLine[];
}

interface Props {
    contract: Contract;
}

export default function ContractShow({ contract }: Props) {
    const { t, isRtl } = useTranslation();

    const handleGenerateBill = () => {
        if (confirm(isRtl ? 'هل تريد إصدار فاتورة خدمة وترحيل قيد الإيراد لدفتر الأستاذ العام وتحديث موعد الفوترة التالي؟' : 'Generate official billing invoice and advance next billing cycle?')) {
            router.post(`/contracts/${contract.id}/bill`);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${contract.contract_number} - ${contract.title}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/contracts">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-neutral-500">{contract.contract_number}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                contract.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-neutral-100 text-neutral-700'
                            }`}>
                                {contract.status}
                            </span>
                            {contract.auto_renew && (
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <RefreshCw className="h-3 w-3" />
                                    <span>{isRtl ? 'تجديد تلقائي' : 'Auto Renew'}</span>
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
                            {isRtl && contract.title_ar ? contract.title_ar : contract.title}
                        </h1>
                        <p className="text-sm text-neutral-500">
                            {isRtl && contract.customer?.name_ar ? contract.customer.name_ar : contract.customer?.name}
                        </p>
                    </div>
                </div>

                {contract.status === 'active' && (
                    <Button onClick={handleGenerateBill} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        <Receipt className="h-4 w-4" />
                        <span>{isRtl ? 'إصدار فاتورة الاشتراك وترحيل القيد' : 'Generate & Post Billing Invoice'}</span>
                    </Button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs font-medium text-neutral-500">{isRtl ? 'المبلغ التكراري الدوري' : 'Recurring Amount'}</p>
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                        {Number(contract.recurring_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </h3>
                    <p className="text-xs capitalize text-neutral-500 mt-1">
                        {isRtl ? 'الدورة: ' : 'Cycle: '}
                        <span className="font-semibold">{contract.billing_cycle.replace('_', ' ')}</span>
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs font-medium text-neutral-500">{isRtl ? 'موعد الاستحقاق والفوترة التالي' : 'Next Billing Date'}</p>
                    <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                        {contract.next_billing_date}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                        {isRtl ? 'آخر تاريخ فوترة: ' : 'Last Billed: '}
                        <span className="font-mono">{contract.last_billed_at || (isRtl ? 'لم يفوتر بعد' : 'Not yet')}</span>
                    </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
                    <p className="text-xs font-medium text-neutral-500">{isRtl ? 'فترة سريان العقد' : 'Contract Term'}</p>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                        {contract.start_date} → {contract.end_date}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                        {isRtl ? 'الضريبة المطبقة: ' : 'Tax Rate: '}
                        <span className="font-mono font-medium">{(parseFloat(contract.tax_rate) * 100).toFixed(0)}% (Test Tax)</span>
                    </p>
                </div>
            </div>

            {/* Document Details Card */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                        <p className="text-xs text-neutral-500 mb-1">{isRtl ? 'العميل المستفيد' : 'Customer'}</p>
                        <p className="font-bold text-neutral-900 dark:text-neutral-100">
                            {isRtl && contract.customer?.name_ar ? contract.customer.name_ar : contract.customer?.name}
                        </p>
                        {contract.customer?.tax_id && (
                            <p className="text-xs text-neutral-500 font-mono mt-0.5">{contract.customer.tax_id}</p>
                        )}
                    </div>

                    <div>
                        <p className="text-xs text-neutral-500 mb-1">{isRtl ? 'المشروع المرتبط' : 'Linked Project'}</p>
                        {contract.project ? (
                            <Link href={`/projects/${contract.project.id}`} className="text-indigo-600 hover:underline font-medium text-sm">
                                {contract.project.project_number} - {contract.project.name}
                            </Link>
                        ) : (
                            <span className="text-neutral-400 text-sm">-</span>
                        )}
                    </div>

                    <div>
                        <p className="text-xs text-neutral-500 mb-1">{isRtl ? 'حالة التجديد' : 'Renewal Policy'}</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {contract.auto_renew ? (isRtl ? 'تجديد سنوي تلقائي' : 'Automatic Renewal') : (isRtl ? 'انتهاء بنهاية الأجل' : 'Fixed Term Expiry')}
                        </p>
                    </div>
                </div>

                {contract.lines && contract.lines.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-500 uppercase">
                                    <th className="pb-3 text-start">{isRtl ? 'وصف البند / الخدمة' : 'Service Description'}</th>
                                    <th className="pb-3 text-end">{isRtl ? 'الكمية' : 'Quantity'}</th>
                                    <th className="pb-3 text-end">{isRtl ? 'السعر الدوري' : 'Recurring Price'}</th>
                                    <th className="pb-3 text-end">{isRtl ? 'الإجمالي' : 'Total'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {contract.lines.map((l) => (
                                    <tr key={l.id}>
                                        <td className="py-4 font-medium text-neutral-900 dark:text-neutral-100">{l.description}</td>
                                        <td className="py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">{parseFloat(l.quantity)}</td>
                                        <td className="py-4 text-end font-mono text-neutral-600 dark:text-neutral-400">{Number(l.unit_price).toLocaleString()}</td>
                                        <td className="py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">{Number(l.line_total).toLocaleString()} SAR</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-indigo-600" />
                        <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {isRtl ? 'عقد اشتراك دوري موحد' : 'Unified Retainer Subscription'}
                            </p>
                            <p className="text-xs text-neutral-500">
                                {isRtl
                                    ? 'يتم إصدار الفاتورة الشهرية/الدورية بالمبلغ الإجمالي تلقائياً'
                                    : 'Invoiced periodically with standard SLA service descriptions'}
                            </p>
                        </div>
                    </div>
                )}

                {contract.notes && (
                    <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">{isRtl ? 'شروط وملاحظات العقد' : 'Contract Terms & Notes'}</p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{contract.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
