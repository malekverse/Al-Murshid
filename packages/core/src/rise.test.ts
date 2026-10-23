import { describe, expect, it } from 'vitest';
import { prayerTimes, type DayTimes } from './prayer-times';
import {
  BACKUP_EVERY_MINUTES,
  BACKUPS,
  defaultRise,
  jointAngle,
  kneeAngle,
  makeSum,
  newSpotCode,
  nextRise,
  planRise,
  riseTime,
  shakeStep,
  spotMatches,
  squatStep,
  starSequence,
  startShakes,
  startSquats,
  tapStar,
  type MorningState,
  type Pose,
  type RiseSettings,
} from './rise';
import type { MethodId } from './methods';
import { addDays, type CivilDate } from './time';

const paris = { latitude: 48.8566, longitude: 2.3522 };
const tunis = { latitude: 36.819, longitude: 10.166 };
const on: RiseSettings = { ...defaultRise, enabled: true };

function week(place: typeof paris, start: CivilDate, method: MethodId = 'mwl') {
  return Array.from({ length: 7 }, (_, i) =>
    prayerTimes(place, addDays(start, i), {
      method,
      asr: 'standard',
      highLatitude: 'auto',
    }),
  );
}

const minutes = (a: Date, b: Date) => (a.getTime() - b.getTime()) / 60_000;

describe('Fajr Rise times', () => {
  const day = week(tunis, { year: 2026, month: 10, day: 24 }, 'tunisia')[0]!;

  it('rings at Fajr, before Fajr, or before sunrise but never before Fajr', () => {
    expect(riseTime(day, { anchor: 'fajr', minutes: 0 })).toEqual(day.fajr);
    expect(minutes(day.fajr, riseTime(day, { anchor: 'before-fajr', minutes: 20 })!)).toBe(20);
    // Out-of-range minutes are kept within 1 to 60.
    expect(minutes(day.fajr, riseTime(day, { anchor: 'before-fajr', minutes: 600 })!)).toBe(60);
    expect(minutes(day.fajr, riseTime(day, { anchor: 'before-fajr', minutes: 0 })!)).toBe(1);
    expect(minutes(day.sunrise, riseTime(day, { anchor: 'before-sunrise', minutes: 30 })!)).toBe(
      30,
    );
    // Ninety minutes before sunrise is earlier than Fajr in Tunis in October: Fajr wins.
    expect(riseTime(day, { anchor: 'before-sunrise', minutes: 90 })).toEqual(day.fajr);
  });

  it('has no time on a day whose times could not be computed', () => {
    const broken: DayTimes = { ...day, fajr: new Date(Number.NaN) };
    expect(riseTime(broken, { anchor: 'fajr', minutes: 0 })).toBeNull();
    const now = new Date(day.fajr.getTime() - 60_000);
    expect(planRise({ now, days: [broken], settings: on })).toEqual([]);
  });

  it('plans each morning with its backups, soonest first, from now on', () => {
    const days = week(tunis, { year: 2026, month: 10, day: 24 }, 'tunisia');
    const now = new Date(days[0]!.fajr.getTime() - 60_000);
    const plan = planRise({ now, days, settings: on });
    expect(plan).toHaveLength(7 * (BACKUPS + 1));
    expect(plan[0]).toMatchObject({ id: '2026-10-24-rise-0', morning: '2026-10-24', backup: 0 });
    expect(plan[0]!.at).toEqual(days[0]!.fajr);
    expect(plan[0]!.sunrise).toEqual(days[0]!.sunrise);
    expect(minutes(plan[1]!.at, plan[0]!.at)).toBe(BACKUP_EVERY_MINUTES);
    expect(plan[BACKUPS]!.id).toBe(`2026-10-24-rise-${BACKUPS}`);
    expect(plan[BACKUPS + 1]!.id).toBe('2026-10-25-rise-0');
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i]!.at.getTime()).toBeGreaterThan(plan[i - 1]!.at.getTime());
    }
  });

  it('keeps the backups still to come while a morning is ringing', () => {
    const days = week(tunis, { year: 2026, month: 10, day: 24 }, 'tunisia');
    const now = new Date(days[0]!.fajr.getTime() + 5 * 60_000);
    const today = planRise({ now, days, settings: on }).filter((a) => a.morning === '2026-10-24');
    expect(today.map((a) => a.backup)).toEqual([3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('skips a finished morning and restarts a postponed one', () => {
    const days = week(tunis, { year: 2026, month: 10, day: 24 }, 'tunisia');
    const now = new Date(days[0]!.fajr.getTime() + 60_000);
    const again = new Date(days[0]!.fajr.getTime() + 7 * 60_000);
    const mornings = new Map<string, MorningState>([
      ['2026-10-24', { kind: 'restart', at: again }],
      ['2026-10-25', { kind: 'done' }],
    ]);
    const plan = planRise({ now, days, settings: on, mornings });
    expect(plan[0]).toMatchObject({ id: '2026-10-24-again-0', backup: 0, at: again });
    expect(plan.filter((a) => a.morning === '2026-10-24')).toHaveLength(BACKUPS + 1);
    expect(plan.some((a) => a.morning === '2026-10-25')).toBe(false);
    expect(plan.some((a) => a.morning === '2026-10-26')).toBe(true);
  });

  it('rings only on the chosen weekdays, and not at all when off', () => {
    const days = week(tunis, { year: 2026, month: 10, day: 24 }, 'tunisia');
    const now = new Date(Date.UTC(2026, 9, 23, 12));
    // 24 October 2026 is a Saturday (6); Sunday is 0.
    const weekend = planRise({ now, days, settings: { ...on, weekdays: [0, 6] } });
    expect([...new Set(weekend.map((a) => a.morning))]).toEqual(['2026-10-24', '2026-10-25']);
    expect(planRise({ now, days, settings: defaultRise })).toEqual([]);
    expect(planRise({ now, days, settings: { ...on, weekdays: [] } })).toEqual([]);
  });

  it('follows the clock change: Paris leaves summer time on 25 October 2026', () => {
    const days = week(paris, { year: 2026, month: 10, day: 24 });
    const now = new Date(Date.UTC(2026, 9, 23, 12));
    const mains = planRise({ now, days, settings: on }).filter((a) => a.backup === 0);
    const local = (d: Date) =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    // Fajr moves about an hour earlier on the wall clock, and each alarm still matches its Fajr.
    expect(mains.map((a) => a.at)).toEqual(days.map((d) => d.fajr));
    const before = Number(local(mains[0]!.at).slice(0, 2));
    const after = Number(local(mains[1]!.at).slice(0, 2));
    expect(before - after).toBe(1);
  });

  it('finds the next alarm, not a backup', () => {
    const days = week(tunis, { year: 2026, month: 10, day: 24 }, 'tunisia');
    const ringing = new Date(days[0]!.fajr.getTime() + 60_000);
    expect(nextRise({ now: ringing, days, settings: on })?.id).toBe('2026-10-25-rise-0');
    expect(nextRise({ now: ringing, days, settings: defaultRise })).toBeNull();
  });
});

/** A predictable stand-in for Math.random. */
function sequence(...values: number[]) {
  let i = 0;
  return () => values[i++ % values.length]!;
}

describe('Fajr Rise challenges', () => {
  it('makes sums at three levels whose answers add up', () => {
    const low = makeSum(1, sequence(0, 0.99));
    expect(low).toEqual({ parts: [11, '+', 9], answer: 20 });
    const add = makeSum(2, sequence(0, 0, 0.2));
    expect(add).toEqual({ parts: [21, '+', 12], answer: 33 });
    const subtract = makeSum(2, sequence(0, 0.99, 0.7));
    expect(subtract).toEqual({ parts: [49, '−', 21], answer: 28 });
    const high = makeSum(3, sequence(0.5, 0.5, 0.5));
    expect(high).toEqual({ parts: [6, '×', 13, '+', 35], answer: 113 });
    for (let i = 0; i < 200; i++) {
      for (const level of [1, 2, 3] as const) {
        const sum = makeSum(level);
        expect(sum.answer).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('lights stars in an order that never repeats a star twice in a row', () => {
    expect(starSequence(4, sequence(0.1, 0.1, 0.5, 0.5, 0.9))).toEqual([0, 4, 8, 0]);
    for (let i = 0; i < 100; i++) {
      const order = starSequence(5);
      expect(order).toHaveLength(5);
      for (let j = 1; j < order.length; j++) expect(order[j]).not.toBe(order[j - 1]);
      for (const star of order) expect(star).toBeLessThan(9);
    }
  });

  it('checks each tap on the stars, and a slip starts the order again', () => {
    const order = [2, 7, 4];
    expect(tapStar(order, 0, 2)).toEqual({ result: 'next', found: 1 });
    expect(tapStar(order, 1, 4)).toEqual({ result: 'slip', found: 0 });
    expect(tapStar(order, 2, 4)).toEqual({ result: 'done', found: 3 });
  });

  it('measures the knee angle from the legs it can see clearly', () => {
    const p = (x: number, y: number, confidence = 0.9) => ({ x, y, confidence });
    expect(jointAngle(p(0, 0), p(0, 1), p(0, 2))).toBeCloseTo(180);
    expect(jointAngle(p(0, 0), p(0, 1), p(1, 1))).toBeCloseTo(90);
    expect(jointAngle(p(1, 0), p(0, 0), p(-1, -0.0001))).toBeCloseTo(180, 1);
    // Across the -180°/180° seam the angle stays the small one.
    expect(jointAngle(p(-1, 0.001), p(0, 0), p(-1, -0.001))).toBeCloseTo(0.11, 1);
    const standing: Pose = { leftHip: p(0, 0), leftKnee: p(0, 1), leftAnkle: p(0, 2) };
    expect(kneeAngle(standing)).toBeCloseTo(180);
    const both: Pose = {
      ...standing,
      rightHip: p(0, 0),
      rightKnee: p(0, 1),
      rightAnkle: p(1, 1),
    };
    expect(kneeAngle(both)).toBeCloseTo(135);
    expect(kneeAngle({ ...standing, leftKnee: p(0, 1, 0.2) })).toBeNull();
    expect(kneeAngle({ leftHip: p(0, 0) })).toBeNull();
  });

  it('counts a squat on the way back up, and ignores frames without legs', () => {
    let state = startSquats;
    for (const angle of [175, 150, null, 95, 80, 120, null, 165, 170, 90, 170]) {
      state = squatStep(state, angle);
    }
    expect(state).toEqual({ phase: 'up', count: 2 });
  });

  it('counts firm shakes, at most one per moment', () => {
    let state = startShakes;
    const jolt = { x: 2.5, y: 0.5, z: 0.5 };
    const still = { x: 0, y: 0, z: 1 };
    state = shakeStep(state, still, 0);
    state = shakeStep(state, jolt, 100);
    state = shakeStep(state, jolt, 200);
    state = shakeStep(state, jolt, 400);
    expect(state).toEqual({ count: 2, lastAt: 400 });
  });

  it('matches the saved code for "Your spot"', () => {
    expect(spotMatches('4006381333931', ' 4006381333931\n')).toBe(true);
    expect(spotMatches('4006381333931', '5000159484695')).toBe(false);
    expect(spotMatches(null, '4006381333931')).toBe(false);
    expect(spotMatches('  ', '')).toBe(false);
    expect(newSpotCode(sequence(0, 0.99))).toBe('al-murshid-rise:0f0f0f0f0f0f0f0f');
    expect(newSpotCode()).toMatch(/^al-murshid-rise:[0-9a-f]{16}$/);
  });
});
