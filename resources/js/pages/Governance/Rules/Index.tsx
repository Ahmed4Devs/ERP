import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Scale, Plus, Trash2, ShieldCheck, CheckCircle2, User, Layers, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface UserInfo {
    id: number;
    name: string;
    email: string;
}

interface RuleLevel {
    id: string;
    level_number: number;
    level_name: string;
    approver_role?: string;
    approverUser?: UserInfo;
}

interface Rule {
    id: string;
    module: string;
    name: string;
    min_amount: string;
    max_amount?: string;
    required_levels: number;
    is_active: boolean;
    description?: string;
    requests_count: number;
    levels: RuleLevel[];
}

interface Props {
    rules: Rule[];
    users: UserInfo[];
}

export default function DoaRulesIndex({ rules, users }: Props) {
    const { t, isRtl } = useTranslation();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        module: 'vendor_payment',
        name: '',
        min_amount: '10000',
        max_amount: '',
        description: '',
        levels: [
            { level_name: 'اعتماد المدير المالي', approver_role: 'finance_manager', approver_user_id: '' },
        ],
    });

    const addLevel = () => {
        const nextNum = data.levels.length + 1;
        setData('levels', [
            ...data.levels,
            { level_name: `اعتماد المستوى ${nextNum}`, approver_role: 'general_manager', approver_user_id: '' },
        ]);
    };

    const removeLevel = (index: number) => {
        if (data.levels.length <= 1) return;
        setData('levels', data.levels.filter((_, i) => i !== index));
    };

    const updateLevel = (index: number, field: string, value: any) => {
        const updated = [...data.levels];
        updated[index] = { ...updated[index], [field]: value };
        setData('levels', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/governance/rules', {
            onSuccess: () => {
                setShowCreateModal(false);
                reset();
            },
        });
    };

    const getModuleName = (mod: string) => {
        switch (mod) {
            case 'vendor_bill': return t('governance.vendorBill', 'فواتير الموردين');
            case 'vendor_payment': return t('governance.vendorPayment', 'سندات صرف الموردين');
            case 'journal_entry': return t('governance.journalEntry', 'القيود المحاسبية اليدوية');
            case 'petty_cash': return t('governance.pettyCash', 'تسويات العهد وصناديق النثرية');
            case 'employee_loan': return t('governance.employeeLoan', 'سلف وقروض الموظفين');
            case 'fixed_asset_disposal': return t('governance.assetDisposal', 'استبعاد وبيع الأصول الثابتة');
            default: return mod;
        }
    };

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('governance.doaTitle', 'مصفوفة الصلاحيات وقواعد الحوكمة (DOA)')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/governance/approvals">
                        <Button variant="outline" size="icon">
                            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Scale className="w-7 h-7 text-primary" />
                            {t('governance.doaTitle', 'مصفوفة الصلاحيات وقواعد الحوكمة (DOA)')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t('governance.doaSubtitle', 'تحديد سقوف المبالغ المالية ومستويات الاعتماد المطلوبة لكل عملية مالية')}
                        </p>
                    </div>
                </div>

                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('governance.newRule', 'إضافة قاعدة صلاحيات جديدة')}
                </Button>
            </div>

            {/* Info Banner */}
            <div className="bg-muted/40 border rounded-xl p-4 flex items-start gap-3 text-sm">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                    <div className="font-semibold text-foreground">{t('governance.doaExplainHeader', 'كيف تعمل مصفوفة الصلاحيات (Delegation of Authority)؟')}</div>
                    <p className="text-muted-foreground mt-1">
                        {t('governance.doaExplainBody', 'عند إنشاء أي مستند مالي (مثل سند صرف أو فاتورة)، يفحص النظام سقف المبلغ ويطبق تلقائياً قاعدة الاعتماد المناسبة وينشئ مسار موافقات متعدد المستويات لا يمكن ترحيل المستند حتى اكتماله.')}
                    </p>
                </div>
            </div>

            {/* Rules Cards / Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rules.length === 0 ? (
                    <div className="col-span-2 bg-card border rounded-xl p-12 text-center text-muted-foreground space-y-3">
                        <Scale className="w-12 h-12 mx-auto text-muted-foreground/40" />
                        <p className="font-medium text-base">{t('governance.noRulesConfigured', 'لم يتم ضبط أي قواعد صلاحيات بعد')}</p>
                        <Button onClick={() => setShowCreateModal(true)} variant="outline" size="sm" className="gap-2">
                            <Plus className="w-4 h-4" />
                            {t('governance.createFirstRule', 'إنشاء أول قاعدة اعتماد')}
                        </Button>
                    </div>
                ) : (
                    rules.map((rule) => (
                        <div key={rule.id} className="bg-card border rounded-xl p-5 shadow-sm space-y-4 hover:border-primary/50 transition-colors">
                            <div className="flex items-start justify-between gap-3 border-b pb-3">
                                <div>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                        {getModuleName(rule.module)}
                                    </span>
                                    <h3 className="font-bold text-lg text-foreground mt-1">{rule.name}</h3>
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {t('common.active', 'نشط')}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('governance.amountRange', 'نطاق المبلغ')}</div>
                                    <div className="font-bold text-base font-mono mt-0.5">
                                        {parseFloat(rule.min_amount).toLocaleString()} - {rule.max_amount ? `${parseFloat(rule.max_amount).toLocaleString()} ر.س` : t('governance.unlimited', 'بلا سقف أقصى')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">{t('governance.executedRequests', 'الطلبات المنفذة')}</div>
                                    <div className="font-bold text-base mt-0.5">{rule.requests_count} {t('governance.requests', 'طلب')}</div>
                                </div>
                            </div>

                            {/* Levels Timeline List */}
                            <div className="space-y-2 pt-2 border-t">
                                <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                    <Layers className="w-3.5 h-3.5" />
                                    {t('governance.approvalTiers', 'مراحل ومستويات الاعتماد')} ({rule.levels.length})
                                </div>
                                <div className="space-y-1.5">
                                    {rule.levels.map((lvl) => (
                                        <div key={lvl.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
                                                    {lvl.level_number}
                                                </span>
                                                <span className="font-semibold">{lvl.level_name}</span>
                                            </div>
                                            <div className="text-muted-foreground">
                                                {lvl.approverUser ? (
                                                    <span className="font-medium text-foreground">{lvl.approverUser.name}</span>
                                                ) : (
                                                    <span>{lvl.approver_role}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal to Create Rule */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-card border rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <Scale className="w-5 h-5 text-primary" />
                                {t('governance.createNewRuleTitle', 'إضافة قاعدة صلاحيات واعتمادات مالية')}
                            </h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>✕</Button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">{t('governance.targetModule', 'الوحدة / نوع العملية')}</label>
                                    <select
                                        value={data.module}
                                        onChange={(e) => setData('module', e.target.value)}
                                        className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                                    >
                                        <option value="vendor_payment">{t('governance.vendorPayment', 'سندات صرف الموردين')}</option>
                                        <option value="vendor_bill">{t('governance.vendorBill', 'فواتير المشتريات')}</option>
                                        <option value="journal_entry">{t('governance.journalEntry', 'القيود المحاسبية اليدوية')}</option>
                                        <option value="petty_cash">{t('governance.pettyCash', 'تسويات العهد النقدية')}</option>
                                        <option value="employee_loan">{t('governance.employeeLoan', 'سلف الموظفين')}</option>
                                        <option value="fixed_asset_disposal">{t('governance.assetDisposal', 'استبعاد وبيع الأصول')}</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">{t('governance.ruleName', 'اسم القاعدة / الوصف')}</label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="اعتماد المبالغ فوق 50 ألف ريال"
                                        required
                                    />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">{t('governance.minAmount', 'الحد الأدنى للمبلغ (ر.س)')}</label>
                                    <Input
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={data.min_amount}
                                        onChange={(e) => setData('min_amount', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">{t('governance.maxAmount', 'الحد الأقصى (اختياري / فارغ = غير محدود)')}</label>
                                    <Input
                                        type="number"
                                        step="any"
                                        value={data.max_amount}
                                        onChange={(e) => setData('max_amount', e.target.value)}
                                        placeholder={t('governance.unlimited', 'غير محدود')}
                                    />
                                </div>
                            </div>

                            {/* Levels Configuration */}
                            <div className="space-y-3 pt-3 border-t">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-primary" />
                                        {t('governance.approvalChainTiers', 'مراحل الاعتماد المتتابعة')}
                                    </label>
                                    <Button type="button" variant="outline" size="sm" onClick={addLevel} className="gap-1 h-8 text-xs">
                                        <Plus className="w-3.5 h-3.5" />
                                        {t('governance.addLevel', 'إضافة مستوى')}
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {data.levels.map((lvl, index) => (
                                        <div key={index} className="p-3 border rounded-lg bg-muted/20 flex flex-col sm:flex-row items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-xs shrink-0">
                                                {index + 1}
                                            </span>

                                            <div className="flex-1 w-full space-y-1">
                                                <Input
                                                    value={lvl.level_name}
                                                    onChange={(e) => updateLevel(index, 'level_name', e.target.value)}
                                                    placeholder="مسمى المرحلة (مثل: اعتماد المدير المالي)"
                                                    required
                                                    className="h-9 text-xs"
                                                />
                                            </div>

                                            <div className="w-full sm:w-48 space-y-1">
                                                <select
                                                    value={lvl.approver_user_id}
                                                    onChange={(e) => updateLevel(index, 'approver_user_id', e.target.value)}
                                                    className="w-full h-9 px-2 border rounded-md bg-background text-xs"
                                                >
                                                    <option value="">-- أي معتمد مخول --</option>
                                                    {users.map((u) => (
                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {data.levels.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeLevel(index)}
                                                    className="text-destructive h-8 w-8 shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                    {t('common.cancel', 'إلغاء')}
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? t('common.saving', 'جاري الحفظ...') : t('governance.saveRule', 'حفظ القاعدة ومصفوفة الصلاحيات')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
