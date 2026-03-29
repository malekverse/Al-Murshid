import * as SQLite from 'expo-sqlite';

export const getDb = () => {
  return SQLite.openDatabaseSync('almurshid_vault.db');
};

export const initDatabase = async () => {
  const db = getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS reflections (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      encryptedPayload TEXT NOT NULL,
      aiGuidance TEXT
    );
  `);
};

export const saveReflection = async (id: string, date: string, encryptedPayload: string, aiGuidance: string) => {
  const db = getDb();
  await db.runAsync(
    'INSERT INTO reflections (id, date, encryptedPayload, aiGuidance) VALUES (?, ?, ?, ?)',
    id, date, encryptedPayload, aiGuidance
  );
};

export const getReflections = async () => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM reflections ORDER BY date DESC');
};
