import { hasMovedFar, type CivilDate, type Prayer } from '@murshid/core';
import { cityName, loadCities, type City } from '@murshid/content/cities';
import {
  answerStepOffer,
  dismissCard,
  setAsideReflection,
  locationFromCity,
  markOpened,
  withLocation,
  type Settings,
} from '@murshid/data';
import { duration, space } from '@murshid/tokens';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { ReminderSheet } from '@/components/reminder-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { usePrayerName } from '@/lib/format';
import { useAppLocale } from '@/lib/locale';
import { quietPosition } from '@/lib/locate';
import { setPrayerLogged } from '@/lib/prayer-logs';
import { restoreReminders } from '@/lib/reminders';
import { updateSettings } from '@/lib/settings';
import { useNow } from '@/lib/use-now';
import { useToday } from '@/lib/use-today';
import { Hero } from './hero';
import {
  ContextCard,
  EarlierSheet,
  FocusLine,
  NoLocation,
  PrayerList,
  TodaySkeleton,
  Tools,
  type WelcomeVerse,
} from './parts';
import { readerPlace } from '@/components/quran/common';
import { haptics } from '@/lib/haptics';

/**
 * When the device location is in use and the phone has moved more than about 50 km or into
 * another time zone, offer to update the prayer times (SPEC 5.1). Never asks for permission.
 */
function useMoved(settings: Settings | null | undefined) {
  const [moved, setMoved] = useState<{ city: City; latitude: number; longitude: number } | null>(
    null,
  );
  const location = settings?.location;
  const key = location?.source === 'device' ? `${location.latitude},${location.longitude}` : null;

  useEffect(() => {
    if (!key || !location) return;
    let live = true;
    void (async () => {
      const position = await quietPosition();
      if (!position || !live) return;
      const city = (await loadCities()).nearest(position.latitude, position.longitude);
      if (live && (hasMovedFar(location, position) || city.timeZone !== location.timeZone)) {
        setMoved({ city, ...position });
      }
    })();
    return () => {
      live = false;
    };
    // The location's coordinates are the key: check once per location.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [moved, () => setMoved(null)] as const;
}

export function TodayScreen() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const prayerName = usePrayerName();
  const now = useNow();
  const state = useToday(now);
  const [earlierOpen, setEarlierOpen] = useState(false);
  const [reminderFor, setReminderFor] = useState<Prayer | null>(null);
  const [justLogged, setJustLogged] = useState<Prayer | null>(null);
  const [moved, clearMoved] = useMoved(state?.settings);

  // Az-Zumar 39:53 for "Welcome back" (SPEC 3), verbatim from packages/content. The Quran text
  // loads only when the card shows, so it never weighs on a cold start.
  const [verse, setVerse] = useState<WelcomeVerse | null>(null);
  const needVerse = state?.view.card?.kind === 'welcome-back';
  useEffect(() => {
    if (!needVerse || verse) return;
    let live = true;
    void import('@murshid/content').then(({ ayah, surah }) => {
      if (!live) return;
      const a = ayah(39, 53);
      const s = surah(39);
      setVerse({ text: a.text, ayah: a.ayah, surahName: { ar: s.nameArabic, en: s.nameSimple } });
    });
    return () => {
      live = false;
    };
  }, [needVerse, verse]);

  // Record today's visit once, for "Welcome back".
  const dayKey = state
    ? `${state.view.date.year}-${state.view.date.month}-${state.view.date.day}`
    : null;
  useEffect(() => {
    if (!dayKey) return;
    const [year, month, day] = dayKey.split('-').map(Number) as [number, number, number];
    updateSettings((s) => markOpened(s, { year, month, day }));
  }, [dayKey]);

  const scroll = (children: React.ReactNode) => (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        paddingTop: insets.top + space[4],
        paddingBottom: space[8],
        paddingHorizontal: space[4],
        gap: space[6],
      }}
    >
      {children}
    </ScrollView>
  );

  if (state === undefined) return scroll(<TodaySkeleton />);
  if (state === null) return scroll(<NoLocation />);

  const { view, settings, place } = state;
  const today: CivilDate = view.date;

  const log = (date: CivilDate, prayer: Prayer) => {
    setJustLogged(prayer);
    setPrayerLogged(date, prayer, true);
    haptics.success();
    toast(t('today.hero.prayedToast'), {
      label: t('today.hero.undo'),
      onPress: () => setPrayerLogged(date, prayer, false),
    });
    setTimeout(() => setJustLogged(null), duration.gentle * 3);
  };

  const hero = (
    <Hero
      state={state}
      now={now}
      justLogged={justLogged}
      onLog={log}
      onEarlier={() => setEarlierOpen(true)}
    />
  );
  const sheets = (
    <>
      <EarlierSheet
        open={earlierOpen}
        onClose={() => setEarlierOpen(false)}
        earlier={view.earlier}
        timeZone={place.timeZone}
        onToggle={(entry, on) => setPrayerLogged(entry.date, entry.prayer, on)}
      />
      <ReminderSheet prayer={reminderFor} onClose={() => setReminderFor(null)} />
    </>
  );

  // Simple view: the prayer times and one large button (SPEC 3).
  if (settings.simpleView) {
    return (
      <View className="flex-1">
        {scroll(
          <>
            {hero}
            <PrayerList view={view} timeZone={place.timeZone} onPressRow={setReminderFor} />
          </>,
        )}
        {sheets}
      </View>
    );
  }

  return (
    <View className="flex-1">
      {scroll(
        <>
          {hero}

          {moved && (
            <Card className="gap-4 p-6" accessibilityLiveRegion="polite">
              <Text role="body">
                {t('today.moved.title', { city: cityName(moved.city, locale) })}
              </Text>
              <View className="flex-row flex-wrap gap-3">
                <Button
                  onPress={() => {
                    updateSettings((s) => withLocation(s, locationFromCity(moved.city, moved)));
                    clearMoved();
                  }}
                >
                  {t('today.moved.update')}
                </Button>
                <Button variant="ghost" onPress={clearMoved}>
                  {t('today.moved.keep')}
                </Button>
              </View>
            </Card>
          )}

          {settings.remindersReduced && (
            <Card className="gap-3 p-6">
              <Text role="body">
                {t('settings.reminders.reduced', {
                  name: prayerName(settings.journey.prayer.focusPrayer),
                })}
              </Text>
              <Button
                variant="secondary"
                onPress={() => void restoreReminders()}
                className="self-start"
              >
                {t('settings.reminders.restore')}
              </Button>
            </Card>
          )}

          {view.card && (
            <ContextCard
              card={view.card}
              view={view}
              timeZone={place.timeZone}
              verse={verse}
              locale={locale}
              focusPrayer={settings.journey.prayer.focusPrayer}
              place={readerPlace(settings.quran)}
              onDismiss={() =>
                updateSettings((s) =>
                  view.card!.kind === 'night-reflection'
                    ? setAsideReflection(s, view.night)
                    : dismissCard(s, view.card!.kind, today),
                )
              }
              onAnswer={(accepted) => {
                const card = view.card;
                if (card?.kind !== 'step-offer') return;
                updateSettings((s) => answerStepOffer(s, card.track, card.step, accepted, today));
              }}
            />
          )}

          <FocusLine settings={settings} />
          <PrayerList view={view} timeZone={place.timeZone} onPressRow={setReminderFor} />
          <Tools />
        </>,
      )}
      {sheets}
    </View>
  );
}
