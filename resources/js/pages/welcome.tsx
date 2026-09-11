import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Building2,
    ShieldCheck,
    TrendingUp,
    Store,
    Boxes,
    Factory,
    Users,
    HardHat,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Languages,
    Sparkles,
    Landmark,
    ReceiptText,
    Activity,
    Layers,
    Lock,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLogo from '@/components/app-logo';
import { dashboard, login } from '@/routes';
import { useTranslation } from '@/lib/i18n';

export default function Welcome() {
    const { auth } = usePage<{
        auth: {
            user?: { id: string; name: string; email: string } | null;
        };
    }>().props;

    const { locale, switchLocale } = useTranslation();
    const isAr = locale === 'ar';

    const toggleLanguage = () => {
        switchLocale(isAr ? 'en' : 'ar');
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-emerald-500 selection:text-white font-sans antialiased overflow-x-hidden">
            <Head title={isAr ? 'منظومة تخطيط موارد المؤسسات المتكاملة (ERP)' : 'Enterprise Cloud ERP Platform'} />

            {/* Background ambient lighting effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-emerald-600/30 via-teal-500/10 to-transparent blur-[120px] rounded-full" />
                <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] bg-emerald-700/20 blur-[140px] rounded-full" />
                <div className="absolute bottom-10 -left-40 w-[600px] h-[400px] bg-teal-800/15 blur-[130px] rounded-full" />
            </div>

            {/* 1. Header / Navbar */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-950/80 border-b border-neutral-800/80 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
                                <Building2 className="size-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base tracking-tight text-white leading-none">
                                    {isAr ? 'منظومة ERP السحابية' : 'Enterprise ERP'}
                                </span>
                                <span className="text-[11px] text-emerald-400 font-medium tracking-wide mt-1">
                                    {isAr ? 'الحلول المؤسسية المتكاملة' : 'Integrated Business Suite'}
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-300">
                        <a href="#modules" className="hover:text-emerald-400 transition-colors">
                            {isAr ? 'الوحدات التشغيلية' : 'Core Modules'}
                        </a>
                        <a href="#compliance" className="hover:text-emerald-400 transition-colors">
                            {isAr ? 'الامتثال و ZATCA' : 'Compliance & ZATCA'}
                        </a>
                        <a href="#architecture" className="hover:text-emerald-400 transition-colors">
                            {isAr ? 'المعمارية والأمان' : 'Security & Architecture'}
                        </a>
                        <a href="#stats" className="hover:text-emerald-400 transition-colors">
                            {isAr ? 'مؤشرات الأداء' : 'Metrics & Trust'}
                        </a>
                    </nav>

                    {/* Action Buttons & Language Switcher */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleLanguage}
                            className="h-9 gap-1.5 px-3 rounded-lg border-neutral-800 bg-neutral-900/90 text-neutral-200 hover:bg-neutral-800 hover:text-white text-xs font-semibold"
                        >
                            <Languages className="size-4 text-emerald-400" />
                            <span>{isAr ? 'English' : 'العربية'}</span>
                        </Button>

                        {auth.user ? (
                            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/30 gap-1.5">
                                <Link href={dashboard()}>
                                    <span>{isAr ? 'لوحة التحكم' : 'Dashboard'}</span>
                                    {isAr ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/30 gap-1.5">
                                <Link href={login()}>
                                    <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                                    {isAr ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* 2. Hero Section */}
            <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center max-w-3.5xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6 animate-fade-in shadow-inner">
                        <Sparkles className="size-3.5" />
                        <span>{isAr ? 'معتمد وفق المرحلة الثانية لهيئة الزكاة والضريبة (ZATCA)' : 'Certified ZATCA Phase 2 E-Invoicing & IFRS Compliant'}</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                        {isAr ? (
                            <>
                                المنظومة السحابية الموحدة لإدارة <br className="hidden sm:inline" />
                                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                                    الموارد المالية والتشغيلية
                                </span> للمؤسسات
                            </>
                        ) : (
                            <>
                                Unified Cloud ERP for <br className="hidden sm:inline" />
                                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                                    Enterprise Financial & Operational
                                </span> Growth
                            </>
                        )}
                    </h1>

                    <p className="mt-6 text-base sm:text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">
                        {isAr
                            ? 'نظام تخطيط موارد المؤسسات المتكامل للشركات والمجموعات القابضة: يربط المحاسبة المالية المزدوجة، سلاسل الإمداد والمستودعات، نقاط البيع السريعة، خطوط الإنتاج، والموارد البشرية في منصة سحابية واحدة فائقة الأمان.'
                            : 'An end-to-end enterprise platform unifying general ledger accounting, multi-warehouse logistics, retail POS, production BOMs, and payroll in a secure, multi-tenant cloud environment.'}
                    </p>

                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        {auth.user ? (
                            <Button asChild size="lg" className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-600/30 gap-2">
                                <Link href={dashboard()}>
                                    <span>{isAr ? 'الدخول إلى لوحة التحكم' : 'Go to Dashboard'}</span>
                                    {isAr ? <ArrowLeft className="size-5" /> : <ArrowRight className="size-5" />}
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild size="lg" className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-600/30 gap-2">
                                <Link href={login()}>
                                    <span>{isAr ? 'الدخول إلى المنظومة' : 'Access System'}</span>
                                    {isAr ? <ArrowLeft className="size-5" /> : <ArrowRight className="size-5" />}
                                </Link>
                            </Button>
                        )}
                        <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-xl border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 font-semibold text-base">
                            <a href="#modules">{isAr ? 'استعراض الوحدات التشغيلية' : 'Explore Modules'}</a>
                        </Button>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-400" />
                            <span>{isAr ? 'متوافق مع هيئة الزكاة والضريبة ZATCA' : 'ZATCA Phase 2 Certified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-400" />
                            <span>{isAr ? 'معايير المحاسبة الدولية IFRS' : 'IFRS Compliant'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-400" />
                            <span>{isAr ? 'تعدد الشركات والفروع والعملات' : 'Multi-Company & Multi-Branch'}</span>
                        </div>
                    </div>
                </div>

                {/* Hero Showcase Mockup */}
                <div className="mt-14 relative max-w-5xl mx-auto">
                    <div className="relative rounded-2xl border border-neutral-800/90 bg-gradient-to-b from-neutral-900/90 via-neutral-900/60 to-neutral-950 p-3 sm:p-6 shadow-2xl shadow-emerald-950/40 backdrop-blur-md">
                        {/* Mockup Header */}
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800/80">
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-red-500/80" />
                                <div className="size-3 rounded-full bg-amber-500/80" />
                                <div className="size-3 rounded-full bg-emerald-500/80" />
                                <span className="ms-2 text-xs font-mono text-neutral-400">
                                    erp.cloud/dashboard - {isAr ? 'شركة الأمل للتجارة والمقاولات' : 'Al-Amal Enterprise Corp'}
                                </span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/40">
                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{isAr ? 'القيود متوازنة 100%' : 'Balanced Ledger'}</span>
                            </div>
                        </div>

                        {/* Mockup Preview Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80">
                                <div className="text-xs text-neutral-400 font-medium">{isAr ? 'إجمالي المبيعات المعتمدة' : 'Posted Revenue'}</div>
                                <div className="text-2xl font-black text-white mt-1">4,820,500.00 <span className="text-xs text-emerald-400">SAR</span></div>
                                <div className="text-[11px] text-emerald-400 mt-1 font-semibold">{isAr ? '+24.5% نمو هذا الربع' : '+24.5% quarterly growth'}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80">
                                <div className="text-xs text-neutral-400 font-medium">{isAr ? 'فواتير المشتريات والتوريد' : 'Vendor Procurement'}</div>
                                <div className="text-2xl font-black text-white mt-1">1,340,200.00 <span className="text-xs text-blue-400">SAR</span></div>
                                <div className="text-[11px] text-blue-400 mt-1 font-semibold">{isAr ? 'دورة المشتريات مغلقة' : 'Matched 3-Way'}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80">
                                <div className="text-xs text-neutral-400 font-medium">{isAr ? 'نقاط البيع والفروع' : 'Active Terminals'}</div>
                                <div className="text-2xl font-black text-white mt-1">12 <span className="text-xs text-purple-400">{isAr ? 'نقطة نشطة' : 'Terminals'}</span></div>
                                <div className="text-[11px] text-purple-400 mt-1 font-semibold">{isAr ? 'مطابقة نقدية لحظية' : 'Real-time reconciliation'}</div>
                            </div>
                        </div>

                        {/* Mockup Mini Transactions */}
                        <div className="rounded-xl bg-neutral-950/90 border border-neutral-800/80 p-3 overflow-hidden text-xs">
                            <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-800/60 pb-2 mb-2 font-semibold">
                                <span>{isAr ? 'رقم الفاتورة / الوثيقة' : 'Document #'}</span>
                                <span>{isAr ? 'الطرف / العميل' : 'Party'}</span>
                                <span>{isAr ? 'المبلغ الإجمالي' : 'Total'}</span>
                                <span>{isAr ? 'حالة الاعتماد' : 'Status'}</span>
                            </div>
                            <div className="space-y-2 font-mono">
                                <div className="flex items-center justify-between text-neutral-200">
                                    <span className="text-emerald-400 font-semibold">INV-2026-0089</span>
                                    <span>{isAr ? 'شركة بن لادن العالمية' : 'Binladen Global Co.'}</span>
                                    <span>245,000.00 SAR</span>
                                    <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded text-[10px] font-sans font-bold">{isAr ? 'مرحّلة بـ ZATCA' : 'ZATCA Posted'}</span>
                                </div>
                                <div className="flex items-center justify-between text-neutral-200">
                                    <span className="text-blue-400 font-semibold">PO-2026-0042</span>
                                    <span>{isAr ? 'مصنع اليمامة للصلب' : 'Yamama Steel Factory'}</span>
                                    <span>180,500.00 SAR</span>
                                    <span className="text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded text-[10px] font-sans font-bold">{isAr ? 'مستلم بالمستودع' : 'GRN Received'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Core Operational Modules Section */}
            <section id="modules" className="relative z-10 py-20 bg-neutral-900/40 border-y border-neutral-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3 border border-emerald-500/20">
                            <Layers className="size-3.5" />
                            <span>{isAr ? 'منظومة متكاملة من الوحدات المتخصصة' : 'Modular Enterprise Architecture'}</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            {isAr ? 'حلول مصممة لتغطية كافة أركان أعمالك' : 'Comprehensive Solutions for Modern Enterprise'}
                        </h2>
                        <p className="mt-4 text-sm sm:text-base text-neutral-400">
                            {isAr
                                ? 'وحدات برمجية مترابطة تشارك قاعدة بيانات موحدة تضمن تدفق البيانات من المبيعات والمشتريات إلى القيود المحاسبية دون أي تكرار أو تدخل يدوي.'
                                : 'Interconnected modules sharing a single unified ledger, ensuring transactions flow seamlessly from operations to financials without human intervention.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Module 1: Accounting */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 hover:border-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-950/20 group">
                            <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Landmark className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{isAr ? 'المحاسبة والمالية المتكاملة' : 'Financial Accounting & Ledger'}</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                                {isAr
                                    ? 'شجرة حسابات مرنة متعددة المستويات، قيود يومية متوازنة لحظياً، سجل وإهلاك الأصول الثابتة، فواتير وسندات القبض والصرف، وميزان المراجعة.'
                                    : 'Multi-level Chart of Accounts, real-time double-entry journal balancing, fixed asset depreciation, and trial balance generation.'}
                            </p>
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-emerald-400">
                                <span className="bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">IFRS</span>
                                <span className="bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">ZATCA e-Invoice</span>
                                <span className="bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">{isAr ? 'إهلاك الأصول' : 'Depreciation'}</span>
                            </div>
                        </div>

                        {/* Module 2: Supply Chain */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 hover:border-blue-500/40 transition-all hover:shadow-xl hover:shadow-blue-950/20 group">
                            <div className="size-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Boxes className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{isAr ? 'سلاسل الإمداد والمستودعات' : 'Supply Chain & Warehouses'}</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                                {isAr
                                    ? 'إدارة متطورة للمستودعات المتعددة والمواقع، سندات استلام البضائع (GRN)، تقييم المخزون بالتكلفة المرجحة (MAC)، ومناقلات المخزون.'
                                    : 'Multi-warehouse logistics, Goods Receipt Notes (GRN), Moving Average Costing (MAC), stock transfers, and automated valuation.'}
                            </p>
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-blue-400">
                                <span className="bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">GRN Logistics</span>
                                <span className="bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">MAC Valuation</span>
                                <span className="bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">{isAr ? 'تحويلات المخزون' : 'Transfers'}</span>
                            </div>
                        </div>

                        {/* Module 3: Retail POS */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 hover:border-purple-500/40 transition-all hover:shadow-xl hover:shadow-purple-950/20 group">
                            <div className="size-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Store className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{isAr ? 'نقاط البيع والتجزئة (POS)' : 'Retail POS & Cashier'}</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                                {isAr
                                    ? 'واجهة كاشير سريعة تدعم شاشات اللمس والباركود، فواتير إلكترونية مبسطة بـ QR فوري، فتح وإقفال الورديات، ومطابقة النقدية الدقيقة.'
                                    : 'Ultra-fast barcode & touch checkout, simplified tax e-invoicing with instant ZATCA QR, shift opening/closing, and cash drawers.'}
                            </p>
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-purple-400">
                                <span className="bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">ZATCA QR</span>
                                <span className="bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">{isAr ? 'إدارة الورديات' : 'Shift Control'}</span>
                                <span className="bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">{isAr ? 'مطابقة النقدية' : 'Reconciliation'}</span>
                            </div>
                        </div>

                        {/* Module 4: Manufacturing */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 hover:border-amber-500/40 transition-all hover:shadow-xl hover:shadow-amber-950/20 group">
                            <div className="size-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Factory className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{isAr ? 'التصنيع والإنتاج والتجميع' : 'Manufacturing & BOM'}</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                                {isAr
                                    ? 'شجرة المواد (BOM) متعددة المستويات، أوامر الإنتاج والتجميع، صرف المواد الخام آلياً، وحساب تكاليف التصنيع المباشرة وغير المباشرة.'
                                    : 'Multi-level Bill of Materials (BOM), production work orders, automated raw material consumption, and manufacturing cost allocation.'}
                            </p>
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-amber-400">
                                <span className="bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">BOM Tree</span>
                                <span className="bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">Work Orders</span>
                                <span className="bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">{isAr ? 'تكاليف الإنتاج' : 'Costing'}</span>
                            </div>
                        </div>

                        {/* Module 5: HR & Payroll */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 hover:border-rose-500/40 transition-all hover:shadow-xl hover:shadow-rose-950/20 group">
                            <div className="size-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <Users className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{isAr ? 'الموارد البشرية والرواتب' : 'HRMS & Payroll'}</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                                {isAr
                                    ? 'سجل بيانات الموظفين، تتبع الدوام وساعات العمل الإضافية، احتساب البدلات والخصومات، وإصدار مسيرات الرواتب متوافقة مع نظام العمل.'
                                    : 'Employee directory, attendance logs, overtime tracking, deductions & allowances, and compliant automated payroll runs.'}
                            </p>
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-rose-400">
                                <span className="bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">{isAr ? 'مسيرات الرواتب' : 'Payroll Runs'}</span>
                                <span className="bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">{isAr ? 'الحضور والدوام' : 'Attendance'}</span>
                                <span className="bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">{isAr ? 'الهيكل الإداري' : 'Organization'}</span>
                            </div>
                        </div>

                        {/* Module 6: Projects & Contracting */}
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 hover:border-cyan-500/40 transition-all hover:shadow-xl hover:shadow-cyan-950/20 group">
                            <div className="size-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <HardHat className="size-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{isAr ? 'المقاولات والمشاريع' : 'Contracting & Projects'}</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                                {isAr
                                    ? 'مستخلصات المقاولات ونسب الإنجاز التراكمية، احتساب الدفعات المقدمة وخصم محجوز الضمان، وبطاقات الوقت وتكاليف المشاريع.'
                                    : 'Contracting progress claims, cumulative completion milestones, advance payment & retention deductions, and project timesheets.'}
                            </p>
                            <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-cyan-400">
                                <span className="bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">{isAr ? 'مستخلصات دورية' : 'Progress Claims'}</span>
                                <span className="bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">{isAr ? 'محجوز الضمان' : 'Retention'}</span>
                                <span className="bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">{isAr ? 'بطاقات الوقت' : 'Timesheets'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Compliance & Security Section */}
            <section id="compliance" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-900/80 to-neutral-950 p-8 sm:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
                                <ShieldCheck className="size-3.5" />
                                <span>{isAr ? 'الأمان والامتثال النظامي' : 'Regulatory Compliance'}</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                                {isAr ? 'أمان مؤسسي وامتثال كامل للوائح المملكة' : 'Enterprise Grade Security & Saudi Regulatory Compliance'}
                            </h2>
                            <p className="mt-4 text-sm text-neutral-300 leading-relaxed">
                                {isAr
                                    ? 'تم بناء النظام ليلبي أعلى معايير الحوكمة المالية وأمن البيانات المؤسسية، مع التكامل الكامل لمتطلبات الفاتورة الإلكترونية للفوترة والربط والتكامل.'
                                    : 'Engineered to adhere to rigorous financial governance, OWASP ASVS isolation standards, and automated ZATCA cryptographic verification.'}
                            </p>

                            <div className="mt-8 space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-bold text-white">{isAr ? 'الفاتورة الإلكترونية ZATCA (المرحلة الثانية)' : 'ZATCA Phase 2 E-Invoicing'}</div>
                                        <div className="text-xs text-neutral-400">{isAr ? 'توليد الرمز المشفر (QR Code) والتوقيع الرقمي ECDSA وتسلسل الهاش التشفيري.' : 'ECDSA digital signatures, cryptographic hashes, and compliant QR generation.'}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-bold text-white">{isAr ? 'عزل كامل لبيانات الشركات والمستأجرين (ASVS 4.0)' : 'Strict Multi-Tenant Isolation'}</div>
                                        <div className="text-xs text-neutral-400">{isAr ? 'خصوصية تامة وحماية مشددة لبيانات كل شركة وفرع دون إمكانية الوصول غير المصرح به.' : 'Database-enforced company boundaries preventing cross-tenant leakage.'}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-bold text-white">{isAr ? 'سجل تدقيق رقابي لا يقبل التعديل (Audit Trail)' : 'Immutable Audit Trail'}</div>
                                        <div className="text-xs text-neutral-400">{isAr ? 'توثيق تاريخي لكل عملية مالية وإدارية لحماية الشفافية وتسهيل المراجعة القانونية.' : 'Comprehensive audit logs tracking actions, timestamps, and authorized actors.'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-neutral-300">{isAr ? 'معيار توازن دفتر الأستاذ' : 'General Ledger Balance'}</span>
                                    <span className="text-xs text-emerald-400 font-mono font-bold">{isAr ? 'متوازن 100%' : '100% Balanced'}</span>
                                </div>
                                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-full rounded-full" />
                                </div>
                                <span className="text-[10px] text-neutral-500 mt-2 block">{isAr ? 'المدين = الدائن في جميع القيود دون أي فارق حسابي' : 'Zero variance across all double-entry transaction lines'}</span>
                            </div>

                            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-neutral-300">{isAr ? 'حالة التوافق مع ZATCA' : 'ZATCA Integration Status'}</span>
                                    <span className="text-xs text-emerald-400 font-mono font-bold">{isAr ? 'معتمد وجاهز' : 'Ready & Certified'}</span>
                                </div>
                                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-full rounded-full" />
                                </div>
                                <span className="text-[10px] text-neutral-500 mt-2 block">{isAr ? 'فواتير ضريبية وفواتير مبسطة مطابقة للمعايير' : 'Tax Invoices and Simplified Invoices fully structured'}</span>
                            </div>

                            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-neutral-300">{isAr ? 'جاهزية النسخ الاحتياطي والتعافي' : 'Backup & Recovery Drill'}</span>
                                    <span className="text-xs text-emerald-400 font-mono font-bold">{isAr ? 'متحقق منه' : 'Verified Snapshot'}</span>
                                </div>
                                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-full rounded-full" />
                                </div>
                                <span className="text-[10px] text-neutral-500 mt-2 block">{isAr ? 'اختبارات استعادة دورية مؤتمتة لقواعد البيانات' : 'Automated scheduled snapshot checksum drills active'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Metrics & Trust Stats */}
            <section id="stats" className="relative z-10 py-16 bg-neutral-900/30 border-t border-neutral-800/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="p-4">
                            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">99.99%</div>
                            <div className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">{isAr ? 'جاهزية واستقرار تشغيلي' : 'System Availability'}</div>
                        </div>
                        <div className="p-4">
                            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">100%</div>
                            <div className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">{isAr ? 'توافق كامل مع ZATCA' : 'ZATCA Compliance'}</div>
                        </div>
                        <div className="p-4">
                            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">0.00</div>
                            <div className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">{isAr ? 'فوارق ميزان المراجعة' : 'Ledger Discrepancy'}</div>
                        </div>
                        <div className="p-4">
                            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">∞</div>
                            <div className="text-xs sm:text-sm text-neutral-400 mt-1 font-medium">{isAr ? 'توسع غير محدود للفروع' : 'Unlimited Branches'}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Call to Action Banner */}
            <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="rounded-3xl bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-neutral-950 border border-emerald-900/50 p-8 sm:p-14 text-center relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                            {isAr
                                ? 'جاهز لتوحيد عمليات مؤسستك والارتقاء بأدائك المالي؟'
                                : 'Ready to Transform Your Enterprise Operations?'}
                        </h2>
                        <p className="mt-4 text-sm sm:text-base text-neutral-300">
                            {isAr
                                ? 'ابدأ الآن في إدارة فروعك ومستودعاتك وفواتيرك الضريبية من مكان واحد بكل سهولة وأمان.'
                                : 'Take full control of your accounting, supply chain, and retail branches in one unified platform.'}
                        </p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            {auth.user ? (
                                <Button asChild size="lg" className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-600/30 gap-2">
                                    <Link href={dashboard()}>
                                        <span>{isAr ? 'الانتقال للوحة التحكم' : 'Go to Dashboard'}</span>
                                        {isAr ? <ArrowLeft className="size-5" /> : <ArrowRight className="size-5" />}
                                    </Link>
                                </Button>
                            ) : (
                                <Button asChild size="lg" className="h-12 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-xl shadow-emerald-600/30 gap-2">
                                    <Link href={login()}>
                                        <span>{isAr ? 'تسجيل الدخول للنظام' : 'Access System'}</span>
                                        {isAr ? <ArrowLeft className="size-5" /> : <ArrowRight className="size-5" />}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Footer */}
            <footer className="relative z-10 border-t border-neutral-800/80 bg-neutral-950 py-12 text-xs text-neutral-500">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
                            <Building2 className="size-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-neutral-200">{isAr ? 'منظومة ERP السحابية' : 'Enterprise ERP Suite'}</span>
                            <span className="text-[10px] text-neutral-500">{isAr ? 'حلول إدارة الموارد للشركات والمؤسسات' : 'B2B Enterprise Cloud Platform'}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-neutral-400">
                        <a href="#modules" className="hover:text-emerald-400 transition-colors">{isAr ? 'الوحدات' : 'Modules'}</a>
                        <a href="#compliance" className="hover:text-emerald-400 transition-colors">{isAr ? 'الامتثال' : 'Compliance'}</a>
                        <a href="#stats" className="hover:text-emerald-400 transition-colors">{isAr ? 'الأرقام' : 'Metrics'}</a>
                        <Link href="/login" className="hover:text-emerald-400 transition-colors">{isAr ? 'تسجيل الدخول' : 'Sign In'}</Link>
                    </div>

                    <div className="text-center md:text-end">
                        <p>© 2026 {isAr ? 'جميع الحقوق محفوظة لمنظومة تخطيط موارد المؤسسات' : 'All rights reserved. Enterprise Resource Planning'}.</p>
                        <p className="mt-0.5 text-[10px] text-neutral-600">{isAr ? 'معتمد وفق أنظمة هيئة الزكاة والضريبة والجمارك ZATCA' : 'Compliant with ZATCA regulations'}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
