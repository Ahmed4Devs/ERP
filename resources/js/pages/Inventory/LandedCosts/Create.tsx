import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Layers, Calculator, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface GoodsReceipt {
    id: string;
    receipt_number: string;
    date: string;
    warehouse: { id: string; name: string };
    party: { id: string; name: string };
    total_cost: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface Party {
    id: string;
    name: string;
}

interface Props {
    goodsReceipts: GoodsReceipt[];
    accounts: Account[];
    vendors: Party[];
    saudiPorts?: Array<{ code: string; name_ar: string; name_en: string; type: string }>;
}

export default function LandedCostsCreate({ goodsReceipts, accounts, vendors, saudiPorts = [] }: Props) {
    const { t, isRtl } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    const { data, setData, post, processing, errors } = useForm({
        date: new Date().toISOString().split('T')[0],
        allocation_method: 'by_value',
        goods_receipt_ids: [] as string[],
        customs_declaration_number: '',
        customs_declaration_date: '',
        port_of_entry: '',
        bill_of_lading: '',
        customs_broker_id: '',
        customs_broker_name: '',
        customs_duty_amount: '',
        customs_vat_amount: '',
        freight_amount: '',
        port_handling_amount: '',
        insurance_amount: '',
        other_charges_amount: '',
        charges: [
            { cost_type: 'customs_duty', description: 'رسوم جمركية / Customs Duty', amount: '', vendor_party_id: '', expense_account_id: '' }
        ],
        notes: '',
    });

    const addCharge = () => {
        setData('charges', [
            ...data.charges,
            { cost_type: 'freight', description: '', amount: '', vendor_party_id: '', expense_account_id: '' }
        ]);
    };

    const removeCharge = (index: number) => {
        if (data.charges.length > 1) {
            setData('charges', data.charges.filter((_, i) => i !== index));
        }
    };

    const updateCharge = (index: number, field: string, value: any) => {
        const updated = [...data.charges];
        (updated[index] as any)[field] = value;
        setData('charges', updated);
    };

    const toggleReceipt = (id: string) => {
        const current = [...data.goods_receipt_ids];
        const index = current.indexOf(id);
        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(id);
        }
        setData('goods_receipt_ids', current);
    };

    const totalEstimatedCharges = data.charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/landed-costs');
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.landedCosts', 'تكاليف الاستيراد الإضافية'), href: '/inventory/landed-costs' },
            { title: t('common.create', 'إنشاء سند جديد'), href: '/inventory/landed-costs/create' }
        ]}>
            <Head title={t('landedCost.createTitle', 'إنشاء سند تكاليف استيراد')} />

            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/inventory/landed-costs">
                            <Button variant="ghost" size="icon">
                                <BackIcon className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {t('landedCost.createTitle', 'إنشاء سند تكاليف إضافية (Landed Cost Voucher)')}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {t('landedCost.createSubtitle', 'اختر أذون الاستلام وأضف مصاريف الشحن والجمارك لتوزيعها')}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Settings */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                        <h2 className="font-semibold text-foreground flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-500" />
                            {t('landedCost.basicInfo', 'البيانات الأساسية وطريقة التوزيع')}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    {t('common.date', 'التاريخ')} *
                                </label>
                                <Input
                                    type="date"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    required
                                />
                                {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    {t('landedCost.method', 'طريقة التوزيع')} *
                                </label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={data.allocation_method}
                                    onChange={(e) => setData('allocation_method', e.target.value)}
                                >
                                    <option value="by_value">{t('landedCost.byValue', 'حسب القيمة (CIF Value)')}</option>
                                    <option value="by_quantity">{t('landedCost.byQuantity', 'حسب الكمية (Quantity)')}</option>
                                    <option value="by_weight">{t('landedCost.byWeight', 'حسب الوزن الإجمالي (Gross Weight - KG)')}</option>
                                    <option value="by_volume">{t('landedCost.byVolume', 'حسب الحجم بالمتر المكعب (Volume - CBM)')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    {t('common.notes', 'ملاحظات')}
                                </label>
                                <Input
                                    placeholder={t('landedCost.notesPlaceholder', 'ملاحظات إضافية حول الشحنة أو الاستيراد...')}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* FASAH Saudi Customs Declaration Card */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <h2 className="font-semibold text-foreground flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                    فاسح
                                </span>
                                {t('landedCost.customsDeclaration', 'بيانات البيان الجمركي المعتمد (منصة فاسح FASAH / ZATCA)')}
                            </h2>
                            <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full font-medium">
                                الامتثال الجمركي والضريبي السعودي
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    رقم البيان الجمركي (FASAH No.)
                                </label>
                                <Input
                                    placeholder="مثال: 2409151234"
                                    value={data.customs_declaration_number}
                                    onChange={(e) => setData('customs_declaration_number', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    تاريخ البيان الجمركي
                                </label>
                                <Input
                                    type="date"
                                    value={data.customs_declaration_date}
                                    onChange={(e) => setData('customs_declaration_date', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    منفذ الدخول الجمركي (Port of Entry)
                                </label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={data.port_of_entry}
                                    onChange={(e) => setData('port_of_entry', e.target.value)}
                                >
                                    <option value="">-- اختر منفذ الدخول --</option>
                                    {saudiPorts.map((p) => (
                                        <option key={p.code} value={p.name_ar}>
                                            {p.name_ar} ({p.name_en})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    رقم بوليصة الشحن (Bill of Lading / B/L)
                                </label>
                                <Input
                                    placeholder="مثال: MAEU12345678"
                                    value={data.bill_of_lading}
                                    onChange={(e) => setData('bill_of_lading', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    المخلص الجمركي (Customs Broker)
                                </label>
                                <select
                                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={data.customs_broker_id}
                                    onChange={(e) => {
                                        setData('customs_broker_id', e.target.value);
                                        const vendor = vendors.find(v => v.id === e.target.value);
                                        if (vendor) setData('customs_broker_name', vendor.name);
                                    }}
                                >
                                    <option value="">-- اختر مكتب التخليص / المورد --</option>
                                    {vendors.map((v) => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    اسم المخلص الجمركي (يدوياً)
                                </label>
                                <Input
                                    placeholder="اسم مكتب التخليص الجمركي"
                                    value={data.customs_broker_name}
                                    onChange={(e) => setData('customs_broker_name', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    ضريبة الواردات الجمركية 15% (ZATCA Box 8)
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={data.customs_vat_amount}
                                    onChange={(e) => setData('customs_vat_amount', e.target.value)}
                                />
                                <span className="text-[10px] text-muted-foreground">تُثبت كمدخلات ضريبية مستردة بإقرار زاتكا</span>
                            </div>
                        </div>
                    </div>

                    {/* Step 1: Select Goods Receipts */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold text-foreground flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-indigo-500" />
                                {t('landedCost.selectReceipts', '1. تحديد أذون استلام البضائع المرتبطة بالشحنة')}
                            </h2>
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {data.goods_receipt_ids.length} {t('landedCost.selected', 'محدد')}
                            </span>
                        </div>

                        {errors.goods_receipt_ids && (
                            <p className="text-xs text-rose-500">{errors.goods_receipt_ids}</p>
                        )}

                        <div className="max-h-60 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                            {goodsReceipts.length === 0 ? (
                                <p className="p-4 text-center text-xs text-muted-foreground">
                                    {t('landedCost.noReceiptsAvailable', 'لا توجد أذون استلام بضائع مرحّلة حالياً')}
                                </p>
                            ) : (
                                goodsReceipts.map((rcpt) => {
                                    const isSelected = data.goods_receipt_ids.includes(rcpt.id);
                                    return (
                                        <div
                                            key={rcpt.id}
                                            onClick={() => toggleReceipt(rcpt.id)}
                                            className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                                                isSelected ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : 'hover:bg-muted/40'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="rounded border-input text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold font-mono text-foreground">{rcpt.receipt_number}</p>
                                                    <p className="text-xs text-muted-foreground">{rcpt.party?.name} • {rcpt.warehouse?.name} • {rcpt.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-end">
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {Number(rcpt.total_cost).toLocaleString()} SAR
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Step 2: Cost Charges */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="font-semibold text-foreground flex items-center gap-2">
                                <Calculator className="w-4 h-4 text-indigo-500" />
                                {t('landedCost.charges', '2. بنود المصاريف الإضافية (جمارك، شحن، تخليص، تأمين)')}
                            </h2>
                            <Button type="button" variant="outline" size="sm" onClick={addCharge} className="gap-1.5">
                                <Plus className="w-3.5 h-3.5" />
                                {t('landedCost.addCharge', 'إضافة مصروف')}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {data.charges.map((charge, idx) => (
                                <div key={idx} className="p-3 bg-muted/30 border border-border rounded-lg grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                    <div className="md:col-span-3">
                                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">{t('landedCost.chargeType', 'نوع المصروف')}</label>
                                        <select
                                            className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                                            value={charge.cost_type}
                                            onChange={(e) => updateCharge(idx, 'cost_type', e.target.value)}
                                        >
                                            <option value="customs">{t('landedCost.types.customs', 'جمارك (Customs)')}</option>
                                            <option value="freight">{t('landedCost.types.freight', 'شحن دولي (Freight)')}</option>
                                            <option value="clearance">{t('landedCost.types.clearance', 'تخليص جمركي (Clearance)')}</option>
                                            <option value="insurance">{t('landedCost.types.insurance', 'تأمين شحن (Insurance)')}</option>
                                            <option value="port_handling">{t('landedCost.types.port', 'أجور موانئ ومناولة (Port)')}</option>
                                            <option value="other">{t('landedCost.types.other', 'أخرى (Other)')}</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">{t('common.description', 'البيان')}</label>
                                        <Input
                                            className="h-8 text-xs"
                                            placeholder="تفاصيل المصروف..."
                                            value={charge.description}
                                            onChange={(e) => updateCharge(idx, 'description', e.target.value)}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">{t('common.amount', 'المبلغ')} *</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="h-8 text-xs font-mono font-semibold"
                                            placeholder="0.00"
                                            value={charge.amount}
                                            onChange={(e) => updateCharge(idx, 'amount', e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">{t('landedCost.vendorOrAccount', 'المورد / الحساب المقابل')}</label>
                                        <select
                                            className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                                            value={charge.expense_account_id}
                                            onChange={(e) => updateCharge(idx, 'expense_account_id', e.target.value)}
                                        >
                                            <option value="">{t('landedCost.defaultClearing', 'حساب وسيط البضاعة الواردة (2020 GRNI)')}</option>
                                            {accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.code} - {isRtl ? (acc.name_ar || acc.name) : acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="md:col-span-1 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            disabled={data.charges.length === 1}
                                            onClick={() => removeCharge(idx)}
                                            className="text-rose-500 hover:text-rose-600 h-8 w-8"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charges Summary */}
                        <div className="pt-3 border-t border-border flex justify-end items-center gap-4">
                            <span className="text-sm text-muted-foreground">{t('landedCost.totalAllocated', 'إجمالي المصاريف المراد توزيعها')}:</span>
                            <span className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {totalEstimatedCharges.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <Link href="/inventory/landed-costs">
                            <Button type="button" variant="outline">
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || data.goods_receipt_ids.length === 0 || totalEstimatedCharges <= 0}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                            {processing ? t('common.saving', 'جاري الحفظ...') : t('landedCost.saveAndCalculate', 'حفظ واحتساب التوزيع')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
