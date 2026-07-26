import { getDb } from '../../store/db';

export interface DailyGoal {
  id?: number;
  date: string;
  target_prayers: number;
  target_dhikr: number;
  target_quran_pages: number;
  target_sadaqah: number;
  target_sleep_hours: number;
  target_physical_exercise: number;
}

export interface DayProgress {
  date: string;
  prayersLogged: number;
  dhikrCount: number;
  quranPagesRead: number;
  sadaqahTotal: number;
  sleepHours: number;
}

export async function saveDailyGoal(goal: Omit<DailyGoal, 'id'>): Promise<void> {
  const db = getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO daily_goals (date, target_prayers, target_dhikr, target_quran_pages, target_sadaqah, target_sleep_hours, target_physical_exercise)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    goal.date, goal.target_prayers, goal.target_dhikr, goal.target_quran_pages,
    goal.target_sadaqah, goal.target_sleep_hours, goal.target_physical_exercise
  );
}

export async function getDailyGoal(date: string): Promise<DailyGoal | null> {
  const db = getDb();
  const rows = await db.getAllAsync('SELECT * FROM daily_goals WHERE date = ?', date);
  return rows.length > 0 ? (rows[0] as DailyGoal) : null;
}

export async function getTodayProgress(): Promise<DayProgress> {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const prayerRows = await db.getAllAsync(
    'SELECT COUNT(*) as count FROM prayer_logs WHERE date = ?', today
  );
  const prayersLogged = (prayerRows[0] as any).count;

  const dhikrRows = await db.getAllAsync(
    'SELECT totalDhikrCount FROM user_settings WHERE key = ?', 'totalDhikrCount'
  );

  const quranRows = await db.getAllAsync(
    'SELECT pagesRead FROM khatmah_progress WHERE date = ? ORDER BY timestamp DESC LIMIT 1', today
  );

  const sadaqahRows = await db.getAllAsync(
    'SELECT COALESCE(SUM(amount), 0) as total FROM sadaqah_logs WHERE date = ?', today
  );

  const sleepRows = await db.getAllAsync(
    'SELECT hoursSlept FROM sleep_logs WHERE date = ? ORDER BY timestamp DESC LIMIT 1', today
  );

  return {
    date: today,
    prayersLogged,
    dhikrCount: dhikrRows.length > 0 ? parseInt((dhikrRows[0] as any).value || '0', 10) : 0,
    quranPagesRead: quranRows.length > 0 ? (quranRows[0] as any).pagesRead : 0,
    sadaqahTotal: sadaqahRows.length > 0 ? (sadaqahRows[0] as any).total : 0,
    sleepHours: sleepRows.length > 0 ? (sleepRows[0] as any).hoursSlept : 0,
  };
}

export async function getWeekProgress(days = 7): Promise<DayProgress[]> {
  const result: DayProgress[] = [];
  const db = getDb();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];

    const prayerRows = await db.getAllAsync(
      'SELECT COUNT(*) as count FROM prayer_logs WHERE date = ?', dateStr
    );
    const sleepRows = await db.getAllAsync(
      'SELECT hoursSlept FROM sleep_logs WHERE date = ? ORDER BY timestamp DESC LIMIT 1', dateStr
    );
    const sadaqahRows = await db.getAllAsync(
      'SELECT COALESCE(SUM(amount), 0) as total FROM sadaqah_logs WHERE date = ?', dateStr
    );
    const quranRows = await db.getAllAsync(
      'SELECT pagesRead FROM khatmah_progress WHERE date = ? ORDER BY timestamp DESC LIMIT 1', dateStr
    );

    result.push({
      date: dateStr,
      prayersLogged: (prayerRows[0] as any).count,
      dhikrCount: 0,
      quranPagesRead: quranRows.length > 0 ? (quranRows[0] as any).pagesRead : 0,
      sadaqahTotal: sadaqahRows.length > 0 ? (sadaqahRows[0] as any).total : 0,
      sleepHours: sleepRows.length > 0 ? (sleepRows[0] as any).hoursSlept : 0,
    });
  }

  return result;
}
