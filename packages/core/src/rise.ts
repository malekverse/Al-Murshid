// Fajr Rise (SPEC 5.10): when the alarm rings and when its backups follow, as plain data, and the
// challenges' checks as pure functions. The mobile app hands the plan to its fajr-rise native
// module; nothing here touches a platform. Plan: docs/PHASE-7B.md.

import type { DayTimes } from './prayer-times';
import { isoDate, weekday } from './time';

export const riseAnchors = ['fajr', 'before-fajr', 'before-sunrise'] as const;
/** At Fajr, some minutes before it, or some minutes before sunrise (never earlier than Fajr). */
export type RiseAnchor = (typeof riseAnchors)[number];

/** Aloud joins once the dua for waking is reviewed (docs/PHASE-7B.md). */
export const riseChallenges = ['mind', 'steps', 'spot', 'move', 'shake'] as const;
export type RiseChallenge = (typeof riseChallenges)[number];

export type MindGame = 'sums' | 'stars';
export type SumLevel = 1 | 2 | 3;

export interface RiseSettings {
  enabled: boolean;
  anchor: RiseAnchor;
  /** Minutes before Fajr or before sunrise, kept within RISE_RANGES; unused at Fajr. */
  minutes: number;
  /** The days it rings: 0 = Sunday ... 6 = Saturday, as `weekday`. */
  weekdays: readonly number[];
  /** The phone's alarm sound, or the app's soft tone (the adhan joins once its recordings arrive). */
  sound: 'alarm' | 'soft';
  challenge: RiseChallenge;
  steps: number;
  squats: number;
  mind: MindGame;
  level: SumLevel;
  /** The barcode or QR value saved for "Your spot", or null before one is scanned. */
  spotCode: string | null;
  /** Ask "Still up?" a few minutes after the challenge, and ring again if unanswered. */
  stillUp: boolean;
  /** Allow one short snooze each morning. Off by default (SPEC 5.10). */
  snooze: boolean;
}

export const RISE_RANGES = {
  beforeFajr: { min: 1, max: 60 },
  beforeSunrise: { min: 15, max: 90 },
  steps: { min: 20, max: 60 },
  squats: { min: 5, max: 20 },
} as const;

export const defaultRise: RiseSettings = {
  enabled: false,
  anchor: 'fajr',
  minutes: 15,
  weekdays: [0, 1, 2, 3, 4, 5, 6],
  sound: 'alarm',
  challenge: 'mind',
  steps: 30,
  squats: 10,
  mind: 'sums',
  level: 2,
  spotCode: null,
  stillUp: true,
  snooze: false,
};

/** Days of alarms kept scheduled; the plan is rebuilt with the reminders' plan. */
export const RISE_DAYS = 7;
/** Backups after each alarm, every BACKUP_EVERY_MINUTES, until the challenge is done. */
export const BACKUPS = 10;
export const BACKUP_EVERY_MINUTES = 2;
export const STILL_UP_AFTER_MINUTES = 5;
export const STILL_UP_ANSWER_MINUTES = 2;
export const SNOOZE_MINUTES = 5;
export const ESCAPE_HOLD_MS = 10_000;

const clamp = (value: number, { min, max }: { min: number; max: number }) =>
  Math.min(max, Math.max(min, Math.round(value)));

/** When the alarm rings on a day, or null if that day's times could not be computed. */
export function riseTime(day: DayTimes, settings: Pick<RiseSettings, 'anchor' | 'minutes'>) {
  const fajr = day.fajr.getTime();
  const sunrise = day.sunrise.getTime();
  if (Number.isNaN(fajr) || Number.isNaN(sunrise)) return null;
  switch (settings.anchor) {
    case 'fajr':
      return new Date(fajr);
    case 'before-fajr':
      return new Date(fajr - clamp(settings.minutes, RISE_RANGES.beforeFajr) * 60_000);
    case 'before-sunrise':
      return new Date(
        Math.max(fajr, sunrise - clamp(settings.minutes, RISE_RANGES.beforeSunrise) * 60_000),
      );
  }
}

/**
 * What already happened to a morning's alarm: `done` once the challenge was finished (and
 * "Still up?" answered) or the alarm was turned off; `restart` when its chain begins again later,
 * after a snooze or an unanswered "Still up?".
 */
export type MorningState = { kind: 'done' } | { kind: 'restart'; at: Date };

export interface PlannedRise {
  /** Stable while nothing changes, so rescheduling is idempotent: "2026-10-24-rise-0". */
  id: string;
  /** The morning it belongs to (its Fajr's date), shared by the alarm and its backups. */
  morning: string;
  at: Date;
  /** 0 for the alarm itself, 1 to BACKUPS for its backups. */
  backup: number;
  /** When Fajr ends that morning, shown once the person is up. */
  sunrise: Date;
}

export interface RisePlanInput {
  now: Date;
  /** Prayer times for consecutive days starting today (RISE_DAYS of them). */
  days: readonly DayTimes[];
  settings: RiseSettings;
  /** Mornings whose alarm was finished, turned off or postponed, by ISO date. */
  mornings?: ReadonlyMap<string, MorningState>;
}

function chain(morning: string, start: Date, sunrise: Date, tag: string): PlannedRise[] {
  return Array.from({ length: BACKUPS + 1 }, (_, backup) => ({
    id: `${morning}-${tag}-${backup}`,
    morning,
    at: new Date(start.getTime() + backup * BACKUP_EVERY_MINUTES * 60_000),
    backup,
    sunrise,
  }));
}

/** Every alarm and backup to keep scheduled, soonest first. */
export function planRise({ now, days, settings, mornings = new Map() }: RisePlanInput) {
  if (!settings.enabled) return [];
  const plan: PlannedRise[] = [];
  for (const day of days) {
    if (!settings.weekdays.includes(weekday(day.date))) continue;
    const at = riseTime(day, settings);
    if (!at) continue;
    const morning = isoDate(day.date);
    const state = mornings.get(morning);
    if (state?.kind === 'done') continue;
    plan.push(
      ...(state?.kind === 'restart'
        ? chain(morning, state.at, day.sunrise, 'again')
        : chain(morning, at, day.sunrise, 'rise')),
    );
  }
  return plan
    .filter((alarm) => alarm.at.getTime() > now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** The next time the alarm will ring, for Today's Fajr row and the setup screen. */
export function nextRise(input: RisePlanInput): PlannedRise | null {
  return planRise(input).find((alarm) => alarm.backup === 0) ?? null;
}

// ---------------------------------------------------------------------------------------------
// Challenges. Each check is a pure step function, so the screens stay thin and the rules are
// tested here. `random` is injectable for tests.

export type SumPart = number | '+' | '−' | '×';

export interface Sum {
  parts: SumPart[];
  answer: number;
}

export const SUMS_PER_ROUND = 3;

const between = (random: () => number, min: number, max: number) =>
  min + Math.floor(random() * (max - min + 1));

/**
 * One sum at a level: 1 adds a single digit to a two-digit number, 2 adds or subtracts two
 * two-digit numbers, 3 multiplies and then adds. Answers are never negative.
 */
export function makeSum(level: SumLevel, random: () => number = Math.random): Sum {
  if (level === 1) {
    const a = between(random, 11, 49);
    const b = between(random, 3, 9);
    return { parts: [a, '+', b], answer: a + b };
  }
  if (level === 2) {
    const a = between(random, 21, 89);
    const b = between(random, 12, 49);
    return random() < 0.5
      ? { parts: [a, '+', b], answer: a + b }
      : { parts: [Math.max(a, b), '−', Math.min(a, b)], answer: Math.abs(a - b) };
  }
  const a = between(random, 3, 9);
  const b = between(random, 6, 19);
  const c = between(random, 11, 59);
  return { parts: [a, '×', b, '+', c], answer: a * b + c };
}

/** The stars light in this order, never the same star twice in a row. */
export const STAR_FIELD = 9;
export const STAR_ROUNDS = [4, 5] as const;

export function starSequence(length: number, random: () => number = Math.random): number[] {
  const sequence: number[] = [];
  while (sequence.length < length) {
    const star = Math.floor(random() * STAR_FIELD);
    if (star !== sequence.at(-1)) sequence.push(star);
  }
  return sequence;
}

/** A tap while repeating the order: the next one to find, a slip (start again), or done. */
export function tapStar(sequence: readonly number[], found: number, star: number) {
  if (sequence[found] !== star) return { result: 'slip' as const, found: 0 };
  const next = found + 1;
  return next === sequence.length
    ? { result: 'done' as const, found: next }
    : { result: 'next' as const, found: next };
}

export interface Point {
  x: number;
  y: number;
  /** 0 to 1, from the pose detector. */
  confidence: number;
}

/** The angle at b, in degrees, between the segments to a and c. */
export function jointAngle(a: Point, b: Point, c: Point): number {
  const ab = Math.atan2(a.y - b.y, a.x - b.x);
  const cb = Math.atan2(c.y - b.y, c.x - b.x);
  const degrees = Math.abs(((ab - cb) * 180) / Math.PI);
  return degrees > 180 ? 360 - degrees : degrees;
}

export interface Pose {
  leftHip?: Point;
  leftKnee?: Point;
  leftAnkle?: Point;
  rightHip?: Point;
  rightKnee?: Point;
  rightAnkle?: Point;
}

export const POSE_CONFIDENCE = 0.5;

/** The knee angle from whichever legs are clearly seen (the mean of both), or null. */
export function kneeAngle(pose: Pose): number | null {
  const angles = (['left', 'right'] as const).flatMap((side) => {
    const hip = pose[`${side}Hip`];
    const knee = pose[`${side}Knee`];
    const ankle = pose[`${side}Ankle`];
    if (!hip || !knee || !ankle) return [];
    if (Math.min(hip.confidence, knee.confidence, ankle.confidence) < POSE_CONFIDENCE) return [];
    return [jointAngle(hip, knee, ankle)];
  });
  return angles.length ? angles.reduce((sum, a) => sum + a, 0) / angles.length : null;
}

/** A squat counts when the knees bend below DOWN and straighten past UP again. */
export const SQUAT_DOWN = 100;
export const SQUAT_UP = 160;

export interface SquatState {
  phase: 'up' | 'down';
  count: number;
}

export const startSquats: SquatState = { phase: 'up', count: 0 };

export function squatStep(state: SquatState, angle: number | null): SquatState {
  if (angle === null) return state;
  if (state.phase === 'up' && angle < SQUAT_DOWN) return { ...state, phase: 'down' };
  if (state.phase === 'down' && angle > SQUAT_UP) return { phase: 'up', count: state.count + 1 };
  return state;
}

/** A shake is a jolt above SHAKE_G (in g, gravity included), at most one per SHAKE_GAP_MS. */
export const SHAKES = 15;
export const SHAKE_G = 2.2;
export const SHAKE_GAP_MS = 250;

export interface ShakeState {
  count: number;
  /** When the last shake counted, in ms, or null before the first. */
  lastAt: number | null;
}

export const startShakes: ShakeState = { count: 0, lastAt: null };

export function shakeStep(
  state: ShakeState,
  sample: { x: number; y: number; z: number },
  at: number,
): ShakeState {
  const g = Math.hypot(sample.x, sample.y, sample.z);
  if (g < SHAKE_G) return state;
  if (state.lastAt !== null && at - state.lastAt < SHAKE_GAP_MS) return state;
  return { count: state.count + 1, lastAt: at };
}

/** A scanned code matches the one saved for "Your spot" (spaces around it ignored). */
export function spotMatches(saved: string | null, scanned: string): boolean {
  return saved !== null && saved.trim() !== '' && saved.trim() === scanned.trim();
}

/** A random value for the printable "Your spot" card. */
export function newSpotCode(random: () => number = Math.random): string {
  const hex = Array.from({ length: 16 }, () => Math.floor(random() * 16).toString(16)).join('');
  return `al-murshid-rise:${hex}`;
}
