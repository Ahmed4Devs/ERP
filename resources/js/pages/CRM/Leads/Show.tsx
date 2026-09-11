import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle2, UserCheck, Calendar, DollarSign, Mail, Phone, Building2, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
}

interface Lead {
    id: string;
    lead_number: string;
    title: string;
    party?: Party;
    contact_name: string;
    email?: string;
    phone?: string;
    company_name?: string;
    source: string;
    status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
    estimated_value: string;
    probability_percent: number;
    assigned_user?: UserData;
    loss_reason?: string;
    notes?: string;
    converted_at?: string;
    created_at: string;
}

interface Props {
    lead: Lead;
}

export default function LeadShow({ lead }: Props) {
    const { t, isRtl } = useTranslation();

    const handleConvert = () => {
        if (confirm(isRtl ? 'هل ترغب في تحويل هذه الفرصة إلى عميل مسجل وإنشاء عرض أسعار رسمي؟' : 'Do you want to convert this lead into a registered customer and generate a sales quotation?')) {
            router.post(`/crm/leads/${lead.id}/convert`);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full">
            <Head title={`${lead.lead_number} - ${lead.title}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/crm/leads">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-neutral-500">{lead.lead_number}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                lead.status === 'won'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : lead.status === 'lost'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                                {lead.status}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1">
                            {lead.title}
                        </h1>
                    </div>
                </div>

                {lead.status !== 'won' && (
                    <Button onClick={handleConvert} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{isRtl ? 'تحويل لعميل وعرض أسعار' : 'Convert to Customer & Quote'}</span>
                    </Button>
                )}
            </div>

            {/* Main Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                            {isRtl ? 'تفاصيل الاتصال والعميل' : 'Customer & Contact Details'}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-neutral-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-neutral-500">{isRtl ? 'جهة الاتصال' : 'Contact Person'}</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{lead.contact_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Building2 className="h-5 w-5 text-neutral-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-neutral-500">{isRtl ? 'المنشأة / الشركة' : 'Company'}</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{lead.company_name || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="h-5 w-5 text-neutral-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-neutral-500">{isRtl ? 'البريد الإلكتروني' : 'Email'}</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{lead.email || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-neutral-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-neutral-500">{isRtl ? 'الهاتف' : 'Phone'}</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{lead.phone || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {lead.notes && (
                            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <p className="text-xs font-medium text-neutral-500 mb-1">{isRtl ? 'الملاحظات' : 'Notes'}</p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{lead.notes}</p>
                            </div>
                        )}
                    </div>

                    {lead.converted_at && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <UserCheck className="h-6 w-6 text-emerald-600" />
                                <div>
                                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                                        {isRtl ? 'تم تحويل هذه الفرصة بنجاح' : 'Lead Successfully Converted'}
                                    </p>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                        {isRtl ? `تاريخ التحويل: ${lead.converted_at}` : `Converted on: ${lead.converted_at}`}
                                    </p>
                                </div>
                            </div>
                            <Button asChild variant="outline" size="sm" className="bg-white dark:bg-neutral-900">
                                <Link href="/sales/quotations">{isRtl ? 'عرض عروض الأسعار' : 'View Quotations'}</Link>
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                            {isRtl ? 'مؤشرات الصفقة' : 'Deal Metrics'}
                        </h3>
                        <div>
                            <p className="text-xs text-neutral-500">{isRtl ? 'القيمة التقديرية' : 'Estimated Value'}</p>
                            <p className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-1">
                                {Number(lead.estimated_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </p>
                        </div>

                        <div>
                            <div className="flex justify-between text-xs text-neutral-500 mb-1">
                                <span>{isRtl ? 'احتمالية الفوز' : 'Win Probability'}</span>
                                <span className="font-mono font-bold">{lead.probability_percent}%</span>
                            </div>
                            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full transition-all"
                                    style={{ width: `${lead.probability_percent}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{isRtl ? 'المصدر' : 'Source'}</span>
                                <span className="font-medium capitalize">{lead.source}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{isRtl ? 'المسؤول' : 'Assigned Rep'}</span>
                                <span className="font-medium">{lead.assigned_user?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">{isRtl ? 'تاريخ الإنشاء' : 'Created At'}</span>
                                <span className="font-mono text-xs">{lead.created_at?.slice(0, 10)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
