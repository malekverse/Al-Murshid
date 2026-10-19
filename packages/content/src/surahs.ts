// Surah metadata from QUL (sources.json). Small, so lists and indexes can use it without loading
// the Quran text.

import ligatures from '../quran/source/surah-name-v2-ligatures.json';
import surahNames from '../quran/source/surah-names.json';

interface RawSurah {
  id: number;
  name: string;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
  bismillah_pre: boolean;
}

export interface Surah {
  number: number;
  /** Transliterated name with diacritics, e.g. "Al-Fātiĥah". */
  name: string;
  /** Plain transliteration, e.g. "Al-Fatihah". */
  nameSimple: string;
  nameArabic: string;
  ayahCount: number;
  revelationPlace: 'makkah' | 'madinah';
  /** Whether the basmalah opens the surah on its own line (every surah but 1 and 9). */
  bismillahPre: boolean;
}

export const SURAH_COUNT = 114;
export const AYAH_COUNT = 6236;

const surahTable: Readonly<Record<string, RawSurah>> = surahNames;

export function surah(number: number): Surah {
  const raw = surahTable[String(number)];
  if (!raw) throw new RangeError(`There is no surah ${number}`);
  return {
    number: raw.id,
    name: raw.name,
    nameSimple: raw.name_simple,
    nameArabic: raw.name_arabic,
    ayahCount: raw.verses_count,
    revelationPlace: raw.revelation_place === 'madinah' ? 'madinah' : 'makkah',
    bismillahPre: raw.bismillah_pre,
  };
}

/** All 114, in order. */
export const surahs: readonly Surah[] = Array.from({ length: SURAH_COUNT }, (_, i) => surah(i + 1));

const ligatureTable: Readonly<Record<string, string>> = ligatures;

/**
 * The text that QUL's surah name font draws as the surah's calligraphic name ("surah002"). It
 * means nothing without that font, so hide it from screen readers and show the name beside it.
 */
export function surahNameGlyph(number: number): string {
  const glyph = ligatureTable[`surah-${number}`];
  if (!glyph) throw new RangeError(`There is no surah ${number}`);
  return glyph;
}
