import { startKhatmah } from '@murshid/core';
import { describe, expect, it } from 'vitest';
import {
  bookmarkCovering,
  bookmarkEnd,
  defaultQuranPrefs,
  hiddenWord,
  newBookmark,
  parseKhatmah,
  parseReadingPosition,
  translationFor,
  uuid,
} from './quran';
import { parseSettings } from './settings';

describe('Quran preferences', () => {
  it('default to the verse view, the bundled translation per language and al-Afasy', () => {
    const prefs = parseSettings({}).quran;
    expect(prefs).toEqual(defaultQuranPrefs());
    expect(prefs).toMatchObject({ view: 'verses', reciter: 'afasy', speed: 1, repeat: 1 });
    expect(translationFor(prefs, 'ar')).toBeNull();
    expect(translationFor(prefs, 'en-u-nu-latn')).toBe('sahih');
    expect(translationFor(prefs, 'fr')).toBe('hamidullah');
  });

  it('keep every valid field when another is damaged', () => {
    const prefs = parseSettings({
      quran: { view: 'mushaf', reciter: 'nobody', speed: 9, arabicSize: 30, theme: 'sepia' },
    }).quran;
    expect(prefs).toMatchObject({ view: 'mushaf', reciter: 'afasy', speed: 1, arabicSize: 30 });
    expect(prefs.theme).toBe('sepia');
    expect(parseSettings({ quran: 'broken' }).quran).toEqual(defaultQuranPrefs());
  });
});

describe('reading position', () => {
  it('keeps a valid position and drops a damaged one', () => {
    const at = new Date(0).toISOString();
    expect(parseReadingPosition({ surah: 2, ayah: 255, page: 42, at })).toEqual({
      surah: 2,
      ayah: 255,
      page: 42,
      at,
    });
    expect(parseReadingPosition({ surah: 200, ayah: 1, page: 1, at })).toBeNull();
    expect(parseReadingPosition(undefined)).toBeNull();
  });
});

describe('bookmarks', () => {
  it('get a version 4 id and keep their colour', () => {
    const b = newBookmark(18, 10, 'sage', null, new Date(0));
    expect(b).toMatchObject({ surah: 18, ayah: 10, ayahEnd: null, color: 'sage', deleted: false });
    expect(b.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuid()).not.toBe(uuid());
  });

  it('get an id even without Web Crypto', () => {
    const original = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      expect(uuid()).toMatch(/^[0-9a-f-]{36}$/);
    } finally {
      Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
    }
  });
});

describe('bookmark ranges', () => {
  it('mark one ayah or a range, and find what covers an ayah', () => {
    const one = newBookmark(2, 255, 'lantern');
    const range = newBookmark(18, 1, 'sky', 10);
    expect(bookmarkEnd(one)).toBe(255);
    expect(bookmarkEnd(range)).toBe(10);
    // A range ending where it starts is one ayah.
    expect(newBookmark(1, 3, 'clay', 3).ayahEnd).toBeNull();
    const list = [range, one];
    expect(bookmarkCovering(list, 18, 5)).toBe(range);
    expect(bookmarkCovering(list, 18, 11)).toBeNull();
    expect(bookmarkCovering(list, 2, 255)).toBe(one);
    expect(bookmarkCovering([{ ...one, deleted: true }], 2, 255)).toBeNull();
    expect(bookmarkCovering(undefined, 2, 255)).toBeNull();
    // Rows saved before ranges existed have no end.
    expect(bookmarkEnd({ ...one, ayahEnd: undefined })).toBe(255);
  });
});

describe('memorizing', () => {
  it('hides words, all but the first, or only the markers', () => {
    expect(hiddenWord('off', 3, false)).toBe(false);
    expect(hiddenWord('words', 0, false)).toBe(true);
    expect(hiddenWord('words', 4, true)).toBe(false);
    expect(hiddenWord('firstWord', 0, false)).toBe(false);
    expect(hiddenWord('firstWord', 1, false)).toBe(true);
    expect(hiddenWord('markers', 4, true)).toBe(true);
    expect(hiddenWord('markers', 0, false)).toBe(false);
  });

  it('defaults to hiding nothing, in the translation layout', () => {
    expect(defaultQuranPrefs()).toMatchObject({
      hide: 'off',
      layout: 'translation',
      edition: 'v2',
      tajweed: false,
    });
    expect(parseSettings({ quran: { edition: 'indopak', tajweed: true } }).quran).toMatchObject({
      edition: 'indopak',
      tajweed: true,
    });
    expect(parseSettings({ quran: { edition: 'warsh' } }).quran.edition).toBe('v2');
    expect(parseSettings({ quran: { hide: 'everything', layout: 'text' } }).quran).toMatchObject({
      hide: 'off',
      layout: 'text',
    });
  });
});

describe('khatmah plan', () => {
  it('round-trips a plan and drops a damaged one', () => {
    const plan = {
      id: 'k1',
      ...startKhatmah({ kind: 'pace', pagesPerDay: 4 }, { year: 2026, month: 10, day: 18 }),
    };
    expect(parseKhatmah(JSON.parse(JSON.stringify(plan)))).toEqual(plan);
    expect(parseKhatmah({ ...plan, page: 0 })).toBeNull();
    expect(parseKhatmah(null)).toBeNull();
  });
});
