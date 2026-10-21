// Your Sky (SPEC 3, 5.7): the history of logged prayers as a month of small skies. A day with
// prayers glows; any other day is plain night, never marked. The month is a Hijri month, as in the
// calendar (SPEC 5.4), so the same offset maps its days to the days prayers were logged on.

import { hijriMonthDays, type CalendarDay, type HijriMonth } from './calendar';
import type { HijriOffset } from './hijri';
import { prayers, type Prayer } from './prayer-times';
import { isoDate, type CivilDate } from './time';
import type { LoggedPrayer } from './today';

export interface SkyDay extends CalendarDay {
  /** The prayers logged that day, in the order of the day, each once. */
  prayers: Prayer[];
  isToday: boolean;
  /** Days after today have no sky yet. */
  future: boolean;
}

export function skyMonth(
  month: HijriMonth,
  offset: HijriOffset,
  logs: readonly LoggedPrayer[],
  today: CivilDate,
): SkyDay[] {
  const byDate = new Map<string, Set<Prayer>>();
  for (const { date, prayer } of logs) {
    const day = byDate.get(date) ?? new Set<Prayer>();
    day.add(prayer);
    byDate.set(date, day);
  }
  const todayKey = isoDate(today);
  return hijriMonthDays(month, offset).map((day) => {
    const key = isoDate(day.date);
    const logged = byDate.get(key);
    return {
      ...day,
      prayers: logged ? prayers.filter((p) => logged.has(p)) : [],
      isToday: key === todayKey,
      future: key > todayKey,
    };
  });
}

/** The ISO dates a month's sky reads logs for: its first and last day. */
export function skyMonthRange(month: HijriMonth, offset: HijriOffset): [string, string] {
  const days = hijriMonthDays(month, offset);
  return [isoDate(days[0]!.date), isoDate(days.at(-1)!.date)];
}
