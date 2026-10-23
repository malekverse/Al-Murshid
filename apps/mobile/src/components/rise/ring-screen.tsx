import {
  addDays,
  civilDate,
  parseIsoDate,
  prayerTimes,
  sunPosition,
  type RiseChallenge,
} from '@murshid/core';
import { placeOf, prayerSettings } from '@murshid/data';
import { glassToneFor, skyAt, space } from '@murshid/tokens';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X } from 'phosphor-react-native/src/icons/X';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { SkyBackground } from '@/components/ui/sky-background';
import { Text } from '@/components/ui/text';
import { useTimeFormat } from '@/lib/format';
import {
  canSnooze,
  riseDone,
  riseNative,
  riseOff,
  riseSettings,
  riseSnooze,
  useRinging,
  type RingingAlarm,
} from '@/lib/rise';
import { useSettings } from '@/lib/settings';
import { restoreTheme } from '@/lib/theme';
import { useNow } from '@/lib/use-now';
import { HoldToStop } from './hold-to-stop';
import { Walk, Shake } from './movement';
import { Scanner } from './scan';
import { Stars } from './stars';
import { Sums } from './sums';

/** After this long without a touch, a lowered alarm comes back to full volume. */
const QUIET_MS = 20_000;

/**
 * The ring screen (SPEC 5.10): the live Fajr sky in the night theme, the time, one challenge and
 * "Turn off". Opened by the alarm (over the lock screen on Android), or from setup to try the
 * challenge without sound (`trying`).
 */
export function RingScreen({ trying = false }: { trying?: boolean }) {
  useKeepAwake();
  const t = useTranslations('rise');
  const format = useFormatter();
  const insets = useSafeAreaInsets();
  // The clock shows minutes: a tick a minute keeps the JS thread free for the challenge.
  const now = useNow(60_000);
  const settings = useSettings();
  const rise = riseSettings.useValue();
  const place = placeOf(settings);
  const timeZone = place?.timeZone ?? 'UTC';
  const time = useTimeFormat(timeZone);
  const ringing = useRinging();
  const alarm: RingingAlarm | null = trying ? null : ringing;
  const [phase, setPhase] = useState<'challenge' | 'up' | 'off'>('challenge');
  const [stillUp, setStillUp] = useState(false);
  // The setup's challenge, unless it cannot run here (no saved code, no step counter).
  const [challenge, setChallenge] = useState<RiseChallenge>(() =>
    rise.challenge === 'spot' && !rise.spotCode ? 'mind' : rise.challenge,
  );
  const [fallbackToSums, setFallbackToSums] = useState(false);
  const quiet = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always the night theme here, whatever the app's (SPEC 6.1); the person's own comes back after.
  useEffect(() => {
    Uniwind.setTheme('dark');
    return () => restoreTheme();
  }, []);

  // The ring screen is up: Android folds away the heads-up that may cover it.
  const ringingId = alarm?.id;
  useEffect(() => {
    if (ringingId) riseNative?.shown();
  }, [ringingId]);

  // While it rings there is no going back to the app behind; trying can be left.
  useEffect(() => {
    if (trying || phase !== 'challenge') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [trying, phase]);

  useEffect(
    () => () => {
      if (quiet.current) clearTimeout(quiet.current);
    },
    [],
  );

  // Working on the challenge lowers the sound; it comes back if the person stops.
  const activity = () => {
    if (!alarm) return;
    riseNative?.duck(true);
    if (quiet.current) clearTimeout(quiet.current);
    quiet.current = setTimeout(() => riseNative?.duck(false), QUIET_MS);
  };

  const done = () => {
    if (quiet.current) clearTimeout(quiet.current);
    setPhase('up');
    if (alarm) void riseDone(alarm).then((r) => setStillUp(r.stillUp));
  };

  const off = () => {
    if (quiet.current) clearTimeout(quiet.current);
    setPhase('off');
    if (alarm) void riseOff(alarm);
  };

  // The morning's Fajr and sunrise: the alarm's own, or when trying, the coming one, so the
  // screen shows the sky it will ring under.
  const ps = prayerSettings(settings);
  const base =
    alarm && alarm.morning !== 'try' ? parseIsoDate(alarm.morning) : civilDate(now, timeZone);
  const day = place ? prayerTimes(place, base, ps) : null;
  const fajr =
    !place || !day
      ? null
      : alarm || now < day.sunrise
        ? day
        : prayerTimes(place, addDays(base, 1), ps);
  const skyTime = alarm || !fajr ? now : fajr.fajr;
  const sun = place ? sunPosition(skyTime, place) : null;
  const tone = sun ? glassToneFor(skyAt(sun).bottom) : 'dark';

  const fajrLine = fajr
    ? now < fajr.fajr
      ? t('ring.fajrAt', { time: time(fajr.fajr) })
      : now < fajr.sunrise
        ? t('ring.fajrUntil', { time: time(fajr.sunrise) })
        : null
    : null;

  const leave = () => (trying ? router.back() : router.replace('/'));

  const notRinging = !trying && !alarm && phase === 'challenge';

  const body = () => {
    if (phase !== 'challenge') {
      return (
        <Animated.View entering={FadeIn} className="flex-1 items-center justify-center gap-4">
          <Text role="display" className="text-center" accessibilityRole="header">
            {phase === 'up' ? t('ring.up') : t('ring.offDone')}
          </Text>
          {!trying && fajrLine && (
            <Text role="headline" tone="muted" className="text-center">
              {fajrLine}
            </Text>
          )}
          {stillUp && (
            <Text role="callout" tone="muted" className="text-center">
              {t('ring.stillUpSoon')}
            </Text>
          )}
          <Button size="lg" onPress={leave}>
            {trying ? t('ring.close') : t('ring.openToday')}
          </Button>
        </Animated.View>
      );
    }
    if (notRinging) {
      return (
        <View className="flex-1 items-center justify-center gap-4">
          <Text role="headline" className="text-center">
            {t('ring.notRinging')}
          </Text>
          <Button onPress={leave}>{t('ring.openToday')}</Button>
        </View>
      );
    }
    const props = { onDone: done, onActivity: activity };
    if (fallbackToSums || (challenge === 'mind' && rise.mind === 'sums')) {
      return <Sums level={fallbackToSums ? 2 : rise.level} {...props} />;
    }
    if (challenge === 'mind') return <Stars {...props} />;
    if (challenge === 'steps') {
      return <Walk total={rise.steps} {...props} onFallback={() => setFallbackToSums(true)} />;
    }
    if (challenge === 'shake') return <Shake {...props} onFallback={() => setChallenge('mind')} />;
    return (
      <Scanner saved={rise.spotCode} hint={t('scan.prompt')} onCode={done} onActivity={activity} />
    );
  };

  return (
    <View className="flex-1 bg-canvas">
      <StatusBar style="light" />
      {sun && <SkyBackground sun={sun} style={StyleSheet.absoluteFill} />}
      <View
        className="flex-1 gap-4 px-4"
        style={{ paddingTop: insets.top + space[4], paddingBottom: insets.bottom + space[4] }}
      >
        <View className="flex-row items-start gap-2">
          <View className="flex-1 gap-1">
            <Text role="callout" tone="lantern">
              {trying ? t('ring.trying') : t('title')}
            </Text>
            <Text role="display" accessibilityRole="header">
              {format.dateTime(now, { hour: 'numeric', minute: '2-digit', timeZone })}
            </Text>
          </View>
          {trying && phase === 'challenge' && (
            <IconButton icon={X} label={t('ring.close')} onPress={() => router.back()} />
          )}
        </View>

        <GlassCard tone={tone} className="flex-1 p-4">
          {body()}
        </GlassCard>

        {!trying && alarm && phase === 'challenge' && (
          <View className="gap-2">
            {canSnooze(alarm) && (
              <Button variant="ghost" onPress={() => void riseSnooze(alarm).then(leave)}>
                {t('snooze.action')}
              </Button>
            )}
            <HoldToStop onStop={off} />
          </View>
        )}
      </View>
    </View>
  );
}
