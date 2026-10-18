// The Journey (SPEC 3): private, optional next steps that never take anything away. No points,
// no streaks, no scores. A step is offered when it has been held on 5 of the last 7 days; it is
// never advanced automatically, and stepping back is always one tap with no message of failure.

import type { Prayer } from './prayer-times';
import { addDays, daysBetween, isoDate, type CivilDate } from './time';

export const tracks = ['prayer', 'quran', 'remembrance'] as const;
export type Track = (typeof tracks)[number];

export const steps = {
  prayer: ['one-prayer', 'two-prayers', 'five-prayers', 'five-and-adhkar', 'rawatib'],
  quran: ['one-ayah', 'one-page', 'khatmah'],
  remembrance: ['morning-adhkar', 'evening-adhkar', 'tasbih-after-prayer'],
} as const satisfies Record<Track, readonly string[]>;

export type Step<T extends Track = Track> = (typeof steps)[T][number];

/** What the person did on one day, as the app already records it. Nothing is inferred. */
export interface DayRecord {
  date: CivilDate;
  prayers: readonly Prayer[];
  morningAdhkar: boolean;
  eveningAdhkar: boolean;
  ayahsRead: number;
  pagesRead: number;
  khatmahPortionDone: boolean;
  tasbihAfterPrayer: boolean;
  rawatib: number;
}

/** Was this step held on this day? Steps build on one another within a track. */
export function heldOn(track: Track, step: Step, day: DayRecord, focusPrayer?: Prayer): boolean {
  const count = new Set(day.prayers).size;
  switch (track) {
    case 'prayer':
      switch (step) {
        case 'one-prayer':
          return focusPrayer ? day.prayers.includes(focusPrayer) : count >= 1;
        case 'two-prayers':
          return count >= 2;
        case 'five-prayers':
          return count >= 5;
        case 'five-and-adhkar':
          return count >= 5 && day.morningAdhkar && day.eveningAdhkar;
        default:
          return count >= 5 && day.rawatib > 0;
      }
    case 'quran':
      if (step === 'one-ayah') return day.ayahsRead >= 1;
      if (step === 'one-page') return day.pagesRead >= 1;
      return day.khatmahPortionDone;
    case 'remembrance':
      if (step === 'morning-adhkar') return day.morningAdhkar;
      if (step === 'evening-adhkar') return day.morningAdhkar && day.eveningAdhkar;
      return day.morningAdhkar && day.eveningAdhkar && day.tasbihAfterPrayer;
  }
}

export function nextStep<T extends Track>(track: T, step: Step<T>): Step<T> | null {
  const list = steps[track] as readonly Step<T>[];
  const i = list.indexOf(step);
  return i >= 0 && i < list.length - 1 ? list[i + 1]! : null;
}

/** One step back, or the same step at the start. Always available, never a failure. */
export function previousStep<T extends Track>(track: T, step: Step<T>): Step<T> {
  const list = steps[track] as readonly Step<T>[];
  const i = list.indexOf(step);
  return i > 0 ? list[i - 1]! : step;
}

export const OFFER_HELD_DAYS = 5;
export const OFFER_WINDOW_DAYS = 7;
/** After a "not now", wait this long before offering again. */
export const OFFER_QUIET_DAYS = 7;

export interface OfferInput<T extends Track> {
  track: T;
  step: Step<T>;
  today: CivilDate;
  /** Any days; only the last seven (today included) count. Missing days count as not held. */
  days: readonly DayRecord[];
  focusPrayer?: Prayer;
  /** When the person last saw an offer on this track (accepted or not). */
  lastOfferedOn?: CivilDate;
}

/** The step to offer now, if any (SPEC 3). */
export function stepToOffer<T extends Track>(input: OfferInput<T>): Step<T> | null {
  const next = nextStep(input.track, input.step);
  if (!next) return null;
  if (input.lastOfferedOn && daysBetween(input.lastOfferedOn, input.today) < OFFER_QUIET_DAYS)
    return null;

  const windowStart = addDays(input.today, -(OFFER_WINDOW_DAYS - 1));
  const inWindow = new Map<string, DayRecord>();
  for (const day of input.days) {
    const offset = daysBetween(windowStart, day.date);
    if (offset >= 0 && offset < OFFER_WINDOW_DAYS) inWindow.set(isoDate(day.date), day);
  }
  let held = 0;
  for (const day of inWindow.values()) {
    if (heldOn(input.track, input.step, day, input.focusPrayer)) held++;
  }
  return held >= OFFER_HELD_DAYS ? next : null;
}

/** Onboarding "Where are you today?" sets only the starting prayer step (SPEC 3). */
export type StartingPoint = 'just-starting' | 'sometimes' | 'most-days' | 'all-five';

export function startingPrayerStep(answer: StartingPoint): Step<'prayer'> {
  switch (answer) {
    case 'just-starting':
      return 'one-prayer';
    case 'sometimes':
      return 'two-prayers';
    case 'most-days':
      return 'five-prayers';
    case 'all-five':
      return 'five-and-adhkar';
  }
}

/** After this many days away, the next open shows "Welcome back" (SPEC 3), never the count. */
export const WELCOME_BACK_DAYS = 3;

export function shouldWelcomeBack(lastOpenedOn: CivilDate | null, today: CivilDate): boolean {
  return lastOpenedOn !== null && daysBetween(lastOpenedOn, today) >= WELCOME_BACK_DAYS;
}

/** After this many ignored reminders in a row, reminders quietly reduce to the focus prayer. */
export const IGNORED_REMINDERS_BEFORE_REDUCING = 5;

export function shouldReduceReminders(ignoredInARow: number): boolean {
  return ignoredInARow >= IGNORED_REMINDERS_BEFORE_REDUCING;
}
