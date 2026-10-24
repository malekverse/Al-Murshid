// Downloads the translations and tafsir the apps show from QuranEnc.com, which publishes them for
// reuse on its stated terms (https://quranenc.com, "Terms and Policies"): no modification, addition
// or deletion; credit the publisher and QuranEnc.com; give the version number; keep it updated to
// the latest version; report notes to QuranEnc; no inappropriate advertisements.
//
//   pnpm --filter @murshid/content quranenc           -> rewrites quran/source/quranenc/<key>.json
//   pnpm --filter @murshid/content quranenc --check   -> says which keys have a newer version
//
// After a download: update each entry in sources.json (version, date and SHA-256), then rebuild
// with `pnpm --filter @murshid/content quran`. Each file keeps every ayah's translation and
// footnotes exactly as the API returns them (only the Arabic text, which we take from the King Fahd
// Complex, is left out).

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const quranEncKeys = [
  'english_saheeh',
  'french_hameedullah',
  'arabic_mokhtasar',
  'french_mokhtasar',
] as const;

const api = 'https://quranenc.com/api/v1';
const outDir = fileURLToPath(new URL('../quran/source/quranenc/', import.meta.url));
const headers = { 'user-agent': 'Al-Murshid content import (https://al-murshid-pro.netlify.app)' };

interface Version {
  key: string;
  version: string;
  last_update: number;
}
interface ApiAyah {
  sura: string;
  aya: string;
  translation: string;
  footnotes: string | null;
}

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

const versionOf = (key: string) => get<Version>(`/translations/updates?key=${key}`);

if (process.argv.includes('--check')) {
  for (const key of quranEncKeys) {
    const remote = await versionOf(key);
    const local = JSON.parse(readFileSync(`${outDir}${key}.json`, 'utf8')) as Version;
    console.log(
      remote.version === local.version
        ? `${key}: ${local.version}, up to date`
        : `${key}: ${local.version} here, ${remote.version} on QuranEnc`,
    );
  }
} else {
  mkdirSync(outDir, { recursive: true });
  const retrieved = new Date().toISOString().slice(0, 10);
  for (const key of quranEncKeys) {
    const { version, last_update } = await versionOf(key);
    const ayahs: { sura: number; aya: number; translation: string; footnotes: string | null }[] =
      [];
    for (let s = 1; s <= 114; s++) {
      const { result } = await get<{ result: ApiAyah[] }>(`/translation/sura/${key}/${s}`);
      for (const a of result) {
        ayahs.push({
          sura: Number(a.sura),
          aya: Number(a.aya),
          translation: a.translation,
          footnotes: a.footnotes,
        });
      }
    }
    if (ayahs.length !== 6236) throw new Error(`${key}: ${ayahs.length} ayahs`);
    const file = {
      key,
      version,
      last_update,
      retrieved,
      source: `https://quranenc.com/en/browse/${key}`,
      ayahs,
    };
    writeFileSync(`${outDir}${key}.json`, JSON.stringify(file) + '\n');
    console.log(`${key} ${version}: ${ayahs.length} ayahs`);
  }
}
