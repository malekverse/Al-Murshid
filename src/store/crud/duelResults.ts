import { getDb } from '../db';

export const saveDuelResult = async (date: string, score: number, totalQuestions: number, timestamp: number) => {
  const db = getDb();
  await db.runAsync(
    'INSERT INTO duel_results (date, score, totalQuestions, timestamp) VALUES (?, ?, ?, ?)',
    date, score, totalQuestions, timestamp
  );
};

export const getBestDuelResult = async () => {
  const db = getDb();
  const rows = await db.getAllAsync('SELECT * FROM duel_results ORDER BY score DESC LIMIT 1');
  return rows.length > 0 ? rows[0] : null;
};

export const getRecentDuelResults = async (limit = 10) => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM duel_results ORDER BY timestamp DESC LIMIT ?', limit);
};

export const getUnsyncedDuelResults = async () => {
  const db = getDb();
  return await db.getAllAsync("SELECT * FROM duel_results WHERE synced = 0 OR synced IS NULL");
};
