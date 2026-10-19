'use client';

import {
  addDays,
  isoDate,
  khatmahDay,
  readThrough,
  startKhatmah,
  type CivilDate,
  type KhatmahGoal,
} from '@murshid/core';
import { uuid } from '@murshid/data';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { Link } from '@/i18n/navigation';
import { khatmahStore } from '@/lib/quran';
import { useToday } from './common';

// The khatmah (SPEC 5.5): today's portion, a progress ring, and a plan that recalculates quietly.
// Behind or ahead, nothing is ever shown as owed.

const dayOptions = [30, 60, 120, 365] as const;
const paceOptions = [1, 2, 5, 10, 20] as const;

const asDate = (d: CivilDate) => new Date(Date.UTC(d.year, d.month - 1, d.day, 12));

function PlanSheet({
  open,
  onOpenChange,
  today,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  today: CivilDate;
}) {
  const t = useTranslations('quran.khatmah');
  const format = useFormatter();
  const [kind, setKind] = useState<KhatmahGoal['kind']>('date');
  const [days, setDays] = useState<(typeof dayOptions)[number]>(30);
  const [pages, setPages] = useState<(typeof paceOptions)[number]>(5);

  const goal: KhatmahGoal =
    kind === 'date'
      ? { kind, finishOn: isoDate(addDays(today, days - 1)) }
      : { kind, pagesPerDay: pages };
  const preview = khatmahDay(startKhatmah(goal, today), today);
  const date = format.dateTime(asDate(preview.finishOn), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const begin = () => {
    khatmahStore.write({ id: uuid(), ...startKhatmah(goal, today) });
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('sheet.title')}
      description={t('sheet.description')}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Text role="callout" tone="muted">
            {t('sheet.goal')}
          </Text>
          <Segmented
            label={t('sheet.goal')}
            value={kind}
            onChange={setKind}
            options={[
              { value: 'date', label: t('sheet.byDate') },
              { value: 'pace', label: t('sheet.byPace') },
            ]}
          />
        </div>
        {kind === 'date' ? (
          <div className="flex flex-col gap-2">
            <Text role="callout" tone="muted">
              {t('sheet.within')}
            </Text>
            <Segmented
              label={t('sheet.within')}
              value={String(days)}
              onChange={(v) => setDays(Number(v) as (typeof dayOptions)[number])}
              options={dayOptions.map((d) => ({
                value: String(d),
                label: t('sheet.days', { count: d }),
              }))}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Text role="callout" tone="muted">
              {t('sheet.byPace')}
            </Text>
            <Segmented
              label={t('sheet.byPace')}
              value={String(pages)}
              onChange={(v) => setPages(Number(v) as (typeof paceOptions)[number])}
              options={paceOptions.map((p) => ({ value: String(p), label: format.number(p) }))}
            />
          </div>
        )}
        <Text role="body" aria-live="polite">
          {t('sheet.estimate', { pace: t('sheet.pace', { count: preview.pace }), date })}
        </Text>
        <Button onClick={begin}>{t('sheet.begin')}</Button>
      </div>
    </Sheet>
  );
}

export function KhatmahCard() {
  const t = useTranslations('quran.khatmah');
  const format = useFormatter();
  const today = useToday();
  const plan = khatmahStore.useValue();
  const [planning, setPlanning] = useState(false);

  if (!today || plan === undefined) return null;

  if (!plan) {
    return (
      <Card className="flex flex-col items-start gap-3 p-6">
        <Text as="h2" role="headline">
          {t('plan')}
        </Text>
        <Text role="callout" tone="muted">
          {t('planHint')}
        </Text>
        <Button variant="secondary" onClick={() => setPlanning(true)}>
          {t('plan')}
        </Button>
        <PlanSheet open={planning} onOpenChange={setPlanning} today={today} />
      </Card>
    );
  }

  const day = khatmahDay(plan, today);
  const percent = format.number(day.progress, { style: 'percent', maximumFractionDigits: 0 });
  const portion =
    day.from === day.to
      ? t('todayOne', { page: day.from })
      : t('today', { from: day.from, to: day.to });
  const count = day.to - day.from + 1;
  const end = () => khatmahStore.write(null);

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <ProgressRing
          progress={day.progress}
          size={64}
          label={t('title')}
          valueText={t('progress', { percent })}
        >
          <Text as="span" role="caption" tone="muted">
            {percent}
          </Text>
        </ProgressRing>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text as="h2" role="headline">
            {t('title')}
          </Text>
          {day.done ? (
            <Text role="callout">{t('done')}</Text>
          ) : (
            <>
              <Text role="callout">{portion}</Text>
              <Text role="caption" tone="muted">
                {day.readToday > 0
                  ? t('readToday', { read: day.readToday, count })
                  : t('finish', {
                      date: format.dateTime(asDate(day.finishOn), {
                        day: 'numeric',
                        month: 'long',
                        timeZone: 'UTC',
                      }),
                    })}
              </Text>
            </>
          )}
        </div>
      </div>
      {day.done ? (
        <Button variant="secondary" onClick={end} className="self-start">
          {t('end')}
        </Button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/quran/page/${Math.min(day.to, Math.max(day.from, plan.page))}`}
            className="inline-flex min-h-touch items-center rounded-full bg-lantern px-6 text-on-lantern shadow-card"
          >
            <Text as="span" role="callout" tone="inherit">
              {t('read')}
            </Text>
          </Link>
          {day.readToday < count && (
            <Button
              variant="ghost"
              onClick={() => khatmahStore.write({ ...plan, ...readThrough(plan, day.to, today) })}
            >
              {t('markRead')}
            </Button>
          )}
          <Button variant="ghost" onClick={end}>
            {t('end')}
          </Button>
        </div>
      )}
    </Card>
  );
}
