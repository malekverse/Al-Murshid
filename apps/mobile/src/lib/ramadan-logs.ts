import { isoDate, type CivilDate } from '@murshid/core';
import { withFasted, withTaraweeh, type RamadanLog } from '@murshid/data';
import { eq, inArray } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db, ramadanLogs } from '@/db';

// Ramadan's fasts and Taraweeh (SPEC 5.8), in the app's SQLite database.

/** The logs of the given dates, live, by ISO date. */
export function useRamadanLogs(dates: readonly (CivilDate | null)[]) {
  const keys = dates.filter((d): d is CivilDate => d !== null).map(isoDate);
  const { data, updatedAt } = useLiveQuery(
    db.select().from(ramadanLogs).where(inArray(ramadanLogs.date, keys)),
    [keys.join()],
  );
  return updatedAt ? new Map<string, RamadanLog>(data.map((l) => [l.date, l])) : undefined;
}

function save(log: RamadanLog) {
  db.insert(ramadanLogs)
    .values(log)
    .onConflictDoUpdate({
      target: ramadanLogs.date,
      set: { fasted: log.fasted, taraweeh: log.taraweeh, updatedAt: log.updatedAt },
    })
    .run();
}

const current = (date: CivilDate) =>
  db
    .select()
    .from(ramadanLogs)
    .where(eq(ramadanLogs.date, isoDate(date)))
    .get();

export function setFasted(date: CivilDate, fasted: boolean) {
  save(withFasted(current(date), date, fasted));
}

export function setTaraweeh(date: CivilDate, prayed: boolean) {
  save(withTaraweeh(current(date), date, prayed));
}
