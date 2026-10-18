'use client';

import { Compass } from '@phosphor-icons/react';
import {
  distanceToMakkah,
  isAligned,
  qiblaBearing,
  qiblaOffset,
  smoothHeading,
} from '@murshid/core';
import { locationLabel, placeOf } from '@murshid/data';
import { spring } from '@murshid/tokens';
import { motion } from 'motion/react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { useSettings } from '@/lib/settings';

// The Qibla on web (SPEC 5.3): the bearing from north and a simple dial. Phone browsers use the
// compass where they allow it; desktops show the bearing to face, clockwise from north.

type OrientationEventWithCompass = DeviceOrientationEvent & { webkitCompassHeading?: number };
type PermissionApi = { requestPermission?: () => Promise<'granted' | 'denied'> };

function useCompass(enabled: boolean) {
  const [heading, setHeading] = useState<number | null>(null);
  const smoothed = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const onEvent = (e: Event) => {
      const event = e as OrientationEventWithCompass;
      // iOS gives a compass heading; Android Chrome gives an absolute alpha (counterclockwise).
      const raw =
        typeof event.webkitCompassHeading === 'number'
          ? event.webkitCompassHeading
          : event.absolute && event.alpha !== null
            ? 360 - event.alpha
            : null;
      if (raw === null) return;
      // Low-pass filter so the dial never jitters (SPEC 6.4).
      smoothed.current = smoothed.current === null ? raw : smoothHeading(smoothed.current, raw);
      setHeading(smoothed.current);
    };
    window.addEventListener('deviceorientationabsolute', onEvent);
    window.addEventListener('deviceorientation', onEvent);
    return () => {
      window.removeEventListener('deviceorientationabsolute', onEvent);
      window.removeEventListener('deviceorientation', onEvent);
    };
  }, [enabled]);

  return heading;
}

/** The dial: north at the top of the ring, a line toward the Kaaba at the bearing. */
function Dial({ bearing, heading }: { bearing: number; heading: number | null }) {
  const t = useTranslations('qibla');
  const aligned = heading !== null && isAligned(heading, bearing);
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  return (
    // A compass is never mirrored (SPEC 7).
    <div dir="ltr" className="relative mx-auto aspect-square w-full max-w-sm">
      <motion.svg
        viewBox="-110 -110 220 220"
        className="size-full"
        animate={{ rotate: heading === null ? 0 : -heading }}
        transition={{ type: 'spring', ...spring.soft }}
        aria-hidden
      >
        <circle
          r={100}
          className={cn(
            'transition-colors duration-(--duration-gentle) ease-standard',
            aligned ? 'fill-lantern/15 stroke-lantern' : 'fill-surface stroke-hairline',
          )}
          strokeWidth={aligned ? 3 : 1}
        />
        {ticks.map((deg) => (
          <line
            key={deg}
            x1={0}
            y1={-96}
            x2={0}
            y2={deg % 90 === 0 ? -84 : deg % 30 === 0 ? -88 : -92}
            transform={`rotate(${deg})`}
            className="stroke-ink-muted"
            strokeWidth={deg % 90 === 0 ? 2 : 1}
          />
        ))}
        {/* Sizes here are in dial units (the viewBox), so the dial scales as one drawing. */}
        <text
          y={-70}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          className="fill-ink font-medium"
        >
          {t('north')}
        </text>
        <g transform={`rotate(${bearing})`}>
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={-78}
            className="stroke-lantern"
            strokeWidth={3}
            strokeLinecap="round"
          />
          {/* The Kaaba: a small dark cube with a gold band. */}
          <g transform="translate(0 -84)">
            <rect x={-7} y={-7} width={14} height={14} rx={2} className="fill-ink" />
            <rect x={-7} y={-3} width={14} height={2.5} className="fill-lantern" />
          </g>
        </g>
        <circle r={4} className="fill-lantern" />
      </motion.svg>
    </div>
  );
}

export function QiblaScreen() {
  const t = useTranslations('qibla');
  const tToday = useTranslations('today');
  const locale = useLocale();
  const format = useFormatter();
  const settings = useSettings();
  const [compassOn, setCompassOn] = useState(false);
  const [needsPermission] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof (window.DeviceOrientationEvent as unknown as PermissionApi | undefined)
        ?.requestPermission === 'function',
  );
  const heading = useCompass(compassOn || !needsPermission);

  if (!settings) {
    return (
      <Main title={t('title')}>
        <Skeleton className="mx-auto aspect-square w-full max-w-sm rounded-full" />
      </Main>
    );
  }
  const place = placeOf(settings);
  if (!place || !settings.location) {
    return (
      <Main title={t('title')}>
        <Card className="flex flex-col items-start gap-4 p-6">
          <Text role="body">{t('needsLocation')}</Text>
          <Link
            href="/you#location"
            className="inline-flex min-h-touch items-center rounded-full bg-lantern px-6 text-on-lantern shadow-card"
          >
            <Text as="span" role="callout" tone="inherit">
              {tToday('noLocation.action')}
            </Text>
          </Link>
        </Card>
      </Main>
    );
  }

  const bearing = qiblaBearing(place);
  const degrees = format.number(Math.round(bearing), {
    style: 'unit',
    unit: 'degree',
    unitDisplay: 'narrow',
  });
  const distance = format.number(Math.round(distanceToMakkah(place)), {
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'short',
  });
  const offset = heading === null ? null : qiblaOffset(heading, bearing);
  const aligned = heading !== null && isAligned(heading, bearing);

  return (
    <Main title={t('title')}>
      <Text role="callout" tone="muted" className="text-center">
        {t('from', { city: locationLabel(settings.location, locale) })}
      </Text>
      <Dial bearing={bearing} heading={heading} />
      <div className="flex flex-col items-center gap-2 text-center" aria-live="polite">
        {heading === null ? (
          <Text role="headline">{t('desktop', { degrees })}</Text>
        ) : aligned ? (
          <Text role="headline" tone="lantern">
            {t('aligned')}
          </Text>
        ) : (
          <Text role="headline">{offset! > 0 ? t('turnRight') : t('turnLeft')}</Text>
        )}
        <Text role="body" tone="muted">
          {heading === null
            ? t('distance', { distance })
            : `${t('bearing', { degrees })} · ${t('distance', { distance })}`}
        </Text>
      </div>
      {needsPermission && !compassOn && (
        <Button
          variant="secondary"
          icon={<Compass size={20} aria-hidden />}
          className="self-center"
          onClick={() => {
            const api = window.DeviceOrientationEvent as unknown as PermissionApi;
            void api.requestPermission?.().then((r) => setCompassOn(r === 'granted'));
          }}
        >
          {t('enableCompass')}
        </Button>
      )}
    </Main>
  );
}

function Main({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-reading flex-col gap-6 px-4 pt-6 pb-12 md:pt-12"
    >
      <Text as="h1" role="title1">
        {title}
      </Text>
      {children}
    </main>
  );
}
