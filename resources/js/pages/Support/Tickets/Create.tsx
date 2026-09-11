import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Save, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
    email?: string;
    phone?: string;
}

interface Project {
    id: string;
    project_number: string;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface Props {
    customers: Party[];
    projects: Project[];
    users: User[];
}

export default function TicketCreate({ customers, projects, users }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        project_id: '',
        contact_name: '',
        contact_email: '',
        subject: '',
        description: '',
        priority: 'medium',
        assigned_user_id: '',
    });

    const handleCustomerChange = (customerId: string) => {
        setData('customer_id', customerId);
        const c = customers.find(item => item.id === customerId);
        if (c) {
            if (!data.contact_name) setData('contact_name', c.name);
            if (!data.contact_email && c.email) setData('contact_email', c.email);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/support/tickets');
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
            <Head title={isRtl ? 'فتح تذكرة دعم جديدة' : 'Open Support Ticket'} />

            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/support/tickets">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'فتح تذكرة دعم فني جديدة' : 'Open Support Ticket'}
                    </h1>
                    <p className="text-sm text-neutral-500">
                        {isRtl ? 'تسجيل استفسار أو مشكلة تقنية وتعيين الأولوية والمسؤول' : 'Log inquiry, assign priority SLA, and designate support agent'}
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        {isRtl ? 'بيانات التذكرة والعميل' : 'Ticket Information'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="subject">{isRtl ? 'موضوع التذكرة / البلاغ *' : 'Subject *'}</Label>
                            <Input
                                id="subject"
                                value={data.subject}
                                onChange={(e) => setData('subject', e.target.value)}
                                placeholder={isRtl ? 'مثال: مشكلة في الاتصال ببوابة الربط أو طلب صلاحيات' : 'e.g. Inability to connect to API gateway after migration'}
                                required
                            />
                            {errors.subject && <p className="text-xs text-rose-500">{errors.subject}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customer_id">{isRtl ? 'العميل *' : 'Customer *'}</Label>
                            <select
                                id="customer_id"
                                value={data.customer_id}
                                onChange={(e) => handleCustomerChange(e.target.value)}
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
                            <Label htmlFor="contact_name">{isRtl ? 'اسم صاحب البلاغ *' : 'Contact Name *'}</Label>
                            <Input
                                id="contact_name"
                                value={data.contact_name}
                                onChange={(e) => setData('contact_name', e.target.value)}
                                placeholder="Fahad Al-Sulaiman"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contact_email">{isRtl ? 'البريد الإلكتروني للتواصل' : 'Contact Email'}</Label>
                            <Input
                                id="contact_email"
                                type="email"
                                value={data.contact_email}
                                onChange={(e) => setData('contact_email', e.target.value)}
                                placeholder="fahad@company.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">{isRtl ? 'مستوى الأهمية / الأولوية *' : 'Priority Level *'}</Label>
                            <select
                                id="priority"
                                value={data.priority}
                                onChange={(e) => setData('priority', e.target.value as any)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="low">Low (منخفضة)</option>
                                <option value="medium">Medium (متوسطة)</option>
                                <option value="high">High (عالية)</option>
                                <option value="urgent">Urgent (حرجة / طارئة)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="assigned_user_id">{isRtl ? 'الموظف المسؤول للدعم' : 'Assigned Support Agent'}</Label>
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

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="description">{isRtl ? 'تفاصيل المشكلة / نص البلاغ *' : 'Ticket Description & Details *'}</Label>
                            <textarea
                                id="description"
                                rows={5}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                placeholder={isRtl ? 'اشرح بالتفصيل المشكلة أو الاستفسار والخطوات لإعادة تكرارها...' : 'Describe the issue or inquiry in detail...'}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/support/tickets">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Save className="h-4 w-4" />
                        <span>{processing ? (isRtl ? 'جاري الإرسال...' : 'Submitting...') : (isRtl ? 'فتح التذكرة' : 'Open Ticket')}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
