import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Layers, Receipt, Calculator, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import AppLayout from '@/layouts/app-layout';

interface Props {
    landedCost: {
        id: string;
        voucher_number: string;
        date: string;
        status: 'draft' | 'posted' | 'cancelled';
        allocation_method: 'by_value' | 'by_quantity' | 'by_weight' | 'by_volume';
        customs_declaration_number?: string;
        customs_declaration_date?: string;
        port_of_entry?: string;
        bill_of_lading?: string;
        customs_broker_name?: string;
        customs_duty_amount?: string;
        customs_vat_amount?: string;
        freight_amount?: string;
        port_handling_amount?: string;
        insurance_amount?: string;
        other_charges_amount?: string;
        total_charges: string;
        notes?: string;
        createdBy?: { name: string };
        customsBroker?: { name: string };
        receipts: Array<{
            id: string;
            receipt_number: string;
            warehouse?: { name: string };
            party?: { name: string };
        }>;
        charges: Array<{
            id: string;
            cost_type: string;
            description?: string;
            amount: string;
            vendor?: { name: string };
            expenseAccount?: { code: string; name: string };
        }>;
        allocations: Array<{
            id: string;
            product?: { name: string; sku: string };
            quantity: string;
            weight_kg?: string;
            volume_cbm?: string;
            original_unit_cost: string;
            allocated_amount: string;
            customs_duty_allocated?: string;
            freight_allocated?: string;
            new_unit_cost: string;
        }>;
        journalEntry?: {
            id: string;
            entry_number: string;
            lines: Array<{
                id: string;
                account: { code: string; name: string };
                debit: string;
                credit: string;
                description?: string;
            }>;
        };
    };
}

export default function LandedCostsShow({ landedCost }: Props) {
    const { t, isRtl } = useTranslation();
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    const postForm = useForm({});

    const handlePost = () => {
        if (confirm(t('landedCost.confirmPost', 'هل أنت متأكد من ترحيل سند التكاليف الإضافية؟ سيتم إنشاء القيد وتحديث تكلفة الأصناف في المخزون.'))) {
            postForm.post(`/inventory/landed-costs/${landedCost.id}/post`);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: t('nav.landedCosts', 'تكاليف الاستيراد الإضافية'), href: '/inventory/landed-costs' },
            { title: landedCost.voucher_number, href: `/inventory/landed-costs/${landedCost.id}` }
        ]}>
            <Head title={`سند تكاليف ${landedCost.voucher_number}`} />

            <div className="p-6 space-y-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3">
                        <Link href="/inventory/landed-costs">
                            <Button variant="ghost" size="icon">
                                <BackIcon className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold font-mono text-foreground">
                                    {landedCost.voucher_number}
                                </h1>
                                {landedCost.status === 'posted' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {t('landedCost.status.posted', 'مرحّل')}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400">
                                        <AlertCircle className="w-3 h-3" />
                                        {t('landedCost.status.draft', 'مسودة')}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('common.date', 'التاريخ')}: {landedCost.date} • {t('landedCost.method', 'طريقة التوزيع')}: {landedCost.allocation_method === 'by_quantity' ? 'حسب الكمية' : 'حسب القيمة'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {landedCost.status === 'draft' && (
                            <Button
                                onClick={handlePost}
                                disabled={postForm.processing}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-sm"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {postForm.processing ? t('common.posting', 'جاري الترحيل...') : t('landedCost.postVoucher', 'ترحيل وتحديث المخزون')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Grid Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('landedCost.totalCharges', 'إجمالي المصاريف الموزعة')}</p>
                        <p className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                            {Number(landedCost.total_charges).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                        </p>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('landedCost.receiptsCount', 'أذون الاستلام المشمولة')}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {landedCost.receipts.map((r) => (
                                <span key={r.id} className="text-xs px-2 py-0.5 rounded bg-muted font-mono font-medium">
                                    {r.receipt_number} ({r.warehouse?.name})
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card border border-border p-4 rounded-xl">
                        <p className="text-xs text-muted-foreground">{t('landedCost.journalEntry', 'القيد المحاسبي')}</p>
                        <p className="text-sm font-semibold font-mono text-foreground mt-1">
                            {landedCost.journalEntry ? landedCost.journalEntry.entry_number : t('common.notPostedYet', 'لم يُرحّل بعد')}
                        </p>
                    </div>
                </div>

                {/* FASAH Saudi Customs Declaration Details */}
                {landedCost.customs_declaration_number && (
                    <div className="bg-card border border-amber-500/20 bg-amber-500/[0.02] rounded-xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                    منصة فاسح FASAH
                                </span>
                                <h2 className="font-semibold text-foreground text-sm">
                                    البيان الجمركي السعودي رقم: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{landedCost.customs_declaration_number}</span>
                                </h2>
                            </div>
                            <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full font-medium">
                                معتمد ومطابق لـ ZATCA
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                                <p className="text-muted-foreground">تاريخ البيان:</p>
                                <p className="font-semibold font-mono mt-0.5">{landedCost.customs_declaration_date || '-'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">منفذ الدخول الجمركي:</p>
                                <p className="font-semibold mt-0.5">{landedCost.port_of_entry || '-'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">بوليصة الشحن (B/L):</p>
                                <p className="font-semibold font-mono mt-0.5">{landedCost.bill_of_lading || '-'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">المخلص الجمركي:</p>
                                <p className="font-semibold mt-0.5">{landedCost.customsBroker?.name || landedCost.customs_broker_name || '-'}</p>
                            </div>
                        </div>

                        {Number(landedCost.customs_vat_amount) > 0 && (
                            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">ضريبة الواردات الجمركية 15% (المدرجة في الخانة 8 بإقرار زاتكا):</span>
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                    {Number(landedCost.customs_vat_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Charges List */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-indigo-500" />
                        {t('landedCost.chargesBreakdown', 'تفاصيل بنود المصاريف الإضافية')}
                    </h2>
                    <table className="w-full text-xs text-start">
                        <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                            <tr>
                                <th className="py-2.5 px-3 text-start">{t('landedCost.chargeType', 'نوع المصروف')}</th>
                                <th className="py-2.5 px-3 text-start">{t('common.description', 'البيان')}</th>
                                <th className="py-2.5 px-3 text-start">{t('landedCost.vendor', 'المورد / الجهة')}</th>
                                <th className="py-2.5 px-3 text-end">{t('common.amount', 'المبلغ')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {landedCost.charges.map((c) => (
                                <tr key={c.id} className="hover:bg-muted/30">
                                    <td className="py-2.5 px-3 font-medium uppercase text-indigo-600 dark:text-indigo-400">{c.cost_type}</td>
                                    <td className="py-2.5 px-3 text-muted-foreground">{c.description || '-'}</td>
                                    <td className="py-2.5 px-3">{c.vendor?.name || '-'}</td>
                                    <td className="py-2.5 px-3 text-end font-mono font-bold">
                                        {Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Line Allocations */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-500" />
                        {t('landedCost.allocatedProducts', 'توزيع التكلفة على سطور المنتجات')}
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="py-2.5 px-3 text-start">{t('product.name', 'المنتج')}</th>
                                    <th className="py-2.5 px-3 text-end">{t('common.quantity', 'الكمية')}</th>
                                    <th className="py-2.5 px-3 text-end">{t('landedCost.origCost', 'التكلفة السابقة')}</th>
                                    <th className="py-2.5 px-3 text-end">{t('landedCost.allocated', 'المصروف الموزع')}</th>
                                    <th className="py-2.5 px-3 text-end font-bold text-emerald-600 dark:text-emerald-400">
                                        {t('landedCost.newCost', 'التكلفة الجديدة للوحدة')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {landedCost.allocations.map((a) => (
                                    <tr key={a.id} className="hover:bg-muted/30">
                                        <td className="py-2.5 px-3 font-medium">
                                            {a.product?.name} <span className="text-muted-foreground font-mono">({a.product?.sku})</span>
                                        </td>
                                        <td className="py-2.5 px-3 text-end font-mono">{Number(a.quantity).toLocaleString()}</td>
                                        <td className="py-2.5 px-3 text-end font-mono">{Number(a.original_unit_cost).toFixed(2)} SAR</td>
                                        <td className="py-2.5 px-3 text-end font-mono text-indigo-600 dark:text-indigo-400">
                                            +{Number(a.allocated_amount).toFixed(2)} SAR
                                        </td>
                                        <td className="py-2.5 px-3 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {Number(a.new_unit_cost).toFixed(2)} SAR
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Journal Entry preview if posted */}
                {landedCost.journalEntry && (
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
                        <h2 className="font-semibold text-foreground flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            {t('landedCost.glEntry', 'القيد المحاسبي المولد آلياً')} ({landedCost.journalEntry.entry_number})
                        </h2>
                        <table className="w-full text-xs text-start">
                            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                                <tr>
                                    <th className="py-2 px-3 text-start">{t('account.code', 'رقم الحساب')}</th>
                                    <th className="py-2 px-3 text-start">{t('account.name', 'اسم الحساب')}</th>
                                    <th className="py-2 px-3 text-end">{t('accounting.debit', 'مدين')}</th>
                                    <th className="py-2 px-3 text-end">{t('accounting.credit', 'دائن')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-mono">
                                {landedCost.journalEntry.lines.map((l) => (
                                    <tr key={l.id}>
                                        <td className="py-2 px-3">{l.account?.code}</td>
                                        <td className="py-2 px-3">{l.account?.name}</td>
                                        <td className="py-2 px-3 text-end text-emerald-600 dark:text-emerald-400">
                                            {Number(l.debit) > 0 ? Number(l.debit).toFixed(2) : '-'}
                                        </td>
                                        <td className="py-2 px-3 text-end text-blue-600 dark:text-blue-400">
                                            {Number(l.credit) > 0 ? Number(l.credit).toFixed(2) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
