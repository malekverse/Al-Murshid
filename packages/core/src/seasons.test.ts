import { describe, expect, it } from 'vitest';
import { fromHijri } from './hijri';
import { defaultSettings, prayerTimes } from './prayer-times';
import { dhulHijjahState, ramadanState } from './seasons';
import { addDays, isoDate, type CivilDate } from './time';

const tunis = { latitude: 36.8065, longitude: 10.1815 };
const settings = { ...defaultSettings, method: 'tunisia' as const };
const times = (d: CivilDate) => prayerTimes(tunis, d, settings);
const at = (d: CivilDate, minutes: number, from: 'fajr' | 'maghrib' | 'isha' | 'dhuhr') =>
  new Date(times(d)[from].getTime() + minutes * 60_000);
const state = (now: Date, today: CivilDate, offset: -2 | -1 | 0 | 1 | 2 = 0) =>
  ramadanState(now, today, times(today), times(addDays(today, 1)), offset);

const r1 = fromHijri({ year: 1448, month: 9, day: 1 });
const eve = addDays(r1, -1);
const r20 = fromHijri({ year: 1448, month: 9, day: 20 });
const shawwal1 = fromHijri({ year: 1448, month: 10, day: 1 });
const last = addDays(shawwal1, -1);

describe('Ramadan', () => {
  it('is not there on the day before it', () => {
    expect(state(at(eve, 0, 'dhuhr'), eve)).toBeNull();
    expect(state(at(eve, -60, 'fajr'), eve)).toBeNull();
  });

  it('begins at Maghrib on its eve: suhoor until the first Fajr, then the first Taraweeh', () => {
    const s = state(at(eve, 10, 'maghrib'), eve)!;
    expect(s.fast).toEqual({ date: r1, day: 1 });
    expect(s.countdown).toEqual({ kind: 'suhoor', until: times(r1).fajr });
    expect(s.today).toBeNull();
    expect(s.taraweehDate).toBeNull();
    expect(state(at(eve, 30, 'isha'), eve)!.taraweehDate).toEqual(eve);
  });

  it('before Fajr: suhoor, and the night still belongs to the evening before', () => {
    const s = state(at(r1, -60, 'fajr'), r1)!;
    expect(s.countdown).toEqual({ kind: 'suhoor', until: times(r1).fajr });
    expect(s.taraweehDate).toEqual(eve);
    expect(s.today).toEqual({ date: r1, day: 1 });
  });

  it('during the day: iftar at Maghrib and the day’s juz', () => {
    const s = state(at(r1, 0, 'dhuhr'), r1)!;
    expect(s.countdown).toEqual({ kind: 'iftar', at: times(r1).maghrib });
    expect(s).toMatchObject({ juz: 1, lastTenNights: false, taraweehDate: null });
  });

  it('the last ten nights begin at Maghrib on the 20th', () => {
    expect(state(at(r20, 0, 'dhuhr'), r20)!.lastTenNights).toBe(false);
    const s = state(at(r20, 5, 'maghrib'), r20)!;
    expect(s).toMatchObject({ lastTenNights: true, juz: 21, fast: { day: 21 } });
  });

  it('after the last iftar: no fast ahead, but today’s fast can still be logged', () => {
    const s = state(at(last, 10, 'maghrib'), last)!;
    expect(s.fast).toBeNull();
    expect(s.countdown).toBeNull();
    expect(s.juz).toBeNull();
    expect(s.lastTenNights).toBe(false);
    expect(isoDate(s.today!.date)).toBe(isoDate(last));
    // Eid's night: no Taraweeh.
    expect(state(at(last, 30, 'isha'), last)!.taraweehDate).toBeNull();
  });

  it('is over on the morning of Eid', () => {
    expect(state(at(shawwal1, -60, 'fajr'), shawwal1)).toBeNull();
  });

  it('follows the person’s Hijri offset', () => {
    // With the month a day later, the first day of Ramadan is still Sha'ban.
    expect(state(at(r1, 0, 'dhuhr'), r1, -1)?.today ?? null).toBeNull();
  });
});

describe('Dhul Hijjah', () => {
  it('marks its first nine days, and Arafah on the eighth and ninth', () => {
    const day = (n: number) => fromHijri({ year: 1448, month: 12, day: n });
    expect(dhulHijjahState(day(1))).toEqual({ day: 1, arafah: null });
    expect(dhulHijjahState(day(8))).toEqual({ day: 8, arafah: 'tomorrow' });
    expect(dhulHijjahState(day(9))).toEqual({ day: 9, arafah: 'today' });
    expect(dhulHijjahState(day(10))).toBeNull();
    expect(dhulHijjahState(r1)).toBeNull();
  });
});
