// Builds quran/generated/ from the pinned files in quran/source (see sources.json). Everything
// written here is derived, never edited: words keep their published characters, and the
// separators between them are read off the published ayah text, so the words rebuild every ayah
// byte for byte (quran-data.test.ts checks). Run after replacing a source file:
//
//   pnpm --filter @murshid/content quran            -> rewrites quran/generated
//   pnpm --filter @murshid/content quran:check      -> fails if quran/generated is stale (CI)
//
// Output, all minified JSON, loaded per surah so neither app parses the whole Quran at once:
//   index.json            word, page, juz, hizb, rub and sajdah boundaries
//   text/<n>.json         each ayah's words (QPC Hafs) and any separator that is not the default
//   en/<n>.json fr/<n>.json   the translation with its footnotes, and word-by-word meanings
//   translit/<n>.json     word-by-word transliteration
//   mushaf-v2.json        the 1421H layout: 604 pages of 15 lines, and each word's V2 glyph
//   search/<lang>.json    plain text per ayah to search in (never displayed)
//   audio/reciters.json, audio/<reciter>/<n>.json   audio links, durations and word timestamps
//   loaders.js (+ .d.ts)  one dynamic import per file, so bundlers split them

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { normalizeArabic, normalizeLatin } from '../src/search';

const quranDir = fileURLToPath(new URL('../quran/', import.meta.url));
const outDir = quranDir + 'generated/';
const check = process.argv.includes('--check');

const read = <T>(path: string): T =>
  JSON.parse(readFileSync(quranDir + 'source/' + path, 'utf8')) as T;
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// ---------- Surahs and ayahs ----------

interface RawSurah {
  id: number;
  verses_count: number;
}
const surahs = Object.values(read<Record<string, RawSurah>>('surah-names.json')).sort(
  (a, b) => a.id - b.id,
);
assert(surahs.length === 114, 'expected 114 surahs');
const ayahCount = (s: number) => surahs[s - 1]!.verses_count;

/** Global ayah index (0-based, in mushaf order) of the first ayah of each surah. */
const surahStart: number[] = [];
let total = 0;
for (const s of surahs) {
  surahStart.push(total);
  total += s.verses_count;
}
assert(total === 6236, 'expected 6,236 ayahs');
const ayahIndex = (key: string) => {
  const [s, a] = key.split(':').map(Number) as [number, number];
  assert(a >= 1 && a <= ayahCount(s), `no ayah ${key}`);
  return surahStart[s - 1]! + a - 1;
};

const ayahText = read<Record<string, { text: string }>>('qpc-hafs.json');

// ---------- Words (QPC Hafs, word by word) ----------

interface RawWord {
  id: number;
  surah: string;
  ayah: string;
  word: string;
  text: string;
}
const rawWords = Object.values(read<Record<string, RawWord>>('qpc-hafs-word-by-word.json')).sort(
  (a, b) => a.id - b.id,
);
/** Words of each ayah, by global ayah index; the last one is the ayah number. */
const words: string[][] = Array.from({ length: total }, () => []);
const wordStart: number[] = new Array<number>(total + 1);
rawWords.forEach((w, i) => {
  assert(w.id === i + 1, `word ids must be contiguous (at ${w.id})`);
  const index = ayahIndex(`${w.surah}:${w.ayah}`);
  assert(
    Number(w.word) === words[index]!.length + 1,
    `word ${w.surah}:${w.ayah}:${w.word} out of order`,
  );
  if (words[index]!.length === 0) wordStart[index] = w.id;
  words[index]!.push(w.text);
});
wordStart[total] = rawWords.length + 1;

const isSpace = (c: string | undefined) => c === ' ' || c === ' ';

/**
 * Cuts the published ayah text into its words, using the word-by-word file only for the
 * boundaries. The two differ in spacing alone: the word file writes "۞ إِنَّ" with a plain space
 * where the ayah has a no-break space, and "خُشُوعٗا ۩" where the ayah has no space at all. So
 * every character shown comes from the ayah text. Separators: "s" a space, "n" a no-break
 * space, "j" nothing.
 */
function split(text: string, ws: string[], key: string): { words: string[]; seps: string } {
  let pos = 0;
  let seps = '';
  const words = ws.map((w, i) => {
    const start = pos;
    for (let k = 0; k < w.length; k++) {
      const c = w[k];
      if (isSpace(c)) {
        if (isSpace(text[pos])) pos += 1;
        continue;
      }
      assert(text[pos] === c, `${key}: word ${i + 1} differs from the ayah`);
      pos += 1;
    }
    const word = text.slice(start, pos);
    if (i < ws.length - 1) {
      const c = text[pos];
      seps += c === ' ' ? 's' : c === ' ' ? 'n' : 'j';
      if (isSpace(c)) pos += 1;
    }
    return word;
  });
  assert(pos === text.length, `${key}: the words do not cover the ayah text`);
  return { words, seps };
}
const defaultSeparators = (n: number) => 's'.repeat(Math.max(0, n - 2)) + 'n';

// ---------- Translations and word-by-word ----------

type Segment = string | [mark: string, footnote: string];
interface RawTranslation {
  t: string;
  f: Record<string, string>;
}
function parseTranslation(t: string, key: string): Segment[] {
  const out: Segment[] = [];
  const re = /<sup foot_note="(\d+)">([^<]*)<\/sup>/g;
  let last = 0;
  for (const m of t.matchAll(re)) {
    if (m.index > last) out.push(t.slice(last, m.index));
    out.push([m[2]!, m[1]!]);
    last = m.index + m[0].length;
  }
  if (last < t.length) out.push(t.slice(last));
  for (const s of out)
    assert(typeof s !== 'string' || !/[<>]/.test(s), `${key}: unexpected markup`);
  return out;
}
function cleanFootnote(text: string, id: string): string {
  const clean = text
    .replace(/<\/p>\s*<p>/g, '\n\n')
    .replace(/<\/?p>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .trim();
  assert(!/[<>]/.test(clean), `footnote ${id}: unexpected markup`);
  return clean;
}
const plainTranslation = (segments: Segment[]) =>
  segments.filter((s): s is string => typeof s === 'string').join('');

const translations = {
  en: read<Record<string, RawTranslation>>(
    'translations/en-sahih-international-with-footnote-tags.json',
  ),
  fr: read<Record<string, RawTranslation>>(
    'translations/quran-fr-hamidullah-with-footnote-tags.json',
  ),
};
const meanings = {
  en: read<Record<string, string>>('wbw/english-wbw-translation.json'),
  fr: read<Record<string, string>>('wbw/french-wbw-translation.json'),
};
const transliteration = read<Record<string, string>>('wbw/english-wbw-transliteration.json');

// ---------- Mushaf layout (KFGQPC V2, 1421H) ----------

interface LayoutRow {
  page_number: number;
  line_number: number;
  line_type: 'ayah' | 'surah_name' | 'basmallah';
  is_centered: number;
  first_word_id: number | '';
  last_word_id: number | '';
  surah_number: number | '';
}
const layoutDb = new DatabaseSync(quranDir + 'source/qpc-v2-15-lines.db', { readOnly: true });
const rows = layoutDb
  .prepare('SELECT * FROM pages ORDER BY page_number, line_number')
  .all() as unknown as LayoutRow[];
layoutDb.close();

/** A line: [0, first word, last word, centered] for text, [1, surah] for a name, [2] basmalah. */
type Line = [0, number, number, 0 | 1] | [1, number] | [2];
const pages: Line[][] = [];
const pageWordStart: number[] = [];
let nextWord = 1;
for (const r of rows) {
  const lines = (pages[r.page_number - 1] ??= []);
  assert(
    r.line_number === lines.length + 1,
    `page ${r.page_number}: line ${r.line_number} out of order`,
  );
  if (r.line_type === 'ayah') {
    const first = Number(r.first_word_id);
    const last = Number(r.last_word_id);
    assert(first === nextWord && last >= first, `page ${r.page_number}: words must follow on`);
    if (pageWordStart[r.page_number - 1] === undefined) pageWordStart[r.page_number - 1] = first;
    nextWord = last + 1;
    lines.push([0, first, last, r.is_centered ? 1 : 0]);
  } else if (r.line_type === 'surah_name') {
    lines.push([1, Number(r.surah_number)]);
  } else {
    assert(r.line_type === 'basmallah', `page ${r.page_number}: unknown line type`);
    lines.push([2]);
  }
}
assert(pages.length === 604, 'expected 604 pages');
assert(nextWord === rawWords.length + 1, 'the layout must place every word once');
pageWordStart.push(rawWords.length + 1);

const glyphRows = Object.values(
  read<Record<string, { id: number; text: string }>>('qpc-v2.json'),
).sort((a, b) => a.id - b.id);
assert(glyphRows.length === rawWords.length, 'every word needs its V2 glyph');
const glyphs = glyphRows.map((g, i) => {
  assert(g.id === i + 1, 'glyph ids must be contiguous');
  return g.text;
});

// ---------- Juz, hizb, rub, sajdah ----------

const starts = (file: string, field: string) =>
  Object.values(read<Record<string, Record<string, unknown>>>(`metadata/${file}`))
    .sort((a, b) => Number(a[field]) - Number(b[field]))
    .map((m) => ayahIndex(String(m.first_verse_key)));
const juz = starts('quran-metadata-juz.json', 'juz_number');
const hizb = starts('quran-metadata-hizb.json', 'hizb_number');
const rub = starts('quran-metadata-rub.json', 'rub_number');
assert(juz.length === 30 && hizb.length === 60 && rub.length === 240, 'unexpected divisions');
const sajda = Object.values(
  read<Record<string, { sajdah_number: number; verse_key: string; sajdah_type: string }>>(
    'metadata/quran-metadata-sajda.json',
  ),
)
  .sort((a, b) => a.sajdah_number - b.sajdah_number)
  .map((s) => [ayahIndex(s.verse_key), s.sajdah_type] as const);

// ---------- Recitations ----------

/** The five launch reciters (SPEC 5.5), each surah by surah with word timestamps. */
const reciters = [
  { id: 'afasy', slug: 'mishari-rashid-al-afasy-streaming' },
  { id: 'husary', slug: 'mahmoud-husary-murattal' },
  { id: 'abdulbasit', slug: 'abdul-basit-abd-us-samad-murattal' },
  { id: 'minshawi', slug: 'muhammad-siddiq-al-minshawy-murattal' },
  { id: 'ghamdi', slug: 'saad-ghamadi' },
] as const;
interface RawSegments {
  segments: [number, number, number][];
  timestamp_from: number;
  timestamp_to: number;
}

// ---------- Write ----------

const files = new Map<string, string>();
const put = (path: string, value: unknown) => files.set(path, JSON.stringify(value) + '\n');

put('index.json', { wordStart, pageWordStart, juz, hizb, rub, sajda });

for (let s = 1; s <= 114; s++) {
  const first = surahStart[s - 1]!;
  const n = ayahCount(s);
  const text: { w: string[][]; x?: Record<number, string> } = { w: [] };
  const lang = {
    en: { t: [] as Segment[][], f: {} as Record<string, string>, m: [] as (string | null)[][] },
    fr: { t: [] as Segment[][], f: {} as Record<string, string>, m: [] as (string | null)[][] },
  };
  const translit: (string | null)[][] = [];
  for (let a = 1; a <= n; a++) {
    const key = `${s}:${a}`;
    const { words: ws, seps } = split(ayahText[key]!.text, words[first + a - 1]!, key);
    text.w.push(ws);
    if (seps !== defaultSeparators(ws.length)) (text.x ??= {})[a] = seps;
    // Meanings and transliteration for each word, not the ayah number at the end.
    const at = (table: Record<string, string>) =>
      ws.slice(0, -1).map((_, w) => table[`${key}:${w + 1}`] ?? null);
    for (const l of ['en', 'fr'] as const) {
      const raw = translations[l][key];
      assert(raw, `${l}: no translation of ${key}`);
      lang[l].t.push(parseTranslation(raw.t, key));
      for (const [id, note] of Object.entries(raw.f)) lang[l].f[id] = cleanFootnote(note, id);
      lang[l].m.push(at(meanings[l]));
    }
    translit.push(at(transliteration));
  }
  put(`text/${s}.json`, text);
  put(`en/${s}.json`, lang.en);
  put(`fr/${s}.json`, lang.fr);
  put(`translit/${s}.json`, translit);
}

put('mushaf-v2.json', { pages, glyphs });

const search = { ar: [] as string[], en: [] as string[], fr: [] as string[] };
for (let i = 0; i < total; i++) search.ar.push(normalizeArabic(words[i]!.slice(0, -1).join(' ')));
for (let s = 1; s <= 114; s++) {
  for (let a = 1; a <= ayahCount(s); a++) {
    for (const l of ['en', 'fr'] as const) {
      search[l].push(
        normalizeLatin(plainTranslation(parseTranslation(translations[l][`${s}:${a}`]!.t, ''))),
      );
    }
  }
}
for (const l of ['ar', 'en', 'fr'] as const) put(`search/${l}.json`, search[l]);

const reciterIndex = reciters.map(({ id, slug }) => {
  const surahFile = read<Record<string, { audio_url: string; duration: number }>>(
    `recitations/${slug}/surah.json`,
  );
  const segments = read<Record<string, RawSegments>>(`recitations/${slug}/segments.json`);
  // Links end in the surah number, zero-padded on some servers ("010.mp3").
  const [, base, digits] = /^(.*\/)(\d+)\.mp3$/.exec(surahFile['1']!.audio_url)!;
  const pad = digits!.startsWith('0') ? digits!.length : 0;
  const durations: number[] = [];
  for (let s = 1; s <= 114; s++) {
    const entry = surahFile[String(s)];
    const url = `${base}${String(s).padStart(pad, '0')}.mp3`;
    assert(entry?.audio_url === url, `${id}: surah ${s} breaks the link pattern`);
    durations.push(entry.duration);
    const timings = [];
    for (let a = 1; a <= ayahCount(s); a++) {
      const seg = segments[`${s}:${a}`];
      assert(seg, `${id}: no timestamps for ${s}:${a}`);
      timings.push([seg.timestamp_from, seg.timestamp_to, seg.segments]);
    }
    put(`audio/${id}/${s}.json`, timings);
  }
  return { id, base, pad, durations };
});
put('audio/reciters.json', reciterIndex);

// Loaders: literal paths, so web and native bundlers can split every file.
const list = (dir: string) =>
  `[null, ${Array.from({ length: 114 }, (_, i) => `() => import('./${dir}/${i + 1}.json')`).join(', ')}]`;
files.set(
  'loaders.js',
  [
    '// Generated by scripts/build-quran.ts. Do not edit.',
    `export const text = ${list('text')};`,
    `export const en = ${list('en')};`,
    `export const fr = ${list('fr')};`,
    `export const translit = ${list('translit')};`,
    `export const audio = {`,
    ...reciters.map(({ id }) => `  ${id}: ${list(`audio/${id}`)},`),
    `};`,
    `export const mushafV2 = () => import('./mushaf-v2.json');`,
    `export const search = {`,
    ...(['ar', 'en', 'fr'] as const).map((l) => `  ${l}: () => import('./search/${l}.json'),`),
    `};`,
    '',
  ].join('\n'),
);

// ---------- Compare or write ----------

const existing = new Set<string>();
const walk = (dir: string, prefix = '') => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(dir + e.name + '/', prefix + e.name + '/');
    else existing.add(prefix + e.name);
  }
};
try {
  walk(outDir);
} catch {
  // Nothing generated yet.
}
existing.delete('loaders.d.ts'); // Written by hand: the types of what loaders.js returns.

if (check) {
  const stale = [...files].filter(([path, body]) => {
    try {
      return readFileSync(outDir + path, 'utf8') !== body;
    } catch {
      return true;
    }
  });
  const extra = [...existing].filter((p) => !files.has(p));
  if (stale.length || extra.length) {
    console.error(
      `quran/generated is stale (${stale.length} changed, ${extra.length} extra). Run: pnpm --filter @murshid/content quran`,
    );
    process.exit(1);
  }
  console.log(`quran/generated is up to date (${files.size} files).`);
} else {
  for (const p of existing) if (!files.has(p)) rmSync(outDir + p);
  for (const [path, body] of files) {
    mkdirSync(outDir + path.slice(0, path.lastIndexOf('/') + 1), { recursive: true });
    writeFileSync(outDir + path, body);
  }
  console.log(`Wrote ${files.size} files to quran/generated.`);
}
