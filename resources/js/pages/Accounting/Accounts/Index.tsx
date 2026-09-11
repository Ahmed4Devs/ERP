import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Search, Landmark, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    subtype?: string;
    is_postable: boolean;
    current_balance: string;
    currency: string;
}

interface Props {
    accounts: Account[];
    filters: {
        type?: string;
        search?: string;
    };
}

export default function AccountsIndex({ accounts, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/accounts', { search, type: selectedType || undefined }, { preserveState: true, replace: true });
    };

    const handleTypeChange = (type: string) => {
        setSelectedType(type);
        router.get('/accounts', { search, type: type || undefined }, { preserveState: true, replace: true });
    };

    const typeBadgeColor = (type: string) => {
        switch (type) {
            case 'asset':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-900';
            case 'liability':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-900';
            case 'equity':
                return 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 border-purple-200 dark:border-purple-900';
            case 'revenue':
                return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
            case 'expense':
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-900';
            default:
                return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700';
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('accounting.chartOfAccounts')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('accounting.chartOfAccounts')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('accounting.chartSubtitle')}
                    </p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                        <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('accounting.chartOfAccounts')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">{accounts.length}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <Layers className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('accounting.isPostable')}</p>
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">
                            {accounts.filter((a) => a.is_postable).length}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="rounded-lg bg-purple-50 p-3 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-neutral-500 font-medium">{t('app.currentScope')}</p>
                        <p className="text-sm font-bold text-neutral-900 dark:text-white">Company Isolation Active</p>
                    </div>
                </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:max-w-md">
                    <div className="relative flex-1">
                        <Search className={`absolute top-2.5 h-4 w-4 text-neutral-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('customers.searchPlaceholder')}
                            className={isRtl ? 'pr-9' : 'pl-9'}
                        />
                    </div>
                    <Button type="submit" variant="secondary">
                        {t('common.view')}
                    </Button>
                </form>

                <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
                    {[
                        { label: 'All', value: '' },
                        { label: t('accounting.asset'), value: 'asset' },
                        { label: t('accounting.liability'), value: 'liability' },
                        { label: t('accounting.equity'), value: 'equity' },
                        { label: t('accounting.revenue'), value: 'revenue' },
                        { label: t('accounting.expense'), value: 'expense' },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => handleTypeChange(tab.value)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                selectedType === tab.value
                                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Accounts Table */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:border-neutral-800 dark:bg-neutral-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left rtl:text-right">
                        <thead className="bg-neutral-50 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 font-semibold">{t('accounting.code')}</th>
                                <th className="px-6 py-3 font-semibold">{t('accounting.accountName')}</th>
                                <th className="px-6 py-3 font-semibold">{t('accounting.type')}</th>
                                <th className="px-6 py-3 font-semibold">{t('accounting.subtype')}</th>
                                <th className="px-6 py-3 font-semibold text-center">{t('accounting.isPostable')}</th>
                                <th className="px-6 py-3 font-semibold text-end">{t('accounting.balance')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-neutral-500">
                                        No accounts found.
                                    </td>
                                </tr>
                            ) : (
                                accounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {account.code}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                            <div>{account.name}</div>
                                            {account.name_ar && (
                                                <div className="text-xs text-neutral-500 font-normal mt-0.5">{account.name_ar}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${typeBadgeColor(account.type)}`}>
                                                {t(`accounting.${account.type}`, account.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-neutral-500 capitalize">
                                            {account.subtype ? account.subtype.replace('_', ' ') : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {account.is_postable ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    {t('accounting.yes')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-neutral-400 text-xs font-medium">
                                                    <XCircle className="h-4 w-4" />
                                                    {t('accounting.no')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                            {Number(account.current_balance).toLocaleString(undefined, {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}{' '}
                                            <span className="text-xs text-neutral-500 font-normal">{account.currency}</span>
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
