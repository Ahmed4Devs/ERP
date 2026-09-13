import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    CreditCard, 
    Plus, 
    Search, 
    ArrowDownLeft, 
    ArrowUpRight, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    Building, 
    Eye,
    Landmark,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface Cheque {
    id: string;
    type: 'received' | 'issued';
    cheque_number: string;
    bank_name: string;
    drawer_name: string;
    payee_name?: string;
    issue_date: string;
    due_date: string;
    amount: string;
    currency: string;
    status: 'in_safe' | 'under_collection' | 'collected' | 'bounced' | 'returned_to_drawer' | 'issued' | 'cleared' | 'cancelled';
    bounce_reason?: string;
    party?: { name: string };
    bank_account?: Account;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    cheques: PaginatedData<Cheque>;
    bankAccounts: Account[];
    metrics: {
        total_received_amount: number;
        total_issued_amount: number;
        in_safe_count: number;
        under_collection_count: number;
        collected_count: number;
        bounced_count: number;
        issued_pending_count: number;
        cleared_count: number;
    };
    filters: {
        type: string;
        status: string;
        search: string;
    };
}

export default function ChequesIndex({ cheques, bankAccounts, metrics, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Modals
    const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null);
    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const [selectedBankId, setSelectedBankId] = useState(bankAccounts[0]?.id || '');
    
    const [bounceModalOpen, setBounceModalOpen] = useState(false);
    const [bounceReason, setBounceReason] = useState('');

    const applyFilters = (newType?: string, newStatus?: string) => {
        router.get('/treasury/cheques', {
            type: newType !== undefined ? newType : typeFilter,
            status: newStatus !== undefined ? newStatus : statusFilter,
            search,
        }, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleDeposit = () => {
        if (!selectedCheque || !selectedBankId) return;
        router.post(`/treasury/cheques/${selectedCheque.id}/deposit`, {
            bank_account_id: selectedBankId,
        }, {
            onSuccess: () => setDepositModalOpen(false),
        });
    };

    const handleCollect = (cheque: Cheque) => {
        if (confirm(t('cheques.confirmCollect', 'هل أنت متأكد من تحصيل هذا الشيك وإيداعه بحساب البنك؟'))) {
            router.post(`/treasury/cheques/${cheque.id}/collect`);
        }
    };

    const handleBounce = () => {
        if (!selectedCheque || !bounceReason) return;
        router.post(`/treasury/cheques/${selectedCheque.id}/bounce`, {
            reason: bounceReason,
        }, {
            onSuccess: () => {
                setBounceModalOpen(false);
                setBounceReason('');
            },
        });
    };

    const handleClear = (cheque: Cheque) => {
        if (confirm(t('cheques.confirmClear', 'هل أنت متأكد من خصم ومقاصة هذا الشيك الصادر من حساب البنك؟'))) {
            router.post(`/treasury/cheques/${cheque.id}/clear`);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'in_safe':
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{t('cheques.inSafe', 'في الخزينة')}</Badge>;
            case 'under_collection':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t('cheques.underCollection', 'برسم التحصيل')}</Badge>;
            case 'collected':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t('cheques.collected', 'تم التحصيل')}</Badge>;
            case 'bounced':
                return <Badge variant="destructive">{t('cheques.bounced', 'مرتد / مرفوض')}</Badge>;
            case 'issued':
                return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">{t('cheques.issuedPending', 'صادر معلق')}</Badge>;
            case 'cleared':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t('cheques.cleared', 'تم الصرف والمقاصة')}</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <Head title={t('cheques.title', 'إدارة الشيكات وأوراق القبض والدفع (PDC)')} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <CreditCard className="h-7 w-7 text-primary" />
                        {t('cheques.title', 'إدارة الشيكات وأوراق القبض والدفع (PDC)')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('cheques.subtitle', 'متابعة دورة حياة الشيكات الواردة والصادرة والتحصيل والارتداد آلياً بالقيود المحاسبية')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/treasury/cheques/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            {t('cheques.registerNew', 'تسجيل شيك جديد')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('cheques.totalReceived', 'إجمالي شيكات القبض')}</span>
                        <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold text-foreground mt-2">
                        {metrics.total_received_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="text-amber-500 font-semibold">{metrics.in_safe_count} {t('cheques.inSafe', 'في الخزينة')}</span>
                        <span>•</span>
                        <span className="text-blue-500 font-semibold">{metrics.under_collection_count} {t('cheques.atBank', 'بالبنك')}</span>
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('cheques.collectedAmount', 'الشيكات المحصلة')}</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold text-emerald-500 mt-2">
                        {metrics.collected_count} {t('cheques.chequesCount', 'شيك')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        {t('cheques.collectedSuccess', 'تم إيداعها في الحسابات البنكية')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('cheques.bouncedAlert', 'الشيكات المرتدة')}</span>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="text-xl font-bold text-destructive mt-2">
                        {metrics.bounced_count} {t('cheques.chequesCount', 'شيك')}
                    </div>
                    <div className="text-xs text-destructive/80 mt-2">
                        {t('cheques.reversalDone', 'تم إعادة إثبات المديونية')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('cheques.totalIssued', 'إجمالي شيكات الدفع')}</span>
                        <ArrowUpRight className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="text-xl font-bold text-foreground mt-2">
                        {metrics.total_issued_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="text-purple-500 font-semibold">{metrics.issued_pending_count} {t('cheques.pendingClear', 'معلق')}</span>
                        <span>•</span>
                        <span className="text-emerald-500 font-semibold">{metrics.cleared_count} {t('cheques.cleared', 'تم الصرف')}</span>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Button 
                        variant={typeFilter === '' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => { setTypeFilter(''); applyFilters(''); }}
                    >
                        {t('cheques.allTypes', 'الكل')}
                    </Button>
                    <Button 
                        variant={typeFilter === 'received' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => { setTypeFilter('received'); applyFilters('received'); }}
                    >
                        <ArrowDownLeft className="h-3.5 w-3.5 mr-1" />
                        {t('cheques.received', 'شيكات مقبوضة (واردة)')}
                    </Button>
                    <Button 
                        variant={typeFilter === 'issued' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => { setTypeFilter('issued'); applyFilters('issued'); }}
                    >
                        <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                        {t('cheques.issued', 'شيكات مدفوعة (صادرة)')}
                    </Button>
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-80">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('cheques.searchPlaceholder', 'بحث برقم الشيك أو الساحب...')}
                            className="pr-9"
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                        <Filter className="h-4 w-4" />
                    </Button>
                </form>
            </div>

            {/* Cheques Table */}
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4">{t('cheques.number', 'رقم الشيك')}</th>
                                <th className="p-4">{t('cheques.type', 'النوع')}</th>
                                <th className="p-4">{t('cheques.bank', 'البنك المسحوب عليه')}</th>
                                <th className="p-4">{t('cheques.party', 'الطرف المعني (الساحب / المستفيد)')}</th>
                                <th className="p-4">{t('cheques.dueDate', 'تاريخ الاستحقاق')}</th>
                                <th className="p-4">{t('cheques.amount', 'المبلغ')}</th>
                                <th className="p-4">{t('cheques.status', 'الحالة')}</th>
                                <th className="p-4 text-center">{t('cheques.actions', 'الإجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {cheques.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                        {t('cheques.noRecords', 'لا توجد شيكات مسجلة تطابق معايير البحث.')}
                                    </td>
                                </tr>
                            ) : (
                                cheques.data.map((cheque) => (
                                    <tr key={cheque.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4 font-mono font-bold text-foreground">
                                            {cheque.cheque_number}
                                        </td>
                                        <td className="p-4">
                                            {cheque.type === 'received' ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                    <ArrowDownLeft className="h-3 w-3" />
                                                    {t('cheques.received', 'قبض')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                                    <ArrowUpRight className="h-3 w-3" />
                                                    {t('cheques.issued', 'دفع')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Building className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                <span>{cheque.bank_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-foreground">
                                                {cheque.type === 'received' ? cheque.drawer_name : (cheque.payee_name || cheque.drawer_name)}
                                            </div>
                                            {cheque.party && (
                                                <div className="text-xs text-muted-foreground">{cheque.party.name}</div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-mono text-xs">{cheque.due_date}</div>
                                        </td>
                                        <td className="p-4 font-bold font-mono text-foreground">
                                            {parseFloat(cheque.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {cheque.currency}
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(cheque.status)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Link href={`/treasury/cheques/${cheque.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {/* Actions for Received Cheques */}
                                                {cheque.type === 'received' && cheque.status === 'in_safe' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 text-xs text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                                                        onClick={() => {
                                                            setSelectedCheque(cheque);
                                                            setDepositModalOpen(true);
                                                        }}
                                                    >
                                                        {t('cheques.depositBtn', 'إيداع برسم التحصيل')}
                                                    </Button>
                                                )}

                                                {cheque.type === 'received' && (cheque.status === 'in_safe' || cheque.status === 'under_collection') && (
                                                    <>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                                                            onClick={() => handleCollect(cheque)}
                                                        >
                                                            {t('cheques.collectBtn', 'تحصيل')}
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                                                            onClick={() => {
                                                                setSelectedCheque(cheque);
                                                                setBounceModalOpen(true);
                                                            }}
                                                        >
                                                            {t('cheques.bounceBtn', 'ارتداد')}
                                                        </Button>
                                                    </>
                                                )}

                                                {/* Actions for Issued Cheques */}
                                                {cheque.type === 'issued' && cheque.status === 'issued' && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                                                        onClick={() => handleClear(cheque)}
                                                    >
                                                        {t('cheques.clearBtn', 'صرف ومقاصة')}
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Deposit Modal */}
            <Dialog open={depositModalOpen} onOpenChange={setDepositModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('cheques.depositModalTitle', 'إيداع شيك برسم التحصيل')}</DialogTitle>
                        <DialogDescription>
                            {t('cheques.depositModalDesc', 'حدد الحساب البنكي الذي تم تسليم الشيك إليه للتحصيل')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('cheques.selectBank', 'حساب البنك')}</Label>
                            <select
                                value={selectedBankId}
                                onChange={(e) => setSelectedBankId(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            >
                                {bankAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name_ar || acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDepositModalOpen(false)}>
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button onClick={handleDeposit}>
                            {t('cheques.confirmDeposit', 'تأكيد الإيداع')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bounce Modal */}
            <Dialog open={bounceModalOpen} onOpenChange={setBounceModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('cheques.bounceModalTitle', 'إثبات ارتداد الشيك')}</DialogTitle>
                        <DialogDescription>
                            {t('cheques.bounceModalDesc', 'سيتم عكس القيد المحاسبي وإعادة تسجيل المديونية على العميل فوراً')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('cheques.bounceReason', 'سبب الارتداد')}</Label>
                            <Input
                                value={bounceReason}
                                onChange={(e) => setBounceReason(e.target.value)}
                                placeholder={t('cheques.bounceReasonPlaceholder', 'مثال: عدم كفاية الرصيد، عدم مطابقة التوقيع...')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBounceModalOpen(false)}>
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button variant="destructive" onClick={handleBounce} disabled={!bounceReason}>
                            {t('cheques.confirmBounce', 'تأكيد ارتداد الشيك')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
