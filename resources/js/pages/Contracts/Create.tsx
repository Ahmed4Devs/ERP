import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Save, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface Project {
    id: string;
    project_number: string;
    name: string;
}

interface Props {
    customers: Party[];
    projects: Project[];
    defaultStartDate: string;
    defaultEndDate: string;
    defaultNextBillingDate: string;
}

export default function ContractCreate({ customers, projects, defaultStartDate, defaultEndDate, defaultNextBillingDate }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        title_ar: '',
        customer_id: '',
        project_id: '',
        start_date: defaultStartDate,
        end_date: defaultEndDate,
        billing_cycle: 'monthly',
        recurring_amount: '5000',
        tax_rate: '0.100000',
        next_billing_date: defaultNextBillingDate,
        status: 'active',
        auto_renew: true,
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/contracts');
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
            <Head title={isRtl ? 'إنشاء عقد اشتراك جديد' : 'New Subscription Contract'} />

            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/contracts">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'إنشاء عقد اشتراك / اتفاقية مستوى خدمة' : 'New SLA / Subscription Contract'}
                    </h1>
                    <p className="text-sm text-neutral-500">
                        {isRtl ? 'تحديد دورة الفوترة، المبلغ التكراري، وتاريخ بدء الاستحقاق' : 'Configure billing cycle, recurring revenue, and next invoice date'}
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        {isRtl ? 'بيانات العقد' : 'Contract Information'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">{isRtl ? 'عنوان العقد (English) *' : 'Contract Title (EN) *'}</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="e.g. Annual IT Support & Cloud Retainer"
                                required
                            />
                            {errors.title && <p className="text-xs text-rose-500">{errors.title}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title_ar">{isRtl ? 'عنوان العقد (بالعربية)' : 'Contract Title (AR)'}</Label>
                            <Input
                                id="title_ar"
                                value={data.title_ar}
                                onChange={(e) => setData('title_ar', e.target.value)}
                                placeholder="مثال: عقد الصيانة والدعم السحابي السنوي"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customer_id">{isRtl ? 'العميل *' : 'Customer *'}</Label>
                            <select
                                id="customer_id"
                                value={data.customer_id}
                                onChange={(e) => setData('customer_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                required
                            >
                                <option value="">{isRtl ? '-- اختر العميل --' : '-- Select Customer --'}</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {isRtl && c.name_ar ? c.name_ar : c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="project_id">{isRtl ? 'المشروع المرتبط (اختياري)' : 'Linked Project (Optional)'}</Label>
                            <select
                                id="project_id"
                                value={data.project_id}
                                onChange={(e) => setData('project_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- بدون ربط بمشروع --' : '-- None --'}</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.project_number} - {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="billing_cycle">{isRtl ? 'دورة الفوترة *' : 'Billing Cycle *'}</Label>
                            <select
                                id="billing_cycle"
                                value={data.billing_cycle}
                                onChange={(e) => setData('billing_cycle', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="monthly">Monthly (شهرياً)</option>
                                <option value="quarterly">Quarterly (ربع سنوي - كل 3 أشهر)</option>
                                <option value="semi_annual">Semi-Annual (نصف سنوي - كل 6 أشهر)</option>
                                <option value="annual">Annual (سنوياً)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recurring_amount">{isRtl ? 'المبلغ الدوري التكراري (SAR) *' : 'Recurring Amount (SAR) *'}</Label>
                            <Input
                                id="recurring_amount"
                                type="number"
                                step="0.01"
                                value={data.recurring_amount}
                                onChange={(e) => setData('recurring_amount', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="start_date">{isRtl ? 'تاريخ بدء العقد *' : 'Start Date *'}</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end_date">{isRtl ? 'تاريخ انتهاء العقد *' : 'End Date *'}</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="next_billing_date">{isRtl ? 'تاريخ أول استحقاق للفوترة *' : 'Next Billing Date *'}</Label>
                            <Input
                                id="next_billing_date"
                                type="date"
                                value={data.next_billing_date}
                                onChange={(e) => setData('next_billing_date', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">{isRtl ? 'حالة العقد *' : 'Contract Status *'}</Label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="active">Active (ساري ونشط)</option>
                                <option value="draft">Draft (مسودة)</option>
                                <option value="suspended">Suspended (موقوف مؤقتاً)</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 sm:col-span-2 pt-2">
                            <input
                                type="checkbox"
                                id="auto_renew"
                                checked={data.auto_renew}
                                onChange={(e) => setData('auto_renew', e.target.checked)}
                                className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                            />
                            <Label htmlFor="auto_renew">{isRtl ? 'تجديد تلقائي عند انتهاء المدة (Auto Renew)' : 'Auto-Renew contract upon expiration'}</Label>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="notes">{isRtl ? 'ملاحظات وشروط الخدمة' : 'SLA Terms & Notes'}</Label>
                            <textarea
                                id="notes"
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                placeholder={isRtl ? 'شروط اتفاقية مستوى الخدمة، أوقات الاستجابة...' : 'SLA response times and service terms...'}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/contracts">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Save className="h-4 w-4" />
                        <span>{processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ العقد' : 'Save Contract')}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
