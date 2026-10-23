import { messages } from '@murshid/i18n';
import type { PrayerName } from '@murshid/tokens';
import { Alarm } from 'phosphor-react-native/src/icons/Alarm';
import { Pressable, View } from 'react-native';
import { useFormatter, useTranslations } from 'use-intl';
import { useAppLocale } from '@/lib/locale';
import { useColors } from '@/lib/theme';
import { PrayerGlyph } from './prayer-glyph';
import { Text } from './text';

export type PrayerRowState = 'upcoming' | 'current' | 'logged';

export interface PrayerRowProps {
  prayer: PrayerName;
  time: Date;
  state?: PrayerRowState;
  jumuah?: boolean;
  /** The city's time zone; defaults to the device's. */
  timeZone?: string;
  /**
   * Fajr Rise's next ring (SPEC 5.10): a small alarm mark, with its time when it is not Fajr's own
   * (tomorrow's Fajr can differ from today's by a minute, which would read as a mistake).
   */
  alarm?: { time: string; showTime: boolean };
  onPress?: () => void;
}

/**
 * One line of today's prayer times. Logged prayers show a filled light, others a neutral
 * outline. Never red, never "missed" (SPEC 2, 5.1).
 */
export function PrayerRow({
  prayer,
  time,
  state = 'upcoming',
  jumuah = false,
  timeZone,
  alarm,
  onPress,
}: PrayerRowProps) {
  const t = useTranslations();
  const format = useFormatter();
  const color = useColors();
  const { locale } = useAppLocale();

  const key = jumuah && prayer === 'dhuhr' ? 'jumuah' : prayer;
  const name = t(`glossary.prayer.${key}`);
  const arabicName = messages.ar.glossary.prayer[key];
  const timeText = format.dateTime(time, { hour: 'numeric', minute: '2-digit', timeZone });
  const marker = prayer === 'sunrise';
  const current = state === 'current' && !marker;
  const label = [
    t('components.prayer.row', { name, time: timeText, state: marker ? 'other' : state }),
    alarm ? t('rise.row', { time: alarm.time }) : null,
  ]
    .filter(Boolean)
    .join(', ');

  const body = (
    <>
      <PrayerGlyph prayer={prayer} color={current ? color.lanternInk : color.inkMuted} />
      <View className="flex-1 flex-row items-baseline gap-2">
        <Text
          role={marker ? 'callout' : 'body'}
          tone={marker ? 'muted' : current ? 'lantern' : 'default'}
        >
          {name}
        </Text>
        {/* The Arabic name is always present (SPEC 5.1). */}
        {locale !== 'ar' && (
          <Text role="caption" tone="muted" script="arabic">
            {arabicName}
          </Text>
        )}
      </View>
      {alarm && (
        <View className="flex-row items-center gap-1">
          <Alarm size={14} color={color.lanternInk} />
          {alarm.showTime && (
            <Text role="caption" tone="lantern">
              {alarm.time}
            </Text>
          )}
        </View>
      )}
      <Text role={marker ? 'callout' : 'body'} tone={marker ? 'muted' : 'default'}>
        {timeText}
      </Text>
      {!marker && (
        <View
          className={`size-3 rounded-full ${
            state === 'logged'
              ? 'bg-lantern'
              : state === 'current'
                ? 'border-2 border-lantern'
                : 'border-2 border-ink-muted/70'
          }`}
          style={
            state === 'logged'
              ? { shadowColor: color.lantern, shadowOpacity: 0.9, shadowRadius: 6, elevation: 4 }
              : undefined
          }
        />
      )}
    </>
  );

  const rowClass = `flex-row items-center gap-4 rounded-control px-4 ${marker ? 'min-h-12' : 'min-h-16'} ${current ? 'bg-lantern/10' : ''}`;
  if (!onPress || marker) {
    return (
      <View accessible accessibilityLabel={label} className={rowClass}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={rowClass}
      style={({ pressed }) => (pressed ? { backgroundColor: color.hairline } : undefined)}
    >
      {body}
    </Pressable>
  );
}
