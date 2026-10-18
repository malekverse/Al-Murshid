import { describe, expect, it } from 'vitest';
import { fromHijri, hijriEvents, hijriMonthLength, toHijri } from './hijri';
import {
  addDays,
  civilDate,
  daysBetween,
  isoDate,
  parseIsoDate,
  weekday,
  zoneOffsetMinutes,
} from './time';

// Node's ICU ships its own Umm al-Qura table: an independent check of the converter.
const icu = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});
function icuHijri(date: { year: number; month: number; day: number }) {
  const parts = icu.formatToParts(new Date(Date.UTC(date.year, date.month - 1, date.day)));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

describe('hijri (Umm al-Qura)', () => {
  // The two tables agree through 1450 AH (mid-2029); later month starts are predictions on
  // which published tables differ by a day (docs/DECISIONS.md).
  it('agrees with ICU on every day from 2024 to the end of 1450 AH', () => {
    let date = { year: 2024, month: 1, day: 1 };
    let mismatches = 0;
    while (toHijri(date).year <= 1450) {
      const a = toHijri(date);
      const b = icuHijri(date);
      if (a.year !== b.year || a.month !== b.month || a.day !== b.day) mismatches++;
      date = addDays(date, 1);
    }
    expect(mismatches).toBe(0);
  });

  it('round-trips through the Gregorian calendar', () => {
    const date = { year: 2026, month: 10, day: 18 };
    expect(fromHijri(toHijri(date))).toEqual(date);
    expect(fromHijri(toHijri(date, 1), 1)).toEqual(date);
  });

  it('applies the ±2 day moon-sighting adjustment', () => {
    const date = { year: 2026, month: 10, day: 18 };
    const base = toHijri(date);
    expect(toHijri(date, 1)).toEqual(toHijri(addDays(date, 1)));
    expect(toHijri(date, -2)).toEqual(toHijri(addDays(date, -2)));
    expect(toHijri(date, 0)).toEqual(base);
  });

  it('has months of 29 or 30 days', () => {
    for (let m = 1; m <= 12; m++) expect([29, 30]).toContain(hijriMonthLength(1448, m));
  });

  it('marks the year’s days without marking the 13th of Dhu al-Hijjah as a white day', () => {
    expect(hijriEvents({ year: 1448, month: 1, day: 1 })).toEqual(['new-year']);
    expect(hijriEvents({ year: 1448, month: 1, day: 10 })).toEqual(['ashura']);
    expect(hijriEvents({ year: 1448, month: 9, day: 1 })).toEqual(['ramadan']);
    expect(hijriEvents({ year: 1448, month: 9, day: 27 })).toEqual(['ramadan', 'last-ten-nights']);
    expect(hijriEvents({ year: 1448, month: 9, day: 13 })).toEqual(['ramadan', 'white-days']);
    expect(hijriEvents({ year: 1448, month: 10, day: 1 })).toEqual(['eid-al-fitr']);
    expect(hijriEvents({ year: 1448, month: 12, day: 9 })).toEqual(['dhul-hijjah-ten', 'arafah']);
    expect(hijriEvents({ year: 1448, month: 12, day: 10 })).toEqual([
      'dhul-hijjah-ten',
      'eid-al-adha',
    ]);
    expect(hijriEvents({ year: 1448, month: 12, day: 13 })).toEqual([]);
    expect(hijriEvents({ year: 1448, month: 12, day: 14 })).toEqual(['white-days']);
    expect(hijriEvents({ year: 1448, month: 5, day: 20 })).toEqual([]);
  });
});

describe('time zones and calendar days', () => {
  it('finds the calendar day of an instant in a zone', () => {
    const instant = new Date(Date.UTC(2026, 9, 17, 23, 30));
    expect(civilDate(instant, 'Africa/Tunis')).toEqual({ year: 2026, month: 10, day: 18 });
    expect(civilDate(instant, 'America/New_York')).toEqual({ year: 2026, month: 10, day: 17 });
  });

  it('follows DST offsets', () => {
    expect(zoneOffsetMinutes(new Date(Date.UTC(2026, 0, 15, 12)), 'Europe/Paris')).toBe(60);
    expect(zoneOffsetMinutes(new Date(Date.UTC(2026, 6, 15, 12)), 'Europe/Paris')).toBe(120);
    expect(zoneOffsetMinutes(new Date(Date.UTC(2026, 6, 15, 12)), 'Africa/Tunis')).toBe(60);
  });

  it('does date arithmetic across months and years', () => {
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 1,
    });
    expect(addDays({ year: 2024, month: 3, day: 1 }, -1)).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
    expect(daysBetween({ year: 2026, month: 1, day: 1 }, { year: 2026, month: 12, day: 31 })).toBe(
      364,
    );
    expect(isoDate(parseIsoDate('2026-03-09'))).toBe('2026-03-09');
    expect(() => parseIsoDate('nope')).toThrow();
    expect(weekday({ year: 2026, month: 10, day: 16 })).toBe(5);
  });
});
