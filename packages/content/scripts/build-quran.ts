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
//   mushaf/<edition>.json the printed layouts (Phase 5b): v1 1405H, v2 1421H and v4 1441H (604
//                         pages of 15 lines, each word's glyph in its page's font) and indopak
//                         (KFGQPC Nastaleeq, 610 pages, each word's Unicode text)
//   tafsir/<lang>/<n>.json  Al-Mukhtasar's passages and the ayahs each explains
//   search/<lang>.json    plain text per ayah to search in (never displayed)
//   audio/reciters.json, audio/<reciter>/<n>.json   audio links, durations and word timestamps
//   surah-names/<n>.json  each surah's calligraphic name as the outline its font draws (Phase 6)
//   loaders.js (+ .d.ts)  one dynamic import per file, so bundlers split them

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import * as hb from 'harfbuzzjs';
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

// ---------- Mushaf layouts (Phase 5b: four editions) ----------

interface LayoutRow {
  page_number: number;
  line_number: number;
  line_type: 'ayah' | 'surah_name' | 'basmallah';
  is_centered: number;
  first_word_id: number | '';
  last_word_id: number | '';
  surah_number: number | '';
}

/** A line: [0, first word, last word, centered] for text, [1, surah] for a name, [2] basmalah. */
type Line = [0, number, number, 0 | 1] | [1, number] | [2];

/** The surah an id's word opens, if it is the first word of a surah. */
const surahOpenedBy = new Map<number, number>();
for (let s = 1; s <= 114; s++) surahOpenedBy.set(wordStart[surahStart[s - 1]!]!, s);

/**
 * Reads a layout: its pages of lines and the first word of each page. `headers` adds the surah
 * names and basmalahs a layout leaves out (the Indopak one lists text lines only): before each
 * line opening a surah, its name, then the basmalah unless the surah has none (At-Tawbah) or opens
 * with it as its first ayah (Al-Fatihah).
 */
function readLayout(
  file: string,
  pageCount: number,
  options: { headers?: boolean; fix?: (r: LayoutRow) => LayoutRow[] } = {},
) {
  const db = new DatabaseSync(quranDir + 'source/' + file, { readOnly: true });
  const raw = db
    .prepare('SELECT * FROM pages ORDER BY page_number, line_number')
    .all() as unknown as LayoutRow[];
  db.close();
  // The source's own numbering first, before any fix splits a line.
  let page = 0;
  let line = 0;
  for (const r of raw) {
    if (r.page_number !== page) [page, line] = [r.page_number, 0];
    line += 1;
    assert(r.line_number === line, `${file}, page ${r.page_number}: line out of order`);
  }
  const pages: Line[][] = [];
  const pageWordStart: number[] = [];
  let nextWord = 1;
  for (const r of options.fix ? raw.flatMap(options.fix) : raw) {
    const lines = (pages[r.page_number - 1] ??= []);
    if (r.line_type === 'ayah') {
      const first = Number(r.first_word_id);
      const last = Number(r.last_word_id);
      assert(
        first === nextWord && last >= first,
        `${file}, page ${r.page_number}: words must follow on`,
      );
      const opens = surahOpenedBy.get(first);
      if (options.headers && opens && opens !== 1) {
        lines.push([1, opens]);
        if (opens !== 9) lines.push([2]);
      }
      if (pageWordStart[r.page_number - 1] === undefined) pageWordStart[r.page_number - 1] = first;
      nextWord = last + 1;
      lines.push([0, first, last, r.is_centered ? 1 : 0]);
    } else if (r.line_type === 'surah_name') {
      lines.push([1, Number(r.surah_number)]);
    } else {
      assert(r.line_type === 'basmallah', `${file}, page ${r.page_number}: unknown line type`);
      lines.push([2]);
    }
  }
  assert(pages.length === pageCount, `${file}: expected ${pageCount} pages`);
  assert(nextWord === rawWords.length + 1, `${file}: the layout must place every word once`);
  for (const [i, lines] of pages.entries())
    assert(lines.length <= 15, `${file}, page ${i + 1}: over 15 lines`);
  pageWordStart.push(rawWords.length + 1);
  return { pages, pageWordStart };
}

/** Each word's text in a script (by word id - 1): glyph codes for page fonts, or Unicode text. */
function readScript(file: string) {
  const rows = Object.values(
    read<Record<string, { id: number; location: string; text: string }>>(file),
  ).sort((a, b) => a.id - b.id);
  assert(rows.length === rawWords.length, `${file}: every word needs its text`);
  return rows.map((g, i) => {
    assert(g.id === i + 1, `${file}: ids must be contiguous`);
    const w = rawWords[i]!;
    assert(g.location === `${w.surah}:${w.ayah}:${w.word}`, `${file}: word ${g.id} is elsewhere`);
    return g.text;
  });
}

/**
 * Two lines of QUL's Indopak layout are wrong; only their boundaries move, no word changes, and if
 * QUL fixes its file these fail and can go.
 * - Page 304, line 3 starts at word 41,217, though line 2 ends at 41,221: five words ("وَعْدُ رَبِّيْ
 *   جَعَلَهٗ دَكَّآءَ وَكَانَ") would print twice. It starts at 41,222, giving it 11 words like its
 *   neighbours.
 * - Page 261, line 12 runs 17 words from Ibrahim 52 into Al-Hijr 1, though a surah never opens
 *   mid-line. It ends with Ibrahim (10 words); Al-Hijr 1 takes its own line after the surah's name
 *   and basmalah, which fills the page's 15 lines like every other page opening a surah.
 */
const indopakFix = (r: LayoutRow): LayoutRow[] => {
  if (r.page_number === 304 && r.line_number === 3) {
    assert(r.first_word_id === 41217, 'the Indopak page 304 fix no longer applies: remove it');
    return [{ ...r, first_word_id: 41222 }];
  }
  if (r.page_number === 261 && r.line_number === 12) {
    const hijr = wordStart[surahStart[14]!]!;
    assert(
      r.first_word_id === 35284 && r.last_word_id === 35300 && hijr === 35294,
      'the Indopak page 261 fix no longer applies: remove it',
    );
    return [
      { ...r, last_word_id: hijr - 1 },
      { ...r, first_word_id: hijr },
    ];
  }
  return [r];
};

const editions = {
  v1: { ...readLayout('qpc-v1-15-lines.db', 604), glyphs: readScript('qpc-v1.json') },
  v2: { ...readLayout('qpc-v2-15-lines.db', 604), glyphs: readScript('qpc-v2.json') },
  v4: { ...readLayout('qpc-v4-15-lines.db', 604), glyphs: readScript('qpc-v4.json') },
  indopak: {
    ...readLayout('qpc-nastaleeq-15-lines.db', 610, { headers: true, fix: indopakFix }),
    words: readScript('qpc-nastaleeq.json'),
  },
};

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

// ---------- Tafsir (Phase 5b: Al-Mukhtasar) ----------

/**
 * A tafsir file: each ayah key holds its passage ({ text }), or the key of the ayah whose passage
 * covers it. Passages keep their published text; markup is reduced to <b> and <i>, and paragraphs
 * become blank lines.
 */
const tafsirSources = {
  ar: 'tafsir/ar-mukhtasar.json',
  en: 'tafsir/en-mukhtasar.json',
  fr: 'tafsir/fr-mukhtasar.json',
} as const;
function cleanTafsir(text: string, key: string): string {
  const clean = text
    .replace(/<\/p>\s*<p[^>]*>/g, '\n\n')
    .replace(/<\/?p[^>]*>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .trim();
  const left = clean.replace(/<\/?(b|i)>/g, '');
  assert(!/[<>]/.test(left), `tafsir ${key}: unexpected markup`);
  assert(clean.length > 0, `tafsir ${key}: empty passage`);
  return clean;
}
/** Per surah, its passages: [first ayah, last ayah, text]. */
function readTafsir(file: string) {
  const raw = read<Record<string, { text: string } | string>>(file);
  const bySurah: [number, number, string][][] = Array.from({ length: 114 }, () => []);
  for (let s = 1; s <= 114; s++) {
    for (let a = 1; a <= ayahCount(s); a++) {
      const key = `${s}:${a}`;
      const entry = raw[key];
      assert(entry !== undefined, `${file}: nothing for ${key}`);
      const list = bySurah[s - 1]!;
      if (typeof entry === 'string') {
        // Covered by an earlier ayah's passage, which must be the one just before in this surah.
        const [ps, pa] = entry.split(':').map(Number) as [number, number];
        const last = list.at(-1);
        assert(
          ps === s && last && last[0] === pa && last[1] === a - 1,
          `${file}: ${key} points to ${entry}`,
        );
        last[1] = a;
      } else {
        list.push([a, a, cleanTafsir(entry.text, key)]);
      }
    }
  }
  return bySurah;
}
const tafsir = {
  ar: readTafsir(tafsirSources.ar),
  en: readTafsir(tafsirSources.en),
  fr: readTafsir(tafsirSources.fr),
};

// ---------- Recitations ----------

/**
 * The reciters (SPEC 5.5, Phase 5b), surah by surah with timestamps: by word for most, by ayah for
 * a few (QUL has no word timings for them). Style is how they recite: murattal (measured),
 * mujawwad (melodic) or teaching (for memorizing).
 */
const reciters = [
  { id: 'afasy', slug: 'mishari-rashid-al-afasy-streaming', style: 'murattal' },
  { id: 'husary', slug: 'mahmoud-husary-murattal', style: 'murattal' },
  { id: 'abdulbasit', slug: 'abdul-basit-abd-us-samad-murattal', style: 'murattal' },
  { id: 'minshawi', slug: 'muhammad-siddiq-al-minshawy-murattal', style: 'murattal' },
  { id: 'ghamdi', slug: 'saad-ghamadi', style: 'murattal' },
  { id: 'sudais', slug: 'abdur-rahman-as-sudais', style: 'murattal' },
  { id: 'shuraym', slug: 'saud-ash-shuraym', style: 'murattal' },
  { id: 'muaiqly', slug: 'maher-al-muaiqly', style: 'murattal' },
  { id: 'dussary', slug: 'yasser-ad-dussary', style: 'murattal' },
  { id: 'shatri', slug: 'abu-bakr-al-shatri', style: 'murattal' },
  { id: 'rifai', slug: 'hani-ar-rifai', style: 'murattal' },
  { id: 'qatami', slug: 'nasser-al-qatami', style: 'murattal' },
  { id: 'abbad', slug: 'fares-abbad', style: 'murattal' },
  { id: 'jibreel', slug: 'muhammad-jibreel', style: 'murattal' },
  { id: 'jalil', slug: 'khalid-al-jalil', style: 'murattal' },
  { id: 'basfar', slug: 'abdullah-basfar', style: 'murattal' },
  { id: 'minshawiMujawwad', slug: 'muhammad-siddiq-al-minshawi-mujawwad', style: 'mujawwad' },
  { id: 'husaryMuallim', slug: 'mahmoud-husary-muallim', style: 'teaching' },
] as const;
/**
 * Ayahs a reciter's file has no timestamps for, pinned so a new download is noticed. Playback
 * places such an ayah between its neighbours (@murshid/core playbackSpans).
 */
const missingTimings: Partial<Record<(typeof reciters)[number]['id'], string[]>> = {
  minshawiMujawwad: ['32:24'],
};
interface RawSegments {
  segments: [number, number, number][];
  timestamp_from: number;
  timestamp_to: number;
}

// ---------- Write ----------

const files = new Map<string, string>();
const put = (path: string, value: unknown) => files.set(path, JSON.stringify(value) + '\n');

put('index.json', {
  wordStart,
  pageWordStart: Object.fromEntries(
    Object.entries(editions).map(([id, e]) => [id, e.pageWordStart]),
  ),
  juz,
  hizb,
  rub,
  sajda,
});

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
  for (const l of ['ar', 'en', 'fr'] as const) put(`tafsir/${l}/${s}.json`, tafsir[l][s - 1]);
}

for (const [id, e] of Object.entries(editions)) {
  put(
    `mushaf/${id}.json`,
    'glyphs' in e ? { pages: e.pages, glyphs: e.glyphs } : { pages: e.pages, words: e.words },
  );
}

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

const reciterIndex = reciters.map(({ id, slug, style }) => {
  const surahFile = read<Record<string, { audio_url: string; duration: number }>>(
    `recitations/${slug}/surah.json`,
  );
  const segments = read<Record<string, RawSegments>>(`recitations/${slug}/segments.json`);
  // Links end in the surah number, zero-padded on some servers ("010.mp3").
  const [, base, digits] = /^(.*\/)(\d+)\.mp3$/.exec(surahFile['1']!.audio_url)!;
  const pad = digits!.startsWith('0') ? digits!.length : 0;
  const durations: number[] = [];
  let wordTimings = 0;
  for (let s = 1; s <= 114; s++) {
    const entry = surahFile[String(s)];
    const url = `${base}${String(s).padStart(pad, '0')}.mp3`;
    assert(entry?.audio_url === url, `${id}: surah ${s} breaks the link pattern`);
    durations.push(entry.duration);
    const timings = [];
    for (let a = 1; a <= ayahCount(s); a++) {
      const key = `${s}:${a}`;
      const missing = missingTimings[id]?.includes(key) ?? false;
      const seg =
        segments[key] ?? (missing ? { timestamp_from: 0, timestamp_to: 0, segments: [] } : null);
      assert(seg, `${id}: no timestamps for ${key}`);
      assert(!missing || !segments[key], `${id}: ${key} has timestamps now; unpin it`);
      wordTimings += seg.segments.length;
      timings.push([seg.timestamp_from, seg.timestamp_to, seg.segments]);
    }
    put(`audio/${id}/${s}.json`, timings);
  }
  // Word timings for nearly every word, or none at all (ayah by ayah only).
  const words = wordTimings > 0;
  assert(!words || wordTimings > rawWords.length * 0.9, `${id}: word timings are partial`);
  return { id, base, pad, durations, style, words };
});
put('audio/reciters.json', reciterIndex);

// ---------- Surah names as outlines (Phase 6) ----------

// QUL's surah name font draws each name as one ligature ("surah002"). Public web pages draw that
// outline as an SVG path instead of fetching the 200 KB font for a single name. HarfBuzz shapes
// the name with the pinned font (the app's TTF, sources.json), so the outline is the font's own;
// the font itself is not changed. Coordinates are font units, y up.
{
  const bytes = readFileSync(
    fileURLToPath(new URL('../../../apps/mobile/assets/fonts/surah-name-v2.ttf', import.meta.url)),
  );
  const face = new hb.Face(new hb.Blob(new Uint8Array(bytes)));
  const font = new hb.Font(face);
  const { ascender, descender } = font.hExtents();
  for (let n = 1; n <= 114; n++) {
    const buffer = new hb.Buffer();
    buffer.addText(`surah${String(n).padStart(3, '0')}`);
    buffer.guessSegmentProperties();
    hb.shape(font, buffer);
    const infos = buffer.getGlyphInfos();
    const positions = buffer.getGlyphPositions();
    let x = 0;
    const glyphs: [number, number, string][] = [];
    infos.forEach((info, i) => {
      const pos = positions[i]!;
      const d = font.glyphToPath(info.codepoint);
      if (d) glyphs.push([x + pos.xOffset, pos.yOffset, d]);
      x += pos.xAdvance;
    });
    // Most names are one ligature; a few are drawn from several glyphs (al-Ahzab's from six).
    assert(
      glyphs.length > 0 && infos.every((info) => info.codepoint !== 0),
      `surah ${n}: its name has a glyph missing from the font`,
    );
    put(`surah-names/${n}.json`, { upem: face.upem, ascender, descender, width: x, glyphs });
  }
}

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
    `export const tafsir = {`,
    ...(['ar', 'en', 'fr'] as const).map((l) => `  ${l}: ${list(`tafsir/${l}`)},`),
    `};`,
    `export const audio = {`,
    ...reciters.map(({ id }) => `  ${id}: ${list(`audio/${id}`)},`),
    `};`,
    `export const mushaf = {`,
    ...Object.keys(editions).map((id) => `  ${id}: () => import('./mushaf/${id}.json'),`),
    `};`,
    `export const surahName = ${list('surah-names')};`,
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
