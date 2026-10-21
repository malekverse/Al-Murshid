import {
  monthWeeks,
  shiftHijriMonth,
  skyMonth,
  skyMonthRange,
  toHijri,
  type CivilDate,
  type HijriMonth,
  type HijriOffset,
  type SkyDay,
} from '@murshid/core';
import { liveLogs, type Settings } from '@murshid/data';
import { colors, sky, space, starlight } from '@murshid/tokens';
import { CaretLeft } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useFormatter, useTranslations } from 'use-intl';
import { lightSpots } from '../today/hero';
import { IconButton } from '../ui/icon-button';
import { PressableScale } from '../ui/pressable-scale';
import { Sheet } from '../ui/sheet';
import { Text } from '../ui/text';
import { Toggle } from '../ui/toggle';
import { useHijriFormat, useHijriMonthName, usePrayerName } from '@/lib/format';
import { useAppLocale } from '@/lib/locale';
import { useLogsBetween } from '@/lib/prayer-logs';
import { updateSettings } from '@/lib/settings';
import { weekStart } from '@/lib/week';

// Your Sky (SPEC 3, 5.7): a Hijri month of small night skies. A day's sky glows with the prayers
// logged on it; any other day is plain night, never marked. Numbers only with "Show details".

const SWIPE = 48;
const night = `linear-gradient(to bottom, ${sky.night.top}, ${sky.night.bottom})`;
// The tiles are night skies in both themes, so their glow is the night lantern.
const glowImage = `radial-gradient(circle at 50% 70%, ${colors.dark.lantern}, transparent 70%)`;

/** How brightly a day glows, from one light to all five. */
const glow = (count: number) => 0.3 + 0.14 * (count - 1);

const noon = (d: CivilDate) => new Date(Date.UTC(d.year, d.month - 1, d.day, 12));

export function YourSky({ settings, today }: { settings: Settings; today: CivilDate }) {
  const t = useTranslations('sky');
  const format = useFormatter();
  const { locale, direction } = useAppLocale();
  const monthName = useHijriMonthName();
  const offset = settings.hijriOffset as HijriOffset;
  const todayHijri = toHijri(today, offset);
  const current: HijriMonth = { year: todayHijri.year, month: todayHijri.month };
  const [month, setMonth] = useState<HijriMonth>(current);
  const [openDay, setOpenDay] = useState<SkyDay | null>(null);

  const [from, to] = skyMonthRange(month, offset);
  const logs = useLogsBetween(from, to);
  const days = skyMonth(month, offset, logs ? liveLogs(logs) : [], today);
  const weeks = monthWeeks(days, weekStart[locale] ?? 0);
  const details = settings.showSkyDetails;
  const isCurrent = month.year === current.year && month.month === current.month;
  const move = (delta: number) => {
    const next = shiftHijriMonth(month, delta);
    // No sky for months still to come.
    if (next && !(delta > 0 && isCurrent)) setMonth(next);
  };
  const monthTitle = `${monthName(month.month)} ${format.number(month.year, { useGrouping: false })}`;
  const dateLabel = (d: SkyDay) =>
    format.dateTime(noon(d.date), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });

  // Swipe toward the reading direction's end for the next month.
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (Math.abs(e.translationX) < SWIPE) return;
      move(e.translationX < 0 !== (direction === 'rtl') ? 1 : -1);
    });

  const weekdayNames = Array.from({ length: 7 }, (_, i) => {
    const wd = ((weekStart[locale] ?? 0) + i) % 7;
    // 2026-10-18 was a Sunday; count from there.
    return format.dateTime(new Date(Date.UTC(2026, 9, 18 + wd, 12)), {
      weekday: 'narrow',
      timeZone: 'UTC',
    });
  });

  return (
    <View className="gap-3">
      <View className="gap-1 px-2">
        <Text role="headline" accessibilityRole="header">
          {t('title')}
        </Text>
        <Text role="callout" tone="muted">
          {t('intro')}
        </Text>
      </View>

      <View className="gap-3 rounded-card border border-card-edge bg-surface p-3 shadow-card dark:shadow-none">
        <View className="flex-row items-center justify-between gap-2">
          <IconButton icon={CaretLeft} mirror label={t('previous')} onPress={() => move(-1)} />
          <Text role="headline" accessibilityLiveRegion="polite" className="text-center">
            {monthTitle}
          </Text>
          <IconButton
            icon={CaretRight}
            mirror
            label={t('next')}
            disabled={isCurrent}
            onPress={() => move(1)}
          />
        </View>

        <GestureDetector gesture={swipe}>
          <View accessibilityLabel={`${t('title')}, ${monthTitle}`} style={{ gap: space[1] }}>
            <View className="flex-row" importantForAccessibility="no-hide-descendants">
              {weekdayNames.map((name, i) => (
                <Text key={i} role="caption" tone="muted" className="flex-1 py-1 text-center">
                  {name}
                </Text>
              ))}
            </View>
            {weeks.map((week, w) => (
              <View key={w} className="flex-row" style={{ gap: space[1] }}>
                {week.map((day, i) =>
                  day ? (
                    <Tile
                      key={i}
                      day={day}
                      details={details}
                      label={
                        day.prayers.length > 0
                          ? t('day', {
                              date: dateLabel(day),
                              lights: t('lights', { count: day.prayers.length }),
                            })
                          : dateLabel(day)
                      }
                      dayNumber={format.number(day.hijri.day)}
                      count={format.number(day.prayers.length)}
                      onOpen={() => setOpenDay(day)}
                    />
                  ) : (
                    <View key={i} className="aspect-square flex-1" />
                  ),
                )}
              </View>
            ))}
          </View>
        </GestureDetector>

        <View className="flex-row items-center justify-between gap-4 px-1">
          <Text role="callout" importantForAccessibility="no">
            {t('showDetails')}
          </Text>
          <Toggle
            label={t('showDetails')}
            checked={details}
            onChange={(showSkyDetails) => updateSettings((s) => ({ ...s, showSkyDetails }))}
          />
        </View>
      </View>

      <DaySheet
        day={openDay}
        title={openDay ? dateLabel(openDay) : ''}
        onClose={() => setOpenDay(null)}
      />
    </View>
  );
}

function Tile({
  day,
  details,
  label,
  dayNumber,
  count,
  onOpen,
}: {
  day: SkyDay;
  details: boolean;
  label: string;
  dayNumber: string;
  count: string;
  onOpen: () => void;
}) {
  const lit = day.prayers.length;
  if (day.future) {
    // Days still to come have no sky yet: just their number.
    return (
      <View
        accessible
        accessibilityLabel={label}
        className="aspect-square flex-1 items-center justify-center"
      >
        <Text role="caption" tone="muted" script="latin">
          {dayNumber}
        </Text>
      </View>
    );
  }
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onOpen}
      className={`aspect-square flex-1 items-center justify-center overflow-hidden rounded-control ${
        day.isToday ? 'border-2 border-lantern' : ''
      }`}
      style={{ experimental_backgroundImage: night }}
    >
      {lit > 0 && (
        <View
          pointerEvents="none"
          className="absolute inset-0"
          style={{ experimental_backgroundImage: glowImage, opacity: glow(lit) }}
        />
      )}
      <Text role="caption" tone="inherit" script="latin" className="text-starlight">
        {dayNumber}
      </Text>
      {details && lit > 0 && (
        <Text role="caption" tone="inherit" script="latin" className="text-starlight/80">
          {count}
        </Text>
      )}
    </PressableScale>
  );
}

/** A day's own sky: its lights where Today's hero places them, and the prayers they are for. */
function DaySheet({
  day,
  title,
  onClose,
}: {
  day: SkyDay | null;
  title: string;
  onClose: () => void;
}) {
  const hijri = useHijriFormat();
  const prayerName = usePrayerName();
  const { locale } = useAppLocale();
  return (
    <Sheet
      open={day !== null}
      onClose={onClose}
      title={title}
      description={day ? hijri(day.hijri) : undefined}
    >
      {day && (
        <View className="gap-4 pb-2">
          <View
            importantForAccessibility="no-hide-descendants"
            className="h-32 overflow-hidden rounded-card"
            style={{ experimental_backgroundImage: night }}
          >
            {day.prayers.map((p) => (
              <View
                key={p}
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
                    backgroundColor: starlight,
                  }}
                />
              </View>
            ))}
          </View>
          {day.prayers.length > 0 && (
            <Text role="body" className="text-center">
              {/* Hermes has no Intl.ListFormat: joined as the app joins short lists elsewhere. */}
              {day.prayers.map((p) => prayerName(p)).join(locale === 'ar' ? '، ' : ', ')}
            </Text>
          )}
        </View>
      )}
    </Sheet>
  );
}
