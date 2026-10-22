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
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { khatmahStore } from '@/lib/quran';
import { useToday } from './common';
import { haptics } from '@/lib/haptics';

// The khatmah (SPEC 5.5): today's portion, a progress ring, and a plan that recalculates quietly.
// Behind or ahead, nothing is ever shown as owed.

const dayOptions = ['30', '60', '120', '365'] as const;
const paceOptions = ['1', '2', '5', '10', '20'] as const;
const asDate = (d: CivilDate) => new Date(Date.UTC(d.year, d.month - 1, d.day, 12));

function PlanSheet({
  open,
  onClose,
  today,
}: {
  open: boolean;
  onClose: () => void;
  today: CivilDate;
}) {
  const t = useTranslations('quran.khatmah');
  const format = useFormatter();
  const [kind, setKind] = useState<KhatmahGoal['kind']>('date');
  const [days, setDays] = useState<(typeof dayOptions)[number]>('30');
  const [pages, setPages] = useState<(typeof paceOptions)[number]>('5');

  const goal: KhatmahGoal =
    kind === 'date'
      ? { kind, finishOn: isoDate(addDays(today, Number(days) - 1)) }
      : { kind, pagesPerDay: Number(pages) };
  const preview = khatmahDay(startKhatmah(goal, today), today);
  const date = format.dateTime(asDate(preview.finishOn), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('sheet.title')}
      description={t('sheet.description')}
    >
      <View className="gap-6">
        <Segmented
          label={t('sheet.goal')}
          value={kind}
          onChange={setKind}
          options={[
            { value: 'date', label: t('sheet.byDate') },
            { value: 'pace', label: t('sheet.byPace') },
          ]}
        />
        {kind === 'date' ? (
          <Segmented
            label={t('sheet.within')}
            value={days}
            onChange={setDays}
            options={dayOptions.map((d) => ({
              value: d,
              label: t('sheet.days', { count: Number(d) }),
            }))}
          />
        ) : (
          <Segmented
            label={t('sheet.byPace')}
            value={pages}
            onChange={setPages}
            options={paceOptions.map((p) => ({ value: p, label: format.number(Number(p)) }))}
          />
        )}
        <Text role="body" accessibilityLiveRegion="polite">
          {t('sheet.estimate', { pace: t('sheet.pace', { count: preview.pace }), date })}
        </Text>
        <Button
          onPress={() => {
            khatmahStore.write({ id: uuid(), ...startKhatmah(goal, today) });
            haptics.success();
            onClose();
          }}
        >
          {t('sheet.begin')}
        </Button>
      </View>
    </Sheet>
  );
}

export function KhatmahCard() {
  const t = useTranslations('quran.khatmah');
  const format = useFormatter();
  const today = useToday();
  const plan = khatmahStore.useValue();
  const [planning, setPlanning] = useState(false);

  if (!plan) {
    return (
      <Card className="gap-3 p-6">
        <Text role="headline" accessibilityRole="header">
          {t('plan')}
        </Text>
        <Text role="callout" tone="muted">
          {t('planHint')}
        </Text>
        <Button variant="secondary" onPress={() => setPlanning(true)} className="self-start">
          {t('plan')}
        </Button>
        <PlanSheet open={planning} onClose={() => setPlanning(false)} today={today} />
      </Card>
    );
  }

  const day = khatmahDay(plan, today);
  const percent = format.number(day.progress, { style: 'percent', maximumFractionDigits: 0 });
  const count = day.to - day.from + 1;
  const portion =
    day.from === day.to
      ? t('todayOne', { page: day.from })
      : t('today', { from: day.from, to: day.to });

  return (
    <Card className="gap-4 p-6">
      <View className="flex-row items-center gap-4">
        <ProgressRing
          progress={day.progress}
          size={64}
          label={t('title')}
          valueText={t('progress', { percent })}
        >
          <Text role="caption" tone="muted">
            {percent}
          </Text>
        </ProgressRing>
        <View className="flex-1 gap-1">
          <Text role="headline" accessibilityRole="header">
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
        </View>
      </View>
      {day.done ? (
        <Button variant="secondary" onPress={() => khatmahStore.write(null)} className="self-start">
          {t('end')}
        </Button>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          <Button
            onPress={() =>
              router.push(`/quran/page/${Math.min(day.to, Math.max(day.from, plan.page))}`)
            }
          >
            {t('read')}
          </Button>
          {day.readToday < count && (
            <Button
              variant="ghost"
              onPress={() => {
                khatmahStore.write({ ...plan, ...readThrough(plan, day.to, today) });
                haptics.success();
              }}
            >
              {t('markRead')}
            </Button>
          )}
          <Button variant="ghost" onPress={() => khatmahStore.write(null)}>
            {t('end')}
          </Button>
        </View>
      )}
    </Card>
  );
}
