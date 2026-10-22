// Tasbih's daily totals (SPEC 5.6; SPEC 9's tasbih_daily, local side): one row per date and phrase
// on this device. Until the reviewed phrases arrive, tasbih counts on its own, as "free".

import { TASBIH_MAX } from '@murshid/core';
import { z } from 'zod';

export const FREE_PHRASE = 'free';

export const tasbihDaySchema = z.object({
  /** "2026-10-21" */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phrase: z.string().min(1),
  count: z.number().int().min(0),
  updatedAt: z.iso.datetime(),
});
export type TasbihDay = z.infer<typeof tasbihDaySchema>;

export function tasbihKey(date: string, phrase: string): string {
  return `${date}:${phrase}`;
}

/** The day's total with `count` more. */
export function addToTasbihDay(
  day: TasbihDay | undefined,
  date: string,
  phrase: string,
  count: number,
  now: Date = new Date(),
): TasbihDay {
  return { date, phrase, count: (day?.count ?? 0) + count, updatedAt: now.toISOString() };
}

/** The count on screen, kept between visits; anything damaged starts again at 0. */
export const tasbihCountSchema = z.number().int().min(0).max(TASBIH_MAX).catch(0);

export function parseTasbihCount(raw: unknown): number {
  return tasbihCountSchema.parse(raw);
}
