// The shapes of quran/generated (scripts/build-quran.ts writes them).

/** Each ayah's words, cut from the published ayah text; the last word is the ayah number. */
export interface SurahText {
  w: string[][];
  /**
   * Separators that differ from the usual "s…sn" (spaces, then a no-break space before the
   * number), by ayah number: "s" a space, "n" a no-break space, "j" nothing.
   */
  x?: Record<string, string>;
}

/** Translation text, or a footnote mark: [the mark as printed, the footnote's id]. */
export type TranslationSegment = string | [mark: string, footnote: string];

export interface SurahTranslation {
  /** Each ayah's translation. */
  t: TranslationSegment[][];
  /** Footnotes by id. */
  f: Record<string, string>;
  /** Word-by-word meanings, aligned with the words (without the ayah number); null if none. */
  m: (string | null)[][];
}

/** Word-by-word transliteration, aligned like the meanings. */
export type SurahTransliteration = (string | null)[][];

/** One ayah in a surah recording, in milliseconds: [from, to, [word, start, end][]]. */
export type AyahTiming = [from: number, to: number, words: [number, number, number][]];

/** A mushaf line: [0, first word, last word, centered] text, [1, surah] a name, [2] basmalah. */
export type MushafLine = [0, number, number, 0 | 1] | [1, number] | [2];

export interface MushafV2 {
  /** 604 pages of 15 lines (pages 1 and 2 have 8). */
  pages: MushafLine[][];
  /** Each word's glyph in its page's V2 font, by word id - 1. */
  glyphs: string[];
}

export const reciterIds = ['afasy', 'husary', 'abdulbasit', 'minshawi', 'ghamdi'] as const;
export type ReciterId = (typeof reciterIds)[number];

export interface ReciterEntry {
  id: ReciterId;
  /** Surah n plays from base + n (zero-padded to `pad` digits) + ".mp3". */
  base: string;
  pad: number;
  /** Seconds, by surah - 1. */
  durations: number[];
}
