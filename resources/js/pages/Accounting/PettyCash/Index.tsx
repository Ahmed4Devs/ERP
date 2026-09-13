import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { HandCoins, Plus, Search, Eye, Printer, CheckCircle2, Clock, DollarSign, Wallet, ArrowLeft, ArrowRight, UserCheck, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface Branch {
    id: string;
    name: string;
}

interface PettyCashFund {
    id: string;
    name: string;
    name_ar?: string;
    code: string;
    fund_limit: string;
    current_balance: string;
    status: string;
    notes?: string;
    custodian?: User;
    account?: Account;
    branch?: Branch;
}

interface PettyCashSettlement {
    id: string;
    settlement_number: string;
    date: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    reimbursement_type: string;
    status: 'draft' | 'posted' | 'rejected';
    fund?: PettyCashFund;
    branch?: Branch;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    funds: PettyCashFund[];
    settlements: PaginatedData<PettyCashSettlement>;
    metrics: {
        total_funds: number;
        total_fund_limits: string | number;
        total_current_balance: string | number;
        posted_settlements_total: string | number;
    };
    users: User[];
    custodyAccounts: Account[];
    branches: Branch[];
    filters: {
        search?: string;
        status?: string;
    };
}

export default function PettyCashIndex({
    funds,
    settlements,
    metrics,
    users,
    custodyAccounts,
    branches,
    filters,
}: Props) {
    const { isRtl } = useTranslation();
    const [activeTab, setActiveTab] = useState<'funds' | 'settlements'>('funds');
    const [showFundModal, setShowFundModal] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');

    const fundForm = useForm({
        name: '',
        name_ar: '',
        code: `PCF-${String(funds.length + 1).padStart(2, '0')}`,
        custodian_id: users[0]?.id || '',
        account_id: custodyAccounts[0]?.id || '',
        branch_id: branches[0]?.id || '',
        fund_limit: 5000,
        current_balance: 5000,
        notes: '',
    });

    const handleCreateFund = (e: React.FormEvent) => {
        e.preventDefault();
        fundForm.post('/accounting/petty-cash/funds', {
            onSuccess: () => {
                setShowFundModal(false);
                fundForm.reset();
            },
        });
    };

    const handleSearchSettlements = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/accounting/petty-cash', {
            search: search || undefined,
            status: status || undefined,
        }, { preserveState: true, replace: true });
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <Head title={isRtl ? 'إدارة العهد النقدية والمصروفات النثرية' : 'Petty Cash Management'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <HandCoins className="h-7 w-7 text-amber-600" />
                        {isRtl ? 'العهد النقدية والمصروفات النثرية' : 'Petty Cash & Custody Funds'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدارة العهد النقدية للموظفين، سندات التسوية النثرية، الاستعاضة البنكية، وإثبات قيود المصاريف وضريبة المدخلات'
                            : 'Manage employee petty cash funds, expense settlement vouchers, bank replenishment & VAT recovery'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowFundModal(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        {isRtl ? 'إنشاء صندوق عهدة' : 'New Petty Fund'}
                    </Button>
                    <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-sm">
                        <Link href="/accounting/petty-cash/settlements/create">
                            <Plus className="h-4 w-4" />
                            {isRtl ? 'سند تسوية عهدة' : 'New Settlement'}
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                            {isRtl ? 'عدد صناديق العهد' : 'Total Funds'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {metrics.total_funds}
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                            {isRtl ? 'إجمالي السقوف المعتمدة' : 'Approved Fund Limits'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {parseFloat(String(metrics.total_fund_limits || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-neutral-500">{isRtl ? 'ر.س' : 'SAR'}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {isRtl ? 'الرصيد النقدي المتوفر' : 'Available Balance'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {parseFloat(String(metrics.total_current_balance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-neutral-500">{isRtl ? 'ر.س' : 'SAR'}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {isRtl ? 'المصروفات النثرية المرحلة' : 'Settled Expenses'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                            <HandCoins className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {parseFloat(String(metrics.posted_settlements_total || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-neutral-500">{isRtl ? 'ر.س' : 'SAR'}</span>
                    </div>
                </div>
            </div>

            {/* View Tabs */}
            <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 gap-6 text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('funds')}
                    className={`pb-3 border-b-2 transition-colors ${
                        activeTab === 'funds'
                            ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    {isRtl ? 'صناديق العهد النقدية' : 'Petty Cash Funds'} ({funds.length})
                </button>
                <button
                    onClick={() => setActiveTab('settlements')}
                    className={`pb-3 border-b-2 transition-colors ${
                        activeTab === 'settlements'
                            ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                    {isRtl ? 'سندات التسوية النثرية' : 'Settlement Vouchers'} ({settlements.total})
                </button>
            </div>

            {/* Funds View */}
            {activeTab === 'funds' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {funds.length === 0 ? (
                        <div className="col-span-full bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-12 text-center text-neutral-400">
                            <HandCoins className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
                            <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                                {isRtl ? 'لا توجد صناديق عهد نقدية مسجلة' : 'No petty cash funds configured'}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                                {isRtl ? 'قم بإنشاء صندوق عهدة جديد وتعيين الموظف المسؤول والسقف المالي.' : 'Create a petty cash fund and assign a custodian and credit ceiling.'}
                            </p>
                            <Button onClick={() => setShowFundModal(true)} className="mt-4 bg-amber-600 text-white">
                                {isRtl ? 'إنشاء صندوق عهدة الآن' : 'Create Fund Now'}
                            </Button>
                        </div>
                    ) : (
                        funds.map((fund) => {
                            const limit = parseFloat(fund.fund_limit) || 1;
                            const balance = parseFloat(fund.current_balance) || 0;
                            const spentPercent = Math.min(100, Math.max(0, ((limit - balance) / limit) * 100));

                            return (
                                <div key={fund.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm space-y-4 hover:border-amber-400 dark:hover:border-amber-600 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                                                {fund.code}
                                            </span>
                                            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1.5">
                                                {isRtl && fund.name_ar ? fund.name_ar : fund.name}
                                            </h3>
                                        </div>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {isRtl ? 'نشط' : 'Active'}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                        <div className="flex items-center gap-1.5">
                                            <UserCheck className="h-3.5 w-3.5 text-neutral-400" />
                                            <span>{isRtl ? 'أمين العهدة:' : 'Custodian:'}</span>
                                            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{fund.custodian?.name || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                                            <span>{isRtl ? 'الفرع:' : 'Branch:'}</span>
                                            <span>{fund.branch?.name || (isRtl ? 'المركز الرئيسي' : 'HQ')}</span>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-neutral-500">{isRtl ? 'الرصيد المتاح:' : 'Balance:'}</span>
                                            <span className="font-mono font-bold text-emerald-600">
                                                {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                            </span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${spentPercent > 80 ? 'bg-rose-500' : spentPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${100 - spentPercent}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[11px] text-neutral-400">
                                            <span>{isRtl ? 'السقف المعتمد:' : 'Limit:'} {limit.toLocaleString()} SAR</span>
                                            <span>{isRtl ? 'المصروف:' : 'Spent:'} {(limit - balance).toLocaleString()} SAR</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                        <Button asChild variant="outline" size="sm" className="w-full text-xs">
                                            <Link href={`/accounting/petty-cash/settlements/create?fund_id=${fund.id}`}>
                                                <Plus className="h-3.5 w-3.5 me-1" />
                                                {isRtl ? 'تسوية مصروفات الصندوق' : 'Settle Expenses'}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Settlements View */}
            {activeTab === 'settlements' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <form onSubmit={handleSearchSettlements} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className={`absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'} h-4 w-4 text-neutral-400`} />
                            <Input
                                type="text"
                                placeholder={isRtl ? 'بحث برقم السند أو اسم العهدة...' : 'Search voucher # or fund name...'}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className={`${isRtl ? 'pr-9' : 'pl-9'} text-sm`}
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                        >
                            <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                            <option value="draft">{isRtl ? 'مسودة' : 'Draft'}</option>
                            <option value="posted">{isRtl ? 'مرحل' : 'Posted'}</option>
                        </select>
                        <Button type="submit" variant="secondary" className="gap-2">
                            <Search className="h-4 w-4" />
                            {isRtl ? 'تصفية' : 'Filter'}
                        </Button>
                    </form>

                    {/* Table */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 font-semibold border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th className="py-3.5 px-4 text-start">{isRtl ? 'رقم السند' : 'Voucher #'}</th>
                                        <th className="py-3.5 px-4 text-start">{isRtl ? 'صندوق العهدة' : 'Petty Fund'}</th>
                                        <th className="py-3.5 px-4 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                        <th className="py-3.5 px-4 text-start">{isRtl ? 'طريقة الاستعاضة' : 'Reimbursement'}</th>
                                        <th className="py-3.5 px-4 text-start">{isRtl ? 'المصروفات' : 'Subtotal'}</th>
                                        <th className="py-3.5 px-4 text-start">{isRtl ? 'الضريبة المستردة' : 'VAT'}</th>
                                        <th className="py-3.5 px-4 text-start">{isRtl ? 'إجمالي السند' : 'Total'}</th>
                                        <th className="py-3.5 px-4 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                        <th className="py-3.5 px-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {settlements.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-12 text-center text-neutral-400">
                                                <HandCoins className="h-10 w-10 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
                                                {isRtl ? 'لا توجد سندات تسوية مسجلة' : 'No settlement vouchers found'}
                                            </td>
                                        </tr>
                                    ) : (
                                        settlements.data.map((st) => (
                                            <tr key={st.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                                                <td className="py-3.5 px-4 font-mono font-medium text-amber-600 dark:text-amber-400">
                                                    <Link href={`/accounting/petty-cash/settlements/${st.id}`} className="hover:underline">
                                                        {st.settlement_number}
                                                    </Link>
                                                </td>
                                                <td className="py-3.5 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                                                    {st.fund?.name || '—'}
                                                </td>
                                                <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                                                    {st.date}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs">
                                                    {st.reimbursement_type === 'replenish_bank' ? (
                                                        <span className="text-indigo-600 font-medium">{isRtl ? 'استعاضة بنكية مباشرة' : 'Bank Replenishment'}</span>
                                                    ) : (
                                                        <span className="text-neutral-600 font-medium">{isRtl ? 'تخفيض من رصيد العهدة' : 'Custody Deduction'}</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                                                    {parseFloat(st.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                                                    {parseFloat(st.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                                    {parseFloat(st.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} {isRtl ? 'ر.س' : 'SAR'}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    {st.status === 'posted' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            {isRtl ? 'مرحل ومقفل' : 'Posted'}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <Clock className="h-3 w-3" />
                                                            {isRtl ? 'مسودة' : 'Draft'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Link href={`/accounting/petty-cash/settlements/${st.id}`} title={isRtl ? 'عرض' : 'View'}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Link href={`/accounting/petty-cash/settlements/${st.id}/print`} title={isRtl ? 'طباعة' : 'Print'}>
                                                                <Printer className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {settlements.last_page > 1 && (
                            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-sm">
                                <span className="text-neutral-500">
                                    {isRtl ? `الصفحة ${settlements.current_page} من ${settlements.last_page}` : `Page ${settlements.current_page} of ${settlements.last_page}`}
                                </span>
                                <div className="flex items-center gap-2">
                                    {settlements.current_page > 1 && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/accounting/petty-cash?page=${settlements.current_page - 1}&search=${search}&status=${status}`}>
                                                {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                                                {isRtl ? 'السابق' : 'Previous'}
                                            </Link>
                                        </Button>
                                    )}
                                    {settlements.current_page < settlements.last_page && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/accounting/petty-cash?page=${settlements.current_page + 1}&search=${search}&status=${status}`}>
                                                {isRtl ? 'التالي' : 'Next'}
                                                {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Fund Modal */}
            {showFundModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-lg w-full p-6 shadow-xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 dark:border-neutral-800">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <Wallet className="h-5 w-5 text-amber-600" />
                                {isRtl ? 'إنشاء صندوق عهدة نقدية جديد' : 'New Petty Cash Fund'}
                            </h3>
                            <button onClick={() => setShowFundModal(false)} className="text-neutral-400 hover:text-neutral-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateFund} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {isRtl ? 'اسم الصندوق بالعربية *' : 'Fund Name (AR) *'}
                                </label>
                                <Input
                                    type="text"
                                    required
                                    placeholder={isRtl ? 'مثال: عهدة المصروفات النثرية - الإدارة' : 'e.g. Head Office Petty Cash'}
                                    value={fundForm.data.name_ar}
                                    onChange={(e) => {
                                        fundForm.setData({
                                            ...fundForm.data,
                                            name_ar: e.target.value,
                                            name: fundForm.data.name || e.target.value,
                                        });
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {isRtl ? 'كود الصندوق *' : 'Fund Code *'}
                                    </label>
                                    <Input
                                        type="text"
                                        required
                                        value={fundForm.data.code}
                                        onChange={(e) => fundForm.setData('code', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {isRtl ? 'أمين العهدة (الموظف المسؤول)' : 'Custodian'}
                                    </label>
                                    <select
                                        value={fundForm.data.custodian_id}
                                        onChange={(e) => fundForm.setData('custodian_id', parseInt(e.target.value))}
                                        className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1.5 text-xs"
                                    >
                                        <option value="">{isRtl ? '-- اختر الموظف --' : '-- Select Custodian --'}</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {isRtl ? 'حساب العهدة في الدليل (GL) *' : 'GL Custody Account *'}
                                    </label>
                                    <select
                                        value={fundForm.data.account_id}
                                        onChange={(e) => fundForm.setData('account_id', e.target.value)}
                                        className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1.5 text-xs"
                                        required
                                    >
                                        {custodyAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {isRtl && acc.name_ar ? acc.name_ar : acc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {isRtl ? 'الفرع' : 'Branch'}
                                    </label>
                                    <select
                                        value={fundForm.data.branch_id}
                                        onChange={(e) => fundForm.setData('branch_id', e.target.value)}
                                        className="w-full rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1.5 text-xs"
                                    >
                                        {branches.map((b) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {isRtl ? 'سقف العهدة (SAR) *' : 'Fund Limit (SAR) *'}
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={fundForm.data.fund_limit}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            fundForm.setData({
                                                ...fundForm.data,
                                                fund_limit: val,
                                                current_balance: val,
                                            });
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        {isRtl ? 'الرصيد الافتتاحي (SAR)' : 'Opening Balance'}
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={fundForm.data.current_balance}
                                        onChange={(e) => fundForm.setData('current_balance', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t dark:border-neutral-800">
                                <Button type="button" variant="outline" onClick={() => setShowFundModal(false)}>
                                    {isRtl ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button type="submit" disabled={fundForm.processing} className="bg-amber-600 hover:bg-amber-700 text-white">
                                    {fundForm.processing ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الصندوق' : 'Save Fund')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
