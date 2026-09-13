import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ShieldCheck, Barcode, Warehouse as WarehouseIcon, User, Calendar, CheckCircle2, XCircle, Clock, Package, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface Product {
    id: string;
    sku: string;
    name: string;
    name_ar?: string;
    warranty_months?: number;
}

interface Warehouse {
    id: string;
    code: string;
    name: string;
}

interface Batch {
    id: string;
    batch_number: string;
    expiry_date?: string;
}

interface Customer {
    id: string;
    name: string;
    name_ar?: string;
    email?: string;
    phone?: string;
}

interface Transaction {
    id: string;
    transaction_type: string;
    transaction_date: string;
    notes?: string;
}

interface Serial {
    id: string;
    serial_number: string;
    status: 'in_stock' | 'reserved' | 'sold' | 'returned' | 'scrapped';
    unit_cost: string;
    warranty_start_date?: string;
    warranty_end_date?: string;
    warranty_notes?: string;
    notes?: string;
    created_at: string;
    product: Product;
    warehouse?: Warehouse;
    batch?: Batch;
    customer?: Customer;
    transactions: Transaction[];
}

interface Props {
    serial: Serial;
    warrantyInfo: {
        is_under_warranty: boolean;
        days_remaining?: number | null;
    };
}

export default function ShowSerial({ serial, warrantyInfo }: Props) {
    const { t, isRtl } = useTranslation();

    const getWarrantyStatusDisplay = () => {
        if (!serial.warranty_end_date) {
            return {
                title: t('serials.noWarrantyRecorded', 'لا يوجد ضمان مسجل لهذا الرقم التسلسلي'),
                badge: <span className="bg-muted text-muted-foreground px-2.5 py-1 rounded-full text-xs font-semibold">{t('serials.noWarranty', 'بدون ضمان')}</span>,
                cardClass: 'bg-muted/30 border-border',
                icon: Clock,
            };
        }

        if (warrantyInfo.is_under_warranty) {
            return {
                title: `${t('serials.warrantyActiveHeader', 'الضمان ساري المفعول')} - ${warrantyInfo.days_remaining} ${t('common.daysLeft', 'يوم متبقي')}`,
                badge: (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('serials.validWarranty', 'ضمان معتمد وساري')}
                    </span>
                ),
                cardClass: 'bg-emerald-50/60 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
                icon: CheckCircle2,
            };
        }

        return {
            title: `${t('serials.warrantyExpiredHeader', 'انتهت فترة الضمان لهذا الجهاز')} (${Math.abs(warrantyInfo.days_remaining || 0)} ${t('common.daysAgo', 'يوم مضت')})`,
            badge: (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 px-3 py-1 rounded-full text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5" />
                    {t('serials.expiredWarranty', 'ضمان منتهي')}
                </span>
            ),
            cardClass: 'bg-red-50/60 border-red-300 dark:bg-red-950/30 dark:border-red-800 text-red-900 dark:text-red-200',
            icon: XCircle,
        };
    };

    const statusDisplay = getWarrantyStatusDisplay();
    const StatusIcon = statusDisplay.icon;

    return (
        <div className="max-w-5xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <Head title={`${t('serials.serial', 'رقم تسلسلي')} ${serial.serial_number}`} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/inventory/serials">
                        <Button variant="outline" size="icon">
                            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight font-mono text-foreground flex items-center gap-2">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                {serial.serial_number}
                            </h1>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-primary/10 text-primary border border-primary/20">
                                {serial.status}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {serial.product.name_ar || serial.product.name} ({serial.product.sku})
                        </p>
                    </div>
                </div>
            </div>

            {/* Warranty Certificate Card */}
            <div className={`border rounded-xl p-5 shadow-sm space-y-4 ${statusDisplay.cardClass}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3 border-current/20">
                    <div className="flex items-center gap-2">
                        <StatusIcon className="w-6 h-6 shrink-0" />
                        <span className="font-bold text-lg">{statusDisplay.title}</span>
                    </div>
                    <div>{statusDisplay.badge}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                        <div className="text-xs opacity-75">{t('serials.warrantyStart', 'تاريخ بدء الضمان')}</div>
                        <div className="font-semibold text-base mt-0.5">{serial.warranty_start_date || '-'}</div>
                    </div>
                    <div>
                        <div className="text-xs opacity-75">{t('serials.warrantyEnd', 'تاريخ انتهاء الضمان')}</div>
                        <div className="font-semibold text-base mt-0.5">{serial.warranty_end_date || '-'}</div>
                    </div>
                    <div>
                        <div className="text-xs opacity-75">{t('serials.registeredCustomer', 'العميل المالك')}</div>
                        <div className="font-semibold text-base mt-0.5">{serial.customer?.name || t('serials.notDispatchedYet', 'لم يتم الصرف لعميل بعد')}</div>
                    </div>
                </div>

                {serial.warranty_notes && (
                    <div className="text-xs pt-2 border-t border-current/20 opacity-90">
                        <span className="font-bold">{t('serials.warrantyTerms', 'بنود الضمان')}: </span>
                        {serial.warranty_notes}
                    </div>
                )}
            </div>

            {/* Details Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product & Warehouse Info */}
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                    <h2 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
                        <Package className="w-5 h-5 text-primary" />
                        {t('serials.itemDetails', 'بيانات الصنف والموقع')}
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">{t('serials.product', 'المنتج')}</span>
                            <span className="font-medium">{serial.product.name_ar || serial.product.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">{t('serials.sku', 'رمز الصنف (SKU)')}</span>
                            <span className="font-mono font-medium">{serial.product.sku}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">{t('serials.currentLocation', 'الموقع الحالي')}</span>
                            <span className="font-medium">
                                {serial.customer ? (
                                    <span className="text-blue-600 font-semibold">{t('serials.withCustomer', 'بحوزة العميل')}: {serial.customer.name}</span>
                                ) : serial.warehouse ? (
                                    <span>{serial.warehouse.name} ({serial.warehouse.code})</span>
                                ) : (
                                    '-'
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">{t('serials.batch', 'الدفعة المرتبطة')}</span>
                            <span>
                                {serial.batch ? (
                                    <Link href={`/inventory/batches/${serial.batch.id}`} className="font-mono text-primary font-bold hover:underline">
                                        {serial.batch.batch_number}
                                    </Link>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">{t('serials.unitCost', 'تكلفة الوحدة المسجلة')}</span>
                            <span className="font-mono font-bold">{parseFloat(serial.unit_cost).toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between py-1">
                            <span className="text-muted-foreground">{t('common.createdAt', 'تاريخ التسجيل')}</span>
                            <span>{new Date(serial.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Details */}
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                    <h2 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
                        <User className="w-5 h-5 text-primary" />
                        {t('serials.ownerInfo', 'بيانات العميل / المالك')}
                    </h2>
                    {serial.customer ? (
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">{t('common.name', 'اسم العميل')}</span>
                                <span className="font-medium">{serial.customer.name_ar || serial.customer.name}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b">
                                <span className="text-muted-foreground">{t('common.phone', 'رقم الهاتف')}</span>
                                <span className="font-mono">{serial.customer.phone || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">{t('common.email', 'البريد الإلكتروني')}</span>
                                <span>{serial.customer.email || '-'}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-sm text-muted-foreground space-y-2">
                            <WarehouseIcon className="w-8 h-8 mx-auto text-muted-foreground/50" />
                            <p>{t('serials.inInventoryNoCustomer', 'هذا الجهاز ما زال في المستودع ولم يتم بيعه أو صرفه بعد')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transactions History */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b font-semibold text-base flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t('serials.transactionHistory', 'سجل دورة حياة الرقم التسلسلي (Audit Trail)')}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-start">
                        <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3 text-start">{t('serials.txDate', 'التاريخ')}</th>
                                <th className="px-4 py-3 text-start">{t('serials.txType', 'العملية')}</th>
                                <th className="px-4 py-3 text-start">{t('common.notes', 'البيان')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {serial.transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                                        {t('serials.noTransactions', 'لا توجد حركات مسجلة')}
                                    </td>
                                </tr>
                            ) : (
                                serial.transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">{tx.transaction_date}</td>
                                        <td className="px-4 py-3 font-semibold uppercase text-primary">
                                            {tx.transaction_type}
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
