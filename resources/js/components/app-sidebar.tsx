import { Link } from '@inertiajs/react';
import { Banknote, BarChart3, BookOpen, FolderGit2, Landmark, LayoutGrid, ReceiptText, Users } from 'lucide-react';
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
