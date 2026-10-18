'use client';

import { localeNames, locales, type Locale } from '@murshid/i18n';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Segmented } from './ui/segmented';
import { useThemePreference, type ThemePreference } from './theme';

export function ShowcaseControls() {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [theme, setTheme] = useThemePreference();

  const themes: { value: ThemePreference; label: string }[] = [
    { value: 'light', label: t('theme.light') },
    { value: 'dark', label: t('theme.dark') },
    { value: 'auto', label: t('theme.auto') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented label={t('theme.label')} value={theme} options={themes} onChange={setTheme} />
      <Segmented
        label={t('language.label')}
        value={locale}
        options={locales.map((l) => ({ value: l, label: localeNames[l], lang: l }))}
        onChange={(next: Locale) => router.replace(pathname, { locale: next, scroll: false })}
      />
    </div>
  );
}
