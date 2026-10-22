'use client';

import { civilDate } from '@murshid/core';
import { buildExport, exportFileName, placeOf, type Settings } from '@murshid/data';
import { db } from './db';
import { khatmahStore, readingPosition } from './quran';
import { forgetReflectionKey, openReflections } from './reflections';

// Privacy and data (SPEC 5.7): everything this browser keeps, exported as one JSON file or
// deleted in one confirmed action. There are no accounts yet, so nothing is kept elsewhere.

/** Downloads everything as "al-murshid-2026-10-21.json". */
export async function exportEverything(settings: Settings, now = new Date()) {
  const [prayerLogs, ramadanLogs, quranBookmarks, rows, tasbihDaily] = await Promise.all([
    db.prayerLogs.toArray(),
    db.ramadanLogs.toArray(),
    db.bookmarks.toArray(),
    db.reflections.toArray(),
    db.tasbihDaily.toArray(),
  ]);
  const reflections = (await openReflections(rows)).flatMap((e) =>
    e.reflection ? [e.reflection] : [],
  );
  const file = buildExport(
    {
      settings,
      prayerLogs: prayerLogs.map(({ date, prayer, loggedAt, source, deleted }) => ({
        date,
        prayer,
        loggedAt,
        source,
        deleted,
      })),
      ramadanLogs,
      quranBookmarks,
      readingPosition: readingPosition.read(),
      khatmah: khatmahStore.read(),
      reflections,
      tasbihDaily: tasbihDaily.map(({ date, phrase, count, updatedAt }) => ({
        date,
        phrase,
        count,
        updatedAt,
      })),
    },
    { exportedAt: now, platform: 'web' },
  );
  const timeZone = placeOf(settings)?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = exportFileName(civilDate(now, timeZone));
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Deletes everything this browser keeps for Al-Murshid: the database (logs, bookmarks,
 * reflections and their key) and every stored setting. Cached Quran files and downloads stay.
 */
export async function deleteEverything() {
  forgetReflectionKey();
  await db.delete();
  for (const storage of [localStorage, sessionStorage]) {
    try {
      Object.keys(storage)
        .filter((key) => key.startsWith('murshid-'))
        .forEach((key) => storage.removeItem(key));
    } catch {
      // Storage blocked: nothing was kept there.
    }
  }
}
