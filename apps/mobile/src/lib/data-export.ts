import { civilDate } from '@murshid/core';
import { buildExport, exportFileName, placeOf } from '@murshid/data';
import { getCalendars } from 'expo-localization';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { db, prayerLogs, quranBookmarks, ramadanLogs, reflections, tasbihDaily } from '@/db';
import { forgetYouLock } from './app-lock';
import { khatmahStore, readingPosition } from './quran';
import { allReflectionRows, deleteReflectionKey, openReflections } from './reflections';
import { rescheduleReminders } from './reminders';
import { readSettings } from './settings';
import { storage } from './storage';

// Privacy and data (SPEC 5.7): everything this phone keeps, exported as one JSON file shared
// through the system sheet, or deleted in one confirmed action. There are no accounts yet, so
// nothing is kept elsewhere.

/** Writes "al-murshid-2026-10-21.json" to the cache and opens the share sheet for it. */
export async function exportEverything(dialogTitle: string, now = new Date()) {
  const settings = readSettings();
  const timeZone = placeOf(settings)?.timeZone ?? getCalendars()[0]?.timeZone ?? 'UTC';
  const opened = await openReflections(allReflectionRows());
  const data = buildExport(
    {
      settings,
      prayerLogs: db.select().from(prayerLogs).all(),
      ramadanLogs: db.select().from(ramadanLogs).all(),
      quranBookmarks: db.select().from(quranBookmarks).all(),
      readingPosition: readingPosition.read(),
      khatmah: khatmahStore.read(),
      reflections: opened.flatMap((e) => (e.reflection ? [e.reflection] : [])),
      tasbihDaily: db.select().from(tasbihDaily).all(),
    },
    { exportedAt: now, platform: Platform.OS === 'ios' ? 'ios' : 'android' },
  );
  const file = new File(Paths.cache, exportFileName(civilDate(now, timeZone)));
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle,
  });
}

/**
 * Deletes everything this phone keeps for Al-Murshid: logs, bookmarks, reflections and their key,
 * the app lock, settings and the reminders they scheduled. Downloaded recitations stay.
 */
export async function deleteEverything() {
  db.transaction((tx) => {
    tx.delete(prayerLogs).run();
    tx.delete(ramadanLogs).run();
    tx.delete(quranBookmarks).run();
    tx.delete(reflections).run();
    tx.delete(tasbihDaily).run();
  });
  await deleteReflectionKey();
  await forgetYouLock();
  storage.clearAll();
  await rescheduleReminders();
}
