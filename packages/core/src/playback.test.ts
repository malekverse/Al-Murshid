import { describe, expect, it } from 'vitest';
import {
  playbackStep,
  startCursor,
  type AyahSpan,
  type PlaybackRules,
  type PlaybackStep,
} from './recitation';

// Three ayahs of one second each, after a half-second basmalah.
const spans: AyahSpan[] = [
  { start: 500, end: 1500, words: [] },
  { start: 1500, end: 2500, words: [] },
  { start: 2500, end: 3400, words: [] },
];
const length = 3600;

/** Plays the recording from `from` (ms) with a look every 50 ms; returns what was heard. */
function listen(rules: PlaybackRules, from = 0, margin = 40) {
  let ms = from;
  let cursor = startCursor();
  const heard: number[] = [];
  const steps: PlaybackStep[] = [];
  for (let guard = 0; guard < 1000 && ms < length; guard++) {
    const before = cursor.ayah;
    const { step, cursor: after } = playbackStep(spans, ms, cursor, rules, margin);
    cursor = after;
    if (step.kind !== 'play') steps.push(step);
    if (step.kind === 'stop') break;
    if (step.kind === 'seek') {
      // Every jump starts a new hearing of an ayah.
      heard.push(cursor.ayah);
      ms = step.ms;
      continue;
    }
    if (cursor.ayah !== before && cursor.ayah >= 0) heard.push(cursor.ayah);
    ms += 50;
  }
  return { heard, steps };
}

const plain: PlaybackRules = { repeat: 1, range: null, gap: false };

describe('playback rules', () => {
  it('play straight through by default', () => {
    const { heard, steps } = listen(plain);
    expect(heard).toEqual([0, 1, 2]);
    expect(steps).toEqual([]);
  });

  it('play each ayah as many times as asked', () => {
    const { heard, steps } = listen({ ...plain, repeat: 2 });
    expect(heard).toEqual([0, 0, 1, 1, 2, 2]);
    expect(steps.every((s) => s.kind === 'seek')).toBe(true);
  });

  it('repeat a range as a whole, then stop', () => {
    const { heard, steps } = listen({ ...plain, range: { from: 1, to: 2, times: 3 } });
    expect(heard).toEqual([0, 1, 0, 1, 0, 1]);
    expect(steps.at(-1)).toEqual({ kind: 'stop' });
    // Once through is a range played once.
    expect(listen({ ...plain, range: { from: 2, to: 3, times: 1 } }, 1500).heard).toEqual([1, 2]);
  });

  it('pause after each ayah for as long as it took, once per hearing', () => {
    const { steps } = listen({ ...plain, gap: true });
    expect(steps).toEqual([
      { kind: 'gap', ms: 1000 },
      { kind: 'gap', ms: 1000 },
      { kind: 'gap', ms: 900 },
    ]);
    const twice = listen({ ...plain, gap: true, repeat: 2 }).steps;
    expect(twice.filter((s) => s.kind === 'gap')).toHaveLength(6);
  });

  it('act on a range end it was late for', () => {
    // The clock was last read inside ayah 3, past a range ending at ayah 2.
    const cursor = { ayah: 1, left: 0, pass: 1, gapped: -1 };
    const rules = { ...plain, range: { from: 1, to: 2, times: 2 } };
    expect(playbackStep(spans, 2600, cursor, rules, 40).step).toEqual({ kind: 'seek', ms: 500 });
    expect(playbackStep(spans, 2600, { ...cursor, pass: 2 }, rules, 40).step).toEqual({
      kind: 'stop',
    });
  });

  it('act on a range end long passed', () => {
    const rules = { ...plain, range: { from: 1, to: 1, times: 1 } };
    expect(playbackStep(spans, 2600, { ...startCursor(), ayah: 0 }, rules, 40).step).toEqual({
      kind: 'stop',
    });
  });

  it('stop when the range starts where there is no ayah', () => {
    const rules = { ...plain, range: { from: 9, to: 1, times: 5 } };
    expect(playbackStep(spans, 1490, startCursor(), rules, 40).step).toEqual({ kind: 'stop' });
  });

  it('carry on through the basmalah before the first ayah', () => {
    expect(playbackStep(spans, 100, startCursor(), plain, 40)).toEqual({
      step: { kind: 'play' },
      cursor: { ayah: -1, left: 0, pass: 1, gapped: -1 },
    });
  });
});
