'use client';

import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import {
  civilDate,
  hijriMonthDays,
  isoDate,
  monthWeeks,
  shiftHijriMonth,
  toHijri,
  type CalendarDay,
  type HijriEvent,
  type HijriMonth,
} from '@murshid/core';
import { placeOf } from '@murshid/data';
import { isolate } from '@murshid/i18n';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { useHijriMonthName } from '@/lib/format';
import { useSettings } from '@/lib/settings';
import { useNow } from '@/lib/use-now';
import { weekStart } from '@/lib/week';

export function CalendarScreen() {
  const settings = useSettings();
  const now = useNow(60_000);
  if (!settings || !now) {
    return (
      <Main>
        <Skeleton className="h-96 w-full rounded-card" />
      </Main>
    );
  }
  const place = placeOf(settings);
  const today = civilDate(now, place?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  return <Calendar today={today} offset={settings.hijriOffset} />;
}

function Calendar({
  today,
  offset,
}: {
  today: ReturnType<typeof civilDate>;
  offset: -2 | -1 | 0 | 1 | 2;
}) {
  const t = useTranslations('calendar');
  const locale = useLocale();
  const format = useFormatter();
  const monthName = useHijriMonthName();
  const todayHijri = toHijri(today, offset);
  const [month, setMonth] = useState<HijriMonth>({
    year: todayHijri.year,
    month: todayHijri.month,
  });
  const touch = useRef<number | null>(null);

  const days = hijriMonthDays(month, offset);
  const weeks = monthWeeks(days, weekStart[locale] ?? 0);
  const todayKey = isoDate(today);
  const rtl = locale === 'ar';
  const move = (delta: number) => {
    const next = shiftHijriMonth(month, delta);
    if (next) setMonth(next);
  };
  const isThisMonth = month.year === todayHijri.year && month.month === todayHijri.month;

  // Weekday names from Intl, starting on the week's first day.
  const weekdayNames = Array.from({ length: 7 }, (_, i) => {
    const wd = ((weekStart[locale] ?? 0) + i) % 7;
    // 2026-10-18 was a Sunday; count from there.
    return format.dateTime(new Date(Date.UTC(2026, 9, 18 + wd, 12)), {
      // Full Arabic day names crowd seven columns on a phone; the narrow forms read well.
      weekday: locale === 'ar' ? 'narrow' : 'short',
      timeZone: 'UTC',
    });
  });

  const gregorianRange = (() => {
    const first = days[0]!.date;
    const last = days.at(-1)!.date;
    const at = (d: typeof first) => new Date(Date.UTC(d.year, d.month - 1, d.day, 12));
    return format.dateTimeRange(at(first), at(last), {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  })();

  const marked = days.filter((d) => d.events.length > 0);
  const groups = groupEvents(marked);

  return (
    <Main>
      <div className="flex items-center justify-between gap-4">
        <IconButton icon={CaretLeft} mirror label={t('previous')} onClick={() => move(-1)} />
        <div className="flex flex-col items-center text-center">
          <Text as="h2" role="title2" aria-live="polite">
            {t('monthYear', {
              month: monthName(month.month),
              year: format.number(month.year, { useGrouping: false }),
            })}
          </Text>
          <Text role="caption" tone="muted">
            {gregorianRange}
          </Text>
        </div>
        <IconButton icon={CaretRight} mirror label={t('next')} onClick={() => move(1)} />
      </div>

      <div
        className="flex flex-col gap-1 rounded-card border border-card-edge bg-surface p-2 shadow-card"
        onPointerDown={(e) => {
          if (e.pointerType === 'touch') touch.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (touch.current === null) return;
          const dx = e.clientX - touch.current;
          touch.current = null;
          // Swipe toward the reading direction's end for the next month.
          if (Math.abs(dx) > 48) move(dx < 0 !== rtl ? 1 : -1);
        }}
        role="grid"
        aria-label={t('monthYear', {
          month: monthName(month.month),
          year: format.number(month.year, { useGrouping: false }),
        })}
      >
        <div role="row" className="grid grid-cols-7">
          {weekdayNames.map((name) => (
            <Text
              key={name}
              as="span"
              role="caption"
              tone="muted"
              className="py-2 text-center"
              aria-hidden
            >
              {name}
            </Text>
          ))}
        </div>
        {weeks.map((week, w) => (
          <div key={w} role="row" className="grid grid-cols-7 gap-1">
            {week.map((day, i) =>
              day ? (
                <DayCell key={i} day={day} today={isoDate(day.date) === todayKey} />
              ) : (
                <span key={i} role="gridcell" aria-hidden />
              ),
            )}
          </div>
        ))}
      </div>

      {!isThisMonth && (
        <Button
          variant="secondary"
          className="self-center"
          onClick={() => setMonth({ year: todayHijri.year, month: todayHijri.month })}
        >
          {t('today')}
        </Button>
      )}

      {groups.length > 0 && (
        <section className="flex flex-col gap-2">
          <Text as="h3" role="headline" className="px-2">
            {t('legend')}
          </Text>
          <ul className="flex flex-col gap-2 rounded-card border border-card-edge bg-surface p-4">
            {groups.map((g) => (
              <li key={`${g.event}-${g.from}`} className="flex items-baseline gap-3">
                <span
                  aria-hidden
                  className="size-2 shrink-0 translate-y-[-2px] rounded-full bg-lantern"
                />
                <Text as="span" role="body">
                  {t(`events.${g.event}`)}
                </Text>
                <Text as="span" role="callout" tone="muted" className="tabular">
                  {g.from === g.to
                    ? format.number(g.from)
                    : isolate(`${format.number(g.from)}–${format.number(g.to)}`, 'ltr')}
                </Text>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-2 px-2">
        <Text role="callout" tone="muted">
          {t('note')}
        </Text>
        <Link
          href="/you#hijri"
          className="self-start text-lantern-ink underline underline-offset-4"
        >
          <Text as="span" role="callout" tone="inherit">
            {t('adjust')}
          </Text>
        </Link>
      </div>
    </Main>
  );
}

/** Runs of consecutive days with the same marked event, e.g. "White days 13-15". */
function groupEvents(days: readonly CalendarDay[]) {
  const groups: { event: HijriEvent; from: number; to: number }[] = [];
  for (const d of days) {
    for (const event of d.events) {
      const last = groups.findLast((g) => g.event === event);
      if (last && last.to === d.hijri.day - 1) last.to = d.hijri.day;
      else groups.push({ event, from: d.hijri.day, to: d.hijri.day });
    }
  }
  return groups;
}

function DayCell({ day, today }: { day: CalendarDay; today: boolean }) {
  const t = useTranslations('calendar');
  const format = useFormatter();
  const gregorian = new Date(Date.UTC(day.date.year, day.date.month - 1, day.date.day, 12));
  const label = [
    format.dateTime(gregorian, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }),
    ...day.events.map((e) => t(`events.${e}`)),
  ].join(', ');
  return (
    <div
      role="gridcell"
      aria-label={`${format.number(day.hijri.day)}: ${label}`}
      aria-current={today ? 'date' : undefined}
      className={cn(
        'flex min-h-16 flex-col items-center justify-center rounded-control py-1',
        today && 'bg-lantern text-on-lantern',
        !today && day.events.length > 0 && 'bg-lantern/10',
      )}
    >
      <Text as="span" role="body" tone="inherit" className="tabular font-medium">
        {format.number(day.hijri.day)}
      </Text>
      <Text as="span" role="caption" tone={today ? 'inherit' : 'muted'} className="tabular">
        {format.number(day.date.day)}
      </Text>
    </div>
  );
}

function Main({ children }: { children: ReactNode }) {
  const t = useTranslations('calendar');
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-col gap-6 px-4 pt-6 pb-12 md:pt-12"
    >
      <Text as="h1" role="title1">
        {t('title')}
      </Text>
      {children}
    </main>
  );
}
