import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AlertBell() {
    const [unreadCount, setUnreadCount] = useState<number>(0);

    const fetchUnread = async () => {
        try {
            const res = await fetch('/alerts/unread-count');
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.unread_count || 0);
            }
        } catch (e) {
            // Ignore background fetch error
        }
    };

    useEffect(() => {
        fetchUnread();
        const interval = setInterval(fetchUnread, 60000); // refresh every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <Link href="/alerts" className="relative">
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
                <Bell className="h-4 w-4 text-foreground/80" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -end-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>
        </Link>
    );
}
