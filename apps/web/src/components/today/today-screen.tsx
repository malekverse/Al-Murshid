'use client';

import { hasMovedFar, type CivilDate, type Prayer } from '@murshid/core';
import { cityName, loadCities, type City } from '@murshid/content/cities';
import {
  answerStepOffer,
  dismissCard,
  markOpened,
  withLocation,
  type Settings,
} from '@murshid/data';
import { duration } from '@murshid/tokens';
import { motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { currentPosition, locationFromCity } from '@/lib/locate';
import { setPrayerLogged } from '@/lib/prayer-logs';
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

/**
 * When the device location is in use and the device has moved more than about 50 km (or into
 * another time zone), offer to update the prayer times (SPEC 5.1). Never asks for permission.
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
      const permission = await navigator.permissions
        ?.query({ name: 'geolocation' })
        .catch(() => null);
      if (permission?.state !== 'granted') return;
      const position = await currentPosition().catch(() => null);
      if (!position || !live) return;
      const { latitude, longitude } = position.coords;
      const city = (await loadCities()).nearest(latitude, longitude);
      const far = hasMovedFar(location, { latitude, longitude });
      if (live && (far || city.timeZone !== location.timeZone)) {
        setMoved({ city, latitude, longitude });
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

export function TodayScreen({ verse }: { verse: WelcomeVerse }) {
  const t = useTranslations('today');
  const locale = useLocale();
  const toast = useToast();
  const now = useNow();
  const state = useToday(now);
  const [earlierOpen, setEarlierOpen] = useState(false);
  const [justLogged, setJustLogged] = useState<Prayer | null>(null);
  const [moved, clearMoved] = useMoved(state?.settings);

  // Record today's visit once, for "Welcome back" (SPEC 3).
  const dayKey = state
    ? `${state.view.date.year}-${state.view.date.month}-${state.view.date.day}`
    : null;
  useEffect(() => {
    if (!dayKey) return;
    const [year, month, day] = dayKey.split('-').map(Number) as [number, number, number];
    updateSettings((s) => markOpened(s, { year, month, day }));
  }, [dayKey]);

  if (state === undefined) {
    return (
      <Main>
        <TodaySkeleton />
      </Main>
    );
  }
  if (state === null) {
    return (
      <Main>
        <NoLocation />
      </Main>
    );
  }

  const { view, settings, place } = state;
  const today: CivilDate = view.date;

  const log = (date: CivilDate, prayer: Prayer) => {
    setJustLogged(prayer);
    void setPrayerLogged(date, prayer, true);
    toast(t('hero.prayedToast'), {
      label: t('hero.undo'),
      onPress: () => void setPrayerLogged(date, prayer, false),
    });
    window.setTimeout(() => setJustLogged(null), duration.gentle * 3);
  };

  const hero = (
    <Hero
      state={state}
      now={now!}
      justLogged={justLogged}
      onLog={log}
      onEarlier={() => setEarlierOpen(true)}
    />
  );
  const sheet = (
    <EarlierSheet
      open={earlierOpen}
      onOpenChange={setEarlierOpen}
      earlier={view.earlier}
      timeZone={place.timeZone}
      onToggle={(entry, on) => void setPrayerLogged(entry.date, entry.prayer, on)}
    />
  );

  // Simple view: the prayer times and one large button (SPEC 3).
  if (settings.simpleView) {
    return (
      <Main>
        {hero}
        <PrayerList view={view} timeZone={place.timeZone} />
        {sheet}
      </Main>
    );
  }

  return (
    <Main>
      {hero}

      {moved && (
        <Card className="flex flex-col gap-4 p-6" role="status">
          <Text role="body">{t('moved.title', { city: cityName(moved.city, locale) })}</Text>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                updateSettings((s) => withLocation(s, locationFromCity(moved.city, moved)));
                clearMoved();
              }}
            >
              {t('moved.update')}
            </Button>
            <Button variant="ghost" onClick={clearMoved}>
              {t('moved.keep')}
            </Button>
          </div>
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
          onDismiss={() => updateSettings((s) => dismissCard(s, view.card!.kind, today))}
          onAnswer={(accepted) => {
            const card = view.card;
            if (card?.kind !== 'step-offer') return;
            updateSettings((s) => answerStepOffer(s, card.track, card.step, accepted, today));
          }}
        />
      )}

      <FocusLine settings={settings} />
      <PrayerList view={view} timeZone={place.timeZone} />
      <Tools />
      {sheet}
    </Main>
  );
}

function Main({ children }: { children: ReactNode }) {
  return (
    <motion.main
      id="main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: duration.gentle / 1000 }}
      className="mx-auto flex w-full max-w-reading flex-col gap-6 px-4 pt-4 pb-12 md:pt-8"
    >
      {children}
    </motion.main>
  );
}
