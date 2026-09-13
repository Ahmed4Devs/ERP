import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { HardHat, Plus, Search, Eye, Printer, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
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
    name: string;
    project_number?: string;
}

interface ServiceInvoice {
    id: string;
    invoice_number: string;
    status: string;
}

interface ContractingClaim {
    id: string;
    claim_number: string;
    project: Project;
    customer: Party;
    claim_date: string;
    contract_value: string;
    current_work_amount: string;
    retention_rate: string;
    retention_amount: string;
    net_claim_amount: string;
    tax_amount: string;
    total_amount: string;
    status: 'draft' | 'certified' | 'billed' | 'rejected';
    invoice?: ServiceInvoice;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
}

interface Props {
    claims: PaginatedData<ContractingClaim>;
    filters: {
        search?: string;
        status?: string;
    };
}

export default function ContractingClaimsIndex({ claims, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/contracting/claims', { search, status: selectedStatus || undefined }, { preserveState: true, replace: true });
    };

    const handleStatusFilter = (status: string) => {
        setSelectedStatus(status);
        router.get('/contracting/claims', { search, status: status || undefined }, { preserveState: true, replace: true });
    };

    const statusBadge = (status: ContractingClaim['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-neutral-100 text-neutral-700';
            case 'certified':
                return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'billed':
                return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 border border-rose-200';
            default:
                return 'bg-neutral-100 text-neutral-700';
        }
    };

    const totalClaimsValue = claims.data.reduce((acc, c) => acc + parseFloat(c.total_amount || '0'), 0);
    const totalRetentionWithheld = claims.data.reduce((acc, c) => acc + parseFloat(c.retention_amount || '0'), 0);

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={isRtl ? 'مستخلصات المقاولات والدفعات' : 'Contracting Claims'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <HardHat className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'مستخلصات المقاولات وخصم الدفعة المقدمة والضمان' : 'Contracting Progress Claims'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إعداد مستخلصات المشاريع الإنشائية بنسبة الإنجاز، حسم الضمان التعاقدي (5% Retention)، وإصدار الفواتير المعتمدة'
                            : 'Progress claims, percentage-of-completion billing, 5% contractual retention, and automated invoice certification'}
                    </p>
                </div>
                <div>
                    <Button asChild className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href="/contracting/claims/create">
                            <Plus className="h-4 w-4" />
                            <span>{isRtl ? 'إعداد مستخلص جديد' : 'New Progress Claim'}</span>
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي المستخلصات المطلوبة' : 'Total Claims Amount'}</p>
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1 font-mono">
                            {totalClaimsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </h3>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
                        <HardHat className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'إجمالي محتجز الضمان (Retention)' : 'Total Retention Withheld'}</p>
                        <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
                            {totalRetentionWithheld.toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </h3>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
                        <FileText className="h-5 w-5" />
                    </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-neutral-500">{isRtl ? 'مستخلصات مفوترة ومعتمدة' : 'Billed & Invoiced'}</p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                            {claims.data.filter(c => c.status === 'billed').length}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">{isRtl ? 'الحالة:' : 'Status:'}</span>
                    {['', 'draft', 'billed'].map((s) => (
                        <button
                            key={s}
                            onClick={() => handleStatusFilter(s)}
                            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                                selectedStatus === s
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                            }`}
                        >
                            {s === '' ? (isRtl ? 'الكل' : 'All') : s === 'draft' ? (isRtl ? 'مسودة' : 'Draft') : (isRtl ? 'مفوتر ومعتمد' : 'Billed')}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="ms-auto flex gap-2">
                    <Input
                        placeholder={isRtl ? 'بحث برقم المستخلص أو المشروع...' : 'Search by claim # or project...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-8 text-xs w-60"
                    />
                    <Button type="submit" variant="secondary" size="sm">
                        {isRtl ? 'بحث' : 'Search'}
                    </Button>
                </form>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-xs font-semibold uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                            <tr>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'رقم المستخلص' : 'Claim #'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'المشروع' : 'Project'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'العميل' : 'Customer'}</th>
                                <th className="px-6 py-3.5 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                <th className="px-6 py-3.5 text-end font-mono">{isRtl ? 'الأعمال المنجزة' : 'Work Certified'}</th>
                                <th className="px-6 py-3.5 text-end font-mono text-amber-600">{isRtl ? 'المحتجز (5%)' : 'Retention'}</th>
                                <th className="px-6 py-3.5 text-end font-mono">{isRtl ? 'المستحق الصافي' : 'Net Total'}</th>
                                <th className="px-6 py-3.5 text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="px-6 py-3.5 text-end">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {claims.data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                                        <HardHat className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                                        {isRtl ? 'لا توجد مستخلصات مقاولات مسجلة' : 'No contracting claims found'}
                                    </td>
                                </tr>
                            ) : (
                                claims.data.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                            {claim.claim_number}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                                            {claim.project?.name}
                                        </td>
                                        <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300">
                                            {isRtl && claim.customer?.name_ar ? claim.customer.name_ar : claim.customer?.name}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-neutral-500">
                                            {claim.claim_date}
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono text-neutral-900 dark:text-neutral-100">
                                            {Number(claim.current_work_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono text-amber-600 font-medium">
                                            {Number(claim.retention_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {Number(claim.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadge(claim.status)}`}>
                                                {claim.status}
                                            </span>
                                            {claim.invoice && (
                                                <div className="text-[10px] font-mono text-neutral-400 mt-1">
                                                    #{claim.invoice.invoice_number}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-end">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button asChild variant="ghost" size="sm" className="gap-1 text-neutral-600 hover:text-neutral-900">
                                                    <Link href={`/contracting/claims/${claim.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                        <span>{isRtl ? 'عرض والمطابقة' : 'View & Bill'}</span>
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-900">
                                                    <Link href={`/contracting/claims/${claim.id}/print`} title={isRtl ? 'طباعة شهادة المستخلص' : 'Print Certificate'}>
                                                        <Printer className="h-3.5 w-3.5" />
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
            </div>
        </div>
    );
}
