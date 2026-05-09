import { getSupabase } from './client';
import { getDb } from '../../store/db';

const SYNC_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

async function withTimeout<T>(promise: Promise<T>, timeoutMs = SYNC_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer!));
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      if (attempt === MAX_RETRIES) throw e;
      console.warn(`${label} failed (attempt ${attempt}), retrying...`);
    }
  }
  throw new Error(`${label} failed after ${MAX_RETRIES} attempts`);
}

export type SyncStatus = {
  success: boolean;
  message: string;
  tamperDetected: boolean;
  details?: string;
};

function computeChecksum(record: any): string {
  const str = JSON.stringify(record, Object.keys(record).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

const TABLES = [
  { name: 'reflections', idField: 'id', localIdField: 'id' },
  { name: 'prayer_logs', idField: 'id', localIdField: 'id', prefix: 'pl_' },
  { name: 'sleep_logs', idField: 'id', localIdField: 'id', prefix: 'sl_' },
  { name: 'conversation_messages', idField: 'id', localIdField: 'id', prefix: 'cm_' },
  { name: 'khatmah_progress', idField: 'id', localIdField: 'id', prefix: 'kp_' },
  { name: 'alarm_logs', idField: 'id', localIdField: 'id', prefix: 'al_' },
  { name: 'check_ins', idField: 'id', localIdField: 'id', prefix: 'ci_' },
  { name: 'duel_results', idField: 'id', localIdField: 'id', prefix: 'dr_' },
  { name: 'user_profile', idField: 'id', localIdField: 'id' },
];

async function pushTable(userId: string, table: typeof TABLES[0]): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return 'Supabase not configured';

  const db = getDb();
  const rows: any[] = await db.getAllAsync(`SELECT * FROM ${table.name} WHERE synced = 0 OR synced IS NULL`);
  if (rows.length === 0) return `No new ${table.name} to sync`;

  const payload = rows.map((r) => {
    const record: any = { user_id: userId, checksum: computeChecksum(r) };
    if (table.prefix) {
      record.id = `${table.prefix}${r[table.localIdField]}`;
    } else {
      record[table.idField] = r[table.idField];
    }
    for (const key of Object.keys(r)) {
      if (key === table.localIdField || key === 'synced') continue;
      record[key] = r[key];
    }
    return record;
  });

  const pushPromise = supabase.from(table.name).upsert(payload as any, { onConflict: 'id' });
  const { error } = (await withRetry(
    () => withTimeout(Promise.resolve(pushPromise)),
    `push ${table.name}`
  )) as any;
  if (error) return `${table.name}: ${error.message}`;

  for (const r of rows) {
    await db.runAsync(`UPDATE ${table.name} SET synced = 1 WHERE ${table.localIdField} = ?`, r[table.localIdField]);
  }
  return `Synced ${rows.length} ${table.name}`;
}

async function pullTable(userId: string, table: typeof TABLES[0]): Promise<{ message: string; tamperCount: number }> {
  const supabase = getSupabase();
  if (!supabase) return { message: 'Supabase not configured', tamperCount: 0 };

  const db = getDb();
  const pullPromise = supabase.from(table.name).select('*').eq('user_id', userId).order('date', { ascending: false } as any);
  const { data, error } = (await withRetry(
    () => withTimeout(Promise.resolve(pullPromise)),
    `pull ${table.name}`
  )) as any;

  if (error) return { message: `${table.name}: ${error.message}`, tamperCount: 0 };

  const records = (data as any[]) || [];
  let tamperCount = 0;

  for (const record of records) {
    const idValue = table.prefix
      ? (record.id as string).replace(table.prefix, '')
      : record[table.idField];
    const existing: any[] = await db.getAllAsync(
      `SELECT * FROM ${table.name} WHERE ${table.localIdField} = ?`, idValue
    );

    if (existing.length > 0) {
      const localChecksum = computeChecksum(existing[0]);
      if (record.checksum && localChecksum !== record.checksum) {
        tamperCount++;
        const setClause = Object.keys(record)
          .filter(k => k !== table.idField && k !== 'user_id' && k !== 'checksum')
          .map(k => `${k} = ?`).join(', ');
        const values = Object.keys(record)
          .filter(k => k !== table.idField && k !== 'user_id' && k !== 'checksum')
          .map(k => record[k]);
        await db.runAsync(
          `UPDATE ${table.name} SET ${setClause}, synced = 1 WHERE ${table.localIdField} = ?`,
          ...values, idValue
        );
      }
    } else {
      const keys = Object.keys(record).filter(k => k !== 'user_id' && k !== 'checksum');
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(k => record[k]);
      await db.runAsync(
        `INSERT OR IGNORE INTO ${table.name} (${keys.join(', ')}) VALUES (${placeholders})`,
        ...values
      );
    }
  }

  return {
    message: `Pulled ${records.length} ${table.name}`,
    tamperCount,
  };
}

export async function fullSync(userId: string): Promise<SyncStatus> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'Supabase not configured', tamperDetected: false };

  try {
    const messages: string[] = [];
    let totalTamperCount = 0;

    for (const table of TABLES) {
      try {
        const pushMsg = await pushTable(userId, table);
        messages.push(pushMsg);
      } catch (e: any) {
        messages.push(`${table.name} push: ${e.message}`);
      }
    }

    for (const table of TABLES) {
      try {
        const pullResult = await pullTable(userId, table);
        messages.push(pullResult.message);
        totalTamperCount += pullResult.tamperCount;
      } catch (e: any) {
        messages.push(`${table.name} pull: ${e.message}`);
      }
    }

    return {
      success: true,
      message: messages.join(' | '),
      tamperDetected: totalTamperCount > 0,
      details: totalTamperCount > 0 ? `${totalTamperCount} records were tampered and restored` : undefined,
    };
  } catch (e: any) {
    return { success: false, message: e.message, tamperDetected: false };
  }
}
