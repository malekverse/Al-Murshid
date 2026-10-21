'use client';

import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import {
  monthWeeks,
  shiftHijriMonth,
  skyMonth,
  skyMonthRange,
  toHijri,
  type CivilDate,
  type HijriMonth,
  type HijriOffset,
  type SkyDay,
} from '@murshid/core';
import { liveLogs, type Settings } from '@murshid/data';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';
import { lightSpots } from '@/components/today/hero';
import { IconButton } from '@/components/ui/icon-button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/cn';
import { useHijriFormat, useHijriMonthName, usePrayerName } from '@/lib/format';
import { useLogsBetween } from '@/lib/prayer-logs';
import { updateSettings } from '@/lib/settings';
import { weekStart } from '@/lib/week';

// Your Sky (SPEC 3, 5.7): a Hijri month of small night skies. A day's sky glows with the prayers
// logged on it; any other day is plain night, never marked. Numbers only with "Show details".

const night = 'bg-linear-to-b from-sky-night-top to-sky-night-bottom';

/** How brightly a day glows, from one light to all five. */
const glow = (count: number) => 0.3 + 0.14 * (count - 1);

const noon = (d: CivilDate) => new Date(Date.UTC(d.year, d.month - 1, d.day, 12));

export function YourSky({ settings, today }: { settings: Settings; today: CivilDate }) {
  const t = useTranslations('sky');
  const locale = useLocale();
  const format = useFormatter();
  const monthName = useHijriMonthName();
  const offset = settings.hijriOffset as HijriOffset;
  const todayHijri = toHijri(today, offset);
  const current: HijriMonth = { year: todayHijri.year, month: todayHijri.month };
  const [month, setMonth] = useState<HijriMonth>(current);
  const [openDay, setOpenDay] = useState<SkyDay | null>(null);
  const touch = useRef<number | null>(null);
  const detailsId = useId();

  const [from, to] = skyMonthRange(month, offset);
  const logs = useLogsBetween(from, to);
  const days = skyMonth(month, offset, logs ? liveLogs(logs) : [], today);
  const weeks = monthWeeks(days, weekStart[locale] ?? 0);
  const details = settings.showSkyDetails;
  const rtl = locale === 'ar';
  const isCurrent = month.year === current.year && month.month === current.month;
  const move = (delta: number) => {
    const next = shiftHijriMonth(month, delta);
    // No sky for months still to come.
    if (next && !(delta > 0 && isCurrent)) setMonth(next);
  };
  const title = t('title');
  const monthTitle = `${monthName(month.month)} ${format.number(month.year, { useGrouping: false })}`;
  const dateLabel = (d: SkyDay) =>
    format.dateTime(noon(d.date), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });
  const lights = (count: number) => t('lights', { count });

  const weekdayNames = Array.from({ length: 7 }, (_, i) => {
    const wd = ((weekStart[locale] ?? 0) + i) % 7;
    // 2026-10-18 was a Sunday; count from there.
    return format.dateTime(new Date(Date.UTC(2026, 9, 18 + wd, 12)), {
      weekday: 'narrow',
      timeZone: 'UTC',
    });
  });

  return (
    <section aria-labelledby={`${detailsId}-title`} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 px-2">
        <Text as="h2" role="headline" id={`${detailsId}-title`}>
          {title}
        </Text>
        <Text role="callout" tone="muted">
          {t('intro')}
        </Text>
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-card-edge bg-surface p-3 shadow-card dark:shadow-none">
        <div className="flex items-center justify-between gap-2">
          <IconButton icon={CaretLeft} mirror label={t('previous')} onClick={() => move(-1)} />
          <Text as="p" role="headline" aria-live="polite" className="text-center">
            {monthTitle}
          </Text>
          <IconButton
            icon={CaretRight}
            mirror
            label={t('next')}
            disabled={isCurrent}
            onClick={() => move(1)}
          />
        </div>

        <div
          role="grid"
          aria-label={`${title}, ${monthTitle}`}
          className="flex flex-col gap-1.5"
          onPointerDown={(e) => {
            if (e.pointerType === 'touch') touch.current = e.clientX;
          }}
          onPointerUp={(e) => {
            if (touch.current === null) return;
            const dx = e.clientX - touch.current;
            touch.current = null;
            if (Math.abs(dx) > 48) move(dx < 0 !== rtl ? 1 : -1);
          }}
        >
          <div role="row" className="grid grid-cols-7 gap-1.5">
            {weekdayNames.map((name, i) => (
              <Text
                key={i}
                as="span"
                role="caption"
                tone="muted"
                className="text-center"
                aria-hidden
              >
                {name}
              </Text>
            ))}
          </div>
          {weeks.map((week, w) => (
            <div key={w} role="row" className="grid grid-cols-7 gap-1.5">
              {week.map((day, i) =>
                day ? (
                  <div key={i} role="gridcell">
                    <Tile
                      day={day}
                      details={details}
                      label={
                        day.prayers.length > 0
                          ? t('day', { date: dateLabel(day), lights: lights(day.prayers.length) })
                          : dateLabel(day)
                      }
                      dayNumber={format.number(day.hijri.day)}
                      count={format.number(day.prayers.length)}
                      onOpen={() => setOpenDay(day)}
                    />
                  </div>
                ) : (
                  <span key={i} role="gridcell" aria-hidden />
                ),
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 px-1">
          <Text as="span" role="callout" id={`${detailsId}-details`}>
            {t('showDetails')}
          </Text>
          <Toggle
            labelledBy={`${detailsId}-details`}
            checked={details}
            onChange={(showSkyDetails) => updateSettings((s) => ({ ...s, showSkyDetails }))}
          />
        </div>
      </div>

      <DaySheet
        day={openDay}
        onClose={() => setOpenDay(null)}
        title={openDay ? dateLabel(openDay) : ''}
      />
    </section>
  );
}

function Tile({
  day,
  details,
  label,
  dayNumber,
  count,
  onOpen,
}: {
  day: SkyDay;
  details: boolean;
  label: string;
  dayNumber: string;
  count: string;
  onOpen: () => void;
}) {
  const lit = day.prayers.length;
  const className = cn(
    'relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-control',
    night,
    day.isToday && 'outline-2 outline-offset-2 outline-lantern',
  );
  const inner = (
    <>
      {lit > 0 && (
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,var(--color-lantern),transparent_70%)]"
          style={{ opacity: glow(lit) }}
        />
      )}
      <span aria-hidden className="relative text-caption text-starlight">
        {dayNumber}
      </span>
      {details && lit > 0 && (
        <span aria-hidden className="relative text-caption text-starlight/80">
          {count}
        </span>
      )}
    </>
  );
  if (day.future) {
    // Days still to come have no sky yet: just their number.
    return (
      <span
        aria-label={label}
        className="flex aspect-square w-full items-center justify-center text-caption text-ink-muted"
      >
        <span aria-hidden>{dayNumber}</span>
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onOpen}
      className={cn(
        className,
        'transition-transform duration-(--duration-quick) ease-standard focus-visible:outline-2 focus-visible:outline-lantern active:scale-95',
      )}
    >
      {inner}
    </button>
  );
}

/** A day's own sky: its lights where Today's hero places them, and the prayers they are for. */
function DaySheet({
  day,
  onClose,
  title,
}: {
  day: SkyDay | null;
  onClose: () => void;
  title: string;
}) {
  const hijri = useHijriFormat();
  const prayerName = usePrayerName();
  const format = useFormatter();
  return (
    <Sheet
      open={day !== null}
      onOpenChange={(open) => !open && onClose()}
      title={title}
      description={day ? hijri(day.hijri) : undefined}
    >
      {day && (
        <div className="flex flex-col gap-4 pb-2">
          <div aria-hidden className={cn('relative h-32 overflow-hidden rounded-card', night)}>
            {day.prayers.map((p) => (
              <span
                key={p}
                className="absolute size-2 -translate-x-1/2 rounded-full bg-starlight shadow-[0_0_14px_4px_var(--color-lantern)] rtl:translate-x-1/2"
                style={{ insetInlineStart: `${lightSpots[p].x}%`, top: `${lightSpots[p].y}%` }}
              />
            ))}
          </div>
          {day.prayers.length > 0 && (
            <Text role="body" className="text-center">
              {format.list(
                day.prayers.map((p) => prayerName(p)),
                { type: 'unit', style: 'narrow' },
              )}
            </Text>
          )}
        </div>
      )}
    </Sheet>
  );
}
