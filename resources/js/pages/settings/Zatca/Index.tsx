import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { 
    ShieldCheck, 
    Key, 
    Send, 
    CheckCircle2, 
    AlertCircle, 
    FileCode, 
    RefreshCw, 
    Server, 
    Hash, 
    Clock, 
    Check, 
    Download,
    Eye,
    Layers,
    Sliders,
    Zap,
    FileText,
    Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

interface ZatcaConfig {
    id: string;
    environment: 'sandbox' | 'simulation' | 'production';
    simulation_mode: boolean;
    vat_number: string;
    egs_uuid: string;
    egs_custom_id: string;
    branch_name?: string;
    organization_name?: string;
    organization_unit_name?: string;
    status: 'not_configured' | 'csr_generated' | 'compliance_passed' | 'production_ready';
    last_invoice_hash: string;
    invoice_counter: number;
    compliance_csid?: string;
    production_csid?: string;
    csr?: string;
}

interface ServiceInvoice {
    id: string;
    invoice_number: string;
    date: string;
    total: string;
    zatca_status: string;
    zatca_invoice_type: string;
    zatca_submitted_at?: string;
}

interface ZatcaLog {
    id: string;
    endpoint: string;
    action: string;
    status_code: number;
    is_success: boolean;
    message?: string;
    created_at: string;
}

interface Props {
    config: ZatcaConfig;
    metrics: {
        cleared_invoices_count: number;
        reported_invoices_count: number;
        pending_invoices_count: number;
        rejected_invoices_count: number;
    };
    recentInvoices: ServiceInvoice[];
    logs: ZatcaLog[];
}

export default function ZatcaIndex({ config, metrics, recentInvoices, logs }: Props) {
    const { t, isRtl } = useTranslation();
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    // Config form
    const [form, setForm] = useState({
        environment: config.environment,
        simulation_mode: config.simulation_mode,
        vat_number: config.vat_number,
        branch_name: config.branch_name || '',
        organization_name: config.organization_name || '',
        egs_custom_id: config.egs_custom_id || '',
    });

    const handleConfigSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.put('/settings/zatca/config', form, {
            onFinish: () => setLoading(false),
        });
    };

    const handleGenerateCsr = () => {
        if (confirm(t('zatca.confirmCsr', 'هل ترغب في إعادة توليد مفاتيح التشفير ECDSA secp256k1 وملف CSR؟'))) {
            setLoading(true);
            router.post('/settings/zatca/csr', {}, {
                onFinish: () => setLoading(false),
            });
        }
    };

    const handleRequestCsid = () => {
        setLoading(true);
        router.post('/settings/zatca/csid', { otp }, {
            onSuccess: () => {
                setOtpModalOpen(false);
                setOtp('');
            },
            onFinish: () => setLoading(false),
        });
    };

    const handleRunCompliance = () => {
        setLoading(true);
        router.post('/settings/zatca/compliance', {}, {
            onFinish: () => setLoading(false),
        });
    };

    const handleTransmit = (invoiceId: string, type: 'standard' | 'simplified') => {
        setLoading(true);
        router.post(`/invoices/${invoiceId}/zatca/transmit`, { type }, {
            onFinish: () => setLoading(false),
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'production_ready':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t('zatca.statusProd', 'جاهز للربط الحي (Production Ready)')}</Badge>;
            case 'compliance_passed':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t('zatca.statusComp', 'اجتاز فحص الامتثال')}</Badge>;
            case 'csr_generated':
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{t('zatca.statusCsr', 'تم توليد المفاتيح والـ CSR')}</Badge>;
            default:
                return <Badge variant="secondary">{t('zatca.statusNotConfigured', 'غير مهيأ بعد')}</Badge>;
        }
    };

    const getInvoiceStatusBadge = (status: string) => {
        switch (status) {
            case 'cleared':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{t('zatca.cleared', 'معتمدة ومختومة (Cleared)')}</Badge>;
            case 'reported':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{t('zatca.reported', 'تم الإبلاغ (Reported)')}</Badge>;
            case 'rejected':
                return <Badge variant="destructive">{t('zatca.rejected', 'مرفوضة')}</Badge>;
            default:
                return <Badge variant="secondary">{t('zatca.notSubmitted', 'لم تُرسل بعد')}</Badge>;
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <Head title={t('zatca.pageTitle', 'منظومة الفوترة الإلكترونية - الربط المباشر مع زاتكا (المرحلة الثانية)')} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <ShieldCheck className="h-7 w-7 text-emerald-500" />
                        {t('zatca.title', 'الربط المباشر مع منصة فاتورة (زاتكا المرحلة الثانية - ZATCA Phase 2)')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t('zatca.subtitle', 'إصدار وتوقيع فواتير UBL 2.1 XML تشفيرياً، وربط الاعتماد B2B والإبلاغ B2C مع التتبع التسلسلي')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusBadge(config.status)}
                    <Badge variant="outline" className="font-mono text-xs">
                        {config.environment.toUpperCase()} {config.simulation_mode ? '(محاكاة)' : '(حي)'}
                    </Badge>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('zatca.metricCleared', 'فواتير B2B معتمدة (Clearance)')}</span>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-500 mt-2 font-mono">
                        {metrics.cleared_invoices_count}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {t('zatca.clearedSuccessDesc', 'تم ختمها واعتمادها لحظياً قبل التسليم')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('zatca.metricReported', 'فواتير B2C مبلّغ عنها (Reporting)')}</span>
                        <Zap className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-blue-500 mt-2 font-mono">
                        {metrics.reported_invoices_count}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {t('zatca.reportedSuccessDesc', 'تم إرسالها ضمن مهلة 24 ساعة')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('zatca.metricPending', 'فواتير بانتظار الإرسال')}</span>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mt-2 font-mono">
                        {metrics.pending_invoices_count}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {t('zatca.pendingAction', 'تنتظر التوقيع والإرسال للهيئة')}
                    </div>
                </div>

                <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{t('zatca.metricRejected', 'حالات الرفض')}</span>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="text-2xl font-bold text-destructive mt-2 font-mono">
                        {metrics.rejected_invoices_count}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {t('zatca.rejectedAction', 'أخطاء التحقق وقواعد العمل')}
                    </div>
                </div>
            </div>

            {/* Onboarding & Workflow Wizard */}
            <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Server className="h-5 w-5 text-primary" />
                        {t('zatca.onboardingTitle', 'خطوات التأهيل والربط المباشر لحل الفوترة (EGS Onboarding)')}
                    </h2>
                    <span className="text-xs text-muted-foreground font-mono">
                        EGS UUID: {config.egs_uuid}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Step 1: CSR */}
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">1. {t('zatca.step1', 'التشفير وطلب الشهادة')}</span>
                            {config.csr && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('zatca.step1Desc', 'توليد زوج مفاتيح التشفير اللامركزي ECC secp256k1 وملف طلب توقيع الشهادة CSR')}
                        </p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={handleGenerateCsr}
                            disabled={loading}
                        >
                            <Key className="h-3.5 w-3.5 mr-1.5" />
                            {config.csr ? t('zatca.regenCsr', 'إعادة توليد المفاتيح والـ CSR') : t('zatca.genCsr', 'توليد المفاتيح والـ CSR')}
                        </Button>
                    </div>

                    {/* Step 2: Compliance CSID */}
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">2. {t('zatca.step2', 'شهادة الامتثال (Compliance)')}</span>
                            {config.compliance_csid && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('zatca.step2Desc', 'إرسال الـ CSR عبر رمز التحقق (OTP) الصادر من بوابة فاتورة للحصول على شهادة الفحص')}
                        </p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-xs"
                            onClick={() => setOtpModalOpen(true)}
                            disabled={loading || !config.csr}
                        >
                            <Lock className="h-3.5 w-3.5 mr-1.5" />
                            {config.compliance_csid ? t('zatca.csidReady', 'تم استلام الشهادة (تحديث)') : t('zatca.requestCsidBtn', 'طلب شهادة الامتثال (OTP)')}
                        </Button>
                    </div>

                    {/* Step 3: Production Ready */}
                    <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">3. {t('zatca.step3', 'فحص الامتثال والإنتاج')}</span>
                            {config.production_csid && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('zatca.step3Desc', 'إرسال حزمة الفواتير الاختبارية لاعتماد الامتثال والحصول على شهادة الإنتاج الحية (Production CSID)')}
                        </p>
                        <Button 
                            variant="default" 
                            size="sm" 
                            className="w-full text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleRunCompliance}
                            disabled={loading || !config.compliance_csid}
                        >
                            <Zap className="h-3.5 w-3.5 mr-1.5" />
                            {config.production_csid ? t('zatca.prodActive', 'شهادة الإنتاج مفعلة') : t('zatca.runComplianceBtn', 'إجراء فحص الامتثال والترقية')}
                        </Button>
                    </div>
                </div>

                {/* Blockchain Hash Chaining Audit Box */}
                <div className="border border-border/60 rounded-xl p-4 bg-muted/30 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                            <Hash className="h-4 w-4 text-primary" />
                            {t('zatca.chainingTitle', 'السلسلة الرقمية المشفرة للفواتير (Hash Chaining & PIH):')}
                        </div>
                        <div className="font-mono text-muted-foreground break-all">
                            PIH: {config.last_invoice_hash}
                        </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-4">
                        <div>
                            <span className="text-muted-foreground">{t('zatca.counter', 'العداد التسلسلي (ICV)')}:</span>{' '}
                            <span className="font-mono font-bold text-foreground text-sm">{config.invoice_counter}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices List with Clearance Actions */}
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden space-y-0">
                <div className="p-4 border-b border-border/60 flex items-center justify-between">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <FileCode className="h-5 w-5 text-primary" />
                        {t('zatca.recentInvoicesTitle', 'الفواتير والاعتماد المباشر مع زاتكا')}
                    </h2>
                    <Link href="/invoices">
                        <Button variant="ghost" size="sm" className="text-xs">
                            {t('zatca.viewAllInvoices', 'عرض كافة الفواتير')}
                        </Button>
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                            <tr>
                                <th className="p-3.5">{t('invoices.number', 'رقم الفاتورة')}</th>
                                <th className="p-3.5">{t('invoices.date', 'التاريخ')}</th>
                                <th className="p-3.5">{t('invoices.total', 'المبلغ الإجمالي')}</th>
                                <th className="p-3.5">{t('zatca.type', 'نوع الفاتورة')}</th>
                                <th className="p-3.5">{t('zatca.status', 'حالة زاتكا')}</th>
                                <th className="p-3.5">{t('zatca.submittedAt', 'تاريخ الاعتماد')}</th>
                                <th className="p-3.5 text-center">{t('common.actions', 'الإجراءات')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {recentInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                        {t('zatca.noInvoices', 'لا توجد فواتير مسجلة بعد.')}
                                    </td>
                                </tr>
                            ) : (
                                recentInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3.5 font-mono font-bold text-foreground">
                                            {inv.invoice_number}
                                        </td>
                                        <td className="p-3.5 font-mono text-xs">{inv.date}</td>
                                        <td className="p-3.5 font-mono font-bold">
                                            {parseFloat(inv.total).toLocaleString(undefined, { minimumFractionDigits: 2 })} SAR
                                        </td>
                                        <td className="p-3.5">
                                            <Badge variant="secondary" className="text-xs">
                                                {inv.zatca_invoice_type === 'simplified' ? t('zatca.simplified', 'مبسطة B2C') : t('zatca.standard', 'ضريبية B2B')}
                                            </Badge>
                                        </td>
                                        <td className="p-3.5">
                                            {getInvoiceStatusBadge(inv.zatca_status)}
                                        </td>
                                        <td className="p-3.5 font-mono text-xs text-muted-foreground">
                                            {inv.zatca_submitted_at ? new Date(inv.zatca_submitted_at).toLocaleString() : '-'}
                                        </td>
                                        <td className="p-3.5">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Link href={`/invoices/${inv.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>

                                                {inv.zatca_status !== 'cleared' && inv.zatca_status !== 'reported' ? (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-8 text-xs text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                                                        onClick={() => handleTransmit(inv.id, 'standard')}
                                                        disabled={loading}
                                                    >
                                                        <Send className="h-3 w-3 mr-1" />
                                                        {t('zatca.transmitClear', 'اعتماد B2B')}
                                                    </Button>
                                                ) : (
                                                    <a href={`/invoices/${inv.id}/zatca/xml`} download>
                                                        <Button variant="outline" size="sm" className="h-8 text-xs text-primary">
                                                            <Download className="h-3 w-3 mr-1" />
                                                            {t('zatca.downloadXml', 'XML')}
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Platform Settings & Environment Configuration */}
            <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-foreground border-b border-border/60 pb-3 flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-primary" />
                    {t('zatca.configTitle', 'إعدادات المنشأة والبيئة البرمجية')}
                </h2>

                <form onSubmit={handleConfigSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label>{t('zatca.environment', 'بيئة العمل (Environment)')}</Label>
                        <select
                            value={form.environment}
                            onChange={(e) => setForm(prev => ({ ...prev, environment: e.target.value as any }))}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="sandbox">{t('zatca.envSandbox', 'Sandbox (بوابة المطورين التجريبية)')}</option>
                            <option value="simulation">{t('zatca.envSimulation', 'Simulation (بيئة المحاكاة الرسمية)')}</option>
                            <option value="production">{t('zatca.envProduction', 'Production (البيئة الإنتاجية الحية)')}</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>{t('zatca.simulationMode', 'وضع المحاكاة المتقدم (Simulation Mode)')}</Label>
                        <select
                            value={form.simulation_mode ? '1' : '0'}
                            onChange={(e) => setForm(prev => ({ ...prev, simulation_mode: e.target.value === '1' }))}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                            <option value="1">{t('zatca.simOn', 'مفعل (توليد وتدقيق التشفير والاعتماد محلياً)')}</option>
                            <option value="0">{t('zatca.simOff', 'معطل (إرسال مباشر إلى خوادم هيئة زاتكا الحية)')}</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vat_number">{t('zatca.vatNumber', 'الرقم الضريبي للمنشأة (15 خانة)')} *</Label>
                        <Input
                            id="vat_number"
                            value={form.vat_number}
                            onChange={(e) => setForm(prev => ({ ...prev, vat_number: e.target.value }))}
                            className="font-mono"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="branch_name">{t('zatca.branchName', 'اسم الفرع المسجل')}</Label>
                        <Input
                            id="branch_name"
                            value={form.branch_name}
                            onChange={(e) => setForm(prev => ({ ...prev, branch_name: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="organization_name">{t('zatca.orgName', 'اسم المنشأة القانوني')}</Label>
                        <Input
                            id="organization_name"
                            value={form.organization_name}
                            onChange={(e) => setForm(prev => ({ ...prev, organization_name: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="egs_custom_id">{t('zatca.customId', 'معرف الجهاز / الكاشير (Custom ID)')}</Label>
                        <Input
                            id="egs_custom_id"
                            value={form.egs_custom_id}
                            onChange={(e) => setForm(prev => ({ ...prev, egs_custom_id: e.target.value }))}
                        />
                    </div>

                    <div className="md:col-span-2 flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {t('common.saveSettings', 'حفظ الإعدادات')}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Audit Logs */}
            <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {t('zatca.auditLogsTitle', 'سجل الاتصال والمعاملات مع بوابة زاتكا')}
                </h2>
                <div className="border border-border/60 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-right font-mono">
                        <thead className="bg-muted/40 text-muted-foreground">
                            <tr>
                                <th className="p-3">{t('zatca.logTime', 'الوقت')}</th>
                                <th className="p-3">{t('zatca.logAction', 'العملية')}</th>
                                <th className="p-3">{t('zatca.logEndpoint', 'نقطة الاتصال')}</th>
                                <th className="p-3">{t('zatca.logStatus', 'الرمز')}</th>
                                <th className="p-3">{t('zatca.logResult', 'النتيجة')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        {t('zatca.noLogs', 'لا توجد سجلات بعد.')}
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="p-3 text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</td>
                                        <td className="p-3 font-semibold text-foreground">{log.action}</td>
                                        <td className="p-3 text-muted-foreground">{log.endpoint}</td>
                                        <td className="p-3">{log.status_code}</td>
                                        <td className="p-3">
                                            {log.is_success ? (
                                                <span className="text-emerald-500 font-bold">SUCCESS</span>
                                            ) : (
                                                <span className="text-destructive font-bold">FAILED</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* OTP Modal */}
            <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('zatca.otpModalTitle', 'إدخال رمز التحقق OTP')}</DialogTitle>
                        <DialogDescription>
                            {t('zatca.otpModalDesc', 'أدخل رمز التحقق المكون من 6 أرقام المستخرج من بوابة زاتكا (Fatoora Portal) لاستلام شهادة الامتثال')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="otp">{t('zatca.otpLabel', 'رمز التحقق (OTP)')}</Label>
                            <Input
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                className="font-mono text-center text-lg tracking-widest"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOtpModalOpen(false)}>
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button onClick={handleRequestCsid} disabled={loading}>
                            {t('zatca.confirmOtp', 'إرسال واستلام الشهادة')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
