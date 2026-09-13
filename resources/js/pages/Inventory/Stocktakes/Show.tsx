import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Save, Warehouse as WarehouseIcon, Search, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface Props {
    session: {
        id: string;
        session_number: string;
        date: string;
        status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
        count_type: 'full' | 'selective';
        notes?: string;
        completed_at?: string;
        warehouse?: { name: string; code: string };
        createdBy?: { name: string };
        stockAdjustment?: {
            id: string;
            adjustment_number: string;
        };
        lines: Array<{
            id: string;
            product_id: string;
            book_quantity: string;
            counted_quantity: string;
            variance_quantity: string;
            unit_cost: string;
            variance_amount: string;
            notes?: string;
            product?: {
                name: string;
                sku: string;
                barcode?: string;
                category?: { name: string };
            };
        }>;
    };
}

export default function StocktakesShow({ session }: Props) {
    const { t, isRtl } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    const [searchTerm, setSearchTerm] = useState('');
    const [counts, setCounts] = useState<{ [lineId: string]: string }>(() => {
        const map: { [key: string]: string } = {};
        session.lines.forEach((l) => {
            map[l.id] = String(Number(l.counted_quantity));
        });
        return map;
    });

    const isEditable = session.status !== 'completed' && session.status !== 'cancelled';

    const handleCountChange = (lineId: string, val: string) => {
        setCounts((prev) => ({ ...prev, [lineId]: val }));
    };

    const saveCountsForm = useForm({});
    const finalizeForm = useForm({});

    const handleSaveCounts = () => {
        const payload = Object.entries(counts).map(([lineId, qty]) => ({
            line_id: lineId,
            counted_quantity: parseFloat(qty) || 0,
        }));

        router.post(`/inventory/stocktakes/${session.id}/counts`, { counts: payload }, {
            preserveScroll: true,
        });
    };

    const handleFinalize = () => {
        if (confirm(t('stocktake.confirmFinalize', 'هل أنت متأكد من إنهاء جلسة الجرد واعتماد الفروقات؟ سيتم توليد سند تسوية مخزنية وقيد تسوية الفروقات تلقائياً.'))) {
            finalizeForm.post(`/inventory/stocktakes/${session.id}/finalize`);
        }
    };

    const filteredLines = session.lines.filter((l) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            l.product?.name.toLowerCase().includes(term) ||
            l.product?.sku.toLowerCase().includes(term) ||
            (l.product?.barcode && l.product.barcode.toLowerCase().includes(term))
        );
    });

    // Compute stats
    const totalLines = session.lines.length;
    const linesWithVariance = session.lines.filter((l) => Math.abs(Number(l.variance_quantity)) > 0.0001).length;
    const totalVarianceAmount = session.lines.reduce((sum, l) => sum + Number(l.variance_amount), 0);

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.stocktakes', 'الجرد الفعلي للمخزون'), href: '/inventory/stocktakes' },
            { title: session.session_number, href: `/inventory/stocktakes/${session.id}` }
        ]}>
            <Head title={`جلسة جرد ${session.session_number}`} />

            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header Card */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <Link href="/inventory/stocktakes">
                            <Button variant="ghost" size="icon">
                                <BackIcon className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold font-mono text-foreground">
                                    {session.session_number}
                                </h1>
                                {session.status === 'completed' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {t('stocktake.status.completed', 'مكتمل ومسوّى')}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400">
                                        <ClipboardCheck className="w-3 h-3" />
                                        {t('stocktake.status.inProgress', 'جاري الجرد والفحص')}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <WarehouseIcon className="w-3.5 h-3.5" />
                                {session.warehouse?.name} ({session.warehouse?.code}) • {t('common.date', 'التاريخ')}: {session.date}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isEditable && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleSaveCounts}
                                    className="gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {t('stocktake.saveCounts', 'حفظ الكميات المدخلة')}
                                </Button>
                                <Button
                                    onClick={handleFinalize}
                                    disabled={finalizeForm.processing}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-sm"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    {finalizeForm.processing ? t('common.processing', 'جاري الترحيل...') : t('stocktake.finalizeAndAdjust', 'اعتماد وتوليد التسوية')}
                                </Button>
                            </>
                        )}
                        {session.stockAdjustment && (
                            <Link href={`/inventory/adjustments`}>
                                <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                                    {t('stocktake.viewAdjustment', 'عرض سند التسوية')}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('stocktake.totalCountedItems', 'إجمالي الأصناف المشمولة')}</p>
                        <p className="text-2xl font-bold font-mono text-foreground mt-1">{totalLines}</p>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('stocktake.itemsWithVariance', 'أصناف بها فروقات (زيادة/عجز)')}</p>
                        <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-2">
                            {linesWithVariance}
                            {linesWithVariance > 0 && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                        </p>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('stocktake.netVarianceValue', 'صافي قيمة فروقات الجرد')}</p>
                        <p className={`text-2xl font-bold font-mono mt-1 ${totalVarianceAmount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {totalVarianceAmount >= 0 ? '+' : ''}{totalVarianceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                        </p>
                    </div>
                </div>

                {/* Count Table Card */}
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="relative w-full sm:w-80">
                            <Search className="w-4 h-4 absolute top-3 start-3 text-muted-foreground" />
                            <Input
                                placeholder={t('stocktake.searchPlaceholder', 'بحث باسم الصنف أو الباركود أو الـ SKU...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="ps-9 h-10 text-xs"
                            />
                        </div>
                        {isEditable && (
                            <p className="text-xs text-muted-foreground">
                                {t('stocktake.tip', '💡 اكتب الكمية الفعلية المجرودة لكل صنف ثم اضغط حفظ أو اعتماد.')}
                            </p>
                        )}
                    </div>

                    <div className="overflow-x-auto border border-border rounded-lg">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                                <tr>
                                    <th className="py-3 px-4 text-start font-semibold">{t('product.name', 'اسم الصنف والبيانات')}</th>
                                    <th className="py-3 px-4 text-end font-semibold">{t('stocktake.bookQty', 'الرصيد الدفتري')}</th>
                                    <th className="py-3 px-4 text-end font-semibold w-40">{t('stocktake.countedQty', 'الكمية الفعلية (المجرودة)')}</th>
                                    <th className="py-3 px-4 text-end font-semibold">{t('stocktake.varianceQty', 'فرق الكمية')}</th>
                                    <th className="py-3 px-4 text-end font-semibold">{t('stocktake.unitCost', 'سعر الوحدة')}</th>
                                    <th className="py-3 px-4 text-end font-semibold">{t('stocktake.varianceVal', 'قيمة الفرق')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredLines.map((line) => {
                                    const currentVal = parseFloat(counts[line.id] ?? line.counted_quantity) || 0;
                                    const bookQty = parseFloat(line.book_quantity) || 0;
                                    const liveVariance = currentVal - bookQty;
                                    const liveVarianceVal = liveVariance * (parseFloat(line.unit_cost) || 0);

                                    return (
                                        <tr key={line.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-foreground">{line.product?.name}</div>
                                                <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2">
                                                    <span>SKU: {line.product?.sku}</span>
                                                    {line.product?.barcode && <span>• Barcode: {line.product?.barcode}</span>}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-end font-mono font-medium text-foreground">
                                                {bookQty.toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-end">
                                                {isEditable ? (
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        min="0"
                                                        value={counts[line.id] ?? ''}
                                                        onChange={(e) => handleCountChange(line.id, e.target.value)}
                                                        className="h-8 text-xs font-mono font-bold text-end"
                                                    />
                                                ) : (
                                                    <span className="font-mono font-bold text-foreground">
                                                        {currentVal.toLocaleString()}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-end font-mono font-bold">
                                                {Math.abs(liveVariance) < 0.0001 ? (
                                                    <span className="text-muted-foreground">0</span>
                                                ) : liveVariance > 0 ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-0.5">
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                        +{liveVariance.toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-600 dark:text-rose-400 inline-flex items-center gap-0.5">
                                                        <ArrowDownRight className="w-3.5 h-3.5" />
                                                        {liveVariance.toLocaleString()}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-end font-mono text-muted-foreground">
                                                {Number(line.unit_cost).toFixed(2)} SAR
                                            </td>
                                            <td className="py-3 px-4 text-end font-mono font-semibold">
                                                {Math.abs(liveVarianceVal) < 0.01 ? (
                                                    <span className="text-muted-foreground">0.00 SAR</span>
                                                ) : liveVarianceVal > 0 ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400">+{liveVarianceVal.toFixed(2)} SAR</span>
                                                ) : (
                                                    <span className="text-rose-600 dark:text-rose-400">{liveVarianceVal.toFixed(2)} SAR</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
