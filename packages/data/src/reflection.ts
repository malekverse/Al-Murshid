// Night reflection (SPEC 5.7): three fields at most, one gratitude, one intention for tomorrow and
// a free note. Kept on this device only and encrypted at rest (AES-GCM, sealed by each app with
// its platform's keys); never synced in v1 (SPEC 9).

import { z } from 'zod';

/** Each field's length limit: a few lines, not an essay. */
export const REFLECTION_MAX = 1000;

export const reflectionFields = ['gratitude', 'intention', 'note'] as const;
export type ReflectionField = (typeof reflectionFields)[number];

const field = z.string().max(REFLECTION_MAX);

export const reflectionTextSchema = z.object({
  gratitude: field,
  intention: field,
  note: field,
});
export type ReflectionText = z.infer<typeof reflectionTextSchema>;

export const reflectionSchema = reflectionTextSchema.extend({
  /** The evening it belongs to, "2026-10-18" (from Maghrib until the next Fajr). */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updatedAt: z.iso.datetime(),
});
export type Reflection = z.infer<typeof reflectionSchema>;

export const emptyReflection: ReflectionText = { gratitude: '', intention: '', note: '' };

/** Trims each field to its limit; nothing written at all is no reflection. */
export function tidyReflection(text: ReflectionText): ReflectionText | null {
  const tidy = {
    gratitude: text.gratitude.trim().slice(0, REFLECTION_MAX),
    intention: text.intention.trim().slice(0, REFLECTION_MAX),
    note: text.note.trim().slice(0, REFLECTION_MAX),
  };
  return reflectionFields.some((f) => tidy[f]) ? tidy : null;
}

/** What is sealed: the three fields. The date stays outside, as the row's key. */
export function reflectionPlaintext(text: ReflectionText): string {
  return JSON.stringify(reflectionTextSchema.parse(text));
}

/** Reads opened plaintext back; anything damaged gives null rather than a guess. */
export function parseReflectionPlaintext(
  date: string,
  plaintext: string,
  updatedAt: string,
): Reflection | null {
  try {
    const parsed = reflectionSchema.safeParse({ ...JSON.parse(plaintext), date, updatedAt });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
