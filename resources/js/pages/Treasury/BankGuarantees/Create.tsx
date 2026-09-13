import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Landmark, 
    ArrowLeft, 
    ArrowRight, 
    ShieldCheck, 
    Info, 
    Building, 
    FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface Project {
    id: string;
    project_number: string;
    name: string;
    name_ar?: string;
}

interface Props {
    bankAccounts: Account[];
    marginAccounts: Account[];
    projects: Project[];
}

export default function BankGuaranteeCreate({ bankAccounts, marginAccounts, projects }: Props) {
    const { t, isRtl } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        guarantee_number: '',
        type: 'performance_bond',
        beneficiary_name: '',
        issuing_bank: '',
        amount: '',
        margin_percentage: '10',
        margin_amount: '',
        commission_amount: '0',
        bank_account_id: bankAccounts[0]?.id || '',
        margin_account_id: marginAccounts[0]?.id || '',
        project_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
    });

    // Auto-calculate margin amount when amount or percentage changes
    useEffect(() => {
        const amt = parseFloat(form.amount || '0');
        const pct = parseFloat(form.margin_percentage || '0');
        if (amt > 0 && pct >= 0) {
            const calculated = ((amt * pct) / 100).toFixed(2);
            setForm(prev => ({ ...prev, margin_amount: calculated }));
        }
    }, [form.amount, form.margin_percentage]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        router.post('/treasury/bank-guarantees', {
            ...form,
            amount: parseFloat(form.amount),
            margin_percentage: parseFloat(form.margin_percentage || '0'),
            margin_amount: parseFloat(form.margin_amount || '0'),
            commission_amount: parseFloat(form.commission_amount || '0'),
        }, {
            onError: (err) => {
                setErrors(err);
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <Head title={t('guarantees.createTitle', 'إصدار خطاب ضمان بنكي جديد')} />

            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/treasury/bank-guarantees">
                        <Button variant="ghost" size="icon">
                            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <Landmark className="h-6 w-6 text-primary" />
                            {t('guarantees.createTitle', 'إصدار خطاب ضمان بنكي جديد')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('guarantees.createSubtitle', 'إثبات خطاب الضمان وتجميد الغطاء النقدي وقيد عمولة الإصدار آلياً بالدفاتر')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        {t('guarantees.basicInfo', 'بيانات الضمان الأساسية')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="guarantee_number">{t('guarantees.number', 'رقم خطاب الضمان لدى البنك')} *</Label>
                            <Input
                                id="guarantee_number"
                                value={form.guarantee_number}
                                onChange={(e) => setForm(prev => ({ ...prev, guarantee_number: e.target.value }))}
                                placeholder="LG-2026-904"
                                className={errors.guarantee_number ? 'border-destructive' : ''}
                                required
                            />
                            {errors.guarantee_number && <p className="text-xs text-destructive">{errors.guarantee_number}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>{t('guarantees.type', 'نوع خطاب الضمان')} *</Label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                required
                            >
                                <option value="bid_bond">{t('guarantees.bidBond', 'ضمان ابتدائي (دخول عطاء / مناقصة)')}</option>
                                <option value="performance_bond">{t('guarantees.performanceBond', 'ضمان نهائي (حسن تنفيذ أعمال)')}</option>
                                <option value="advance_payment">{t('guarantees.advancePayment', 'ضمان دفعة مقدمة')}</option>
                                <option value="retention">{t('guarantees.retention', 'ضمان صيانة وأعمال محجوزة')}</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="beneficiary_name">{t('guarantees.beneficiary', 'الجهة المستفيدة')} *</Label>
                            <Input
                                id="beneficiary_name"
                                value={form.beneficiary_name}
                                onChange={(e) => setForm(prev => ({ ...prev, beneficiary_name: e.target.value }))}
                                placeholder={t('guarantees.beneficiaryPlaceholder', 'مثال: وزارة النقل والخدمات اللوجستية')}
                                className={errors.beneficiary_name ? 'border-destructive' : ''}
                                required
                            />
                            {errors.beneficiary_name && <p className="text-xs text-destructive">{errors.beneficiary_name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="issuing_bank">{t('guarantees.issuingBank', 'البنك المصدر')} *</Label>
                            <Input
                                id="issuing_bank"
                                value={form.issuing_bank}
                                onChange={(e) => setForm(prev => ({ ...prev, issuing_bank: e.target.value }))}
                                placeholder={t('guarantees.bankPlaceholder', 'مثال: مصرف الراجحي')}
                                className={errors.issuing_bank ? 'border-destructive' : ''}
                                required
                            />
                            {errors.issuing_bank && <p className="text-xs text-destructive">{errors.issuing_bank}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>{t('guarantees.projectLinked', 'المشروع المرتبط (اختياري)')}</Label>
                            <select
                                value={form.project_id}
                                onChange={(e) => setForm(prev => ({ ...prev, project_id: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="">-- {t('guarantees.noProject', 'غير مرتبط بمشروع محدد')} --</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.project_number} - {p.name_ar || p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">{t('guarantees.totalAmount', 'إجمالي قيمة الضمان (SAR)')} *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={form.amount}
                                onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                                placeholder="100,000.00"
                                className={`font-mono ${errors.amount ? 'border-destructive' : ''}`}
                                required
                            />
                            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                        </div>
                    </div>

                    <h2 className="text-lg font-bold text-foreground border-b border-border/60 pb-3 pt-4 flex items-center gap-2">
                        <Landmark className="h-5 w-5 text-primary" />
                        {t('guarantees.financialAccounting', 'الغطاء النقدي والخصم البنكي')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="margin_percentage">{t('guarantees.marginPct', 'نسبة الغطاء النقدي (%)')}</Label>
                            <Input
                                id="margin_percentage"
                                type="number"
                                step="0.5"
                                min="0"
                                max="100"
                                value={form.margin_percentage}
                                onChange={(e) => setForm(prev => ({ ...prev, margin_percentage: e.target.value }))}
                                placeholder="10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="margin_amount">{t('guarantees.marginAmount', 'مبلغ الغطاء النقدي المحجوز (SAR)')}</Label>
                            <Input
                                id="margin_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.margin_amount}
                                onChange={(e) => setForm(prev => ({ ...prev, margin_amount: e.target.value }))}
                                className="font-mono font-bold text-blue-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="commission_amount">{t('guarantees.commissionFee', 'مصاريف وعمولة الإصدار (SAR)')}</Label>
                            <Input
                                id="commission_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.commission_amount}
                                onChange={(e) => setForm(prev => ({ ...prev, commission_amount: e.target.value }))}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>{t('guarantees.bankAccount', 'حساب البنك (للخصم الفوري)')} *</Label>
                            <select
                                value={form.bank_account_id}
                                onChange={(e) => setForm(prev => ({ ...prev, bank_account_id: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                required
                            >
                                {bankAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name_ar || acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('guarantees.marginAccount', 'حساب وسيط غطاء الضمان')}</Label>
                            <select
                                value={form.margin_account_id}
                                onChange={(e) => setForm(prev => ({ ...prev, margin_account_id: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            >
                                {marginAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name_ar || acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="issue_date">{t('guarantees.issueDate', 'تاريخ الإصدار')} *</Label>
                            <Input
                                id="issue_date"
                                type="date"
                                value={form.issue_date}
                                onChange={(e) => setForm(prev => ({ ...prev, issue_date: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="expiry_date">{t('guarantees.expiryDate', 'تاريخ الانتهاء')} *</Label>
                            <Input
                                id="expiry_date"
                                type="date"
                                value={form.expiry_date}
                                onChange={(e) => setForm(prev => ({ ...prev, expiry_date: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    {/* Auto-JV explanation */}
                    <div className="bg-muted/40 border border-border/80 rounded-xl p-4 flex items-start gap-3 text-xs text-muted-foreground">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-foreground">
                                {t('guarantees.autoJvNotice', 'القيد المحاسبي التلقائي عند الإصدار:')}
                            </span>
                            <div className="mt-1 font-mono">
                                من مذكورين: حـ/ غطاء خطابات الضمان (1040) + حـ/ عمولات بنكية (5240) <br />
                                إلى حـ/ البنك (1020) بإجمالي المبلغ المخصوم.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3">
                    <Link href="/treasury/bank-guarantees">
                        <Button variant="outline" type="button">
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                    </Link>
                    <Button type="submit" disabled={submitting} className="min-w-32">
                        {submitting ? t('common.saving', 'جاري الحفظ...') : t('guarantees.saveAndPost', 'إصدار وقيد الضمان')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
