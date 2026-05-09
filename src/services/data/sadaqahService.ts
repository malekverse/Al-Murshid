import { getDb } from '../../store/db';

export interface SadaqahLog {
  id?: number;
  date: string;
  amount: number;
  currency: string;
  category: string;
  notes?: string;
  timestamp: number;
  synced?: number;
}

export interface SadaqahSummary {
  todayTotal: number;
  thisWeekTotal: number;
  thisMonthTotal: number;
  thisYearTotal: number;
  allTimeTotal: number;
  categoryBreakdown: { category: string; total: number }[];
  recentLogs: SadaqahLog[];
}

const CATEGORIES = ['general', 'zakat', 'food', 'water', 'education', 'medical', 'other'];

export function getCategories(): string[] {
  return CATEGORIES;
}

export async function saveSadaqahLog(log: Omit<SadaqahLog, 'id' | 'synced'>): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT INTO sadaqah_logs (date, amount, currency, category, notes, timestamp)
     VALUES (?, ?, ?, ?, ?, ?)`,
    log.date, log.amount, log.currency, log.category, log.notes || null, log.timestamp
  );
}

export async function getSadaqahLogs(): Promise<SadaqahLog[]> {
  const db = getDb();
  return await db.getAllAsync(
    'SELECT * FROM sadaqah_logs ORDER BY timestamp DESC'
  ) as SadaqahLog[];
}

export async function getSadaqahSummary(): Promise<SadaqahSummary> {
  const db = getDb();
  const rows = await db.getAllAsync('SELECT * FROM sadaqah_logs ORDER BY timestamp DESC') as SadaqahLog[];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  const thisWeekStr = thisWeekStart.toISOString().split('T')[0];
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisYear = now.getFullYear();

  let todayTotal = 0;
  let thisWeekTotal = 0;
  let thisMonthTotal = 0;
  let thisYearTotal = 0;
  let allTimeTotal = 0;

  const categoryTotals: Record<string, number> = {};

  for (const row of rows) {
    allTimeTotal += row.amount;
    if (row.date === todayStr) todayTotal += row.amount;
    if (row.date >= thisWeekStr) thisWeekTotal += row.amount;
    if (row.date.startsWith(thisMonthStr)) thisMonthTotal += row.amount;
    if (row.date.startsWith(String(thisYear))) thisYearTotal += row.amount;

    const cat = row.category || 'general';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + row.amount;
  }

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return {
    todayTotal,
    thisWeekTotal,
    thisMonthTotal,
    thisYearTotal,
    allTimeTotal,
    categoryBreakdown,
    recentLogs: rows.slice(0, 20),
  };
}
