// Supported locales (SPEC 7). Adding a language is a content task: add it here and add its
// message folder; nothing else in the apps changes.

export const locales = ['ar', 'en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export type Direction = 'rtl' | 'ltr';

const rtlLocales: ReadonlySet<string> = new Set(['ar', 'ur', 'fa', 'he']);

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function direction(locale: string): Direction {
  return rtlLocales.has(locale.split('-')[0]?.toLowerCase() ?? '') ? 'rtl' : 'ltr';
}

export function isRtl(locale: string): boolean {
  return direction(locale) === 'rtl';
}

/** Each language named in itself, for the language picker. */
export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
  fr: 'Français',
};

/**
 * Pick the app locale from the device's preferred language tags (onboarding step 1).
 * Falls back to Arabic when none of the device languages is supported.
 */
export function matchLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const base = tag.split(/[-_]/)[0]?.toLowerCase();
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
