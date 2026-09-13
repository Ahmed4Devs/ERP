import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Barcode, Calendar, Warehouse as WarehouseIcon, Package, Clock, AlertTriangle, CheckCircle2, XCircle, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
    shelf_life_days?: number;
    warranty_months?: number;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Serial {
    id: string;
    serial_number: string;
    status: string;
    warranty_end_date?: string;
}

interface Transaction {
    id: string;
    transaction_type: string;
    direction: 'in' | 'out';
    quantity: string;
    transaction_date: string;
    notes?: string;
}

interface Batch {
    id: string;
    batch_number: string;
    supplier_batch_number?: string;
    manufacture_date?: string;
    expiry_date?: string;
    received_qty: string;
    current_qty: string;
    reserved_qty: string;
    unit_cost: string;
    status: 'active' | 'expired' | 'depleted' | 'quarantined';
    notes?: string;
    created_at: string;
    product: Product;
    warehouse: Warehouse;
    serials: Serial[];
    transactions: Transaction[];
    days_until_expiry?: number;
}

interface Props {
    batch: Batch;
}

export default function ShowBatch({ batch }: Props) {
    const { t, isRtl } = useTranslation();

    const currentQty = parseFloat(batch.current_qty);
    const receivedQty = parseFloat(batch.received_qty);
    const unitCost = parseFloat(batch.unit_cost);
    const totalValuation = currentQty * unitCost;

    const getExpiryAnalysis = () => {
        if (!batch.expiry_date) {
            return {
                title: t('batches.noExpiry', 'هذا الصنف ليس له تاريخ انتهاء صلاحية محدد'),
                color: 'bg-muted text-muted-foreground',
                icon: Clock,
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exp = new Date(batch.expiry_date);
        exp.setHours(0, 0, 0, 0);

        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                title: `${t('batches.expiredSince', 'انتهت صلاحية هذه الدفعة منذ')} ${Math.abs(diffDays)} ${t('common.days', 'يوم')}`,
                subtitle: t('batches.expiredWarning', 'تحذير: لا يمكن صرف هذه الدفعة في عمليات المبيعات والتسليم!'),
                color: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300',
                icon: XCircle,
            };
        }

        if (diffDays <= 30) {
            return {
                title: `${t('batches.expiringWarning', 'تنبيه: تنتهي الصلاحية خلال')} ${diffDays} ${t('common.days', 'يوم')} (FEFO أولوية صرف)`,
                subtitle: t('batches.fefoPriority', 'يوصى بصرف هذه الدفعة أولاً وفقاً لخوارزمية FEFO لتفادي التلف'),
                color: 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300',
                icon: AlertTriangle,
            };
        }

        return {
            title: `${t('batches.validState', 'صالحة للاستخدام - متبقي')} ${diffDays} ${t('common.days', 'يوم')} ${t('batches.untilExpiry', 'حتى انتهاء الصلاحية')}`,
            subtitle: `${t('batches.expiryDate', 'تاريخ الانتهاء')}: ${batch.expiry_date}`,
            color: 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300',
            icon: CheckCircle2,
        };
    };

    const expiryInfo = getExpiryAnalysis();
    const ExpiryIcon = expiryInfo.icon;

    return (
        <div className="max-w-5xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`${t('batches.batch', 'دفعة')} ${batch.batch_number}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/inventory/batches">
                        <Button variant="outline" size="icon">
                            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight font-mono text-foreground flex items-center gap-2">
                                <Barcode className="w-6 h-6 text-primary" />
                                {batch.batch_number}
                            </h1>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-primary/10 text-primary border border-primary/20">
                                {batch.status}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {batch.product.name_ar || batch.product.name} ({batch.product.sku}) - {batch.warehouse.name}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href={`/inventory/serials/create?product_id=${batch.product.id}`}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            {t('batches.addSerials', 'ربط أرقام تسلسلية')}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Expiry Analysis Banner */}
            <div className={`border rounded-xl p-4 flex items-start gap-3 ${expiryInfo.color}`}>
                <ExpiryIcon className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                    <div className="font-semibold text-base">{expiryInfo.title}</div>
                    {expiryInfo.subtitle && <div className="text-sm opacity-90 mt-0.5">{expiryInfo.subtitle}</div>}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('batches.currentBalance', 'الرصيد المتاح')}</div>
                    <div className="text-2xl font-bold mt-1 text-primary">{currentQty.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {t('batches.receivedTotal', 'إجمالي الوارد')}: {receivedQty.toLocaleString()}
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('batches.unitCost', 'تكلفة الوحدة')}</div>
                    <div className="text-2xl font-bold mt-1">{unitCost.toFixed(2)} ر.س</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {t('batches.valuation', 'إجمالي القيمة')}: {totalValuation.toFixed(2)} ر.س
                    </div>
                </div>

                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('batches.manufactureDate', 'تاريخ الإنتاج')}</div>
                    <div className="text-lg font-bold mt-1">{batch.manufacture_date || '-'}</div>
                    {batch.product.shelf_life_days && (
                        <div className="text-xs text-muted-foreground mt-1">
                            {t('batches.shelfLife', 'الصلاحية')}: {batch.product.shelf_life_days} {t('common.days', 'يوم')}
                        </div>
                    )}
                </div>

                <div className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-muted-foreground">{t('batches.expiryDate', 'تاريخ الانتهاء')}</div>
                    <div className="text-lg font-bold mt-1 text-amber-600 dark:text-amber-400 font-mono">
                        {batch.expiry_date || t('batches.noExpiry', 'غير محدد')}
                    </div>
                    {batch.supplier_batch_number && (
                        <div className="text-xs text-muted-foreground mt-1">
                            {t('batches.supplierRef', 'دفعة المورد')}: {batch.supplier_batch_number}
                        </div>
                    )}
                </div>
            </div>

            {/* Batch Details & Serials */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Information Card */}
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                    <h2 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
                        <Package className="w-5 h-5 text-primary" />
                        {t('batches.detailsHeader', 'تفاصيل الصنف والمستودع')}
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">{t('batches.productName', 'اسم المنتج')}</span>
                            <span className="font-medium">{batch.product.name_ar || batch.product.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">{t('batches.sku', 'رمز الصنف (SKU)')}</span>
                            <span className="font-mono font-medium">{batch.product.sku}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">{t('batches.warehouse', 'المستودع')}</span>
                            <span className="font-medium">{batch.warehouse.name} ({batch.warehouse.code})</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">{t('batches.supplierBatchNumber', 'رقم دفعة المورد')}</span>
                            <span className="font-mono">{batch.supplier_batch_number || '-'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">{t('common.createdAt', 'تاريخ التسجيل')}</span>
                            <span>{new Date(batch.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                    {batch.notes && (
                        <div className="mt-4 p-3 bg-muted/40 rounded-lg text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground block mb-1">{t('common.notes', 'الملاحظات')}:</span>
                            {batch.notes}
                        </div>
                    )}
                </div>

                {/* Serials in Batch Card */}
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                        <h2 className="font-semibold text-base flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            {t('batches.serialsInBatch', 'الأرقام التسلسلية بالدفعة')}
                        </h2>
                        <span className="text-xs font-mono font-bold bg-muted px-2 py-0.5 rounded">
                            {batch.serials.length}
                        </span>
                    </div>

                    {batch.serials.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            {t('batches.noSerialsInBatch', 'لا توجد أرقام تسلسلية مرتبطة بهذه الدفعة حتى الآن')}
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {batch.serials.map((s) => (
                                <div key={s.id} className="flex items-center justify-between p-2.5 bg-muted/30 hover:bg-muted/60 rounded-lg text-sm transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Barcode className="w-4 h-4 text-muted-foreground" />
                                        <Link href={`/inventory/serials/${s.id}`} className="font-mono font-semibold text-primary hover:underline">
                                            {s.serial_number}
                                        </Link>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded bg-background border">
                                        {s.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Audit Transactions History */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b font-semibold text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t('batches.movementHistory', 'سجل حركات وتصريف الدفعة (Audit Log)')}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3 text-start">{t('batches.txDate', 'التاريخ')}</th>
                                <th className="px-4 py-3 text-start">{t('batches.txType', 'نوع الحركة')}</th>
                                <th className="px-4 py-3 text-center">{t('batches.direction', 'الاتجاه')}</th>
                                <th className="px-4 py-3 text-end">{t('batches.quantity', 'الكمية')}</th>
                                <th className="px-4 py-3 text-start">{t('common.notes', 'البيان')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {batch.transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                                        {t('batches.noTransactions', 'لا توجد حركات مسجلة')}
                                    </td>
                                </tr>
                            ) : (
                                batch.transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">{tx.transaction_date}</td>
                                        <td className="px-4 py-3 font-medium uppercase">{tx.transaction_type}</td>
                                        <td className="px-4 py-3 text-center">
                                            {tx.direction === 'in' ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                                    {t('batches.dirIn', 'وارد (+)')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                    {t('batches.dirOut', 'صادر (-)')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-end font-bold font-mono">
                                            {tx.direction === 'in' ? '+' : '-'}{parseFloat(tx.quantity).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{tx.notes || '-'}</td>
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
