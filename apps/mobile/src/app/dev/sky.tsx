import { colors, duration, glassToneFor, skyAt, space, type SunPosition } from '@murshid/tokens';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslations } from 'use-intl';
import { GlassCard } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { SkyBackground } from '@/components/ui/sky-background';
import { Text } from '@/components/ui/text';

const TARGET_FPS = 60;
const STEP = 3; // degrees of sun altitude per ambient beat

/**
 * Phase 2 performance gate (SPEC 12): the living sky alone, gliding through a whole day the way
 * Today drives it (a new altitude each beat, the glide on the UI thread), with a frame counter
 * measured on the UI thread. Run it on a mid-range Android phone in a release build.
 */
export default function SkyTestScreen() {
  const t = useTranslations('gallery');
  const insets = useSafeAreaInsets();
  const [sun, setSun] = useState<SunPosition>({ altitude: -24, noonAltitude: 60, rising: true });
  const [fps, setFps] = useState(0);

  // Advance the sun: up through the morning, down through the evening, then start again.
  useEffect(() => {
    const id = setInterval(() => {
      setSun((s) => {
        if (s.rising)
          return s.altitude >= 60 ? { ...s, rising: false } : { ...s, altitude: s.altitude + STEP };
        return s.altitude <= -24 ? { ...s, rising: true } : { ...s, altitude: s.altitude - STEP };
      });
    }, duration.ambient);
    return () => clearInterval(id);
  }, []);

  // Count frames on the UI thread and report once per second.
  const frames = useSharedValue(0);
  const since = useSharedValue(0);
  useFrameCallback((info) => {
    'worklet';
    if (since.get() === 0) since.set(info.timestamp);
    frames.set(frames.get() + 1);
    const elapsed = info.timestamp - since.get();
    if (elapsed >= 1000) {
      scheduleOnRN(setFps, Math.round((frames.get() * 1000) / elapsed));
      frames.set(0);
      since.set(info.timestamp);
    }
  });

  const tone = glassToneFor(skyAt(sun).bottom);
  const ink = colors[tone].ink;

  return (
    <SkyBackground sun={sun} style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top + space[4],
          paddingBottom: insets.bottom + space[6],
        }}
        className="justify-between px-4"
      >
        <View className="flex-row">
          <IconButton
            icon={ArrowLeft}
            label={t('title')}
            mirror
            variant="tinted"
            onPress={() => router.back()}
          />
        </View>
        <GlassCard tone={tone} className="gap-2 p-6">
          <Text role="title2" tone="inherit" style={{ color: ink }}>
            {t('samples.fps', { value: fps })}
          </Text>
          <Text role="callout" tone="inherit" style={{ color: colors[tone].inkMuted }}>
            {t('samples.skyTestHint', { target: TARGET_FPS })}
          </Text>
        </GlassCard>
      </View>
    </SkyBackground>
  );
}
