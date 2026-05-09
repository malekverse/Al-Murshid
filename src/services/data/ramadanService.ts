import { getDb } from '../../store/db';

export interface RamadanLog {
  id?: number;
  date: string;
  fasting: number;
  suhoor_time?: string;
  iftar_time?: string;
  pages_read: number;
  qiyam: number;
  sadaqah: number;
  dua_notes?: string;
  notes?: string;
  synced?: number;
}

export interface RamadanGoals {
  id?: number;
  year: number;
  quran_goal_pages: number;
  sadaqah_goal: number;
  synced?: number;
}

export async function saveRamadanLog(log: Omit<RamadanLog, 'id' | 'synced'>): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO ramadan_logs (date, fasting, suhoor_time, iftar_time, pages_read, qiyam, sadaqah, dua_notes, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    log.date, log.fasting, log.suhoor_time || null, log.iftar_time || null,
    log.pages_read, log.qiyam, log.sadaqah, log.dua_notes || null, log.notes || null
  );
}

export async function getRamadanLog(date: string): Promise<RamadanLog | null> {
  const db = getDb();
  const rows = await db.getAllAsync('SELECT * FROM ramadan_logs WHERE date = ?', date);
  return rows.length > 0 ? (rows[0] as RamadanLog) : null;
}

export async function getAllRamadanLogs(year: number): Promise<RamadanLog[]> {
  const db = getDb();
  const start = `${year}-03-01`;
  const end = `${year + (year % 2 === 0 ? 0 : 0)}-04-30`;
  const rows = await db.getAllAsync(
    'SELECT * FROM ramadan_logs WHERE date >= ? AND date <= ? ORDER BY date ASC',
    start, end
  );
  return rows as RamadanLog[];
}

export async function getRamadanSummary(year: number): Promise<{
  totalFasting: number;
  totalQiyam: number;
  totalPagesRead: number;
  totalSadaqah: number;
  totalDays: number;
}> {
  const db = getDb();
  const start = `${year}-02-01`;
  const end = `${year}-05-01`;
  const rows: any[] = await db.getAllAsync(
    'SELECT SUM(fasting) as totalFasting, SUM(qiyam) as totalQiyam, SUM(pages_read) as totalPagesRead, SUM(sadaqah) as totalSadaqah, COUNT(*) as totalDays FROM ramadan_logs WHERE date >= ? AND date <= ?',
    start, end
  );
  return rows[0] || { totalFasting: 0, totalQiyam: 0, totalPagesRead: 0, totalSadaqah: 0, totalDays: 0 };
}

export async function saveRamadanGoals(goals: Omit<RamadanGoals, 'id' | 'synced'>): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO ramadan_goals (year, quran_goal_pages, sadaqah_goal)
     VALUES (?, ?, ?)`,
    goals.year, goals.quran_goal_pages, goals.sadaqah_goal
  );
}

export async function getRamadanGoals(year: number): Promise<RamadanGoals | null> {
  const db = getDb();
  const rows = await db.getAllAsync('SELECT * FROM ramadan_goals WHERE year = ?', year);
  return rows.length > 0 ? (rows[0] as RamadanGoals) : null;
}
