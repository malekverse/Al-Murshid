import { spring } from '@murshid/tokens';
import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useLocale, useTranslations } from 'use-intl';
import { Text, type TextProps } from './text';

const isDigit = (ch: string) => /\p{Nd}/u.test(ch);

const enter = FadeInDown.springify()
  .stiffness(spring.snappy.stiffness)
  .damping(spring.snappy.damping);
const exit = FadeOutUp.springify()
  .stiffness(spring.snappy.stiffness)
  .damping(spring.snappy.damping);

/**
 * Digits roll one by one when they change (SPEC 6.4). Numbers keep left-to-right order in
 * every language. Reanimated skips the roll when Reduce Motion is on.
 */
export function RollingNumber({
  value,
  role = 'body',
  tone,
}: {
  value: string;
  role?: TextProps['role'];
  tone?: TextProps['tone'];
}) {
  const chars = [...value];
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', direction: 'ltr' }}
      className="overflow-hidden"
    >
      {chars.map((ch, i) => {
        const place = chars.length - i;
        if (!isDigit(ch)) {
          return (
            <Text key={`s${place}`} role={role} tone={tone} script="latin">
              {ch}
            </Text>
          );
        }
        return (
          <View key={`d${place}`}>
            <Animated.View key={ch} entering={enter} exiting={exit}>
              <Text role={role} tone={tone} script="latin">
                {ch}
              </Text>
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Time left until a moment: hours and minutes, minutes, then seconds in the final minute only
 * (SPEC 5.1). Units come from Intl where the engine supports them.
 */
export function Countdown({
  seconds,
  role = 'display',
}: {
  seconds: number;
  role?: TextProps['role'];
}) {
  const locale = useLocale();
  const t = useTranslations();

  const parts = useMemo(() => {
    const total = Math.max(0, Math.floor(seconds));
    const plain = new Intl.NumberFormat(locale);
    if (total >= 3600) {
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const two = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2 });
      return {
        number: `${plain.format(h)}:${two.format(m)}`,
        unit: null as string | null,
        spoken: t('common.time.hoursMinutes', {
          hours: t('common.time.hours', { count: h }),
          minutes: t('common.time.minutes', { count: m }),
        }),
      };
    }
    const inMinutes = total >= 60;
    const amount = inMinutes ? Math.ceil(total / 60) : total;
    let unit: string | null = null;
    try {
      unit = new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: inMinutes ? 'minute' : 'second',
        unitDisplay: 'short',
      })
        .formatToParts(amount)
        .filter((p) => p.type === 'unit')
        .map((p) => p.value)
        .join('');
    } catch {
      unit = null; // Engine without unit formatting: the number alone, the label stays spoken.
    }
    return {
      number: plain.format(amount),
      unit,
      spoken: inMinutes
        ? t('common.time.minutes', { count: amount })
        : t('components.countdown.seconds', { count: amount }),
    };
  }, [locale, seconds, t]);

  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={t('components.countdown.remaining', { duration: parts.spoken })}
      className="flex-row items-baseline gap-1"
    >
      <RollingNumber value={parts.number} role={role} />
      {parts.unit && (
        <Text role="headline" tone="muted">
          {parts.unit}
        </Text>
      )}
    </View>
  );
}
