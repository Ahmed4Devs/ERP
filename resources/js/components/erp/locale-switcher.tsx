import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

export function LocaleSwitcher() {
    const { locale, switchLocale } = useTranslation();

    const toggle = () => {
        const nextLocale = locale === 'ar' ? 'en' : 'ar';
        switchLocale(nextLocale);
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={toggle}
            className="h-9 gap-2 px-3 font-semibold text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white/90 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-xs transition-all shrink-0"
            title={locale === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
        >
            <Languages className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold">{locale === 'ar' ? 'English' : 'العربية'}</span>
        </Button>
    );
}

