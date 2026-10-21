import { describe, expect, it } from 'vitest';
import { toHijri } from './hijri';
import { isoDate, type CivilDate } from './time';
import type { LoggedPrayer } from './today';
import { skyMonth, skyMonthRange } from './your-sky';

const today: CivilDate = { year: 2026, month: 10, day: 18 };
const month = { year: toHijri(today).year, month: toHijri(today).month };

describe('Your Sky', () => {
  it('gives each day of the Hijri month the prayers logged on it, once and in order', () => {
    const logs: LoggedPrayer[] = [
      { date: '2026-10-18', prayer: 'isha' },
      { date: '2026-10-18', prayer: 'fajr' },
      { date: '2026-10-18', prayer: 'fajr' },
      { date: '2026-10-17', prayer: 'maghrib' },
    ];
    const days = skyMonth(month, 0, logs, today);
    const on = (date: string) => days.find((d) => isoDate(d.date) === date)!;
    expect(on('2026-10-18').prayers).toEqual(['fajr', 'isha']);
    expect(on('2026-10-17').prayers).toEqual(['maghrib']);
    expect(on('2026-10-16').prayers).toEqual([]);
  });

  it('marks today and the days still to come', () => {
    const days = skyMonth(month, 0, [], today);
    const todays = days.filter((d) => d.isToday);
    expect(todays).toHaveLength(1);
    expect(isoDate(todays[0]!.date)).toBe('2026-10-18');
    expect(days.filter((d) => d.future).every((d) => isoDate(d.date) > '2026-10-18')).toBe(true);
    expect(days.some((d) => d.future)).toBe(true);
  });

  it('ignores logs outside the month', () => {
    const days = skyMonth(month, 0, [{ date: '2020-01-01', prayer: 'fajr' }], today);
    expect(days.every((d) => d.prayers.length === 0)).toBe(true);
  });

  it('reads logs for the month’s first and last days, following the Hijri offset', () => {
    const days = skyMonth(month, 1, [], today);
    expect(skyMonthRange(month, 1)).toEqual([isoDate(days[0]!.date), isoDate(days.at(-1)!.date)]);
    expect(skyMonthRange(month, 1)).not.toEqual(skyMonthRange(month, 0));
  });
});
