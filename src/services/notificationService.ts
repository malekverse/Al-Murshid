import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let scheduled = false;

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayer-times', {
      name: 'Prayer Times',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  return true;
}

interface PrayerTimeMap {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export async function schedulePrayerNotifications(prayerTimes: PrayerTimeMap) {
  if (scheduled) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

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
  scheduled = true;
}
