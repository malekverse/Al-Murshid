// Prayer times computed ahead (SPEC 4, Phase 7c): the landing page's sky reads the main city of
// the visitor's time zone from a small table written at build time, so the page does not ship the
// calculation. Only types come from prayer-times, which keeps adhan-js out of the page.

import type { DayTimes, TimeName } from './prayer-times';
import { daysBetween, isoDate, parseIsoDate, weekday, type CivilDate } from './time';

/** Each day's times, in this order. */
const order: readonly TimeName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
const MINUTE = 60_000;

export interface ZoneTimes {
  /** The first day in the table, as an ISO date. */
  from: string;
  /** One row a day from `from` on: Fajr, sunrise, Dhuhr, Asr, Maghrib, Isha, in epoch minutes. */
  days: number[][];
}

/** Packs consecutive days, the first one first. */
export function encodeZoneTimes(days: readonly DayTimes[]): ZoneTimes {
  const first = days[0];
  if (!first) throw new Error('No days to pack');
  return {
    from: isoDate(first.date),
    days: days.map((d) => order.map((name) => Math.round(d[name].getTime() / MINUTE))),
  };
}

/** One day out of the table, or null when the table does not reach it. */
export function zoneDay(table: ZoneTimes, date: CivilDate): DayTimes | null {
  const row = table.days[daysBetween(parseIsoDate(table.from), date)];
  if (row?.length !== order.length) return null;
  const at = (i: number) => new Date(row[i]! * MINUTE);
  return {
    fajr: at(0),
    sunrise: at(1),
    dhuhr: at(2),
    asr: at(3),
    maghrib: at(4),
    isha: at(5),
    date,
    jumuah: weekday(date) === 5,
  };
}
