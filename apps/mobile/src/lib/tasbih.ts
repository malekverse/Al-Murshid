import { FREE_PHRASE, parseTasbihCount } from '@murshid/data';
import { eq, sql } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db, tasbihDaily } from '@/db';
import { mmkvValue } from './mmkv-value';

// Tasbih (SPEC 5.6): the count on screen is kept between visits, and each day's total is saved in
// the app's SQLite database. Until the reviewed phrases arrive, everything counts as "free".

export const tasbihCount = mmkvValue('tasbih', parseTasbihCount);

/** The day's total across phrases, live. */
export function useTasbihTotal(date: string): number | undefined {
  const { data, updatedAt } = useLiveQuery(
    db
      .select({ total: sql<number>`coalesce(sum(${tasbihDaily.count}), 0)` })
      .from(tasbihDaily)
      .where(eq(tasbihDaily.date, date)),
    [date],
  );
  return updatedAt ? (data[0]?.total ?? 0) : undefined;
}

export function addTasbih(date: string, count = 1, phrase = FREE_PHRASE) {
  const updatedAt = new Date().toISOString();
  db.insert(tasbihDaily)
    .values({ date, phrase, count, updatedAt })
    .onConflictDoUpdate({
      target: [tasbihDaily.date, tasbihDaily.phrase],
      set: { count: sql`${tasbihDaily.count} + ${count}`, updatedAt },
    })
    .run();
}
