import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    CreditCard, 
    ArrowLeft, 
    ArrowRight, 
    ArrowDownLeft, 
    ArrowUpRight, 
    FileText, 
    Check, 
    Info 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    type: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface Props {
    parties: Party[];
    bankAccounts: Account[];
}

export default function ChequeCreate({ parties, bankAccounts }: Props) {
    const { t, isRtl } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        type: 'received',
        cheque_number: '',
        bank_name: '',
        drawer_name: '',
        payee_name: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: '',
        currency: 'SAR',
        party_id: '',
        bank_account_id: bankAccounts[0]?.id || '',
        notes: '',
    });

    const handlePartyChange = (partyId: string) => {
        const party = parties.find(p => p.id === partyId);
        setForm(prev => ({
            ...prev,
            party_id: partyId,
            drawer_name: prev.type === 'received' && party ? party.name : prev.drawer_name,
            payee_name: prev.type === 'issued' && party ? party.name : prev.payee_name,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        router.post('/treasury/cheques', {
            ...form,
            amount: parseFloat(form.amount),
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
            <Head title={t('cheques.createNewTitle', 'تسجيل شيك جديد (PDC)')} />

            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/treasury/cheques">
                        <Button variant="ghost" size="icon">
                            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <CreditCard className="h-6 w-6 text-primary" />
                            {t('cheques.createNewTitle', 'تسجيل شيك جديد (PDC)')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('cheques.createNewSubtitle', 'تسجيل شيكات القبض أو الدفع الآجلة مع إنشاء القيود المحاسبية التلقائية')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type Selection */}
                <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
                    <Label className="text-base font-semibold">{t('cheques.selectType', 'نوع الشيك')}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div 
                            onClick={() => setForm(prev => ({ ...prev, type: 'received' }))}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                                form.type === 'received' 
                                    ? 'border-emerald-500 bg-emerald-500/5' 
                                    : 'border-border/60 hover:border-border'
                            }`}
                        >
                            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                                <ArrowDownLeft className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-bold text-foreground">{t('cheques.typeReceived', 'شيك مقبوض (وارد من عميل)')}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {t('cheques.typeReceivedDesc', 'يتم تسجيله كشيك تحت التحصيل وتخفيض مديونية العميل فوراً')}
                                </div>
                            </div>
                        </div>

                        <div 
                            onClick={() => setForm(prev => ({ ...prev, type: 'issued' }))}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                                form.type === 'issued' 
                                    ? 'border-purple-500 bg-purple-500/5' 
                                    : 'border-border/60 hover:border-border'
                            }`}
                        >
                            <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                                <ArrowUpRight className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="font-bold text-foreground">{t('cheques.typeIssued', 'شيك مدفوع (صادر لمورد)')}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {t('cheques.typeIssuedDesc', 'يتم تسجيله كشيك آجل الدفع وتخفيض حساب المورد حتى تاريخ الصرف والمقاصة')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold text-foreground border-b border-border/60 pb-3">
                        {t('cheques.details', 'بيانات الشيك')}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="cheque_number">{t('cheques.number', 'رقم الشيك')} *</Label>
                            <Input
                                id="cheque_number"
                                value={form.cheque_number}
                                onChange={(e) => setForm(prev => ({ ...prev, cheque_number: e.target.value }))}
                                placeholder="CHQ-100458"
                                className={errors.cheque_number ? 'border-destructive' : ''}
                                required
                            />
                            {errors.cheque_number && <p className="text-xs text-destructive">{errors.cheque_number}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank_name">{t('cheques.bankName', 'اسم البنك المسحوب عليه')} *</Label>
                            <Input
                                id="bank_name"
                                value={form.bank_name}
                                onChange={(e) => setForm(prev => ({ ...prev, bank_name: e.target.value }))}
                                placeholder={t('cheques.bankPlaceholder', 'مثال: مصرف الراجحي، البنك الأهلي')}
                                className={errors.bank_name ? 'border-destructive' : ''}
                                required
                            />
                            {errors.bank_name && <p className="text-xs text-destructive">{errors.bank_name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>{t('cheques.partySelect', 'الطرف المعني في النظام')}</Label>
                            <select
                                value={form.party_id}
                                onChange={(e) => handlePartyChange(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="">-- {t('cheques.selectOptionalParty', 'اختيار طرف مسجل (اختياري)')} --</option>
                                {parties.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="drawer_name">{t('cheques.drawerName', 'اسم الساحب (محرر الشيك)')} *</Label>
                            <Input
                                id="drawer_name"
                                value={form.drawer_name}
                                onChange={(e) => setForm(prev => ({ ...prev, drawer_name: e.target.value }))}
                                placeholder={t('cheques.drawerPlaceholder', 'اسم صاحب الحساب أو الشركة')}
                                className={errors.drawer_name ? 'border-destructive' : ''}
                                required
                            />
                            {errors.drawer_name && <p className="text-xs text-destructive">{errors.drawer_name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payee_name">{t('cheques.payeeName', 'اسم المستفيد (لأمر)')}</Label>
                            <Input
                                id="payee_name"
                                value={form.payee_name}
                                onChange={(e) => setForm(prev => ({ ...prev, payee_name: e.target.value }))}
                                placeholder={t('cheques.payeePlaceholder', 'يصرف لأمر...')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">{t('cheques.amount', 'المبلغ')} *</Label>
                            <div className="relative">
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={form.amount}
                                    onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                    className={`pl-16 font-mono ${errors.amount ? 'border-destructive' : ''}`}
                                    required
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                    {form.currency}
                                </div>
                            </div>
                            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="issue_date">{t('cheques.issueDate', 'تاريخ التحرير')} *</Label>
                            <Input
                                id="issue_date"
                                type="date"
                                value={form.issue_date}
                                onChange={(e) => setForm(prev => ({ ...prev, issue_date: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="due_date">{t('cheques.dueDate', 'تاريخ الاستحقاق')} *</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={form.due_date}
                                onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>{t('cheques.targetBankAccount', 'حساب البنك المرتبط (للإيداع أو السحب لاحقاً)')}</Label>
                            <select
                                value={form.bank_account_id}
                                onChange={(e) => setForm(prev => ({ ...prev, bank_account_id: e.target.value }))}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            >
                                <option value="">-- {t('cheques.selectOptionalBank', 'اختر حساب البنك')} --</option>
                                {bankAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name_ar || acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="notes">{t('cheques.notes', 'ملاحظات إضافية')}</Label>
                            <Input
                                id="notes"
                                value={form.notes}
                                onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder={t('cheques.notesPlaceholder', 'ملاحظات، أسباب السداد، تفاصيل العقد...')}
                            />
                        </div>
                    </div>

                    {/* Information Banner */}
                    <div className="bg-muted/40 border border-border/80 rounded-xl p-4 flex items-start gap-3 text-xs text-muted-foreground">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-foreground">
                                {form.type === 'received' 
                                    ? t('cheques.autoJvReceived', 'الأثر المحاسبي التلقائي (شيك وارد):') 
                                    : t('cheques.autoJvIssued', 'الأثر المحاسبي التلقائي (شيك صادر):')}
                            </span>
                            <div className="mt-1 font-mono">
                                {form.type === 'received' 
                                    ? 'من حـ/ شيكات برسم التحصيل (1030)  |  إلى حـ/ العملاء والذمم المدينة (1200)' 
                                    : 'من حـ/ الموردين والذمم الدائنة (2100)  |  إلى حـ/ شيكات آجلة الدفع (2030)'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3">
                    <Link href="/treasury/cheques">
                        <Button variant="outline" type="button">
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                    </Link>
                    <Button type="submit" disabled={submitting} className="min-w-32">
                        {submitting ? t('common.saving', 'جاري الحفظ...') : t('cheques.saveAndPost', 'حفظ وإثبات القيد')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
