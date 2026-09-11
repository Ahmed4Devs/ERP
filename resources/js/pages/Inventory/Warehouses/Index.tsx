import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Plus, Warehouse as WarehouseIcon, MapPin, Building2, Layers, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Branch {
    id: string;
    code: string;
    name: string;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
    name_ar?: string;
    address?: string;
    is_default: boolean;
    is_active: boolean;
    locations_count?: number;
    total_value?: string;
    branch?: Branch;
}

interface Props {
    warehouses: Warehouse[];
    branches: Branch[];
}

export default function WarehousesIndex({ warehouses, branches }: Props) {
    const { t, isRtl } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

    const { data, setData, post, put, processing, reset, errors } = useForm({
        code: '',
        name: '',
        name_ar: '',
        branch_id: branches[0]?.id || '',
        address: '',
        is_default: false,
        is_active: true,
    });

    const openCreateModal = () => {
        setEditingWarehouse(null);
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (wh: Warehouse) => {
        setEditingWarehouse(wh);
        setData({
            code: wh.code,
            name: wh.name,
            name_ar: wh.name_ar || '',
            branch_id: wh.branch?.id || '',
            address: wh.address || '',
            is_default: wh.is_default,
            is_active: wh.is_active,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingWarehouse) {
            put(`/inventory/warehouses/${editingWarehouse.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        } else {
            post('/inventory/warehouses', {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                },
            });
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Head title={t('inventory.warehousesTitle')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {t('inventory.warehousesTitle')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        {t('inventory.warehousesSubtitle')}
                    </p>
                </div>
                <Button onClick={openCreateModal} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="h-4 w-4" />
                    <span>{t('inventory.newWarehouse')}</span>
                </Button>
            </div>

            {/* Warehouses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {warehouses.map((wh) => (
                    <div
                        key={wh.id}
                        className="rounded-xl border border-neutral-200/80 bg-white p-6 shadow-xs flex flex-col justify-between dark:border-neutral-800 dark:bg-neutral-900"
                    >
                        <div>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                        <WarehouseIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-base">
                                            {isRtl && wh.name_ar ? wh.name_ar : wh.name}
                                        </h3>
                                        <span className="font-mono text-xs text-neutral-500">{wh.code}</span>
                                    </div>
                                </div>
                                {wh.is_default && (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Default</span>
                                    </span>
                                )}
                            </div>

                            {wh.address && (
                                <p className="text-xs text-neutral-500 mt-4 flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                    <span>{wh.address}</span>
                                </p>
                            )}

                            {wh.branch && (
                                <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                                    <span>{wh.branch.name} ({wh.branch.code})</span>
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <div>
                                    <span className="text-xs text-neutral-400">{t('inventory.locationsCount')}</span>
                                    <p className="text-sm font-semibold font-mono text-neutral-800 dark:text-neutral-200">
                                        {wh.locations_count || 1}
                                    </p>
                                </div>
                                <div className="text-end">
                                    <span className="text-xs text-neutral-400">{t('inventory.totalValue')}</span>
                                    <p className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                        {Number(wh.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => openEditModal(wh)}>
                                {t('common.edit')}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            {editingWarehouse ? t('inventory.warehousesTitle') : t('inventory.newWarehouse')}
                        </h2>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <Label htmlFor="wh_code">{t('inventory.warehouseCode')} *</Label>
                                <Input
                                    id="wh_code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    placeholder="e.g. WH-RUH-01"
                                    className="font-mono mt-1"
                                    required
                                />
                                {errors.code && <p className="text-xs text-rose-500 mt-1">{errors.code}</p>}
                            </div>

                            <div>
                                <Label htmlFor="wh_name">{t('inventory.warehouseName')} *</Label>
                                <Input
                                    id="wh_name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Riyadh Central Warehouse"
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="wh_name_ar">{t('inventory.warehouseNameAr')}</Label>
                                <Input
                                    id="wh_name_ar"
                                    value={data.name_ar}
                                    onChange={(e) => setData('name_ar', e.target.value)}
                                    placeholder="مستودع الرياض الرئيسي"
                                    className="mt-1"
                                    dir="rtl"
                                />
                            </div>

                            <div>
                                <Label htmlFor="wh_branch">{t('inventory.branch')}</Label>
                                <select
                                    id="wh_branch"
                                    value={data.branch_id}
                                    onChange={(e) => setData('branch_id', e.target.value)}
                                    className="w-full mt-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
                                >
                                    <option value="">None / Company Headquarters</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="wh_address">{t('inventory.address')}</Label>
                                <Input
                                    id="wh_address"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Industrial Area, Riyadh"
                                    className="mt-1"
                                />
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    id="wh_is_default"
                                    type="checkbox"
                                    checked={data.is_default}
                                    onChange={(e) => setData('is_default', e.target.checked)}
                                    className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <Label htmlFor="wh_is_default" className="text-sm cursor-pointer">
                                    {t('inventory.isDefault')}
                                </Label>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {t('common.save')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
