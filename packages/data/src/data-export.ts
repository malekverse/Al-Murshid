// Export everything (SPEC 5.7): one JSON file with the person's data on this device. The file is
// theirs, so reflections are in it as written. Tombstones kept for a later sync are left out.

import { isoDate, type CivilDate } from '@murshid/core';
import type { PrayerLog } from './prayer-log';
import type { QuranBookmark, ReadingPosition, StoredKhatmah } from './quran';
import type { RamadanLog } from './ramadan-log';
import type { Reflection } from './reflection';
import type { Settings } from './settings';
import type { TasbihDay } from './tasbih';

export const EXPORT_FORMAT = 'al-murshid-export';
export const EXPORT_VERSION = 1;

export interface ExportData {
  settings: Settings;
  prayerLogs: readonly PrayerLog[];
  ramadanLogs: readonly RamadanLog[];
  quranBookmarks: readonly QuranBookmark[];
  readingPosition: ReadingPosition | null;
  khatmah: StoredKhatmah | null;
  reflections: readonly Reflection[];
  tasbihDaily: readonly TasbihDay[];
}

const byDate = <T extends { date: string }>(rows: readonly T[]) =>
  [...rows].sort((a, b) => a.date.localeCompare(b.date));

export function buildExport(
  data: ExportData,
  meta: { exportedAt: Date; platform: 'web' | 'android' | 'ios' },
) {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: meta.exportedAt.toISOString(),
    platform: meta.platform,
    settings: data.settings,
    prayerLogs: byDate(data.prayerLogs.filter((l) => !l.deleted)).map(
      ({ date, prayer, loggedAt, source }) => ({ date, prayer, loggedAt, source }),
    ),
    ramadanLogs: byDate(data.ramadanLogs),
    quranBookmarks: data.quranBookmarks
      .filter((b) => !b.deleted)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(({ id, surah, ayah, ayahEnd, color, createdAt, updatedAt }) => ({
        id,
        surah,
        ayah,
        ayahEnd: ayahEnd ?? null,
        color,
        createdAt,
        updatedAt,
      })),
    readingPosition: data.readingPosition,
    khatmah: data.khatmah,
    reflections: byDate(data.reflections),
    tasbihDaily: byDate(data.tasbihDaily),
  };
}

/** "al-murshid-2026-10-21.json" */
export function exportFileName(today: CivilDate): string {
  return `al-murshid-${isoDate(today)}.json`;
}
