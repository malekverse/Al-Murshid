'use client';

import { Check, ClockCounterClockwise, MapPin } from '@phosphor-icons/react';
import { prayers, sunPosition, type CivilDate, type Prayer } from '@murshid/core';
import { locationLabel } from '@murshid/data';
import { easing, glassToneFor, motion as tokens, skyAt, spring } from '@murshid/tokens';
import { AnimatePresence, motion } from 'motion/react';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Countdown } from '@/components/ui/countdown';
import { SkyBackground } from '@/components/ui/sky-background';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import { arabicPrayerName, useHijriFormat, usePrayerName, useTimeFormat } from '@/lib/format';
import type { TodayState } from '@/lib/use-today';

// Where each prayer's light sits in the band of sky above the glass card: a low arc from the
// start side (Fajr) to the end (Isha), as percentages of that band, so no light hides behind the
// card. Lights appear only for logged prayers; nothing marks the others (SPEC 3).
const lightSpots: Record<Prayer, { x: number; y: number }> = {
  fajr: { x: 14, y: 60 },
  dhuhr: { x: 31, y: 34 },
  asr: { x: 50, y: 24 },
  maghrib: { x: 69, y: 34 },
  isha: { x: 86, y: 60 },
};

function SkyLights({ logged, day }: { logged: ReadonlySet<Prayer>; day: boolean }) {
  return (
    // The band matches the hero's top padding (pt-24, md:pt-32).
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 md:h-32">
      <AnimatePresence>
        {prayers
          .filter((p) => logged.has(p))
          .map((p) => (
            <motion.span
              key={p}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', ...spring.soft }}
              className={cn(
                'absolute size-2 -translate-x-1/2 rounded-full shadow-[0_0_14px_4px_var(--color-lantern)] rtl:translate-x-1/2',
                // A pale light disappears in a bright day sky; it glows lantern-gold there.
                day ? 'bg-lantern' : 'bg-starlight',
              )}
              style={{ insetInlineStart: `${lightSpots[p].x}%`, top: `${lightSpots[p].y}%` }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}

export interface HeroProps {
  state: TodayState;
  now: Date;
  /** The prayer just logged here, while its check and rising light play. */
  justLogged: Prayer | null;
  onLog: (date: CivilDate, prayer: Prayer) => void;
  onEarlier: () => void;
}

export function Hero({ state, now, justLogged, onLog, onEarlier }: HeroProps) {
  const t = useTranslations();
  const locale = useLocale();
  const format = useFormatter();
  const hijri = useHijriFormat();
  const prayerName = usePrayerName();
  const { view, place, settings } = state;
  const time = useTimeFormat(place.timeZone);

  const sun = sunPosition(now, place);
  const tone = glassToneFor(skyAt(sun).bottom);
  const hero = view.hero;
  const name = prayerName(hero.prayer, hero.jumuah);
  const target = hero.mode === 'now' ? hero.endsAt : hero.at;
  const seconds = Math.max(0, (target.getTime() - now.getTime()) / 1000);
  const countdown = () => <Countdown seconds={seconds} />;
  const loggedToday = new Set(
    view.rows.filter((r) => r.status === 'logged').map((r) => r.name as Prayer),
  );
  const { year, month, day } = view.date;
  const gregorian = format.dateTime(new Date(Date.UTC(year, month - 1, day, 12)), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  return (
    <SkyBackground sun={sun} className="rounded-sheet">
      <SkyLights logged={loggedToday} day={tone === 'light'} />
      <div className="relative flex min-h-96 flex-col justify-end p-4 pt-24 md:p-6 md:pt-32">
        <div data-theme={tone}>
          <Card variant="glass" className="relative flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
              <Text role="caption" tone="muted">
                {gregorian} · {hijri(view.hijri)}
              </Text>
              {settings.location && (
                <Text role="caption" tone="muted" className="inline-flex items-center gap-1">
                  <MapPin size={14} aria-hidden />
                  {locationLabel(settings.location, locale)}
                </Text>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Text as="h1" role="display">
                {t(hero.mode === 'now' ? 'components.prayer.now' : 'components.prayer.next', {
                  name,
                })}
              </Text>
              {locale !== 'ar' && (
                <Text role="title2" script="arabic" tone="muted" lang="ar" className="self-start">
                  {arabicPrayerName(hero.prayer, hero.jumuah)}
                </Text>
              )}
              <Text role="headline" tone="muted" className="tabular">
                {hero.mode === 'now'
                  ? t.rich('today.hero.left', { countdown })
                  : t.rich('today.hero.in', { countdown })}
                {hero.mode === 'next' && <> · {t('today.hero.at', { time: time(hero.at) })}</>}
              </Text>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {justLogged ? (
                <motion.div
                  key="prayed"
                  initial={{ opacity: 0, scale: tokens.pressScale }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', ...spring.gentle }}
                  className="flex min-h-16 items-center justify-center gap-3 rounded-full bg-lantern/15 text-lantern-ink"
                  role="status"
                >
                  <Check size={24} weight="bold" aria-hidden />
                  <Text as="span" role="headline" tone="inherit">
                    {t('components.prayer.prayed')}
                  </Text>
                </motion.div>
              ) : hero.mode === 'now' ? (
                <motion.div key="log" exit={{ opacity: 0, scale: tokens.pressScale }}>
                  <Button size="lg" onClick={() => onLog(hero.date, hero.prayer)}>
                    {t('components.prayer.iPrayed')}
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* The light that rises from the button into the sky (SPEC 6.4). */}
            <AnimatePresence>
              {justLogged && (
                <motion.span
                  key={justLogged}
                  aria-hidden
                  initial={{ y: 0, x: 0, opacity: 0, scale: 0.6 }}
                  animate={{
                    y: -320,
                    x: [0, 24, 0],
                    opacity: [0, 1, 1, 0],
                    scale: [0.6, 1, 1, 0.8],
                  }}
                  transition={{ duration: tokens.prayerLightRise / 1000, ease: easing.standard }}
                  className="pointer-events-none absolute start-1/2 bottom-16 size-3 rounded-full bg-starlight shadow-[0_0_18px_6px_var(--color-lantern)]"
                />
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={onEarlier}
              className="inline-flex min-h-touch items-center gap-2 self-center rounded-full px-4 text-lantern-ink hover:bg-lantern/10"
            >
              <ClockCounterClockwise size={18} aria-hidden />
              <Text as="span" role="callout" tone="inherit">
                {t('today.earlier.link')}
              </Text>
            </button>
          </Card>
        </div>
      </div>
    </SkyBackground>
  );
}
