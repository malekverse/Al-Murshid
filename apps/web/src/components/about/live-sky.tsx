'use client';

import {
  addDays,
  civilDate,
  prayerState,
  sunPosition,
  zoneDay,
  type CivilDate,
  type DayTimes,
  type Prayer,
  type ZoneTimes,
} from '@murshid/core';
import { intlLocale, type Locale } from '@murshid/i18n';
import { glassToneFor, periodSun, skyAt } from '@murshid/tokens';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { StarField } from '@/components/ui/star-field';

// The landing page's sky (SPEC 4): the sky at the visitor's own time, over the main city of the
// browser's time zone, with the next prayer's countdown. No location is asked for. The zone's
// city and its prayer times, computed at build time (scripts/zone-times.ts), arrive after the page
// is on screen; before that, and without script, it is Fajr's sky.

export interface LiveSkyLabels {
  next: string;
  now: string;
  place: string;
  names: Record<Prayer | 'jumuah', string>;
}

interface Zone extends ZoneTimes {
  names: Record<Locale, string>;
  country: string;
  latitude: number;
  longitude: number;
}

/** The zone's day from its table; past the table's end, calculated here (loaded only then). */
async function day(zone: Zone, date: CivilDate): Promise<DayTimes> {
  const known = zoneDay(zone, date);
  if (known) return known;
  const { calculateDay } = await import('./calculate-day');
  return calculateDay(zone, zone.country, date);
}

interface Live {
  top: string;
  bottom: string;
  stars: number;
  tone: 'light' | 'dark';
  line: string;
  city: string;
  place: string;
}

const fajr = skyAt(periodSun.fajr);
const MINUTE = 60_000;

function duration(locale: string, ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / MINUTE));
  const hours = Math.floor(minutes / 60);
  const parts = { hours, minutes: minutes % 60 };
  try {
    // Widely available since 2025; the plain minutes below are the fallback.
    const Duration = (
      Intl as unknown as {
        DurationFormat?: new (l: string, o: object) => { format(d: object): string };
      }
    ).DurationFormat;
    if (Duration)
      return new Duration(locale, { style: 'short' }).format(hours ? parts : { minutes });
  } catch {
    // Fall through.
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'short',
  }).format(minutes);
}

async function compute(zone: string, entry: Zone, locale: Locale, labels: LiveSkyLabels) {
  const now = new Date();
  const sky = skyAt(sunPosition(now, entry));
  const date = civilDate(now, zone);
  const [today, tomorrow] = await Promise.all([day(entry, date), day(entry, addDays(date, 1))]);
  const state = prayerState(now, today, tomorrow);
  const tag = intlLocale(locale, entry.country);
  // Dhuhr is always today's when it is current or next: on Friday it is Jumu'ah.
  const name = (p: Prayer) => labels.names[p === 'dhuhr' && today.jumuah ? 'jumuah' : p];
  const line =
    state.current && state.currentEndsAt
      ? labels.now
          .replace('{name}', name(state.current))
          .replace('{duration}', duration(tag, state.currentEndsAt.getTime() - now.getTime()))
      : labels.next
          .replace('{name}', name(state.next))
          .replace('{duration}', duration(tag, state.nextAt.getTime() - now.getTime()));
  const city = entry.names[locale];
  return {
    top: sky.top,
    bottom: sky.bottom,
    stars: sky.stars,
    tone: glassToneFor(sky.bottom),
    line,
    city,
    place: labels.place.replace('{place}', city),
  } satisfies Live;
}

export function LiveSky({
  locale,
  labels,
  children,
}: {
  locale: Locale;
  labels: LiveSkyLabels;
  children: ReactNode;
}) {
  const [live, setLive] = useState<Live | null>(null);
  // No message provider on public pages, so the script-aware sizes are picked here.
  const callout = locale === 'ar' ? 'text-ar-callout' : 'text-callout';
  const caption = locale === 'ar' ? 'text-ar-caption' : 'text-caption';

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let active = true;
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // A zone without a main city in the table keeps Fajr's sky.
    fetch(`/zones/${zone.split('/').map(encodeURIComponent).join('/')}.json`)
      .then((res) => (res.ok ? (res.json() as Promise<Zone>) : null))
      .then((entry) => {
        if (!active || !entry) return;
        const update = () =>
          void compute(zone, entry, locale, labels).then((next) => {
            if (active) setLive(next);
          });
        update();
        timer = setInterval(update, MINUTE / 2);
      })
      .catch(() => {});
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [locale, labels]);

  const style = {
    '--sky-top': live?.top ?? fajr.top,
    '--sky-bottom': live?.bottom ?? fajr.bottom,
    backgroundImage: 'linear-gradient(to bottom, var(--sky-top), var(--sky-bottom))',
    transition:
      '--sky-top var(--duration-ambient) var(--ease-standard), --sky-bottom var(--duration-ambient) var(--ease-standard)',
  } as CSSProperties;

  return (
    <div
      className="relative isolate overflow-hidden"
      style={style}
      data-theme={live?.tone ?? glassToneFor(fajr.bottom)}
    >
      <StarField opacity={live?.stars ?? fajr.stars} twinkle grainId="landing-grain" />
      <div className="relative">{children}</div>
      <div className="relative mx-auto flex max-w-reading flex-col items-center gap-2 px-4 pb-12">
        <p
          aria-live="polite"
          className={`glass inline-flex min-h-touch items-center gap-2 rounded-full border border-hairline px-5 text-ink transition-opacity duration-(--duration-standard) ${callout} ${
            live ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {live && (
            <>
              <span className="size-2 shrink-0 rounded-full bg-lantern" aria-hidden />
              <span>{live.line}</span>
              <span className="text-ink-muted">· {live.city}</span>
            </>
          )}
        </p>
        <p className={`text-ink-muted ${caption}`}>{live ? live.place : ' '}</p>
      </div>
    </div>
  );
}
