import { getDb } from '../db';

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

export const saveUserProfile = async (profile: {
  id: string; email?: string; display_name?: string; photo_url?: string; auth_provider?: string;
}) => {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO user_profile (id, email, display_name, photo_url, auth_provider, is_local, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, datetime('now'))`,
    profile.id, profile.email || null, profile.display_name || null, profile.photo_url || null, profile.auth_provider || 'email'
  );
};

export const getUserProfile = async () => {
  const db = getDb();
  const rows = await db.getAllAsync('SELECT * FROM user_profile LIMIT 1');
  return rows.length > 0 ? rows[0] : null;
};

export const updateSyncMetadata = async (tableName: string, checksum: string) => {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_metadata (table_name, last_sync_at, last_checksum)
     VALUES (?, datetime('now'), ?)`,
    tableName, checksum
  );
};

export const getSyncMetadata = async (tableName: string) => {
  const db = getDb();
  const rows = await db.getAllAsync('SELECT * FROM sync_metadata WHERE table_name = ?', tableName);
  return rows.length > 0 ? rows[0] : null;
};
