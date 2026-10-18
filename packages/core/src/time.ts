// Calendar dates in a given IANA time zone. A prayer day is a calendar day in the city's own
// zone, wherever the device clock is set. Relies on Intl time zone support (native on the web,
// the FormatJS polyfill with every zone on Hermes).

/** A calendar date without a time or zone: what "today" means for a city. */
export interface CivilDate {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

function parts(instant: Date, timeZone: string) {
  const out: Record<string, number> = {};
  for (const p of formatter(timeZone).formatToParts(instant)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return out as {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
}

/** The calendar date of an instant in a time zone. */
export function civilDate(instant: Date, timeZone: string): CivilDate {
  const p = parts(instant, timeZone);
  return { year: p.year, month: p.month, day: p.day };
}

/** Offset of a zone from UTC at an instant, in minutes (DST aware). */
export function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const p = parts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000);
}

/** Add whole days to a civil date. */
export function addDays(date: CivilDate, days: number): CivilDate {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: CivilDate, b: CivilDate): number {
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000,
  );
}

/** ISO form, e.g. "2026-10-18". Used as a stable key (prayer logs, notification ids). */
export function isoDate({ year, month, day }: CivilDate): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseIsoDate(value: string): CivilDate {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) throw new Error(`Invalid ISO date: ${value}`);
  return { year, month, day };
}

/** 0 = Sunday ... 5 = Friday, 6 = Saturday. */
export function weekday({ year, month, day }: CivilDate): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
