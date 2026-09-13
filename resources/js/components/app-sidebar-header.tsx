import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AlertBell } from '@/components/erp/alert-bell';
import { ContextSwitcher } from '@/components/erp/context-switcher';
import { LocaleSwitcher } from '@/components/erp/locale-switcher';
import { ThemeDropdown } from '@/components/theme-dropdown';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="border-sidebar-border/60 bg-background/95 backdrop-blur-md sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
            <div className="flex items-center gap-2 min-w-0">
                <SidebarTrigger className="shrink-0" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <AlertBell />
                <ContextSwitcher />
                <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />
                <ThemeDropdown />
                <LocaleSwitcher />
            </div>
        </header>
    );
}
