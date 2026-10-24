// Today (SPEC 4, 5.1): everything the Today screen shows at one instant, as plain data, so web
// and mobile render the same day from the same inputs. Nothing here counts what was not done:
// a prayer is logged or it is simply open (SPEC 2).

import type { LatLng } from './geo';
import { toHijri, type HijriDate, type HijriOffset } from './hijri';
import { shouldWelcomeBack, stepToOffer, type DayRecord, type Step, type Track } from './journey';
import {
  prayers,
  prayerState,
  prayerTimes,
  timeNames,
  type DayTimes,
  type Prayer,
  type PrayerSettings,
  type TimeName,
} from './prayer-times';
import { isReflectionTime, reflectionNight } from './reflection';
import { dhulHijjahState, ramadanState, type DhulHijjahState, type RamadanState } from './seasons';
import { addDays, civilDate, daysBetween, isoDate, weekday, type CivilDate } from './time';

/** One "I prayed": the prayer and the calendar day it belongs to. */
export interface LoggedPrayer {
  /** ISO date, "2026-10-18". */
  date: string;
  prayer: Prayer;
}

export type RowStatus = 'logged' | 'current' | 'open';

export interface TodayRow {
  name: TimeName;
  at: Date;
  /** Sunrise is a marker and is always "open". */
  status: RowStatus;
  /** Friday's Dhuhr reads "Jumu'ah". */
  jumuah: boolean;
}

/**
 * The hero (SPEC 5.1): inside a prayer's window that is not logged yet, "Now: Asr" with the time
 * left and the "I prayed" action; otherwise the next prayer and its countdown.
 */
export type Hero =
  | { mode: 'now'; prayer: Prayer; date: CivilDate; endsAt: Date; jumuah: boolean }
  | { mode: 'next'; prayer: Prayer; date: CivilDate; at: Date; jumuah: boolean };

export interface EarlierPrayer {
  date: CivilDate;
  prayer: Prayer;
  at: Date;
  logged: boolean;
  jumuah: boolean;
}

/** In the order SPEC 5.1 ranks them; Today shows the first that applies. */
export const cardKinds = [
  'welcome-back',
  'ramadan',
  'jumuah',
  'dhul-hijjah',
  'morning-adhkar',
  'evening-adhkar',
  'step-offer',
  // Fajr Rise's offer (SPEC 5.10), in the evenings of the first week: where one sets an alarm.
  'fajr-rise',
  // Not ranked by SPEC 5.1; after Isha it comes last, so a step offer is never pushed aside.
  'night-reflection',
] as const;
export type CardKind = (typeof cardKinds)[number];

export type ContextCard =
  { kind: Exclude<CardKind, 'step-offer'> } | { kind: 'step-offer'; track: Track; step: Step };

export interface JourneyFocus {
  track: Track;
  step: Step;
  focusPrayer?: Prayer;
  lastOfferedOn?: CivilDate;
}

export interface TodayInput {
  now: Date;
  place: LatLng & { timeZone: string };
  settings: PrayerSettings;
  hijriOffset?: HijriOffset;
  logs: readonly LoggedPrayer[];
  /** The last day the app was opened before this visit (for "Welcome back"). */
  lastOpenedOn?: CivilDate | null;
  /** Each active track's current step, prayer track first. */
  journey?: readonly JourneyFocus[];
  /** Cards the person set aside today. */
  dismissed?: readonly CardKind[];
  /** Cards whose destination exists in this build; others are never shown. */
  cards?: readonly CardKind[];
  /** Ramadan mode (SPEC 5.8): on by default, the person can turn it off. */
  ramadanMode?: boolean;
  /**
   * Night reflection (SPEC 5.7): whether Today invites one after Isha, and the evenings already
   * written or set aside ("2026-10-18").
   */
  reflection?: { prompt: boolean; settled: readonly string[] };
  /** Whether Fajr Rise may still be offered (off, never set aside, within its first week). */
  riseOffer?: boolean;
}

export interface TodayView {
  /** The place's calendar day. */
  date: CivilDate;
  hijri: HijriDate;
  times: DayTimes;
  tomorrow: DayTimes;
  rows: TodayRow[];
  hero: Hero;
  /** Earlier today (times already reached) and all of yesterday, for the "Earlier prayers" sheet. */
  earlier: EarlierPrayer[];
  /** One contextual card at most (SPEC 4, 5.1). */
  card: ContextCard | null;
  /** Ramadan's countdowns and logs, when it is Ramadan and its mode is on (SPEC 5.8). */
  ramadan: RamadanState | null;
  /** The first nine days of Dhul Hijjah (SPEC 5.8). */
  dhulHijjah: DhulHijjahState | null;
  /** The evening a reflection written now belongs to (SPEC 5.7). */
  night: CivilDate;
  /** Today's greeting for the time of day (SPEC 5.11). */
  greeting: Greeting;
}

/** Morning from Fajr to Dhuhr, afternoon until Maghrib, evening through the night. */
export type Greeting = 'morning' | 'afternoon' | 'evening';

export function greetingAt(now: Date, times: DayTimes): Greeting {
  const t = now.getTime();
  if (t >= times.fajr.getTime() && t < times.dhuhr.getTime()) return 'morning';
  if (t >= times.dhuhr.getTime() && t < times.maghrib.getTime()) return 'afternoon';
  return 'evening';
}

const FRIDAY = 5;
const THURSDAY = 4;

/** Group logs into the Journey's day records (prayers only until Remember and Quran log too). */
export function dayRecords(logs: readonly LoggedPrayer[]): DayRecord[] {
  const byDate = new Map<string, Set<Prayer>>();
  for (const log of logs) {
    const set = byDate.get(log.date) ?? new Set<Prayer>();
    set.add(log.prayer);
    byDate.set(log.date, set);
  }
  return [...byDate].map(([date, set]) => {
    const [year, month, day] = date.split('-').map(Number) as [number, number, number];
    return {
      date: { year, month, day },
      prayers: prayers.filter((p) => set.has(p)),
      morningAdhkar: false,
      eveningAdhkar: false,
      ayahsRead: 0,
      pagesRead: 0,
      khatmahPortionDone: false,
      tasbihAfterPrayer: false,
      rawatib: 0,
    };
  });
}

function chooseCard(
  input: TodayInput,
  date: CivilDate,
  times: DayTimes,
  logs: readonly LoggedPrayer[],
  seasons: { ramadan: RamadanState | null; dhulHijjah: DhulHijjahState | null },
  night: CivilDate,
): ContextCard | null {
  const allowed = (kind: CardKind) =>
    (input.cards ?? cardKinds).includes(kind) && !(input.dismissed ?? []).includes(kind);
  const t = input.now.getTime();
  const day = weekday(date);

  if (allowed('welcome-back') && shouldWelcomeBack(input.lastOpenedOn ?? null, date)) {
    return { kind: 'welcome-back' };
  }
  if (allowed('ramadan') && seasons.ramadan) return { kind: 'ramadan' };
  // Jumu'ah runs from Thursday's Maghrib to Friday's Maghrib (SPEC 5.1).
  const jumuah =
    (day === THURSDAY && t >= times.maghrib.getTime()) ||
    (day === FRIDAY && t < times.maghrib.getTime());
  if (allowed('jumuah') && jumuah) return { kind: 'jumuah' };
  if (allowed('dhul-hijjah') && seasons.dhulHijjah) return { kind: 'dhul-hijjah' };
  if (allowed('morning-adhkar') && t >= times.fajr.getTime() && t < times.dhuhr.getTime()) {
    return { kind: 'morning-adhkar' };
  }
  if (allowed('evening-adhkar') && t >= times.asr.getTime() && t < times.isha.getTime()) {
    return { kind: 'evening-adhkar' };
  }
  if (allowed('step-offer')) {
    const days = dayRecords(logs);
    for (const focus of input.journey ?? []) {
      const step = stepToOffer({ ...focus, today: date, days });
      if (step) return { kind: 'step-offer', track: focus.track, step };
    }
  }
  if (allowed('fajr-rise') && input.riseOffer && t >= times.maghrib.getTime()) {
    return { kind: 'fajr-rise' };
  }
  const reflection = input.reflection;
  if (
    allowed('night-reflection') &&
    reflection?.prompt &&
    isReflectionTime(input.now, times) &&
    !reflection.settled.includes(isoDate(night))
  ) {
    return { kind: 'night-reflection' };
  }
  return null;
}

export function todayView(input: TodayInput): TodayView {
  const { now, place, settings } = input;
  const date = civilDate(now, place.timeZone);
  const yesterdayDate = addDays(date, -1);
  const times = prayerTimes(place, date, settings);
  const tomorrow = prayerTimes(place, addDays(date, 1), settings);
  const yesterday = prayerTimes(place, yesterdayDate, settings);

  const logged = new Set(input.logs.map((l) => `${l.date}:${l.prayer}`));
  const isLogged = (d: CivilDate, p: Prayer) => logged.has(`${isoDate(d)}:${p}`);
  const isJumuah = (d: CivilDate, p: TimeName) => p === 'dhuhr' && weekday(d) === FRIDAY;

  const state = prayerState(now, times, tomorrow);
  // Before Fajr, the Isha being prayed belongs to yesterday.
  const beforeFajr = now.getTime() < times.fajr.getTime();
  const currentDate = beforeFajr ? yesterdayDate : date;

  const hero: Hero =
    state.current && state.currentEndsAt && !isLogged(currentDate, state.current)
      ? {
          mode: 'now',
          prayer: state.current,
          date: currentDate,
          endsAt: state.currentEndsAt,
          jumuah: isJumuah(currentDate, state.current),
        }
      : {
          mode: 'next',
          prayer: state.next,
          date: state.nextDate,
          at: state.nextAt,
          jumuah: isJumuah(state.nextDate, state.next),
        };

  const rows: TodayRow[] = timeNames.map((name) => ({
    name,
    at: times[name],
    status:
      name === 'sunrise'
        ? 'open'
        : isLogged(date, name)
          ? 'logged'
          : state.current === name && !beforeFajr
            ? 'current'
            : 'open',
    jumuah: times.jumuah && name === 'dhuhr',
  }));

  const earlier: EarlierPrayer[] = [
    ...prayers
      .filter((p) => times[p].getTime() <= now.getTime())
      .map((p) => ({ date, prayer: p, at: times[p] })),
    ...prayers.map((p) => ({ date: yesterdayDate, prayer: p, at: yesterday[p] })),
  ].map((e) => ({ ...e, logged: isLogged(e.date, e.prayer), jumuah: isJumuah(e.date, e.prayer) }));

  const offset = input.hijriOffset ?? 0;
  const seasons = {
    ramadan: input.ramadanMode === false ? null : ramadanState(now, date, times, tomorrow, offset),
    dhulHijjah: dhulHijjahState(date, offset),
  };
  const night = reflectionNight(now, date, times);
  return {
    date,
    hijri: toHijri(date, offset),
    times,
    tomorrow,
    rows,
    hero,
    earlier,
    card: chooseCard(input, date, times, input.logs, seasons, night),
    ...seasons,
    night,
    greeting: greetingAt(now, times),
  };
}

/** Logs older than this many days are never needed by Today or the Journey. */
export const TODAY_LOG_WINDOW_DAYS = 8;

/** Whether a log falls inside the window Today and the Journey read. */
export function isRecentLog(log: LoggedPrayer, today: CivilDate): boolean {
  const [year, month, day] = log.date.split('-').map(Number) as [number, number, number];
  const age = daysBetween({ year, month, day }, today);
  return age >= 0 && age < TODAY_LOG_WINDOW_DAYS;
}
