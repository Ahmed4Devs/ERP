import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Landmark, 
    Plus, 
    Search, 
    ShieldCheck, 
    Clock, 
    AlertTriangle, 
    CheckCircle2, 
    RotateCcw, 
    Calendar, 
    Building,
    Filter,
    ArrowRight
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

interface BankGuarantee {
    id: string;
    guarantee_number: string;
    type: 'bid_bond' | 'performance_bond' | 'advance_payment' | 'retention';
    beneficiary_name: string;
    issuing_bank: string;
    amount: string;
    margin_percentage: string;
    margin_amount: string;
    commission_amount: string;
    issue_date: string;
    expiry_date: string;
    status: 'active' | 'renewed' | 'released' | 'claimed';
    notes?: string;
    bank_account?: Account;
    margin_account?: Account;
    project?: { name: string; project_number: string };
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    guarantees: PaginatedData<BankGuarantee>;
    metrics: {
        total_active_amount: number;
        total_margin_amount: number;
        active_count: number;
        expiring_soon_count: number;
    };
    filters: {
        type: string;
        status: string;
        search: string;
    };
}

export default function BankGuaranteesIndex({ guarantees, metrics, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Modals
    const [selectedGuarantee, setSelectedGuarantee] = useState<BankGuarantee | null>(null);
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [newExpiryDate, setNewExpiryDate] = useState('');
    const [renewalFee, setRenewalFee] = useState('0');

    const applyFilters = (newType?: string, newStatus?: string) => {
        router.get('/treasury/bank-guarantees', {
            type: newType !== undefined ? newType : typeFilter,
            status: newStatus !== undefined ? newStatus : statusFilter,
            search,
        }, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleRelease = (guarantee: BankGuarantee) => {
        if (confirm(t('guarantees.confirmRelease', `هل أنت متأكد من الإفراج عن خطاب الضمان رقم ${guarantee.guarantee_number} واسترداد الغطاء النقدي (${parseFloat(guarantee.margin_amount).toLocaleString()} SAR) لحساب البنك؟`))) {
            router.post(`/treasury/bank-guarantees/${guarantee.id}/release`);
        }
    };

    const handleRenew = () => {
        if (!selectedGuarantee || !newExpiryDate) return;
        router.post(`/treasury/bank-guarantees/${selectedGuarantee.id}/renew`, {
            expiry_date: newExpiryDate,
            renewal_fee: parseFloat(renewalFee || '0'),
        }, {
            onSuccess: () => {
                setRenewModalOpen(false);
                setNewExpiryDate('');
                setRenewalFee('0');
            },
        });
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'bid_bond':
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{t('guarantees.bidBond', 'ضمان ابتدائي (دخول عطاء)')}</Badge>;
            case 'performance_bond':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t('guarantees.performanceBond', 'ضمان نهائي (حسن تنفيذ)')}</Badge>;
            case 'advance_payment':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t('guarantees.advancePayment', 'دفعة مقدمة')}</Badge>;
            case 'retention':
                return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">{t('guarantees.retention', 'ضمان صيانة وضمان أعمال')}</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t('guarantees.active', 'ساري ومفعّل')}</Badge>;
            case 'renewed':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t('guarantees.renewed', 'تم التجديد')}</Badge>;
            case 'released':
                return <Badge variant="outline" className="bg-muted text-muted-foreground">{t('guarantees.released', 'مفرج عنه ومسترد')}</Badge>;
            case 'claimed':
                return <Badge variant="destructive">{t('guarantees.claimed', 'مصادر')}</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <Head title={t('guarantees.title', 'خطابات الضمان البنكية (LG)')} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Landmark className="h-7 w-7 text-primary" />
                        {t('guarantees.title', 'خطابات الضمان البنكية (Letters of Guarantee)')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('guarantees.subtitle', 'متابعة خطابات الضمان الابتدائية والنهائية وتجميد الغطاء النقدي واسترداده آلياً بالقيود')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/treasury/bank-guarantees/create">
                        <Button className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            {t('guarantees.issueNew', 'إصدار خطاب ضمان جديد')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('guarantees.totalActive', 'إجمالي الضمانات السارية')}</span>
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold text-foreground mt-2">
                        {metrics.total_active_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        {metrics.active_count} {t('guarantees.activeBonds', 'خطاب ضمان ساري')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('guarantees.totalMargin', 'الغطاء النقدي المحجوز')}</span>
                        <Landmark className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-xl font-bold text-blue-500 mt-2">
                        {metrics.total_margin_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        {t('guarantees.marginTiedUp', 'محجوز كوديعة تأمينية لدى البنوك')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('guarantees.expiringSoon', 'أوشكت على الانتهاء (< 30 يوم)')}</span>
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-xl font-bold text-amber-500 mt-2">
                        {metrics.expiring_soon_count} {t('guarantees.bondsCount', 'خطاب')}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        {t('guarantees.requireRenewal', 'تحتاج إلى تمديد أو إفراج واسترداد')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('guarantees.activeCount', 'عدد الخطابات النشطة')}</span>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xl font-bold text-foreground mt-2">
                        {metrics.active_count}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        {t('guarantees.statusClean', 'تحديث دوري ومطابقة آلية')}
                    </div>
                </div>
            </div>

            {/* Filter and Search */}
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <Button 
                        variant={typeFilter === '' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => { setTypeFilter(''); applyFilters(''); }}
                    >
                        {t('guarantees.all', 'الكل')}
                    </Button>
                    <Button 
                        variant={typeFilter === 'bid_bond' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => { setTypeFilter('bid_bond'); applyFilters('bid_bond'); }}
                    >
                        {t('guarantees.bidBondShort', 'ابتدائي')}
                    </Button>
                    <Button 
                        variant={typeFilter === 'performance_bond' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => { setTypeFilter('performance_bond'); applyFilters('performance_bond'); }}
                    >
                        {t('guarantees.performanceShort', 'نهائي')}
                    </Button>
                    <Button 
                        variant={typeFilter === 'advance_payment' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => { setTypeFilter('advance_payment'); applyFilters('advance_payment'); }}
                    >
                        {t('guarantees.advanceShort', 'دفعة مقدمة')}
                    </Button>
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-80">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('guarantees.searchPlaceholder', 'بحث برقم الخطاب أو المستفيد...')}
                            className="pr-9"
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                        <Filter className="h-4 w-4" />
                    </Button>
                </form>
            </div>

            {/* Guarantees Table */}
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                            <tr>
                                <th className="p-4">{t('guarantees.number', 'رقم الخطاب')}</th>
                                <th className="p-4">{t('guarantees.type', 'النوع')}</th>
                                <th className="p-4">{t('guarantees.beneficiary', 'الجهة المستفيدة')}</th>
                                <th className="p-4">{t('guarantees.bank', 'البنك المصدر')}</th>
                                <th className="p-4">{t('guarantees.amount', 'قيمة الضمان')}</th>
                                <th className="p-4">{t('guarantees.margin', 'الغطاء المحجوز')}</th>
                                <th className="p-4">{t('guarantees.expiryDate', 'تاريخ الانتهاء')}</th>
                                <th className="p-4">{t('guarantees.status', 'الحالة')}</th>
                                <th className="p-4 text-center">{t('guarantees.actions', 'الإجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {guarantees.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                        {t('guarantees.noRecords', 'لا توجد خطابات ضمان مسجلة.')}
                                    </td>
                                </tr>
                            ) : (
                                guarantees.data.map((guarantee) => (
                                    <tr key={guarantee.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-4 font-mono font-bold text-foreground">
                                            {guarantee.guarantee_number}
                                        </td>
                                        <td className="p-4">
                                            {getTypeBadge(guarantee.type)}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-foreground">{guarantee.beneficiary_name}</div>
                                            {guarantee.project && (
                                                <div className="text-xs text-muted-foreground">{guarantee.project.name}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Building className="h-3.5 w-3.5 text-muted-foreground/70" />
                                                <span>{guarantee.issuing_bank}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold font-mono text-foreground">
                                            {parseFloat(guarantee.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="p-4 font-mono text-blue-500 font-semibold">
                                            {parseFloat(guarantee.margin_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                            <span className="text-xs text-muted-foreground mr-1">({parseFloat(guarantee.margin_percentage)}%)</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-mono text-xs">{guarantee.expiry_date}</div>
                                        </td>
                                        <td className="p-4">
                                            {getStatusBadge(guarantee.status)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {(guarantee.status === 'active' || guarantee.status === 'renewed') && (
                                                    <>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 text-xs text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                                                            onClick={() => {
                                                                setSelectedGuarantee(guarantee);
                                                                setNewExpiryDate(guarantee.expiry_date);
                                                                setRenewModalOpen(true);
                                                            }}
                                                        >
                                                            <RotateCcw className="h-3 w-3 mr-1" />
                                                            {t('guarantees.renewBtn', 'تجديد')}
                                                        </Button>

                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                                                            onClick={() => handleRelease(guarantee)}
                                                        >
                                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                                            {t('guarantees.releaseBtn', 'إفراج واسترداد')}
                                                        </Button>
                                                    </>
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

            {/* Renew Modal */}
            <Dialog open={renewModalOpen} onOpenChange={setRenewModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('guarantees.renewModalTitle', 'تجديد وتمديد خطاب الضمان')}</DialogTitle>
                        <DialogDescription>
                            {t('guarantees.renewModalDesc', 'تحديث تاريخ الصلاحية الجديد مع إمكانية قيد عمولة التجديد آلياً')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('guarantees.newExpiryDate', 'تاريخ الانتهاء الجديد')} *</Label>
                            <Input
                                type="date"
                                value={newExpiryDate}
                                onChange={(e) => setNewExpiryDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('guarantees.renewalFee', 'عمولة التجديد البنكية (SAR)')}</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={renewalFee}
                                onChange={(e) => setRenewalFee(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenewModalOpen(false)}>
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button onClick={handleRenew} disabled={!newExpiryDate}>
                            {t('guarantees.confirmRenew', 'تأكيد التجديد')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
