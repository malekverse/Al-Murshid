import { getDb } from '../db';

export const savePrayerLog = async (prayerName: string, date: string, timestamp: number) => {
  const db = getDb();
  const existing = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM prayer_logs WHERE prayerName = ? AND date = ?',
    prayerName, date
  );
  if (existing.length > 0) return;
  await db.runAsync(
    'INSERT INTO prayer_logs (prayerName, date, timestamp) VALUES (?, ?, ?)',
    prayerName, date, timestamp
  );
};

export const getPrayerLogs = async () => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM prayer_logs ORDER BY timestamp DESC');
};

export const getUnsyncedPrayerLogs = async () => {
  const db = getDb();
  return await db.getAllAsync("SELECT * FROM prayer_logs WHERE synced = 0 OR synced IS NULL");
};
