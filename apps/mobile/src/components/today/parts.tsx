import {
  isoDate,
  type ContextCard as Card_,
  type EarlierPrayer,
  type Prayer,
  type TodayView,
} from '@murshid/core';
import type { Settings } from '@murshid/data';
import { router } from 'expo-router';
import { CalendarBlank } from 'phosphor-react-native/src/icons/CalendarBlank';
import { Compass } from 'phosphor-react-native/src/icons/Compass';
import { View } from 'react-native';
import { useTranslations } from 'use-intl';
import { AyahText } from '@/components/ui/ayah-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ListGroup, ListRow } from '@/components/ui/list-row';
import { PrayerRow, type PrayerRowState } from '@/components/ui/prayer-row';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { usePrayerName, useStepLabel, useTimeFormat } from '@/lib/format';
import { useColors } from '@/lib/theme';

export interface WelcomeVerse {
  text: string;
  ayah: number;
  surahName: { ar: string; en: string };
}

export function ContextCard({
  card,
  view,
  timeZone,
  verse,
  locale,
  focusPrayer,
  onDismiss,
  onAnswer,
}: {
  card: Card_;
  view: TodayView;
  timeZone: string;
  verse: WelcomeVerse | null;
  locale: string;
  focusPrayer: Prayer;
  onDismiss: () => void;
  onAnswer: (accepted: boolean) => void;
}) {
  const t = useTranslations('today.cards');
  const prayerName = usePrayerName();
  const time = useTimeFormat(timeZone);
  const stepLabel = useStepLabel();

  if (card.kind === 'welcome-back') {
    const hero = view.hero;
    const at =
      hero.mode === 'next'
        ? hero.at
        : (view.earlier.find(
            (e) => e.prayer === hero.prayer && isoDate(e.date) === isoDate(hero.date),
          )?.at ?? view.times[hero.prayer]);
    return (
      <Card className="gap-4 p-6">
        <Text role="headline" accessibilityRole="header">
          {t('welcomeBack.title')}
        </Text>
        <Text role="body" tone="muted">
          {t('welcomeBack.body', { name: prayerName(hero.prayer, hero.jumuah), time: time(at) })}
        </Text>
        {verse && (
          <AyahText
            text={verse.text}
            surahName={locale === 'ar' ? verse.surahName.ar : verse.surahName.en}
            number={verse.ayah}
          />
        )}
        <Button variant="secondary" onPress={onDismiss} className="self-start">
          {t('welcomeBack.action')}
        </Button>
      </Card>
    );
  }
  if (card.kind === 'step-offer') {
    return (
      <Card className="gap-4 p-6">
        <Text role="headline" accessibilityRole="header">
          {t('stepOffer.title')}
        </Text>
        <Text role="body" tone="muted">
          {t('stepOffer.body', { step: stepLabel(card.step, focusPrayer) })}
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <Button onPress={() => onAnswer(true)}>{t('stepOffer.accept')}</Button>
          <Button variant="ghost" onPress={() => onAnswer(false)}>
            {t('stepOffer.notNow')}
          </Button>
        </View>
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

export function PrayerList({
  view,
  timeZone,
  onPressRow,
}: {
  view: TodayView;
  timeZone: string;
  onPressRow?: (prayer: Prayer) => void;
}) {
  const t = useTranslations('today.list');
  return (
    <View className="gap-3">
      <Text role="headline" accessibilityRole="header" className="px-2">
        {t('title')}
      </Text>
      <Card className="p-2">
        {view.rows.map((row) => (
          <PrayerRow
            key={row.name}
            prayer={row.name}
            time={row.at}
            state={rowState[row.status]}
            jumuah={row.jumuah}
            timeZone={timeZone}
            onPress={
              onPressRow && row.name !== 'sunrise'
                ? () => onPressRow(row.name as Prayer)
                : undefined
            }
          />
        ))}
      </Card>
    </View>
  );
}

export function Tools() {
  const t = useTranslations('today.tools');
  const color = useColors();
  const tools = [
    { href: '/qibla', icon: Compass, label: t('qibla') },
    { href: '/calendar', icon: CalendarBlank, label: t('calendar') },
  ] as const;
  return (
    <View className="flex-row gap-4" accessibilityLabel={t('label')}>
      {tools.map(({ href, icon: IconComponent, label }) => (
        <PressableScale
          key={href}
          onPress={() => router.push(href)}
          accessibilityRole="button"
          className="min-h-touch flex-1 flex-row items-center gap-3 rounded-card border border-card-edge bg-surface p-4 shadow-card dark:shadow-none"
        >
          <View className="size-10 items-center justify-center rounded-control bg-lantern/10">
            <IconComponent size={22} color={color.lanternInk} />
          </View>
          <Text role="body" className="flex-1">
            {label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

export function EarlierSheet({
  open,
  onClose,
  earlier,
  timeZone,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  earlier: readonly EarlierPrayer[];
  timeZone: string;
  onToggle: (entry: EarlierPrayer, logged: boolean) => void;
}) {
  const t = useTranslations('today.earlier');
  const prayerName = usePrayerName();
  const time = useTimeFormat(timeZone);
  const days = [...new Set(earlier.map((e) => isoDate(e.date)))];
  return (
    <Sheet open={open} onClose={onClose} title={t('title')} description={t('description')}>
      <View className="gap-6">
        {days.map((day, i) => (
          <View key={day} className="gap-2">
            <Text role="caption" tone="muted" className="px-2">
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
          </View>
        ))}
      </View>
    </Sheet>
  );
}

export function TodaySkeleton() {
  return (
    <View
      className="gap-6"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Skeleton className="h-96 w-full rounded-sheet" />
      <Skeleton className="h-6 w-2/3" />
      <View className="gap-2 rounded-card border border-card-edge bg-surface p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </View>
    </View>
  );
}

export function NoLocation() {
  const t = useTranslations('today.noLocation');
  return (
    <Card className="items-start gap-4 p-6">
      <Text role="headline">{t('title')}</Text>
      <Button onPress={() => router.push('/you')}>{t('action')}</Button>
    </Card>
  );
}
