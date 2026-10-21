// Ramadan's logs (SPEC 5.8): one row per date, kept on the device. "fasted" is that day's fast,
// "fasted" or "not today", and the app never asks why; "taraweeh" is that evening's night prayer.
// Synced in Phase 8 (the fast as SPEC 9's fasting_logs).

import { isoDate, type CivilDate } from '@murshid/core';
import { z } from 'zod';

export const ramadanLogSchema = z.object({
  /** "2027-02-08" */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** True for "fasted", false for "not today", null until the person says either. */
  fasted: z.boolean().nullable(),
  /** That evening's Taraweeh, prayed. */
  taraweeh: z.boolean(),
  updatedAt: z.iso.datetime(),
});
export type RamadanLog = z.infer<typeof ramadanLogSchema>;

const blank = (date: CivilDate): RamadanLog => ({
  date: isoDate(date),
  fasted: null,
  taraweeh: false,
  updatedAt: new Date(0).toISOString(),
});

/** "Fasted" or "not today" for a date's fast; the same answer again clears it. */
export function withFasted(
  log: RamadanLog | undefined,
  date: CivilDate,
  fasted: boolean,
  now: Date = new Date(),
): RamadanLog {
  const current = log ?? blank(date);
  return {
    ...current,
    fasted: current.fasted === fasted ? null : fasted,
    updatedAt: now.toISOString(),
  };
}

/** That evening's Taraweeh, prayed or not. */
export function withTaraweeh(
  log: RamadanLog | undefined,
  date: CivilDate,
  prayed: boolean,
  now: Date = new Date(),
): RamadanLog {
  return { ...(log ?? blank(date)), taraweeh: prayed, updatedAt: now.toISOString() };
}
