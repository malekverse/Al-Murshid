import { divisionStart } from '@murshid/content/quran';
import { isoDate, type DhulHijjahState, type RamadanState } from '@murshid/core';
import { router } from 'expo-router';
import { BookOpen } from 'phosphor-react-native/src/icons/BookOpen';
import { View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { readerHref, type ReaderPlace } from '@/components/quran/common';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Toggle } from '@/components/ui/toggle';
import { setFasted, setTaraweeh, useRamadanLogs } from '@/lib/ramadan-logs';
import { useColors } from '@/lib/theme';

// Today's seasonal cards (SPEC 5.1, 5.8): Ramadan, Jumu'ah and the first ten days of Dhul Hijjah.
// Each points to the day; none asks why a fast or a night prayer was not logged.

function ReadButton({ href, children }: { href: string; children: string }) {
  const color = useColors();
  return (
    <Button
      variant="secondary"
      className="self-start"
      icon={<BookOpen size={20} color={color.ink} />}
      onPress={() => router.push(href as never)}
    >
      {children}
    </Button>
  );
}

function HideButton({ onHide }: { onHide: () => void }) {
  const t = useTranslations('today.cards');
  return (
    // Pulled back by its own padding, so the label lines up with the card's text.
    <Button variant="ghost" className="-ms-6 self-start" onPress={onHide}>
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
  const logs = useRamadanLogs([ramadan.today?.date ?? null, ramadan.taraweehDate]);
  const fasted = ramadan.today ? logs?.get(isoDate(ramadan.today.date))?.fasted : undefined;
  const taraweeh = ramadan.taraweehDate
    ? (logs?.get(isoDate(ramadan.taraweehDate))?.taraweeh ?? false)
    : false;
  const day = ramadan.fast?.day ?? ramadan.today?.day ?? 1;
  const juzStart = ramadan.juz ? divisionStart('juz', ramadan.juz) : null;
  const title = t('ramadan.title', { day: format.number(day) });

  return (
    <Card className="gap-4 p-6">
      <View className="gap-1">
        <Text role="headline" accessibilityRole="header">
          {title}
        </Text>
        {ramadan.lastTenNights && (
          <Text role="callout" tone="lantern">
            {t('ramadan.lastTen')}
          </Text>
        )}
      </View>

      {ramadan.juz && juzStart && (
        <ReadButton href={readerHref(juzStart.surah, juzStart.ayah, place)}>
          {t('ramadan.read', { juz: format.number(ramadan.juz) })}
        </ReadButton>
      )}

      {ramadan.today && (
        <View className="gap-2">
          <Text role="callout" tone="muted">
            {t('ramadan.fast')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {([true, false] as const).map((value) => (
              <Button
                key={String(value)}
                variant={fasted === value ? 'primary' : 'secondary'}
                selected={fasted === value}
                onPress={() => setFasted(ramadan.today!.date, value)}
              >
                {t(value ? 'ramadan.fasted' : 'ramadan.notToday')}
              </Button>
            ))}
          </View>
        </View>
      )}

      {ramadan.taraweehDate && (
        <View className="flex-row items-center justify-between gap-4">
          <Text role="body" importantForAccessibility="no">
            {t('ramadan.taraweeh')}
          </Text>
          <Toggle
            label={t('ramadan.taraweeh')}
            checked={taraweeh}
            onChange={(prayed) => setTaraweeh(ramadan.taraweehDate!, prayed)}
          />
        </View>
      )}

      <HideButton onHide={onHide} />
    </Card>
  );
}

export function JumuahCard({ place, onHide }: { place: ReaderPlace; onHide: () => void }) {
  const t = useTranslations('today.cards');
  return (
    <Card className="gap-4 p-6">
      <Text role="headline" accessibilityRole="header">
        {t('jumuah.title')}
      </Text>
      <Text role="body" tone="muted">
        {t('jumuah.body')}
      </Text>
      <ReadButton href={readerHref(18, 1, place)}>{t('jumuah.read')}</ReadButton>
      <HideButton onHide={onHide} />
    </Card>
  );
}

export function DhulHijjahCard({ state, onHide }: { state: DhulHijjahState; onHide: () => void }) {
  const t = useTranslations('today.cards');
  const format = useFormatter();
  return (
    <Card className="gap-4 p-6">
      <Text role="headline" accessibilityRole="header">
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
