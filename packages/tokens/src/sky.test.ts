import { describe, expect, it } from 'vitest';
import {
  fromOklab,
  mixOklab,
  periodSun,
  prayerGlyph,
  prayers,
  sky,
  skyAt,
  skyPeriods,
  toOklab,
  type SunPosition,
} from './index';

const distance = (a: string, b: string) => {
  const [x, y] = [toOklab(a), toOklab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};

describe('oklab', () => {
  it('round-trips sRGB colors', () => {
    for (const stop of Object.values(sky)) {
      expect(fromOklab(toOklab(stop.top))).toBe(stop.top.toUpperCase());
      expect(fromOklab(toOklab(stop.bottom))).toBe(stop.bottom.toUpperCase());
    }
  });

  it('mixes from one color to the other', () => {
    expect(mixOklab('#0B1020', '#E9876B', 0)).toBe('#0B1020');
    expect(mixOklab('#0B1020', '#E9876B', 1)).toBe('#E9876B');
  });
});

describe('skyAt', () => {
  it('lands exactly on each period anchor', () => {
    for (const period of skyPeriods) {
      const state = skyAt(periodSun[period]);
      expect(state.period).toBe(period);
      expect(state.top).toBe(sky[period].top.toUpperCase());
      expect(state.bottom).toBe(sky[period].bottom.toUpperCase());
    }
  });

  it('changes continuously through a whole day: no jump between minutes', () => {
    const noonAltitude = 55;
    let previous: ReturnType<typeof skyAt> | null = null;
    // Sweep dawn to noon and noon to night in 0.25 degree steps.
    const path: SunPosition[] = [];
    for (let alt = -25; alt <= noonAltitude; alt += 0.25)
      path.push({ altitude: alt, noonAltitude, rising: true });
    for (let alt = noonAltitude; alt >= -25; alt -= 0.25)
      path.push({ altitude: alt, noonAltitude, rising: false });

    for (const sun of path) {
      const state = skyAt(sun);
      if (previous) {
        expect(distance(previous.top, state.top)).toBeLessThan(0.03);
        expect(distance(previous.bottom, state.bottom)).toBeLessThan(0.03);
        expect(Math.abs(previous.stars - state.stars)).toBeLessThan(0.1);
      }
      previous = state;
    }
  });

  it('shows stars only well below the horizon', () => {
    expect(skyAt({ altitude: -20, noonAltitude: 60, rising: false }).stars).toBe(1);
    expect(skyAt({ altitude: -20, noonAltitude: 60, rising: true }).stars).toBe(1);
    expect(skyAt({ altitude: -3, noonAltitude: 60, rising: false }).stars).toBe(0);
    expect(skyAt({ altitude: 10, noonAltitude: 60, rising: true }).stars).toBe(0);
  });

  it('dawn and dusk at the same altitude differ', () => {
    const dawn = skyAt({ altitude: 2, noonAltitude: 60, rising: true });
    const dusk = skyAt({ altitude: 2, noonAltitude: 60, rising: false });
    expect(distance(dawn.bottom, dusk.bottom)).toBeGreaterThan(0.05);
  });

  it('still reaches midday colors on a low winter or high-latitude arc', () => {
    expect(skyAt({ altitude: 12, noonAltitude: 12, rising: true }).period).toBe('dhuhr');
  });

  it('stays night through a polar night', () => {
    expect(skyAt({ altitude: -5, noonAltitude: -5, rising: true }).period).toBe('fajr');
    expect(skyAt({ altitude: -25, noonAltitude: -5, rising: false }).period).toBe('night');
  });
});

describe('prayer glyphs', () => {
  it('puts the sun on its arc, below the horizon only for Fajr and Isha', () => {
    for (const prayer of prayers) {
      const { sun } = prayerGlyph(prayer);
      expect(sun.filled).toBe(prayer !== 'fajr' && prayer !== 'isha');
      expect(sun.cx).toBeGreaterThanOrEqual(2);
      expect(sun.cx).toBeLessThanOrEqual(22);
    }
    expect(prayerGlyph('dhuhr').sun.cy).toBeLessThan(prayerGlyph('asr').sun.cy);
  });
});
