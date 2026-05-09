import { getDb } from '../db';

export const saveKhatmahProgress = async (date: string, pagesRead: number, timestamp: number) => {
  const db = getDb();
  await db.runAsync(
    'INSERT INTO khatmah_progress (date, pagesRead, timestamp) VALUES (?, ?, ?)',
    date, pagesRead, timestamp
  );
};

export const getKhatmahProgress = async () => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM khatmah_progress ORDER BY timestamp DESC');
};

export const getUnsyncedKhatmahProgress = async () => {
  const db = getDb();
  return await db.getAllAsync("SELECT * FROM khatmah_progress WHERE synced = 0 OR synced IS NULL");
};
