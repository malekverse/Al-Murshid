// Personal settings (SPEC 9), kept on the device: MMKV on mobile, localStorage on web. One
// schema for both apps. Every field falls back to its default on its own, so a damaged or
// older value never resets everything else.

import {
  cardKinds,
  defaultMethodFor,
  defaultReminders,
  isoDate,
  methods,
  parseIsoDate,
  prayers,
  previousStep,
  shouldWelcomeBack,
  startingPrayerStep,
  steps,
  TASBIH_MAX,
  timeNames,
  type CardKind,
  type CivilDate,
  type JourneyFocus,
  type LatLng,
  type MethodId,
  type Prayer,
  type PrayerSettings,
  type StartingPoint,
  type Step,
  type TimeName,
  type Track,
} from '@murshid/core';
import { z } from 'zod';
import { defaultQuranPrefs, quranPrefsSchema } from './quran';

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const methodIds = Object.keys(methods) as [MethodId, ...MethodId[]];

export const locationSchema = z.object({
  /** "Tunis": what the person sees and what sync stores (SPEC 9). */
  label: z.string().min(1),
  countryCode: z.string().length(2),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timeZone: z.string().min(1),
  /** Device location, or a city chosen by hand. */
  source: z.enum(['device', 'city']),
  /** GeoNames id of the chosen or nearest city. */
  cityId: z.number().int().optional(),
  /** The city's name in each language that has one, so the label follows the UI language. */
  names: z
    .object({ ar: z.string().optional(), en: z.string().optional(), fr: z.string().optional() })
    .optional(),
});
export type LocationSetting = z.infer<typeof locationSchema>;

/** The fields of a city the location needs (GeoNames, from @murshid/content/cities). */
export interface CityLike {
  id: number;
  name: string;
  names: { en?: string; ar?: string; fr?: string };
  countryCode: string;
  latitude: number;
  longitude: number;
  timeZone: string;
}

/**
 * A location from a city chosen by hand, or from the device's position named after its nearest
 * city. Coordinates keep three decimals (about 100 m): plenty for prayer times, and no more
 * precise than needed, even on the device.
 */
export function locationFromCity(
  city: CityLike,
  position?: { latitude: number; longitude: number },
): LocationSetting {
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    label: city.names.en ?? city.name,
    countryCode: city.countryCode,
    latitude: round(position?.latitude ?? city.latitude),
    longitude: round(position?.longitude ?? city.longitude),
    timeZone: city.timeZone,
    source: position ? 'device' : 'city',
    cityId: city.id,
    names: {
      en: city.names.en ?? city.name,
      ...(city.names.ar && { ar: city.names.ar }),
      ...(city.names.fr && { fr: city.names.fr }),
    },
  };
}

/** The location's name in the UI language. */
export function locationLabel(location: LocationSetting, locale: string): string {
  const lang = locale.split('-')[0] as 'ar' | 'en' | 'fr';
  return location.names?.[lang] ?? location.label;
}

const reminderSchema = z.object({
  style: z.enum(['adhan', 'soft', 'silent', 'off']),
  before: z.number().int().min(5).max(30).nullable(),
});

const focusSchema = <T extends Track>(track: T) =>
  z.object({
    step: z.enum(steps[track] as unknown as [Step<T>, ...Step<T>[]]),
    lastOfferedOn: isoDateString.optional(),
  });

export const settingsSchema = z.object({
  onboarded: z.boolean().catch(false),
  location: locationSchema.nullable().catch(null),
  method: z.enum(methodIds).catch('mwl'),
  /** "country" follows the location's country; "user" keeps the person's own choice. */
  methodSource: z.enum(['country', 'user']).catch('country'),
  asr: z.enum(['standard', 'hanafi']).catch('standard'),
  highLatitude: z
    .enum(['auto', 'middle-of-the-night', 'seventh-of-the-night', 'twilight-angle'])
    .catch('auto'),
  /** Minutes added per time, as some mosques do. */
  adjustments: z
    .partialRecord(
      z.enum(timeNames as unknown as [TimeName, ...TimeName[]]),
      z.number().int().min(-30).max(30),
    )
    .catch({}),
  hijriOffset: z
    .union([z.literal(-2), z.literal(-1), z.literal(0), z.literal(1), z.literal(2)])
    .catch(0),
  reminders: z
    .object({
      fajr: reminderSchema,
      dhuhr: reminderSchema,
      asr: reminderSchema,
      maghrib: reminderSchema,
      isha: reminderSchema,
    })
    .catch(defaultReminders),
  /** After 5 ignored reminders in a row, reminders reduce to the focus prayer (SPEC 3). */
  ignoredReminders: z.number().int().min(0).catch(0),
  remindersReduced: z.boolean().catch(false),
  journey: z
    .object({
      prayer: focusSchema('prayer').extend({ focusPrayer: z.enum(prayers) }),
      quran: focusSchema('quran').nullable(),
      remembrance: focusSchema('remembrance').nullable(),
    })
    .catch({
      prayer: { step: 'one-prayer', focusPrayer: 'maghrib' },
      quran: null,
      remembrance: null,
    }),
  simpleView: z.boolean().catch(false),
  /** Ramadan mode (SPEC 5.8): automatic by the Hijri date unless turned off. */
  ramadanMode: z.boolean().catch(true),
  /** Your Sky shows counts only when asked (SPEC 5.7: "Show details"). */
  showSkyDetails: z.boolean().catch(false),
  /** Night reflection (SPEC 5.7): Today invites one after Isha unless turned off. */
  reflectionPrompt: z.boolean().catch(true),
  /** The evening whose invitation was set aside ("Not tonight"). */
  reflectionSetAside: isoDateString.nullable().catch(null),
  /** Tasbih's target (SPEC 5.6): 33, 99, 100, a custom one, or none (null). */
  tasbihTarget: z.number().int().min(1).max(TASBIH_MAX).nullable().catch(33),
  /** One setting turns every haptic off (SPEC 6.5). */
  haptics: z.boolean().catch(true),
  /** Reading preferences for the Quran (SPEC 5.5; synced as SPEC 9's Quran preferences). */
  quran: quranPrefsSchema.catch(() => defaultQuranPrefs()),
  /** The last day the app was opened, and the one before it (for "Welcome back"). */
  lastOpenedOn: isoDateString.nullable().catch(null),
  previousOpenedOn: isoDateString.nullable().catch(null),
  dismissedCards: z
    .object({ date: isoDateString, kinds: z.array(z.enum(cardKinds)) })
    .nullable()
    .catch(null),
});

export type Settings = z.infer<typeof settingsSchema>;

export function defaultSettings(): Settings {
  return settingsSchema.parse({});
}

/** Reads stored settings; anything missing or damaged takes its default. */
export function parseSettings(raw: unknown): Settings {
  return settingsSchema.parse(raw !== null && typeof raw === 'object' ? raw : {});
}

export function prayerSettings(s: Settings): PrayerSettings {
  return {
    method: s.method,
    asr: s.asr,
    highLatitude: s.highLatitude,
    adjustments: s.adjustments,
  };
}

/** The place prayer times are calculated for, once a location is set. */
export function placeOf(s: Settings): (LatLng & { timeZone: string }) | null {
  return s.location
    ? {
        latitude: s.location.latitude,
        longitude: s.location.longitude,
        timeZone: s.location.timeZone,
      }
    : null;
}

/** A new location. The calculation method follows its country unless the person chose one. */
export function withLocation(s: Settings, location: LocationSetting): Settings {
  return {
    ...s,
    location,
    method: s.methodSource === 'user' ? s.method : defaultMethodFor(location.countryCode),
  };
}

export function withMethod(s: Settings, method: MethodId): Settings {
  return { ...s, method, methodSource: 'user' };
}

/** Onboarding's "Where are you today?" sets the starting prayer step only (SPEC 3). */
export function withStartingPoint(s: Settings, answer: StartingPoint): Settings {
  return {
    ...s,
    journey: { ...s.journey, prayer: { ...s.journey.prayer, step: startingPrayerStep(answer) } },
  };
}

export function journeyFocus(s: Settings): JourneyFocus[] {
  const focus: JourneyFocus[] = [];
  const { prayer, quran, remembrance } = s.journey;
  const date = (d?: string) => (d ? parseIsoDate(d) : undefined);
  focus.push({
    track: 'prayer',
    step: prayer.step,
    focusPrayer: prayer.focusPrayer,
    lastOfferedOn: date(prayer.lastOfferedOn),
  });
  if (quran)
    focus.push({ track: 'quran', step: quran.step, lastOfferedOn: date(quran.lastOfferedOn) });
  if (remembrance) {
    focus.push({
      track: 'remembrance',
      step: remembrance.step,
      lastOfferedOn: date(remembrance.lastOfferedOn),
    });
  }
  return focus;
}

/** "A new step is ready when you are": accepted, or set aside for now. Either way, a quiet week. */
export function answerStepOffer(
  s: Settings,
  track: Track,
  step: Step,
  accepted: boolean,
  today: CivilDate,
): Settings {
  const current = s.journey[track];
  if (!current) return s;
  const lastOfferedOn = isoDate(today);
  return {
    ...s,
    journey: {
      ...s.journey,
      [track]: { ...current, ...(accepted ? { step } : {}), lastOfferedOn },
    },
  };
}

/** The person's own choice of step on a track ("Change focus"); starts an optional track. */
export function withJourneyStep<T extends Track>(s: Settings, track: T, step: Step<T>): Settings {
  const current = s.journey[track];
  return { ...s, journey: { ...s.journey, [track]: { ...current, step } } };
}

/** One step back on a track: always there, never a failure (SPEC 3). */
export function stepBackJourney(s: Settings, track: Track): Settings {
  const current = s.journey[track];
  if (!current) return s;
  return withJourneyStep(s, track, previousStep(track, current.step));
}

/** Stops following an optional track. The prayer track always holds a focus. */
export function pauseJourneyTrack(s: Settings, track: 'quran' | 'remembrance'): Settings {
  return { ...s, journey: { ...s.journey, [track]: null } };
}

/** The prayer held every day on the first step of the prayer track. */
export function withFocusPrayer(s: Settings, focusPrayer: Prayer): Settings {
  return { ...s, journey: { ...s.journey, prayer: { ...s.journey.prayer, focusPrayer } } };
}

/** Records today's first visit, keeping the previous one for "Welcome back". */
export function markOpened(s: Settings, today: CivilDate): Settings {
  const iso = isoDate(today);
  if (s.lastOpenedOn === iso) return s;
  return { ...s, previousOpenedOn: s.lastOpenedOn, lastOpenedOn: iso };
}

/**
 * The last visit before today, which decides whether Today says "Welcome back". Correct both
 * before and after today's visit is recorded.
 */
export function previousVisit(s: Settings, today: CivilDate): CivilDate | null {
  const last = s.lastOpenedOn === isoDate(today) ? s.previousOpenedOn : s.lastOpenedOn;
  return last ? parseIsoDate(last) : null;
}

export function isWelcomeBack(s: Settings, today: CivilDate): boolean {
  return shouldWelcomeBack(previousVisit(s, today), today);
}

export function dismissCard(s: Settings, kind: CardKind, today: CivilDate): Settings {
  const date = isoDate(today);
  const kinds = s.dismissedCards?.date === date ? s.dismissedCards.kinds : [];
  return { ...s, dismissedCards: { date, kinds: [...new Set([...kinds, kind])] } };
}

/** "Not tonight": the evening's invitation is set aside, even past midnight. */
export function setAsideReflection(s: Settings, night: CivilDate): Settings {
  return { ...s, reflectionSetAside: isoDate(night) };
}

/** The evenings Today no longer invites a reflection for: those written and the one set aside. */
export function settledNights(s: Settings, written: readonly string[]): string[] {
  return s.reflectionSetAside ? [...written, s.reflectionSetAside] : [...written];
}

export function dismissedToday(s: Settings, today: CivilDate): CardKind[] {
  return s.dismissedCards?.date === isoDate(today) ? s.dismissedCards.kinds : [];
}
