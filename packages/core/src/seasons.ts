// Seasonal modes (SPEC 5.8): Ramadan and the first ten days of Dhul Hijjah, read from the Hijri
// date with the person's offset. Marks and countdowns only: the app points to the day and never
// asks why a fast or a night prayer was not logged.

import { toHijri, type HijriOffset } from './hijri';
import type { DayTimes } from './prayer-times';
import { addDays, type CivilDate } from './time';

export interface RamadanFast {
  date: CivilDate;
  /** The day of Ramadan, 1 to 30. */
  day: number;
}

export interface RamadanState {
  /** The next or current fast of Ramadan: today's until Maghrib, then tomorrow's. */
  fast: RamadanFast | null;
  /** Suhoor runs until that fast's Fajr; then iftar comes at Maghrib. */
  countdown: { kind: 'suhoor'; until: Date } | { kind: 'iftar'; at: Date } | null;
  /** The last ten nights begin at Maghrib on the 20th, the night before the 21st's fast. */
  lastTenNights: boolean;
  /** The juz suggested for the fast's day (SPEC 5.8: "Quran suggests a daily juz"). */
  juz: number | null;
  /** Today, when it is a day of Ramadan: the fast "Fasting today" logs, even after iftar. */
  today: RamadanFast | null;
  /** After Isha and until Fajr on a night of Ramadan: the evening whose Taraweeh is logged. */
  taraweehDate: CivilDate | null;
}

/**
 * Ramadan at this instant, or null outside it. `times` and `tomorrow` are the place's prayer
 * times for `today` and the day after.
 */
export function ramadanState(
  now: Date,
  today: CivilDate,
  times: DayTimes,
  tomorrow: DayTimes,
  offset: HijriOffset = 0,
): RamadanState | null {
  const t = now.getTime();
  const isRamadan = (d: CivilDate) => toHijri(d, offset).month === 9;
  const fastOf = (d: CivilDate): RamadanFast | null =>
    isRamadan(d) ? { date: d, day: toHijri(d, offset).day } : null;

  const afterMaghrib = t >= times.maghrib.getTime();
  const fast = fastOf(afterMaghrib ? addDays(today, 1) : today);
  const todayFast = fastOf(today);
  // A night of Ramadan is the night before one of its days: after Isha, or before Fajr.
  const night = t >= times.isha.getTime() || t < times.fajr.getTime();
  const evening = t < times.fajr.getTime() ? addDays(today, -1) : today;
  const taraweehDate = night && isRamadan(addDays(evening, 1)) ? evening : null;

  if (!fast && !todayFast && !taraweehDate) return null;
  const fastTimes = afterMaghrib ? tomorrow : times;
  return {
    fast,
    countdown: !fast
      ? null
      : t < fastTimes.fajr.getTime()
        ? { kind: 'suhoor', until: fastTimes.fajr }
        : { kind: 'iftar', at: times.maghrib },
    lastTenNights: (fast?.day ?? 0) >= 21,
    juz: fast ? Math.min(fast.day, 30) : null,
    today: todayFast,
    taraweehDate,
  };
}

export interface DhulHijjahState {
  /** The day of the first nine of Dhul Hijjah (the tenth is Eid al-Adha). */
  day: number;
  arafah: 'tomorrow' | 'today' | null;
}

export function dhulHijjahState(today: CivilDate, offset: HijriOffset = 0): DhulHijjahState | null {
  const { month, day } = toHijri(today, offset);
  if (month !== 12 || day > 9) return null;
  return { day, arafah: day === 8 ? 'tomorrow' : day === 9 ? 'today' : null };
}
