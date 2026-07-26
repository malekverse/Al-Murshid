import { getDb } from '../../store/db';
import { readAsStringAsync } from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';

const ALL_TABLES = [
  'reflections', 'prayer_logs', 'sleep_logs', 'conversation_messages',
  'khatmah_progress', 'alarm_logs', 'check_ins', 'user_settings',
  'user_profile', 'sync_metadata', 'duel_results',
  'ramadan_logs', 'ramadan_goals', 'sadaqah_logs', 'quran_bookmarks', 'daily_goals',
];

export const exportAllDataAsJson = async (): Promise<string> => {
  const db = getDb();
  const exportData: Record<string, any[]> = {};

  for (const table of ALL_TABLES) {
    try {
      const rows = await db.getAllAsync('SELECT * FROM ' + table);
      exportData[table] = rows as any[];
    } catch {
      exportData[table] = [];
    }
  }

  const json = JSON.stringify(exportData, null, 2);
  return json;
};

export const getDataStats = async () => {
  const db = getDb();
  const stats: Record<string, number> = {};

  for (const table of ALL_TABLES) {
    try {
      const rows = await db.getAllAsync('SELECT COUNT(*) as count FROM ' + table);
      stats[table] = (rows[0] as any).count;
    } catch {
      stats[table] = 0;
    }
  }

  return stats;
};

export const importDataFromJson = async (json: string): Promise<{ success: boolean; message: string }> => {
  const db = getDb();
  let data: Record<string, any[]>;

  try {
    data = JSON.parse(json);
  } catch {
    return { success: false, message: 'Invalid JSON format' };
  }

  const messages: string[] = [];

  for (const table of ALL_TABLES) {
    const rows = data[table];
    if (!rows || rows.length === 0) {
      messages.push(`${table}: 0 rows`);
      continue;
    }

    try {
      const keys = Object.keys(rows[0]).filter(k => k !== 'id');
      if (keys.length === 0) {
        messages.push(`${table}: skipped (no data columns)`);
        continue;
      }
      const placeholders = keys.map(() => '?').join(', ');
      const insertSQL = `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

      let count = 0;
      for (const row of rows) {
        const values = keys.map(k => row[k]);
        try {
          await db.runAsync(insertSQL, ...values);
          count++;
        } catch {
          // skip individual row failures
        }
      }
      messages.push(`${table}: ${count} rows`);
    } catch (e: any) {
      messages.push(`${table}: failed (${e.message})`);
    }
  }

  return { success: true, message: messages.join(' | ') };
};

export const pickJsonFile = async (): Promise<string | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const uri = result.assets[0].uri;
    const content = await readAsStringAsync(uri);
    return content;
  } catch {
    return null;
  }
};
