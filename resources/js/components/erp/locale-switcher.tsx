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
            variant="ghost"
            size="sm"
            onClick={toggle}
            className="h-9 gap-1.5 px-2.5 font-medium text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title={locale === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
        >
            <Languages className="h-4 w-4 text-neutral-500" />
            <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
        </Button>
    );
}
