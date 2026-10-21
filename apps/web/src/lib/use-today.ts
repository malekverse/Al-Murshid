'use client';

import { civilDate, todayView, type CardKind, type TodayView } from '@murshid/core';
import {
  dismissedToday,
  journeyFocus,
  liveLogs,
  placeOf,
  prayerSettings,
  previousVisit,
  settledNights,
  type Settings,
} from '@murshid/data';
import { useRecentLogs } from './prayer-logs';
import { useWrittenNights } from './reflections';
import { useSettings } from './settings';

/** Cards whose destination exists on web in this build (SPEC 5.1 lists more for later phases). */
const webCards: CardKind[] = [
  'welcome-back',
  'ramadan',
  'jumuah',
  'dhul-hijjah',
  'step-offer',
  'night-reflection',
];

export interface TodayState {
  settings: Settings;
  view: TodayView;
  place: NonNullable<ReturnType<typeof placeOf>>;
}

/**
 * Everything Today shows, recomputed as time passes and as prayers are logged. `undefined`
 * while loading; null when no location is set yet.
 */
export function useToday(now: Date | null): TodayState | null | undefined {
  const settings = useSettings();
  const place = settings ? placeOf(settings) : null;
  const date = place && now ? civilDate(now, place.timeZone) : null;
  const logs = useRecentLogs(date);
  const written = useWrittenNights();

  if (!settings || !now) return undefined;
  if (!place) return null;
  if (!logs || !date || !written) return undefined;
  return {
    settings,
    place,
    view: todayView({
      now,
      place,
      settings: prayerSettings(settings),
      hijriOffset: settings.hijriOffset,
      logs: liveLogs(logs),
      lastOpenedOn: previousVisit(settings, date),
      journey: journeyFocus(settings),
      dismissed: dismissedToday(settings, date),
      cards: webCards,
      ramadanMode: settings.ramadanMode,
      reflection: { prompt: settings.reflectionPrompt, settled: settledNights(settings, written) },
    }),
  };
}
