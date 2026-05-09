import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDb } from '../store/db';

export async function scheduleAllReminders(prefs: {
  prayerAlerts: boolean;
  smartReminders: boolean;
  muhasabahReminder: boolean;
  quranReminder: boolean;
}, prayerTimes?: Record<string, Date>) {
  const granted = await requestPermission();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (prefs.prayerAlerts && prayerTimes) {
    await schedulePrayerNotifications(prayerTimes);
  }

  if (prefs.muhasabahReminder) {
    await scheduleMuhasabahReminder();
  }

  if (prefs.quranReminder) {
    await scheduleQuranReminder();
  }
}

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

async function schedulePrayerNotifications(prayerTimes: Record<string, Date>) {
  for (const [key, time] of Object.entries(prayerTimes)) {
    if (key === 'sunrise' || !time) continue;
    const label = PRAYER_LABELS[key] || key;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${label} Prayer`,
        body: `It's time for ${label} prayer. Allahu Akbar!`,
        sound: 'default',
      },
      trigger: {
        type: 'daily',
        hour: time.getHours(),
        minute: time.getMinutes(),
      } as any,
    });
  }
}

async function scheduleMuhasabahReminder() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Evening Muhasabah',
      body: 'Take a moment to reflect on your day. What did you do for Allah today?',
      sound: 'default',
    },
    trigger: {
      type: 'daily',
      hour: 20,
      minute: 0,
    } as any,
  });
}

async function scheduleQuranReminder() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Quran Reading',
      body: 'Don\'t forget your daily Quran portion. Even one ayah brings barakah!',
      sound: 'default',
    },
    trigger: {
      type: 'daily',
      hour: 9,
      minute: 0,
    } as any,
  });
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
