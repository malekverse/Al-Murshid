import { getDb } from '../db';

export const getUserSetting = async (key: string): Promise<string | null> => {
  const db = getDb();
  const rows = await db.getAllAsync('SELECT value FROM user_settings WHERE key = ?', key);
  return rows.length > 0 ? (rows[0] as any).value : null;
};

export const setUserSetting = async (key: string, value: string) => {
  const db = getDb();
  await db.runAsync(
    'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
    key, value
  );
};

export const getAllUserSettings = async () => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM user_settings');
};
