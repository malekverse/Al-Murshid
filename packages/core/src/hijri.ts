// Hijri calendar (SPEC 5.4): Umm al-Qura, with the person's ±2 day adjustment. One tested
// conversion for both apps, since Hermes has no Intl Islamic calendars. Supported range:
// 1343-1500 AH (1924-2077 CE).

import { gregorianToHijri, hijriToGregorian } from '@tabby_ai/hijri-converter';
import { addDays, type CivilDate } from './time';

export interface HijriDate {
  year: number;
  /** 1 = Muharram ... 9 = Ramadan ... 12 = Dhu al-Hijjah */
  month: number;
  day: number;
}

export type HijriOffset = -2 | -1 | 0 | 1 | 2;

/** The Hijri date for a calendar day, shifted by the person's adjustment (moon sighting). */
export function toHijri(date: CivilDate, offset: HijriOffset = 0): HijriDate {
  return gregorianToHijri(addDays(date, offset));
}

/** The calendar day a Hijri date falls on, with the same adjustment. */
export function fromHijri(hijri: HijriDate, offset: HijriOffset = 0): CivilDate {
  return addDays(hijriToGregorian(hijri), -offset);
}

/** 29 or 30. */
export function hijriMonthLength(year: number, month: number): number {
  const start = hijriToGregorian({ year, month, day: 1 });
  const next =
    month === 12 ? { year: year + 1, month: 1, day: 1 } : { year, month: month + 1, day: 1 };
  const end = hijriToGregorian(next);
  return Math.round(
    (Date.UTC(end.year, end.month - 1, end.day) -
      Date.UTC(start.year, start.month - 1, start.day)) /
      86_400_000,
  );
}

export type HijriEvent =
  | 'new-year'
  | 'ashura'
  | 'ramadan'
  | 'last-ten-nights'
  | 'eid-al-fitr'
  | 'dhul-hijjah-ten'
  | 'arafah'
  | 'eid-al-adha'
  | 'white-days';

/**
 * Marked days of the year (SPEC 5.4). Marks only: the calendar points to the day, it does not
 * rule on it. The 13th of Dhu al-Hijjah is a day of Tashriq, so it is not marked as a white day
 * (pending scholarly review, see docs/DECISIONS.md).
 */
export function hijriEvents({ month, day }: HijriDate): HijriEvent[] {
  const events: HijriEvent[] = [];
  if (month === 1 && day === 1) events.push('new-year');
  if (month === 1 && day === 10) events.push('ashura');
  if (month === 9) events.push('ramadan');
  if (month === 9 && day >= 21) events.push('last-ten-nights');
  if (month === 10 && day === 1) events.push('eid-al-fitr');
  if (month === 12 && day <= 10) events.push('dhul-hijjah-ten');
  if (month === 12 && day === 9) events.push('arafah');
  if (month === 12 && day === 10) events.push('eid-al-adha');
  const whiteDay = day >= 13 && day <= 15 && !(month === 12 && day === 13);
  if (whiteDay) events.push('white-days');
  return events;
}
