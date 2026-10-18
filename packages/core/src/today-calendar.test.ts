import { describe, expect, it } from 'vitest';
import { HIJRI_FIRST, HIJRI_LAST, hijriMonthDays, monthWeeks, shiftHijriMonth } from './calendar';
import { fromHijri, toHijri } from './hijri';
import { defaultSettings, prayerTimes, type Prayer } from './prayer-times';
import { addDays, isoDate, type CivilDate } from './time';
import { dayRecords, isRecentLog, todayView, type LoggedPrayer, type TodayInput } from './today';

const tunis = { latitude: 36.8065, longitude: 10.1815, timeZone: 'Africa/Tunis' };
const settings = { ...defaultSettings, method: 'tunisia' as const };
const sunday: CivilDate = { year: 2026, month: 10, day: 18 };
const thursday: CivilDate = { year: 2026, month: 10, day: 15 };
const friday: CivilDate = { year: 2026, month: 10, day: 16 };
const timesOn = (d: CivilDate) => prayerTimes(tunis, d, settings);
const plus = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);
const log = (d: CivilDate, prayer: Prayer): LoggedPrayer => ({ date: isoDate(d), prayer });
const view = (now: Date, extra: Partial<TodayInput> = {}) =>
  todayView({ now, place: tunis, settings, logs: [], cards: [], ...extra });

describe('todayView: the hero', () => {
  const t = timesOn(sunday);

  it('before Fajr, still in yesterday’s Isha', () => {
    const v = view(plus(t.fajr, -60));
    expect(v.date).toEqual(sunday);
    expect(v.hero).toMatchObject({ mode: 'now', prayer: 'isha', date: addDays(sunday, -1) });
    expect(v.hero.mode === 'now' && v.hero.endsAt).toEqual(t.fajr);
    expect(v.rows.some((r) => r.status === 'current')).toBe(false);
  });

  it('shows the next prayer once the current one is logged', () => {
    const v = view(plus(t.fajr, -60), { logs: [log(addDays(sunday, -1), 'isha')] });
    expect(v.hero).toMatchObject({ mode: 'next', prayer: 'fajr', date: sunday, at: t.fajr });
  });

  it('inside Asr: "Now: Asr" until Maghrib, and the row is current', () => {
    const v = view(plus(t.asr, 5));
    expect(v.hero).toMatchObject({ mode: 'now', prayer: 'asr', endsAt: t.maghrib });
    expect(v.rows.find((r) => r.name === 'asr')!.status).toBe('current');
  });

  it('after logging Asr: the row holds a light and Maghrib is next', () => {
    const v = view(plus(t.asr, 5), { logs: [log(sunday, 'asr')] });
    expect(v.rows.find((r) => r.name === 'asr')!.status).toBe('logged');
    expect(v.hero).toMatchObject({ mode: 'next', prayer: 'maghrib', at: t.maghrib });
  });

  it('between sunrise and Dhuhr nothing is current, and sunrise is only a marker', () => {
    const v = view(plus(t.sunrise, 30));
    expect(v.hero).toMatchObject({ mode: 'next', prayer: 'dhuhr' });
    expect(v.rows.map((r) => r.status)).toEqual(['open', 'open', 'open', 'open', 'open', 'open']);
  });

  it('after Isha is logged, tomorrow’s Fajr is next', () => {
    const v = view(plus(t.isha, 30), { logs: [log(sunday, 'isha')] });
    expect(v.hero).toMatchObject({ mode: 'next', prayer: 'fajr', date: addDays(sunday, 1) });
    expect(v.tomorrow.date).toEqual(addDays(sunday, 1));
  });

  it("reads Jumu'ah on Friday's Dhuhr, in the hero and the list", () => {
    const f = timesOn(friday);
    const v = view(plus(f.sunrise, 30));
    expect(v.hero).toMatchObject({ mode: 'next', prayer: 'dhuhr', jumuah: true });
    expect(v.rows.find((r) => r.name === 'dhuhr')!.jumuah).toBe(true);
    expect(view(plus(f.dhuhr, 5)).hero).toMatchObject({ mode: 'now', jumuah: true });
  });

  it('applies the Hijri adjustment', () => {
    const v = view(plus(t.dhuhr, 5), { hijriOffset: 1 });
    expect(v.hijri).toEqual(toHijri(addDays(sunday, 1)));
  });
});

describe('todayView: earlier prayers', () => {
  it('offers earlier today and all of yesterday, with what is already logged', () => {
    const t = timesOn(sunday);
    const v = view(plus(t.dhuhr, 1), {
      logs: [log(sunday, 'fajr'), log(addDays(sunday, -1), 'asr')],
    });
    expect(v.earlier.map((e) => `${isoDate(e.date)} ${e.prayer} ${e.logged}`)).toEqual([
      '2026-10-18 fajr true',
      '2026-10-18 dhuhr false',
      '2026-10-17 fajr false',
      '2026-10-17 dhuhr false',
      '2026-10-17 asr true',
      '2026-10-17 maghrib false',
      '2026-10-17 isha false',
    ]);
  });
});

describe('todayView: one contextual card at most', () => {
  const all: TodayInput['cards'] = [
    'welcome-back',
    'jumuah',
    'morning-adhkar',
    'evening-adhkar',
    'step-offer',
  ];

  it('welcomes back first, after three days away', () => {
    const f = timesOn(friday);
    const v = view(plus(f.dhuhr, 5), { cards: all, lastOpenedOn: addDays(friday, -3) });
    expect(v.card).toEqual({ kind: 'welcome-back' });
    const dismissed = view(plus(f.dhuhr, 5), {
      cards: all,
      lastOpenedOn: addDays(friday, -3),
      dismissed: ['welcome-back'],
    });
    expect(dismissed.card).toEqual({ kind: 'jumuah' });
  });

  it("holds Jumu'ah from Thursday's Maghrib to Friday's Maghrib", () => {
    const th = timesOn(thursday);
    const f = timesOn(friday);
    expect(view(plus(th.maghrib, -5), { cards: ['jumuah'] }).card).toBeNull();
    expect(view(plus(th.maghrib, 5), { cards: ['jumuah'] }).card).toEqual({ kind: 'jumuah' });
    expect(view(plus(f.maghrib, -5), { cards: ['jumuah'] }).card).toEqual({ kind: 'jumuah' });
    expect(view(plus(f.maghrib, 5), { cards: ['jumuah'] }).card).toBeNull();
  });

  it('opens the adhkar windows after Fajr and after Asr', () => {
    const t = timesOn(sunday);
    expect(view(plus(t.fajr, 30), { cards: all }).card).toEqual({ kind: 'morning-adhkar' });
    expect(view(plus(t.asr, 30), { cards: all }).card).toEqual({ kind: 'evening-adhkar' });
    expect(view(plus(t.isha, 30), { cards: all }).card).toBeNull();
  });

  it('offers a new step after 5 of the last 7 days, never on its own', () => {
    const t = timesOn(sunday);
    const logs = [0, -1, -2, -3, -4].map((d) => log(addDays(sunday, d), 'asr'));
    const journey = [
      { track: 'prayer' as const, step: 'one-prayer' as const, focusPrayer: 'asr' as const },
    ];
    expect(view(plus(t.isha, 30), { cards: all, logs, journey }).card).toEqual({
      kind: 'step-offer',
      track: 'prayer',
      step: 'two-prayers',
    });
    expect(view(plus(t.isha, 30), { cards: all, logs: logs.slice(1), journey }).card).toBeNull();
    expect(view(plus(t.isha, 30), { cards: all, logs }).card).toBeNull();
  });

  it('shows nothing a build cannot open', () => {
    const t = timesOn(sunday);
    expect(view(plus(t.fajr, 30)).card).toBeNull();
    expect(todayView({ now: plus(t.fajr, 30), place: tunis, settings, logs: [] }).card).toEqual({
      kind: 'morning-adhkar',
    });
  });
});

describe('logs', () => {
  it('groups logs into one record per day, without duplicates', () => {
    const records = dayRecords([log(sunday, 'isha'), log(sunday, 'fajr'), log(sunday, 'fajr')]);
    expect(records).toHaveLength(1);
    expect(records[0]!.prayers).toEqual(['fajr', 'isha']);
  });

  it('keeps only the last eight days for Today and the Journey', () => {
    expect(isRecentLog(log(sunday, 'fajr'), sunday)).toBe(true);
    expect(isRecentLog(log(addDays(sunday, -7), 'fajr'), sunday)).toBe(true);
    expect(isRecentLog(log(addDays(sunday, -8), 'fajr'), sunday)).toBe(false);
    expect(isRecentLog(log(addDays(sunday, 1), 'fajr'), sunday)).toBe(false);
  });
});

describe('Hijri month view', () => {
  it('lists every day of the month with its Gregorian date and marked days', () => {
    const days = hijriMonthDays({ year: 1448, month: 9 });
    expect(days[0]!.date).toEqual(fromHijri({ year: 1448, month: 9, day: 1 }));
    expect([29, 30]).toContain(days.length);
    expect(days.every((d) => d.events.includes('ramadan'))).toBe(true);
    expect(days[26]!.events).toContain('last-ten-nights');
    for (const d of days) expect(toHijri(d.date)).toEqual(d.hijri);
  });

  it('moves with the moon-sighting adjustment', () => {
    const plain = hijriMonthDays({ year: 1448, month: 1 });
    const later = hijriMonthDays({ year: 1448, month: 1 }, -1);
    expect(later[0]!.date).toEqual(addDays(plain[0]!.date, 1));
    expect(later[0]!.weekday).toBe((plain[0]!.weekday + 1) % 7);
  });

  it('steps between months and stops at the ends of the table', () => {
    expect(shiftHijriMonth({ year: 1448, month: 12 }, 1)).toEqual({ year: 1449, month: 1 });
    expect(shiftHijriMonth({ year: 1448, month: 1 }, -1)).toEqual({ year: 1447, month: 12 });
    expect(shiftHijriMonth(HIJRI_FIRST, -1)).toBeNull();
    expect(shiftHijriMonth(HIJRI_LAST, 1)).toBeNull();
  });

  it('lays the month out in weeks from the chosen first weekday', () => {
    const days = hijriMonthDays({ year: 1448, month: 9 });
    for (const start of [0, 1, 6]) {
      const weeks = monthWeeks(days, start);
      expect(weeks.every((w) => w.length === 7)).toBe(true);
      const firstCell = weeks[0]!.findIndex((c) => c !== null);
      expect((start + firstCell) % 7).toBe(days[0]!.weekday);
      expect(weeks.flat().filter(Boolean)).toHaveLength(days.length);
    }
    expect(monthWeeks([], 0)).toEqual([]);
  });
});
