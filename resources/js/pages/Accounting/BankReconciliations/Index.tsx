import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Landmark, FileCheck2, Eye, Printer, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    current_balance: string;
}

interface BankReconciliation {
    id: string;
    statement_number: string;
    statement_date: string;
    start_date: string;
    end_date: string;
    opening_balance: string;
    closing_balance: string;
    cleared_balance: string;
    difference: string;
    status: 'draft' | 'in_progress' | 'reconciled';
    bank_account: Account;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    reconciliations: PaginatedData<BankReconciliation>;
    bankAccounts: Account[];
    filters: {
        search?: string;
        bank_account_id?: string;
        status?: string;
    };
}

export default function BankReconciliationsIndex({ reconciliations, bankAccounts, filters }: Props) {
    const { isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedAccount, setSelectedAccount] = useState(filters.bank_account_id || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/accounting/bank-reconciliation', {
            search: search || undefined,
            bank_account_id: selectedAccount || undefined,
            status: selectedStatus || undefined,
        }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: BankReconciliation['status'], difference: string) => {
        const isBalanced = parseFloat(difference || '0') === 0;

        switch (status) {
            case 'reconciled':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isRtl ? 'تمت المطابقة والإقفال' : 'Reconciled'}
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Clock className="h-3.5 w-3.5" />
                        {isRtl ? 'قيد المطابقة' : 'In Progress'}
                    </span>
                );
            case 'draft':
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-3.5 w-3.5" />
                        {isRtl ? 'مسودة' : 'Draft'}
                    </span>
                );
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <Head title={isRtl ? 'التسوية والمطابقة البنكية' : 'Bank Reconciliation'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <FileCheck2 className="h-7 w-7 text-indigo-600" />
                        <span>{isRtl ? 'التسوية والمطابقة البنكية' : 'Bank Reconciliation'}</span>
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'مطابقة كشوفات الحسابات البنكية الصادرة من البنوك مع قيود دفتر الأستاذ العام وتحديد الفروقات'
                            : 'Reconcile bank account statements with General Ledger bank entries and verify zero discrepancy'}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                    <Link href="/accounting/bank-reconciliation/create">
                        <Plus className="h-4 w-4" />
                        <span>{isRtl ? 'بدء تسوية بنكية جديدة' : 'New Bank Statement'}</span>
                    </Link>
                </Button>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                    <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي كشوفات التسوية' : 'Total Reconciliations'}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">{reconciliations.total}</p>
                </div>
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 shadow-xs dark:border-blue-900/50 dark:bg-blue-950/20">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">{isRtl ? 'كشوفات جاري مطابقتها' : 'Active / In Progress'}</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-1">
                        {reconciliations.data.filter(r => r.status !== 'reconciled').length}
                    </p>
                </div>
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{isRtl ? 'كشوفات مقفلة ومعتمدة' : 'Reconciled & Sealed'}</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
                        {reconciliations.data.filter(r => r.status === 'reconciled').length}
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute start-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder={isRtl ? 'البحث برقم كشف الحساب البنكي...' : 'Search by statement number...'}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9"
                        />
                    </div>
                    <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">{isRtl ? 'جميع الحسابات البنكية' : 'All Bank Accounts'}</option>
                        {bankAccounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                                {acc.code} - {isRtl && acc.name_ar ? acc.name_ar : acc.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
                    >
                        <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                        <option value="draft">{isRtl ? 'مسودة (Draft)' : 'Draft'}</option>
                        <option value="in_progress">{isRtl ? 'قيد المطابقة (In Progress)' : 'In Progress'}</option>
                        <option value="reconciled">{isRtl ? 'معتمدة ومقفلة (Reconciled)' : 'Reconciled'}</option>
                    </select>
                    <Button type="submit" variant="secondary">
                        {isRtl ? 'تصفية' : 'Filter'}
                    </Button>
                </form>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start text-sm">
                        <thead className="border-b border-neutral-100 bg-neutral-50/75 dark:border-neutral-800 dark:bg-neutral-900/50">
                            <tr>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'رقم كشف الحساب' : 'Statement #'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'الحساب البنكي' : 'Bank Account'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'الفترة' : 'Period'}</th>
                                <th className="px-4 py-3 text-end font-medium text-neutral-500">{isRtl ? 'رصيد الإقفال' : 'Ending Balance'}</th>
                                <th className="px-4 py-3 text-end font-medium text-neutral-500">{isRtl ? 'الرصيد المطابق' : 'Cleared Balance'}</th>
                                <th className="px-4 py-3 text-end font-medium text-neutral-500">{isRtl ? 'الفارق' : 'Difference'}</th>
                                <th className="px-4 py-3 text-start font-medium text-neutral-500">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-4 py-3 text-end font-medium text-neutral-500">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {reconciliations.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-neutral-500">
                                        <Landmark className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                                        <p>{isRtl ? 'لا توجد كشوفات تسوية بنكية مسجلة.' : 'No bank reconciliations found.'}</p>
                                    </td>
                                </tr>
                            ) : (
                                reconciliations.data.map((r) => {
                                    const diffVal = parseFloat(r.difference || '0');
                                    const isZero = diffVal === 0;

                                    return (
                                        <tr key={r.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                <Link href={`/accounting/bank-reconciliation/${r.id}`} className="hover:text-indigo-600 hover:underline">
                                                    {r.statement_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-mono text-xs text-neutral-500">[{r.bank_account?.code}]</span>
                                                    <span>{isRtl && r.bank_account?.name_ar ? r.bank_account.name_ar : r.bank_account?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 font-mono text-xs">
                                                {r.start_date} → {r.end_date}
                                            </td>
                                            <td className="px-4 py-3 text-end font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                                {Number(r.closing_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-end font-mono text-neutral-700 dark:text-neutral-300">
                                                {Number(r.cleared_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-end font-mono font-bold">
                                                {isZero ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400">0.00 SAR</span>
                                                ) : (
                                                    <span className="text-red-600 dark:text-red-400 flex items-center justify-end gap-1">
                                                        <AlertCircle className="h-3.5 w-3.5" />
                                                        {Number(r.difference).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {statusBadge(r.status, r.difference)}
                                            </td>
                                            <td className="px-4 py-3 text-end">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-neutral-600 hover:text-indigo-600" title={isRtl ? 'فتح شاشة المطابقة' : 'Open Workbench'}>
                                                        <Link href={`/accounting/bank-reconciliation/${r.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-neutral-600 hover:text-indigo-600" title={isRtl ? 'طباعة مذكرة التسوية' : 'Print Statement'}>
                                                        <a href={`/accounting/bank-reconciliation/${r.id}/print`} target="_blank" rel="noopener noreferrer">
                                                            <Printer className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {reconciliations.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500">
                            {isRtl
                                ? `الصفحة ${reconciliations.current_page} من ${reconciliations.last_page} (إجمالي ${reconciliations.total})`
                                : `Page ${reconciliations.current_page} of ${reconciliations.last_page} (${reconciliations.total} total)`}
                        </p>
                        <div className="flex gap-2">
                            {Array.from({ length: reconciliations.last_page }, (_, i) => i + 1).map((page) => (
                                <Link
                                    key={page}
                                    href={`/accounting/bank-reconciliation?page=${page}&search=${search}&bank_account_id=${selectedAccount}&status=${selectedStatus}`}
                                    className={`px-3 py-1 text-xs rounded-md ${
                                        page === reconciliations.current_page
                                            ? 'bg-indigo-600 text-white font-bold'
                                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                                    }`}
                                >
                                    {page}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
