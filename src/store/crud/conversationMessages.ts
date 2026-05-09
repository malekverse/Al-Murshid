import { getDb } from '../db';

export const saveConversationMessage = async (role: string, content: string, timestamp: number) => {
  const db = getDb();
  await db.runAsync(
    'INSERT INTO conversation_messages (role, content, timestamp) VALUES (?, ?, ?)',
    role, content, timestamp
  );
};

export const getRecentConversationMessages = async (limit: number = 100) => {
  const db = getDb();
  return await db.getAllAsync(
    'SELECT * FROM conversation_messages ORDER BY timestamp DESC LIMIT ?',
    limit
  );
};

export const getUnsyncedConversationMessages = async () => {
  const db = getDb();
  return await db.getAllAsync("SELECT * FROM conversation_messages WHERE synced = 0 OR synced IS NULL");
};

export const deleteOldConversationMessages = async (keepCount: number = 100) => {
  const db = getDb();
  await db.execAsync(`
    DELETE FROM conversation_messages WHERE id NOT IN (
      SELECT id FROM conversation_messages ORDER BY timestamp DESC LIMIT ${keepCount}
    );
  `);
};
