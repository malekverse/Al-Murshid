// The reminder scheduling plan (SPEC 5.2): which local notifications to have pending, as plain
// data. The mobile app hands it to expo-notifications; this module never touches the platform.
// iOS keeps at most 64 pending local notifications, so the plan covers a rolling window
// (about 6 days) and is rebuilt on app open and background refresh.

import type { DayTimes, Prayer } from './prayer-times';
import { prayers } from './prayer-times';
import { isoDate } from './time';

export type ReminderStyle = 'adhan' | 'soft' | 'silent' | 'off';

export interface PrayerReminder {
  style: ReminderStyle;
  /** Minutes before the prayer for a gentle heads-up, 5 to 30, or null for none. */
  before: number | null;
}

export type ReminderSettings = Record<Prayer, PrayerReminder>;

export const defaultReminders: ReminderSettings = {
  fajr: { style: 'adhan', before: null },
  dhuhr: { style: 'adhan', before: null },
  asr: { style: 'adhan', before: null },
  maghrib: { style: 'adhan', before: null },
  isha: { style: 'adhan', before: null },
};

export interface PlannedNotification {
  /** Stable across rebuilds, so rescheduling is idempotent: "2026-10-18-asr-time". */
  id: string;
  at: Date;
  prayer: Prayer;
  kind: 'time' | 'before';
  style: Exclude<ReminderStyle, 'off'>;
  /** Friday's Dhuhr reads "Jumu'ah". */
  jumuah: boolean;
  /** Fajr and Isha always open into the dark theme (SPEC 6.1). */
  openInDark: boolean;
  /** Carries the "I prayed" action (SPEC 5.2). */
  canLog: boolean;
}

export const IOS_PENDING_LIMIT = 64;
export const PLAN_DAYS = 6;
export const BEFORE_RANGE = { min: 5, max: 30 } as const;

export interface PlanInput {
  now: Date;
  /** Prayer times for consecutive days starting today (PLAN_DAYS of them). */
  days: readonly DayTimes[];
  settings: ReminderSettings;
  /**
   * After reminders are ignored 5 times in a row they quietly reduce to the focus prayer
   * (SPEC 3). The person can restore them with one toggle.
   */
  reducedTo?: Prayer | null;
  limit?: number;
}

export function planReminders({
  now,
  days,
  settings,
  reducedTo = null,
  limit = IOS_PENDING_LIMIT,
}: PlanInput): PlannedNotification[] {
  const plan: PlannedNotification[] = [];
  for (const day of days) {
    const date = isoDate(day.date);
    for (const prayer of prayers) {
      if (reducedTo && prayer !== reducedTo) continue;
      const { style, before } = settings[prayer];
      if (style === 'off') continue;
      const at = day[prayer];
      if (Number.isNaN(at.getTime())) continue;
      const common = {
        prayer,
        style,
        jumuah: day.jumuah && prayer === 'dhuhr',
        openInDark: prayer === 'fajr' || prayer === 'isha',
      };
      plan.push({ id: `${date}-${prayer}-time`, at, kind: 'time', canLog: true, ...common });
      if (before !== null) {
        const minutes = Math.min(BEFORE_RANGE.max, Math.max(BEFORE_RANGE.min, before));
        // The heads-up is always quiet: the adhan belongs to the prayer time itself.
        plan.push({
          id: `${date}-${prayer}-before`,
          at: new Date(at.getTime() - minutes * 60_000),
          kind: 'before',
          canLog: false,
          ...common,
          style: style === 'adhan' ? 'soft' : style,
        });
      }
    }
  }
  return plan
    .filter((n) => n.at.getTime() > now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, limit);
}
