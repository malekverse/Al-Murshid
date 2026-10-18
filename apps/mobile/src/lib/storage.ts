import { createMMKV } from 'react-native-mmkv';

/** Small key-value settings (SPEC 8.3). Personal data lives in SQLite, not here. */
export const storage = createMMKV({ id: 'murshid.settings' });

export const keys = {
  locale: 'locale',
  theme: 'theme',
  settings: 'settings',
  /** The reminder plan last scheduled, and reminders the person opened (for SPEC 3's quiet reduce). */
  reminderPlan: 'reminder-plan',
  openedReminders: 'opened-reminders',
} as const;
