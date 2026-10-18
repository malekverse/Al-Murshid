// The Hijri calendar's month view (SPEC 5.4): Umm al-Qura days with their Gregorian dates and
// the year's marked days, laid out in weeks. Swiping moves one Hijri month at a time.

import {
  fromHijri,
  hijriEvents,
  hijriMonthLength,
  type HijriDate,
  type HijriEvent,
  type HijriOffset,
} from './hijri';
import { addDays, weekday, type CivilDate } from './time';

export interface CalendarDay {
  hijri: HijriDate;
  date: CivilDate;
  /** 0 = Sunday ... 6 = Saturday. */
  weekday: number;
  events: HijriEvent[];
}

export interface HijriMonth {
  year: number;
  month: number;
}

/** The converter's table covers 1343-1500 AH; the calendar stays inside it. */
export const HIJRI_FIRST: HijriMonth = { year: 1343, month: 1 };
export const HIJRI_LAST: HijriMonth = { year: 1500, month: 12 };

export function hijriMonthDays(
  { year, month }: HijriMonth,
  offset: HijriOffset = 0,
): CalendarDay[] {
  const first = fromHijri({ year, month, day: 1 }, offset);
  return Array.from({ length: hijriMonthLength(year, month) }, (_, i) => {
    const date = addDays(first, i);
    const hijri = { year, month, day: i + 1 };
    return { hijri, date, weekday: weekday(date), events: hijriEvents(hijri) };
  });
}

/** One month earlier or later, or null past either end of the supported range. */
export function shiftHijriMonth({ year, month }: HijriMonth, delta: number): HijriMonth | null {
  const index = year * 12 + (month - 1) + delta;
  const next = { year: Math.floor(index / 12), month: (index % 12) + 1 };
  const key = (m: HijriMonth) => m.year * 12 + m.month;
  return key(next) < key(HIJRI_FIRST) || key(next) > key(HIJRI_LAST) ? null : next;
}

/**
 * Lays days out in weeks that start on `weekStart` (0 = Sunday ... 6 = Saturday). Blank cells
 * before the first day and after the last are null.
 */
export function monthWeeks<T extends { weekday: number }>(
  days: readonly T[],
  weekStart: number,
): (T | null)[][] {
  if (days.length === 0) return [];
  const lead = (days[0]!.weekday - weekStart + 7) % 7;
  const cells: (T | null)[] = [...Array<null>(lead).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}
