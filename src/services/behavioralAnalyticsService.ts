import { getDb } from '../store/db';

export interface WeeklyTrend {
  prayer: Record<string, number[]>;
  sleep: { avgHours: number; nightsLogged: number };
  consistency: number;
  strongestDay: string;
  weakestDay: string;
}

export interface BehaviorProfile {
  mostConsistentPrayer: string;
  leastConsistentPrayer: string;
  averageSleepHours: number;
  typicalWakeUp: string;
  reflectionFrequency: number;
  overallImanScore: number;
}

export interface ReflectionMoodTrend {
  period: string;
  count: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function getWeeklyTrends(): Promise<WeeklyTrend> {
  const db = getDb();
  const weekAgo = Date.now() - 7 * 86400000;

  const prayerRows = await db.getAllAsync<{ prayerName: string; date: string }>(
    'SELECT prayerName, date FROM prayer_logs WHERE timestamp >= ?',
    weekAgo
  );

  const sleepRows = await db.getAllAsync<{ hoursSlept: number }>(
    'SELECT hoursSlept FROM sleep_logs WHERE timestamp >= ?',
    weekAgo
  );

  const prayer: Record<string, number[]> = { fajr: [], dhuhr: [], asr: [], maghrib: [], isha: [] };
  const dayCount: Record<string, number> = {};

  for (const r of prayerRows) {
    const d = new Date(r.date);
    const dayIdx = d.getDay();
    if (!prayer[r.prayerName]) prayer[r.prayerName] = [];
    prayer[r.prayerName][dayIdx] = (prayer[r.prayerName][dayIdx] || 0) + 1;
    dayCount[DAY_NAMES[dayIdx]] = (dayCount[DAY_NAMES[dayIdx]] || 0) + 1;
  }

  const totalPrayers = prayerRows.length;
  const maxPossible = 5 * 7;
  const consistency = Math.round((totalPrayers / maxPossible) * 100);

  let strongestDay = DAY_NAMES[0];
  let weakestDay = DAY_NAMES[0];
  let maxCount = 0;
  let minCount = Infinity;
  for (const [day, count] of Object.entries(dayCount)) {
    if (count > maxCount) { maxCount = count; strongestDay = day; }
    if (count < minCount) { minCount = count; weakestDay = day; }
  }

  const avgHours = sleepRows.length > 0
    ? Math.round((sleepRows.reduce((s, r) => s + r.hoursSlept, 0) / sleepRows.length) * 10) / 10
    : 0;

  return {
    prayer,
    sleep: { avgHours, nightsLogged: sleepRows.length },
    consistency,
    strongestDay,
    weakestDay,
  };
}

export async function getBehaviorProfile(): Promise<BehaviorProfile> {
  const db = getDb();
  const thirtyDaysAgo = Date.now() - 30 * 86400000;

  const prayerRows = await db.getAllAsync<{ prayerName: string }>(
    'SELECT prayerName FROM prayer_logs WHERE timestamp >= ?',
    thirtyDaysAgo
  );

  const sleepRows = await db.getAllAsync<{ hoursSlept: number }>(
    'SELECT hoursSlept FROM sleep_logs WHERE timestamp >= ?',
    thirtyDaysAgo
  );

  const reflectionCount = (await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reflections WHERE timestamp >= ?',
    thirtyDaysAgo
  ))[0]?.count ?? 0;

  const prayerCounts: Record<string, number> = {};
  for (const r of prayerRows) {
    prayerCounts[r.prayerName] = (prayerCounts[r.prayerName] || 0) + 1;
  }

  let mostConsistentPrayer = 'fajr';
  let leastConsistentPrayer = 'isha';
  let maxP = 0;
  let minP = Infinity;
  for (const [name, count] of Object.entries(prayerCounts)) {
    if (count > maxP) { maxP = count; mostConsistentPrayer = name; }
    if (count < minP) { minP = count; leastConsistentPrayer = name; }
  }

  const avgSleepHours = sleepRows.length > 0
    ? Math.round((sleepRows.reduce((s, r) => s + r.hoursSlept, 0) / sleepRows.length) * 10) / 10
    : 0;

  const typicalWakeUp = sleepRows.length > 0
    ? await getTypicalWakeUp()
    : 'Unknown';

  const prayerScore = Math.min(100, Math.round((prayerRows.length / (5 * 30)) * 100));
  const sleepScore = Math.min(100, Math.round((avgSleepHours / 8) * 100));
  const reflectionScore = Math.min(100, reflectionCount * 10);
  const overallImanScore = Math.round((prayerScore + sleepScore + reflectionScore) / 3);

  return {
    mostConsistentPrayer,
    leastConsistentPrayer,
    averageSleepHours: avgSleepHours,
    typicalWakeUp,
    reflectionFrequency: reflectionCount,
    overallImanScore,
  };
}

async function getTypicalWakeUp(): Promise<string> {
  const db = getDb();
  const weekAgo = Date.now() - 7 * 86400000;
  const rows = await db.getAllAsync<{ timestamp: number }>(
    'SELECT timestamp FROM prayer_logs WHERE prayerName = ? AND timestamp >= ? ORDER BY timestamp ASC LIMIT 7',
    'fajr',
    weekAgo
  );
  if (rows.length === 0) return 'Unknown';
  const avgTimestamp = rows.reduce((s, r) => s + r.timestamp, 0) / rows.length;
  const avgDate = new Date(avgTimestamp);
  const hours = avgDate.getHours();
  const minutes = avgDate.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export async function getWeeklyReflectionMoodTrend(): Promise<ReflectionMoodTrend[]> {
  const db = getDb();
  const trends: ReflectionMoodTrend[] = [];
  for (let w = 0; w < 4; w++) {
    const start = Date.now() - (w + 1) * 7 * 86400000;
    const end = Date.now() - w * 7 * 86400000;
    const count = (await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM reflections WHERE timestamp >= ? AND timestamp < ?',
      start, end
    ))[0]?.count ?? 0;
    trends.push({ period: `Week ${4 - w}`, count });
  }
  return trends.reverse();
}
