import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, FileCheck2, Calendar, RefreshCw, Eye, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface Party {
    id: string;
    name: string;
    name_ar?: string;
}

interface Project {
    id: string;
    project_number: string;
    name: string;
}

interface Contract {
    id: string;
    contract_number: string;
    title: string;
    title_ar?: string;
    customer: Party;
    project?: Project;
    start_date: string;
    end_date: string;
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
    recurring_amount: string;
    next_billing_date: string;
    status: 'draft' | 'active' | 'suspended' | 'expired' | 'terminated';
    auto_renew: boolean;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    contracts: PaginatedData<Contract>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function ContractsIndex({ contracts, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/contracts', { search, status: selectedStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get('/contracts', { search, status: status || undefined }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: Contract['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700';
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'suspended':
                return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'expired':
                return 'bg-neutral-200 text-neutral-600 border border-neutral-300';
            case 'terminated':
                return 'bg-rose-50 text-rose-700 border border-rose-200';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const totalRecurringRevenue = contracts.data.reduce((acc, c) => acc + parseFloat(c.recurring_amount || '0'), 0);
    const activeContractsCount = contracts.data.filter(c => c.status === 'active').length;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'العقود والاشتراكات المتكررة' : 'Contracts & Subscriptions'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {isRtl ? 'العقود الدورية والاشتراكات المتكررة' : 'Recurring Contracts & Subscriptions'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدارة عقود الصيانة والدعم السحابي، الفوترة التلقائية، وترحيل قيود الإيراد إلى الأستاذ العام'
                            : 'Manage SLAs, recurring billing schedules, and automated GL revenue posting'}
                    </p>
                </div>
                <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Link href="/contracts/create">
                        <Plus className="h-4 w-4" />
                        <span>{isRtl ? 'عقد جديد' : 'New Contract'}</span>
                    </Link>
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي الإيراد الدوري التكراري' : 'Total Recurring Amount'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {totalRecurringRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </h3>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
                        <DollarSign className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'العقود النشطة والجارية' : 'Active Contracts'}</p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                            {activeContractsCount}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                        <RefreshCw className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي العقود' : 'Total Contracts'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {contracts.total}
                        </h3>
                    </div>
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/50 text-sky-600 rounded-lg">
                        <FileCheck2 className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-80">
                    <div className="relative flex-1">
                        <Search className={`absolute top-2.5 h-4 w-4 text-neutral-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={isRtl ? 'بحث برقم العقد، العنوان، العميل...' : 'Search contract # or title...'}
                            className={`${isRtl ? 'pr-9' : 'pl-9'}`}
                        />
                    </div>
                    <Button type="submit" variant="secondary" size="sm">
                        {isRtl ? 'بحث' : 'Search'}
                    </Button>
                </form>

                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                    {['', 'draft', 'active', 'suspended', 'expired', 'terminated'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                selectedStatus === status
                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300'
                            }`}
                        >
                            {status === '' ? (isRtl ? 'الكل' : 'All') : status.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs font-semibold uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3 text-start">{isRtl ? 'رقم العقد' : 'Contract #'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'العنوان' : 'Title'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'العميل' : 'Customer'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الدورة الفترية' : 'Cycle'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'تاريخ الفوترة التالي' : 'Next Billing'}</th>
                                <th className="px-6 py-3 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'المبلغ الدوري' : 'Amount'}</th>
                                <th className="px-6 py-3 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {contracts.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                                        <FileCheck2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        {isRtl ? 'لا توجد عقود مسجلة' : 'No contracts found'}
                                    </td>
                                </tr>
                            ) : (
                                contracts.data.map((contract) => (
                                    <tr key={contract.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-neutral-900 dark:text-neutral-100">
                                            {contract.contract_number}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                            {isRtl && contract.title_ar ? contract.title_ar : contract.title}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                            {isRtl && contract.customer?.name_ar ? contract.customer.name_ar : contract.customer?.name}
                                        </td>
                                        <td className="px-6 py-4 capitalize text-neutral-600 dark:text-neutral-400 text-xs">
                                            {contract.billing_cycle.replace('_', ' ')}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {contract.next_billing_date}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(contract.status)}`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {Number(contract.recurring_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900">
                                                <Link href={`/contracts/${contract.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span>{isRtl ? 'عرض والفوترة' : 'View & Bill'}</span>
                                                </Link>
                                            </Button>
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
