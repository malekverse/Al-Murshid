// Digits (SPEC 7): Auto uses Western digits for English, French and Maghreb Arabic
// (Tunisia, Morocco, Algeria), and Arabic-Indic digits for other Arabic locales.

import type { Locale } from './locales';

export type DigitsPreference = 'auto' | 'arab' | 'latn';
export type NumberingSystem = 'arab' | 'latn';

const maghreb: ReadonlySet<string> = new Set(['TN', 'MA', 'DZ']);

export function numberingSystem(
  locale: Locale,
  region: string | null | undefined,
  preference: DigitsPreference = 'auto',
): NumberingSystem {
  if (preference !== 'auto') return preference;
  if (locale !== 'ar') return 'latn';
  return region && maghreb.has(region.toUpperCase()) ? 'latn' : 'arab';
}

/**
 * The BCP 47 tag to hand to Intl (and to next-intl / use-intl), e.g. `ar-TN-u-nu-latn`.
 * Keeps the region so dates and lists follow local conventions.
 */
export function intlLocale(
  locale: Locale,
  region: string | null | undefined,
  preference: DigitsPreference = 'auto',
): string {
  const nu = numberingSystem(locale, region, preference);
  const base = region ? `${locale}-${region.toUpperCase()}` : locale;
  return `${base}-u-nu-${nu}`;
}

const arabicIndic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Arabic-Indic digits, used for ayah numbers inside Quran text whatever the setting. */
export function toArabicIndic(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => arabicIndic[Number(d)] ?? d);
}
