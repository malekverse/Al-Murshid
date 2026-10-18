import { describe, expect, it } from 'vitest';
import { AYAH_COUNT, ayah, ayahs, surah, SURAH_COUNT } from './quran';

const arabicIndic = (n: number) =>
  String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));

describe('Quran text (QPC Hafs)', () => {
  it('has 114 surahs and 6,236 ayahs, each surah complete', () => {
    let total = 0;
    for (let s = 1; s <= SURAH_COUNT; s++) {
      const { ayahCount } = surah(s);
      for (let a = 1; a <= ayahCount; a++) expect(ayah(s, a).key).toBe(`${s}:${a}`);
      expect(() => ayah(s, ayahCount + 1)).toThrow(RangeError);
      total += ayahCount;
    }
    expect(total).toBe(AYAH_COUNT);
  });

  // A no-break space precedes the number everywhere except 2:72, where the published file has
  // an ordinary space. The text stays as published (docs/DECISIONS.md).
  it('ends every ayah with its own number, which the font draws as the ayah ornament', () => {
    const noBreakSpace = String.fromCharCode(0xa0);
    const plainSpace: string[] = [];
    for (let s = 1; s <= SURAH_COUNT; s++) {
      for (const a of ayahs(s, 1, surah(s).ayahCount)) {
        const number = arabicIndic(a.ayah);
        if (a.text.endsWith(` ${number}`)) plainSpace.push(a.key);
        else expect(a.text.endsWith(noBreakSpace + number), a.key).toBe(true);
      }
    }
    expect(plainSpace).toEqual(['2:72']);
  });

  it('describes each surah', () => {
    expect(surah(2)).toMatchObject({
      number: 2,
      nameSimple: 'Al-Baqarah',
      ayahCount: 286,
      revelationPlace: 'madinah',
    });
    expect(surah(1).bismillahPre).toBe(false);
    expect(surah(9).bismillahPre).toBe(false);
    expect(surah(112)).toMatchObject({
      ayahCount: 4,
      revelationPlace: 'makkah',
      bismillahPre: true,
    });
    expect(() => surah(115)).toThrow(RangeError);
  });
});
