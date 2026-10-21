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

/** Cards whose destination exists on mobile in this build (later phases add the rest). */
const mobileCards: CardKind[] = [
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

/** Everything Today shows. `undefined` while logs load; null when no location is set. */
export function useToday(now: Date): TodayState | null | undefined {
  const settings = useSettings();
  const place = placeOf(settings);
  const date = place ? civilDate(now, place.timeZone) : null;
  const logs = useRecentLogs(date);
  const written = useWrittenNights();

  if (!place || !date) return null;
  if (!logs || !written) return undefined;
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
      cards: mobileCards,
      ramadanMode: settings.ramadanMode,
      reflection: { prompt: settings.reflectionPrompt, settled: settledNights(settings, written) },
    }),
  };
}
