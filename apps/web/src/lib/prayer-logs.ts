'use client';

import { addDays, isoDate, type CivilDate, type Prayer } from '@murshid/core';
import { logKey, newLog, type LogSource, type PrayerLog } from '@murshid/data';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

// Prayer logs (SPEC 9), in this browser's IndexedDB. Un-logging keeps a tombstone.

/** Logs from the last eight days (what Today and the Journey read), live. */
export function useRecentLogs(today: CivilDate | null): PrayerLog[] | undefined {
  const from = today ? isoDate(addDays(today, -7)) : null;
  return useLiveQuery(
    () => (from ? db.prayerLogs.where('date').aboveOrEqual(from).toArray() : []),
    [from],
  );
}

/** Logs between two ISO dates, inclusive (a month of Your Sky), live. */
export function useLogsBetween(from: string, to: string): PrayerLog[] | undefined {
  return useLiveQuery(
    () => db.prayerLogs.where('date').between(from, to, true, true).toArray(),
    [from, to],
  );
}

export async function setPrayerLogged(
  date: CivilDate,
  prayer: Prayer,
  logged: boolean,
  source: LogSource = 'app',
) {
  const key = logKey(date, prayer);
  if (logged) {
    await db.prayerLogs.put({ key, ...newLog(date, prayer, source) });
  } else {
    await db.prayerLogs.update(key, { deleted: true, loggedAt: new Date().toISOString() });
  }
}
