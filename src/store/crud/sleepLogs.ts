import { getDb } from '../db';

export const saveSleepLog = async (date: string, hoursSlept: number, timestamp: number) => {
  const db = getDb();
  const existing = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM sleep_logs WHERE date = ?', date
  );
  if (existing.length > 0) {
    await db.runAsync(
      'UPDATE sleep_logs SET hoursSlept = ?, timestamp = ?, synced = 0 WHERE date = ?',
      hoursSlept, timestamp, date
    );
    return;
  }
  await db.runAsync(
    'INSERT INTO sleep_logs (date, hoursSlept, timestamp) VALUES (?, ?, ?)',
    date, hoursSlept, timestamp
  );
};

export const getSleepLogs = async () => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM sleep_logs ORDER BY timestamp DESC');
};

export const getUnsyncedSleepLogs = async () => {
  const db = getDb();
  return await db.getAllAsync("SELECT * FROM sleep_logs WHERE synced = 0 OR synced IS NULL");
};
