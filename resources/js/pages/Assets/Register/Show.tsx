import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Layers, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface DepreciationEntry {
    id: string;
    amount: string;
    prior_accumulated_depreciation: string;
    new_accumulated_depreciation: string;
    new_net_book_value: string;
    created_at: string;
    depreciation_run?: {
        run_number: string;
        period_year: number;
        period_month: number;
        date: string;
    };
}

interface FixedAsset {
    id: string;
    asset_tag: string;
    name: string;
    name_ar?: string;
    serial_number?: string;
    purchase_date: string;
    in_service_date: string;
    acquisition_cost: string;
    salvage_value: string;
    useful_life_months: number;
    accumulated_depreciation: string;
    net_book_value: string;
    status: string;
    category?: {
        name: string;
        name_ar?: string;
    };
    branch?: {
        name: string;
    };
    depreciation_entries?: DepreciationEntry[];
}

interface Props {
    asset: FixedAsset;
}

export default function ShowFixedAsset({ asset }: Props) {
    const { t, isRtl } = useTranslation();

    const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={`Asset: ${asset.asset_tag}`} />

            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/assets/register">
                        <ArrowIcon className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        <span>{t('assets.title', 'Fixed Assets')}</span>
                    </Link>
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <span>{asset.asset_tag}</span>
                        <span className="text-neutral-400 font-normal">|</span>
                        <span>{isRtl && asset.name_ar ? asset.name_ar : asset.name}</span>
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                        Category: {asset.category?.name} | In-Service: {asset.in_service_date?.substring(0, 10)}
                    </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    asset.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-800'
                }`}>
                    {asset.status.toUpperCase()}
                </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-500">{t('assets.cost', 'Acquisition Cost')}</span>
                    <p className="mt-1 text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        {parseFloat(asset.acquisition_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-500">{t('assets.salvage', 'Salvage Value')}</span>
                    <p className="mt-1 text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
                        {parseFloat(asset.salvage_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <span className="text-xs font-medium text-neutral-500">{t('assets.accumulated', 'Accumulated Depr')}</span>
                    <p className="mt-1 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                        -{parseFloat(asset.accumulated_depreciation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/30">
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">{t('assets.bookValue', 'Net Book Value')}</span>
                    <p className="mt-1 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {parseFloat(asset.net_book_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            {/* Depreciation History */}
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-indigo-600" />
                        <span>Depreciation Entries History</span>
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm rtl:text-right">
                        <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs uppercase text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
                            <tr>
                                <th className="px-4 py-3">Run #</th>
                                <th className="px-4 py-3">Period</th>
                                <th className="px-4 py-3 text-right rtl:text-left">Depreciation Amount</th>
                                <th className="px-4 py-3 text-right rtl:text-left">New Accumulated</th>
                                <th className="px-4 py-3 text-right rtl:text-left font-bold">New Net Book Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                            {!asset.depreciation_entries || asset.depreciation_entries.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-neutral-500">
                                        No depreciation entries recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                asset.depreciation_entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="px-4 py-3 font-mono font-medium">
                                            {entry.depreciation_run?.run_number || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-600 text-xs">
                                            {entry.depreciation_run?.period_year} / {String(entry.depreciation_run?.period_month).padStart(2, '0')}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono text-rose-600">
                                            {parseFloat(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono">
                                            {parseFloat(entry.new_accumulated_depreciation).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-right rtl:text-left font-mono font-bold text-indigo-600">
                                            {parseFloat(entry.new_net_book_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
