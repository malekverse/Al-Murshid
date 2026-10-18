// The Quran text, exactly as the King Fahd Complex publishes it (SPEC 10). Nothing here edits a
// character: these functions only look ayahs up. sources.test.ts pins every file's hash.

import qpcHafs from '../quran/source/qpc-hafs.json';
import surahNames from '../quran/source/surah-names.json';

interface RawAyah {
  verse_key: string;
  surah: number;
  ayah: number;
  text: string;
}

interface RawSurah {
  id: number;
  name: string;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
  bismillah_pre: boolean;
}

export interface Ayah {
  /** "2:255" */
  key: string;
  surah: number;
  ayah: number;
  /**
   * Verbatim QPC Hafs text. It ends with a space (a no-break space in all but 2:72) and the ayah
   * number in Arabic-Indic digits, which the QPC Hafs font draws as the end-of-ayah ornament:
   * render it as it is.
   */
  text: string;
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

const ayahTable: Readonly<Record<string, RawAyah>> = qpcHafs;
const surahTable: Readonly<Record<string, RawSurah>> = surahNames;

export function ayah(surahNumber: number, ayahNumber: number): Ayah {
  const raw = ayahTable[`${surahNumber}:${ayahNumber}`];
  if (!raw) throw new RangeError(`There is no ayah ${surahNumber}:${ayahNumber}`);
  return { key: raw.verse_key, surah: raw.surah, ayah: raw.ayah, text: raw.text };
}

/** Consecutive ayahs of one surah, `from` to `to` inclusive. */
export function ayahs(surahNumber: number, from: number, to: number): Ayah[] {
  return Array.from({ length: to - from + 1 }, (_, i) => ayah(surahNumber, from + i));
}

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
