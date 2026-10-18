import {
  addDays,
  BEFORE_RANGE,
  civilDate,
  ignoredInARow,
  parseIsoDate,
  PLAN_DAYS,
  planReminders,
  prayers,
  prayerTimes,
  shouldReduceReminders,
  type PlannedNotification,
  type Prayer,
} from '@murshid/core';
import { liveLogs, placeOf, prayerSettings } from '@murshid/data';
import { getMessages, intlLocale, isLocale, matchLocale, type Locale } from '@murshid/i18n';
import { getLocales } from 'expo-localization';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility } from 'expo-notifications';
import { Platform } from 'react-native';
import { createTranslator } from 'use-intl';
import { recentLogs, setPrayerLogged } from './prayer-logs';
import { readSettings, updateSettings } from './settings';
import { keys, storage } from './storage';

// Prayer reminders (SPEC 5.2): local notifications for a rolling window of about six days,
// rebuilt on every open and by a background task. Each carries "I prayed", which logs without
// opening the app.

export const PRAYER_CATEGORY = 'prayer';
export const PRAYED_ACTION = 'prayed';
const SOFT_SOUND = 'soft_tone.wav';
/** Android fixes a channel's sound once created, so a changed sound gets a new channel id. */
const channels = { adhan: 'adhan-2', soft: 'soft-1', silent: 'silent-1' } as const;
const HISTORY_DAYS = 8;

type Stored = Pick<PlannedNotification, 'id' | 'prayer' | 'kind'> & { at: string };

function locale(): Locale {
  const stored = storage.getString(keys.locale);
  return isLocale(stored) ? stored : matchLocale(getLocales().map((l) => l.languageTag));
}

function translator() {
  const l = locale();
  return createTranslator({
    locale: intlLocale(l, getLocales()[0]?.regionCode),
    messages: getMessages(l),
  });
}

async function ensureChannels(t: ReturnType<typeof translator>) {
  if (Platform.OS !== 'android') return;
  const common = {
    importance: AndroidImportance.HIGH,
    lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
  };
  await Notifications.setNotificationChannelAsync(channels.adhan, {
    ...common,
    name: t('notifications.channels.adhan'),
    // No custom sound: the phone's default until the adhan recordings arrive (docs/DECISIONS.md).
  });
  await Notifications.setNotificationChannelAsync(channels.soft, {
    ...common,
    name: t('notifications.channels.soft'),
    sound: SOFT_SOUND,
  });
  await Notifications.setNotificationChannelAsync(channels.silent, {
    ...common,
    name: t('notifications.channels.silent'),
    sound: null,
    enableVibrate: false,
  });
}

async function ensureCategory(t: ReturnType<typeof translator>) {
  await Notifications.setNotificationCategoryAsync(PRAYER_CATEGORY, [
    {
      identifier: PRAYED_ACTION,
      buttonTitle: t('components.prayer.iPrayed'),
      options: { opensAppToForeground: false },
    },
  ]);
}

function readHistory(): (Stored & { atDate: Date })[] {
  try {
    const stored = JSON.parse(storage.getString(keys.reminderPlan) ?? '[]') as Stored[];
    return stored.map((n) => ({ ...n, atDate: new Date(n.at) }));
  } catch {
    return [];
  }
}

/** Rebuilds the pending reminders from today's settings. Safe to call often. */
export async function rescheduleReminders(now = new Date()) {
  const settings = readSettings();
  const place = placeOf(settings);
  const permission = await Notifications.getPermissionsAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!place || !settings.onboarded || !permission.granted) return;

  const t = translator();
  await ensureChannels(t);
  await ensureCategory(t);

  const today = civilDate(now, place.timeZone);
  const days = Array.from({ length: PLAN_DAYS }, (_, i) =>
    prayerTimes(place, addDays(today, i), prayerSettings(settings)),
  );
  const plan = planReminders({
    now,
    days,
    settings: settings.reminders,
    reducedTo: settings.remindersReduced ? settings.journey.prayer.focusPrayer : null,
  });

  for (const n of plan) {
    const name = t(`glossary.prayer.${n.jumuah ? 'jumuah' : n.prayer}`);
    const before = Math.min(
      BEFORE_RANGE.max,
      Math.max(BEFORE_RANGE.min, settings.reminders[n.prayer].before ?? BEFORE_RANGE.min),
    );
    await Notifications.scheduleNotificationAsync({
      identifier: n.id,
      content: {
        title:
          n.kind === 'time'
            ? name
            : t('notifications.before.title', {
                name,
                duration: t('common.time.minutes', { count: before }),
              }),
        body:
          n.kind === 'time'
            ? t(`notifications.body.${n.jumuah ? 'jumuah' : n.prayer}`)
            : t('notifications.before.body'),
        categoryIdentifier: n.canLog ? PRAYER_CATEGORY : undefined,
        sound: n.style === 'silent' ? false : n.style === 'soft' ? SOFT_SOUND : true,
        data: { date: n.id.slice(0, 10), prayer: n.prayer, kind: n.kind, openInDark: n.openInDark },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: n.at,
        channelId: channels[n.style],
      },
    });
  }

  // Keep the ones already delivered, for counting ignored reminders (SPEC 3).
  const since = now.getTime() - HISTORY_DAYS * 86_400_000;
  const past = readHistory()
    .filter((n) => n.atDate.getTime() < now.getTime() && n.atDate.getTime() > since)
    .map(({ atDate: _, ...n }) => n);
  const next = plan.map(({ id, at, prayer, kind }) => ({ id, at: at.toISOString(), prayer, kind }));
  storage.set(keys.reminderPlan, JSON.stringify([...past, ...next]));
}

function openedList(): string[] {
  try {
    return JSON.parse(storage.getString(keys.openedReminders) ?? '[]') as string[];
  } catch {
    return [];
  }
}

/** Whether this reminder was already opened or answered (so a launch never logs twice). */
export function wasOpened(id: string): boolean {
  return openedList().includes(id);
}

function recordOpened(id: string) {
  storage.set(keys.openedReminders, JSON.stringify([...openedList().slice(-99), id]));
}

/**
 * A reminder was opened or its "I prayed" was tapped, in the app or in the background. Returns
 * what was logged, if anything.
 */
export function handleReminderResponse(
  response: Notifications.NotificationResponse,
): { prayer: Prayer; openInDark: boolean } | null {
  const id = response.notification.request.identifier;
  const data = (response.notification.request.content.data ?? {}) as {
    date?: string;
    prayer?: string;
    openInDark?: boolean;
  };
  recordOpened(id);
  const prayer = prayers.find((p) => p === data.prayer);
  if (!prayer || !data.date) return null;
  if (response.actionIdentifier === PRAYED_ACTION) {
    setPrayerLogged(parseIsoDate(data.date), prayer, true, 'notification');
    void Notifications.dismissNotificationAsync(id);
  }
  return { prayer, openInDark: Boolean(data.openInDark) };
}

/** On each open: count reminders that went by unanswered; after five, reduce quietly (SPEC 3). */
export function checkIgnoredReminders(now = new Date()) {
  const settings = readSettings();
  const place = placeOf(settings);
  if (!place) return;
  const logs = recentLogs(civilDate(now, place.timeZone));
  const logged = new Set(liveLogs(logs).map((l) => `${l.date}:${l.prayer}`));
  const delivered = readHistory().map((n) => ({ ...n, at: n.atDate }));
  const count = ignoredInARow(delivered, logged, new Set(openedList()), now);
  const reduce = shouldReduceReminders(count) && !settings.remindersReduced;
  if (count !== settings.ignoredReminders || reduce) {
    updateSettings((s) => ({
      ...s,
      ignoredReminders: count,
      remindersReduced: s.remindersReduced || reduce,
    }));
  }
}

/** "Bring all reminders back": a fresh start, with no memory of the quiet days. */
export async function restoreReminders() {
  storage.remove(keys.reminderPlan);
  updateSettings((s) => ({ ...s, remindersReduced: false, ignoredReminders: 0 }));
  await rescheduleReminders();
}
