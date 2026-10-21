'use client';

import { BookOpen } from '@phosphor-icons/react';
import { divisionStart } from '@murshid/content/quran';
import { isoDate, type DhulHijjahState, type RamadanState } from '@murshid/core';
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useId } from 'react';
import { readerHref, type ReaderPlace } from '@/components/quran/common';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/components/ui/button-markup';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { Link } from '@/i18n/navigation';
import { setFasted, setTaraweeh, useRamadanLogs } from '@/lib/ramadan-logs';

// Today's seasonal cards (SPEC 5.1, 5.8): Ramadan, Jumu'ah and the first ten days of Dhul Hijjah.
// Each points to the day; none asks why a fast or a night prayer was not logged.

function ReadLink({ href, children }: { href: string; children: string }) {
  const locale = useLocale();
  return (
    <Link
      href={href}
      className={buttonClass({
        variant: 'secondary',
        script: locale === 'ar' ? 'arabic' : 'latin',
        className: 'self-start',
      })}
    >
      <BookOpen size={20} aria-hidden />
      {children}
    </Link>
  );
}

function HideButton({ onHide }: { onHide: () => void }) {
  const t = useTranslations('today.cards');
  return (
    // Pulled back by its own padding, so the label lines up with the card's text.
    <Button variant="ghost" onClick={onHide} className="-ms-6 self-start">
      {t('hide')}
    </Button>
  );
}

export function RamadanCard({
  ramadan,
  place,
  onHide,
}: {
  ramadan: RamadanState;
  place: ReaderPlace;
  onHide: () => void;
}) {
  const t = useTranslations('today.cards');
  const format = useFormatter();
  const headingId = useId();
  const fastId = useId();
  const taraweehId = useId();
  const logs = useRamadanLogs([ramadan.today?.date ?? null, ramadan.taraweehDate]);
  const fasted = ramadan.today ? logs?.get(isoDate(ramadan.today.date))?.fasted : undefined;
  const taraweeh = ramadan.taraweehDate
    ? (logs?.get(isoDate(ramadan.taraweehDate))?.taraweeh ?? false)
    : false;
  const day = ramadan.fast?.day ?? ramadan.today?.day ?? 1;
  const juzStart = ramadan.juz ? divisionStart('juz', ramadan.juz) : null;

  return (
    <Card as="section" aria-labelledby={headingId} className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <Text as="h2" role="headline" id={headingId}>
          {t('ramadan.title', { day: format.number(day) })}
        </Text>
        {ramadan.lastTenNights && (
          <Text role="callout" tone="lantern">
            {t('ramadan.lastTen')}
          </Text>
        )}
      </div>

      {ramadan.juz && juzStart && (
        <ReadLink href={readerHref(juzStart.surah, juzStart.ayah, place)}>
          {t('ramadan.read', { juz: format.number(ramadan.juz) })}
        </ReadLink>
      )}

      {ramadan.today && (
        <div role="group" aria-labelledby={fastId} className="flex flex-col gap-2">
          <Text role="callout" tone="muted" id={fastId}>
            {t('ramadan.fast')}
          </Text>
          <div className="flex flex-wrap gap-2">
            {([true, false] as const).map((value) => (
              <Button
                key={String(value)}
                variant={fasted === value ? 'primary' : 'secondary'}
                aria-pressed={fasted === value}
                onClick={() => void setFasted(ramadan.today!.date, value)}
              >
                {t(value ? 'ramadan.fasted' : 'ramadan.notToday')}
              </Button>
            ))}
          </div>
        </div>
      )}

      {ramadan.taraweehDate && (
        <div className="flex items-center justify-between gap-4">
          <Text as="span" role="body" id={taraweehId}>
            {t('ramadan.taraweeh')}
          </Text>
          <Toggle
            labelledBy={taraweehId}
            checked={taraweeh}
            onChange={(prayed) => void setTaraweeh(ramadan.taraweehDate!, prayed)}
          />
        </div>
      )}

      <HideButton onHide={onHide} />
    </Card>
  );
}

export function JumuahCard({ place, onHide }: { place: ReaderPlace; onHide: () => void }) {
  const t = useTranslations('today.cards');
  const headingId = useId();
  return (
    <Card as="section" aria-labelledby={headingId} className="flex flex-col gap-4 p-6">
      <Text as="h2" role="headline" id={headingId}>
        {t('jumuah.title')}
      </Text>
      <Text role="body" tone="muted">
        {t('jumuah.body')}
      </Text>
      <ReadLink href={readerHref(18, 1, place)}>{t('jumuah.read')}</ReadLink>
      <HideButton onHide={onHide} />
    </Card>
  );
}

export function DhulHijjahCard({ state, onHide }: { state: DhulHijjahState; onHide: () => void }) {
  const t = useTranslations('today.cards');
  const format = useFormatter();
  const headingId = useId();
  return (
    <Card as="section" aria-labelledby={headingId} className="flex flex-col gap-4 p-6">
      <Text as="h2" role="headline" id={headingId}>
        {t('dhulHijjah.title')}
      </Text>
      <Text role="body" tone="muted">
        {state.arafah === 'tomorrow'
          ? t('dhulHijjah.arafahTomorrow')
          : state.arafah === 'today'
            ? t('dhulHijjah.arafahToday')
            : t('dhulHijjah.day', { day: format.number(state.day) })}
      </Text>
      <HideButton onHide={onHide} />
    </Card>
  );
}
