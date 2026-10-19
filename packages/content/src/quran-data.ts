// The Quran's structure and per-surah reading data (quran/generated, built from the sources
// pinned in sources.json). The index is small and loads with this module; words, translations,
// the mushaf and recitation timestamps load on demand, one file at a time.

import index from '../quran/generated/index.json';
import reciterTable from '../quran/generated/audio/reciters.json';
import * as load from '../quran/generated/loaders.js';
import type {
  AyahTiming,
  Mushaf,
  MushafEdition,
  MushafGlyphs,
  ReciterEntry,
  ReciterId,
  SurahTafsir,
  SurahText,
  SurahTranslation,
  SurahTransliteration,
} from './quran-types';
import { AYAH_COUNT, SURAH_COUNT, surah, surahs } from './surahs';

export * from './quran-types';
export * from './surahs';
export { normalizeArabic, normalizeLatin } from './search';

/** Pages in the Madani mushaf (all three Madani editions have 604). */
export const PAGE_COUNT = 604;
/** Pages in each edition: the Indopak mushaf has 610. */
export const editionPages: Record<MushafEdition, number> = {
  v1: 604,
  v2: 604,
  v4: 604,
  indopak: 610,
};
export const JUZ_COUNT = 30;
export const WORD_COUNT = index.wordStart[AYAH_COUNT]! - 1;

export interface AyahRef {
  surah: number;
  ayah: number;
}

/** Global position of each surah's first ayah (0-based, in mushaf order). */
const surahStart: number[] = [];
surahs.reduce((start, s) => (surahStart.push(start), start + s.ayahCount), 0);

/** The ayah's position in the whole Quran, from 0 (1:1) to 6235 (114:6). */
export function ayahIndex(surahNumber: number, ayahNumber: number): number {
  const start = surahStart[surahNumber - 1];
  if (start === undefined || ayahNumber < 1 || ayahNumber > surah(surahNumber).ayahCount) {
    throw new RangeError(`There is no ayah ${surahNumber}:${ayahNumber}`);
  }
  return start + ayahNumber - 1;
}

/** The ayah at a position from ayahIndex. */
export function ayahAt(position: number): AyahRef {
  if (position < 0 || position >= AYAH_COUNT) throw new RangeError(`No ayah at ${position}`);
  const s = lastAtOrBelow(surahStart, position);
  return { surah: s + 1, ayah: position - surahStart[s]! + 1 };
}

/** Index of the last element <= value in an ascending array. */
function lastAtOrBelow(sorted: readonly number[], value: number): number {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (sorted[mid]! <= value) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** A word's id (1 to 83,668), shared by every script and the mushaf layout. Words count from 1. */
export function wordId(surahNumber: number, ayahNumber: number, word: number): number {
  return index.wordStart[ayahIndex(surahNumber, ayahNumber)]! + word - 1;
}

/** How many words an ayah has, its number (the last) included. */
export function ayahLength(surahNumber: number, ayahNumber: number): number {
  const i = ayahIndex(surahNumber, ayahNumber);
  return index.wordStart[i + 1]! - index.wordStart[i]!;
}

export function wordAt(id: number): AyahRef & { word: number } {
  const position = lastAtOrBelow(index.wordStart, id);
  return {
    ...ayahAt(Math.min(position, AYAH_COUNT - 1)),
    word: id - index.wordStart[position]! + 1,
  };
}

const pageStarts = index.pageWordStart as Record<MushafEdition, number[]>;

/** The page a word sits on, in an edition (the 1421H mushaf by default). */
export function pageOfWord(id: number, edition: MushafEdition = 'v2'): number {
  return lastAtOrBelow(pageStarts[edition], id) + 1;
}

/** The page an ayah starts on. */
export function pageOf(
  surahNumber: number,
  ayahNumber: number,
  edition: MushafEdition = 'v2',
): number {
  return pageOfWord(wordId(surahNumber, ayahNumber, 1), edition);
}

/** The first and last word ids on a page of an edition. */
export function pageWords(
  page: number,
  edition: MushafEdition = 'v2',
): [first: number, last: number] {
  const first = pageStarts[edition][page - 1];
  const next = pageStarts[edition][page];
  if (first === undefined || next === undefined) throw new RangeError(`There is no page ${page}`);
  return [first, next - 1];
}

/** The first ayah that starts on a page (or the one running onto it). */
export function firstAyahOfPage(page: number, edition: MushafEdition = 'v2'): AyahRef {
  const id = pageStarts[edition][page - 1];
  if (id === undefined || page > editionPages[edition]) {
    throw new RangeError(`There is no page ${page}`);
  }
  const w = wordAt(id);
  return { surah: w.surah, ayah: w.ayah };
}

export type Division = 'juz' | 'hizb' | 'rub';

/** Which juz, hizb or rub (from 1) an ayah belongs to. */
export function divisionOf(kind: Division, surahNumber: number, ayahNumber: number): number {
  return lastAtOrBelow(index[kind], ayahIndex(surahNumber, ayahNumber)) + 1;
}

/** Where a juz, hizb or rub (from 1) starts. */
export function divisionStart(kind: Division, number: number): AyahRef {
  const start = index[kind][number - 1];
  if (start === undefined) throw new RangeError(`There is no ${kind} ${number}`);
  return ayahAt(start);
}

/** Whether reciting the ayah calls for a prostration, and of which kind. */
export function sajdaOf(surahNumber: number, ayahNumber: number): string | null {
  const position = ayahIndex(surahNumber, ayahNumber);
  const found = (index.sajda as [number, string][]).find(([p]) => p === position);
  return found ? found[1] : null;
}

// ---------- Words ----------

export interface Word {
  text: string;
  /** What follows the word in the published text: a space, a no-break space or nothing. */
  after: '' | ' ' | ' ';
}

const separator = { s: ' ', n: ' ', j: '' } as const;

/**
 * An ayah's words, ready to render one by one. Joined with their separators they are the
 * published ayah text, byte for byte; the last word is the ayah number.
 */
export function ayahWords(text: SurahText, ayahNumber: number): Word[] {
  const words = text.w[ayahNumber - 1];
  if (!words) throw new RangeError(`There is no ayah ${ayahNumber} here`);
  const seps = text.x?.[ayahNumber] ?? 's'.repeat(Math.max(0, words.length - 2)) + 'n';
  return words.map((w, i) => ({
    text: w,
    after: i < seps.length ? separator[seps[i] as keyof typeof separator] : '',
  }));
}

// ---------- Loading ----------

const cache = new Map<string, Promise<unknown>>();
function once<T>(key: string, loader: (() => Promise<{ default: T }>) | null | undefined) {
  if (!loader) return Promise.reject(new RangeError(`Nothing to load for ${key}`));
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = loader().then((m) => m.default);
    // A failed load (offline web, for instance) may succeed later.
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}

export type TranslationLanguage = 'en' | 'fr';

export const loadSurahText = (n: number) => once<SurahText>(`text/${n}`, load.text[n]);
export const loadTranslation = (lang: TranslationLanguage, n: number) =>
  once<SurahTranslation>(`${lang}/${n}`, load[lang][n]);
export const loadTransliteration = (n: number) =>
  once<SurahTransliteration>(`translit/${n}`, load.translit[n]);
export const loadMushaf = (edition: MushafEdition) =>
  once<Mushaf>(`mushaf/${edition}`, load.mushaf[edition]);
/** The 1421H mushaf. */
export const loadMushafV2 = () => loadMushaf('v2') as Promise<MushafGlyphs>;
/** Whether an edition is drawn with page fonts (glyphs) or one Unicode font (words). */
export const isGlyphMushaf = (m: Mushaf): m is MushafGlyphs => 'glyphs' in m;
export type TafsirLanguage = 'ar' | 'en' | 'fr';
export const loadTafsir = (lang: TafsirLanguage, n: number) =>
  once<SurahTafsir>(`tafsir/${lang}/${n}`, load.tafsir[lang][n]);
/** A run of tafsir text, bold or italic as published (the only markup kept). */
export interface TafsirRun {
  text: string;
  bold: boolean;
  italic: boolean;
}

/** A passage's text as runs, so it is drawn without ever parsing HTML in the apps. */
export function tafsirRuns(text: string): TafsirRun[] {
  const runs: TafsirRun[] = [];
  let bold = false;
  let italic = false;
  for (const part of text.split(/(<\/?[bi]>)/)) {
    if (part === '<b>' || part === '</b>') bold = part === '<b>';
    else if (part === '<i>' || part === '</i>') italic = part === '<i>';
    else if (part) runs.push({ text: part, bold, italic });
  }
  return runs;
}

/** The tafsir passage explaining an ayah, with the ayahs it covers. */
export function tafsirOf(
  t: SurahTafsir,
  ayah: number,
): { from: number; to: number; text: string } | null {
  const found = t.find(([from, to]) => from <= ayah && ayah <= to);
  return found ? { from: found[0], to: found[1], text: found[2] } : null;
}
export const loadTimings = (reciter: ReciterId, n: number) =>
  once<AyahTiming[]>(`audio/${reciter}/${n}`, load.audio[reciter][n]);
/** Plain text of every ayah in mushaf order, to search in (never shown). */
export const loadSearchText = (lang: 'ar' | TranslationLanguage) =>
  once<string[]>(`search/${lang}`, load.search[lang]);

// ---------- Recitations ----------

const reciterEntries = reciterTable as ReciterEntry[];

export function reciter(id: ReciterId): ReciterEntry {
  const r = reciterEntries.find((e) => e.id === id);
  if (!r) throw new RangeError(`Unknown reciter ${id}`);
  return r;
}

/** Where a surah's recording streams from (the publisher's server for now; SPEC 9, 10). */
export function audioUrl(id: ReciterId, surahNumber: number): string {
  const r = reciter(id);
  if (surahNumber < 1 || surahNumber > SURAH_COUNT) throw new RangeError(`No surah ${surahNumber}`);
  return `${r.base}${String(surahNumber).padStart(r.pad, '0')}.mp3`;
}
