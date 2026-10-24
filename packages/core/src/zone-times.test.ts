import { describe, expect, it } from 'vitest';
import { prayerTimes } from './prayer-times';
import { addDays } from './time';
import { encodeZoneTimes, zoneDay } from './zone-times';

const tunis = { latitude: 36.819, longitude: 10.166 };
const settings = { method: 'tunisia', asr: 'standard', highLatitude: 'auto' } as const;
const first = { year: 2026, month: 10, day: 21 };
const days = [0, 1, 2].map((n) => prayerTimes(tunis, addDays(first, n), settings));

describe('times computed ahead', () => {
  it('gives each day back as it was computed, to the minute', () => {
    const table = encodeZoneTimes(days);
    expect(table.from).toBe('2026-10-21');
    expect(table.days).toHaveLength(3);
    const back = zoneDay(table, addDays(first, 1));
    const day = days[1]!;
    expect(back).toEqual({
      ...day,
      fajr: new Date(Math.round(day.fajr.getTime() / 60_000) * 60_000),
      sunrise: new Date(Math.round(day.sunrise.getTime() / 60_000) * 60_000),
      dhuhr: new Date(Math.round(day.dhuhr.getTime() / 60_000) * 60_000),
      asr: new Date(Math.round(day.asr.getTime() / 60_000) * 60_000),
      maghrib: new Date(Math.round(day.maghrib.getTime() / 60_000) * 60_000),
      isha: new Date(Math.round(day.isha.getTime() / 60_000) * 60_000),
    });
  });

  it('marks Friday', () => {
    // 2026-10-23 is a Friday.
    expect(zoneDay(encodeZoneTimes(days), addDays(first, 2))?.jumuah).toBe(true);
    expect(zoneDay(encodeZoneTimes(days), first)?.jumuah).toBe(false);
  });

  it('has nothing before or past the table, or in a damaged row', () => {
    const table = encodeZoneTimes(days);
    expect(zoneDay(table, addDays(first, -1))).toBeNull();
    expect(zoneDay(table, addDays(first, 3))).toBeNull();
    expect(zoneDay({ ...table, days: [[1, 2, 3]] }, first)).toBeNull();
  });

  it('needs at least one day', () => {
    expect(() => encodeZoneTimes([])).toThrow();
  });
});
