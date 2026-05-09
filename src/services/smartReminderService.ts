import { getDb } from '../store/db';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PRAYER_LABELS: Record<string, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

export interface MissedPrayerPattern {
  prayerName: string;
  missedDays: number;
  totalDays: number;
  ratio: number;
  habitScore: number;
}

export interface BehavioralInsight {
  mostMissedPrayer: string;
  overallConsistency: number;
  fajrDismissalRate: number;
  needsWakeUpNudge: boolean;
}

export async function analyzePrayerPatterns(days = 7): Promise<MissedPrayerPattern[]> {
  const db = getDb();
  const cutoff = Date.now() - days * 86400000;

  const rows = await db.getAllAsync<{ prayerName: string; date: string }>(
    'SELECT DISTINCT prayerName, date FROM prayer_logs WHERE timestamp >= ?',
    cutoff
  );

  const loggedSet = new Set<string>();
  for (const r of rows) {
    loggedSet.add(`${r.prayerName}|${r.date}`);
  }

  const result: MissedPrayerPattern[] = [];
  for (const name of PRAYER_NAMES) {
    let loggedCount = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      if (loggedSet.has(`${name}|${dateStr}`)) {
        loggedCount++;
      }
    }
    const ratio = loggedCount / days;
    result.push({
      prayerName: name,
      missedDays: days - loggedCount,
      totalDays: days,
      ratio,
      habitScore: Math.round(ratio * 100),
    });
  }

  return result;
}

export async function getAlarmDismissalRate(): Promise<number> {
  const db = getDb();
  const cutoff = Date.now() - 7 * 86400000;
  const rows = await db.getAllAsync<{ dismissed: number }>(
    'SELECT dismissed FROM alarm_logs WHERE timestamp >= ? AND alarmType = ?',
    cutoff,
    'fajr'
  );
  if (rows.length === 0) return 0;
  const dismissedCount = rows.filter(r => r.dismissed === 1).length;
  return Math.round((dismissedCount / rows.length) * 100);
}

export async function getBehavioralInsights(): Promise<BehavioralInsight> {
  const patterns = await analyzePrayerPatterns(7);
  const fajrDismissalRate = await getAlarmDismissalRate();

  let worst: MissedPrayerPattern | null = null;
  let totalScore = 0;
  for (const p of patterns) {
    totalScore += p.habitScore;
    if (!worst || p.habitScore < worst.habitScore) {
      worst = p;
    }
  }

  return {
    mostMissedPrayer: worst?.prayerName ?? 'fajr',
    overallConsistency: Math.round(totalScore / PRAYER_NAMES.length),
    fajrDismissalRate,
    needsWakeUpNudge: worst?.prayerName === 'fajr' && worst.habitScore < 50,
  };
}

export async function scheduleSmartReminders(
  prayerTimes: Record<string, Date>,
): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  if (lastScheduledDate === today) return 0;
  lastScheduledDate = today;

  const granted = await requestPermission();
  if (!granted) return 0;

  const patterns = await analyzePrayerPatterns(7);
  const dismissalRate = await getAlarmDismissalRate();

  let count = 0;

  for (const p of patterns) {
    const time = prayerTimes[p.prayerName];
    if (!time) continue;

    if (p.habitScore >= 70) continue;

    const isFajr = p.prayerName === 'fajr';
    const needsExtraNudge = isFajr && dismissalRate > 50;

    const reminderTime = new Date(time.getTime() - 15 * 60000);
    if (reminderTime <= new Date()) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${PRAYER_LABELS[p.prayerName]} Reminder`,
        body: needsExtraNudge
          ? `You've missed ${PRAYER_LABELS[p.prayerName]} ${p.missedDays} times this week. Don't let shaytan win!`
          : `${PRAYER_LABELS[p.prayerName]} is in 15 minutes. Prepare yourself.`,
        sound: 'default',
      },
      trigger: {
        type: 'daily',
        hour: reminderTime.getHours(),
        minute: reminderTime.getMinutes(),
      } as any,
    });
    count++;
  }

  return count;
}

let lastScheduledDate = '';

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

export function resetSmartRemindersGuard(): void {
  lastScheduledDate = '';
}

