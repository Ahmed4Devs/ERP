import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Search, Layers, Edit2, Trash2, CheckCircle2, XCircle, FolderTree, Building, User, Briefcase, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';

interface UserInfo {
    id: number;
    name: string;
    email: string;
}

interface CostCenter {
    id: string;
    parent_id?: string;
    code: string;
    name: string;
    name_ar?: string;
    type: string;
    manager_id?: number;
    is_active: boolean;
    description?: string;
    journal_lines_count: number;
    parent?: { id: string; code: string; name: string };
    manager?: UserInfo;
    children?: { id: string; parent_id: string; code: string; name: string }[];
}

interface Props {
    costCenters: CostCenter[];
    users: UserInfo[];
    metrics: {
        total_centers: number;
        active_centers: number;
        parent_centers: number;
        total_journal_lines: number;
    };
    filters: {
        search?: string;
        type?: string;
    };
}

export default function CostCentersIndex({ costCenters, users, metrics, filters }: Props) {
    const { t, isRtl } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [showModal, setShowModal] = useState(false);
    const [editingCenter, setEditingCenter] = useState<CostCenter | null>(null);

    const form = useForm({
        code: '',
        name: '',
        name_ar: '',
        type: 'operational',
        parent_id: '',
        manager_id: '',
        is_active: true,
        description: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/accounting/cost-centers', {
            search: search || undefined,
            type: typeFilter || undefined,
        }, { preserveState: true, replace: true });
    };

    const openCreate = () => {
        setEditingCenter(null);
        form.reset();
        setShowModal(true);
    };

    const openEdit = (cc: CostCenter) => {
        setEditingCenter(cc);
        form.setData({
            code: cc.code,
            name: cc.name,
            name_ar: cc.name_ar || '',
            type: cc.type,
            parent_id: cc.parent_id || '',
            manager_id: cc.manager_id ? String(cc.manager_id) : '',
            is_active: cc.is_active,
            description: cc.description || '',
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCenter) {
            form.put(`/accounting/cost-centers/${editingCenter.id}`, {
                onSuccess: () => setShowModal(false),
            });
        } else {
            form.post('/accounting/cost-centers', {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const handleDelete = (id: string) => {
        if (confirm(t('common.confirmDelete', 'هل أنت متأكد من حذف مركز التكلفة هذا؟'))) {
            router.delete(`/accounting/cost-centers/${id}`);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'department': return <Building className="w-4 h-4 text-blue-500" />;
            case 'project': return <Briefcase className="w-4 h-4 text-purple-500" />;
            case 'fleet': return <Truck className="w-4 h-4 text-amber-500" />;
            default: return <Layers className="w-4 h-4 text-primary" />;
        }
    };

    return (
        <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={t('costCenters.title', 'مراكز التكلفة الهيكلية')} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Layers className="w-7 h-7 text-primary" />
                        {t('costCenters.title', 'دليل مراكز التكلفة (Cost Centers)')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('costCenters.subtitle', 'شجرة مراكز التكلفة متعددة المستويات لتوزيع وتحليل الإيرادات والمصروفات بدقة')}
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t('costCenters.newCenter', 'إضافة مركز تكلفة جديد')}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('costCenters.totalCenters', 'إجمالي مراكز التكلفة')}</div>
                    <div className="text-2xl font-bold mt-1">{metrics.total_centers}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('costCenters.activeCenters', 'مراكز نشطة')}</div>
                    <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{metrics.active_centers}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('costCenters.mainBranches', 'المراكز الرئيسية (الجذور)')}</div>
                    <div className="text-2xl font-bold mt-1">{metrics.parent_centers}</div>
                </div>
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-primary font-medium">{t('costCenters.journalLinesTotal', 'حركات القيود المرتبطة')}</div>
                    <div className="text-2xl font-bold mt-1 text-primary">{metrics.total_journal_lines}</div>
                </div>
            </div>

            {/* Filters */}
            <form onSubmit={handleSearch} className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute top-3 start-3 text-muted-foreground" />
                        <Input
                            placeholder={t('costCenters.searchPlaceholder', 'بحث بالكود أو الاسم...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ps-9 font-mono"
                        />
                    </div>
                    <div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                        >
                            <option value="">{t('costCenters.allTypes', 'جميع الأنواع والتصنيفات')}</option>
                            <option value="operational">{t('costCenters.typeOperational', 'تشغيلي')}</option>
                            <option value="department">{t('costCenters.typeDepartment', 'قسم إداري')}</option>
                            <option value="project">{t('costCenters.typeProject', 'مشروع')}</option>
                            <option value="fleet">{t('costCenters.typeFleet', 'أسطول / مركبات')}</option>
                        </select>
                    </div>
                    <div>
                        <Button type="submit" className="w-full gap-2">
                            <Search className="w-4 h-4" />
                            {t('common.filter', 'تصفية')}
                        </Button>
                    </div>
                </div>
            </form>

            {/* Table */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3 text-start">{t('costCenters.code', 'رمز المركز')}</th>
                                <th className="px-4 py-3 text-start">{t('costCenters.name', 'اسم مركز التكلفة')}</th>
                                <th className="px-4 py-3 text-start">{t('costCenters.parent', 'المركز الرئيسي (الأب)')}</th>
                                <th className="px-4 py-3 text-start">{t('costCenters.type', 'النوع')}</th>
                                <th className="px-4 py-3 text-start">{t('costCenters.manager', 'المسؤول / المدير')}</th>
                                <th className="px-4 py-3 text-center">{t('costCenters.txCount', 'القيود')}</th>
                                <th className="px-4 py-3 text-center">{t('common.status', 'الحالة')}</th>
                                <th className="px-4 py-3 text-center">{t('common.actions', 'إجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {costCenters.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                        {t('costCenters.noCenters', 'لم يتم العثور على أي مراكز تكلفة مطابقة')}
                                    </td>
                                </tr>
                            ) : (
                                costCenters.map((cc) => (
                                    <tr key={cc.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-mono font-bold text-primary">
                                            {cc.code}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold">{cc.name_ar || cc.name}</div>
                                            {cc.name_ar && <div className="text-xs text-muted-foreground">{cc.name}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                            {cc.parent ? (
                                                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-muted">
                                                    {cc.parent.code} - {cc.parent.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <FolderTree className="w-3.5 h-3.5 text-primary" />
                                                    {t('costCenters.rootCenter', 'مركز رئيسي جذر')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 capitalize text-xs">
                                                {getTypeIcon(cc.type)}
                                                <span>{cc.type}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {cc.manager ? (
                                                <div className="flex items-center gap-1 text-xs">
                                                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span>{cc.manager.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono font-semibold">
                                            {cc.journal_lines_count}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {cc.is_active ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {t('common.active', 'نشط')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                                    <XCircle className="w-3 h-3" />
                                                    {t('common.inactive', 'معطل')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openEdit(cc)} className="h-8 w-8 p-0">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(cc.id)}
                                                    disabled={cc.journal_lines_count > 0}
                                                    className="h-8 w-8 p-0 text-destructive disabled:opacity-30"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-card border rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                                <Layers className="w-5 h-5 text-primary" />
                                {editingCenter ? t('costCenters.editCenter', 'تعديل مركز التكلفة') : t('costCenters.createCenter', 'إضافة مركز تكلفة جديد')}
                            </h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>✕</Button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">{t('costCenters.code', 'رمز المركز')} <span className="text-destructive">*</span></label>
                                    <Input
                                        value={form.data.code}
                                        onChange={(e) => form.setData('code', e.target.value)}
                                        placeholder="CC-101"
                                        required
                                        className="font-mono uppercase"
                                    />
                                    {form.errors.code && <p className="text-xs text-destructive">{form.errors.code}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">{t('costCenters.type', 'النوع / التصنيف')}</label>
                                    <select
                                        value={form.data.type}
                                        onChange={(e) => form.setData('type', e.target.value)}
                                        className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                                    >
                                        <option value="operational">{t('costCenters.typeOperational', 'تشغيلي')}</option>
                                        <option value="department">{t('costCenters.typeDepartment', 'قسم إداري')}</option>
                                        <option value="project">{t('costCenters.typeProject', 'مشروع')}</option>
                                        <option value="fleet">{t('costCenters.typeFleet', 'أسطول / سيارات')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">{t('costCenters.nameAr', 'الاسم بالعربية')}</label>
                                <Input
                                    value={form.data.name_ar}
                                    onChange={(e) => form.setData('name_ar', e.target.value)}
                                    placeholder="إدارة تقنية المعلومات والمشاريع"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">{t('costCenters.nameEn', 'الاسم بالإنجليزية')} <span className="text-destructive">*</span></label>
                                <Input
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="IT & Digital Projects Department"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">{t('costCenters.parentCenter', 'المركز الأب (إن وجد)')}</label>
                                    <select
                                        value={form.data.parent_id}
                                        onChange={(e) => form.setData('parent_id', e.target.value)}
                                        className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                                    >
                                        <option value="">{t('costCenters.noParentRoot', '-- مركز رئيسي مستقل --')}</option>
                                        {costCenters
                                            .filter((c) => !editingCenter || c.id !== editingCenter.id)
                                            .map((c) => (
                                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                            ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">{t('costCenters.manager', 'المدير المسؤول')}</label>
                                    <select
                                        value={form.data.manager_id}
                                        onChange={(e) => form.setData('manager_id', e.target.value)}
                                        className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                                    >
                                        <option value="">{t('costCenters.noManager', '-- اختياري --')}</option>
                                        {users.map((u) => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">{t('common.description', 'الوصف والتفاصيل')}</label>
                                <textarea
                                    value={form.data.description}
                                    onChange={(e) => form.setData('description', e.target.value)}
                                    rows={2}
                                    className="w-full p-2.5 border rounded-md bg-background text-sm resize-none"
                                    placeholder="وصف طبيعة التكاليف المحملة على هذا المركز..."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                    {t('common.cancel', 'إلغاء')}
                                </Button>
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing ? t('common.saving', 'جاري الحفظ...') : t('common.save', 'حفظ')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
