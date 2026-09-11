import { Link } from '@inertiajs/react';
import {
    ArrowLeftRight,
    ArrowDownUp,
    BadgeDollarSign,
    Banknote,
    BarChart3,
    BookOpen,
    Boxes,
    Briefcase,
    Building2,
    CalendarCheck,
    CalendarClock,
    ClipboardCheck,
    CreditCard,
    FileText,
    FolderGit2,
    Landmark,
    Layers,
    LayoutGrid,
    Lock,
    ReceiptText,
    ShoppingBag,
    TrendingDown,
    Truck,
    Users,
    Warehouse,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
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
    const { t } = useTranslation();

    const mainNavItems: NavItem[] = [
        {
            title: t('nav.dashboard', 'Dashboard'),
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: t('nav.customers', 'Customers & Parties'),
            href: '/customers',
            icon: Users,
        },
        {
            title: t('nav.accounts', 'Chart of Accounts'),
            href: '/accounts',
            icon: Landmark,
        },
        {
            title: t('nav.invoices', 'Service Invoices'),
            href: '/invoices',
            icon: ReceiptText,
        },
        {
            title: t('nav.receipts', 'Receipts & Collections'),
            href: '/receipts',
            icon: Banknote,
        },
        {
            title: t('nav.purchaseOrders', 'Purchase Orders'),
            href: '/purchase-orders',
            icon: ShoppingBag,
        },
        {
            title: t('nav.vendorBills', 'Vendor Bills'),
            href: '/vendor-bills',
            icon: FileText,
        },
        {
            title: t('nav.vendorPayments', 'Vendor Payments'),
            href: '/vendor-payments',
            icon: CreditCard,
        },
        {
            title: t('nav.products', 'Products & Items'),
            href: '/inventory/products',
            icon: Boxes,
        },
        {
            title: t('nav.warehouses', 'Warehouses & Locations'),
            href: '/inventory/warehouses',
            icon: Warehouse,
        },
        {
            title: t('nav.goodsReceipts', 'Goods Receipts (GRN)'),
            href: '/inventory/receipts',
            icon: Truck,
        },
        {
            title: t('nav.stockMovements', 'Stock Movements'),
            href: '/inventory/movements',
            icon: ArrowDownUp,
        },
        {
            title: t('nav.stockTransfers', 'Stock Transfers'),
            href: '/inventory/transfers',
            icon: ArrowLeftRight,
        },
        {
            title: t('nav.stockAdjustments', 'Stock Adjustments'),
            href: '/inventory/adjustments',
            icon: ClipboardCheck,
        },
        {
            title: t('nav.inventoryValuation', 'Inventory Valuation'),
            href: '/reports/inventory-valuation',
            icon: BarChart3,
        },
        {
            title: t('nav.transfers', 'Treasury Transfers'),
            href: '/treasury/transfers',
            icon: ArrowLeftRight,
        },
        {
            title: t('nav.trialBalance', 'Trial Balance'),
            href: '/reports/trial-balance',
            icon: BarChart3,
        },
        {
            title: t('nav.generalLedger', 'General Ledger'),
            href: '/reports/general-ledger',
            icon: BookOpen,
        },
        {
            title: t('nav.arAging', 'AR Aging'),
            href: '/reports/ar-aging',
            icon: BarChart3,
        },
        {
            title: t('nav.apAging', 'A/P Aging'),
            href: '/reports/ap-aging',
            icon: CalendarClock,
        },
        {
            title: t('nav.employees', 'Employees & Staff'),
            href: '/hr/employees',
            icon: Users,
        },
        {
            title: t('nav.departments', 'Departments & Positions'),
            href: '/hr/departments',
            icon: Building2,
        },
        {
            title: t('nav.attendance', 'Attendance & Hours'),
            href: '/hr/attendances',
            icon: CalendarCheck,
        },
        {
            title: t('nav.payrollRuns', 'Payroll Runs'),
            href: '/payroll/runs',
            icon: BadgeDollarSign,
        },
        {
            title: t('nav.fixedAssets', 'Fixed Assets Register'),
            href: '/assets/register',
            icon: Layers,
        },
        {
            title: t('nav.depreciation', 'Asset Depreciation'),
            href: '/assets/depreciation',
            icon: TrendingDown,
        },
        {
            title: t('nav.fiscalPeriods', 'Fiscal Periods & Close'),
            href: '/accounting/periods',
            icon: Lock,
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
        <Sidebar collapsible="icon" variant="inset">
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
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
