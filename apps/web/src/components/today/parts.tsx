'use client';

import { CalendarBlank, Compass } from '@phosphor-icons/react';
import {
  isoDate,
  type ContextCard as Card_,
  type EarlierPrayer,
  type Prayer,
  type Step,
  type TodayView,
} from '@murshid/core';
import type { Settings } from '@murshid/data';
import { motion as tokens } from '@murshid/tokens';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { AyahText } from '@/components/ui/ayah-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { PrayerRow, type PrayerRowState } from '@/components/ui/prayer-row';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { Link } from '@/i18n/navigation';
import type { ReaderPlace } from '@/components/quran/common';
import { DhulHijjahCard, JumuahCard, RamadanCard } from './season-cards';
import { usePrayerName, useTimeFormat } from '@/lib/format';

const MotionLink = motion.create(Link);

/** Verbatim from packages/content, passed in by the server page. */
export interface WelcomeVerse {
  text: string;
  ayah: number;
  surahName: { ar: string; en: string };
}

/** "Two prayers a day", "Asr, every day". */
export function useStepLabel() {
  const t = useTranslations('journey.steps');
  const prayerName = usePrayerName();
  return (step: Step, focusPrayer?: Prayer) =>
    step === 'one-prayer'
      ? t('one-prayer', { prayer: prayerName(focusPrayer ?? 'maghrib') })
      : t(step as Exclude<Step, 'one-prayer'>);
}

export function ContextCard({
  card,
  view,
  timeZone,
  verse,
  locale,
  focusPrayer,
  place,
  onDismiss,
  onAnswer,
}: {
  card: Card_;
  view: TodayView;
  timeZone: string;
  verse: WelcomeVerse;
  locale: string;
  focusPrayer: Prayer;
  /** Where links into the Quran open (the person's reading view and edition). */
  place: ReaderPlace;
  onDismiss: () => void;
  onAnswer: (accepted: boolean) => void;
}) {
  const t = useTranslations('today.cards');
  const prayerName = usePrayerName();
  const time = useTimeFormat(timeZone);
  const stepLabel = useStepLabel();
  const headingId = useId();

  if (card.kind === 'welcome-back') {
    const hero = view.hero;
    const at =
      hero.mode === 'next'
        ? hero.at
        : (view.earlier.find(
            (e) => e.prayer === hero.prayer && isoDate(e.date) === isoDate(hero.date),
          )?.at ?? view.times[hero.prayer]);
    return (
      <Card as="section" aria-labelledby={headingId} className="flex flex-col gap-4 p-6">
        <Text as="h2" role="headline" id={headingId}>
          {t('welcomeBack.title')}
        </Text>
        <Text role="body" tone="muted">
          {t('welcomeBack.body', { name: prayerName(hero.prayer, hero.jumuah), time: time(at) })}
        </Text>
        <AyahText
          text={verse.text}
          surahName={locale === 'ar' ? verse.surahName.ar : verse.surahName.en}
          number={verse.ayah}
        />
        <Button variant="secondary" onClick={onDismiss} className="self-start">
          {t('welcomeBack.action')}
        </Button>
      </Card>
    );
  }

  if (card.kind === 'ramadan' && view.ramadan) {
    return <RamadanCard ramadan={view.ramadan} place={place} onHide={onDismiss} />;
  }
  if (card.kind === 'jumuah') return <JumuahCard place={place} onHide={onDismiss} />;
  if (card.kind === 'dhul-hijjah' && view.dhulHijjah) {
    return <DhulHijjahCard state={view.dhulHijjah} onHide={onDismiss} />;
  }

  if (card.kind === 'step-offer') {
    return (
      <Card as="section" aria-labelledby={headingId} className="flex flex-col gap-4 p-6">
        <Text as="h2" role="headline" id={headingId}>
          {t('stepOffer.title')}
        </Text>
        <Text role="body" tone="muted">
          {t('stepOffer.body', { step: stepLabel(card.step, focusPrayer) })}
        </Text>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => onAnswer(true)}>{t('stepOffer.accept')}</Button>
          <Button variant="ghost" onClick={() => onAnswer(false)}>
            {t('stepOffer.notNow')}
          </Button>
        </div>
      </Card>
    );
  }
  return null;
}

export function FocusLine({ settings }: { settings: Settings }) {
  const t = useTranslations('journey');
  const stepLabel = useStepLabel();
  const { step, focusPrayer } = settings.journey.prayer;
  return (
    <Text role="callout" tone="muted" className="px-2">
      {t('focus', { step: stepLabel(step, focusPrayer) })}
    </Text>
  );
}

const rowState: Record<TodayView['rows'][number]['status'], PrayerRowState> = {
  logged: 'logged',
  current: 'current',
  open: 'upcoming',
};

export function PrayerList({ view, timeZone }: { view: TodayView; timeZone: string }) {
  const t = useTranslations('today.list');
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <Text as="h2" role="headline" id={headingId} className="px-2">
        {t('title')}
      </Text>
      <Card className="flex flex-col p-2">
        {view.rows.map((row) => (
          <PrayerRow
            key={row.name}
            prayer={row.name}
            time={row.at}
            state={rowState[row.status]}
            jumuah={row.jumuah}
            timeZone={timeZone}
          />
        ))}
      </Card>
    </section>
  );
}

export function Tools() {
  const t = useTranslations('today.tools');
  const tools = [
    { href: '/qibla', icon: Compass, label: t('qibla') },
    { href: '/calendar', icon: CalendarBlank, label: t('calendar') },
  ] as const;
  return (
    <nav aria-label={t('label')} className="grid grid-cols-2 gap-4">
      {tools.map(({ href, icon: IconComponent, label }) => (
        <MotionLink
          key={href}
          href={href}
          whileTap={{ scale: tokens.pressScale }}
          className="flex min-h-touch items-center gap-3 rounded-card border border-card-edge bg-surface p-4 shadow-card hover:bg-ink/5"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-lantern/10 text-lantern-ink">
            <IconComponent size={22} aria-hidden />
          </span>
          <Text as="span" role="body">
            {label}
          </Text>
        </MotionLink>
      ))}
    </nav>
  );
}

export function EarlierSheet({
  open,
  onOpenChange,
  earlier,
  timeZone,
  onToggle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  earlier: readonly EarlierPrayer[];
  timeZone: string;
  onToggle: (entry: EarlierPrayer, logged: boolean) => void;
}) {
  const t = useTranslations('today.earlier');
  const prayerName = usePrayerName();
  const time = useTimeFormat(timeZone);
  const days = [...new Set(earlier.map((e) => isoDate(e.date)))];

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
    >
      <div className="flex flex-col gap-6">
        {days.map((day, i) => (
          <div key={day} className="flex flex-col gap-2">
            <Text as="h3" role="caption" tone="muted" className="px-2">
              {i === 0 ? t('today') : t('yesterday')}
            </Text>
            <ListGroup>
              {earlier
                .filter((e) => isoDate(e.date) === day)
                .map((e) => {
                  const name = prayerName(e.prayer, e.jumuah);
                  return (
                    <ListRow
                      key={`${day}-${e.prayer}`}
                      title={name}
                      value={time(e.at)}
                      control={
                        <Toggle
                          checked={e.logged}
                          onChange={(on) => onToggle(e, on)}
                          label={name}
                        />
                      }
                    />
                  );
                })}
            </ListGroup>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

export function TodaySkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-96 w-full rounded-sheet" />
      <Skeleton className="h-6 w-2/3" />
      <div className="flex flex-col gap-2 rounded-card border border-card-edge bg-surface p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function NoLocation() {
  const t = useTranslations('today.noLocation');
  return (
    <Card className="flex flex-col items-start gap-4 p-6">
      <Text role="headline">{t('title')}</Text>
      <Link
        href="/you#location"
        className="inline-flex min-h-touch items-center rounded-full bg-lantern px-6 text-on-lantern shadow-card"
      >
        <Text as="span" role="callout" tone="inherit">
          {t('action')}
        </Text>
      </Link>
    </Card>
  );
}
