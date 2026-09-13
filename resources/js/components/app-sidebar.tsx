import { Link } from '@inertiajs/react';
import {
    ArrowLeftRight,
    ArrowDownUp,
    BadgeDollarSign,
    Banknote,
    BarChart3,
    Bell,
    BookOpen,
    Boxes,
    Building2,
    CalendarCheck,
    CalendarClock,
    ClipboardCheck,
    CreditCard,
    FileCheck2,
    FileText,
    FolderGit2,
    FolderKanban,
    Landmark,
    Layers,
    LayoutGrid,
    LifeBuoy,
    Lock,
    ShieldCheck,
    PackageCheck,
    Receipt,
    ReceiptText,
    ShoppingBag,
    Store,
    TrendingDown,
    Truck,
    UserPlus,
    Users,
    Warehouse,
    Factory,
    HardHat,
    Percent,
    Cpu,
    Database,
    Scale,
    TrendingUp,
    UserCheck,
    Calendar,
    HandCoins,
    Award,
    RotateCcw,
    Archive,
    Barcode,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain, type NavGroup } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { useTranslation } from '@/lib/i18n';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { locale, t } = useTranslation();
    const side = locale === 'ar' ? 'right' : 'left';

    const navGroups: NavGroup[] = [
        {
            title: t('app.dashboard', 'لوحة التحكم'),
            items: [
                {
                    title: t('nav.dashboard', 'لوحة المعلومات'),
                    href: dashboard(),
                    icon: LayoutGrid,
                },
                {
                    title: t('nav.alerts', 'مركز التنبيهات والإشعارات'),
                    href: '/alerts',
                    icon: Bell,
                },
            ],
        },
        {
            title: t('nav.sales', 'المبيعات وإدارة العملاء'),
            items: [
                {
                    title: t('nav.customers', 'العملاء والأطراف'),
                    href: '/customers',
                    icon: Users,
                },
                {
                    title: t('nav.crmLeads', 'العملاء المحتملون والفرص'),
                    href: '/crm/leads',
                    icon: UserPlus,
                },
                {
                    title: t('nav.salesQuotations', 'عروض الأسعار'),
                    href: '/sales/quotations',
                    icon: Receipt,
                },
                {
                    title: t('nav.salesOrders', 'أوامر البيع'),
                    href: '/sales/orders',
                    icon: ShoppingBag,
                },
                {
                    title: t('nav.invoices', 'فواتير الخدمات'),
                    href: '/invoices',
                    icon: ReceiptText,
                },
                {
                    title: t('nav.receipts', 'سندات القبض والتحصيل'),
                    href: '/receipts',
                    icon: Banknote,
                },
                {
                    title: t('nav.creditNotes', 'الإشعارات الدائنة (المرتجعات)'),
                    href: '/sales/credit-notes',
                    icon: RotateCcw,
                },
            ],
        },
        {
            title: t('nav.purchasing', 'المشتريات والموردين'),
            items: [
                {
                    title: t('nav.purchaseRequisitions', 'طلبات الشراء الداخلية (PR)'),
                    href: '/purchase-requisitions',
                    icon: FileCheck2,
                },
                {
                    title: t('nav.purchaseOrders', 'أوامر الشراء'),
                    href: '/purchase-orders',
                    icon: ShoppingBag,
                },
                {
                    title: t('nav.vendorBills', 'فواتير الموردين'),
                    href: '/vendor-bills',
                    icon: FileText,
                },
                {
                    title: t('nav.vendorPayments', 'سندات صرف الموردين'),
                    href: '/vendor-payments',
                    icon: CreditCard,
                },
                {
                    title: t('nav.debitNotes', 'الإشعارات المدينة (المرتجعات)'),
                    href: '/purchasing/debit-notes',
                    icon: RotateCcw,
                },
            ],
        },
        {
            title: t('nav.inventory', 'المستودعات والمخزون'),
            items: [
                {
                    title: t('nav.products', 'المنتجات والأصناف'),
                    href: '/inventory/products',
                    icon: Boxes,
                },
                {
                    title: t('nav.warehouses', 'المستودعات والمواقع'),
                    href: '/inventory/warehouses',
                    icon: Warehouse,
                },
                {
                    title: t('nav.goodsReceipts', 'استلام البضائع (GRN)'),
                    href: '/inventory/receipts',
                    icon: Truck,
                },
                {
                    title: t('nav.landedCosts', 'تكاليف الاستيراد (Landed Costs)'),
                    href: '/inventory/landed-costs',
                    icon: Layers,
                },
                {
                    title: t('nav.deliveryNotes', 'سندات تسليم البضاعة'),
                    href: '/inventory/delivery-notes',
                    icon: PackageCheck,
                },
                {
                    title: t('nav.batches', 'الدفعات وتواريخ الصلاحية (FEFO)'),
                    href: '/inventory/batches',
                    icon: Barcode,
                },
                {
                    title: t('nav.serials', 'الأرقام التسلسلية والضمان'),
                    href: '/inventory/serials',
                    icon: ShieldCheck,
                },
                {
                    title: t('nav.stockMovements', 'حركات المخزون'),
                    href: '/inventory/movements',
                    icon: ArrowDownUp,
                },
                {
                    title: t('nav.stockTransfers', 'مناقلات المستودعات'),
                    href: '/inventory/transfers',
                    icon: ArrowLeftRight,
                },
                {
                    title: t('nav.stocktakes', 'الجرد الفعلي للمخزون'),
                    href: '/inventory/stocktakes',
                    icon: ClipboardCheck,
                },
                {
                    title: t('nav.stockAdjustments', 'تسويات المخزون'),
                    href: '/inventory/adjustments',
                    icon: ClipboardCheck,
                },
                {
                    title: t('nav.inventoryValuation', 'تقييم المخزون'),
                    href: '/reports/inventory-valuation',
                    icon: BarChart3,
                },
            ],
        },
        {
            title: t('nav.accounting', 'المحاسبة والمالية'),
            items: [
                {
                    title: t('nav.accounts', 'دليل الحسابات'),
                    href: '/accounts',
                    icon: Landmark,
                },
                {
                    title: t('nav.journalEntries', 'قيود اليومية العامة'),
                    href: '/accounting/journal-entries',
                    icon: BookOpen,
                },
                {
                    title: t('nav.incomeStatement', 'قائمة الدخل (P&L)'),
                    href: '/reports/income-statement',
                    icon: TrendingUp,
                },
                {
                    title: t('nav.balanceSheet', 'الميزانية العمومية'),
                    href: '/reports/balance-sheet',
                    icon: Scale,
                },
                {
                    title: t('nav.cashFlow', 'قائمة التدفقات النقدية (IAS 7)'),
                    href: '/reports/cash-flow',
                    icon: Banknote,
                },
                {
                    title: t('nav.customerStatement', 'كشف حساب عميل'),
                    href: '/reports/customer-statement',
                    icon: UserCheck,
                },
                {
                    title: t('nav.vendorStatement', 'كشف حساب مورد'),
                    href: '/reports/vendor-statement',
                    icon: Building2,
                },
                {
                    title: t('nav.transfers', 'تحويلات الخزينة'),
                    href: '/treasury/transfers',
                    icon: ArrowLeftRight,
                },
                {
                    title: t('nav.bankReconciliation', 'التسوية والمطابقة البنكية'),
                    href: '/accounting/bank-reconciliation',
                    icon: FileCheck2,
                },
                {
                    title: t('nav.treasuryTransfers', 'التحويلات بين الخزائن والبنوك'),
                    href: '/treasury/transfers',
                    icon: ArrowLeftRight,
                },
                {
                    title: t('nav.cheques', 'إدارة الشيكات وأوراق القبض والدفع'),
                    href: '/treasury/cheques',
                    icon: CreditCard,
                },
                {
                    title: t('nav.bankGuarantees', 'خطابات الضمان البنكية (LG)'),
                    href: '/treasury/bank-guarantees',
                    icon: Landmark,
                },
                {
                    title: t('nav.vatReturns', 'إقرار ضريبة القيمة المضافة'),
                    href: '/accounting/vat-returns',
                    icon: Percent,
                },
                {
                    title: t('nav.zatcaPhase2', 'الربط مع زاتكا (المرحلة الثانية)'),
                    href: '/settings/zatca',
                    icon: ShieldCheck,
                },
                {
                    title: t('nav.pettyCash', 'العهد النقدية والمصروفات النثرية'),
                    href: '/accounting/petty-cash',
                    icon: HandCoins,
                },
                {
                    title: t('nav.costCenters', 'مراكز التكلفة'),
                    href: '/accounting/cost-centers',
                    icon: Layers,
                },
                {
                    title: t('nav.budgets', 'الموازنات التقديرية والانحرافات'),
                    href: '/accounting/budgets',
                    icon: Scale,
                },
                {
                    title: t('nav.fxRates', 'أسعار صرف العملات الأجنبية'),
                    href: '/accounting/fx-rates',
                    icon: ArrowDownUp,
                },
                {
                    title: t('nav.fxRevaluations', 'إعادة تقييم العملات وفروقات الصرف'),
                    href: '/accounting/fx-revaluations',
                    icon: Banknote,
                },
                {
                    title: t('nav.yearEndClosing', 'إقفال السنة المالية'),
                    href: '/accounting/year-end-closing',
                    icon: Lock,
                },
                {
                    title: t('nav.trialBalance', 'ميزان المراجعة'),
                    href: '/reports/trial-balance',
                    icon: BarChart3,
                },
                {
                    title: t('nav.generalLedger', 'دفتر الأستاذ العام'),
                    href: '/reports/general-ledger',
                    icon: BookOpen,
                },
                {
                    title: t('nav.arAging', 'أعمار الديون (عملاء)'),
                    href: '/reports/ar-aging',
                    icon: BarChart3,
                },
                {
                    title: t('nav.apAging', 'أعمار ديون الموردين'),
                    href: '/reports/ap-aging',
                    icon: CalendarClock,
                },
                {
                    title: t('nav.fiscalPeriods', 'الفترات المالية والإقفال'),
                    href: '/accounting/periods',
                    icon: Lock,
                },
            ],
        },
        {
            title: t('nav.hr', 'الموارد البشرية والرواتب'),
            items: [
                {
                    title: t('nav.employees', 'الموظفون والكادر'),
                    href: '/hr/employees',
                    icon: Users,
                },
                {
                    title: t('nav.departments', 'الأقسام والمسميات'),
                    href: '/hr/departments',
                    icon: Building2,
                },
                {
                    title: t('nav.attendance', 'الحضور وساعات العمل'),
                    href: '/hr/attendances',
                    icon: CalendarCheck,
                },
                {
                    title: t('nav.leaves', 'إدارة الإجازات والأرصدة'),
                    href: '/hr/leaves',
                    icon: Calendar,
                },
                {
                    title: t('nav.loans', 'سلف وقروض الموظفين'),
                    href: '/hr/loans',
                    icon: HandCoins,
                },
                {
                    title: t('nav.endOfService', 'مكافأة نهاية الخدمة والمخالصة'),
                    href: '/hr/end-of-service',
                    icon: Award,
                },
                {
                    title: t('nav.payrollRuns', 'مسيرات الرواتب'),
                    href: '/payroll/runs',
                    icon: BadgeDollarSign,
                },
            ],
        },
        {
            title: t('nav.fixedAssets', 'الأصول والمشاريع'),
            items: [
                {
                    title: t('nav.fixedAssets', 'سجل الأصول الثابتة'),
                    href: '/assets/register',
                    icon: Layers,
                },
                {
                    title: t('nav.depreciation', 'إهلاك الأصول'),
                    href: '/assets/depreciation',
                    icon: TrendingDown,
                },
                {
                    title: t('nav.assetDisposals', 'استبعاد وتخريد الأصول'),
                    href: '/assets/disposals',
                    icon: Archive,
                },
                {
                    title: t('nav.projects', 'المشاريع وبطاقات الوقت'),
                    href: '/projects',
                    icon: FolderKanban,
                },
                {
                    title: t('nav.contracts', 'العقود الدورية'),
                    href: '/contracts',
                    icon: FileCheck2,
                },
                {
                    title: t('nav.supportTickets', 'تذاكر الدعم الفني'),
                    href: '/support/tickets',
                    icon: LifeBuoy,
                },
            ],
        },
        {
            title: t('nav.organization', 'العمليات والقطاعات المتخصصة'),
            items: [
                {
                    title: t('nav.posTerminals', 'نقاط البيع (الكاشير)'),
                    href: '/retail/terminals',
                    icon: Store,
                },
                {
                    title: t('nav.posSessions', 'جلسات وورديات الكاشير'),
                    href: '/retail/sessions',
                    icon: Receipt,
                },
                {
                    title: t('nav.tradePriceLists', 'قوائم الأسعار وشرائح الجملة'),
                    href: '/trade/pricelists',
                    icon: Percent,
                },
                {
                    title: t('nav.manufacturingBoms', 'قوائم المواد (BOM)'),
                    href: '/manufacturing/boms',
                    icon: Factory,
                },
                {
                    title: t('nav.productionOrders', 'أوامر الإنتاج والتصنيع'),
                    href: '/manufacturing/orders',
                    icon: Cpu,
                },
                {
                    title: t('nav.contractingClaims', 'مستخلصات المقاولات'),
                    href: '/contracting/claims',
                    icon: HardHat,
                },
            ],
        },
        {
            title: t('nav.governance', 'الحوكمة والاعتمادات المالية'),
            items: [
                {
                    title: t('nav.approvals', 'مركز الموافقات والطلبات'),
                    href: '/governance/approvals',
                    icon: FileCheck2,
                },
                {
                    title: t('nav.doaRules', 'مصفوفة الصلاحيات (DOA)'),
                    href: '/governance/rules',
                    icon: Scale,
                },
                {
                    title: t('nav.auditLogs', 'سجل الرقابة والتدقيق (Audit Trail)'),
                    href: '/audit-logs',
                    icon: ShieldCheck,
                },
            ],
        },
        {
            title: t('nav.platformSettings', 'إدارة وتكامل البيانات'),
            items: [
                {
                    title: t('nav.dataImport', 'استيراد وتصدير البيانات'),
                    href: '/data-import',
                    icon: Database,
                },
            ],
        },
    ];

    const footerNavItems: NavItem[] = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: FolderGit2,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" side={side}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={navGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

