import { describe, expect, it } from 'vitest';
import { ayah } from './quran';
import {
  AYAH_COUNT,
  audioUrl,
  ayahAt,
  ayahIndex,
  ayahWords,
  divisionOf,
  divisionStart,
  firstAyahOfPage,
  loadMushafV2,
  loadSearchText,
  loadSurahText,
  loadTimings,
  loadTranslation,
  loadTransliteration,
  PAGE_COUNT,
  pageOf,
  pageOfWord,
  reciter,
  reciterIds,
  sajdaOf,
  surah,
  surahNameGlyph,
  surahs,
  WORD_COUNT,
  wordAt,
  wordId,
} from './quran-data';

describe('words (KFGQPC Hafs, word by word)', () => {
  // SPEC 10: what the reader renders word by word is the published ayah text, byte for byte.
  it('rebuild every published ayah exactly', async () => {
    let checked = 0;
    for (const s of surahs) {
      const text = await loadSurahText(s.number);
      expect(text.w).toHaveLength(s.ayahCount);
      for (let a = 1; a <= s.ayahCount; a++) {
        const joined = ayahWords(text, a)
          .map((w) => w.text + w.after)
          .join('');
        expect(joined, `${s.number}:${a}`).toBe(ayah(s.number, a).text);
        checked++;
      }
    }
    expect(checked).toBe(AYAH_COUNT);
  });

  it('number 83,668, with ids shared by every script and the layout', () => {
    expect(WORD_COUNT).toBe(83668);
    expect(wordId(1, 1, 1)).toBe(1);
    expect(wordId(114, 6, 4)).toBe(WORD_COUNT);
    const id = wordId(2, 255, 3);
    expect(wordAt(id)).toEqual({ surah: 2, ayah: 255, word: 3 });
  });
});

describe('mushaf layout (KFGQPC V2, 1421H)', () => {
  it('places every word once, in order, on 604 pages of 15 lines', async () => {
    const { pages, glyphs } = await loadMushafV2();
    expect(pages).toHaveLength(PAGE_COUNT);
    expect(glyphs).toHaveLength(WORD_COUNT);
    let next = 1;
    pages.forEach((lines, i) => {
      expect(lines, `page ${i + 1}`).toHaveLength(i < 2 ? 8 : 15);
      for (const line of lines) {
        if (line[0] !== 0) continue;
        expect(line[1]).toBe(next);
        next = line[2] + 1;
      }
    });
    expect(next).toBe(WORD_COUNT + 1);
  });

  // In 18 surahs the printed page ends with the surah's name, and its basmalah and first ayah
  // open the next page (An-Nisa: name at the foot of page 76, ayah 1 on page 77).
  it('opens each surah with its name, then the basmalah (but for 1 and 9)', async () => {
    const { pages } = await loadMushafV2();
    const names = pages.flat().filter((l) => l[0] === 1);
    expect(names.map((l) => l[1])).toEqual(surahs.map((s) => s.number));
    const nameAtFoot: number[] = [];
    for (const s of surahs) {
      const page = pageOf(s.number, 1);
      let lines = pages[page - 1]!;
      let at = lines.findIndex((l) => l[0] === 1 && l[1] === s.number);
      let next = lines[at + 1];
      if (at < 0) {
        const before = pages[page - 2]!;
        expect(before.at(-1), `surah ${s.number}`).toEqual([1, s.number]);
        nameAtFoot.push(s.number);
        lines = before;
        at = before.length - 1;
        next = pages[page - 1]![0];
      }
      if (s.bismillahPre) expect(next?.[0], `surah ${s.number}`).toBe(2);
    }
    expect(nameAtFoot).toHaveLength(18);
  });

  it('finds the page of an ayah and the ayah of a page', () => {
    expect(pageOf(1, 1)).toBe(1);
    expect(pageOf(2, 1)).toBe(2);
    expect(pageOf(2, 255)).toBe(42);
    expect(pageOf(114, 1)).toBe(604);
    expect(firstAyahOfPage(2)).toEqual({ surah: 2, ayah: 1 });
    expect(firstAyahOfPage(604)).toEqual({ surah: 112, ayah: 1 });
    expect(pageOfWord(WORD_COUNT)).toBe(604);
    expect(() => firstAyahOfPage(605)).toThrow(RangeError);
  });
});

describe('index', () => {
  it('counts ayahs across the whole Quran', () => {
    expect(ayahIndex(1, 1)).toBe(0);
    expect(ayahIndex(114, 6)).toBe(AYAH_COUNT - 1);
    expect(ayahAt(ayahIndex(36, 12))).toEqual({ surah: 36, ayah: 12 });
    expect(() => ayahIndex(2, 287)).toThrow(RangeError);
  });

  it('knows the juz, hizb and rub boundaries', () => {
    expect(divisionStart('juz', 1)).toEqual({ surah: 1, ayah: 1 });
    expect(divisionStart('juz', 2)).toEqual({ surah: 2, ayah: 142 });
    expect(divisionStart('juz', 30)).toEqual({ surah: 78, ayah: 1 });
    expect(divisionOf('juz', 2, 141)).toBe(1);
    expect(divisionOf('juz', 2, 142)).toBe(2);
    expect(divisionOf('hizb', 114, 6)).toBe(60);
    expect(divisionOf('rub', 114, 6)).toBe(240);
  });

  it('marks the fifteen ayahs of prostration', () => {
    expect(sajdaOf(7, 206)).not.toBeNull();
    expect(sajdaOf(96, 19)).not.toBeNull();
    expect(sajdaOf(2, 255)).toBeNull();
    const count = surahs.reduce(
      (n, s) =>
        n +
        Array.from({ length: s.ayahCount }, (_, i) => sajdaOf(s.number, i + 1)).filter(Boolean)
          .length,
      0,
    );
    expect(count).toBe(15);
  });
});

describe('translations and word by word', () => {
  for (const lang of ['en', 'fr'] as const) {
    it(`${lang}: every ayah, its footnotes and one meaning slot per word`, async () => {
      // One published footnote is empty (Saheeh International at 7:143); the reader shows a
      // mark only when its note has text.
      const emptyNotes: string[] = [];
      for (const s of surahs) {
        const [tr, text] = await Promise.all([
          loadTranslation(lang, s.number),
          loadSurahText(s.number),
        ]);
        expect(tr.t).toHaveLength(s.ayahCount);
        tr.t.forEach((segments, i) => {
          expect(segments.length, `${s.number}:${i + 1}`).toBeGreaterThan(0);
          for (const seg of segments) {
            if (typeof seg === 'string') continue;
            expect(seg[1] in tr.f).toBe(true);
            if (!tr.f[seg[1]]) emptyNotes.push(`${s.number}:${i + 1}`);
          }
          expect(tr.m[i]).toHaveLength(text.w[i]!.length - 1);
        });
      }
      expect(emptyNotes).toEqual(lang === 'en' ? ['7:143'] : []);
    });
  }

  it('transliterates word by word', async () => {
    const tl = await loadTransliteration(1);
    expect(tl).toHaveLength(7);
    expect(tl[0]).toHaveLength(4);
  });

  it('has plain text to search in, one entry per ayah', async () => {
    for (const lang of ['ar', 'en', 'fr'] as const) {
      const text = await loadSearchText(lang);
      expect(text).toHaveLength(AYAH_COUNT);
    }
    const ar = await loadSearchText('ar');
    expect(ar[ayahIndex(1, 3)]).toBe('الرحمن الرحيم');
  });
});

describe('recitations', () => {
  // Timestamps that jump back. At 55:71 the refrain was matched to an earlier occurrence; the
  // player places such an ayah between its neighbours instead (core: playbackSpans).
  const backwards: string[] = [];
  for (const id of reciterIds) {
    it(`${id}: a recording and timestamps for every ayah`, async () => {
      const r = reciter(id);
      expect(r.durations).toHaveLength(114);
      expect(audioUrl(id, 1)).toMatch(/^https:\/\/.+\.mp3$/);
      for (const s of surahs) {
        const timings = await loadTimings(id, s.number);
        expect(timings, `${id} ${s.number}`).toHaveLength(s.ayahCount);
        let previousFrom = -1;
        timings.forEach(([from, to], i) => {
          expect(to).toBeGreaterThanOrEqual(from);
          // Ayahs follow on (a reciter may go back a little to resume an ayah).
          if (from < previousFrom - 5000) backwards.push(`${id} ${s.number}:${i + 1}`);
          previousFrom = from;
        });
        expect(r.durations[s.number - 1]).toBeGreaterThan(0);
      }
      // Listed durations are approximate: Abdul Basit's al-Baqarah is listed at 8,655 s, but the
      // file runs 9,685 s (its MP3 header), as the timestamps say. Players use the file's own.
    });
  }

  it('jump back only where known', () => {
    expect(backwards).toEqual(['abdulbasit 55:71']);
  });

  it('pads surah numbers the way each server names its files', () => {
    expect(audioUrl('afasy', 2)).toMatch(/\/2\.mp3$/);
    expect(audioUrl('minshawi', 2)).toMatch(/\/002\.mp3$/);
    expect(() => audioUrl('afasy', 115)).toThrow(RangeError);
  });
});

it('keeps surah metadata available without the text', () => {
  expect(surah(36).nameSimple).toBe('Ya-Sin');
  expect(surahNameGlyph(2)).toBe('surah002');
  expect(surahNameGlyph(114)).toBe('surah114');
  expect(() => surahNameGlyph(0)).toThrow(RangeError);
});
