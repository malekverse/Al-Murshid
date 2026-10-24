import { prayers, sunPosition, type CivilDate, type Prayer } from '@murshid/core';
import { locationLabel } from '@murshid/data';
import {
  colors,
  easing,
  glassToneFor,
  motion as tokens,
  radius,
  skyAt,
  space,
  spring,
  starlight,
} from '@murshid/tokens';
import { Check } from 'phosphor-react-native/src/icons/Check';
import { ClockCounterClockwise } from 'phosphor-react-native/src/icons/ClockCounterClockwise';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { Children, isValidElement, useEffect, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/card';
import { Countdown } from '@/components/ui/countdown';
import { SkyBackground } from '@/components/ui/sky-background';
import { Text } from '@/components/ui/text';
import { arabicPrayerName, useHijriFormat, usePrayerName, useTimeFormat } from '@/lib/format';
import { useAppLocale } from '@/lib/locale';
import type { TodayState } from '@/lib/use-today';

// Where each prayer's light sits in the band of sky above the glass card: a low arc from the
// start side (Fajr) to the end (Isha), as percentages of that band, so no light hides behind the
// card. Lights appear only for logged prayers; nothing marks the others (SPEC 3).
export const lightSpots: Record<Prayer, { x: number; y: number }> = {
  fajr: { x: 14, y: 60 },
  dhuhr: { x: 31, y: 34 },
  asr: { x: 50, y: 24 },
  maghrib: { x: 69, y: 34 },
  isha: { x: 86, y: 60 },
};
const enterLight = ZoomIn.springify().stiffness(spring.soft.stiffness).damping(spring.soft.damping);

function SkyLights({ logged, day }: { logged: ReadonlySet<Prayer>; day: boolean }) {
  return (
    // The band matches the hero's top padding (pt-24).
    <View pointerEvents="none" className="absolute inset-x-0 top-0 h-24">
      {prayers
        .filter((p) => logged.has(p))
        .map((p) => (
          <Animated.View
            key={p}
            entering={enterLight}
            style={{
              position: 'absolute',
              start: `${lightSpots[p].x}%`,
              top: `${lightSpots[p].y}%`,
              width: space[4],
              height: space[4],
              marginStart: -space[2],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* A soft halo (Android has no colored shadows), then the light itself. */}
            <View
              style={{
                position: 'absolute',
                width: space[4],
                height: space[4],
                borderRadius: space[2],
                backgroundColor: colors.dark.lantern,
                opacity: 0.35,
              }}
            />
            <View
              style={{
                width: space[2],
                height: space[2],
                borderRadius: space[1],
                // A pale light disappears in a bright day sky; it glows lantern-gold there.
                backgroundColor: day ? colors.light.lantern : starlight,
              }}
            />
          </Animated.View>
        ))}
    </View>
  );
}

/** The light that rises from "I prayed" into the sky along a gentle curve (SPEC 6.4). */
function RisingLight() {
  const reduce = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(
      withTiming(1, {
        duration: tokens.prayerLightRise,
        easing: Easing.bezier(...easing.standard),
      }),
    );
  }, [progress]);
  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: interpolate(p, [0, 0.15, 0.8, 1], [0, 1, 1, 0]),
      transform: reduce
        ? []
        : [{ translateY: -320 * p }, { translateX: Math.sin(p * Math.PI) * space[6] }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          bottom: space[16],
          alignSelf: 'center',
          width: space[3],
          height: space[3],
          borderRadius: space[2],
          backgroundColor: starlight,
          shadowColor: colors.dark.lantern,
          shadowOpacity: 1,
          shadowRadius: space[3],
        },
        style,
      ]}
    />
  );
}

/** Renders an ICU rich message (strings around a component) as one baseline-aligned line. */
function Inline({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <View className="flex-row flex-wrap items-baseline gap-1">
      {Children.toArray(children).map((child, i) =>
        isValidElement(child) ? (
          child
        ) : (
          <Text key={i} role="headline" tone="muted" style={color ? { color } : undefined}>
            {String(child).trim()}
          </Text>
        ),
      )}
    </View>
  );
}

export interface HeroProps {
  state: TodayState;
  now: Date;
  justLogged: Prayer | null;
  onLog: (date: CivilDate, prayer: Prayer) => void;
  onEarlier: () => void;
}

export function Hero({ state, now, justLogged, onLog, onEarlier }: HeroProps) {
  const t = useTranslations();
  // The app language ("ar"), not use-intl's locale, which is an Intl tag ("ar-u-nu-latn").
  const { locale } = useAppLocale();
  const format = useFormatter();
  const hijri = useHijriFormat();
  const prayerName = usePrayerName();
  const { view, place, settings } = state;
  const time = useTimeFormat(place.timeZone);

  const sun = sunPosition(now, place);
  const ramadan = view.ramadan;
  const tone = glassToneFor(skyAt(sun, { ramadan: ramadan !== null }).bottom);
  const palette = colors[tone];
  const hero = view.hero;
  const name = prayerName(hero.prayer, hero.jumuah);
  const target = hero.mode === 'now' ? hero.endsAt : hero.at;
  const seconds = Math.max(0, (target.getTime() - now.getTime()) / 1000);
  const countdown = () => <Countdown key="countdown" seconds={seconds} role="headline" />;
  // Ramadan's own countdown (SPEC 5.8): to iftar during the fast, then to suhoor's end.
  const fastEnd = ramadan?.countdown
    ? ramadan.countdown.kind === 'iftar'
      ? ramadan.countdown.at
      : ramadan.countdown.until
    : null;
  const fastLine =
    ramadan?.countdown && fastEnd
      ? t.rich(ramadan.countdown.kind === 'iftar' ? 'today.hero.iftar' : 'today.hero.suhoor', {
          countdown: () => (
            <Countdown
              key="ramadan"
              role="headline"
              seconds={Math.max(0, (fastEnd.getTime() - now.getTime()) / 1000)}
            />
          ),
        })
      : null;
  // The same moment twice (Asr until Maghrib, Isha until Fajr): Ramadan's words take the line.
  const merged = fastEnd?.getTime() === target.getTime();
  const loggedToday = new Set(
    view.rows.filter((r) => r.status === 'logged').map((r) => r.name as Prayer),
  );
  const { year, month, day } = view.date;
  const gregorian = format.dateTime(new Date(Date.UTC(year, month - 1, day, 12)), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

  return (
    <SkyBackground
      sun={sun}
      ramadan={ramadan !== null}
      style={{ borderRadius: radius.sheet, overflow: 'hidden' }}
    >
      <SkyLights logged={loggedToday} day={tone === 'light'} />
      <View className="min-h-96 justify-end p-4 pt-24">
        <GlassCard tone={tone} className="gap-6 p-6">
          <View className="gap-1">
            <Text role="callout">{t(`today.greeting.${view.greeting}`)}</Text>
            <Text role="caption" tone="muted">
              {`${gregorian} · ${hijri(view.hijri)}`}
            </Text>
            {settings.location && (
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color={palette.inkMuted} />
                <Text role="caption" tone="muted">
                  {locationLabel(settings.location, locale)}
                </Text>
              </View>
            )}
          </View>

          <View className="gap-2">
            <Text role="display" accessibilityRole="header">
              {t(hero.mode === 'now' ? 'components.prayer.now' : 'components.prayer.next', {
                name,
              })}
            </Text>
            {locale !== 'ar' && (
              <Text role="title2" script="arabic" tone="muted">
                {arabicPrayerName(hero.prayer, hero.jumuah)}
              </Text>
            )}
            <View className="flex-row flex-wrap items-baseline gap-2">
              <Inline color={merged ? palette.ink : palette.inkMuted}>
                {merged
                  ? fastLine
                  : hero.mode === 'now'
                    ? t.rich('today.hero.left', { countdown })
                    : t.rich('today.hero.in', { countdown })}
              </Inline>
              {hero.mode === 'next' && (
                <Text role="headline" tone="muted">
                  {`· ${t('today.hero.at', { time: time(hero.at) })}`}
                </Text>
              )}
            </View>
            {fastLine && !merged && <Inline color={palette.ink}>{fastLine}</Inline>}
          </View>

          {justLogged ? (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              accessibilityLiveRegion="polite"
              className="min-h-16 flex-row items-center justify-center gap-3 rounded-full bg-lantern/15"
            >
              <Check size={24} weight="bold" color={palette.lanternInk} />
              <Text role="headline" tone="lantern">
                {t('components.prayer.prayed')}
              </Text>
            </Animated.View>
          ) : hero.mode === 'now' ? (
            <Button size="lg" onPress={() => onLog(hero.date, hero.prayer)}>
              {t('components.prayer.iPrayed')}
            </Button>
          ) : null}
          {justLogged && <RisingLight key={justLogged} />}

          <Pressable
            onPress={onEarlier}
            accessibilityRole="button"
            className="min-h-touch flex-row items-center gap-2 self-center rounded-full px-4"
          >
            <ClockCounterClockwise size={18} color={palette.lanternInk} />
            <Text role="callout" tone="lantern">
              {t('today.earlier.link')}
            </Text>
          </Pressable>
        </GlassCard>
      </View>
    </SkyBackground>
  );
}
