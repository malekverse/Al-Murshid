// Night reflection (SPEC 5.7): an optional prompt after Isha. A reflection belongs to an evening,
// so one written after midnight still counts for the night that began at Maghrib.

import type { DayTimes } from './prayer-times';
import { addDays, type CivilDate } from './time';

/** The evening a reflection written now belongs to: today's, or yesterday's until Fajr. */
export function reflectionNight(now: Date, today: CivilDate, times: DayTimes): CivilDate {
  return now.getTime() < times.fajr.getTime() ? addDays(today, -1) : today;
}

/** From Isha until Fajr: when Today may invite a reflection. */
export function isReflectionTime(now: Date, times: DayTimes): boolean {
  const t = now.getTime();
  return t >= times.isha.getTime() || t < times.fajr.getTime();
}
