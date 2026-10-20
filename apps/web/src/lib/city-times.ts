import type { City } from '@murshid/content/cities';
import {
  addDays,
  civilDate,
  defaultMethodFor,
  defaultSettings,
  distanceToMakkah,
  prayerTimes,
  qiblaBearing,
  timeNames,
  toHijri,
  type CivilDate,
  type HijriDate,
  type MethodId,
  type TimeName,
  zoneOffsetMinutes,
} from '@murshid/core';
import { cacheLife } from 'next/cache';

// A city's prayer day for its public page (Phase 6): today's times in the city's own calendar,
// tomorrow's Fajr (the next prayer after Isha), the month's timetable, the Hijri date and the
// Qibla. Computed with the country's usual method (SPEC 10) and kept for an hour, never past the
// city's midnight, so the page is served from cache and still names the right day; the next
// prayer's countdown runs in the visitor's browser.

export type Times = Record<TimeName, string>;

export interface CityDay {
  date: CivilDate;
  hijri: HijriDate;
  method: MethodId;
  /** Instants as ISO strings, so the result can be cached and sent to the browser. */
  times: Times;
  jumuah: boolean;
  tomorrowFajr: string;
  month: { date: CivilDate; times: Times }[];
  qibla: { bearing: number; km: number };
}

const iso = (day: Record<TimeName, Date>): Times =>
  Object.fromEntries(timeNames.map((n) => [n, day[n].toISOString()])) as Times;

/** Seconds from `now` to the next midnight in a time zone. */
function secondsToMidnight(now: Date, date: CivilDate, timeZone: string): number {
  const next = addDays(date, 1);
  const utc = Date.UTC(next.year, next.month - 1, next.day);
  // The zone's offset at midnight itself (a daylight-saving change may fall in between).
  const guess = utc - zoneOffsetMinutes(now, timeZone) * 60_000;
  const midnight = utc - zoneOffsetMinutes(new Date(guess), timeZone) * 60_000;
  return Math.ceil((midnight - now.getTime()) / 1000);
}

export async function cityDay(city: City): Promise<CityDay> {
  'use cache';
  const now = new Date();
  const place = { latitude: city.latitude, longitude: city.longitude };
  const method = defaultMethodFor(city.countryCode);
  const settings = { ...defaultSettings, method };
  const date = civilDate(now, city.timeZone);
  // Five minutes at least: a shorter-lived cache would leave the page out of prerendering.
  const expire = Math.max(300, secondsToMidnight(now, date, city.timeZone));
  cacheLife({ stale: 300, revalidate: Math.min(3600, expire), expire });
  const day = prayerTimes(place, date, settings);
  const days = new Date(Date.UTC(date.year, date.month, 0)).getUTCDate();
  return {
    date,
    hijri: toHijri(date),
    method,
    times: iso(day),
    jumuah: day.jumuah,
    tomorrowFajr: prayerTimes(place, addDays(date, 1), settings).fajr.toISOString(),
    month: Array.from({ length: days }, (_, i) => {
      const d = { year: date.year, month: date.month, day: i + 1 };
      return { date: d, times: iso(prayerTimes(place, d, settings)) };
    }),
    qibla: { bearing: qiblaBearing(place), km: distanceToMakkah(place) },
  };
}
