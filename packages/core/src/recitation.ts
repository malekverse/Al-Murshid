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

/**
 * Every ayah's span, in order and never going back. A last ayah may have no usable end (a few files
 * close each surah with its listed length, rounded down): if its start follows on, it runs from
 * there to the end of the recording, which is Infinity until withRecordingEnd knows it.
 */
export function playbackSpans(timings: readonly AyahTiming[]): AyahSpan[] {
  const reliable = timings.map(([from, to]) => to > from);
  let lastFrom = -Infinity;
  timings.forEach(([from], i) => {
    if (!reliable[i]) return;
    if (from < lastFrom - RESUME_MS) reliable[i] = false;
    else lastFrom = from;
  });

  const spans: AyahSpan[] = [];
  const last = timings.length - 1;
  let i = 0;
  while (i < timings.length) {
    if (i === last && !reliable[i]) {
      const [from, , words] = timings[i]!;
      if (from >= (spans.at(-1)?.end ?? 0)) {
        spans.push({ start: from, end: Infinity, words });
        break;
      }
    }
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

/** Closes a last ayah that runs to the end of the recording, once the recording's length is known. */
export function withRecordingEnd(spans: readonly AyahSpan[], lengthMs: number): AyahSpan[] {
  const final = spans.at(-1);
  if (!final || Number.isFinite(final.end)) return [...spans];
  return [...spans.slice(0, -1), { ...final, end: Math.max(final.start, lengthMs) }];
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

// ---------- Repeating (Phase 5b) ----------

/** What to repeat while listening. */
export interface PlaybackRules {
  /** How many times each ayah plays (1 plays it once). */
  repeat: number;
  /** Ayahs `from` to `to` (from 1, inclusive) played `times` times, then the recitation stops. */
  range: { from: number; to: number; times: number } | null;
  /** A pause after each ayah as long as the ayah itself, to recite it back from memory. */
  gap: boolean;
}

/** Where playback stands between two looks at the clock. */
export interface PlaybackCursor {
  /** The ayah last seen (0-based; -1 before the first). */
  ayah: number;
  /** How many more times this ayah plays. */
  left: number;
  /** Which time through the range this is (from 1). */
  pass: number;
  /** The ayah whose pause was taken, so each hearing pauses once. */
  gapped: number;
}

export type PlaybackStep =
  /** Carry on. */
  | { kind: 'play' }
  /** Pause for this long (in recording time; divide by the playback speed), then carry on. */
  | { kind: 'gap'; ms: number }
  /** Jump to this moment of the recording. */
  | { kind: 'seek'; ms: number }
  /** The range is done: stop. */
  | { kind: 'stop' };

/** The cursor to start with. */
export const startCursor = (): PlaybackCursor => ({ ayah: -2, left: 0, pass: 1, gapped: -1 });

/**
 * What to do at a moment of the recording: carry on, pause after an ayah, go back for a repeat,
 * or stop at the end of a range. `margin` is how early an ayah's end counts as reached (about the
 * player's update interval), so a repeat starts before the next ayah is heard. An end passed
 * between two looks at the clock is still honoured, a moment late.
 */
export function playbackStep(
  spans: readonly AyahSpan[],
  ms: number,
  cursor: PlaybackCursor,
  rules: PlaybackRules,
  margin: number,
): { step: PlaybackStep; cursor: PlaybackCursor } {
  const { range } = rules;
  const play = (c: PlaybackCursor) => ({ step: { kind: 'play' } as PlaybackStep, cursor: c });

  const endOfRange = (c: PlaybackCursor) => {
    const first = spans[range!.from - 1];
    if (c.pass >= range!.times || !first)
      return { step: { kind: 'stop' } as PlaybackStep, cursor: c };
    return {
      step: { kind: 'seek', ms: first.start } as PlaybackStep,
      cursor: { ayah: range!.from - 1, left: rules.repeat - 1, pass: c.pass + 1, gapped: -1 },
    };
  };

  // What the end of ayah `i` asks for, if anything: its pause, a repeat, or the range's end.
  const atEnd = (i: number, c: PlaybackCursor) => {
    const span = spans[i]!;
    if (rules.gap && c.gapped !== i) {
      const next = spans[i + 1];
      const ms = (next ? next.start : span.end) - span.start;
      return { step: { kind: 'gap', ms } as PlaybackStep, cursor: { ...c, gapped: i } };
    }
    if (c.left > 0) {
      return {
        step: { kind: 'seek', ms: span.start } as PlaybackStep,
        cursor: { ...c, left: c.left - 1, gapped: -1 },
      };
    }
    if (range && i === range.to - 1) return endOfRange(c);
    return null;
  };

  const index = ayahAtTime(spans, ms);
  let c = cursor;
  // The previous ayah ended since the last look: settle its end before moving on.
  if (c.ayah >= 0 && index === c.ayah + 1) {
    const settled = atEnd(c.ayah, c);
    if (settled) return settled;
  }
  if (index !== c.ayah) c = { ayah: index, left: rules.repeat - 1, pass: c.pass, gapped: -1 };
  const span = spans[index];
  if (!span) return play(c);
  // Well past the range (a long wait between looks): its end was missed, act on it now.
  if (range && index > range.to - 1) return endOfRange(c);

  const next = spans[index + 1];
  if (ms < (next ? next.start : span.end) - margin) return play(c);
  return atEnd(index, c) ?? play(c);
}
