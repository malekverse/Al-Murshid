import { describe, expect, it } from 'vitest';
import { khatmahDay, MUSHAF_PAGES, readThrough, startKhatmah } from './khatmah';
import { ayahAtTime, playbackSpans, wordAtTime, type AyahTiming } from './recitation';
import { addDays, isoDate } from './time';

const day1 = { year: 2026, month: 10, day: 18 };

describe('khatmah plan', () => {
  it('reads the mushaf by a date: 604 pages in 30 days is 21 a day', () => {
    const plan = startKhatmah({ kind: 'date', finishOn: isoDate(addDays(day1, 29)) }, day1);
    expect(plan.basePace).toBe(21);
    expect(khatmahDay(plan, day1)).toMatchObject({
      from: 1,
      to: 21,
      readToday: 0,
      pace: 21,
      progress: 0,
      done: false,
    });
  });

  it('holds today’s portion still while reading it', () => {
    let plan = startKhatmah({ kind: 'pace', pagesPerDay: 4 }, day1);
    plan = readThrough(plan, 2, day1);
    expect(khatmahDay(plan, day1)).toMatchObject({ from: 1, to: 4, readToday: 2 });
    plan = readThrough(plan, 6, day1);
    expect(khatmahDay(plan, day1)).toMatchObject({ from: 1, to: 4, readToday: 4 });
    // The next day starts where reading stopped.
    expect(khatmahDay(plan, addDays(day1, 1))).toMatchObject({ from: 7, to: 10, readToday: 0 });
  });

  it('never moves backwards, nor past the last page', () => {
    let plan = startKhatmah({ kind: 'pace', pagesPerDay: 10 }, day1);
    plan = readThrough(plan, 50, day1);
    expect(readThrough(plan, 20, day1).page).toBe(51);
    expect(readThrough(plan, 900, day1).page).toBe(MUSHAF_PAGES + 1);
  });

  it('recalculates quietly when behind, asking at most twice the first pace', () => {
    const plan = startKhatmah({ kind: 'date', finishOn: isoDate(addDays(day1, 29)) }, day1);
    // Ten days later, nothing read: 604 pages over 20 days would be 31, so it asks 31.
    expect(khatmahDay(plan, addDays(day1, 10))).toMatchObject({ from: 1, to: 31, pace: 31 });
    // Twenty-five days later: 604 over 5 days would be 121; capped at 42, and the finish moves.
    const late = khatmahDay(plan, addDays(day1, 25));
    expect(late.pace).toBe(42);
    expect(late.finishOn).toEqual(addDays(day1, 25 + Math.ceil(604 / 42) - 1));
    // Past the date, the plan keeps its first pace.
    expect(khatmahDay(plan, addDays(day1, 40))).toMatchObject({ pace: 21 });
  });

  it('reads a stretch at a steady pace and knows when it is done', () => {
    let plan = startKhatmah({ kind: 'pace', pagesPerDay: 5 }, day1, 582, 604);
    expect(khatmahDay(plan, day1)).toMatchObject({ from: 582, to: 586, pace: 5 });
    expect(khatmahDay(plan, day1).finishOn).toEqual(addDays(day1, 4));
    plan = readThrough(plan, 600, day1);
    expect(khatmahDay(plan, day1).progress).toBeCloseTo(19 / 23);
    plan = readThrough(plan, 604, addDays(day1, 1));
    expect(khatmahDay(plan, addDays(day1, 1))).toMatchObject({ done: true, progress: 1 });
    expect(khatmahDay(plan, addDays(day1, 2))).toMatchObject({ done: true, pace: 0 });
  });

  it('refuses plans that cannot be read', () => {
    expect(() => startKhatmah({ kind: 'pace', pagesPerDay: 0 }, day1)).toThrow(RangeError);
    expect(() =>
      startKhatmah({ kind: 'date', finishOn: isoDate(addDays(day1, -1)) }, day1),
    ).toThrow(RangeError);
    expect(() => startKhatmah({ kind: 'pace', pagesPerDay: 1 }, day1, 10, 5)).toThrow(RangeError);
    expect(() => startKhatmah({ kind: 'pace', pagesPerDay: 1 }, day1, 1, 605)).toThrow(RangeError);
  });
});

describe('recitation spans', () => {
  const timings: AyahTiming[] = [
    [80, 80, [[1, 80, 80]]], // zero length (Al-Fatihah 1 in one recording)
    [
      100,
      5000,
      [
        [1, 100, 600],
        [2, 600, 1500],
        [2, 1600, 2000],
        [3, 2000, 5000],
      ],
    ],
    [15100, 19000, [[1, 15100, 19000]]],
    [2000, 3000, [[1, 2000, 3000]]], // matched to an earlier occurrence
    [19500, 22000, [[1, 19500, 22000]]],
  ];

  it('keeps usable ayahs and places unusable ones between their neighbours', () => {
    const spans = playbackSpans(timings);
    expect(spans.map((s) => [s.start, s.end])).toEqual([
      [0, 100],
      [100, 5000],
      [15100, 19000],
      [19000, 19500],
      [19500, 22000],
    ]);
    expect(spans[3]!.words).toEqual([]);
    expect(playbackSpans([])).toEqual([]);
  });

  it('lets a trailing unusable ayah sit at the end', () => {
    const spans = playbackSpans([
      [0, 1000, []],
      [500, 500, []],
    ]);
    expect(spans[1]).toEqual({ start: 1000, end: 1000, words: [] });
  });

  it('finds the ayah and the word at any moment', () => {
    const spans = playbackSpans(timings);
    expect(ayahAtTime(spans, 0)).toBe(0);
    expect(ayahAtTime(spans, 2500)).toBe(1);
    expect(ayahAtTime(spans, 5050)).toBe(1); // the pause between ayahs
    expect(ayahAtTime(spans, 9200)).toBe(1);
    expect(ayahAtTime(spans, 19200)).toBe(3);
    expect(ayahAtTime(spans, 99_000)).toBe(4);
    expect(ayahAtTime(playbackSpans([[2000, 3000, []]]), 1000)).toBe(-1); // the basmalah
    expect(ayahAtTime([], 1000)).toBe(-1);

    expect(wordAtTime(spans[1]!, 50)).toBeNull();
    expect(wordAtTime(spans[1]!, 700)).toBe(2);
    expect(wordAtTime(spans[1]!, 1550)).toBe(2); // a pause keeps the word lit
    expect(wordAtTime(spans[1]!, 1700)).toBe(2); // the reciter repeats it
    expect(wordAtTime(spans[1]!, 4000)).toBe(3);
  });
});
