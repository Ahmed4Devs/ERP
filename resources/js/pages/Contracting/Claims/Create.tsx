import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { HardHat, ArrowLeft, Plus, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface Project {
    id: string;
    name: string;
}

interface ClaimLineInput {
    work_description: string;
    scheduled_value: string;
    previous_percentage: string;
    current_percentage: string;
}

interface Props {
    projects: Project[];
    customers: Party[];
}

export default function ContractingClaimCreate({ projects, customers }: Props) {
    const { t, isRtl } = useTranslation();

    const [form, setForm] = useState({
        claim_number: `CLM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        project_id: projects[0]?.id || '',
        customer_id: customers[0]?.id || '',
        claim_date: new Date().toISOString().slice(0, 10),
        contract_value: '500000.00',
        previous_billed_amount: '0.00',
        retention_rate: '0.05',
        notes: '',
        items: [
            {
                work_description: 'Milestone 1: Foundation and Structural Concrete Works',
                scheduled_value: '200000.00',
                previous_percentage: '0.00',
                current_percentage: '0.35',
            },
        ] as ClaimLineInput[],
    });

    const addItem = () => {
        setForm({
            ...form,
            items: [
                ...form.items,
                {
                    work_description: '',
                    scheduled_value: '100000.00',
                    previous_percentage: '0.00',
                    current_percentage: '0.25',
                },
            ],
        });
    };

    const removeItem = (index: number) => {
        setForm({
            ...form,
            items: form.items.filter((_, i) => i !== index),
        });
    };

    const updateItem = (index: number, field: keyof ClaimLineInput, value: string) => {
        const updated = [...form.items];
        updated[index] = { ...updated[index], [field]: value };
        setForm({ ...form, items: updated });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/contracting/claims', form);
    };

    // Calculate live preview totals
    const currentWorkPreview = form.items.reduce((acc, item) => {
        const sched = parseFloat(item.scheduled_value || '0');
        const prev = parseFloat(item.previous_percentage || '0');
        const curr = parseFloat(item.current_percentage || '0');
        const delta = Math.max(0, curr - prev);
        return acc + sched * delta;
    }, 0);

    const retentionPreview = currentWorkPreview * parseFloat(form.retention_rate || '0.05');
    const netClaimPreview = currentWorkPreview - retentionPreview;
    const taxPreview = netClaimPreview * 0.10;
    const totalPreview = netClaimPreview + taxPreview;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={isRtl ? 'إعداد مستخلص مقاولات جديد' : 'New Progress Claim'} />

            {/* Header */}
            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                    <Link href="/contracting/claims">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <HardHat className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'إعداد مستخلص مقاولات وإنجاز أعمال' : 'New Construction Progress Claim'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'تسجيل بنود الأعمال المنجزة وحسم محتجز الضمان التعاقدي 5% تلقائياً'
                            : 'Certify percentage-of-completion work, apply contractual retention withholding'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 border-b pb-3">
                        {isRtl ? 'بيانات المشروع والتعاقد' : 'Contract & Project Details'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'رقم المستخلص' : 'Claim #'}
                            </label>
                            <Input
                                required
                                value={form.claim_number}
                                onChange={(e) => setForm({ ...form, claim_number: e.target.value })}
                                className="mt-1 font-mono uppercase"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'المشروع الإنشائي' : 'Project'}
                            </label>
                            <select
                                required
                                className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                value={form.project_id}
                                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                            >
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'المالك / العميل' : 'Client / Employer'}
                            </label>
                            <select
                                required
                                className="mt-1 w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
                                value={form.customer_id}
                                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                            >
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {isRtl && c.name_ar ? c.name_ar : c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'إجمالي قيمة العقد (SAR)' : 'Total Contract Value'}
                            </label>
                            <Input
                                required
                                type="number"
                                step="any"
                                value={form.contract_value}
                                onChange={(e) => setForm({ ...form, contract_value: e.target.value })}
                                className="mt-1 font-mono"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'تاريخ المستخلص' : 'Claim Date'}
                            </label>
                            <Input
                                required
                                type="date"
                                value={form.claim_date}
                                onChange={(e) => setForm({ ...form, claim_date: e.target.value })}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                {isRtl ? 'نسبة حجز الضمان (Retention Rate)' : 'Retention Withholding Rate'}
                            </label>
                            <Input
                                required
                                type="number"
                                step="any"
                                value={form.retention_rate}
                                onChange={(e) => setForm({ ...form, retention_rate: e.target.value })}
                                className="mt-1 font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* Claim Items */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-indigo-600" />
                            {isRtl ? 'بنود الأعمال المنجزة (Bill of Quantities / Milestones)' : 'Work Progress Breakdown'}
                        </h3>
                        <Button type="button" onClick={addItem} size="sm" variant="outline" className="gap-1 text-xs">
                            <Plus className="h-3.5 w-3.5" />
                            <span>{isRtl ? 'إضافة بند عمل' : 'Add Item'}</span>
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {form.items.map((item, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
                                <div className="flex-1 w-full">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'وصف بند الأعمال' : 'Work Description'}
                                    </label>
                                    <Input
                                        required
                                        placeholder="e.g. Concrete foundations pouring and curing"
                                        value={item.work_description}
                                        onChange={(e) => updateItem(idx, 'work_description', e.target.value)}
                                        className="mt-1 text-xs"
                                    />
                                </div>

                                <div className="w-full sm:w-32">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'القيمة التعاقدية للبند' : 'Scheduled Value'}
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={item.scheduled_value}
                                        onChange={(e) => updateItem(idx, 'scheduled_value', e.target.value)}
                                        className="mt-1 font-mono text-xs"
                                    />
                                </div>

                                <div className="w-full sm:w-28">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'الإنجاز السابق (0-1)' : 'Prev %'}
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={item.previous_percentage}
                                        onChange={(e) => updateItem(idx, 'previous_percentage', e.target.value)}
                                        className="mt-1 font-mono text-xs"
                                    />
                                </div>

                                <div className="w-full sm:w-28">
                                    <label className="text-xs font-medium text-neutral-500">
                                        {isRtl ? 'الإنجاز الحالي (0-1)' : 'Current %'}
                                    </label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={item.current_percentage}
                                        onChange={(e) => updateItem(idx, 'current_percentage', e.target.value)}
                                        className="mt-1 font-mono text-xs text-emerald-600 font-bold"
                                    />
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={form.items.length <= 1}
                                    onClick={() => removeItem(idx)}
                                    className="h-8 w-8 text-neutral-400 hover:text-rose-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Financial Rollup Preview */}
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-white p-6 shadow-md grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <span className="text-xs text-neutral-400">{isRtl ? 'الأعمال المنجزة حالياً:' : 'Current Certified Work:'}</span>
                        <p className="text-lg font-bold font-mono text-white mt-1">{currentWorkPreview.toFixed(2)} SAR</p>
                    </div>

                    <div>
                        <span className="text-xs text-neutral-400">{isRtl ? 'محتجز الضمان (5%):' : 'Retention Withheld (5%):'}</span>
                        <p className="text-lg font-bold font-mono text-amber-400 mt-1">-{retentionPreview.toFixed(2)} SAR</p>
                    </div>

                    <div>
                        <span className="text-xs text-neutral-400">{isRtl ? 'ضريبة القيمة المضافة (10%):' : 'VAT (10%):'}</span>
                        <p className="text-lg font-bold font-mono text-neutral-300 mt-1">{taxPreview.toFixed(2)} SAR</p>
                    </div>

                    <div>
                        <span className="text-xs text-neutral-400">{isRtl ? 'المجموع الإجمالي المطلوب:' : 'Net Total Claim:'}</span>
                        <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{totalPreview.toFixed(2)} SAR</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/contracting/claims">{isRtl ? 'إلغاء' : 'Cancel'}</Link>
                    </Button>
                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isRtl ? 'حفظ وتقديم المستخلص' : 'Save & Submit Progress Claim'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
