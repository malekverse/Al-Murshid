import { CalculationMethod } from 'adhan';
import { describe, expect, it } from 'vitest';
import reference from '../fixtures/reference-times.json';
import { defaultMethodFor, methods, type MethodId } from './methods';
import {
  defaultSettings,
  prayerState,
  prayerTimes,
  timeNames,
  type DayTimes,
} from './prayer-times';
import { cities } from './reference-cities';
import { sunAltitude } from './sun';
import { addDays, parseIsoDate } from './time';

const byName = new Map(cities.map((c) => [c.name, c]));
const hm = (d: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(d);

describe('accuracy against an independent implementation (SPEC 11)', () => {
  it('covers 20+ cities, high latitudes and DST days', () => {
    const names = new Set(reference.entries.map((e) => e.city));
    expect(names.size).toBeGreaterThanOrEqual(20);
    expect([...names].some((n) => byName.get(n)!.latitude > 59)).toBe(true);
    expect(reference.entries.some((e) => e.date === '2026-03-29' || e.date === '2026-03-08')).toBe(
      true,
    );
  });

  // Aladhan stamps a time that falls after midnight (Isha in a French June, Maghrib in an
  // Icelandic one) with the requested date, so compare clock times modulo one day. adhan rounds
  // to the minute but keeps stray milliseconds, so compare whole minutes.
  const minutesApart = (a: Date, b: Date) => {
    const d = ((Math.round((a.getTime() - b.getTime()) / 60_000) % 1440) + 1440) % 1440;
    return Math.min(d, 1440 - d);
  };
  // The Moonsighting Committee's seasonal Fajr and Isha are a formula two implementations
  // round slightly differently; allow 3 minutes there (docs/DECISIONS.md).
  const tolerance = (method: MethodId, name: string) =>
    method === 'moonsighting' && (name === 'fajr' || name === 'isha') ? 3 : 1;

  for (const entry of reference.entries) {
    const city = byName.get(entry.city)!;
    it(`${entry.city} ${entry.date} (${city.method}) is within 1 minute`, () => {
      const times = prayerTimes(city, parseIsoDate(entry.date), {
        ...defaultSettings,
        method: city.method,
      });
      // Asr is checked against its physical definition below: Aladhan's Asr drifts in winter.
      for (const name of timeNames.filter((n) => n !== 'asr')) {
        const apart = minutesApart(times[name], new Date(entry.times[name]));
        expect(
          apart,
          `${name}: ${hm(times[name], city.timeZone)} vs ${entry.times[name]}`,
        ).toBeLessThanOrEqual(tolerance(city.method, name));
      }
    });
  }
});

describe('Asr against its definition: shadow = object + noon shadow (SPEC 11)', () => {
  const rad = (d: number) => (d * Math.PI) / 180;
  const deg = (r: number) => (r * 180) / Math.PI;
  // Shadows follow the apparent sun, so include atmospheric refraction (Saemundsson).
  const apparent = (h: number) => h + 1.02 / Math.tan(rad(h + 10.3 / (h + 5.11))) / 60;

  for (const entry of reference.entries) {
    const city = byName.get(entry.city)!;
    it(`${entry.city} ${entry.date}`, () => {
      const times = prayerTimes(city, parseIsoDate(entry.date), {
        ...defaultSettings,
        method: city.method,
      });
      const at = (ms: number) => apparent(sunAltitude(new Date(ms), city));
      let noon = times.dhuhr.getTime();
      let highest = -90;
      for (let s = -3600; s <= 3600; s += 5) {
        const a = at(times.dhuhr.getTime() + s * 1000);
        if (a > highest) [highest, noon] = [a, times.dhuhr.getTime() + s * 1000];
      }
      const target = deg(Math.atan(1 / (1 + Math.tan(rad(90 - highest)))));
      let asr = noon;
      while (at(asr) > target) asr += 5_000;
      const def = methods[city.method];
      const added =
        (def.adhan ? CalculationMethod[def.adhan]().methodAdjustments.asr : 0) +
        (def.minutes?.asr ?? 0);
      asr += added * 60_000;
      // adhan uses the noon declination and rounds to the minute: within 2 minutes, and 5 where
      // the winter sun is so low (above 55°) that seconds of arc move Asr by minutes.
      const limit = Math.abs(city.latitude) > 55 ? 5 : 2;
      expect(Math.abs(times.asr.getTime() - asr) / 60_000).toBeLessThanOrEqual(limit);
    });
  }
});

describe('prayerTimes', () => {
  const tunis = { latitude: 36.8065, longitude: 10.1815 };

  it('returns the six times in order for an ordinary day', () => {
    const t = prayerTimes(
      tunis,
      { year: 2026, month: 10, day: 18 },
      { ...defaultSettings, method: 'tunisia' },
    );
    const order = timeNames.map((n) => t[n].getTime());
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('keeps local clock times continuous across a DST change', () => {
    const paris = byName.get('Paris')!;
    const before = prayerTimes(
      paris,
      { year: 2026, month: 3, day: 28 },
      { ...defaultSettings, method: 'mwl' },
    );
    const after = prayerTimes(
      paris,
      { year: 2026, month: 3, day: 29 },
      { ...defaultSettings, method: 'mwl' },
    );
    // Clocks jump forward one hour on the 29th: Dhuhr moves from ~13:xx to ~14:xx local.
    expect(
      Number(hm(after.dhuhr, paris.timeZone).slice(0, 2)) -
        Number(hm(before.dhuhr, paris.timeZone).slice(0, 2)),
    ).toBe(1);
    // In absolute time, solar noon barely moves.
    expect(Math.abs(after.dhuhr.getTime() - before.dhuhr.getTime() - 86_400_000)).toBeLessThan(
      60_000 * 2,
    );
  });

  it('still gives every time inside the Arctic summer (polar resolution)', () => {
    const tromso = { latitude: 69.6492, longitude: 18.9553 };
    const t = prayerTimes(
      tromso,
      { year: 2026, month: 6, day: 21 },
      { ...defaultSettings, method: 'mwl' },
    );
    for (const name of timeNames) expect(Number.isNaN(t[name].getTime()), name).toBe(false);
  });

  it('applies the automatic high-latitude rule above 48°', () => {
    const oslo = byName.get('Oslo')!;
    const date = { year: 2026, month: 6, day: 21 };
    const auto = prayerTimes(oslo, date, { ...defaultSettings, method: 'mwl' });
    const seventh = prayerTimes(oslo, date, {
      ...defaultSettings,
      method: 'mwl',
      highLatitude: 'seventh-of-the-night',
    });
    expect(auto.isha.getTime()).toBe(seventh.isha.getTime());
    const middle = prayerTimes(oslo, date, {
      ...defaultSettings,
      method: 'mwl',
      highLatitude: 'middle-of-the-night',
    });
    expect(middle.isha.getTime()).not.toBe(seventh.isha.getTime());
  });

  it('sets Isha 120 minutes after Maghrib in Ramadan with Umm al-Qura, 90 otherwise', () => {
    const makkah = byName.get('Makkah')!;
    const ramadan = prayerTimes(
      makkah,
      { year: 2026, month: 3, day: 1 },
      { ...defaultSettings, method: 'umm-al-qura' },
    );
    expect((ramadan.isha.getTime() - ramadan.maghrib.getTime()) / 60_000).toBe(120);
    const ordinary = prayerTimes(
      makkah,
      { year: 2026, month: 6, day: 21 },
      { ...defaultSettings, method: 'umm-al-qura' },
    );
    expect((ordinary.isha.getTime() - ordinary.maghrib.getTime()) / 60_000).toBe(90);
  });

  it('adds Hanafi Asr later than standard Asr', () => {
    const date = { year: 2026, month: 10, day: 18 };
    const standard = prayerTimes(tunis, date, { ...defaultSettings, method: 'tunisia' });
    const hanafi = prayerTimes(tunis, date, {
      ...defaultSettings,
      method: 'tunisia',
      asr: 'hanafi',
    });
    expect(hanafi.asr.getTime()).toBeGreaterThan(standard.asr.getTime());
  });

  it('applies per-prayer minute adjustments', () => {
    const date = { year: 2026, month: 10, day: 18 };
    const base = prayerTimes(tunis, date, { ...defaultSettings, method: 'tunisia' });
    const tuned = prayerTimes(tunis, date, {
      ...defaultSettings,
      method: 'tunisia',
      adjustments: { maghrib: 3, fajr: -2 },
    });
    expect((tuned.maghrib.getTime() - base.maghrib.getTime()) / 60_000).toBe(3);
    expect((tuned.fajr.getTime() - base.fajr.getTime()) / 60_000).toBe(-2);
  });

  it("marks Friday so Dhuhr can read Jumu'ah", () => {
    expect(
      prayerTimes(
        tunis,
        { year: 2026, month: 10, day: 16 },
        { ...defaultSettings, method: 'tunisia' },
      ).jumuah,
    ).toBe(true);
    expect(
      prayerTimes(
        tunis,
        { year: 2026, month: 10, day: 18 },
        { ...defaultSettings, method: 'tunisia' },
      ).jumuah,
    ).toBe(false);
  });

  it('uses Jordan’s 5-minute Maghrib delay', () => {
    const amman = byName.get('Amman')!;
    const t = prayerTimes(
      amman,
      { year: 2026, month: 6, day: 21 },
      { ...defaultSettings, method: 'jordan' },
    );
    const sunsetLike = prayerTimes(
      amman,
      { year: 2026, month: 6, day: 21 },
      { ...defaultSettings, method: 'mwl' },
    );
    expect(Math.round((t.maghrib.getTime() - sunsetLike.maghrib.getTime()) / 60_000)).toBe(5);
  });

  it('uses a fixed Isha interval for the Gulf method', () => {
    const manama = { latitude: 26.2235, longitude: 50.5876 };
    const t = prayerTimes(
      manama,
      { year: 2026, month: 10, day: 18 },
      { ...defaultSettings, method: 'gulf' },
    );
    expect((t.isha.getTime() - t.maghrib.getTime()) / 60_000).toBe(90);
  });

  it('adds Morocco’s 5 minutes to Dhuhr and Maghrib', () => {
    const casablanca = byName.get('Casablanca')!;
    const date = { year: 2026, month: 10, day: 18 };
    const morocco = prayerTimes(casablanca, date, { ...defaultSettings, method: 'morocco' });
    const plain = prayerTimes(casablanca, date, {
      ...defaultSettings,
      method: 'morocco',
      adjustments: { dhuhr: -5, maghrib: -5 },
    });
    expect((morocco.dhuhr.getTime() - plain.dhuhr.getTime()) / 60_000).toBe(5);
    expect((morocco.maghrib.getTime() - plain.maghrib.getTime()) / 60_000).toBe(5);
  });

  it('picks each country’s default method', () => {
    expect(defaultMethodFor('tn')).toBe('tunisia');
    expect(defaultMethodFor('SA')).toBe('umm-al-qura');
    expect(defaultMethodFor('GB')).toBe('moonsighting');
    expect(defaultMethodFor('ZZ')).toBe('mwl');
    expect(defaultMethodFor(null)).toBe('mwl');
  });
});

describe('prayerState', () => {
  const tunis = { latitude: 36.8065, longitude: 10.1815 };
  const date = { year: 2026, month: 10, day: 18 };
  const settings = { ...defaultSettings, method: 'tunisia' as const };
  const today: DayTimes = prayerTimes(tunis, date, settings);
  const tomorrow: DayTimes = prayerTimes(tunis, addDays(date, 1), settings);
  const plus = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);

  it('before Fajr: still in Isha, Fajr next', () => {
    const s = prayerState(plus(today.fajr, -30), today, tomorrow);
    expect(s).toMatchObject({
      current: 'isha',
      next: 'fajr',
      nextAt: today.fajr,
      currentEndsAt: today.fajr,
    });
  });

  it('Fajr ends at sunrise; between sunrise and Dhuhr nothing is current', () => {
    expect(prayerState(plus(today.fajr, 5), today, tomorrow)).toMatchObject({
      current: 'fajr',
      currentEndsAt: today.sunrise,
      next: 'dhuhr',
    });
    expect(prayerState(plus(today.sunrise, 5), today, tomorrow)).toMatchObject({
      current: null,
      next: 'dhuhr',
    });
  });

  it('walks through the afternoon and evening', () => {
    expect(prayerState(plus(today.dhuhr, 1), today, tomorrow)).toMatchObject({
      current: 'dhuhr',
      next: 'asr',
    });
    expect(prayerState(plus(today.asr, 1), today, tomorrow)).toMatchObject({
      current: 'asr',
      currentEndsAt: today.maghrib,
      next: 'maghrib',
    });
    expect(prayerState(plus(today.maghrib, 1), today, tomorrow)).toMatchObject({
      current: 'maghrib',
      next: 'isha',
    });
  });

  it('after Isha: Isha runs until tomorrow’s Fajr, which is next', () => {
    const s = prayerState(plus(today.isha, 60), today, tomorrow);
    expect(s).toMatchObject({
      current: 'isha',
      next: 'fajr',
      nextAt: tomorrow.fajr,
      nextDate: addDays(date, 1),
    });
  });
});
