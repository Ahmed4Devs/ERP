import { Head, Link } from '@inertiajs/react';
import { Plus, Eye, ClipboardCheck, Warehouse as WarehouseIcon, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface StocktakeSession {
    id: string;
    session_number: string;
    date: string;
    status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
    count_type: 'full' | 'selective';
    warehouse?: { id: string; name: string };
    createdBy?: { name: string };
    completed_at?: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    sessions: PaginatedData<StocktakeSession>;
}

export default function StocktakesIndex({ sessions }: Props) {
    const { t, isRtl } = useTranslation();

    const getStatusBadge = (status: StocktakeSession['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('stocktake.status.completed', 'مكتمل ومسوّى')}
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">
                        <PlayCircle className="w-3 h-3" />
                        {t('stocktake.status.inProgress', 'جاري الجرد')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                        <Clock className="w-3 h-3" />
                        {t('stocktake.status.draft', 'مسودة')}
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.stocktakes', 'الجرد الفعلي للمخزون'), href: '/inventory/stocktakes' }]}>
            <Head title={t('nav.stocktakes', 'الجرد الفعلي للمخزون')} />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-teal-950 p-6 rounded-2xl text-white shadow-xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-teal-500/20 backdrop-blur-sm rounded-xl border border-teal-400/30">
                                <ClipboardCheck className="w-6 h-6 text-teal-300" />
                            </div>
                            <h1 className="text-2xl font-bold">
                                {t('stocktake.title', 'جلسات الجرد الفعلي للمخزون (Physical Stocktake)')}
                            </h1>
                        </div>
                        <p className="mt-2 text-teal-200/80 text-sm max-w-2xl">
                            {t('stocktake.subtitle', 'إدارة دورات الجرد الفعلي، مسح الباركود، رصد الفروقات، وتوليد التسويات المخزنية آلياً')}
                        </p>
                    </div>
                    <Link href="/inventory/stocktakes/create">
                        <Button className="bg-teal-600 hover:bg-teal-500 text-white gap-2 shadow-lg shadow-teal-600/30">
                            <Plus className="w-4 h-4" />
                            {t('stocktake.startSession', 'بدء جلسة جرد جديدة')}
                        </Button>
                    </Link>
                </div>

                {/* Sessions Table */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                                <tr>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('stocktake.sessionNumber', 'رقم الجلسة')}</th>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('common.date', 'التاريخ')}</th>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('warehouse.title', 'المستودع')}</th>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('stocktake.type', 'نوع الجرد')}</th>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('common.createdBy', 'بواسطة')}</th>
                                    <th className="py-3.5 px-4 text-center font-semibold">{t('common.status', 'الحالة')}</th>
                                    <th className="py-3.5 px-4 text-center font-semibold">{t('common.actions', 'الإجراءات')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {sessions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                                            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-base font-medium">{t('stocktake.noSessions', 'لا توجد جلسات جرد مسجلة')}</p>
                                            <p className="text-xs mt-1">{t('stocktake.noSessionsHint', 'ابدأ جلسة جرد دورية أو مفاجئة لضبط كميات المستودع وتأكيد الأرصدة')}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    sessions.data.map((s) => (
                                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                                                {s.session_number}
                                            </td>
                                            <td className="py-3.5 px-4 text-muted-foreground">{s.date}</td>
                                            <td className="py-3.5 px-4 font-medium flex items-center gap-1.5">
                                                <WarehouseIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                                {s.warehouse?.name}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground font-medium">
                                                    {s.count_type === 'full' ? t('stocktake.fullCount', 'جرد كلي شامل') : t('stocktake.selective', 'جرد انتقائي')}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-muted-foreground text-xs">{s.createdBy?.name || '-'}</td>
                                            <td className="py-3.5 px-4 text-center">
                                                {getStatusBadge(s.status)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <Link href={`/inventory/stocktakes/${s.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-1.5 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/50">
                                                        <Eye className="w-4 h-4" />
                                                        {t('common.view', 'عرض')}
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
