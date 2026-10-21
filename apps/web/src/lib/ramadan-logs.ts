'use client';

import { isoDate, type CivilDate } from '@murshid/core';
import { withFasted, withTaraweeh, type RamadanLog } from '@murshid/data';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

// Ramadan's fasts and Taraweeh (SPEC 5.8), in this browser's IndexedDB.

/** The logs of the given dates, live, by ISO date. */
export function useRamadanLogs(dates: readonly (CivilDate | null)[]) {
  const keys = dates.filter((d): d is CivilDate => d !== null).map(isoDate);
  return useLiveQuery(
    async () =>
      new Map((await db.ramadanLogs.bulkGet(keys)).flatMap((l) => (l ? [[l.date, l]] : []))),
    [keys.join()],
  ) as Map<string, RamadanLog> | undefined;
}

export async function setFasted(date: CivilDate, fasted: boolean) {
  await db.transaction('rw', db.ramadanLogs, async () => {
    const log = await db.ramadanLogs.get(isoDate(date));
    await db.ramadanLogs.put(withFasted(log, date, fasted));
  });
}

export async function setTaraweeh(date: CivilDate, prayed: boolean) {
  await db.transaction('rw', db.ramadanLogs, async () => {
    const log = await db.ramadanLogs.get(isoDate(date));
    await db.ramadanLogs.put(withTaraweeh(log, date, prayed));
  });
}
