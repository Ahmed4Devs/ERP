import { Head, Link } from '@inertiajs/react';
import { Plus, Eye, Receipt, Layers, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface LandedCost {
    id: string;
    voucher_number: string;
    date: string;
    status: 'draft' | 'posted' | 'cancelled';
    allocation_method: 'by_value' | 'by_quantity';
    total_charges: string;
    receipts: Array<{ id: string; receipt_number: string }>;
    journal_entry_id?: string;
}

interface PaginatedData<T> {
    data: T[];
    total: number;
    current_page: number;
    last_page: number;
}

interface Props {
    landedCosts: PaginatedData<LandedCost>;
}

export default function LandedCostsIndex({ landedCosts }: Props) {
    const { t, isRtl } = useTranslation();

    const getStatusBadge = (status: LandedCost['status']) => {
        switch (status) {
            case 'posted':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        {t('landedCost.status.posted', 'مرحّل')}
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                        <AlertCircle className="w-3 h-3" />
                        {t('landedCost.status.cancelled', 'ملغي')}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3 h-3" />
                        {t('landedCost.status.draft', 'مسودة')}
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('nav.landedCosts', 'تكاليف الاستيراد الإضافية'), href: '/inventory/landed-costs' }]}>
            <Head title={t('nav.landedCosts', 'تكاليف الاستيراد الإضافية')} />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500/20 backdrop-blur-sm rounded-xl border border-indigo-400/30">
                                <Layers className="w-6 h-6 text-indigo-300" />
                            </div>
                            <h1 className="text-2xl font-bold">
                                {t('landedCost.title', 'تكاليف الاستيراد وتوزيع المصاريف (Landed Costs)')}
                            </h1>
                        </div>
                        <p className="mt-2 text-indigo-200/80 text-sm max-w-2xl">
                            {t('landedCost.subtitle', 'توزيع مصاريف الجمارك والشحن والتأمين والتخليص على سندات استلام البضائع وتعديل تكلفة المخزون آلياً')}
                        </p>
                    </div>
                    <Link href="/inventory/landed-costs/create">
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-600/30">
                            <Plus className="w-4 h-4" />
                            {t('landedCost.createVoucher', 'سند تكاليف إضافية جديد')}
                        </Button>
                    </Link>
                </div>

                {/* Table Card */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                                <tr>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('landedCost.voucherNumber', 'رقم السند')}</th>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('common.date', 'التاريخ')}</th>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('landedCost.method', 'طريقة التوزيع')}</th>
                                    <th className="py-3.5 px-4 text-start font-semibold">{t('landedCost.receiptsCount', 'أذون الاستلام المربوطة')}</th>
                                    <th className="py-3.5 px-4 text-end font-semibold">{t('landedCost.totalCharges', 'إجمالي المصاريف')}</th>
                                    <th className="py-3.5 px-4 text-center font-semibold">{t('common.status', 'الحالة')}</th>
                                    <th className="py-3.5 px-4 text-center font-semibold">{t('common.actions', 'الإجراءات')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {landedCosts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-muted-foreground">
                                            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p className="text-base font-medium">{t('landedCost.noRecords', 'لا توجد سندات تكاليف إضافية مسجلة')}</p>
                                            <p className="text-xs mt-1">{t('landedCost.noRecordsHint', 'قم بإنشاء سند جديد لتوزيع تكاليف الشحن والجمارك على شحناتك')}</p>
                                        </td>
                                    </tr>
                                ) : (
                                    landedCosts.data.map((voucher) => (
                                        <tr key={voucher.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                                                {voucher.voucher_number}
                                            </td>
                                            <td className="py-3.5 px-4 text-muted-foreground">{voucher.date}</td>
                                            <td className="py-3.5 px-4">
                                                <span className="text-xs font-medium px-2 py-1 rounded bg-secondary text-secondary-foreground">
                                                    {voucher.allocation_method === 'by_quantity' ? t('landedCost.byQty', 'حسب الكمية') : t('landedCost.byVal', 'حسب القيمة')}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {voucher.receipts.map((rcpt) => (
                                                        <span key={rcpt.id} className="text-xs px-2 py-0.5 rounded bg-muted font-mono">
                                                            {rcpt.receipt_number}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-end font-mono font-bold text-foreground">
                                                {Number(voucher.total_charges).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {getStatusBadge(voucher.status)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <Link href={`/inventory/landed-costs/${voucher.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
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
