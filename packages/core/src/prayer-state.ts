// Where the person is in their day (SPEC 4), kept apart from the calculation so a page that
// reads times computed ahead does not ship adhan-js.

import type { DayTimes, Prayer } from './prayer-times';
import { addDays, type CivilDate } from './time';

export interface PrayerState {
  /** The prayer whose window we are in, if any (none between sunrise and Dhuhr). */
  current: Prayer | null;
  /** When the current window ends (Fajr ends at sunrise, Isha at the next Fajr). */
  currentEndsAt: Date | null;
  next: Prayer;
  nextAt: Date;
  /** The day `next` belongs to (tomorrow after Isha). */
  nextDate: CivilDate;
}

/**
 * Where the person is in their day (SPEC 4: organized by time). `today` is the city's calendar
 * day; `tomorrow` gives the next Fajr, `yesterday` the Isha that runs until today's Fajr.
 */
export function prayerState(now: Date, today: DayTimes, tomorrow: DayTimes): PrayerState {
  const t = now.getTime();
  const at = (d: Date) => d.getTime();
  const next = (prayer: Prayer, nextAt: Date, nextDate: CivilDate = today.date) => ({
    next: prayer,
    nextAt,
    nextDate,
  });

  if (t < at(today.fajr))
    return { current: 'isha', currentEndsAt: today.fajr, ...next('fajr', today.fajr) };
  if (t < at(today.sunrise))
    return { current: 'fajr', currentEndsAt: today.sunrise, ...next('dhuhr', today.dhuhr) };
  if (t < at(today.dhuhr))
    return { current: null, currentEndsAt: null, ...next('dhuhr', today.dhuhr) };
  if (t < at(today.asr))
    return { current: 'dhuhr', currentEndsAt: today.asr, ...next('asr', today.asr) };
  if (t < at(today.maghrib))
    return { current: 'asr', currentEndsAt: today.maghrib, ...next('maghrib', today.maghrib) };
  if (t < at(today.isha))
    return { current: 'maghrib', currentEndsAt: today.isha, ...next('isha', today.isha) };
  return {
    current: 'isha',
    currentEndsAt: tomorrow.fajr,
    ...next('fajr', tomorrow.fajr, addDays(today.date, 1)),
  };
}
