import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    Download, 
    Upload, 
    FileSpreadsheet, 
    BookOpen, 
    Users, 
    Package, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    ArrowLeft,
    FileText,
    HelpCircle,
    Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/lib/i18n';

interface Stats {
    accounts_count: number;
    customers_count: number;
    products_count: number;
}

interface Props {
    stats: Stats;
}

export default function DataImportIndex({ stats }: Props) {
    const { t, isRtl } = useTranslation();
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;

    const [activeTab, setActiveTab] = useState<'customers' | 'accounts' | 'products'>('customers');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('type', activeTab);
        formData.append('file', selectedFile);

        router.post('/data-import/upload', formData, {
            forceFormData: true,
            onFinish: () => {
                setIsUploading(false);
                setSelectedFile(null);
            },
        });
    };

    const tabConfig = {
        customers: {
            title: isRtl ? 'العملاء والموردين' : 'Customers & Parties',
            desc: isRtl ? 'استيراد وتصدير سجلات العملاء والموردين، الأرقام الضريبية وبيانات الاتصال.' : 'Import and export parties, customer profiles, tax IDs, and contacts.',
            icon: Users,
            count: stats.customers_count,
            countLabel: isRtl ? 'عميل ومورد مسجل' : 'Registered Parties',
            columns: ['name (مطلوب)', 'name_ar', 'type (customer/vendor/both)', 'tax_id (الرقم الضريبي)', 'email', 'phone'],
        },
        accounts: {
            title: isRtl ? 'دليل الحسابات' : 'Chart of Accounts',
            desc: isRtl ? 'استيراد شجرة الحسابات المالية، الرموز المحاسبية، وتصنيف الأصول والخصوم.' : 'Import and export GL chart of accounts, codes, and subtypes.',
            icon: BookOpen,
            count: stats.accounts_count,
            countLabel: isRtl ? 'حساب مالي مسجل' : 'GL Accounts',
            columns: ['code (رمز الحساب - فريد)', 'name (اسم الحساب)', 'name_ar', 'type (asset/liability/equity/revenue/expense)', 'subtype'],
        },
        products: {
            title: isRtl ? 'الأصناف والمنتجات' : 'Products & Inventory',
            desc: isRtl ? 'استيراد كتالوج المنتجات، الأكواد SKU، الباركود، وأسعار البيع والتكلفة القياسية.' : 'Import and export products catalog, SKUs, barcodes, and standard costs.',
            icon: Package,
            count: stats.products_count,
            countLabel: isRtl ? 'صنف ومنتج مسجل' : 'Catalog Items',
            columns: ['sku (رمز الصنف)', 'name (الاسم)', 'name_ar', 'type (inventory/service)', 'barcode', 'list_price', 'standard_cost'],
        },
    };

    const currentTab = tabConfig[activeTab];

    return (
        <div className="flex flex-col gap-8 p-6 max-w-6xl mx-auto w-full font-sans">
            <Head title={isRtl ? 'مركز استيراد وتصدير البيانات | ERP' : 'Data Import & Export Center'} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold shadow-sm">
                            <Database className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                                {isRtl ? 'مركز استيراد وتصدير البيانات' : 'Data Import & Export Hub'}
                            </h1>
                            <p className="text-xs text-neutral-500 mt-0.5">
                                {isRtl 
                                    ? 'أدوات نقل البيانات المتوافقة مع Microsoft Excel لدليل الحسابات، العملاء، والأصناف.' 
                                    : 'Excel-compatible data migration tools for Chart of Accounts, Parties, and Catalog.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href="/dashboard">
                            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                            <span>{isRtl ? 'العودة للرئيسية' : 'Back to Dashboard'}</span>
                        </a>
                    </Button>
                </div>
            </div>

            {/* Flash Alerts */}
            {flash?.success && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-sm shadow-xs">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <span>{flash.success}</span>
                </div>
            )}
            {flash?.error && (
                <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 p-4 rounded-xl text-sm shadow-xs">
                    <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
                    <span>{flash.error}</span>
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(['customers', 'accounts', 'products'] as const).map((key) => {
                    const cfg = tabConfig[key];
                    const Icon = cfg.icon;
                    const isSelected = activeTab === key;
                    return (
                        <div
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`cursor-pointer rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                                isSelected
                                    ? 'border-neutral-950 dark:border-white bg-white dark:bg-neutral-900 shadow-md ring-2 ring-neutral-950/10 dark:ring-white/10'
                                    : 'border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="font-mono text-xl font-bold text-neutral-950 dark:text-white">
                                    {cfg.count.toLocaleString()}
                                </span>
                            </div>
                            <div className="mt-4">
                                <h3 className="font-bold text-base text-neutral-900 dark:text-white">
                                    {cfg.title}
                                </h3>
                                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                    {cfg.desc}
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                                <span className="text-neutral-500">{cfg.countLabel}</span>
                                <span className={`font-semibold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400'}`}>
                                    {isSelected ? (isRtl ? 'القسم النشط ✓' : 'Active Tab ✓') : (isRtl ? 'اختر للتحكم' : 'Select')}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Active Operation Workspace */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
                            {isRtl ? 'التحكم بالبيانات والتصدير' : 'DATA MANAGEMENT WORKSPACE'}
                        </span>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <span>{currentTab.title}</span>
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Download Template Button */}
                        <Button asChild variant="outline" size="sm" className="gap-2">
                            <a href={`/data-import/template/${activeTab}`} download>
                                <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span>{isRtl ? 'تحميل نموذج CSV القياسي' : 'Download Sample CSV Template'}</span>
                            </a>
                        </Button>

                        {/* Export Existing Data Button */}
                        <Button asChild variant="outline" size="sm" className="gap-2 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                            <a href={`/data-import/export/${activeTab}`} download>
                                <FileSpreadsheet className="h-4 w-4" />
                                <span>{isRtl ? 'تصدير البيانات الحالية (Excel)' : 'Export Current Data (Excel)'}</span>
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid: Instructions on left, Upload form on right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                    {/* Left/Start: Format Guide */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="bg-neutral-50 dark:bg-neutral-950/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 text-xs space-y-3">
                            <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                                <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                <span>{isRtl ? 'متطلبات وهيكل ملف CSV' : 'CSV Structure & Headers'}</span>
                            </div>

                            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {isRtl 
                                    ? 'يجب أن يحتوي ملف الاستيراد على صف العناوين في السطر الأول، ويكون بترميز UTF-8 المتوافق مع Excel:' 
                                    : 'Ensure your file includes the header row on line 1 and is UTF-8 encoded for Arabic compatibility:'}
                            </p>

                            <div className="space-y-1.5 pt-1">
                                {currentTab.columns.map((col, idx) => (
                                    <div key={idx} className="flex items-center gap-2 font-mono text-[11px] bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 px-2.5 py-1.5 rounded-lg text-neutral-800 dark:text-neutral-200">
                                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                                        <span>{col}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 text-[11px] text-neutral-500 leading-relaxed border-t border-neutral-200 dark:border-neutral-800">
                                {isRtl
                                    ? '💡 نصيحة: إذا وُجد السجل مسبقاً (عبر رمز الحساب أو الكود أو الرقم الضريبي) سيتم تحديثه تلقائياً دون تكرار.'
                                    : '💡 Tip: Existing records matching code, SKU, or tax ID will be atomically updated without duplication.'}
                            </div>
                        </div>
                    </div>

                    {/* Right/End: Upload Dropzone & Form */}
                    <div className="lg:col-span-7">
                        <form onSubmit={handleUploadSubmit} className="space-y-5">
                            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 rounded-2xl p-8 text-center bg-neutral-50/50 dark:bg-neutral-950/20 transition-all flex flex-col items-center justify-center min-h-[220px]">
                                <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 mb-3">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                                    {selectedFile ? selectedFile.name : (isRtl ? 'اسحب وأفلت ملف CSV هنا أو اضغط للاختيار' : 'Choose CSV File or Drag & Drop')}
                                </h4>
                                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                                    {selectedFile 
                                        ? `${(selectedFile.size / 1024).toFixed(1)} KB &bull; جاهز للرفع والمعالجة` 
                                        : (isRtl ? 'يقبل ملفات .csv بحد أقصى 10 ميجابايت' : 'Accepts standard .csv files up to 10MB')}
                                </p>

                                <input
                                    type="file"
                                    id="csv-file-input"
                                    accept=".csv,text/csv,text/plain"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                <label
                                    htmlFor="csv-file-input"
                                    className="mt-4 cursor-pointer inline-flex items-center gap-2 rounded-lg bg-white dark:bg-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 shadow-xs hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>{selectedFile ? (isRtl ? 'تغيير الملف' : 'Change File') : (isRtl ? 'استعراض من الجهاز' : 'Browse Computer')}</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <div className="text-xs text-neutral-500">
                                    {isRtl ? 'المعالجة تجري داخل معاملة ذرية آمنة (Atomic Transaction)' : 'All rows process inside a single DB transaction'}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={!selectedFile || isUploading}
                                    className="gap-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 min-w-[160px]"
                                >
                                    <Upload className="h-4 w-4" />
                                    <span>
                                        {isUploading 
                                            ? (isRtl ? 'جاري المعالجة...' : 'Processing...') 
                                            : (isRtl ? 'بدء استيراد البيانات' : 'Import Records')}
                                    </span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
