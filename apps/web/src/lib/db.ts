'use client';

import type { PrayerLog, QuranBookmark, RamadanLog } from '@murshid/data';
import Dexie, { type EntityTable } from 'dexie';

// Personal data stays in this browser (SPEC 9): IndexedDB through Dexie. Every table keeps
// tombstones, so a later sync (Phase 8) can carry deletions to other devices.

export interface PrayerLogRow extends PrayerLog {
  /** "2026-10-18:asr" */
  key: string;
}

/** A night reflection, sealed with AES-GCM (SPEC 5.7): only the evening's date is readable. */
export interface ReflectionRow {
  /** "2026-10-18" */
  date: string;
  iv: Uint8Array<ArrayBuffer>;
  sealed: ArrayBuffer;
  updatedAt: string;
}

/** Keys WebCrypto made in this browser, stored as non-extractable CryptoKey objects. */
export interface SecretRow {
  name: string;
  key: CryptoKey;
}

export const db = new Dexie('murshid') as Dexie & {
  prayerLogs: EntityTable<PrayerLogRow, 'key'>;
  bookmarks: EntityTable<QuranBookmark, 'id'>;
  ramadanLogs: EntityTable<RamadanLog, 'date'>;
  reflections: EntityTable<ReflectionRow, 'date'>;
  secrets: EntityTable<SecretRow, 'name'>;
};
db.version(1).stores({ prayerLogs: 'key, date' });
db.version(2).stores({ prayerLogs: 'key, date', bookmarks: 'id, [surah+ayah], updatedAt' });
// Phase 7: Ramadan's fasts and Taraweeh, one row per date.
db.version(3).stores({
  prayerLogs: 'key, date',
  bookmarks: 'id, [surah+ayah], updatedAt',
  ramadanLogs: 'date',
});
// Phase 7: night reflections, never synced (SPEC 9), and the key that seals them.
db.version(4).stores({
  prayerLogs: 'key, date',
  bookmarks: 'id, [surah+ayah], updatedAt',
  ramadanLogs: 'date',
  reflections: 'date',
  secrets: 'name',
});
