// Digits (SPEC 7, as decided by the owner on 2026-10-18): Western digits (0123) in every
// language, Arabic included. A person can still opt into Arabic-Indic digits (٠١٢٣) in
// Settings. Ayah numbers inside Quran text follow the mushaf, not this setting.

import type { Locale } from './locales';

export type DigitsPreference = 'auto' | 'arab' | 'latn';
export type NumberingSystem = 'arab' | 'latn';

export function numberingSystem(
  _locale: Locale,
  _region: string | null | undefined,
  preference: DigitsPreference = 'auto',
): NumberingSystem {
  return preference === 'arab' ? 'arab' : 'latn';
}

/**
 * The BCP 47 tag to hand to Intl (and to use-intl), e.g. `ar-TN-u-nu-latn`.
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

/** Arabic-Indic digits, for ayah numbers inside Quran text and the opt-in setting. */
export function toArabicIndic(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => arabicIndic[Number(d)] ?? d);
}
