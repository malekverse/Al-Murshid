import { describe, expect, it } from 'vitest';
import { ayah } from './quran';
import {
  AYAH_COUNT,
  audioUrl,
  ayahAt,
  ayahIndex,
  ayahLength,
  ayahWords,
  divisionOf,
  divisionStart,
  editionPages,
  firstAyahOfPage,
  isGlyphMushaf,
  loadMushaf,
  loadTafsir,
  mushafEditions,
  loadMushafV2,
  loadSearchText,
  loadSurahText,
  loadTimings,
  loadTranslation,
  loadTransliteration,
  PAGE_COUNT,
  pageOf,
  pageOfWord,
  pageWords,
  reciter,
  reciterIds,
  sajdaOf,
  surah,
  surahNameGlyph,
  surahs,
  tafsirOf,
  tafsirRuns,
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

  it('count each ayah’s words with its number, the last word', async () => {
    const text = await loadSurahText(112);
    expect(ayahLength(112, 1)).toBe(ayahWords(text, 1).length);
    // Al-Ikhlas 1: four words and the number.
    expect(ayahLength(112, 1)).toBe(5);
    let total = 0;
    for (const s of surahs) for (let a = 1; a <= s.ayahCount; a++) total += ayahLength(s.number, a);
    expect(total).toBe(WORD_COUNT);
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

describe('mushaf editions (Phase 5b)', () => {
  for (const edition of mushafEditions) {
    it(`${edition}: places every word once, in order, at most 15 lines a page`, async () => {
      const m = await loadMushaf(edition);
      expect(m.pages).toHaveLength(editionPages[edition]);
      if (isGlyphMushaf(m)) expect(m.glyphs).toHaveLength(WORD_COUNT);
      else expect(m.words).toHaveLength(WORD_COUNT);
      let next = 1;
      m.pages.forEach((lines, i) => {
        expect(lines.length, `${edition} page ${i + 1}`).toBeLessThanOrEqual(15);
        for (const line of lines) {
          if (line[0] !== 0) continue;
          expect(line[1], `${edition} page ${i + 1}`).toBe(next);
          next = line[2] + 1;
        }
      });
      expect(next).toBe(WORD_COUNT + 1);
      // Each surah opens with its name, and the basmalah but for Al-Fatihah and At-Tawbah.
      const names = m.pages.flat().filter((l) => l[0] === 1);
      expect(names.map((l) => l[1])).toEqual(surahs.map((x) => x.number));
      expect(m.pages.flat().filter((l) => l[0] === 2)).toHaveLength(112);
    });
  }

  it('turns pages where the 1421H mushaf does in 1441H, and on 25 pages differently in 1405H', () => {
    let differ = 0;
    for (let p = 1; p <= PAGE_COUNT; p++) {
      expect(firstAyahOfPage(p, 'v4')).toEqual(firstAyahOfPage(p));
      const a = firstAyahOfPage(p, 'v1');
      const b = firstAyahOfPage(p);
      if (a.surah !== b.surah || a.ayah !== b.ayah || pageOf(a.surah, a.ayah, 'v1') !== p) differ++;
    }
    expect(pageOf(114, 1, 'indopak')).toBe(610);
    expect(() => firstAyahOfPage(611, 'indopak')).toThrow(RangeError);
    // Al-Fatihah: 29 words and 7 ayah numbers.
    expect(pageWords(1)).toEqual([1, 36]);
    expect(pageWords(604)[1]).toBe(WORD_COUNT);
    expect(pageOfWord(pageWords(77, 'indopak')[1], 'indopak')).toBe(77);
    expect(() => pageWords(605)).toThrow(RangeError);
    expect(differ).toBeGreaterThan(0);
  });

  it('draws the 1441H pages with the 1421H glyph codes, in its own lines', async () => {
    const v2 = await loadMushaf('v2');
    const v4 = await loadMushaf('v4');
    expect(
      isGlyphMushaf(v4) && isGlyphMushaf(v2) && v4.glyphs.join('') === v2.glyphs.join(''),
    ).toBe(true);
    expect(JSON.stringify(v4.pages)).not.toBe(JSON.stringify(v2.pages));
  });

  // QUL's Indopak layout repeats five words on page 304; the build moves line 3 to start after
  // them (scripts/build-quran.ts), so no word appears twice.
  it('prints page 304 of the Indopak mushaf without repeating a word', async () => {
    const { pages } = await loadMushaf('indopak');
    const text = pages[303]!.filter((l) => l[0] === 0);
    expect(text[1]).toEqual([0, 41211, 41221, 0]);
    expect(text[2]![1]).toBe(41222);
  });

  // QUL's line 12 of page 261 runs from Ibrahim into Al-Hijr; the build ends it with Ibrahim, and
  // Al-Hijr opens after its name and basmalah, on a full page of 15 lines.
  it('opens Al-Hijr on its own line in the Indopak mushaf', async () => {
    const { pages } = await loadMushaf('indopak');
    const page = pages[260]!;
    expect(page).toHaveLength(15);
    const at = page.findIndex((l) => l[0] === 1 && l[1] === 15);
    expect(page[at - 1]).toEqual([0, 35284, 35293, 0]);
    expect(page[at + 1]).toEqual([2]);
    expect(page[at + 2]![1]).toBe(wordId(15, 1, 1));
  });

  it('writes the Indopak words in their own script', async () => {
    const m = await loadMushaf('indopak');
    expect(isGlyphMushaf(m)).toBe(false);
    if (!isGlyphMushaf(m)) expect(m.words[0]).toBe('بِسْمِ');
  });
});

describe('tafsir (Al-Mukhtasar)', () => {
  for (const lang of ['ar', 'en', 'fr'] as const) {
    it(`${lang}: explains every ayah once, in passages of one or more ayahs`, async () => {
      for (const x of surahs) {
        const t = await loadTafsir(lang, x.number);
        let next = 1;
        for (const [from, to, text] of t) {
          expect(from, `${lang} ${x.number}`).toBe(next);
          expect(to).toBeGreaterThanOrEqual(from);
          expect(text.trim().length).toBeGreaterThan(0);
          // Markup is only bold and italic.
          expect(text.replace(/<\/?[bi]>/g, '')).not.toMatch(/[<>]/);
          next = to + 1;
        }
        expect(next - 1).toBe(x.ayahCount);
      }
    });
  }

  it('finds the passage for an ayah', async () => {
    const en = await loadTafsir('en', 2);
    expect(tafsirOf(en, 255)?.text).toMatch(/^Allah is the One Who alone deserves/);
    expect(tafsirOf(en, 999)).toBeNull();
    expect(tafsirRuns('a <b>b</b> <i>c</i>')).toEqual([
      { text: 'a ', bold: false, italic: false },
      { text: 'b', bold: true, italic: false },
      { text: ' ', bold: false, italic: false },
      { text: 'c', bold: false, italic: true },
    ]);
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
  // player places such an ayah between its neighbours instead (core: playbackSpans). Al-Minshawi's
  // mujawwad recitation repeats ayahs, so it jumps back often (and 32:24 has no timestamps).
  const backwards: string[] = [];
  // Ends before starts: Basfar and Jibreel close some surahs with the listed length, rounded down,
  // shorter than the recording; such a last ayah runs to the recording's end (core).
  const inverted: string[] = [];
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
          if (to < from) inverted.push(`${id} ${s.number}:${i + 1}`);
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
    expect(backwards.filter((b) => !b.startsWith('minshawiMujawwad'))).toEqual([
      'abdulbasit 55:71',
    ]);
    expect(backwards.filter((b) => b.startsWith('minshawiMujawwad'))).toHaveLength(24);
  });

  it('end before they start only on a surah’s last ayah', () => {
    for (const entry of inverted) {
      const [id, at] = entry.split(' ') as [string, string];
      const [s, a] = at.split(':').map(Number) as [number, number];
      expect(['basfar', 'jibreel']).toContain(id);
      expect(a, entry).toBe(surah(s).ayahCount);
    }
    expect(inverted.filter((e) => e.startsWith('jibreel'))).toEqual([
      'jibreel 8:75',
      'jibreel 9:129',
      'jibreel 10:109',
    ]);
  });

  it('say which reciters follow each word', () => {
    expect(reciterIds.filter((id) => !reciter(id).words)).toEqual([
      'qatami',
      'abbad',
      'jibreel',
      'basfar',
    ]);
    expect(reciter('husaryMuallim').style).toBe('teaching');
    expect(reciter('minshawiMujawwad').style).toBe('mujawwad');
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
