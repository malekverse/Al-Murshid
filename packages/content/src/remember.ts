// @murshid/content/remember: the adhkar and duas, from HadeethEnc.com (SPEC 5.6 and 10), one
// chapter at a time.
import * as load from '../remember/generated/loaders.js';
import version from '../remember/generated/version.json';
import type { RememberChapter, RememberHadith } from './remember-types';

export * from './remember-types';

type Lang = 'ar' | 'en' | 'fr';

/** The source and the version its credit names (HadeethEnc dates its releases). */
export const rememberSource: { source: string; version: string } = version;

/** Each chapter with the number of hadiths the language shows. */
export async function loadRememberIndex(lang: Lang) {
  return (await load.indexes[lang]()).default;
}

/** A chapter's hadiths, whole, in the language's order. */
export async function loadRememberChapter(
  lang: Lang,
  chapter: RememberChapter,
): Promise<RememberHadith[]> {
  return (await load.chapters[lang][chapter]()).default;
}

/** The part of a hadith that is said, between « and » in the Arabic, for a reader to find it. */
export function quotedSpans(text: string): { text: string; quoted: boolean }[] {
  const spans: { text: string; quoted: boolean }[] = [];
  let depth = 0;
  let current = '';
  const flush = (quoted: boolean) => {
    if (current) spans.push({ text: current, quoted });
    current = '';
  };
  for (const c of text) {
    if (c === '«' && depth++ === 0) {
      flush(false);
      current = c;
    } else if (c === '»' && depth > 0 && --depth === 0) {
      current += c;
      flush(true);
    } else current += c;
  }
  flush(depth > 0);
  return spans;
}
