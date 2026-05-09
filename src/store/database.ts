import { getDb } from './db';

export const initDatabase = async () => {
  const db = getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS reflections (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      encryptedPayload TEXT NOT NULL,
      aiGuidance TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS prayer_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prayerName TEXT NOT NULL,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY,
      email TEXT,
      display_name TEXT,
      photo_url TEXT,
      auth_provider TEXT DEFAULT 'email',
      is_local INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL UNIQUE,
      last_sync_at TEXT,
      last_checksum TEXT
    );

    CREATE TABLE IF NOT EXISTS sleep_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      hoursSlept REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS conversation_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS khatmah_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      pagesRead INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS alarm_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      alarmType TEXT NOT NULL,
      dismissed INTEGER DEFAULT 0,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      prayerName TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS duel_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      score INTEGER NOT NULL,
      totalQuestions INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ramadan_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      fasting INTEGER DEFAULT 0,
      suhoor_time TEXT,
      iftar_time TEXT,
      pages_read INTEGER DEFAULT 0,
      qiyam INTEGER DEFAULT 0,
      sadaqah REAL DEFAULT 0,
      dua_notes TEXT,
      notes TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ramadan_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL UNIQUE,
      quran_goal_pages INTEGER DEFAULT 604,
      sadaqah_goal REAL DEFAULT 0,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sadaqah_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      category TEXT DEFAULT 'general',
      notes TEXT,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quran_bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      surah_number INTEGER NOT NULL,
      ayah_number INTEGER NOT NULL,
      surah_name TEXT NOT NULL,
      notes TEXT,
      date TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_prayer_logs_unique ON prayer_logs(prayerName, date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sleep_logs_unique ON sleep_logs(date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_check_ins_unique ON check_ins(date, prayerName);
  `);
};

export const clearAllData = async () => {
  const db = getDb();
  await db.execAsync(`
    DELETE FROM reflections;
    DELETE FROM prayer_logs;
    DELETE FROM sleep_logs;
    DELETE FROM conversation_messages;
    DELETE FROM khatmah_progress;
    DELETE FROM alarm_logs;
    DELETE FROM check_ins;
    DELETE FROM user_settings;
    DELETE FROM user_profile;
    DELETE FROM sync_metadata;
    DELETE FROM duel_results;
    DELETE FROM ramadan_logs;
    DELETE FROM ramadan_goals;
    DELETE FROM sadaqah_logs;
    DELETE FROM quran_bookmarks;
  `);
};

export { saveReflection, getReflections, saveUserProfile, getUserProfile, updateSyncMetadata, getSyncMetadata } from './crud/reflections';
export { savePrayerLog, getPrayerLogs, getUnsyncedPrayerLogs } from './crud/prayerLogs';
export { saveSleepLog, getSleepLogs, getUnsyncedSleepLogs } from './crud/sleepLogs';
export { saveConversationMessage, getRecentConversationMessages, getUnsyncedConversationMessages, deleteOldConversationMessages } from './crud/conversationMessages';
export { saveKhatmahProgress, getKhatmahProgress, getUnsyncedKhatmahProgress } from './crud/khatmahProgress';
export { saveAlarmLog, getAlarmLogs, getUnsyncedAlarmLogs } from './crud/alarmLogs';
export { saveCheckIn, getCheckIns, getUnsyncedCheckIns } from './crud/checkIns';
export { getUserSetting, setUserSetting, getAllUserSettings } from './crud/userSettings';
export { saveDuelResult, getBestDuelResult, getRecentDuelResults, getUnsyncedDuelResults } from './crud/duelResults';
