export interface PrayerLog {
  id?: number;
  prayerName: string;
  date: string;
  timestamp: number;
  synced?: number;
}

export interface Reflection {
  id: string;
  date: string;
  encryptedPayload: string;
  aiGuidance?: string;
  synced?: number;
}

export interface SleepLog {
  id?: number;
  date: string;
  hoursSlept: number;
  timestamp: number;
  synced?: number;
}

export interface ConversationMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  synced?: number;
}

export interface KhatmahProgress {
  id?: number;
  date: string;
  pagesRead: number;
  timestamp: number;
  synced?: number;
}

export interface AlarmLog {
  id?: number;
  date: string;
  alarmType: string;
  dismissed: number;
  timestamp: number;
  synced?: number;
}

export interface CheckIn {
  id?: number;
  date: string;
  location: string;
  prayerName: string;
  timestamp: number;
  synced?: number;
}

export interface UserSetting {
  key: string;
  value: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  photo_url?: string;
  auth_provider?: string;
  is_local?: number;
  created_at?: string;
  updated_at?: string;
}

export const LEVEL_MILESTONES = [0, 50, 150, 500, 1000];
export const LEVEL_TITLES = [
  { en: 'Al-Mubtadi — The Beginner', ar: 'المبتدئ' },
  { en: 'Al-Talib — The Seeker', ar: 'الطالب' },
  { en: 'Al-Mujtahid — The Striver', ar: 'المجتهد' },
  { en: 'Al-Muqarab — The Near One', ar: 'المقرب' },
  { en: 'Al-Sabiq — The Foremost', ar: 'السابق' },
];

export function getLevel(noorPoints: number): number {
  let level = 1;
  for (let i = LEVEL_MILESTONES.length - 1; i >= 0; i--) {
    if (noorPoints >= LEVEL_MILESTONES[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
}

export function getLevelTitle(level: number, lang: 'en' | 'ar'): string {
  const idx = Math.min(level - 1, LEVEL_TITLES.length - 1);
  return LEVEL_TITLES[idx][lang];
}
