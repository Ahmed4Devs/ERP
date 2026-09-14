import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Wallet, ArrowLeft, Building2, User, CreditCard, DollarSign, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Employee {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    department?: { name: string };
}

interface Branch {
    id: string;
    name: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface Props {
    employees: Employee[];
    branches: Branch[];
    accounts: Account[];
}

export default function CustodyCreate({ employees, branches, accounts }: Props) {
    const { isRtl } = useTranslation();

    const [form, setForm] = useState({
        employee_id: employees[0]?.id || '',
        branch_id: branches[0]?.id || '',
        type: 'temporary',
        purpose: '',
        amount: '',
        disbursement_method: 'bank_transfer',
        disbursement_account_id: accounts[0]?.id || '',
        auto_disburse: true,
        notes: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/hr/custodies', form, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={isRtl ? 'صرف عهدة جديدة لموظف' : 'Issue New Employee Custody'} />

            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                    <Link href="/hr/custodies">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-indigo-600" />
                        {isRtl ? 'صرف عهدة نقدية / بنكية جديدة لموظف' : 'Issue New Employee Custody Advance'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        {isRtl
                            ? 'إصدار وتخصيص عهدة مالية لموظف مع الترحيل الآلي لحساب سلف وعهد الموظفين (1140)'
                            : 'Create and allocate an advance with GL posting to Employee Advances Account (1140)'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-5">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        {isRtl ? 'بيانات الموظف والعهدة' : 'Employee & Custody Details'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {isRtl ? 'الموظف المستلم للعهدة *' : 'Employee *'}
                            </label>
                            <select
                                required
                                value={form.employee_id}
                                onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-sm"
                            >
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name} ({emp.employee_number})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {isRtl ? 'الفرع التابع *' : 'Branch *'}
                            </label>
                            <select
                                value={form.branch_id}
                                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-sm"
                            >
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {isRtl ? 'نوع العهدة *' : 'Custody Type *'}
                            </label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-sm"
                            >
                                <option value="temporary">{isRtl ? 'عهدة مؤقتة (لمشروع / مهمة عمل / مشتريات محددة)' : 'Temporary (Single Mission / Project)'}</option>
                                <option value="permanent">{isRtl ? 'عهدة مستديمة (دورية لمدير فرع / مشرف)' : 'Permanent Operating Float'}</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {isRtl ? 'مبلغ العهدة المصروف (SAR) *' : 'Advance Amount (SAR) *'}
                            </label>
                            <Input
                                required
                                type="number"
                                step="any"
                                min="0.01"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                placeholder="0.00"
                                className="mt-1 font-mono text-base font-bold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            {isRtl ? 'الغرض وتفاصيل الاستخدام *' : 'Purpose & Usage Description *'}
                        </label>
                        <Input
                            required
                            type="text"
                            value={form.purpose}
                            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                            placeholder={isRtl ? 'مثال: عهدة نقدية لشراء أدوات صيانة لموقع مشروع الرياض' : 'e.g. Purchase site equipment and consumables'}
                            className="mt-1 text-sm"
                        />
                    </div>
                </div>

                {/* Accounting & Disbursement Method */}
                <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-5">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-3 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-indigo-600" />
                        {isRtl ? 'طريقة الصرف والقيود المحاسبية' : 'Disbursement & Accounting Configuration'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {isRtl ? 'وسيلة التحويل / الصرف *' : 'Disbursement Method *'}
                            </label>
                            <select
                                value={form.disbursement_method}
                                onChange={(e) => setForm({ ...form, disbursement_method: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-sm"
                            >
                                <option value="bank_transfer">{isRtl ? 'تحويل بنكي مباشر لحساب الموظف' : 'Bank Wire Transfer'}</option>
                                <option value="cash">{isRtl ? 'صرف نقدي من الصندوق الرئيسي' : 'Cash from Vault'}</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {isRtl ? 'الحساب المسحوب منه (البنك / الصندوق) *' : 'Disbursement Account (CR) *'}
                            </label>
                            <select
                                value={form.disbursement_account_id}
                                onChange={(e) => setForm({ ...form, disbursement_account_id: e.target.value })}
                                className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-sm font-mono"
                            >
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {isRtl ? (acc.name_ar || acc.name) : acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-sm text-indigo-900 dark:text-indigo-200">
                                {isRtl ? 'صرف العهدة وترحيل القيد المحاسبي فوراً' : 'Disburse & Post GL Journal Immediately'}
                            </p>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
                                {isRtl
                                    ? 'سيتم توليد قيد اليومية (من حـ/ سلف وعهد الموظفين 1140 إلى حـ/ البنك أو الصندوق) تلقائياً'
                                    : 'Automatically posts (DR 1140 Employee Custody / CR Bank or Cash)'}
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={form.auto_disburse}
                            onChange={(e) => setForm({ ...form, auto_disburse: e.target.checked })}
                            className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            {isRtl ? 'ملاحظات إضافية' : 'Additional Notes'}
                        </label>
                        <textarea
                            rows={2}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder={isRtl ? 'أي شروط أو بنود خاصة بالعهدة...' : 'Any terms or instructions...'}
                            className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2 text-xs"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/hr/custodies">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                        {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ وصرف العهدة' : 'Save & Disburse Advance')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
