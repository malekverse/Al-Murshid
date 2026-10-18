// The living sky (SPEC 5.1, 6.1). Anchor stops per period, and skyAt(), which blends them
// continuously from the real sun altitude. The altitude itself comes from packages/core.

import { mixOklab } from './oklab';

export const skyPeriods = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'night'] as const;
export type SkyPeriod = (typeof skyPeriods)[number];

export interface SkyStop {
  top: string;
  bottom: string;
}

export const sky: Record<SkyPeriod, SkyStop> = {
  fajr: { top: '#1E2A4A', bottom: '#C98B8B' },
  sunrise: { top: '#F4C79A', bottom: '#A9C7E3' },
  dhuhr: { top: '#6FA8DC', bottom: '#E8F1FA' },
  asr: { top: '#8DB4D9', bottom: '#F2D49B' },
  maghrib: { top: '#3B2D5C', bottom: '#E9876B' },
  night: { top: '#0B1020', bottom: '#1C2541' },
};

/** Color of stars and the faint horizon line drawn over the sky. */
export const starlight = '#F7F4EE';

export interface SunPosition {
  /** Sun altitude above the horizon in degrees (negative below it). */
  altitude: number;
  /** Today's highest altitude (solar noon). Low in winter and at high latitudes. */
  noonAltitude: number;
  /** True before solar noon. The same altitude looks different at dawn and at dusk. */
  rising: boolean;
}

export interface SkyState extends SkyStop {
  /** 0 (no stars) to 1 (full night). Stars fade in after Isha and out before Fajr. */
  stars: number;
  /** The period this moment is closest to, for a static sky when Reduce Motion is on. */
  period: SkyPeriod;
}

// The sun's path as one axis: below the horizon in degrees, above it as a share of today's
// noon altitude (0 at the horizon, 60 at noon). Winter days and high latitudes still pass
// through every color, just over a lower arc.
const NOON = 60;

type Stop = readonly [position: number, period: SkyPeriod];

const morning: readonly Stop[] = [
  [-18, 'night'],
  [-10, 'fajr'],
  [-5, 'fajr'],
  [5, 'sunrise'],
  [14, 'sunrise'],
  [32, 'dhuhr'],
  [NOON, 'dhuhr'],
];

const evening: readonly Stop[] = [
  [NOON, 'dhuhr'],
  [42, 'dhuhr'],
  [26, 'asr'],
  [9, 'asr'],
  [1, 'maghrib'],
  [-4, 'maghrib'],
  [-13, 'night'],
];

function axis({ altitude, noonAltitude }: SunPosition): number {
  if (altitude <= 0) return altitude;
  return Math.min(NOON, (altitude / Math.max(noonAltitude, 0.5)) * NOON);
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export function skyAt(sun: SunPosition): SkyState {
  const x = axis(sun);
  // Stops ordered from low to high on the axis.
  const stops = sun.rising ? morning : [...evening].reverse();

  let from: Stop = stops[0]!;
  let to: Stop = stops[stops.length - 1]!;
  if (x <= from[0]) to = from;
  else if (x >= to[0]) from = to;
  else {
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i]!;
      const b = stops[i + 1]!;
      if (x >= a[0] && x <= b[0]) {
        from = a;
        to = b;
        break;
      }
    }
  }

  const span = to[0] - from[0];
  const t = span === 0 ? 0 : smooth(clamp01((x - from[0]) / span));
  const a = sky[from[1]];
  const b = sky[to[1]];

  // Stars: fade in from -6° to -15° in the evening, out from -12° to -5° at dawn.
  const stars = sun.rising
    ? smooth(clamp01((-5 - sun.altitude) / 7))
    : smooth(clamp01((-6 - sun.altitude) / 9));

  return {
    top: mixOklab(a.top, b.top, t),
    bottom: mixOklab(a.bottom, b.bottom, t),
    stars,
    period: t < 0.5 ? from[1] : to[1],
  };
}

/** A representative sun position for each period, for previews and Reduce Motion. */
export const periodSun: Record<SkyPeriod, SunPosition> = {
  fajr: { altitude: -6, noonAltitude: 60, rising: true },
  sunrise: { altitude: 8, noonAltitude: 60, rising: true },
  dhuhr: { altitude: 60, noonAltitude: 60, rising: true },
  asr: { altitude: 25, noonAltitude: 60, rising: false },
  maghrib: { altitude: -1, noonAltitude: 60, rising: false },
  night: { altitude: -30, noonAltitude: 60, rising: false },
};
