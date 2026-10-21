import {
  civilDate,
  hijriMonthDays,
  isoDate,
  monthWeeks,
  shiftHijriMonth,
  toHijri,
  type CalendarDay,
  type CivilDate,
  type HijriEvent,
  type HijriMonth,
} from '@murshid/core';
import { placeOf } from '@murshid/data';
import { isolate } from '@murshid/i18n';
import { space } from '@murshid/tokens';
import { getCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { ArrowLeft } from 'phosphor-react-native/src/icons/ArrowLeft';
import { CaretLeft } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormatter, useTranslations } from 'use-intl';
import { Button } from './ui/button';
import { IconButton } from './ui/icon-button';
import { Text } from './ui/text';
import { useHijriMonthName } from '@/lib/format';
import { useAppLocale } from '@/lib/locale';
import { useSettings } from '@/lib/settings';
import { useNow } from '@/lib/use-now';
import { weekStart } from '@/lib/week';

const SWIPE = 48;

/** Runs of consecutive days with the same marked event, e.g. "White days 13-15". */
function groupEvents(days: readonly CalendarDay[]) {
  const groups: { event: HijriEvent; from: number; to: number }[] = [];
  for (const d of days) {
    for (const event of d.events) {
      const last = groups.findLast((g) => g.event === event);
      if (last && last.to === d.hijri.day - 1) last.to = d.hijri.day;
      else groups.push({ event, from: d.hijri.day, to: d.hijri.day });
    }
  }
  return groups;
}

function DayCell({ day, today }: { day: CalendarDay; today: boolean }) {
  const t = useTranslations('calendar');
  const format = useFormatter();
  const gregorian = new Date(Date.UTC(day.date.year, day.date.month - 1, day.date.day, 12));
  const label = [
    format.number(day.hijri.day),
    format.dateTime(gregorian, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }),
    ...day.events.map((e) => t(`events.${e}`)),
  ].join('، ');
  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityState={{ selected: today }}
      className={`aspect-square flex-1 items-center justify-center rounded-control ${
        today ? 'bg-lantern' : day.events.length > 0 ? 'bg-lantern/10' : ''
      }`}
    >
      <Text role="body" tone={today ? 'onLantern' : 'default'} script="latin">
        {format.number(day.hijri.day)}
      </Text>
      <Text role="caption" tone={today ? 'onLantern' : 'muted'} script="latin">
        {format.number(day.date.day)}
      </Text>
    </View>
  );
}

export function CalendarScreen() {
  const settings = useSettings();
  const now = useNow(60_000);
  const place = placeOf(settings);
  const today = civilDate(now, place?.timeZone ?? getCalendars()[0]?.timeZone ?? 'UTC');
  return <Calendar today={today} offset={settings.hijriOffset} />;
}

function Calendar({ today, offset }: { today: CivilDate; offset: -2 | -1 | 0 | 1 | 2 }) {
  const t = useTranslations();
  const format = useFormatter();
  const insets = useSafeAreaInsets();
  const { locale, direction } = useAppLocale();
  const monthName = useHijriMonthName();
  const todayHijri = toHijri(today, offset);
  const [month, setMonth] = useState<HijriMonth>({
    year: todayHijri.year,
    month: todayHijri.month,
  });

  const days = hijriMonthDays(month, offset);
  const weeks = monthWeeks(days, weekStart[locale] ?? 0);
  const todayKey = isoDate(today);
  const move = (delta: number) => {
    const next = shiftHijriMonth(month, delta);
    if (next) setMonth(next);
  };
  const isThisMonth = month.year === todayHijri.year && month.month === todayHijri.month;
  const title = t('calendar.monthYear', {
    month: monthName(month.month),
    year: format.number(month.year, { useGrouping: false }),
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
      // Full Arabic day names crowd seven columns on a phone; the narrow forms read well.
      weekday: locale === 'ar' ? 'narrow' : 'short',
      timeZone: 'UTC',
    });
  });
  const at = (d: CivilDate) => new Date(Date.UTC(d.year, d.month - 1, d.day, 12));
  const gregorianRange = format.dateTimeRange(at(days[0]!.date), at(days.at(-1)!.date), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const groups = groupEvents(days.filter((d) => d.events.length > 0));

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        paddingTop: insets.top + space[4],
        paddingBottom: insets.bottom + space[8],
        paddingHorizontal: space[4],
        gap: space[6],
      }}
    >
      <View className="flex-row items-center gap-2">
        <IconButton
          icon={ArrowLeft}
          label={t('common.actions.back')}
          mirror
          onPress={() => router.back()}
        />
        <Text role="title2" accessibilityRole="header">
          {t('calendar.title')}
        </Text>
      </View>

      <View className="flex-row items-center justify-between gap-4">
        <IconButton
          icon={CaretLeft}
          mirror
          label={t('calendar.previous')}
          onPress={() => move(-1)}
        />
        <View className="flex-1 items-center">
          <Text role="title2" accessibilityLiveRegion="polite" className="text-center">
            {title}
          </Text>
          <Text role="caption" tone="muted" className="text-center">
            {gregorianRange}
          </Text>
        </View>
        <IconButton icon={CaretRight} mirror label={t('calendar.next')} onPress={() => move(1)} />
      </View>

      <GestureDetector gesture={swipe}>
        <View
          accessibilityLabel={title}
          className="gap-1 rounded-card border border-card-edge bg-surface p-2 shadow-card dark:shadow-none"
        >
          <View className="flex-row" importantForAccessibility="no-hide-descendants">
            {weekdayNames.map((name) => (
              <Text key={name} role="caption" tone="muted" className="flex-1 py-2 text-center">
                {name}
              </Text>
            ))}
          </View>
          {weeks.map((week, w) => (
            <View key={w} className="flex-row gap-1">
              {week.map((day, i) =>
                day ? (
                  <DayCell key={i} day={day} today={isoDate(day.date) === todayKey} />
                ) : (
                  <View key={i} className="aspect-square flex-1" />
                ),
              )}
            </View>
          ))}
        </View>
      </GestureDetector>

      {!isThisMonth && (
        <Button
          variant="secondary"
          className="self-center"
          onPress={() => setMonth({ year: todayHijri.year, month: todayHijri.month })}
        >
          {t('calendar.today')}
        </Button>
      )}

      {groups.length > 0 && (
        <View className="gap-2">
          <Text role="headline" accessibilityRole="header" className="px-2">
            {t('calendar.legend')}
          </Text>
          <View className="gap-2 rounded-card border border-card-edge bg-surface p-4">
            {groups.map((g) => (
              <View key={`${g.event}-${g.from}`} className="flex-row items-center gap-3">
                <View className="size-2 rounded-full bg-lantern" />
                <Text role="body" className="flex-1">
                  {t(`calendar.events.${g.event}`)}
                </Text>
                <Text role="callout" tone="muted" script="latin">
                  {g.from === g.to
                    ? format.number(g.from)
                    : isolate(`${format.number(g.from)}–${format.number(g.to)}`, 'ltr')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="gap-2 px-2">
        <Text role="callout" tone="muted">
          {t('calendar.note')}
        </Text>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push('/you')}
          className="min-h-touch justify-center self-start"
        >
          <Text role="callout" tone="lantern">
            {t('calendar.adjust')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
