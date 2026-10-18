// Prayer times (SPEC 5.1, 8.4): one function both apps call with the same inputs, wrapping
// adhan-js. Times are absolute instants; format them in the city's time zone.

import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PolarCircleResolution,
  PrayerTimes,
} from 'adhan';
import type { LatLng } from './geo';
import { toHijri } from './hijri';
import { methods, type MethodId } from './methods';
import { addDays, weekday, type CivilDate } from './time';

export const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type Prayer = (typeof prayers)[number];
export type TimeName = Prayer | 'sunrise';
export const timeNames: readonly TimeName[] = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
];

export type AsrSchool = 'standard' | 'hanafi';
export type HighLatitudeChoice =
  'auto' | 'middle-of-the-night' | 'seventh-of-the-night' | 'twilight-angle';

export interface PrayerSettings {
  method: MethodId;
  asr: AsrSchool;
  highLatitude: HighLatitudeChoice;
  /** Minutes added to each time, as some mosques do (SPEC 10). */
  adjustments?: Partial<Record<TimeName, number>>;
}

export const defaultSettings: Omit<PrayerSettings, 'method'> = {
  asr: 'standard',
  highLatitude: 'auto',
};

export interface DayTimes extends Record<TimeName, Date> {
  date: CivilDate;
  /** Friday: Dhuhr is Jumu'ah (SPEC 5.8). */
  jumuah: boolean;
}

/** Above this latitude the automatic high-latitude rule applies (SPEC 5.1: about 48°). */
export const HIGH_LATITUDE = 48;

function parameters(
  settings: PrayerSettings,
  place: LatLng,
  date: CivilDate,
): CalculationParameters {
  const def = methods[settings.method];
  const params = def.adhan
    ? CalculationMethod[def.adhan]()
    : new CalculationParameters('Other', def.fajrAngle, def.ishaAngle ?? 0, def.ishaInterval ?? 0);

  // The method's own minutes (Morocco, Jordan) stack on top of adhan-js's.
  for (const [name, minutes] of Object.entries(def.minutes ?? {}) as [TimeName, number][]) {
    params.methodAdjustments[name] += minutes;
  }

  // Umm al-Qura: Isha is 120 minutes after Maghrib during Ramadan.
  if (settings.method === 'umm-al-qura' && toHijri(date).month === 9) params.ishaInterval = 120;

  params.madhab = settings.asr === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const coordinates = new Coordinates(place.latitude, place.longitude);
  params.highLatitudeRule =
    settings.highLatitude === 'middle-of-the-night'
      ? HighLatitudeRule.MiddleOfTheNight
      : settings.highLatitude === 'seventh-of-the-night'
        ? HighLatitudeRule.SeventhOfTheNight
        : settings.highLatitude === 'twilight-angle'
          ? HighLatitudeRule.TwilightAngle
          : HighLatitudeRule.recommended(coordinates);
  // Inside the polar circles, borrow times from the nearest latitude where the sun rises and sets.
  params.polarCircleResolution = PolarCircleResolution.AqrabBalad;

  const adj = settings.adjustments ?? {};
  params.adjustments = {
    fajr: adj.fajr ?? 0,
    sunrise: adj.sunrise ?? 0,
    dhuhr: adj.dhuhr ?? 0,
    asr: adj.asr ?? 0,
    maghrib: adj.maghrib ?? 0,
    isha: adj.isha ?? 0,
  };
  return params;
}

/** Prayer times for one calendar day at one place. */
export function prayerTimes(place: LatLng, date: CivilDate, settings: PrayerSettings): DayTimes {
  const coordinates = new Coordinates(place.latitude, place.longitude);
  // adhan reads the calendar day from the Date's local fields, so build it from those fields.
  const day = new Date(date.year, date.month - 1, date.day);
  const pt = new PrayerTimes(coordinates, day, parameters(settings, place, date));
  return {
    date,
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
    jumuah: weekday(date) === 5,
  };
}

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
