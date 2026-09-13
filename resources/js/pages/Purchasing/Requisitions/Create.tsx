import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, Trash2, FileText, ShoppingCart, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Department {
    id: string;
    name: string;
    code?: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    moving_average_cost?: string | number;
    standard_cost?: string | number;
}

interface RequisitionLineInput {
    product_id: string;
    description: string;
    quantity: number | string;
    estimated_unit_cost: number | string;
    notes: string;
}

interface Props {
    departments: Department[];
    products: Product[];
    defaultDate: string;
}

export default function CreatePurchaseRequisition({ departments, products, defaultDate }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        department_id: departments[0]?.id || '',
        required_date: defaultDate,
        priority: 'medium',
        notes: '',
        lines: [
            {
                product_id: '',
                description: '',
                quantity: '1',
                estimated_unit_cost: '0',
                notes: '',
            },
        ] as RequisitionLineInput[],
    });

    const addLine = () => {
        setData('lines', [
            ...data.lines,
            {
                product_id: '',
                description: '',
                quantity: '1',
                estimated_unit_cost: '0',
                notes: '',
            },
        ]);
    };

    const removeLine = (index: number) => {
        if (data.lines.length <= 1) return;
        setData('lines', data.lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof RequisitionLineInput, value: string) => {
        const updated = [...data.lines];
        updated[index] = { ...updated[index], [field]: value };

        // If product selected, auto-fill description and estimated cost
        if (field === 'product_id' && value) {
            const product = products.find((p) => p.id === value);
            if (product) {
                updated[index].description = product.name;
                const cost = Number(product.moving_average_cost || product.standard_cost || 0);
                if (cost > 0) {
                    updated[index].estimated_unit_cost = cost.toString();
                }
            }
        }

        setData('lines', updated);
    };

    const calculateSubtotal = () => {
        return data.lines.reduce((acc, line) => {
            const q = parseFloat(String(line.quantity)) || 0;
            const c = parseFloat(String(line.estimated_unit_cost)) || 0;
            return acc + q * c;
        }, 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/purchase-requisitions');
    };

    const totalEst = calculateSubtotal();

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
            <Head title={t('purchasing.requisitions.create', 'طلب شراء جديد')} />

            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="icon" className="h-9 w-9">
                        <Link href="/purchase-requisitions">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            <span>{t('purchasing.requisitions.newTitle', 'إنشاء طلب شراء داخلي (New Purchase Requisition)')}</span>
                        </h1>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {t('purchasing.requisitions.createHelp', 'قم بإدخال الأصناف والمواصفات المطلوبة تمهيداً لرفعها للاعتماد والتحويل لأمر شراء رسمي')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Header Information Card */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b pb-3 dark:border-neutral-800">
                        {t('purchasing.requisitions.generalInfo', 'المعلومات العامة للطلب')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Department */}
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                                {t('purchasing.requisitions.department', 'القسم الطالب')}
                            </label>
                            <select
                                value={data.department_id}
                                onChange={(e) => setData('department_id', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">-- {t('common.selectDepartment', 'اختر القسم')} --</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name} {d.code ? `(${d.code})` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.department_id && <p className="text-xs text-rose-500 mt-1">{errors.department_id}</p>}
                        </div>

                        {/* Required Date */}
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                                {t('purchasing.requisitions.requiredDate', 'تاريخ الحاجة المطلوب')}
                            </label>
                            <Input
                                type="date"
                                value={data.required_date}
                                onChange={(e) => setData('required_date', e.target.value)}
                                className="w-full"
                            />
                            {errors.required_date && <p className="text-xs text-rose-500 mt-1">{errors.required_date}</p>}
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                                {t('purchasing.requisitions.priority', 'درجة الأولوية')}
                            </label>
                            <select
                                value={data.priority}
                                onChange={(e) => setData('priority', e.target.value)}
                                className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="low">{t('purchasing.requisitions.priority.low', 'منخفضة (Low)')}</option>
                                <option value="medium">{t('purchasing.requisitions.priority.medium', 'متوسطة (Medium)')}</option>
                                <option value="high">{t('purchasing.requisitions.priority.high', 'عالية (High)')}</option>
                                <option value="urgent">{t('purchasing.requisitions.priority.urgent', 'طارئة / عاجلة (Urgent)')}</option>
                            </select>
                            {errors.priority && <p className="text-xs text-rose-500 mt-1">{errors.priority}</p>}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                            {t('purchasing.requisitions.justification', 'مبررات الشراء والملاحظات العامة')}
                        </label>
                        <textarea
                            rows={2}
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder={t('purchasing.requisitions.notesPlaceholder', 'اذكر سبب طلب الشراء، المشروع المستفيد أو أي مواصفات فنية إضافية...')}
                            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Items & Lines Card */}
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            <span>{t('purchasing.requisitions.itemsList', 'بنود وأصناف الشراء المطلوبة')}</span>
                        </h2>
                        <Button type="button" onClick={addLine} variant="outline" size="sm" className="gap-1.5 text-xs">
                            <Plus className="h-3.5 w-3.5" />
                            <span>{t('purchasing.requisitions.addItem', 'إضافة بند')}</span>
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-neutral-500 border-b dark:border-neutral-800">
                                    <th className="pb-2 text-start w-1/4">{t('purchasing.requisitions.item', 'الصنف (من المستودع)')}</th>
                                    <th className="pb-2 text-start w-1/3">{t('purchasing.requisitions.description', 'الوصف / المواصفات')} *</th>
                                    <th className="pb-2 text-start w-24">{t('purchasing.requisitions.qty', 'الكمية')} *</th>
                                    <th className="pb-2 text-start w-32">{t('purchasing.requisitions.estUnitCost', 'التكلفة التقديرية')}</th>
                                    <th className="pb-2 text-end w-32">{t('purchasing.requisitions.estLineTotal', 'الإجمالي التقديري')}</th>
                                    <th className="pb-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {data.lines.map((line, idx) => {
                                    const qty = parseFloat(String(line.quantity)) || 0;
                                    const cost = parseFloat(String(line.estimated_unit_cost)) || 0;
                                    const lineTotal = qty * cost;

                                    return (
                                        <tr key={idx} className="align-top py-2">
                                            {/* Product picker */}
                                            <td className="py-2.5 pe-2">
                                                <select
                                                    value={line.product_id}
                                                    onChange={(e) => updateLine(idx, 'product_id', e.target.value)}
                                                    className="w-full rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-2 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                                >
                                                    <option value="">-- {t('common.manualOrNonStock', 'يدوي / بند خدمة')} --</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} ({p.sku})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>

                                            {/* Description */}
                                            <td className="py-2.5 px-2">
                                                <Input
                                                    type="text"
                                                    value={line.description}
                                                    onChange={(e) => updateLine(idx, 'description', e.target.value)}
                                                    placeholder={t('purchasing.requisitions.descPlaceholder', 'اسم البند أو الوصف التفصيلي')}
                                                    className="h-8 text-xs"
                                                    required
                                                />
                                            </td>

                                            {/* Quantity */}
                                            <td className="py-2.5 px-2">
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    min="0.0001"
                                                    value={line.quantity}
                                                    onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                                                    className="h-8 text-xs font-mono"
                                                    required
                                                />
                                            </td>

                                            {/* Estimated Unit Cost */}
                                            <td className="py-2.5 px-2">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={line.estimated_unit_cost}
                                                    onChange={(e) => updateLine(idx, 'estimated_unit_cost', e.target.value)}
                                                    className="h-8 text-xs font-mono"
                                                />
                                            </td>

                                            {/* Estimated Total */}
                                            <td className="py-2.5 ps-2 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100 text-xs">
                                                {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                            </td>

                                            {/* Remove line */}
                                            <td className="py-2.5 ps-2 text-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLine(idx)}
                                                    disabled={data.lines.length <= 1}
                                                    className="h-7 w-7 text-neutral-400 hover:text-rose-600"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="flex justify-between items-center pt-4 border-t dark:border-neutral-800">
                        <div className="text-xs text-neutral-500">
                            {data.lines.length} {t('purchasing.requisitions.itemsCount', 'بنود مضافة')}
                        </div>
                        <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/60 px-4 py-2.5 rounded-lg">
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                {t('purchasing.requisitions.totalEstimated', 'إجمالي القيمة التقديرية:')}
                            </span>
                            <span className="text-lg font-bold font-mono text-primary">
                                {totalEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>
                </div>

                {/* Submit buttons */}
                <div className="flex items-center justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/purchase-requisitions">{t('common.cancel', 'إلغاء')}</Link>
                    </Button>
                    <Button type="submit" disabled={processing} className="bg-primary text-primary-foreground min-w-32">
                        {processing ? t('common.saving', 'جاري الحفظ...') : t('purchasing.requisitions.saveDraft', 'حفظ كمسودة')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
