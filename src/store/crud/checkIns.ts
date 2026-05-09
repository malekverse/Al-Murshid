import { getDb } from '../db';

export const saveCheckIn = async (date: string, location: string, prayerName: string, timestamp: number) => {
  const db = getDb();
  const existing = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM check_ins WHERE date = ? AND prayerName = ?', date, prayerName
  );
  if (existing.length > 0) {
    await db.runAsync(
      'UPDATE check_ins SET location = ?, timestamp = ?, synced = 0 WHERE date = ? AND prayerName = ?',
      location, timestamp, date, prayerName
    );
    return;
  }
  await db.runAsync(
    'INSERT INTO check_ins (date, location, prayerName, timestamp) VALUES (?, ?, ?, ?)',
    date, location, prayerName, timestamp
  );
};

export const getCheckIns = async () => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM check_ins ORDER BY timestamp DESC');
};

export const getUnsyncedCheckIns = async () => {
  const db = getDb();
  return await db.getAllAsync("SELECT * FROM check_ins WHERE synced = 0 OR synced IS NULL");
};
