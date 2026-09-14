import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    Award,
    CreditCard,
    ArrowLeft,
    TrendingUp,
    Gift,
    Coins,
    Sparkles,
    Shield,
    Printer,
    History,
    FileText,
    CheckCircle2,
    Sliders,
    Plus,
    Minus,
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

interface Transaction {
    id: string;
    transaction_type: 'earn' | 'redeem' | 'manual_adjust' | 'expire';
    points: number;
    balance_after: number;
    spend_amount?: string;
    monetary_equivalent?: string;
    reference_type?: string;
    reference_id?: string;
    notes?: string;
    created_at: string;
    created_by_user?: { name: string };
    journal_entry?: { id: string; entry_number: string };
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
    program: {
        id: string;
        name: string;
        name_ar?: string;
        spend_amount_per_point: string;
        point_redeem_value: string;
        min_points_to_redeem: number;
    };
    current_tier?: Tier;
    transactions: Transaction[];
}

interface NextTierProgress {
    has_next: boolean;
    next_tier_name?: string;
    next_tier_name_ar?: string;
    points_needed: number;
    progress_percentage: number;
    target_points?: number;
}

interface Props {
    account: LoyaltyAccount;
    nextTierProgress: NextTierProgress;
    availableDiscountSar: string;
}

export default function LoyaltyShow({
    account,
    nextTierProgress,
    availableDiscountSar,
}: Props) {
    const { t } = useTranslation();
    const [showAdjustModal, setShowAdjustModal] = useState(false);

    const adjustForm = useForm({
        points: '100',
        notes: '',
    });

    const handleAdjustSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        adjustForm.post(`/retail/loyalty/accounts/${account.id}/adjust`, {
            onSuccess: () => {
                setShowAdjustModal(false);
                adjustForm.reset();
            },
        });
    };

    const tierColor = account.current_tier?.color_hex || '#6366f1';

    return (
        <AppLayout>
            <Head title={`كشف حساب العضوية - ${account.card_number}`} />

            <div className="space-y-6 pb-12">
                {/* Top Nav */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/retail/loyalty"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
                    >
                        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                        <span>العودة لبرامج الولاء وقائمة الأعضاء</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link href={`/retail/loyalty/accounts/${account.id}/card-print`} target="_blank">
                            <Button variant="outline" size="sm">
                                <Printer className="w-4 h-4 ml-1.5" />
                                طباعة البطاقة
                            </Button>
                        </Link>
                        <Button
                            size="sm"
                            onClick={() => setShowAdjustModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Sliders className="w-4 h-4 ml-1.5" />
                            تعديل النقاط يدوياً
                        </Button>
                    </div>
                </div>

                {/* VIP Membership Digital Card & Profile Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visual Card */}
                    <div
                        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-2xl flex flex-col justify-between h-64 border border-white/20"
                        style={{
                            background: `linear-gradient(135deg, ${tierColor}ee 0%, #1e1b4b 100%)`,
                        }}
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-xs tracking-widest uppercase opacity-80 font-mono">
                                    MEMBERSHIP REWARDS CARD
                                </p>
                                <h3 className="font-bold text-lg">
                                    {account.party.name_ar || account.party.name}
                                </h3>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5" />
                                {account.current_tier?.name_ar || account.current_tier?.name || 'Standard'}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 font-mono text-xl tracking-widest">
                                <span>{account.card_number}</span>
                            </div>

                            <div className="flex justify-between items-end text-xs opacity-90">
                                <div>
                                    <p className="opacity-70 text-[10px]">رصيد النقاط الحالي</p>
                                    <p className="text-2xl font-bold font-mono">
                                        {account.points_balance.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-left">
                                    <p className="opacity-70 text-[10px]">عضو منذ</p>
                                    <p className="font-mono">
                                        {new Date(account.joined_at).toLocaleDateString('ar-SA')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress to Next Tier */}
                    <div className="lg:col-span-2 bg-card p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                                    <Award className="w-5 h-5 text-indigo-500" />
                                    مستوى العضوية والترقية الآلية
                                </h3>
                                <span className="text-xs px-2.5 py-1 rounded-md bg-muted font-mono font-medium">
                                    مضاعف الاكتساب: {account.current_tier?.earn_multiplier || '1.0'}x
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {account.current_tier?.perks_summary_ar ||
                                    'ميزات الشريحة الحالية مفعلة على كل الفواتير والمشتريات.'}
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2 p-4 bg-muted/40 rounded-xl border">
                            <div className="flex justify-between text-xs font-medium">
                                <span>
                                    الشريحة الحالية:{' '}
                                    <strong className="text-foreground">
                                        {account.current_tier?.name_ar || 'البرونزي'}
                                    </strong>
                                </span>
                                {nextTierProgress.has_next ? (
                                    <span>
                                        الشريحة التالية:{' '}
                                        <strong className="text-indigo-600 dark:text-indigo-400">
                                            {nextTierProgress.next_tier_name_ar}
                                        </strong>{' '}
                                        (يتبقى {nextTierProgress.points_needed.toLocaleString()} نقطة)
                                    </span>
                                ) : (
                                    <span className="text-emerald-600 font-bold">
                                        🎉 تم الوصول للحد الأقصى من فئات العضوية VIP
                                    </span>
                                )}
                            </div>

                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden border">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${nextTierProgress.progress_percentage}%`,
                                        backgroundColor: tierColor,
                                    }}
                                />
                            </div>

                            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                                <span>مجموع النقاط المكتسبة: {account.lifetime_points_earned.toLocaleString()}</span>
                                {nextTierProgress.target_points && (
                                    <span>الهدف: {nextTierProgress.target_points.toLocaleString()} نقطة</span>
                                )}
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-3 gap-4 pt-2 border-t text-center">
                            <div>
                                <p className="text-xs text-muted-foreground">الرصيد المتاح للخصم</p>
                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                    {Number(availableDiscountSar).toFixed(2)}{' '}
                                    <span className="text-xs font-normal">ر.س</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">إجمالي النقاط المكتسبة</p>
                                <p className="text-lg font-bold text-foreground">
                                    {account.lifetime_points_earned.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">إجمالي النقاط المصروفة</p>
                                <p className="text-lg font-bold text-muted-foreground">
                                    {account.lifetime_points_redeemed.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaction Ledger Table */}
                <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-500" />
                            <h3 className="font-bold text-foreground text-sm">
                                سجل حركات النقاط التراكمي (Points Transaction Ledger)
                            </h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            إجمالي الحركات: {account.transactions.length}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-muted/50 text-muted-foreground text-xs border-b">
                                <tr>
                                    <th className="py-3 px-4 font-semibold">التاريخ والوقت</th>
                                    <th className="py-3 px-4 font-semibold">نوع الحركة</th>
                                    <th className="py-3 px-4 font-semibold">النقاط</th>
                                    <th className="py-3 px-4 font-semibold">الرصيد بعدها</th>
                                    <th className="py-3 px-4 font-semibold">القيمة المعادلة (ر.س)</th>
                                    <th className="py-3 px-4 font-semibold">المرجع / العملية</th>
                                    <th className="py-3 px-4 font-semibold">قيد اليومية GL</th>
                                    <th className="py-3 px-4 font-semibold">ملاحظات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {account.transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-muted-foreground text-xs">
                                            لا توجد حركات نقاط مسجلة لهذا الحساب بعد.
                                        </td>
                                    </tr>
                                ) : (
                                    account.transactions.map((tx) => {
                                        const isCredit = tx.points > 0;
                                        return (
                                            <tr key={tx.id} className="hover:bg-muted/30 transition">
                                                <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                                                    {new Date(tx.created_at).toLocaleString('ar-SA')}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {tx.transaction_type === 'earn' && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                            اكتساب نقاط
                                                        </span>
                                                    )}
                                                    {tx.transaction_type === 'redeem' && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                                                            استبدال بخصم
                                                        </span>
                                                    )}
                                                    {tx.transaction_type === 'manual_adjust' && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                                                            تعديل يدوي
                                                        </span>
                                                    )}
                                                    {tx.transaction_type === 'expire' && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                                                            انتهاء صلاحية
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-mono font-bold">
                                                    <span
                                                        className={
                                                            isCredit
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-rose-600 dark:text-rose-400'
                                                        }
                                                    >
                                                        {isCredit ? `+${tx.points}` : tx.points}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-mono font-semibold text-foreground">
                                                    {tx.balance_after.toLocaleString()}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-muted-foreground">
                                                    {tx.monetary_equivalent
                                                        ? `${Number(tx.monetary_equivalent).toFixed(2)} ر.س`
                                                        : '-'}
                                                </td>
                                                <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                                                    {tx.reference_type || 'مباشر'}
                                                </td>
                                                <td className="py-3 px-4 text-xs font-mono">
                                                    {tx.journal_entry ? (
                                                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                                            #{tx.journal_entry.entry_number}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                                                    {tx.notes || '-'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal: Adjust Points */}
                {showAdjustModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
                                        <Sliders className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">تعديل رصيد النقاط يدوياً</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(false)}
                                    className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                                >
                                    إلغاء
                                </button>
                            </div>

                            <form onSubmit={handleAdjustSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground">
                                        عدد النقاط (موجب للإضافة، سالب للخصم) <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        value={adjustForm.data.points}
                                        onChange={(e) => adjustForm.setData('points', e.target.value)}
                                        required
                                    />
                                    {adjustForm.errors.points && (
                                        <p className="text-xs text-destructive">{adjustForm.errors.points}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-foreground">
                                        سبب التعديل والبيان الإداري <span className="text-destructive">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="مثال: تعويض رضاء عميل أو تسوية يدوية"
                                        value={adjustForm.data.notes}
                                        onChange={(e) => adjustForm.setData('notes', e.target.value)}
                                        required
                                    />
                                    {adjustForm.errors.notes && (
                                        <p className="text-xs text-destructive">{adjustForm.errors.notes}</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowAdjustModal(false)}
                                    >
                                        إغلاق
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={adjustForm.processing}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        حفظ التعديل
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
