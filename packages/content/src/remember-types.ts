/**
 * The adhkar and duas chapters, each one of HadeethEnc's remembrance chapters (DECISIONS,
 * "Content sources"), in the order the apps list them.
 */
export const rememberChapters = [
  { slug: 'morning-evening', hadeethEnc: '301' },
  { slug: 'sleep', hadeethEnc: '293' },
  { slug: 'prayer', hadeethEnc: '465' },
  { slug: 'anytime', hadeethEnc: '302' },
  { slug: 'home', hadeethEnc: '303' },
  { slug: 'mosque', hadeethEnc: '306' },
  { slug: 'bathroom', hadeethEnc: '305' },
  { slug: 'occasions', hadeethEnc: '308' },
  { slug: 'hard-times', hadeethEnc: '307' },
  { slug: 'supplications', hadeethEnc: '313' },
] as const;
export type RememberChapter = (typeof rememberChapters)[number]['slug'];

/** One hadith as a language shows it, whole and unchanged (scripts/build-remember.ts). */
export interface RememberHadith {
  id: string;
  /** The language of the texts below: the reader's, or English where French has none yet. */
  lang: 'ar' | 'en' | 'fr';
  title: string;
  text: string;
  attribution: string;
  grade: string;
  explanation: string;
  /** The lessons HadeethEnc draws from the hadith. */
  hints: string[];
  /** Arabic only: the meaning of its rarer words. */
  meanings?: { word: string; meaning: string }[];
  /** The Arabic it comes from, with its full reference (collection, volume, page and number). */
  arabic: { text: string; attribution: string; grade: string; reference: string };
  link: string;
}
