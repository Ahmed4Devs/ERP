import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export interface NavGroup {
    title?: string;
    items: NavItem[];
    moduleKey?: string;
}

export function NavMain({
    groups,
    items,
}: {
    groups?: NavGroup[];
    items?: NavItem[];
}) {
    const { isCurrentUrl } = useCurrentUrl();

    const renderGroup = (groupTitle: string | undefined, groupItems: NavItem[], index: number) => (
        <SidebarGroup key={groupTitle || `group-${index}`} className="px-2 py-1">
            {groupTitle && (
                <SidebarGroupLabel className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                    {groupTitle}
                </SidebarGroupLabel>
            )}
            <SidebarMenu>
                {groupItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/80 data-[active=true]:font-medium data-[active=true]:bg-primary/10 data-[active=true]:text-primary dark:data-[active=true]:bg-primary/20"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon className="size-4 shrink-0" />}
                                <span className="truncate">{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );

    if (groups && groups.length > 0) {
        return <>{groups.map((group, idx) => renderGroup(group.title, group.items, idx))}</>;
    }

    if (items && items.length > 0) {
        return renderGroup(undefined, items, 0);
    }

    return null;
}

