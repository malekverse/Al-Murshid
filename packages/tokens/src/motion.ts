// Motion tokens (SPEC 6.4). Motion explains, confirms and calms; it never decorates
// reading content and never touches Quran text.

/** Durations in milliseconds. */
export const duration = {
  instant: 100,
  quick: 200,
  standard: 300,
  gentle: 500,
  ambient: 1200,
} as const;
export type DurationName = keyof typeof duration;

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export const spring = {
  /** Presses, counters. */
  snappy: { stiffness: 400, damping: 30, mass: 1 },
  /** Sheets, cards, shared elements. */
  gentle: { stiffness: 170, damping: 26, mass: 1 },
  /** Celebration lights, Qibla ring. */
  soft: { stiffness: 100, damping: 20, mass: 1 },
} as const satisfies Record<string, SpringConfig>;
export type SpringName = keyof typeof spring;

/** Cubic-bezier control points. */
export const easing = {
  standard: [0.2, 0, 0, 1],
  exit: [0.3, 0, 1, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;
export type EasingName = keyof typeof easing;

export function cubicBezierCss(name: EasingName): string {
  return `cubic-bezier(${easing[name].join(', ')})`;
}

/** Signature values used by components. */
export const motion = {
  /** Every pressable scales to this on press, then springs back. */
  pressScale: 0.97,
  /** Screen behind a sheet. */
  sheetBackdropScale: 0.96,
  /** Tab switch slide distance in the reading direction (px). */
  tabSlide: 8,
  /** Staggered list enter: delay per item and how many items get it. */
  staggerStep: 30,
  staggerMax: 8,
  /** "I prayed" light rising into the sky. */
  prayerLightRise: 800,
} as const;
