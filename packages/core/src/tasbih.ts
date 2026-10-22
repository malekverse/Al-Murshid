// Tasbih (SPEC 5.6): a count toward an optional target. Reaching the target completes the round;
// it stays on screen until the next tap begins a new one. Nothing is scored.

/** The targets offered first; any other is a custom one, up to TASBIH_MAX. */
export const tasbihTargets = [33, 99, 100] as const;
export const TASBIH_MAX = 9999;

/** One tap: the count it leads to, and whether that tap reached the target. */
export function tapTasbih(
  count: number,
  target: number | null,
): { count: number; reached: boolean } {
  const complete = target !== null && count >= target;
  const next = (complete ? 0 : count) + 1;
  return { count: next, reached: target !== null && next === target };
}

/** Whether the round is complete (the target reached and no tap since). */
export function isTasbihComplete(count: number, target: number | null): boolean {
  return target !== null && count >= target;
}

/** Beads on the ring: one per count for targets up to 100, else a ring of 33 going round. */
export function ringBeads(target: number | null): number {
  return target !== null && target <= 100 ? target : 33;
}

/** How many beads are lit: the whole ring once the round is complete. */
export function litBeads(count: number, target: number | null): number {
  const beads = ringBeads(target);
  if (isTasbihComplete(count, target)) return beads;
  return count === 0 ? 0 : ((count - 1) % beads) + 1;
}
