import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Save, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface SalesOrder {
    id: string;
    order_number: string;
    total_amount: string;
}

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    first_name_ar?: string;
    last_name_ar?: string;
}

interface Props {
    customers: Party[];
    salesOrders: SalesOrder[];
    employees: Employee[];
    defaultStartDate: string;
    defaultEndDate: string;
}

export default function ProjectCreate({ customers, salesOrders, employees, defaultStartDate, defaultEndDate }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        name_ar: '',
        customer_id: '',
        sales_order_id: '',
        manager_id: '',
        start_date: defaultStartDate,
        end_date: defaultEndDate,
        budget_cost: '20000',
        budget_revenue: '50000',
        status: 'in_progress',
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/projects');
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
            <Head title={isRtl ? 'إنشاء مشروع جديد' : 'New Project'} />

            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/projects">
                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'إنشاء مشروع استشاري / تنفيذي' : 'New Project'}
                    </h1>
                    <p className="text-sm text-neutral-500">
                        {isRtl ? 'تحديد ميزانية التكاليف والإيرادات والربط مع أمر البيع ومدير المشروع' : 'Set budget revenue & costs, assign manager, and link sales order'}
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        {isRtl ? 'بيانات المشروع' : 'Project Information'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{isRtl ? 'اسم المشروع (English) *' : 'Project Name (EN) *'}</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. ERP Modernization & Migration"
                                required
                            />
                            {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name_ar">{isRtl ? 'اسم المشروع (بالعربية)' : 'Project Name (AR)'}</Label>
                            <Input
                                id="name_ar"
                                value={data.name_ar}
                                onChange={(e) => setData('name_ar', e.target.value)}
                                placeholder="مثال: تطوير البنية التحتية ونظام الموارد"
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
                            <Label htmlFor="sales_order_id">{isRtl ? 'أمر البيع المرتبط (اختياري)' : 'Linked Sales Order (Optional)'}</Label>
                            <select
                                id="sales_order_id"
                                value={data.sales_order_id}
                                onChange={(e) => setData('sales_order_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- بدون ربط بأمر بيع --' : '-- No Linked Order --'}</option>
                                {salesOrders.map((so) => (
                                    <option key={so.id} value={so.id}>
                                        {so.order_number} ({Number(so.total_amount).toLocaleString()} SAR)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="manager_id">{isRtl ? 'مدير المشروع' : 'Project Manager'}</Label>
                            <select
                                id="manager_id"
                                value={data.manager_id}
                                onChange={(e) => setData('manager_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">{isRtl ? '-- غير محدد --' : '-- Unassigned --'}</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">{isRtl ? 'حالة المشروع *' : 'Project Status *'}</Label>
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                            >
                                <option value="planning">Planning (تخطيط)</option>
                                <option value="in_progress">In Progress (قيد التنفيذ)</option>
                                <option value="on_hold">On Hold (معلق مؤقتاً)</option>
                                <option value="completed">Completed (مكتمل)</option>
                                <option value="cancelled">Cancelled (ملغي)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="start_date">{isRtl ? 'تاريخ البدء *' : 'Start Date *'}</Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData('start_date', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="end_date">{isRtl ? 'تاريخ الانتهاء المتوقع' : 'Target End Date'}</Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData('end_date', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        {isRtl ? 'الميزانية التقديرية للربحية' : 'Budget & Financial Planning'}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="budget_revenue">{isRtl ? 'ميزانية الإيرادات التقديرية (SAR) *' : 'Budget Revenue (SAR) *'}</Label>
                            <Input
                                id="budget_revenue"
                                type="number"
                                step="0.01"
                                value={data.budget_revenue}
                                onChange={(e) => setData('budget_revenue', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="budget_cost">{isRtl ? 'ميزانية التكاليف المباشرة المقدرة (SAR) *' : 'Budget Cost (SAR) *'}</Label>
                            <Input
                                id="budget_cost"
                                type="number"
                                step="0.01"
                                value={data.budget_cost}
                                onChange={(e) => setData('budget_cost', e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="notes">{isRtl ? 'نطاق العمل وملاحظات المشروع' : 'Scope of Work & Notes'}</Label>
                            <textarea
                                id="notes"
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                                placeholder={isRtl ? 'تسجيل مخرجات المشروع، التسليمات الرئيسية، وأي شروط خاصة...' : 'Outline key deliverables, milestones, and scope...'}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/projects">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Save className="h-4 w-4" />
                        <span>{processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ المشروع' : 'Save Project')}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
