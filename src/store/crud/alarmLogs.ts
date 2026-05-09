import { getDb } from '../db';

export const saveAlarmLog = async (date: string, alarmType: string, dismissed: number, timestamp: number) => {
  const db = getDb();
  await db.runAsync(
    'INSERT INTO alarm_logs (date, alarmType, dismissed, timestamp) VALUES (?, ?, ?, ?)',
    date, alarmType, dismissed, timestamp
  );
};

export const getAlarmLogs = async () => {
  const db = getDb();
  return await db.getAllAsync('SELECT * FROM alarm_logs ORDER BY timestamp DESC');
};

export const getUnsyncedAlarmLogs = async () => {
  const db = getDb();
  return await db.getAllAsync("SELECT * FROM alarm_logs WHERE synced = 0 OR synced IS NULL");
};
