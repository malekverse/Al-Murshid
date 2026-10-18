import {
  distanceToMakkah,
  isAligned,
  qiblaBearing,
  qiblaOffset,
  smoothHeading,
} from '@murshid/core';
import { locationLabel, placeOf } from '@murshid/data';
import { fonts, space, spring } from '@murshid/tokens';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { IconButton } from './ui/icon-button';
import { Text } from './ui/text';
import { useAppLocale } from '@/lib/locale';
import { useSettings } from '@/lib/settings';
import { useColors } from '@/lib/theme';

// The Qibla (SPEC 5.3): a full-screen compass toward the Kaaba using true north. The heading
// passes a low-pass filter and a spring so the dial never jitters; the screen warms as the
// phone turns toward the Qibla, and within 3° the ring fills with light and one tick is felt.

/** The angle (degrees) at which the screen starts to warm. */
const WARM_FROM = 45;

interface Heading {
  degrees: number;
  /** iOS: degrees of uncertainty. Android: 0 (unreliable) to 3 (high). */
  lowAccuracy: boolean;
}

function useHeading(enabled: boolean): Heading | null | 'unavailable' {
  const [heading, setHeading] = useState<Heading | null | 'unavailable'>(null);
  const smoothed = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | null = null;
    let live = true;
    Location.watchHeadingAsync((h) => {
      const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      smoothed.current = smoothed.current === null ? raw : smoothHeading(smoothed.current, raw);
      // Android reports accuracy 0 (unreliable) to 3 (high); iOS reports degrees of error.
      const lowAccuracy =
        Platform.OS === 'android' ? h.accuracy <= 1 : h.accuracy < 0 || h.accuracy > 25;
      setHeading({ degrees: smoothed.current, lowAccuracy });
    }).then(
      (s) => {
        if (live) sub = s;
        else s.remove();
      },
      () => setHeading('unavailable'),
    );
    return () => {
      live = false;
      sub?.remove();
    };
  }, [enabled]);

  return heading;
}

function Dial({
  bearing,
  heading,
  aligned,
}: {
  bearing: number;
  heading: number | null;
  aligned: boolean;
}) {
  const t = useTranslations('qibla');
  const color = useColors();
  const reduce = useReducedMotion();
  // A continuous angle, so turning past north never spins the dial the long way round.
  const angle = useSharedValue(0);
  const last = useRef(0);
  useEffect(() => {
    if (heading === null) return;
    const target = last.current + qiblaOffset(last.current, -heading);
    last.current = target;
    angle.set(reduce ? target : withSpring(target, spring.soft));
  }, [heading, angle, reduce]);
  const rotate = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }));
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

  return (
    // A compass is never mirrored (SPEC 7).
    <View style={{ direction: 'ltr' }} className="aspect-square w-full self-center">
      <Animated.View style={[{ flex: 1 }, rotate]}>
        <Svg viewBox="-110 -110 220 220" width="100%" height="100%">
          <Circle
            r={100}
            fill={aligned ? color.lantern : color.surface}
            fillOpacity={aligned ? 0.15 : 1}
            stroke={aligned ? color.lantern : color.hairline}
            strokeWidth={aligned ? 3 : 1}
          />
          {ticks.map((deg) => (
            <Line
              key={deg}
              x1={0}
              y1={-96}
              x2={0}
              y2={deg % 90 === 0 ? -84 : deg % 30 === 0 ? -88 : -92}
              transform={`rotate(${deg})`}
              stroke={color.inkMuted}
              strokeWidth={deg % 90 === 0 ? 2 : 1}
            />
          ))}
          {/* Sizes here are in dial units (the viewBox), so the dial scales as one drawing. */}
          <SvgText
            y={-66}
            textAnchor="middle"
            fontSize={14}
            fontFamily={fonts.native.ui[500]}
            fill={color.ink}
          >
            {t('north')}
          </SvgText>
          <G transform={`rotate(${bearing})`}>
            <Line
              x1={0}
              y1={0}
              x2={0}
              y2={-78}
              stroke={color.lantern}
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* The Kaaba: a small dark cube with a gold band. */}
            <G transform="translate(0 -84)">
              <Rect x={-7} y={-7} width={14} height={14} rx={2} fill={color.ink} />
              <Rect x={-7} y={-3} width={14} height={2.5} fill={color.lantern} />
            </G>
          </G>
          <Circle r={4} fill={color.lantern} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function QiblaScreen() {
  const t = useTranslations();
  const format = useFormatter();
  const insets = useSafeAreaInsets();
  const { locale } = useAppLocale();
  const color = useColors();
  const settings = useSettings();
  const place = placeOf(settings);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    void Location.requestForegroundPermissionsAsync().then((p) => setAllowed(p.granted));
  }, []);
  const heading = useHeading(allowed === true);
  const degreesNow = heading && heading !== 'unavailable' ? heading.degrees : null;

  const bearing = place ? qiblaBearing(place) : 0;
  const aligned = degreesNow !== null && isAligned(degreesNow, bearing);
  const offset = degreesNow === null ? null : qiblaOffset(degreesNow, bearing);

  // One medium haptic when the phone comes into alignment (SPEC 6.5).
  const wasAligned = useRef(false);
  useEffect(() => {
    if (aligned && !wasAligned.current)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    wasAligned.current = aligned;
  }, [aligned]);

  // The screen warms as the phone turns toward the Qibla.
  const warmth = useSharedValue(0);
  useEffect(() => {
    const w = offset === null ? 0 : Math.max(0, 1 - Math.abs(offset) / WARM_FROM);
    warmth.set(withTiming(w));
  }, [offset, warmth]);
  const warm = useAnimatedStyle(() => ({ opacity: warmth.get() * 0.18 }));

  const header = (
    <View className="flex-row items-center gap-2">
      <IconButton
        icon={ArrowLeft}
        label={t('common.actions.back')}
        mirror
        onPress={() => router.back()}
      />
      <Text role="title2" accessibilityRole="header">
        {t('qibla.title')}
      </Text>
    </View>
  );

  if (!place || !settings.location) {
    return (
      <View className="flex-1 gap-6 bg-canvas px-4" style={{ paddingTop: insets.top + space[4] }}>
        {header}
        <Card className="items-start gap-4 p-6">
          <Text role="body">{t('qibla.needsLocation')}</Text>
          <Button onPress={() => router.push('/you')}>{t('today.noLocation.action')}</Button>
        </Card>
      </View>
    );
  }

  const degrees = format.number(Math.round(bearing), {
    style: 'unit',
    unit: 'degree',
    unitDisplay: 'narrow',
  });
  const distance = format.number(Math.round(distanceToMakkah(place)), {
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'short',
  });
  const noCompass = allowed === false || heading === 'unavailable';

  return (
    <View className="flex-1 bg-canvas">
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', inset: 0, backgroundColor: color.lantern }, warm]}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + space[4],
          paddingBottom: insets.bottom + space[8],
          paddingHorizontal: space[4],
          gap: space[6],
        }}
      >
        {header}
        <Text role="callout" tone="muted" className="text-center">
          {t('qibla.from', { city: locationLabel(settings.location, locale) })}
        </Text>
        <Dial bearing={bearing} heading={degreesNow} aligned={aligned} />
        <View className="items-center gap-2" accessibilityLiveRegion="polite">
          {noCompass || degreesNow === null ? (
            <Text role="headline" className="text-center">
              {noCompass ? t('qibla.noCompass', { degrees }) : t('qibla.desktop', { degrees })}
            </Text>
          ) : aligned ? (
            <Text role="headline" tone="lantern">
              {t('qibla.aligned')}
            </Text>
          ) : (
            <Text role="headline">{offset! > 0 ? t('qibla.turnRight') : t('qibla.turnLeft')}</Text>
          )}
          <Text role="body" tone="muted" className="text-center">
            {noCompass || degreesNow === null
              ? t('qibla.distance', { distance })
              : `${t('qibla.bearing', { degrees })} · ${t('qibla.distance', { distance })}`}
          </Text>
          {heading && heading !== 'unavailable' && heading.lowAccuracy && (
            <Text role="callout" tone="muted" className="text-center">
              {t('qibla.calibrate')}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
