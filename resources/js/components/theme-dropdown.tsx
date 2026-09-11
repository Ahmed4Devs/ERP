import { Monitor, Moon, Sun, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppearance } from '@/hooks/use-appearance';
import { useTranslation } from '@/lib/i18n';

export function ThemeDropdown({ className = '' }: { className?: string }) {
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const { locale } = useTranslation();
    const isAr = locale === 'ar';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`h-9 w-9 p-0 rounded-lg border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-xs shrink-0 ${className}`}
                    title={isAr ? 'المظهر (داكن / فاتح / النظام)' : 'Appearance (Dark / Light / System)'}
                >
                    {resolvedAppearance === 'dark' ? (
                        <Moon className="size-4 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                        <Sun className="size-4 text-amber-500" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAr ? 'start' : 'end'} className="w-40">
                <DropdownMenuItem
                    onClick={() => updateAppearance('light')}
                    className="flex items-center justify-between cursor-pointer text-xs py-2"
                >
                    <div className="flex items-center gap-2">
                        <Sun className="size-4 text-amber-500" />
                        <span className="font-medium">{isAr ? 'فاتح' : 'Light'}</span>
                    </div>
                    {appearance === 'light' && <Check className="size-4 text-emerald-600 dark:text-emerald-400" />}
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => updateAppearance('dark')}
                    className="flex items-center justify-between cursor-pointer text-xs py-2"
                >
                    <div className="flex items-center gap-2">
                        <Moon className="size-4 text-emerald-500 dark:text-emerald-400" />
                        <span className="font-medium">{isAr ? 'داكن' : 'Dark'}</span>
                    </div>
                    {appearance === 'dark' && <Check className="size-4 text-emerald-600 dark:text-emerald-400" />}
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={() => updateAppearance('system')}
                    className="flex items-center justify-between cursor-pointer text-xs py-2"
                >
                    <div className="flex items-center gap-2">
                        <Monitor className="size-4 text-neutral-500" />
                        <span className="font-medium">{isAr ? 'تلقائي (النظام)' : 'System'}</span>
                    </div>
                    {appearance === 'system' && <Check className="size-4 text-emerald-600 dark:text-emerald-400" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
