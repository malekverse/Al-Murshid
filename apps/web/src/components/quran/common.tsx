'use client';

import { pageOf, surahNameGlyph, type Surah } from '@murshid/content/quran';
import { civilDate, type CivilDate } from '@murshid/core';
import { surahNameSize } from '@murshid/tokens';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/use-now';
import { useSettings } from '@/lib/settings';

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

/** Where to read an ayah: its place in the verse view, or its page in the mushaf. */
export function readerHref(surah: number, ayah = 1, view: 'verses' | 'mushaf' = 'verses') {
  if (view === 'mushaf') return `/quran/page/${pageOf(surah, ayah)}`;
  return ayah > 1 ? `/quran/${surah}/${ayah}` : `/quran/${surah}`;
}

/** Today in the person's time zone (or the browser's before a location is set). */
export function useToday(): CivilDate | null {
  const now = useNow(60_000);
  const settings = useSettings();
  if (!now) return null;
  const zone = settings?.location?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  return civilDate(now, zone);
}
