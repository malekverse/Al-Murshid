'use client';

import { addToTasbihDay, FREE_PHRASE, parseTasbihCount, tasbihKey } from '@murshid/data';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { localValue } from './local-value';

// Tasbih (SPEC 5.6): the count on screen is kept between visits, and each day's total is saved in
// this browser's IndexedDB. Until the reviewed phrases arrive, everything counts as "free".

export const tasbihCount = localValue('murshid-tasbih', parseTasbihCount);

/** The day's total across phrases, live. */
export function useTasbihTotal(date: string | null): number | undefined {
  return useLiveQuery(
    async () =>
      date
        ? (await db.tasbihDaily.where('date').equals(date).toArray()).reduce(
            (sum, day) => sum + day.count,
            0,
          )
        : 0,
    [date],
  );
}

export async function addTasbih(date: string, count = 1, phrase = FREE_PHRASE) {
  const key = tasbihKey(date, phrase);
  await db.transaction('rw', db.tasbihDaily, async () => {
    const day = await db.tasbihDaily.get(key);
    await db.tasbihDaily.put({ key, ...addToTasbihDay(day, date, phrase, count) });
  });
}
