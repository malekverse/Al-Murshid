import { describe, expect, it } from 'vitest';
import { distanceKm, hasMovedFar, initialBearing, KAABA, roundForSync } from './geo';
import { defaultSettings, prayerTimes } from './prayer-times';
import { distanceToMakkah, isAligned, qiblaBearing, qiblaOffset, smoothHeading } from './qibla';
import { sunAltitude, sunPosition } from './sun';

const places = {
  tunis: { latitude: 36.8065, longitude: 10.1815 },
  london: { latitude: 51.5074, longitude: -0.1278 },
  newYork: { latitude: 40.7128, longitude: -74.006 },
  jakarta: { latitude: -6.2088, longitude: 106.8456 },
  sydney: { latitude: -33.8688, longitude: 151.2093 },
  oslo: { latitude: 59.9139, longitude: 10.7522 },
};

describe('sun position, checked against adhan-js event times', () => {
  const dates = [
    { year: 2026, month: 1, day: 15 },
    { year: 2026, month: 6, day: 21 },
    { year: 2026, month: 9, day: 23 },
  ];
  for (const [name, place] of Object.entries(places)) {
    for (const date of dates) {
      it(`${name} ${date.month}/${date.day}`, () => {
        const t = prayerTimes(place, date, {
          ...defaultSettings,
          method: 'mwl',
          highLatitude: 'twilight-angle',
        });
        // Sunrise is defined at -0.833° (refraction and the sun's radius).
        expect(sunAltitude(t.sunrise, place)).toBeCloseTo(-0.833, 0);
        // Dhuhr is a minute after the meridian: the sun is at its highest, and no longer rising.
        const noon = sunPosition(t.dhuhr, place);
        expect(Math.abs(noon.altitude - noon.noonAltitude)).toBeLessThan(0.3);
        expect(sunPosition(new Date(t.dhuhr.getTime() - 60 * 60_000), place).rising).toBe(true);
        expect(sunPosition(new Date(t.dhuhr.getTime() + 60 * 60_000), place).rising).toBe(false);
      });
    }
  }

  it('puts the sun 18° below the horizon at MWL Fajr where twilight is defined', () => {
    const t = prayerTimes(
      places.tunis,
      { year: 2026, month: 1, day: 15 },
      { ...defaultSettings, method: 'mwl' },
    );
    // Fajr is rounded to the minute: within a quarter degree.
    expect(Math.abs(sunAltitude(t.fajr, places.tunis) + 18)).toBeLessThan(0.3);
  });
});

describe('qibla', () => {
  it('matches an independent great-circle bearing', () => {
    for (const place of Object.values(places)) {
      expect(Math.abs(qiblaBearing(place) - initialBearing(place, KAABA))).toBeLessThan(0.05);
    }
  });

  it('matches well-known bearings', () => {
    expect(qiblaBearing(places.london)).toBeCloseTo(118.99, 1);
    expect(qiblaBearing(places.newYork)).toBeCloseTo(58.48, 1);
    expect(qiblaBearing(places.sydney)).toBeCloseTo(277.5, 0);
  });

  it('measures the distance to Makkah', () => {
    expect(distanceToMakkah(KAABA)).toBeCloseTo(0, 5);
    // Tunis to Makkah is about 3,330 km along the great circle.
    expect(distanceToMakkah(places.tunis)).toBeGreaterThan(3300);
    expect(distanceToMakkah(places.tunis)).toBeLessThan(3360);
  });

  it('turns a heading into a signed offset and an aligned state (±3°)', () => {
    expect(qiblaOffset(110, 112)).toBeCloseTo(2);
    expect(qiblaOffset(350, 10)).toBeCloseTo(20);
    expect(qiblaOffset(10, 350)).toBeCloseTo(-20);
    expect(isAligned(110, 112.5)).toBe(true);
    expect(isAligned(100, 112.5)).toBe(false);
  });

  it('smooths the heading around north without swinging through 180°', () => {
    const smoothed = smoothHeading(359, 1, 0.5);
    expect(smoothed < 1 || smoothed > 359).toBe(true);
    expect(smoothHeading(100, 120, 0.25)).toBeCloseTo(105);
  });
});

describe('geo', () => {
  it('rounds coordinates to about 1 km before they leave the device', () => {
    expect(roundForSync({ latitude: 36.806495, longitude: 10.181532 })).toEqual({
      latitude: 36.81,
      longitude: 10.18,
    });
  });

  it('notices a move of more than 50 km, not a walk across town', () => {
    const lyon = { latitude: 45.764, longitude: 4.8357 };
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    expect(hasMovedFar(paris, lyon)).toBe(true);
    expect(hasMovedFar(paris, { latitude: 48.86, longitude: 2.36 })).toBe(false);
    expect(distanceKm(paris, lyon)).toBeGreaterThan(380);
  });
});
