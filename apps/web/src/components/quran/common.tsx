'use client';

import { pageOf, surahNameGlyph, type MushafEdition, type Surah } from '@murshid/content/quran';
import { civilDate, type CivilDate } from '@murshid/core';
import type { ReadingTheme } from '@murshid/data';
import { surahNameSize, type ThemeName } from '@murshid/tokens';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/use-now';
import { useSettings } from '@/lib/settings';
import { useResolvedTheme } from '../theme';

/** A surah's calligraphic name (QUL's surah name font). Decorative: the name is shown beside it. */
export function SurahCalligraphy({
  number,
  size = 'list',
  className,
}: {
  number: number;
  size?: keyof typeof surahNameSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      dir="rtl"
      className={cn('font-surah leading-none text-ink', className)}
      style={{ fontSize: surahNameSize[size] }}
    >
      {surahNameGlyph(number)}
    </span>
  );
}

/** A surah's name in the UI language: Arabic in Arabic, the transliteration otherwise. */
export function useSurahName() {
  const locale = useLocale();
  return (s: Surah) => (locale === 'ar' ? s.nameArabic : s.nameSimple);
}

/** Where reading opens: the scrolling reader, or the pages of the chosen mushaf. */
export interface ReaderPlace {
  view: 'verses' | 'mushaf';
  edition: MushafEdition;
}
export const readerPlace = (
  prefs: { view: 'verses' | 'mushaf'; edition: MushafEdition } | undefined,
): ReaderPlace => ({
  view: prefs?.view ?? 'verses',
  edition: prefs?.edition ?? 'v2',
});

/**
 * Where to read an ayah: its place in the verse view (the surah's page at its anchor; the ayah's
 * own page, /quran/2/255, is for studying it and for search, Phase 6), or its page in the chosen
 * mushaf.
 */
export function readerHref(surah: number, ayah = 1, place?: ReaderPlace) {
  if (place?.view === 'mushaf') return `/quran/page/${pageOf(surah, ayah, place.edition)}`;
  return ayah > 1 ? `/quran/${surah}#ayah-${ayah}` : `/quran/${surah}`;
}

/** Today in the person's time zone (or the browser's before a location is set). */
export function useToday(): CivilDate | null {
  const now = useNow(60_000);
  const settings = useSettings();
  if (!now) return null;
  const zone = settings?.location?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  return civilDate(now, zone);
}

/** The reader's colors: like the app, or light, sepia or dark whatever the app theme. */
export function useReaderTheme(chosen: ReadingTheme | undefined): ThemeName {
  const app = useResolvedTheme();
  return !chosen || chosen === 'app' ? app : chosen;
}
