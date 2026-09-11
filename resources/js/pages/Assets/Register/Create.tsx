import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Save, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface AssetCategory {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    useful_life_months: number;
}

interface Branch {
    id: string;
    code: string;
    name: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    type: string;
}

interface Props {
    categories: AssetCategory[];
    branches: Branch[];
    accounts: Account[];
}

export default function CreateFixedAsset({ categories, branches, accounts }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        asset_tag: '',
        name: '',
        name_ar: '',
        serial_number: '',
        category_id: categories[0]?.id || '',
        branch_id: branches[0]?.id || '',
        purchase_date: new Date().toISOString().split('T')[0],
        in_service_date: new Date().toISOString().split('T')[0],
        acquisition_cost: '',
        salvage_value: '0',
        useful_life_months: categories[0]?.useful_life_months || 36,
    });

    const handleCategoryChange = (catId: string) => {
        const cat = categories.find(c => c.id === catId);
        setData(d => ({
            ...d,
            category_id: catId,
            useful_life_months: cat?.useful_life_months || d.useful_life_months,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/assets/register');
    };

    const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
            <Head title={t('assets.newAsset', 'Register Fixed Asset')} />

            <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="sm">
                    <Link href="/assets/register">
                        <ArrowIcon className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        <span>{t('assets.title', 'Fixed Assets')}</span>
                    </Link>
                </Button>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                        {t('assets.newAsset', 'Register New Fixed Asset')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Capitalize new property, plant, or IT equipment and configure its straight-line depreciation profile.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {t('assets.tag', 'Asset Tag / Code')} *
                            </label>
                            <Input
                                required
                                placeholder="AST-SRV-002"
                                value={data.asset_tag}
                                onChange={(e) => setData('asset_tag', e.target.value)}
                            />
                            {errors.asset_tag && <p className="text-xs text-rose-500 mt-1">{errors.asset_tag}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                {t('assets.category', 'Asset Category')} *
                            </label>
                            <select
                                required
                                value={data.category_id}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                            >
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {isRtl && c.name_ar ? c.name_ar : c.name} ({c.code})
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-xs text-rose-500 mt-1">{errors.category_id}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Asset Name (EN) *
                            </label>
                            <Input
                                required
                                placeholder="Dell PowerEdge Server"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                            />
                            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Asset Name (AR)
                            </label>
                            <Input
                                placeholder="خادم مركزي ديل باور إيدج"
                                value={data.name_ar}
                                onChange={(e) => setData('name_ar', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Serial Number
                            </label>
                            <Input
                                placeholder="S/N: 99882233"
                                value={data.serial_number}
                                onChange={(e) => setData('serial_number', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Branch Location
                            </label>
                            <select
                                value={data.branch_id}
                                onChange={(e) => setData('branch_id', e.target.value)}
                                className="w-full h-9 rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                            >
                                <option value="">None</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} ({b.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                            Valuation & Depreciation Schedule (Straight-Line)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Purchase Date *
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={data.purchase_date}
                                    onChange={(e) => setData('purchase_date', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    In-Service Date *
                                </label>
                                <Input
                                    type="date"
                                    required
                                    value={data.in_service_date}
                                    onChange={(e) => setData('in_service_date', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('assets.cost', 'Historical Cost')} *
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="25000.00"
                                    value={data.acquisition_cost}
                                    onChange={(e) => setData('acquisition_cost', e.target.value)}
                                />
                                {errors.acquisition_cost && <p className="text-xs text-rose-500 mt-1">{errors.acquisition_cost}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('assets.salvage', 'Salvage Value')}
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.salvage_value}
                                    onChange={(e) => setData('salvage_value', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    {t('assets.lifeMonths', 'Useful Life (Months)')} *
                                </label>
                                <Input
                                    type="number"
                                    required
                                    min="1"
                                    value={data.useful_life_months}
                                    onChange={(e) => setData('useful_life_months', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                        <Button asChild variant="outline">
                            <Link href="/assets/register">{t('common.cancel', 'Cancel')}</Link>
                        </Button>
                        <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Save className="h-4 w-4" />
                            <span>{processing ? t('common.loading', 'Saving...') : 'Register Asset'}</span>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
