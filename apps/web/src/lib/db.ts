'use client';

import type { PrayerLog, QuranBookmark } from '@murshid/data';
import Dexie, { type EntityTable } from 'dexie';

// Personal data stays in this browser (SPEC 9): IndexedDB through Dexie. Every table keeps
// tombstones, so a later sync (Phase 8) can carry deletions to other devices.

export interface PrayerLogRow extends PrayerLog {
  /** "2026-10-18:asr" */
  key: string;
}

export const db = new Dexie('murshid') as Dexie & {
  prayerLogs: EntityTable<PrayerLogRow, 'key'>;
  bookmarks: EntityTable<QuranBookmark, 'id'>;
};
db.version(1).stores({ prayerLogs: 'key, date' });
db.version(2).stores({ prayerLogs: 'key, date', bookmarks: 'id, [surah+ayah], updatedAt' });
