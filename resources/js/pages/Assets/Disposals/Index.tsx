import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Archive, Plus, Search, Eye, Printer, CheckCircle2, Clock, TrendingUp, TrendingDown, DollarSign, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface AssetCategory {
    id: string;
    name: string;
}

interface FixedAsset {
    id: string;
    name: string;
    asset_tag: string;
    category?: AssetCategory;
}

interface Branch {
    id: string;
    name: string;
}

interface FixedAssetDisposal {
    id: string;
    disposal_number: string;
    disposal_date: string;
    disposal_type: 'sale' | 'scrap' | 'donation' | 'stolen';
    acquisition_cost: string;
    accumulated_depreciation: string;
    net_book_value: string;
    proceeds: string;
    gain_loss_amount: string;
    gain_loss_type: 'gain' | 'loss' | 'none';
    status: 'draft' | 'posted';
    buyer_name?: string;
    reason?: string;
    asset?: FixedAsset;
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
    disposals: PaginatedData<FixedAssetDisposal>;
    metrics: {
        total_disposals: number;
        total_proceeds: string | number;
        total_gain: string | number;
        total_loss: string | number;
    };
    filters: {
        status?: string;
        disposal_type?: string;
        search?: string;
    };
}

export default function DisposalsIndex({ disposals, metrics, filters }: Props) {
    const { isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [disposalType, setDisposalType] = useState(filters.disposal_type || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/assets/disposals', {
            search: search || undefined,
            status: status || undefined,
            disposal_type: disposalType || undefined,
        }, { preserveState: true, replace: true });
    };

    const typeBadge = (type: FixedAssetDisposal['disposal_type']) => {
        switch (type) {
            case 'sale':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {isRtl ? 'بيع أصل' : 'Sale'}
                    </span>
                );
            case 'scrap':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        {isRtl ? 'تخريد وشطب' : 'Scrap'}
                    </span>
                );
            case 'donation':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        {isRtl ? 'منحة / هبة' : 'Donation'}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
                        {type}
                    </span>
                );
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
            <Head title={isRtl ? 'استبعاد وتخريد وبيع الأصول الثابتة' : 'Fixed Asset Disposals & Scrap'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
                        <Archive className="h-7 w-7 text-indigo-600" />
                        {isRtl ? 'استبعاد وتخريد الأصول الثابتة' : 'Fixed Asset Disposals & Scrap'}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {isRtl
                            ? 'إدارة عمليات بيع وشطب وتخريد الأصول، عكس التكلفة التاريخية ومجمع الإهلاك، وإثبات الأرباح أو الخسائر الرأسمالية'
                            : 'Manage asset sales, scrap and write-offs with automatic GL journal entries for capital gains/losses'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm">
                        <Link href="/assets/disposals/create">
                            <Plus className="h-4 w-4" />
                            {isRtl ? 'تسجيل استبعاد أصل' : 'New Disposal'}
                        </Link>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                            {isRtl ? 'إجمالي العمليات' : 'Total Disposals'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600">
                            <Archive className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {metrics.total_disposals}
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                            {isRtl ? 'إجمالي حصيلة البيع' : 'Total Proceeds'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {parseFloat(String(metrics.total_proceeds || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-neutral-500">{isRtl ? 'ر.س' : 'SAR'}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            {isRtl ? 'أرباح رأسمالية محققة' : 'Capital Gains'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {parseFloat(String(metrics.total_gain || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-neutral-500">{isRtl ? 'ر.س' : 'SAR'}</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
                            {isRtl ? 'خسائر استبعاد وتخريد' : 'Disposal Losses'}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600">
                            <TrendingDown className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold text-rose-600 dark:text-rose-400">
                        {parseFloat(String(metrics.total_loss || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-neutral-500">{isRtl ? 'ر.س' : 'SAR'}</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <form onSubmit={handleSearch} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className={`absolute top-2.5 ${isRtl ? 'right-3' : 'left-3'} h-4 w-4 text-neutral-400`} />
                    <Input
                        type="text"
                        placeholder={isRtl ? 'بحث برقم المعاملة أو اسم الأصل أو الرقم التعريفي...' : 'Search disposal # or asset...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`${isRtl ? 'pr-9' : 'pl-9'} text-sm`}
                    />
                </div>
                <select
                    value={disposalType}
                    onChange={(e) => setDisposalType(e.target.value)}
                    className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100"
                >
                    <option value="">{isRtl ? 'جميع أنواع الاستبعاد' : 'All Types'}</option>
                    <option value="sale">{isRtl ? 'بيع' : 'Sale'}</option>
                    <option value="scrap">{isRtl ? 'تخريد وشطب' : 'Scrap'}</option>
                    <option value="donation">{isRtl ? 'هبة / منحة' : 'Donation'}</option>
                </select>
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
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'رقم الاستبعاد' : 'Disposal #'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'الأصل الثابت' : 'Asset'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'التاريخ' : 'Date'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'النوع' : 'Type'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'التكلفة التاريخية' : 'Acquisition Cost'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'مجمع الإهلاك' : 'Acc. Depr'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'القيمة الدفترية (NBV)' : 'NBV'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'حصيلة البيع' : 'Proceeds'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'الربح / الخسارة' : 'Gain / Loss'}</th>
                                <th className="py-3.5 px-4 text-start">{isRtl ? 'الحالة' : 'Status'}</th>
                                <th className="py-3.5 px-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {disposals.data.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-12 text-center text-neutral-400">
                                        <Archive className="h-10 w-10 mx-auto text-neutral-300 dark:text-neutral-700 mb-2" />
                                        {isRtl ? 'لا توجد سجلات استبعاد أصول' : 'No asset disposal records found'}
                                    </td>
                                </tr>
                            ) : (
                                disposals.data.map((d) => (
                                    <tr key={d.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                                        <td className="py-3.5 px-4 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                                            <Link href={`/assets/disposals/${d.id}`} className="hover:underline">
                                                {d.disposal_number}
                                            </Link>
                                        </td>
                                        <td className="py-3.5 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                                            <div>{d.asset?.name || '—'}</div>
                                            <div className="text-xs font-mono text-neutral-400">{d.asset?.asset_tag}</div>
                                        </td>
                                        <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-400">
                                            {d.disposal_date}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {typeBadge(d.disposal_type)}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                                            {parseFloat(d.acquisition_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-neutral-700 dark:text-neutral-300">
                                            {parseFloat(d.accumulated_depreciation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                                            {parseFloat(d.net_book_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-blue-600 dark:text-blue-400">
                                            {parseFloat(d.proceeds).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {d.gain_loss_type === 'gain' && (
                                                <span className="font-mono text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                    <TrendingUp className="h-3.5 w-3.5" />
                                                    +{parseFloat(d.gain_loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            )}
                                            {d.gain_loss_type === 'loss' && (
                                                <span className="font-mono text-xs font-bold text-rose-600 flex items-center gap-1">
                                                    <TrendingDown className="h-3.5 w-3.5" />
                                                    -{parseFloat(d.gain_loss_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            )}
                                            {d.gain_loss_type === 'none' && (
                                                <span className="font-mono text-xs text-neutral-400">0.00</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {d.status === 'posted' ? (
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
                                                    <Link href={`/assets/disposals/${d.id}`} title={isRtl ? 'عرض' : 'View'}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Link href={`/assets/disposals/${d.id}/print`} title={isRtl ? 'طباعة' : 'Print'}>
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

                {/* Pagination */}
                {disposals.last_page > 1 && (
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-sm">
                        <span className="text-neutral-500">
                            {isRtl ? `الصفحة ${disposals.current_page} من ${disposals.last_page}` : `Page ${disposals.current_page} of ${disposals.last_page}`}
                        </span>
                        <div className="flex items-center gap-2">
                            {disposals.current_page > 1 && (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/assets/disposals?page=${disposals.current_page - 1}&search=${search}&status=${status}&disposal_type=${disposalType}`}>
                                        {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                                        {isRtl ? 'السابق' : 'Previous'}
                                    </Link>
                                </Button>
                            )}
                            {disposals.current_page < disposals.last_page && (
                                <Button asChild variant="outline" size="sm">
                                    <Link href={`/assets/disposals?page=${disposals.current_page + 1}&search=${search}&status=${status}&disposal_type=${disposalType}`}>
                                        {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
