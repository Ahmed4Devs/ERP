import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Save, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Category {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
}

interface Unit {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    symbol?: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    type: string;
    subtype?: string;
}

interface Props {
    categories: Category[];
    units: Unit[];
    accounts: Account[];
}

export default function ProductCreate({ categories, units, accounts }: Props) {
    const { t, isRtl } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        sku: '',
        barcode: '',
        name: '',
        name_ar: '',
        description: '',
        type: 'storable',
        category_id: '',
        unit_id: units[0]?.id || '',
        standard_cost: '0.00',
        list_price: '0.00',
        tax_rate: '0.10',
        inventory_account_id: accounts.find(a => a.code === '1300')?.id || '',
        cogs_account_id: accounts.find(a => a.code === '5000')?.id || '',
        revenue_account_id: accounts.find(a => a.code === '4100')?.id || '',
        grni_account_id: accounts.find(a => a.code === '2020')?.id || '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/inventory/products');
    };

    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
            <Head title={t('inventory.newProduct')} />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href="/inventory/products">
                            <BackIcon className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            {t('inventory.newProduct')}
                        </h1>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            {t('inventory.productsSubtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* General Information */}
                <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col gap-5">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-indigo-600" />
                        <span>Basic Product Information</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sku">{t('inventory.sku')} *</Label>
                            <Input
                                id="sku"
                                value={data.sku}
                                onChange={(e) => setData('sku', e.target.value)}
                                placeholder="e.g. PRD-LAP-001"
                                className="font-mono mt-1.5"
                                required
                            />
                            {errors.sku && <p className="text-xs text-rose-500 mt-1">{errors.sku}</p>}
                        </div>

                        <div>
                            <Label htmlFor="barcode">{t('inventory.barcode')}</Label>
                            <Input
                                id="barcode"
                                value={data.barcode}
                                onChange={(e) => setData('barcode', e.target.value)}
                                placeholder="e.g. 628100010001"
                                className="font-mono mt-1.5"
                            />
                            {errors.barcode && <p className="text-xs text-rose-500 mt-1">{errors.barcode}</p>}
                        </div>

                        <div>
                            <Label htmlFor="name">{t('inventory.productName')} *</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Product title in English"
                                className="mt-1.5"
                                required
                            />
                            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="name_ar">{t('inventory.productNameAr')}</Label>
                            <Input
                                id="name_ar"
                                value={data.name_ar}
                                onChange={(e) => setData('name_ar', e.target.value)}
                                placeholder="اسم الصنف باللغة العربية"
                                className="mt-1.5"
                                dir="rtl"
                            />
                            {errors.name_ar && <p className="text-xs text-rose-500 mt-1">{errors.name_ar}</p>}
                        </div>

                        <div>
                            <Label htmlFor="category_id">{t('inventory.category')}</Label>
                            <select
                                id="category_id"
                                value={data.category_id}
                                onChange={(e) => setData('category_id', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">Select Category</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {isRtl && c.name_ar ? c.name_ar : c.name} ({c.code})
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && <p className="text-xs text-rose-500 mt-1">{errors.category_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="unit_id">{t('inventory.unit')} *</Label>
                            <select
                                id="unit_id"
                                value={data.unit_id}
                                onChange={(e) => setData('unit_id', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                required
                            >
                                {units.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.code} - {isRtl && u.name_ar ? u.name_ar : u.name}
                                    </option>
                                ))}
                            </select>
                            {errors.unit_id && <p className="text-xs text-rose-500 mt-1">{errors.unit_id}</p>}
                        </div>

                        <div>
                            <Label htmlFor="type">{t('inventory.type')}</Label>
                            <select
                                id="type"
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="storable">{t('inventory.storable')}</option>
                                <option value="consumable">{t('inventory.consumable')}</option>
                                <option value="service">{t('inventory.service')}</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="tax_rate">{t('inventory.taxRate')}</Label>
                            <Input
                                id="tax_rate"
                                type="number"
                                step="0.01"
                                value={data.tax_rate}
                                onChange={(e) => setData('tax_rate', e.target.value)}
                                className="font-mono mt-1.5"
                            />
                        </div>
                    </div>
                </div>

                {/* Cost & Pricing */}
                <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col gap-5">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        Costing & Valuation
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="standard_cost">{t('inventory.standardCost')} (SAR)</Label>
                            <Input
                                id="standard_cost"
                                type="number"
                                step="0.0001"
                                value={data.standard_cost}
                                onChange={(e) => setData('standard_cost', e.target.value)}
                                className="font-mono mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="list_price">{t('inventory.listPrice')} (SAR)</Label>
                            <Input
                                id="list_price"
                                type="number"
                                step="0.0001"
                                value={data.list_price}
                                onChange={(e) => setData('list_price', e.target.value)}
                                className="font-mono mt-1.5"
                            />
                        </div>
                    </div>
                </div>

                {/* General Ledger Mapping */}
                <div className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col gap-5">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        General Ledger Account Mapping
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="inventory_account_id">Inventory Control Account (1300)</Label>
                            <select
                                id="inventory_account_id"
                                value={data.inventory_account_id}
                                onChange={(e) => setData('inventory_account_id', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">Default Company Inventory Account</option>
                                {accounts.filter(a => a.type === 'asset').map(a => (
                                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="grni_account_id">GRNI Clearing Account (2020)</Label>
                            <select
                                id="grni_account_id"
                                value={data.grni_account_id}
                                onChange={(e) => setData('grni_account_id', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">Default Company GRNI Clearing Account</option>
                                {accounts.filter(a => a.type === 'liability').map(a => (
                                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="cogs_account_id">COGS Expense Account (5000)</Label>
                            <select
                                id="cogs_account_id"
                                value={data.cogs_account_id}
                                onChange={(e) => setData('cogs_account_id', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">Default Company COGS Account</option>
                                {accounts.filter(a => a.type === 'expense').map(a => (
                                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="revenue_account_id">Sales Revenue Account (4100)</Label>
                            <select
                                id="revenue_account_id"
                                value={data.revenue_account_id}
                                onChange={(e) => setData('revenue_account_id', e.target.value)}
                                className="w-full mt-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                            >
                                <option value="">Default Company Revenue Account</option>
                                {accounts.filter(a => a.type === 'revenue').map(a => (
                                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    <Button asChild variant="outline">
                        <Link href="/inventory/products">{t('common.cancel')}</Link>
                    </Button>
                    <Button type="submit" disabled={processing} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Save className="h-4 w-4" />
                        <span>{t('common.save')}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
}
