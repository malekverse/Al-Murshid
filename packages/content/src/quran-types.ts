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

/**
 * The printed mushafs (Phase 5b): the King Fahd Complex's Madani mushaf of 1421H (v2), 1405H (v1)
 * and 1441H (v4, with tajweed colors), each drawn with one font per page, and its 15-line Indopak
 * mushaf (KFGQPC Nastaleeq), drawn with one Unicode font.
 */
export const mushafEditions = ['v2', 'v1', 'v4', 'indopak'] as const;
export type MushafEdition = (typeof mushafEditions)[number];

/** A mushaf drawn with page fonts: its pages, and each word's glyph in its page's font. */
export interface MushafGlyphs {
  /** 604 pages of 15 lines (pages 1 and 2 have 8). */
  pages: MushafLine[][];
  /** Each word's glyph in its page's font, by word id - 1. */
  glyphs: string[];
}

/** A mushaf drawn with one Unicode font: its pages, and each word's text. */
export interface MushafText {
  pages: MushafLine[][];
  /** Each word's published text in this mushaf's script, by word id - 1. */
  words: string[];
}

export type Mushaf = MushafGlyphs | MushafText;

/** @deprecated The 1421H mushaf's shape; every glyph edition has it. */
export type MushafV2 = MushafGlyphs;

/** A surah's tafsir: each passage, with the ayahs it explains. */
export type SurahTafsir = [from: number, to: number, text: string][];

export const reciterIds = [
  'afasy',
  'husary',
  'abdulbasit',
  'minshawi',
  'ghamdi',
  'sudais',
  'shuraym',
  'muaiqly',
  'dussary',
  'shatri',
  'rifai',
  'qatami',
  'abbad',
  'jibreel',
  'jalil',
  'basfar',
  'minshawiMujawwad',
  'husaryMuallim',
] as const;
export type ReciterId = (typeof reciterIds)[number];

export interface ReciterEntry {
  id: ReciterId;
  /** Surah n plays from base + n (zero-padded to `pad` digits) + ".mp3". */
  base: string;
  pad: number;
  /** Seconds, by surah - 1. */
  durations: number[];
  /** Measured (murattal), melodic (mujawwad), or for memorizing (teaching). */
  style: 'murattal' | 'mujawwad' | 'teaching';
  /** Whether the timestamps follow each word, or only each ayah. */
  words: boolean;
}
