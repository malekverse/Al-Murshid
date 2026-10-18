// Prayer logs (SPEC 3, 9): one row per prayer per day, kept on the device (SQLite on mobile,
// IndexedDB on web). Logging is between the person and Allah: any prayer from earlier today or
// yesterday can be logged without comment, and un-logging is just as quiet.

import { isoDate, prayers, type CivilDate, type LoggedPrayer, type Prayer } from '@murshid/core';
import { z } from 'zod';

export const logSources = ['app', 'notification', 'widget'] as const;
export type LogSource = (typeof logSources)[number];

export const prayerLogSchema = z.object({
  /** The calendar day the prayer belongs to, "2026-10-18". */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  prayer: z.enum(prayers),
  /** When it was logged (ISO instant). */
  loggedAt: z.iso.datetime(),
  source: z.enum(logSources),
  /** A tombstone, so an un-log can sync later (SPEC 9). */
  deleted: z.boolean(),
});
export type PrayerLog = z.infer<typeof prayerLogSchema>;

export function logKey(date: CivilDate | string, prayer: Prayer): string {
  return `${typeof date === 'string' ? date : isoDate(date)}:${prayer}`;
}

export function newLog(
  date: CivilDate,
  prayer: Prayer,
  source: LogSource,
  now: Date = new Date(),
): PrayerLog {
  return { date: isoDate(date), prayer, loggedAt: now.toISOString(), source, deleted: false };
}

/** What Today and the Journey read: live logs only. */
export function liveLogs(logs: readonly PrayerLog[]): LoggedPrayer[] {
  return logs.filter((l) => !l.deleted).map(({ date, prayer }) => ({ date, prayer }));
}
