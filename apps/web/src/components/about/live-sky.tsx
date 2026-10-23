'use client';

import {
  addDays,
  civilDate,
  defaultMethodFor,
  prayerState,
  prayerTimes,
  sunPosition,
  type Prayer,
} from '@murshid/core';
import { intlLocale, type Locale } from '@murshid/i18n';
import { glassToneFor, periodSun, skyAt } from '@murshid/tokens';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { StarField } from '@/components/ui/star-field';

// The landing page's sky (SPEC 4): the sky at the visitor's own time, over the main city of the
// browser's time zone, with the next prayer's countdown. No location is asked for; the city table
// arrives after the page is on screen. Before that, and without script, it is Fajr's sky.

export interface LiveSkyLabels {
  next: string;
  now: string;
  place: string;
  names: Record<Prayer | 'jumuah', string>;
}

type Zones = Record<string, [number, number, string, string, string, string]>;

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

function compute(zone: string, entry: Zones[string], locale: Locale, labels: LiveSkyLabels): Live {
  const [latitude, longitude, en, ar, fr, country] = entry;
  const place = { latitude, longitude };
  const now = new Date();
  const sky = skyAt(sunPosition(now, place));
  const settings = {
    method: defaultMethodFor(country),
    asr: 'standard',
    highLatitude: 'auto',
  } as const;
  const today = civilDate(now, zone);
  const state = prayerState(
    now,
    prayerTimes(place, today, settings),
    prayerTimes(place, addDays(today, 1), settings),
  );
  const tag = intlLocale(locale, country);
  const friday =
    new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: zone }).format(now) === 'Fri';
  const name = (p: Prayer) => labels.names[p === 'dhuhr' && friday ? 'jumuah' : p];
  const line =
    state.current && state.currentEndsAt
      ? labels.now
          .replace('{name}', name(state.current))
          .replace('{duration}', duration(tag, state.currentEndsAt.getTime() - now.getTime()))
      : labels.next
          .replace('{name}', name(state.next))
          .replace('{duration}', duration(tag, state.nextAt.getTime() - now.getTime()));
  const city = locale === 'ar' ? ar : locale === 'fr' ? fr : en;
  return {
    top: sky.top,
    bottom: sky.bottom,
    stars: sky.stars,
    tone: glassToneFor(sky.bottom),
    line,
    city,
    place: labels.place.replace('{place}', city),
  };
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
    void import('@murshid/content/zones').then((table) => {
      const entry = (table.default.zones as unknown as Zones)[zone];
      if (!active || !entry) return;
      const update = () => setLive(compute(zone, entry, locale, labels));
      update();
      timer = setInterval(update, MINUTE / 2);
    });
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
        <p className={`text-ink-muted ${caption}`}>{live ? live.place : ' '}</p>
      </div>
    </div>
  );
}
