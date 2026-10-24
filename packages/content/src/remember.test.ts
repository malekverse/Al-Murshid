import { describe, expect, it } from 'vitest';
import {
  loadRememberChapter,
  loadRememberIndex,
  quotedSpans,
  rememberChapters,
  rememberSource,
} from './remember';

describe('adhkar and duas (HadeethEnc)', () => {
  for (const lang of ['ar', 'en', 'fr'] as const) {
    it(`${lang}: every chapter has whole hadiths with their grade and reference`, async () => {
      const index = await loadRememberIndex(lang);
      expect(index.map((c) => c.slug)).toEqual(rememberChapters.map((c) => c.slug));
      for (const { slug, count } of index) {
        const hadiths = await loadRememberChapter(lang, slug);
        expect(hadiths.length, slug).toBe(count);
        expect(count, slug).toBeGreaterThan(0);
        for (const h of hadiths) {
          expect(h.text.length).toBeGreaterThan(0);
          expect(h.grade.length).toBeGreaterThan(0);
          expect(h.arabic.reference.length).toBeGreaterThan(0);
          expect(h.link).toBe(`https://hadeethenc.com/${h.lang}/browse/hadith/${h.id}`);
          // Arabic shows its own; English only its own; French its own, then English.
          expect(lang === 'fr' ? ['fr', 'en'] : [lang]).toContain(h.lang);
          if (h.lang === 'ar') expect(h.text).toBe(h.arabic.text);
        }
      }
    });
  }

  it('shows every hadith in Arabic, and in French whatever English shows', async () => {
    for (const { slug } of rememberChapters) {
      const [ar, en, fr] = await Promise.all([
        loadRememberChapter('ar', slug),
        loadRememberChapter('en', slug),
        loadRememberChapter('fr', slug),
      ]);
      expect(fr.map((h) => h.id)).toEqual(en.map((h) => h.id));
      expect(ar.length).toBeGreaterThanOrEqual(en.length);
    }
  });

  it('names its version', () => {
    expect(rememberSource.source).toBe('HadeethEnc.com');
    expect(rememberSource.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('finds the words said, between « and »', () => {
    expect(quotedSpans('قال: «سبحان الله» ثم قال: «الحمد لله».')).toEqual([
      { text: 'قال: ', quoted: false },
      { text: '«سبحان الله»', quoted: true },
      { text: ' ثم قال: ', quoted: false },
      { text: '«الحمد لله»', quoted: true },
      { text: '.', quoted: false },
    ]);
    expect(quotedSpans('a «b «c» d» e').map((s) => s.quoted)).toEqual([false, true, false]);
    expect(quotedSpans('no quote')).toEqual([{ text: 'no quote', quoted: false }]);
  });
});
