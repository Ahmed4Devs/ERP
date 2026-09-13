import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCheck, ExternalLink, Trash2, Filter, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface SystemAlert {
    id: string;
    alert_type: string;
    title: string;
    title_ar?: string;
    message: string;
    message_ar?: string;
    severity: 'info' | 'warning' | 'critical';
    action_url?: string;
    is_read: boolean;
    created_at: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    alerts: PaginatedData<SystemAlert>;
    unreadCount: number;
    filters: {
        severity?: string;
        type?: string;
    };
}

export default function AlertsIndex({ alerts, unreadCount, filters }: Props) {
    const { t, isRtl } = useTranslation();

    const handleMarkAsRead = async (alertId: string) => {
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
        await fetch(`/alerts/${alertId}/read`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken || '',
                'Accept': 'application/json',
            },
        });
        router.reload({ only: ['alerts', 'unreadCount'] });
    };

    const handleDismiss = async (alertId: string) => {
        const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
        await fetch(`/alerts/${alertId}/dismiss`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken || '',
                'Accept': 'application/json',
            },
        });
        router.reload({ only: ['alerts', 'unreadCount'] });
    };

    const handleMarkAllAsRead = () => {
        router.post('/alerts/read-all');
    };

    const handleRefresh = () => {
        router.get('/alerts');
    };

    const getSeverityBadge = (severity: SystemAlert['severity']) => {
        switch (severity) {
            case 'critical':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                        <AlertCircle className="w-3 h-3" />
                        {t('alerts.critical', 'حرج للغاية')}
                    </span>
                );
            case 'warning':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-3 h-3" />
                        {t('alerts.warning', 'تنبيه مهم')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <Info className="w-3 h-3" />
                        {t('alerts.info', 'معلومة')}
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.alerts', 'مركز التنبيهات والإشعارات'), href: '/alerts' }]}>
            <Head title={t('alerts.title', 'مركز التنبيهات الذكي')} />

            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500/20 backdrop-blur-sm rounded-xl border border-indigo-400/30">
                                <Bell className="w-6 h-6 text-indigo-300" />
                            </div>
                            <h1 className="text-2xl font-bold">
                                {t('alerts.title', 'مركز التنبيهات الذكي (Notification & Alerts Hub)')}
                            </h1>
                        </div>
                        <p className="mt-2 text-indigo-200/80 text-sm max-w-2xl">
                            {t('alerts.subtitle', 'متابعة استحقاق الشيكات، انتهاء خطابات الضمان البنكية، تنبيهات نفاد المخزون، والمستحقات الحرجة')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            {t('alerts.scanNow', 'فحص وتحديث التنبيهات')}
                        </Button>
                        {unreadCount > 0 && (
                            <Button
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 shadow-sm"
                            >
                                <CheckCheck className="w-4 h-4" />
                                {t('alerts.markAllRead', 'تعليم الكل كمقروء')} ({unreadCount})
                            </Button>
                        )}
                    </div>
                </div>

                {/* Alerts List */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden divide-y divide-border">
                    {alerts.data.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="text-base font-medium">{t('alerts.noAlerts', 'لا توجد تنبيهات نشطة حالياً')}</p>
                            <p className="text-xs mt-1">{t('alerts.allGood', 'جميع الشيكات، خطابات الضمان، ومستويات المخزون في وضع آمن وسليم')}</p>
                        </div>
                    ) : (
                        alerts.data.map((alert) => (
                            <div
                                key={alert.id}
                                className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                                    !alert.is_read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : 'hover:bg-muted/20'
                                }`}
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="mt-0.5 flex-shrink-0">
                                        {!alert.is_read && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 block" />
                                        )}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getSeverityBadge(alert.severity)}
                                            <h3 className="font-semibold text-sm text-foreground">
                                                {isRtl ? (alert.title_ar || alert.title) : alert.title}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {isRtl ? (alert.message_ar || alert.message) : alert.message}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground font-mono">
                                            {new Date(alert.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                                    {alert.action_url && (
                                        <Link href={alert.action_url}>
                                            <Button variant="outline" size="sm" className="gap-1 text-xs">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                {t('alerts.viewItem', 'معاينة')}
                                            </Button>
                                        </Link>
                                    )}
                                    {!alert.is_read && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleMarkAsRead(alert.id)}
                                            className="text-xs text-indigo-600 hover:text-indigo-700"
                                        >
                                            {t('alerts.markRead', 'مقروء')}
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDismiss(alert.id)}
                                        className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
