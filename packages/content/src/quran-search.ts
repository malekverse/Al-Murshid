// Search within the Quran (SPEC 4): a reference ("2:255"), surah names, the Arabic text and the
// translation. Matching runs on plain forms (search.ts); results always point back to the
// published text.

import { ayahAt, loadSearchText, type AyahRef, type TranslationLanguage } from './quran-data';
import { normalizeArabic, normalizeLatin } from './search';
import { surah, surahs, type Surah } from './surahs';

export interface QuranSearchResult {
  /** A reference typed directly ("36", "2:255", "٢:٢٥٥"). */
  reference: AyahRef | null;
  /** Surahs whose name or number matches. */
  surahs: Surah[];
  /** Ayahs whose text matches every word of the query, in mushaf order. */
  ayahs: AyahRef[];
  /** How many ayahs matched, when there are more than the ones listed. */
  total: number;
}

const arabicLetter = /[؀-ۿ]/;
const toWesternDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));

function parseReference(query: string): AyahRef | null {
  const m = /^\s*(\d{1,3})\s*(?:[:.\s]\s*(\d{1,3}))?\s*$/.exec(toWesternDigits(query));
  if (!m) return null;
  const s = Number(m[1]);
  if (s < 1 || s > 114) return null;
  const a = m[2] ? Number(m[2]) : 1;
  return a >= 1 && a <= surah(s).ayahCount ? { surah: s, ayah: a } : null;
}

const withoutArticle = (word: string) => word.replace(/^(al|an|ar|as|at|ad|az|ash|adh|ath)-/, '');
const surahKeys = surahs.map((s) => ({
  surah: s,
  keys: [
    normalizeLatin(s.nameSimple),
    normalizeLatin(withoutArticle(s.nameSimple.toLowerCase())),
    normalizeLatin(s.name),
    normalizeArabic(s.nameArabic),
    normalizeArabic(s.nameArabic).replace(/^ال/, ''),
  ],
}));

/**
 * Searches the Quran. `translation` picks which translation's text is searched when the query
 * is not Arabic. At most `limit` ayahs are listed.
 */
export async function searchQuran(
  query: string,
  translation: TranslationLanguage,
  limit = 50,
): Promise<QuranSearchResult> {
  const reference = parseReference(query);
  const arabic = arabicLetter.test(query) && !/^[\s٠-٩:.]+$/.test(query);
  const plain = arabic ? normalizeArabic(query) : normalizeLatin(query);
  const empty = { reference, surahs: [], ayahs: [], total: 0 };
  if (reference && !plain.replace(/\d+/g, '').trim()) {
    return { ...empty, surahs: query.includes(':') ? [] : [surah(reference.surah)] };
  }
  if (plain.length < 2) return empty;

  const matchedSurahs = surahKeys
    .filter(({ keys }) =>
      keys.some((k) => k.startsWith(plain) || (plain.length > 2 && k.includes(plain))),
    )
    .map(({ surah: s }) => s);

  const words = plain.split(' ').filter(Boolean);
  const text = await loadSearchText(arabic ? 'ar' : translation);
  const ayahs: AyahRef[] = [];
  let total = 0;
  text.forEach((t, i) => {
    if (!words.every((w) => t.includes(w))) return;
    total++;
    if (ayahs.length < limit) ayahs.push(ayahAt(i));
  });
  return { reference, surahs: matchedSurahs, ayahs, total };
}
