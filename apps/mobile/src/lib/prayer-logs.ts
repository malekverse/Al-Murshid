import { addDays, isoDate, type CivilDate, type Prayer } from '@murshid/core';
import { newLog, type LogSource, type PrayerLog } from '@murshid/data';
import { and, eq, gte } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db, prayerLogs } from '@/db';

/** Logs from the last eight days (what Today and the Journey read), live. */
export function useRecentLogs(today: CivilDate | null): PrayerLog[] | undefined {
  const from = today ? isoDate(addDays(today, -7)) : '9999-12-31';
  const { data, updatedAt } = useLiveQuery(
    db.select().from(prayerLogs).where(gte(prayerLogs.date, from)),
    [from],
  );
  return updatedAt ? data : undefined;
}

export function recentLogs(today: CivilDate): PrayerLog[] {
  return db
    .select()
    .from(prayerLogs)
    .where(gte(prayerLogs.date, isoDate(addDays(today, -7))))
    .all();
}

/** Log or un-log a prayer. Works from the app, a notification action or a background task. */
export function setPrayerLogged(
  date: CivilDate,
  prayer: Prayer,
  logged: boolean,
  source: LogSource = 'app',
) {
  if (logged) {
    const row = newLog(date, prayer, source);
    db.insert(prayerLogs)
      .values(row)
      .onConflictDoUpdate({
        target: [prayerLogs.date, prayerLogs.prayer],
        set: { loggedAt: row.loggedAt, source: row.source, deleted: false },
      })
      .run();
  } else {
    db.update(prayerLogs)
      .set({ deleted: true, loggedAt: new Date().toISOString() })
      .where(and(eq(prayerLogs.date, isoDate(date)), eq(prayerLogs.prayer, prayer)))
      .run();
  }
}
