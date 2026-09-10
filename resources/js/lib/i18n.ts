import { usePage, router } from '@inertiajs/react';
import ar from '@/i18n/ar.json';
import en from '@/i18n/en.json';

type TranslationTree = typeof en;

const translations: Record<string, TranslationTree> = {
    ar: ar as unknown as TranslationTree,
    en: en as TranslationTree,
};

export function useTranslation() {
    const { props } = usePage<{ locale?: string; direction?: string }>();
    const locale = (props.locale === 'en' ? 'en' : 'ar') as 'ar' | 'en';
    const isRtl = locale === 'ar';

    const t = (path: string, fallback?: string): string => {
        const keys = path.split('.');
        let current: any = translations[locale];

        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                // Fallback to English if missing in Arabic
                let fallbackCurrent: any = translations.en;
                for (const fbKey of keys) {
                    if (fallbackCurrent && typeof fallbackCurrent === 'object' && fbKey in fallbackCurrent) {
                        fallbackCurrent = fallbackCurrent[fbKey];
                    } else {
                        return fallback || path;
                    }
                }
                return typeof fallbackCurrent === 'string' ? fallbackCurrent : fallback || path;
            }
        }

        return typeof current === 'string' ? current : fallback || path;
    };

    const switchLocale = (newLocale: 'ar' | 'en') => {
        router.post('/switch-locale', { locale: newLocale }, {
            preserveScroll: true,
            onSuccess: () => {
                document.documentElement.setAttribute('dir', newLocale === 'ar' ? 'rtl' : 'ltr');
                document.documentElement.setAttribute('lang', newLocale);
            },
        });
    };

    return {
        locale,
        isRtl,
        t,
        switchLocale,
    };
}
