// Types for loaders.js, which scripts/build-quran.ts generates. Written by hand.
import type {
  AyahTiming,
  MushafV2,
  ReciterId,
  SurahText,
  SurahTranslation,
  SurahTransliteration,
} from '../../src/quran-types';

type Load<T> = () => Promise<{ default: T }>;
/** Indexed by surah number; index 0 is empty. */
type BySurah<T> = readonly (Load<T> | null)[];

export declare const text: BySurah<SurahText>;
export declare const en: BySurah<SurahTranslation>;
export declare const fr: BySurah<SurahTranslation>;
export declare const translit: BySurah<SurahTransliteration>;
export declare const audio: Record<ReciterId, BySurah<AyahTiming[]>>;
export declare const mushafV2: Load<MushafV2>;
export declare const search: Record<'ar' | 'en' | 'fr', Load<string[]>>;
