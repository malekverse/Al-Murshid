// Downloads the adhkar and duas from HadeethEnc.com, the Encyclopedia of Translated Prophetic
// Hadiths, which publishes them for reuse on stated terms (its home page, "Terms and Policies"):
// no modification, addition or deletion; credit the publisher and HadeethEnc.com; give the
// version; keep it updated to the latest version; report notes to HadeethEnc; no inappropriate
// advertisements.
//
//   pnpm --filter @murshid/content hadeethenc   -> rewrites remember/source/hadeethenc.json
//
// Then update its entry in sources.json (date and SHA-256). HadeethEnc dates its releases instead
// of numbering them, so the version is the day of the download. Each hadith keeps every field the
// API returns, in Arabic and in each translation that exists (only the list of the 70 languages
// it is translated into is left out).

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The remembrance chapters of HadeethEnc ("Jurisprudence of Supplications and Remembrance of
 * Allah", and the sleep and prayer chapters), in the order the apps list them.
 */
export const hadeethEncCategories = [
  '301', // Morning and evening dhikr
  '293', // Sleeping and waking
  '465', // Dhikr during the prayer
  '302', // Timeless dhikr
  '303', // Entering and leaving the house
  '306', // Entering and leaving the mosque
  '305', // Entering and leaving the bathroom
  '308', // Special occasions
  '307', // Hard times
  '313', // Reported supplications
] as const;

const api = 'https://hadeethenc.com/api/v1';
const languages = ['ar', 'en', 'fr'] as const;
const outFile = fileURLToPath(new URL('../remember/source/hadeethenc.json', import.meta.url));
const headers = { 'user-agent': 'Al-Murshid content import (https://al-murshid-pro.netlify.app)' };

async function get<T>(path: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(api + path, { headers });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return (await response.json()) as T;
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}
type Hadith = Record<string, unknown> & { id: string; translations?: string[] };

const titles = Object.fromEntries(
  await Promise.all(
    languages.map(
      async (l) =>
        [
          l,
          new Map(
            (await get<Category[]>(`/categories/list/?language=${l}`)).map((c) => [c.id, c.title]),
          ),
        ] as const,
    ),
  ),
) as Record<(typeof languages)[number], Map<string, string>>;

const categories = [];
const ids: string[] = [];
for (const id of hadeethEncCategories) {
  const list = await get<{ data: { id: string }[]; meta: { last_page: number } }>(
    `/hadeeths/list/?language=ar&category_id=${id}&page=1&per_page=200`,
  );
  if (list.meta.last_page !== 1) throw new Error(`category ${id}: more than one page`);
  const hadiths = list.data.map((h) => h.id);
  for (const h of hadiths) if (!ids.includes(h)) ids.push(h);
  categories.push({
    id,
    title: Object.fromEntries(languages.map((l) => [l, titles[l].get(id) ?? null])),
    hadiths,
  });
}

const hadiths = [];
for (const id of ids) {
  const ar = await get<Hadith>(`/hadeeths/one/?language=ar&id=${id}`);
  const available = new Set(ar.translations);
  const entry: Record<string, unknown> = { id };
  for (const l of languages) {
    if (l !== 'ar' && !available.has(l)) {
      entry[l] = null;
      continue;
    }
    const fields = {
      ...(l === 'ar' ? ar : await get<Hadith>(`/hadeeths/one/?language=${l}&id=${id}`)),
    };
    delete fields.translations;
    entry[l] = fields;
  }
  hadiths.push(entry);
}

mkdirSync(fileURLToPath(new URL('../remember/source/', import.meta.url)), { recursive: true });
const retrieved = new Date().toISOString().slice(0, 10);
writeFileSync(
  outFile,
  JSON.stringify({ source: 'https://hadeethenc.com', retrieved, categories, hadiths }) + '\n',
);
console.log(
  `${hadiths.length} hadiths in ${categories.length} chapters; in French: ${
    hadiths.filter((h) => (h as { fr: unknown }).fr).length
  }, in English: ${hadiths.filter((h) => (h as { en: unknown }).en).length}`,
);
