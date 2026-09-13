import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    CreditCard, 
    ArrowLeft, 
    ArrowRight, 
    ArrowDownLeft, 
    ArrowUpRight, 
    Calendar, 
    Building, 
    FileText, 
    CheckCircle2, 
    AlertTriangle, 
    Clock, 
    Landmark,
    BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface JournalLine {
    id: string;
    account: Account;
    debit: string;
    credit: string;
    description?: string;
}

interface JournalEntry {
    id: string;
    entry_number: string;
    date: string;
    description: string;
    status: string;
    lines: JournalLine[];
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
    notes?: string;
    party?: { id: string; name: string };
    bank_account?: Account;
    pdc_account?: Account;
    journal_entry?: JournalEntry;
    settlement_journal_entry?: JournalEntry;
}

interface Props {
    cheque: Cheque;
    bankAccounts: Account[];
}

export default function ChequeShow({ cheque, bankAccounts }: Props) {
    const { t, isRtl } = useTranslation();
    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const [selectedBankId, setSelectedBankId] = useState(bankAccounts[0]?.id || '');
    
    const [bounceModalOpen, setBounceModalOpen] = useState(false);
    const [bounceReason, setBounceReason] = useState('');

    const handleDeposit = () => {
        if (!selectedBankId) return;
        router.post(`/treasury/cheques/${cheque.id}/deposit`, {
            bank_account_id: selectedBankId,
        }, {
            onSuccess: () => setDepositModalOpen(false),
        });
    };

    const handleCollect = () => {
        if (confirm(t('cheques.confirmCollect', 'هل أنت متأكد من تحصيل هذا الشيك وإيداعه بحساب البنك؟'))) {
            router.post(`/treasury/cheques/${cheque.id}/collect`);
        }
    };

    const handleBounce = () => {
        if (!bounceReason) return;
        router.post(`/treasury/cheques/${cheque.id}/bounce`, {
            reason: bounceReason,
        }, {
            onSuccess: () => {
                setBounceModalOpen(false);
                setBounceReason('');
            },
        });
    };

    const handleClear = () => {
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
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <Head title={`${t('cheques.cheque', 'شيك')} #${cheque.cheque_number}`} />

            {/* Top Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/treasury/cheques">
                        <Button variant="ghost" size="icon">
                            {isRtl ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                                #{cheque.cheque_number}
                            </h1>
                            {getStatusBadge(cheque.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {cheque.type === 'received' 
                                ? t('cheques.receivedSubtitle', 'شيك مقبوض برسم التحصيل') 
                                : t('cheques.issuedSubtitle', 'شيك مدفوع آجل')}
                        </p>
                    </div>
                </div>

                {/* Lifecycle Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    {cheque.type === 'received' && cheque.status === 'in_safe' && (
                        <Button 
                            variant="default"
                            onClick={() => setDepositModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Landmark className="h-4 w-4 mr-1.5" />
                            {t('cheques.depositBtn', 'إيداع برسم التحصيل')}
                        </Button>
                    )}

                    {cheque.type === 'received' && (cheque.status === 'in_safe' || cheque.status === 'under_collection') && (
                        <>
                            <Button 
                                variant="default"
                                onClick={handleCollect}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                {t('cheques.collectBtn', 'تحصيل بالبنك')}
                            </Button>
                            <Button 
                                variant="destructive"
                                onClick={() => setBounceModalOpen(true)}
                            >
                                <AlertTriangle className="h-4 w-4 mr-1.5" />
                                {t('cheques.bounceBtn', 'إثبات ارتداد')}
                            </Button>
                        </>
                    )}

                    {cheque.type === 'issued' && cheque.status === 'issued' && (
                        <Button 
                            variant="default"
                            onClick={handleClear}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            {t('cheques.clearBtn', 'خصم ومقاصة بنكية')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Bounce Warning if Bounced */}
            {cheque.status === 'bounced' && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                        <div className="font-bold text-destructive">{t('cheques.bouncedAlertTitle', 'هذا الشيك مرتد ومرفوض من البنك')}</div>
                        <p className="text-sm text-destructive/90 mt-1">
                            {t('cheques.bounceReasonLabel', 'السبب المسجل')}: {cheque.bounce_reason || 'غير محدد'}
                        </p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('cheques.financialInfo', 'البيانات المالية')}</h3>
                    <div>
                        <div className="text-xs text-muted-foreground">{t('cheques.amount', 'مبلغ الشيك')}</div>
                        <div className="text-3xl font-bold font-mono text-foreground mt-1">
                            {parseFloat(cheque.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {cheque.currency}
                        </div>
                    </div>
                    <div className="pt-2 border-t border-border/60">
                        <div className="text-xs text-muted-foreground">{t('cheques.bankName', 'البنك المسحوب عليه')}</div>
                        <div className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-primary" />
                            {cheque.bank_name}
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('cheques.partiesInfo', 'الأطراف المعنية')}</h3>
                    <div>
                        <div className="text-xs text-muted-foreground">{t('cheques.drawerName', 'الساحب')}</div>
                        <div className="font-medium text-foreground mt-0.5">{cheque.drawer_name}</div>
                    </div>
                    {cheque.payee_name && (
                        <div>
                            <div className="text-xs text-muted-foreground">{t('cheques.payeeName', 'المستفيد')}</div>
                            <div className="font-medium text-foreground mt-0.5">{cheque.payee_name}</div>
                        </div>
                    )}
                    {cheque.party && (
                        <div className="pt-2 border-t border-border/60">
                            <div className="text-xs text-muted-foreground">{t('cheques.linkedParty', 'الطرف في النظام')}</div>
                            <div className="font-medium text-foreground mt-0.5">{cheque.party.name}</div>
                        </div>
                    )}
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">{t('cheques.datesAndAccounts', 'التواريخ والحسابات')}</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <div className="text-xs text-muted-foreground">{t('cheques.issueDate', 'تاريخ التحرير')}</div>
                            <div className="font-mono text-sm mt-0.5">{cheque.issue_date}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground">{t('cheques.dueDate', 'تاريخ الاستحقاق')}</div>
                            <div className="font-mono text-sm mt-0.5 font-bold">{cheque.due_date}</div>
                        </div>
                    </div>
                    {cheque.bank_account && (
                        <div className="pt-2 border-t border-border/60">
                            <div className="text-xs text-muted-foreground">{t('cheques.bankAccount', 'حساب البنك المرتبط')}</div>
                            <div className="text-sm font-medium text-foreground mt-0.5">
                                {cheque.bank_account.code} - {cheque.bank_account.name_ar || cheque.bank_account.name}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Journal Entries Section */}
            <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-foreground">
                        {t('cheques.journalEntriesAudit', 'القيود المحاسبية التلقائية المرتبطة بالشيك')}
                    </h2>
                </div>

                {/* Initial Entry */}
                {cheque.journal_entry && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                                <Badge variant="secondary">{t('cheques.initialEntry', 'قيد الإثبات الأولي')}</Badge>
                                <span className="font-mono font-bold text-primary">{cheque.journal_entry.entry_number}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{cheque.journal_entry.date}</div>
                        </div>
                        <div className="border border-border/60 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-muted/40 text-muted-foreground text-xs">
                                    <tr>
                                        <th className="p-3">{t('accounting.account', 'الحساب')}</th>
                                        <th className="p-3">{t('accounting.debit', 'مدين')}</th>
                                        <th className="p-3">{t('accounting.credit', 'دائن')}</th>
                                        <th className="p-3">{t('accounting.description', 'البيان')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {cheque.journal_entry.lines?.map((line) => (
                                        <tr key={line.id}>
                                            <td className="p-3 font-medium">
                                                {line.account?.code} - {line.account?.name_ar || line.account?.name}
                                            </td>
                                            <td className="p-3 font-mono font-bold">
                                                {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 font-mono font-bold">
                                                {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 text-xs text-muted-foreground">{line.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Settlement / Reversal Entry */}
                {cheque.settlement_journal_entry && (
                    <div className="space-y-3 pt-4 border-t border-border/60">
                        <div className="flex items-center justify-between text-sm">
                            <div className="font-semibold text-foreground flex items-center gap-2">
                                <Badge variant="secondary">
                                    {cheque.status === 'bounced' 
                                        ? t('cheques.reversalEntry', 'قيد عكس الارتداد') 
                                        : t('cheques.settlementEntry', 'قيد التحصيل أو المقاصة النهائية')}
                                </Badge>
                                <span className="font-mono font-bold text-primary">{cheque.settlement_journal_entry.entry_number}</span>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">{cheque.settlement_journal_entry.date}</div>
                        </div>
                        <div className="border border-border/60 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-muted/40 text-muted-foreground text-xs">
                                    <tr>
                                        <th className="p-3">{t('accounting.account', 'الحساب')}</th>
                                        <th className="p-3">{t('accounting.debit', 'مدين')}</th>
                                        <th className="p-3">{t('accounting.credit', 'دائن')}</th>
                                        <th className="p-3">{t('accounting.description', 'البيان')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {cheque.settlement_journal_entry.lines?.map((line) => (
                                        <tr key={line.id}>
                                            <td className="p-3 font-medium">
                                                {line.account?.code} - {line.account?.name_ar || line.account?.name}
                                            </td>
                                            <td className="p-3 font-mono font-bold">
                                                {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 font-mono font-bold">
                                                {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="p-3 text-xs text-muted-foreground">{line.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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
