import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, ArrowLeftRight, Landmark, ShieldCheck, Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface JournalEntry {
    id: string;
    entry_number: string;
}

interface TreasuryTransfer {
    id: string;
    transfer_number: string;
    transfer_date: string;
    amount: string;
    reference_number?: string;
    description?: string;
    from_account: Account;
    to_account: Account;
    journal_entry?: JournalEntry;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    transfers: PaginatedData<TreasuryTransfer>;
    cashAndBankAccounts: Account[];
}

export default function TreasuryTransfersIndex({ transfers, cashAndBankAccounts }: Props) {
    const { t, isRtl } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [form, setForm] = useState({
        from_account_id: cashAndBankAccounts[0]?.id || '',
        to_account_id: cashAndBankAccounts[1]?.id || '',
        transfer_date: new Date().toISOString().split('T')[0],
        amount: '',
        reference_number: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (form.from_account_id === form.to_account_id) {
            setErrorMsg(t('treasury.sameAccountError'));
            return;
        }

        setIsSubmitting(true);
        router.post('/treasury/transfers', {
            ...form,
            amount: parseFloat(form.amount),
        }, {
            onSuccess: () => {
                setIsOpen(false);
                setForm({
                    from_account_id: cashAndBankAccounts[0]?.id || '',
                    to_account_id: cashAndBankAccounts[1]?.id || '',
                    transfer_date: new Date().toISOString().split('T')[0],
                    amount: '',
                    reference_number: '',
                    description: '',
                });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const totalTransferred = transfers.data.reduce((acc, tr) => acc + parseFloat(tr.amount || '0'), 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('treasury.title')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('treasury.title')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('treasury.subtitle')}
                    </p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800">
                            <Plus className="h-4 w-4" />
                            <span>{t('treasury.newTransfer')}</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <ArrowLeftRight className="h-5 w-5 text-blue-600" />
                                    <span>{t('treasury.newTransfer')}</span>
                                </DialogTitle>
                                <DialogDescription>
                                    {t('treasury.subtitle')}
                                </DialogDescription>
                            </DialogHeader>

                            {errorMsg && (
                                <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="from_account">{t('treasury.fromAccount')} *</Label>
                                    <select
                                        id="from_account"
                                        value={form.from_account_id}
                                        onChange={(e) => setForm({ ...form, from_account_id: e.target.value })}
                                        required
                                        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    >
                                        {cashAndBankAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {isRtl && acc.name_ar ? acc.name_ar : acc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="to_account">{t('treasury.toAccount')} *</Label>
                                    <select
                                        id="to_account"
                                        value={form.to_account_id}
                                        onChange={(e) => setForm({ ...form, to_account_id: e.target.value })}
                                        required
                                        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                    >
                                        {cashAndBankAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {isRtl && acc.name_ar ? acc.name_ar : acc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="transfer_date">{t('treasury.transferDate')} *</Label>
                                        <Input
                                            id="transfer_date"
                                            type="date"
                                            value={form.transfer_date}
                                            onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="transfer_amount">{t('treasury.amount')} (SAR) *</Label>
                                        <Input
                                            id="transfer_amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={form.amount}
                                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                            required
                                            placeholder="0.00"
                                            className="font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reference_number">{t('treasury.referenceNumber')}</Label>
                                    <Input
                                        id="reference_number"
                                        placeholder="CHK-4001 / TXN-99"
                                        value={form.reference_number}
                                        onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">{t('treasury.description')}</Label>
                                    <Input
                                        id="description"
                                        placeholder={isRtl ? 'تحويل تغذية الصندوق أو تحويل بنكي...' : 'Fund replenishment or bank transfer...'}
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !form.amount || parseFloat(form.amount) <= 0}
                                    className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800"
                                >
                                    {isSubmitting ? t('common.loading') : t('treasury.saveTransfer')}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Metric cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <ArrowLeftRight className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('treasury.amount')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">
                            {totalTransferred.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('treasury.title')}</p>
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {transfers.total} {isRtl ? 'تحويل' : 'Transfers'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Transfers Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 text-xs font-semibold uppercase">
                            <tr>
                                <th className="px-6 py-3 text-start">{t('treasury.transferNumber')}</th>
                                <th className="px-6 py-3 text-start">{t('treasury.transferDate')}</th>
                                <th className="px-6 py-3 text-start">{t('treasury.fromAccount')}</th>
                                <th className="px-6 py-3 text-start">{t('treasury.toAccount')}</th>
                                <th className="px-6 py-3 text-start">{t('treasury.referenceNumber')}</th>
                                <th className="px-6 py-3 text-end">{t('treasury.amount')}</th>
                                <th className="px-6 py-3 text-end">GL Journal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {transfers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                                        <ArrowLeftRight className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        <p>{t('treasury.noTransfersFound')}</p>
                                    </td>
                                </tr>
                            ) : (
                                transfers.data.map((tr) => (
                                    <tr key={tr.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50">
                                        <td className="px-6 py-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                            {tr.transfer_number}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                            {tr.transfer_date}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-800 dark:text-neutral-200">
                                            <span className="font-mono text-xs text-neutral-500">[{tr.from_account?.code}]</span>{' '}
                                            {isRtl && tr.from_account?.name_ar ? tr.from_account.name_ar : tr.from_account?.name}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-800 dark:text-neutral-200">
                                            <span className="font-mono text-xs text-neutral-500">[{tr.to_account?.code}]</span>{' '}
                                            {isRtl && tr.to_account?.name_ar ? tr.to_account.name_ar : tr.to_account?.name}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {tr.reference_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-blue-600 dark:text-blue-400">
                                            {Number(tr.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono text-xs text-neutral-500">
                                            {tr.journal_entry?.entry_number ? (
                                                <span className="inline-flex items-center gap-1 rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-neutral-700 dark:text-neutral-300">
                                                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                                    {tr.journal_entry.entry_number}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
