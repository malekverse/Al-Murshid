import {
  addDays,
  civilDate,
  defaultRise,
  planRise,
  prayerTimes,
  RISE_DAYS,
  RISE_RANGES,
  riseAnchors,
  riseChallenges,
  SNOOZE_MINUTES,
  STILL_UP_AFTER_MINUTES,
  STILL_UP_ANSWER_MINUTES,
  type MorningState,
  type PlannedRise,
  type RiseSettings,
} from '@murshid/core';
import { placeOf, prayerSettings } from '@murshid/data';
import { colors } from '@murshid/tokens';
import { requireOptionalNativeModule } from 'expo';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { mmkvValue } from './mmkv-value';
import { translator } from './reminders';
import { isRiseNotification, stillUpId } from './rise-ids';
import { readSettings } from './settings';

// Fajr Rise (SPEC 5.10): the settings, what happened to each morning, and the bridge to the
// native alarm (modules/fajr-rise). The plan itself comes from packages/core `planRise`; it is
// rebuilt with the reminders, so the alarm always follows the real Fajr. Plan: docs/PHASE-7B.md.

/** An alarm as the native module sees it: times in epoch milliseconds. */
export interface RingingAlarm {
  id: string;
  morning: string;
  at: number;
  backup: number;
  sunrise: number;
}

/** Android shows a notification (title, body, channel, link); iOS an AlarmKit alert (stop, open). */
interface NativeConfig {
  sound: RiseSettings['sound'];
  title: string;
  body: string;
  channel: string;
  link: string;
  stop: string;
  open: string;
  tint: string;
}

/** iOS only: whether AlarmKit may ring ("unsupported" before iOS 26). */
export type AlarmAuthorization = 'authorized' | 'denied' | 'notDetermined' | 'unsupported';

interface FajrRiseNative {
  addListener(event: 'onRing', listener: (alarm: RingingAlarm) => void): { remove(): void };
  schedule(alarms: RingingAlarm[], config: NativeConfig): Promise<void>;
  ringing(): RingingAlarm | null;
  finish(morning: string | null, unlock: boolean): Promise<void>;
  duck(ducked: boolean): void;
  /** The ring screen is up (Android folds the heads-up away). */
  shown(): void;
  /** Android: one trial ring in a few seconds, outside the plan. */
  ringSoon?(seconds: number): Promise<void>;
  permissions(): { exact: boolean; fullScreen: boolean; alarms?: AlarmAuthorization };
  /** iOS: asks for AlarmKit. */
  requestAlarms?(): Promise<AlarmAuthorization>;
  openExactSettings(): Promise<void>;
  openFullScreenSettings(): Promise<void>;
}

export const riseNative =
  Platform.OS === 'web' ? null : requireOptionalNativeModule<FajrRiseNative>('FajrRise');

/** The trial ring from setup belongs to no morning. */
export const TRY_MORNING = 'try';
export const STILL_UP_CATEGORY = 'still-up';
export const STILL_UP_ACTION = 'up';
const STILL_UP_CHANNEL = 'still-up-1';

const inRange = (value: unknown, { min, max }: { min: number; max: number }, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;

function oneOf<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

/** Settings as stored, each field checked on its own so one bad value never loses the rest. */
export function parseRise(raw: unknown): RiseSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const anchor = oneOf(r.anchor, riseAnchors, defaultRise.anchor);
  const minutes =
    anchor === 'before-sunrise'
      ? inRange(r.minutes, RISE_RANGES.beforeSunrise, 30)
      : inRange(r.minutes, RISE_RANGES.beforeFajr, defaultRise.minutes);
  const weekdays = Array.isArray(r.weekdays)
    ? [...new Set(r.weekdays.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))]
    : defaultRise.weekdays;
  return {
    enabled: r.enabled === true,
    anchor,
    minutes,
    weekdays,
    sound: oneOf(r.sound, ['alarm', 'soft'] as const, defaultRise.sound),
    challenge: oneOf(r.challenge, riseChallenges, defaultRise.challenge),
    steps: inRange(r.steps, RISE_RANGES.steps, defaultRise.steps),
    squats: inRange(r.squats, RISE_RANGES.squats, defaultRise.squats),
    mind: oneOf(r.mind, ['sums', 'stars'] as const, defaultRise.mind),
    level: r.level === 1 || r.level === 3 ? r.level : defaultRise.level,
    spotCode: typeof r.spotCode === 'string' && r.spotCode.trim() ? r.spotCode : null,
    stillUp: r.stillUp !== false,
    snooze: r.snooze === true,
  };
}

export const riseSettings = mmkvValue('rise', parseRise);

export function updateRise(change: (current: RiseSettings) => RiseSettings) {
  riseSettings.write(change(riseSettings.read()));
}

/** What happened to recent mornings, stored with their dates as ISO strings. */
interface StoredMorning {
  kind: MorningState['kind'];
  at?: string;
  /** "Still up?" was already asked this morning. */
  asked?: boolean;
  /** The one snooze was already used. */
  snoozed?: boolean;
}

function parseMornings(raw: unknown): Record<string, StoredMorning> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, StoredMorning> = {};
  for (const [morning, value] of Object.entries(raw as Record<string, StoredMorning>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(morning) || !value) continue;
    if (value.kind === 'done' || (value.kind === 'restart' && typeof value.at === 'string')) {
      out[morning] = value;
    }
  }
  return out;
}

const mornings = mmkvValue('rise-mornings', parseMornings);

function setMorning(morning: string, value: StoredMorning) {
  if (morning === TRY_MORNING) return;
  // Only the last few mornings matter.
  const kept = Object.entries(mornings.read())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);
  mornings.write({ ...Object.fromEntries(kept), [morning]: value });
}

export function morningOf(morning: string): StoredMorning | undefined {
  return mornings.read()[morning];
}

function morningStates(): Map<string, MorningState> {
  const states = new Map<string, MorningState>();
  for (const [morning, value] of Object.entries(mornings.read())) {
    states.set(
      morning,
      value.kind === 'done' ? { kind: 'done' } : { kind: 'restart', at: new Date(value.at!) },
    );
  }
  return states;
}

/** The plan for the coming week, or null without a place. */
function plan(now: Date): PlannedRise[] | null {
  const settings = readSettings();
  const place = placeOf(settings);
  if (!place || !settings.onboarded) return null;
  const today = civilDate(now, place.timeZone);
  // Yesterday too: a morning that rings past midnight in another zone keeps its backups.
  const days = Array.from({ length: RISE_DAYS + 1 }, (_, i) =>
    prayerTimes(place, addDays(today, i - 1), prayerSettings(settings)),
  );
  return planRise({ now, days, settings: riseSettings.read(), mornings: morningStates() });
}

/** The next time it rings (a restarted morning included), for setup and Today. */
export function nextAlarm(now = new Date()): PlannedRise | null {
  return plan(now)?.find((a) => a.backup === 0) ?? null;
}

/** Hands the native alarm the whole plan (and a trial ring, on iOS). Safe to call often. */
export async function rescheduleRise(now = new Date(), trial: PlannedRise | null = null) {
  if (!riseNative) return;
  const t = translator();
  const settings = riseSettings.read();
  const alarms = [...(plan(now) ?? []), ...(trial ? [trial] : [])];
  await riseNative.schedule(
    alarms.map((a) => ({
      id: a.id,
      morning: a.morning,
      at: a.at.getTime(),
      backup: a.backup,
      sunrise: a.sunrise.getTime(),
    })),
    {
      sound: settings.sound,
      title: t('rise.ring.notificationTitle'),
      body: t('rise.ring.notificationBody'),
      channel: t('rise.ring.channel'),
      link: Linking.createURL('rise'),
      stop: t('rise.ring.alarmStop'),
      open: t('rise.ring.alarmOpen'),
      tint: colors.dark.lantern,
    },
  );
}

/** Rings once in `seconds`, to check the phone lets it through: setup's test. */
export async function testRise(seconds: number) {
  if (riseNative?.ringSoon) return riseNative.ringSoon(seconds);
  const at = new Date(Date.now() + seconds * 1000);
  await rescheduleRise(new Date(), {
    id: `${TRY_MORNING}-0`,
    morning: TRY_MORNING,
    at,
    backup: 0,
    sunrise: new Date(at.getTime() + 3_600_000),
  });
}

async function ensureStillUp() {
  const t = translator();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(STILL_UP_CHANNEL, {
      name: t('rise.stillUp.title'),
      importance: AndroidImportance.HIGH,
    });
  }
  await Notifications.setNotificationCategoryAsync(STILL_UP_CATEGORY, [
    {
      identifier: STILL_UP_ACTION,
      buttonTitle: t('rise.stillUp.action'),
      options: { opensAppToForeground: true },
    },
  ]);
}

/** Whether this alarm's morning can still be snoozed. */
export function canSnooze(alarm: RingingAlarm): boolean {
  return (
    riseSettings.read().snooze &&
    alarm.morning !== TRY_MORNING &&
    !morningOf(alarm.morning)?.snoozed
  );
}

/**
 * The challenge is done. With "Still up?" on (once a morning), the morning restarts a few minutes
 * later unless the person answers; otherwise it is over.
 */
export async function riseDone(
  alarm: RingingAlarm,
  now = new Date(),
): Promise<{ stillUp: boolean }> {
  const settings = riseSettings.read();
  const before = morningOf(alarm.morning);
  const ask = settings.stillUp && alarm.morning !== TRY_MORNING && !before?.asked;
  if (ask) {
    const askAt = new Date(now.getTime() + STILL_UP_AFTER_MINUTES * 60_000);
    const again = new Date(askAt.getTime() + STILL_UP_ANSWER_MINUTES * 60_000);
    setMorning(alarm.morning, { ...before, kind: 'restart', at: again.toISOString(), asked: true });
    const t = translator();
    await ensureStillUp();
    await Notifications.scheduleNotificationAsync({
      identifier: stillUpId(alarm.morning),
      content: {
        title: t('rise.stillUp.title'),
        body: t('rise.stillUp.body'),
        categoryIdentifier: STILL_UP_CATEGORY,
        data: { kind: 'still-up', morning: alarm.morning },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: askAt,
        channelId: STILL_UP_CHANNEL,
      },
    });
  } else {
    setMorning(alarm.morning, { ...before, kind: 'done' });
  }
  await riseNative?.finish(alarm.morning, true);
  await rescheduleRise(now);
  return { stillUp: ask };
}

/** "Turn off", held for 10 seconds: the morning is over, with nothing recorded about it. */
export async function riseOff(alarm: RingingAlarm, now = new Date()) {
  setMorning(alarm.morning, { ...morningOf(alarm.morning), kind: 'done' });
  await Notifications.cancelScheduledNotificationAsync(stillUpId(alarm.morning));
  await riseNative?.finish(alarm.morning, true);
  await rescheduleRise(now);
}

/** The one snooze: silence now, the whole chain again in five minutes. */
export async function riseSnooze(alarm: RingingAlarm, now = new Date()) {
  const at = new Date(now.getTime() + SNOOZE_MINUTES * 60_000);
  setMorning(alarm.morning, {
    ...morningOf(alarm.morning),
    kind: 'restart',
    at: at.toISOString(),
    snoozed: true,
  });
  await riseNative?.finish(alarm.morning, false);
  await rescheduleRise(now);
}

/** "Still up?" was answered (its action, or a tap on it): the morning is over. */
export async function answerStillUp(morning: string) {
  setMorning(morning, { ...morningOf(morning), kind: 'done' });
  await Notifications.cancelScheduledNotificationAsync(stillUpId(morning));
  await Notifications.dismissNotificationAsync(stillUpId(morning));
  await rescheduleRise();
}

/** A tap on "Still up?" or its action. Returns whether it was one. */
export function handleRiseResponse(response: Notifications.NotificationResponse): boolean {
  const data = (response.notification.request.content.data ?? {}) as {
    kind?: string;
    morning?: string;
  };
  if (data.kind !== 'still-up' || !data.morning) return false;
  void answerStillUp(data.morning);
  return true;
}

/** The alarm ringing now (Android), kept current while the screen is open. */
export function useRinging(): RingingAlarm | null {
  const [alarm, setAlarm] = useState<RingingAlarm | null>(() => riseNative?.ringing() ?? null);
  useEffect(() => {
    if (!riseNative) return;
    const sub = riseNative.addListener('onRing', setAlarm);
    return () => sub.remove();
  }, []);
  return alarm;
}

/** After "Delete everything": no alarm and no "Still up?" are left. */
export async function clearRise() {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((n) => isRiseNotification(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  await rescheduleRise();
}

/** Today offers Fajr Rise in the evenings of its first week, until it is set aside or turned on. */
interface RiseOffer {
  /** The first evening it was shown, ISO. */
  since?: string;
  dismissed?: boolean;
}

const OFFER_DAYS = 7;

const riseOffer = mmkvValue('rise-offer', (raw): RiseOffer => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    since: typeof r.since === 'string' ? r.since : undefined,
    dismissed: r.dismissed === true,
  };
});

export function useRiseOffer(now: Date): boolean {
  const offer = riseOffer.useValue();
  const settings = riseSettings.useValue();
  if (!riseNative || settings.enabled || offer.dismissed) return false;
  if (!offer.since) return true;
  return now.getTime() - new Date(offer.since).getTime() < OFFER_DAYS * 86_400_000;
}

/** The offer is on screen: its week starts the first time. */
export function markRiseOfferShown(now = new Date()) {
  const offer = riseOffer.read();
  if (!offer.since) riseOffer.write({ ...offer, since: now.toISOString() });
}

export function dismissRiseOffer() {
  riseOffer.write({ ...riseOffer.read(), dismissed: true });
}
