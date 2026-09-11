import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Save, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface User {
    id: number;
    name: string;
}

interface Props {
    customers: Party[];
    users: User[];
}

export default function LeadCreate({ customers, users }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        party_id: '',
        contact_name: '',
        company_name: '',
        email: '',
        phone: '',
        source: 'website',
        status: 'new',
        estimated_value: '10000',
        probability_percent: 20,
        assigned_user_id: '',
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/crm/leads');
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
            <Head title={isRtl ? 'إضافة فرصة بيعية جديدة' : 'New Sales Lead'} />

            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/crm/leads">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'إضافة فرصة بيعية / عميل محتمل' : 'New Sales Opportunity / Lead'}
                    </h1>
                    <p className="text-sm text-neutral-500">
                        {isRtl ? 'تسجيل بيانات الفرصة التجارية وتحديد احتمالية الإغلاق والقيمة المتوقعة' : 'Register lead details, closing probability, and expected value'}
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        {isRtl ? 'البيانات الأساسية للفرصة' : 'Core Lead Information'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="title">{isRtl ? 'عنوان الفرصة *' : 'Opportunity Title *'}</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder={isRtl ? 'مثال: تطبيق نظام ERP سحابي متكامل' : 'e.g. Enterprise Cloud ERP Implementation'}
                                required
                            />
                            {errors.title && <p className="text-xs text-rose-500">{errors.title}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_name">{isRtl ? 'اسم جهة الاتصال *' : 'Contact Person *'}</Label>
                            <Input
                                id="contact_name"
                                value={data.contact_name}
                                onChange={(e) => setData('contact_name', e.target.value)}
                                placeholder="Fahad Al-Sulaiman"
                                required
                            />
                            {errors.contact_name && <p className="text-xs text-rose-500">{errors.contact_name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="company_name">{isRtl ? 'اسم الشركة / المنشأة' : 'Company Name'}</Label>
                            <Input
                                id="company_name"
                                value={data.company_name}
                                onChange={(e) => setData('company_name', e.target.value)}
                                placeholder="Al-Safwa Trading Group"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">{isRtl ? 'البريد الإلكتروني' : 'Email Address'}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="fahad@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">{isRtl ? 'رقم الهاتف / الجوال' : 'Phone Number'}</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                placeholder="+966 50 000 0000"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="party_id">{isRtl ? 'ربط بعميل موجود مسبقاً (اختياري)' : 'Link to Existing Customer (Optional)'}</Label>
                            <select
                                id="party_id"
                                value={data.party_id}
                                onChange={(e) => setData('party_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- عميل جديد غير مسجل --' : '-- New Unregistered Customer --'}</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {isRtl && c.name_ar ? c.name_ar : c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assigned_user_id">{isRtl ? 'المسؤول التجاري / مندوب المبيعات' : 'Assigned Sales Rep'}</Label>
                            <select
                                id="assigned_user_id"
                                value={data.assigned_user_id}
                                onChange={(e) => setData('assigned_user_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- غير محدد --' : '-- Unassigned --'}</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        {isRtl ? 'المؤشرات المالية ومسار الصفقة' : 'Pipeline & Financial Metrics'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="estimated_value">{isRtl ? 'القيمة التقديرية (SAR) *' : 'Estimated Value (SAR) *'}</Label>
                            <Input
                                id="estimated_value"
                                type="number"
                                step="0.01"
                                value={data.estimated_value}
                                onChange={(e) => setData('estimated_value', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="probability_percent">{isRtl ? 'نسبة احتمالية الإغلاق (%)' : 'Win Probability (%)'}</Label>
                            <Input
                                id="probability_percent"
                                type="number"
                                min="0"
                                max="100"
                                value={data.probability_percent}
                                onChange={(e) => setData('probability_percent', parseInt(e.target.value) || 0)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="source">{isRtl ? 'مصدر الفرصة *' : 'Lead Source *'}</Label>
                            <select
                                id="source"
                                value={data.source}
                                onChange={(e) => setData('source', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="website">Website (الموقع الإلكتروني)</option>
                                <option value="referral">Referral (توصية / إحالة)</option>
                                <option value="cold_call">Direct Call (اتصال مباشر)</option>
                                <option value="partner">Partner (شريك أعمال)</option>
                                <option value="exhibition">Exhibition / Event (معرض / مؤتمر)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">{isRtl ? 'المرحلة الحالية *' : 'Pipeline Stage *'}</Label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="new">New Lead (فرصة جديدة)</option>
                                <option value="contacted">Contacted (تم التواصل)</option>
                                <option value="qualified">Qualified (مؤهلة)</option>
                                <option value="proposal">Proposal Sent (تقديم عرض)</option>
                                <option value="won">Won (تم الإغلاق بنجاح)</option>
                                <option value="lost">Lost (فرصة ملغاة / خسارة)</option>
                            </select>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="notes">{isRtl ? 'ملاحظات وتفاصيل إضافية' : 'Notes & Key Requirements'}</Label>
                            <textarea
                                id="notes"
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                placeholder={isRtl ? 'سجل أي متطلبات أو جدول زمني تم مناقشته مع العميل...' : 'Record any requirements or timeline discussed...'}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/crm/leads">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Save className="h-4 w-4" />
                        <span>{processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الفرصة البيعية' : 'Save Lead')}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
