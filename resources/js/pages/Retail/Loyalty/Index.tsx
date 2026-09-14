import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Award,
    Plus,
    Users,
    Gift,
    Calculator,
    Search,
    CreditCard,
    TrendingUp,
    CheckCircle2,
    Sliders,
    Coins,
    Sparkles,
    Shield,
    ArrowUpRight,
    Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface Tier {
    id: string;
    tier_code: string;
    name: string;
    name_ar?: string;
    min_points_threshold: number;
    earn_multiplier: string;
    color_hex: string;
    perks_summary_ar?: string;
}

interface LoyaltyAccount {
    id: string;
    card_number: string;
    points_balance: number;
    lifetime_points_earned: number;
    lifetime_points_redeemed: number;
    status: 'active' | 'suspended' | 'closed';
    joined_at: string;
    party: {
        id: string;
        name: string;
        name_ar?: string;
        phone?: string;
        email?: string;
    };
    current_tier?: Tier;
}

interface LoyaltyProgram {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    spend_amount_per_point: string;
    point_redeem_value: string;
    min_points_to_redeem: number;
    points_expiry_days?: number;
    is_active: boolean;
    tiers: Tier[];
}

interface Metrics {
    total_accounts: number;
    total_points_circulation: number;
    total_lifetime_earned: number;
    total_lifetime_redeemed: number;
    outstanding_liability_sar: string;
    total_redeemed_value_sar: string;
}

interface PaginatedData<T> {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    program: LoyaltyProgram;
    metrics: Metrics;
    accounts: PaginatedData<LoyaltyAccount>;
    tiers: Tier[];
    availableCustomers: Array<{ id: string; name: string; name_ar?: string; phone?: string }>;
    filters: { search?: string; tier?: string };
}

export default function LoyaltyIndex({
    program,
    metrics,
    accounts,
    tiers,
    availableCustomers,
    filters,
}: Props) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedTier, setSelectedTier] = useState(filters.tier || '');
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showCalcModal, setShowCalcModal] = useState(false);

    // Enroll Form
    const enrollForm = useForm({
        party_id: '',
        loyalty_program_id: program?.id || '',
        custom_card_number: '',
    });

    // Calculator state
    const [calcSpend, setCalcSpend] = useState('1000');
    const [calcTierMultiplier, setCalcTierMultiplier] = useState(tiers[0]?.earn_multiplier || '1.0');
    const [calcPoints, setCalcPoints] = useState('500');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/retail/loyalty', {
            search: searchTerm,
            tier: selectedTier,
        }, { preserveState: true });
    };

    const handleTierFilter = (tierId: string) => {
        setSelectedTier(tierId);
        router.get('/retail/loyalty', {
            search: searchTerm,
            tier: tierId,
        }, { preserveState: true });
    };

    const handleEnrollSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        enrollForm.post('/retail/loyalty/accounts', {
            onSuccess: () => {
                setShowEnrollModal(false);
                enrollForm.reset();
            },
        });
    };

    // Calculate simulated points & value
    const calculatedEarnedPoints = Math.floor(
        (parseFloat(calcSpend || '0') / parseFloat(program?.spend_amount_per_point || '10')) *
            parseFloat(calcTierMultiplier || '1')
    );
    const calculatedDiscountSar = (
        parseFloat(calcPoints || '0') * parseFloat(program?.point_redeem_value || '0.05')
    ).toFixed(2);

    return (
        <AppLayout>
            <Head title="برامج الولاء ونقاط المكافآت | Customer Loyalty & Rewards" />

            <div className="space-y-6 pb-12">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-l from-indigo-900 via-indigo-800 to-slate-900 p-6 md:p-8 rounded-2xl text-white shadow-xl">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-indigo-500/20 backdrop-blur rounded-xl border border-indigo-400/30">
                                <Award className="w-6 h-6 text-indigo-300" />
                            </span>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {program?.name_ar || 'برنامج الولاء القياسي'}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            برامج الولاء ونقاط المكافآت للعملاء
                        </h1>
                        <p className="text-sm text-indigo-200/80 max-w-2xl">
                            إدارة اشتراكات العملاء، واحتساب النقاط وفق شرائح الولاء التراكمية، ومطابقة التزامات الخصومات مع القيود المحاسبية لدفتر الأستاذ.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            onClick={() => setShowCalcModal(true)}
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
                        >
                            <Calculator className="w-4 h-4 ml-2" />
                            حاسبة النقاط والخصومات
                        </Button>

                        <Link href="/retail/loyalty/programs">
                            <Button
                                variant="outline"
                                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
                            >
                                <Sliders className="w-4 h-4 ml-2" />
                                إعدادات الشرائح
                            </Button>
                        </Link>

                        <Button
                            onClick={() => setShowEnrollModal(true)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                        >
                            <Plus className="w-4 h-4 ml-2" />
                            تسجيل عميل جديد
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">الأعضاء المشتركون</p>
                            <h3 className="text-2xl font-bold text-foreground">
                                {metrics.total_accounts.toLocaleString()}
                            </h3>
                            <p className="text-xs text-emerald-600 font-medium">حسابات ولاء نشطة</p>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">النقاط المتداولة الحالية</p>
                            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                {metrics.total_points_circulation.toLocaleString()}
                            </h3>
                            <p className="text-xs text-muted-foreground">نقطة متاحة للاستبدال</p>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                            <Coins className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">التزام النقاط المحاسبي</p>
                            <h3 className="text-2xl font-bold text-foreground">
                                {Number(metrics.outstanding_liability_sar).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                <span className="text-xs font-normal text-muted-foreground">ر.س</span>
                            </h3>
                            <p className="text-xs text-rose-600 font-medium">حساب 2050 (التزام مؤجل)</p>
                        </div>
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400">
                            <Shield className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="bg-card p-5 rounded-xl border shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">إجمالي الخصومات المصروفة</p>
                            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {Number(metrics.total_redeemed_value_sar).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                <span className="text-xs font-normal text-muted-foreground">ر.س</span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {metrics.total_lifetime_redeemed.toLocaleString()} نقطة تم استبدالها
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <Gift className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                    <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="ابحث برقم البطاقة، اسم العميل، الهاتف..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-9"
                            />
                        </div>
                        <Button type="submit" variant="secondary">
                            بحث
                        </Button>
                    </form>

                    {/* Tier Pills */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <button
                            type="button"
                            onClick={() => handleTierFilter('')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                                !selectedTier
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted text-muted-foreground hover:bg-accent'
                            }`}
                        >
                            الكل ({metrics.total_accounts})
                        </button>
                        {tiers.map((tier) => (
                            <button
                                key={tier.id}
                                type="button"
                                onClick={() => handleTierFilter(tier.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                                    selectedTier === tier.id
                                        ? 'ring-2 ring-primary text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-accent'
                                }`}
                                style={{
                                    backgroundColor: selectedTier === tier.id ? tier.color_hex : undefined,
                                }}
                            >
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: tier.color_hex }}
                                />
                                {tier.name_ar || tier.name} ({tier.earn_multiplier}x)
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loyalty Accounts Table */}
                <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-muted/50 text-muted-foreground text-xs border-b">
                                <tr>
                                    <th className="py-3.5 px-4 font-semibold">رقم البطاقة</th>
                                    <th className="py-3.5 px-4 font-semibold">العميل</th>
                                    <th className="py-3.5 px-4 font-semibold">فئة العضوية (Tier)</th>
                                    <th className="py-3.5 px-4 font-semibold">رصيد النقاط</th>
                                    <th className="py-3.5 px-4 font-semibold">القيمة التقديرية (ر.س)</th>
                                    <th className="py-3.5 px-4 font-semibold">إجمالي النقاط المكتسبة</th>
                                    <th className="py-3.5 px-4 font-semibold">تاريخ الانضمام</th>
                                    <th className="py-3.5 px-4 font-semibold text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {accounts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Award className="w-8 h-8 text-muted-foreground/40" />
                                                <p>لم يتم العثور على أي حسابات ولاء مطابقة للبحث</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.data.map((acc) => {
                                        const redeemVal = (
                                            acc.points_balance *
                                            parseFloat(program?.point_redeem_value || '0.05')
                                        ).toFixed(2);

                                        return (
                                            <tr key={acc.id} className="hover:bg-muted/30 transition">
                                                <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="w-4 h-4 text-indigo-500" />
                                                        <span>{acc.card_number}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div>
                                                        <p className="font-semibold text-foreground">
                                                            {acc.party.name_ar || acc.party.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground font-mono">
                                                            {acc.party.phone || 'بدون هاتف'}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {acc.current_tier ? (
                                                        <span
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                                                            style={{
                                                                backgroundColor: acc.current_tier.color_hex,
                                                            }}
                                                        >
                                                            <Sparkles className="w-3 h-3" />
                                                            {acc.current_tier.name_ar || acc.current_tier.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">عادي</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-base text-amber-600 dark:text-amber-400">
                                                        {acc.points_balance.toLocaleString()}
                                                    </span>{' '}
                                                    <span className="text-xs text-muted-foreground">نقطة</span>
                                                </td>
                                                <td className="py-3.5 px-4 font-semibold text-foreground">
                                                    {Number(redeemVal).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                    })}{' '}
                                                    <span className="text-xs text-muted-foreground font-normal">
                                                        ر.س
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-muted-foreground">
                                                    {acc.lifetime_points_earned.toLocaleString()}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs text-muted-foreground">
                                                    {new Date(acc.joined_at).toLocaleDateString('ar-SA')}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link href={`/retail/loyalty/accounts/${acc.id}`}>
                                                            <Button size="sm" variant="outline" className="h-8 text-xs">
                                                                كشف الحساب
                                                            </Button>
                                                        </Link>
                                                        <Link
                                                            href={`/retail/loyalty/accounts/${acc.id}/card-print`}
                                                            target="_blank"
                                                        >
                                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="طباعة البطاقة">
                                                                <Printer className="w-4 h-4 text-muted-foreground" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal: Enroll New Customer */}
                {showEnrollModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-lg rounded-2xl border shadow-2xl p-6 space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">تسجيل عميل في برنامج الولاء</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowEnrollModal(false)}
                                    className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                                >
                                    إلغاء
                                </button>
                            </div>

                            <form onSubmit={handleEnrollSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground">
                                        اختر العميل المراد تسجيله <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={enrollForm.data.party_id}
                                        onChange={(e) => enrollForm.setData('party_id', e.target.value)}
                                        required
                                        className="w-full bg-background border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">-- اختر من قائمة العملاء المسجلين --</option>
                                        {availableCustomers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name_ar || c.name} {c.phone ? `(${c.phone})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    {enrollForm.errors.party_id && (
                                        <p className="text-xs text-destructive">{enrollForm.errors.party_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground">
                                        رقم بطاقة العضوية (اختياري - يتم توليده تلقائياً)
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="مثال: LOY-789012"
                                        value={enrollForm.data.custom_card_number}
                                        onChange={(e) => enrollForm.setData('custom_card_number', e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        في حال تركه فارغاً، سيقوم النظام بتوليد رقم عضوية مشفر تلقائياً.
                                    </p>
                                </div>

                                <div className="p-3 bg-muted/40 rounded-xl border text-xs text-muted-foreground space-y-1">
                                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        <span>مميزات العضوية الفورية:</span>
                                    </div>
                                    <p>• إلحاق العميل بالفئة الافتراضية (البرونزية) فوراً.</p>
                                    <p>• اكتساب 1 نقطة مقابل كل 10 ر.س مشتريات.</p>
                                    <p>• استبدال 100 نقطة بخصم 5 ر.س عند الدفع.</p>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowEnrollModal(false)}
                                    >
                                        إغلاق
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={enrollForm.processing}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        تأكيد تسجيل العميل
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal: Points & Discount Calculator */}
                {showCalcModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
                                        <Calculator className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">حاسبة النقاط والخصومات السريعة</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowCalcModal(false)}
                                    className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                                >
                                    إغلاق
                                </button>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
                                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <Coins className="w-4 h-4 text-amber-500" />
                                        1. محاكاة اكتساب النقاط من المبيعات
                                    </h4>
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground">قيمة المشتريات (ر.س):</label>
                                        <Input
                                            type="number"
                                            value={calcSpend}
                                            onChange={(e) => setCalcSpend(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground">مضاعف شريحة العميل:</label>
                                        <select
                                            value={calcTierMultiplier}
                                            onChange={(e) => setCalcTierMultiplier(e.target.value)}
                                            className="w-full bg-background border rounded-lg p-2 text-xs"
                                        >
                                            {tiers.map((t) => (
                                                <option key={t.id} value={t.earn_multiplier}>
                                                    {t.name_ar || t.name} ({t.earn_multiplier}x)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="p-3 bg-card rounded-lg border flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">النقاط المكتسبة:</span>
                                        <span className="font-bold text-amber-600 text-base">
                                            {calculatedEarnedPoints.toLocaleString()} نقطة
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
                                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                        <Gift className="w-4 h-4 text-emerald-500" />
                                        2. محاكاة استبدال النقاط بخصم
                                    </h4>
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground">عدد النقاط المراد استبدالها:</label>
                                        <Input
                                            type="number"
                                            value={calcPoints}
                                            onChange={(e) => setCalcPoints(e.target.value)}
                                        />
                                    </div>
                                    <div className="p-3 bg-card rounded-lg border flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">قيمة الخصم الممنوح:</span>
                                        <span className="font-bold text-emerald-600 text-base">
                                            {calculatedDiscountSar} ر.س
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t">
                                <Button onClick={() => setShowCalcModal(false)}>
                                    تم
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
