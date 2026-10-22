// Widgets (SPEC 5.9): the app computes the coming days once and writes them where its widgets can
// read them, so a widget only has to find the entry for "now" and works offline.

import type { LatLng } from './geo';
import { prayers, prayerTimes, type Prayer, type PrayerSettings } from './prayer-times';
import { addDays, weekday, type CivilDate } from './time';

export interface WidgetPrayer {
  date: CivilDate;
  prayer: Prayer;
  at: Date;
  /** Friday's Dhuhr is Jumu'ah. */
  jumuah: boolean;
}

const FRIDAY = 5;

/** The five prayers of each of `days` days from `from`, in order. */
export function widgetPrayers(
  place: LatLng,
  settings: PrayerSettings,
  from: CivilDate,
  days: number,
): WidgetPrayer[] {
  return Array.from({ length: days }, (_, i) => addDays(from, i)).flatMap((date) => {
    const times = prayerTimes(place, date, settings);
    return prayers.map((prayer) => ({
      date,
      prayer,
      at: times[prayer],
      jumuah: prayer === 'dhuhr' && weekday(date) === FRIDAY,
    }));
  });
}

/** The first prayer still to come at `now`, or null when the list has run out. */
export function nextWidgetPrayer(list: readonly WidgetPrayer[], now: Date): WidgetPrayer | null {
  return list.find((p) => p.at.getTime() > now.getTime()) ?? null;
}
