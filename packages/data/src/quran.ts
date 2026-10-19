// Quran reading data (SPEC 5.5, 9): preferences, the last position, bookmarks and the khatmah
// plan. One schema for both apps; every field falls back to its default on its own.

import { MUSHAF_PAGES, type KhatmahPlan } from '@murshid/core';
import { z } from 'zod';

/** The launch reciters, as @murshid/content names them. */
export const reciterIds = ['afasy', 'husary', 'abdulbasit', 'minshawi', 'ghamdi'] as const;
export type ReciterChoice = (typeof reciterIds)[number];

/** Translations bundled in @murshid/content: Saheeh International (en), Hamidullah (fr). */
export const translationIds = ['sahih', 'hamidullah'] as const;
export type TranslationId = (typeof translationIds)[number];
export const translationLanguage: Record<TranslationId, 'en' | 'fr'> = {
  sahih: 'en',
  hamidullah: 'fr',
};

/** "app" follows the app's light or dark theme; sepia is the reader's paper. */
export const readingThemes = ['app', 'light', 'sepia', 'dark'] as const;
export type ReadingTheme = (typeof readingThemes)[number];

export const bookmarkColors = ['lantern', 'sage', 'sky', 'plum', 'clay'] as const;
export type BookmarkColor = (typeof bookmarkColors)[number];

const translationChoice = z.enum(translationIds).nullable();

export const quranPrefsSchema = z.object({
  view: z.enum(['verses', 'mushaf']).catch('verses'),
  /** Arabic size in px (SPEC 6.2 allows 20 to 48); null keeps the default. */
  arabicSize: z.number().min(20).max(48).nullable().catch(null),
  /** The translation shown under each ayah, chosen per app language; null shows none. */
  translations: z
    .object({ ar: translationChoice, en: translationChoice, fr: translationChoice })
    .catch({ ar: null, en: 'sahih', fr: 'hamidullah' }),
  /** Each word's meaning under it, in the verse view. */
  wordMeanings: z.boolean().catch(false),
  transliteration: z.boolean().catch(false),
  theme: z.enum(readingThemes).catch('app'),
  reciter: z.enum(reciterIds).catch('afasy'),
  speed: z.number().min(0.5).max(2).catch(1),
  /** How many times each ayah plays. */
  repeat: z.number().int().min(1).max(10).catch(1),
});
export type QuranPrefs = z.infer<typeof quranPrefsSchema>;

export function defaultQuranPrefs(): QuranPrefs {
  return quranPrefsSchema.parse({});
}

/** The translation to show for an app language, if any. */
export function translationFor(prefs: QuranPrefs, locale: string): TranslationId | null {
  const lang = locale.split('-')[0] as 'ar' | 'en' | 'fr';
  return prefs.translations[lang] ?? null;
}

// ---------- Last position (SPEC 9's reading_progress) ----------

export const readingPositionSchema = z
  .object({
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().min(1),
    page: z.number().int().min(1).max(MUSHAF_PAGES),
    at: z.string(),
  })
  .nullable()
  .catch(null);
export type ReadingPosition = NonNullable<z.infer<typeof readingPositionSchema>>;

export function parseReadingPosition(raw: unknown): ReadingPosition | null {
  return readingPositionSchema.parse(raw ?? null);
}

// ---------- Bookmarks (SPEC 9's quran_bookmarks) ----------

export interface QuranBookmark {
  id: string;
  surah: number;
  ayah: number;
  color: BookmarkColor;
  createdAt: string;
  updatedAt: string;
  /** Removing keeps a tombstone, so a later sync (Phase 8) carries it to other devices. */
  deleted: boolean;
}

/** A random RFC 4122 version 4 id. */
export function uuid(): string {
  const bytes = new Uint8Array(16);
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues) c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function newBookmark(
  surah: number,
  ayah: number,
  color: BookmarkColor,
  now = new Date(),
): QuranBookmark {
  const at = now.toISOString();
  return { id: uuid(), surah, ayah, color, createdAt: at, updatedAt: at, deleted: false };
}

// ---------- Khatmah plan (SPEC 9's khatmah_plans) ----------

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const page = z
  .number()
  .int()
  .min(1)
  .max(MUSHAF_PAGES + 1);

export const khatmahSchema = z
  .object({
    id: z.string(),
    startedOn: isoDateString,
    goal: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('date'), finishOn: isoDateString }),
      z.object({ kind: z.literal('pace'), pagesPerDay: z.number().int().min(1).max(MUSHAF_PAGES) }),
    ]),
    fromPage: page,
    toPage: page,
    page,
    today: z.object({ date: isoDateString, page }),
    basePace: z.number().int().min(1),
  })
  .nullable()
  .catch(null);
export type StoredKhatmah = KhatmahPlan & { id: string };

export function parseKhatmah(raw: unknown): StoredKhatmah | null {
  return khatmahSchema.parse(raw ?? null);
}
