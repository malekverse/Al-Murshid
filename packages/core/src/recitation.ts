// Following a surah recording ayah by ayah and word by word (SPEC 5.5). Timestamps come from
// QUL (packages/content); a few are unusable (zero length, or matched to an earlier occurrence
// of a repeated phrase), so those ayahs are placed in the gap between their neighbours instead.

/** One ayah in a surah recording, in milliseconds: [from, to, [word, start, end][]]. */
export type AyahTiming = readonly [
  from: number,
  to: number,
  words: readonly (readonly [number, number, number])[],
];

export interface AyahSpan {
  start: number;
  end: number;
  /** [word, start, end], in recitation order (a word may repeat); empty when unreliable. */
  words: readonly (readonly [number, number, number])[];
}

/** How far an ayah may start before the previous one and still be a reciter resuming. */
const RESUME_MS = 5000;

/** Every ayah's span, in order and never going back. */
export function playbackSpans(timings: readonly AyahTiming[]): AyahSpan[] {
  const reliable = timings.map(([from, to]) => to > from);
  let lastFrom = -Infinity;
  timings.forEach(([from], i) => {
    if (!reliable[i]) return;
    if (from < lastFrom - RESUME_MS) reliable[i] = false;
    else lastFrom = from;
  });

  const spans: AyahSpan[] = [];
  let i = 0;
  while (i < timings.length) {
    if (reliable[i]) {
      const [from, to, words] = timings[i]!;
      const start = Math.max(from, spans.at(-1)?.start ?? 0);
      spans.push({ start, end: Math.max(start, to), words });
      i++;
      continue;
    }
    // A run of unusable ayahs shares the gap until the next usable one, in equal parts.
    let j = i;
    while (j < timings.length && !reliable[j]) j++;
    const gapStart = spans.at(-1)?.end ?? 0;
    const gapEnd = j < timings.length ? Math.max(gapStart, timings[j]![0]) : gapStart;
    const step = (gapEnd - gapStart) / (j - i);
    for (let k = i; k < j; k++) {
      const start = gapStart + step * (k - i);
      spans.push({ start, end: start + step, words: [] });
    }
    i = j;
  }
  return spans;
}

/** The ayah being recited at a moment (0-based), or -1 before the first (the basmalah). */
export function ayahAtTime(spans: readonly AyahSpan[], ms: number): number {
  let lo = 0;
  let hi = spans.length - 1;
  if (hi < 0 || ms < spans[0]!.start) return -1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (spans[mid]!.start <= ms) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** The word (from 1) being recited in an ayah at a moment; it stays lit through pauses. */
export function wordAtTime(span: AyahSpan, ms: number): number | null {
  let word: number | null = null;
  for (const [w, start] of span.words) {
    if (start > ms) break;
    word = w;
  }
  return word;
}
