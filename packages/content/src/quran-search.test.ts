import { describe, expect, it } from 'vitest';
import { searchQuran } from './quran-search';

describe('Quran search', () => {
  it('opens a typed reference, in either digits', async () => {
    expect((await searchQuran('2:255', 'en')).reference).toEqual({ surah: 2, ayah: 255 });
    expect((await searchQuran('٢:٢٥٥', 'en')).reference).toEqual({ surah: 2, ayah: 255 });
    const r = await searchQuran('36', 'en');
    expect(r.reference).toEqual({ surah: 36, ayah: 1 });
    expect(r.surahs.map((s) => s.number)).toEqual([36]);
    expect((await searchQuran('2:300', 'en')).reference).toBeNull();
  });

  it('finds surahs by name in Arabic or Latin letters, with or without the article', async () => {
    const names = async (q: string) => (await searchQuran(q, 'en')).surahs.map((s) => s.number);
    expect(await names('baqara')).toContain(2);
    expect(await names('Al-Kahf')).toContain(18);
    expect(await names('kahf')).toContain(18);
    expect(await names('الكهف')).toContain(18);
    expect(await names('كهف')).toContain(18);
  });

  it('finds ayahs by their Arabic words, without harakat', async () => {
    const r = await searchQuran('الرحمن الرحيم', 'en');
    expect(r.ayahs[0]).toEqual({ surah: 1, ayah: 1 });
    expect(r.ayahs).toContainEqual({ surah: 1, ayah: 3 });
    expect(r.total).toBeGreaterThanOrEqual(r.ayahs.length);
  });

  it('finds ayahs by their translation, without accents', async () => {
    const en = await searchQuran('kursi', 'en');
    expect(en.ayahs).toContainEqual({ surah: 2, ayah: 255 });
    const fr = await searchQuran('priere', 'fr', 5);
    expect(fr.ayahs).toHaveLength(5);
    expect(fr.total).toBeGreaterThan(5);
  });

  it('waits for at least two letters', async () => {
    expect(await searchQuran('a', 'en')).toMatchObject({ ayahs: [], surahs: [], total: 0 });
  });
});
