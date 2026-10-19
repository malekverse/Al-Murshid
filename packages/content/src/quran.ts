// The Quran text, exactly as the King Fahd Complex publishes it (SPEC 10). Nothing here edits a
// character: these functions only look ayahs up. sources.test.ts pins every file's hash.

import qpcHafs from '../quran/source/qpc-hafs.json';

export * from './surahs';

interface RawAyah {
  verse_key: string;
  surah: number;
  ayah: number;
  text: string;
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

const ayahTable: Readonly<Record<string, RawAyah>> = qpcHafs;

export function ayah(surahNumber: number, ayahNumber: number): Ayah {
  const raw = ayahTable[`${surahNumber}:${ayahNumber}`];
  if (!raw) throw new RangeError(`There is no ayah ${surahNumber}:${ayahNumber}`);
  return { key: raw.verse_key, surah: raw.surah, ayah: raw.ayah, text: raw.text };
}

/** Consecutive ayahs of one surah, `from` to `to` inclusive. */
export function ayahs(surahNumber: number, from: number, to: number): Ayah[] {
  return Array.from({ length: to - from + 1 }, (_, i) => ayah(surahNumber, from + i));
}
